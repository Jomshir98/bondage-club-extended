import { BaseModule } from "../moduleManager";
import { hookFunction } from "../patching";
import { isObject, uuidv4 } from "../utils";

export const hiddenMessageHandlers: Map<keyof BCX_messages, (sender: number, message: any) => void> = new Map();
export const hiddenBeepHandlers: Map<keyof BCX_beeps, (sender: number, message: any) => void> = new Map();

export const queryHandlers: {
	[K in keyof BCX_queries]?: (sender: number, resolve: (ok: boolean, data?: BCX_queries[K][1]) => void, data: BCX_queries[K][0]) => void;
} = {};

export function sendHiddenMessage<T extends keyof BCX_messages>(type: T, message: BCX_messages[T], Target: number | null = null) {
	if (!ServerPlayerIsInChatRoom())
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
	return new Promise((resolve, reject) => {
		const id = uuidv4();
		const info: IPendingQuery = {
			target,
			resolve,
			reject,
			timeout: setTimeout(() => {
				console.warn("BCX: Query timed out", target, type);
				pendingQueries.delete(id);
				reject("Timed out");
			}, timeout)
		};
		pendingQueries.set(id, info);

		sendHiddenMessage("query", {
			id,
			query: type,
			data
		}, target);

	});
}

hiddenMessageHandlers.set("query", (sender, message: BCX_message_query) => {
	if (!isObject(message) ||
		typeof message.id !== "string" ||
		typeof message.query !== "string"
	) {
		console.warn(`BCX: Invalid query`, sender, message);
		return;
	}

	const handler = queryHandlers[message.query];
	if (!handler) {
		console.warn("BCX: Query no handler", sender, message);
		return sendHiddenMessage("queryAnswer", {
			id: message.id,
			ok: false
		});
	}

	handler(sender, (ok, data) => {
		sendHiddenMessage("queryAnswer", {
			id: message.id,
			ok,
			data
		});
	}, message.data);
});

hiddenMessageHandlers.set("queryAnswer", (sender, message: BCX_message_queryAnswer) => {
	if (!isObject(message) ||
		typeof message.id !== "string" ||
		typeof message.ok !== "boolean"
	) {
		console.warn(`BCX: Invalid queryAnswer`, sender, message);
		return;
	}

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
});

export class ModuleMessaging extends BaseModule {
	load() {
		hookFunction("ChatRoomMessage", 10, (args, next) => {
			const data = args[0];

			if (data?.Type === "Hidden" && data.Content === "BCXMsg" && typeof data.Sender === "number") {
				if (data.Sender === Player.MemberNumber)
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
