import { ModuleInitPhase } from "../constants";
import { moduleInitPhase } from "../moduleManager";
import { hookFunction } from "../patching";
import { isObject } from "../utils";
import { RulesGetRuleState } from "./rules";
import { BaseModule } from "./_BaseModule";
import { FORBIDDEN_BC_COMMANDS } from "../config";
import { checkWCEAntiGarble } from "../main";


import { InfoBeep } from "../utilsClub";


export interface SpeechMessageInfo {
	readonly type: "Chat" | "Emote" | "Whisper" | "Command";
	readonly target: number | null;
	readonly rawMessage: string;
	readonly originalMessage: string;
	readonly noOOCMessage?: string;
	readonly hasOOC: boolean;
}

export const enum SpeechHookAllow {
	/** Message is allowed to continue */
	ALLOW,
	/** Message will be blocked */
	BLOCK,
	/** Message will not be blocked, even if some hook returned BLOCK */
	ALLOW_BYPASS,
}

export interface SpeechHook {
	allowSend?(info: SpeechMessageInfo): SpeechHookAllow;
	modify?(info: SpeechMessageInfo, message: string): string;
	onSend?(info: SpeechMessageInfo, message: string): void;
}

const speechHooks: SpeechHook[] = [];

export function registerSpeechHook(hook: SpeechHook): void {
	if (moduleInitPhase !== ModuleInitPhase.init) {
		throw new Error("Speech hooks can be registered only during init");
	}
	speechHooks.push(hook);
}

/**
 * Alters a message so that it sounds like a faltering voice, including random filler sounds. Does not affect OOC talk.
 * @param {string} message - The message that will be randomly changed
 * @returns {string} - Returns the message after studdering and random sounds have been added
 */
export function falteringSpeech(message: string): string {
	const soundList: string[] = ["uuh", "ah", "uhm", "mnn", "nn", "fuck", "tie me up", "hardcore kink",
		"bind me", "harder", "spank me", "blind me", "gag me", "never release", "strict", "punish", "forever", "love you", "restrain me",
		"I love hardcore", "chain me", "aaaah",
	];

	const additions: string[] = ["", " ", "  ", ".", "..", "...", "....", ".....", "......", "......."];

	const enhancedSoundList: string[] = [];

	soundList.forEach((sound: string) => {
		const prefix: string = additions[Math.floor(Math.random() * additions.length)];
		const suffix: string = additions[Math.floor(Math.random() * additions.length)];
		enhancedSoundList.push(prefix + sound + suffix);
	});

	console.log("sounds: " + JSON.stringify(enhancedSoundList));

	let firstWord: boolean = true;
	let alreadyStudderedWord: boolean = false;
	let seed: number = message.length;
	for (let messageIndex = 0; messageIndex < message.length; messageIndex++) {
		const character = message.charAt(messageIndex).toLowerCase();
		if (!alreadyStudderedWord && /\p{L}/igu.test(character)) {
			const studderFactor: number = Math.floor(Math.sin(seed++) * 100000) % 10;
			if ((!alreadyStudderedWord && studderFactor >= 6) || firstWord) {
				message = message.substring(0, messageIndex + 1) + "-" + message.substring(messageIndex, message.length);
				seed++;
				if (Math.random() < 0.25 && !firstWord) {
					message = message.substring(0, messageIndex) + enhancedSoundList[Math.floor(Math.random() * soundList.length)] + message.substring(messageIndex, message.length);
				}
				messageIndex += 2;
				if (firstWord) firstWord = false;
			}
			alreadyStudderedWord = true;
		}
		if (character === " ") alreadyStudderedWord = false;
	}
	return message;
}

export function clearChat(msg: string) {
	const chat = document.getElementById("InputChat") as HTMLTextAreaElement | null;
	if (chat) {
		chat.value = "";
	} else {
		console.error("Chat element not found");
	}
	// Clear message history if matches
	if (ChatRoomLastMessage.length > 0 && ChatRoomLastMessage.at(-1) === msg) {
		ChatRoomLastMessage.splice(ChatRoomLastMessage.length - 1, 1);
		ChatRoomLastMessageIndex = Math.min(ChatRoomLastMessageIndex, ChatRoomLastMessage.length);
	}
}

function parseMsg(msg: string): (SpeechMessageInfo | null) {

	const rawMessage = msg;

	if (msg.startsWith("//")) {
		msg = msg.substring(1);
	}

	let type: "Chat" | "Emote" | "Whisper" | "Command" = "Chat";
	type = ChatRoomTargetMemberNumber > 0 ? "Whisper": type;
	type = msg.startsWith("/") ? "Command" : type;
	type = msg.startsWith("*") || msg.startsWith("/me") || msg.startsWith("/action") ||
		(Player.ChatSettings?.MuStylePoses && msg.startsWith(":") && msg.length > 3) ? "Emote" : type;

	const noOOCMessage = msg.replace(/\([^)]*\)*\s?/gs, "");
	const hasOOC: boolean = msg.includes("(");

	if (Player.ChatSettings?.MuStylePoses && msg.startsWith(":")) msg = msg.substring(1);
	else {
		msg = msg.replace(/^\*/, "").replace(/\*$/, "");
		if (msg.startsWith("/me ")) msg = msg.replace("/me ", "");
		if (msg.startsWith("/action ")) msg = msg.replace("/action ", "*");
	}

	msg = msg.trim();

	return {
		type,
		rawMessage,
		originalMessage: msg,
		target: ChatRoomTargetMemberNumber,
		noOOCMessage,
		hasOOC,
	};
}

/**
 * @returns The message that should be sent, or `null` if stopped
 */
function processMsg(msg: SpeechMessageInfo | null): string | null {

	if (checkWCEAntiGarble()) {
		return null;
	}

	if (!msg) {
		return null;
	}
	let result: string | null = msg.originalMessage;

	console.groupCollapsed("Processing message: " + msg.originalMessage);
	console.log("Message: " + JSON.stringify(msg, null, 2));

	if (msg.type === "Command") {
		console.log("Command");

		FORBIDDEN_BC_COMMANDS.forEach(element => {
			if (msg.rawMessage.includes(element)) {
				console.log("Command " + msg.rawMessage + " is forbidden");
				InfoBeep("Command " + msg.rawMessage + " is forbidden. Do not cheat!");
				result = null;
			}
		});
		console.groupEnd();
		return result;
	}

	if (agreeMessageHook(msg) === SpeechHookAllow.BLOCK) {
		console.log("Message shall be blocked.");
		console.groupEnd();
		if (RulesGetRuleState("speech_force_retype").isEnforced) {
			clearChat(msg.rawMessage);
		}
		return null;
	}

	for (const hook of speechHooks) {
		if (hook.modify) {
			console.log("Message shall be modified.");
			result = hook.modify(msg, result);
		}
	}

	if (agreeMessageHook(msg) === SpeechHookAllow.ALLOW) {
		for (const hook of speechHooks) {
			if (hook.onSend) {
				console.log("Send message");
				hook.onSend(msg, result);
			}
		}
	}

	console.groupEnd();
	return result;
}

const antigarble = 0;

function agreeMessageHook(msg: SpeechMessageInfo) {
	let result: SpeechHookAllow = SpeechHookAllow.ALLOW;
	for (const hook of speechHooks) {
		if (hook.allowSend) {
			const hookResult = hook.allowSend(msg);
			if (hookResult === SpeechHookAllow.ALLOW_BYPASS) {
				console.log("--> Message hook: allow");
				result = SpeechHookAllow.ALLOW_BYPASS;
			} else if (hookResult === SpeechHookAllow.BLOCK && result === SpeechHookAllow.ALLOW) {
				console.log("--> Message hook: block");
				result = SpeechHookAllow.BLOCK;
			}
		}
	}
	return result;
}

export class ModuleSpeech extends BaseModule {

	load() {

		let currentlyProcessedMessage: {
			result: string;
			original: string;
			target: number | null;
		} | null = null;

		hookFunction("CommandParse", 5, (args, next) => {
			const msg = args[0].trim();
			if (msg) {
				const info = parseMsg(msg);
				if (info) {
					const msg2 = processMsg(info);
					// Message is rejected
					if (msg2 === null) {
						return true;
					}
					args[0] = msg2;
					currentlyProcessedMessage = {
						result: msg2.startsWith("//") ? msg2.substring(1) : msg2,
						original: info.originalMessage.startsWith("//") ? info.originalMessage.substring(1) : info.originalMessage,
						target: info.target,
					};
				}
			}
			const res = next(args);
			currentlyProcessedMessage = null;
			return res;
		});

		//#region Antigarble for pre-garbled whispers
		hookFunction("ServerSend", 1, (args: any, next) => {
			const data = args[1];
			if (args[0] === "ChatRoomChat" &&
				currentlyProcessedMessage &&
				isObject(data) &&
				(data.Type === "Whisper" || data.Type === "Chat") &&
				(typeof data.Target === "number" ? data.Target : null) === currentlyProcessedMessage.target &&
				data.Content !== currentlyProcessedMessage.original
			) {
				if (!Array.isArray(data.Dictionary)) {
					data.Dictionary = [];
				}
				(data.Dictionary as ChatMessageDictionary).push({ Tag: "BCX_ORIGINAL_MESSAGE", Text: currentlyProcessedMessage.original });
			}
			return next(args);
		});

		hookFunction("ChatRoomMessage", 1, (args, next) => {
			const data = args[0];
			if (antigarble > 0 &&
				isObject(data) &&
				data.Type === "Whisper" &&
				typeof data.Content === "string" &&
				Array.isArray(data.Dictionary)
			) {
				const orig: any = data.Dictionary.find((i: unknown) => isObject(i) && i.Tag === "BCX_ORIGINAL_MESSAGE" && typeof i.Text === "string");
				if (orig && data.Content !== orig.Text) {
					data.Content += ` <> ${orig.Text}`;
				}
			}
			return next(args);
		});
		//#endregion

		// Even if not modified by hook, the hash is very important
		hookFunction("CommandParse", 0, (args, next) => next(args));

		hookFunction("ChatRoomSendEmote", 5, (args, next) => {
			const rawMessage = args[0];
			const result = parseMsg(rawMessage);
			const msg = processMsg(result);

			if (msg !== null && result?.type === "Emote") {
				return next(["*" + msg]);
			}
		});

		//#region Antigarble
		hookFunction("SpeechGarble", 6, (args, next) => {
			//			if (antigarble === 2) return args[1];
			const res = next(args);
			//			if (typeof res === "string" && res !== args[1] && antigarble === 1) res += ` <> ${args[1]}`;
			return res;
		});
		//#endregion
	}
}
