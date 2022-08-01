import { ChatroomCharacter, getChatroomCharacter, getPlayerCharacter } from "../characters";
import { moduleInitPhase } from "../moduleManager";
import { BaseModule } from "./_BaseModule";
import { hookFunction } from "../patching";
import { isObject, uuidv4 } from "../utils";
import { firstTimeInit } from "./storage";
import { ModuleInitPhase } from "../constants";
import { BCX_setTimeout } from "../BCXContext";
import cloneDeep from "lodash-es/cloneDeep";

export const hiddenMessageHandlers: Map<keyof BCX_messages, (sender: number, message: any) => void> = new Map();
export const hiddenBeepHandlers: Map<keyof BCX_beeps, (sender: number, message: any) => void> = new Map();

export const queryHandlers: {
	[K in keyof BCX_queries]?: (sender: ChatroomCharacter, data: BCX_queries[K][0]) => BCX_queries[K][1] | undefined;
} = {};

export const changeHandlers: ((source: number) => void)[] = [];

export function sendHiddenMessage<T extends keyof BCX_messages>(type: T, message: BCX_messages[T], Target: number | null = null) {
	if (!ServerPlayerIsInChatRoom() || firstTimeInit)
		return;
	ServerSend("ChatRoomChat", {
		Content: "BCXMsg",
		Type: "Hidden",
		Target,
		Dictionary: { type, message }
	});
}

export function sendHiddenBeep<T extends keyof BCX_beeps>(type: T, message: BCX_beeps[T], target: number, asLeashBeep: boolean = false) {
	ServerSend("AccountBeep", {
		MemberNumber: target,
		BeepType: asLeashBeep ? "Leash" : "BCX",
		Message: {
			BCX: { type, message }
		}
	});
}

interface IPendingQuery {
	target: number;
	resolve: (data: any) => void;
	reject: (data: any) => void;
	timeout: number;
}

const pendingQueries: Map<string, IPendingQuery> = new Map();

export function sendQuery<T extends keyof BCX_queries>(type: T, data: BCX_queries[T][0], target: number, timeout: number = 10_000): Promise<BCX_queries[T][1]> {
	if (firstTimeInit) {
		return Promise.reject("Unavailable during init");
	}

	return new Promise((resolve, reject) => {
		const id = uuidv4();
		const info: IPendingQuery = {
			target,
			resolve,
			reject,
			timeout: BCX_setTimeout(() => {
				console.warn("BCX: Query timed out", target, type);
				pendingQueries.delete(id);
				reject("Timed out");
			}, timeout)
		};
		pendingQueries.set(id, info);

		const playerCharacter = getPlayerCharacter();

		if (target === playerCharacter.MemberNumber) {
			handleQuery(playerCharacter, cloneDeep({
				id,
				query: type,
				data
			}))
				.then(result => {
					handleQueryAnswer(playerCharacter.MemberNumber, result);
				}, error => {
					handleQueryAnswer(playerCharacter.MemberNumber, {
						id,
						ok: false,
						data: error
					});
				});
		} else {
			sendHiddenMessage("query", {
				id,
				query: type,
				data
			}, target);
		}

	});
}

async function handleQuery(sender: ChatroomCharacter, message: BCX_message_query): Promise<BCX_message_queryAnswer> {
	const handler = queryHandlers[message.query] as (sender: ChatroomCharacter, data: any) => any;
	if (!handler) {
		console.warn("BCX: Query no handler", sender, message);
		return {
			id: message.id,
			ok: false
		};
	}

	const result = await handler(sender, message.data);
	return {
		id: message.id,
		ok: result !== undefined,
		data: result
	};
}

hiddenMessageHandlers.set("query", (sender, message: BCX_message_query) => {
	if (!isObject(message) ||
		typeof message.id !== "string" ||
		typeof message.query !== "string"
	) {
		console.warn(`BCX: Invalid query`, sender, message);
		return;
	}

	const character = getChatroomCharacter(sender);
	if (!character || !character.hasAccessToPlayer()) {
		return sendHiddenMessage("queryAnswer", {
			id: message.id,
			ok: false
		}, sender);
	}

	handleQuery(character, message)
		.then((result) => {
			sendHiddenMessage("queryAnswer", result, sender);
		}, error => {
			sendHiddenMessage("queryAnswer", {
				id: message.id,
				ok: false,
				data: String(error)
			}, sender);
		});
});

function handleQueryAnswer(sender: number, message: BCX_message_queryAnswer): void {
	const info = pendingQueries.get(message.id);
	if (!info) {
		console.warn(`BCX: Response to unknown query`, sender, message);
		return;
	}

	if (info.target !== info.target) {
		console.warn(`BCX: Response to query not from target`, sender, message, info);
		return;
	}

	clearTimeout(info.timeout);
	pendingQueries.delete(message.id);

	if (message.ok) {
		info.resolve(message.data);
	} else {
		info.reject(message.data);
	}
}

hiddenMessageHandlers.set("queryAnswer", (sender, message: BCX_message_queryAnswer) => {
	if (!isObject(message) ||
		typeof message.id !== "string" ||
		typeof message.ok !== "boolean"
	) {
		console.warn(`BCX: Invalid queryAnswer`, sender, message);
		return;
	}

	handleQueryAnswer(sender, message);
});

hiddenMessageHandlers.set("somethingChanged", (sender) => {
	changeHandlers.forEach(h => h(sender));
});

let changeTimer: number | null = null;

export function notifyOfChange(): void {
	if (moduleInitPhase !== ModuleInitPhase.ready)
		return;
	const player = getPlayerCharacter().MemberNumber;
	changeHandlers.forEach(h => h(player));
	if (changeTimer === null) {
		changeTimer = BCX_setTimeout(() => {
			changeTimer = null;
			sendHiddenMessage("somethingChanged", undefined);
		}, 100);
	}
}

export class ModuleMessaging extends BaseModule {
	load() {
		hookFunction("ChatRoomMessage", 10, (args, next) => {
			const data = args[0];

			if (data?.Type === "Hidden" && data.Content === "BCXMsg" && typeof data.Sender === "number") {
				if (data.Sender === Player.MemberNumber || firstTimeInit)
					return;
				if (!isObject(data.Dictionary)) {
					console.warn("BCX: Hidden message no Dictionary", data);
					return;
				}
				const { type, message } = data.Dictionary;
				if (typeof type === "string") {
					const handler = hiddenMessageHandlers.get(type as keyof BCX_messages);
					if (handler === undefined) {
						console.warn("BCX: Hidden message no handler", data.Sender, type, message);
					} else {
						handler(data.Sender, message);
					}
				}
				return;
			}

			return next(args);
		});

		hookFunction("ServerAccountBeep", 10, (args, next) => {
			const data = args[0];

			if (typeof data?.BeepType === "string" && ["Leash", "BCX"].includes(data.BeepType) && isObject(data.Message?.BCX)) {
				const { type, message } = data.Message.BCX;
				if (typeof type === "string") {
					const handler = hiddenBeepHandlers.get(type as keyof BCX_beeps);
					if (handler === undefined) {
						console.warn("BCX: Hidden beep no handler", data.MemberNumber, type, message);
					} else {
						handler(data.MemberNumber, message);
					}
				}
				return;
			} else {
				return next(args);
			}
		});
	}

	unload() {
		hiddenBeepHandlers.clear();
		hiddenMessageHandlers.clear();
	}
}
