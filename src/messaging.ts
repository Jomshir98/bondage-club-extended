import { BaseModule } from "./moduleManager";
import { hookFunction } from "./patching";
import { isObject } from "./utils";

export const hiddenMessageHandlers: Map<keyof BCX_messages, (sender: number, message: any) => void> = new Map();
export const hiddenBeepHandlers: Map<keyof BCX_beeps, (sender: number, message: any) => void> = new Map();

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
