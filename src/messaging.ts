import { hookFunction } from "./patching";
import { isObject } from "./utils";

export const hiddenMessageHandlers: Map<string, (sender: number, message: unknown) => void> = new Map();
export const hiddenBeepHandlers: Map<string, (sender: number, message: unknown) => void> = new Map();

export function sendHiddenMessage(type: string, message: any, Target: number | null = null) {
	if (!ServerPlayerIsInChatRoom())
		return;
	ServerSend("ChatRoomChat", {
		Content: "BCXMsg",
		Type: "Hidden",
		Target,
		Dictionary: { type, message }
	});
}

export function sendHiddenBeep(type: string, message: any, target: number, asLeashBeep: boolean = false) {
	ServerSend("AccountBeep", {
		MemberNumber: target,
		BeepType: asLeashBeep ? "Leash" : "BCX",
		Message: {
			BCX: { type, message }
		}
	});
}

export function init_messaging() {
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
				const handler = hiddenMessageHandlers.get(type);
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

		if (typeof data?.BeepType === "string" && ["Leash", "BCX"] && isObject(data.Message?.BCX)) {
			const { type, message } = data.Message.BCX;
			if (typeof type === "string") {
				const handler = hiddenMessageHandlers.get(type);
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
