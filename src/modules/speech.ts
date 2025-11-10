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

function parseMsg(msg: string, target?: number): SpeechMessageInfo | null {
	// All of those are just garbage being passed through as is from CommandParse and back into the input stream
	const replaceStraySlashCommands = (m: string): string => {
		if (m.startsWith("/me ")) {
			return m.replace("/me ", "*");
		} else if (m.startsWith("/action ")) {
			return m.replace("/action ", "**");
		} else if (m.startsWith("/attempt ")) {
			return m.replace("/attempt ", "*");
		} else {
			return m;
		}
	};
	msg = replaceStraySlashCommands(msg);
	const rawMessage = msg;

	if (msg.startsWith("//")) {
		msg = msg.substring(1);
	}
	if (msg.startsWith("*") || (Player.ChatSettings?.MuStylePoses && msg.startsWith(":") && msg.length > 3)) {
		if (Player.ChatSettings?.MuStylePoses && msg.startsWith(":")) {
			msg = msg.substring(1);
		} else {
			msg = msg.replace(/^\*/, "").replace(/\*$/, "");
		}
		return {
			type: "Emote",
			rawMessage,
			originalMessage: msg,
			target: null,
			noOOCMessage: msg,
			hasOOC: false,
		};
	}

	msg = msg.trim();

	return {
		type: (target ?? ChatRoomTargetMemberNumber) < 0 ? "Chat" : "Whisper",
		rawMessage,
		originalMessage: msg,
		target: target ?? ChatRoomTargetMemberNumber,
		noOOCMessage: msg.replace(/\([^)]*\)*\s?/gs, ""),
		hasOOC: msg.includes("("),
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
			if (msg.rawMessage.indexOf(element) === 1) {
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

	let message = msg.type === "Emote" ? msg.rawMessage : msg.originalMessage;
	// Let hooks modify the message
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

		let currentlyProcessedMessage: SpeechMessageInfo | null = null;

		/**
		 * Okay, there's a lot going on here, so let's go through it slowly.
		 * There are many ways of sending messages, the main one being stuff submitted from
		 * InputChat (so {@link ChatRoomSendChat}). But there's also things calling in either
		 * {@link ChatRoomSendEmote} or {@link ChatRoomSendWhisper}.
		 * As we'd like to enforce rules on all of those, the state of {@link currentlyProcessedMessage}
		 * is gonna be used to know the first case from the other two.
		 */

		// We're sending something, pre-parse the message
		hookFunction("ChatRoomSendChat", 5, (args, next) => {
			const inputChat = document.getElementById("InputChat") as HTMLTextAreaElement | null;
			const msg = inputChat?.value.trim() ?? "";
			if (msg.length) {
				const info = parseMsg(msg);
				if (info?.type !== "Command")
					currentlyProcessedMessage = info;
			}
			const ret = next(args);
			currentlyProcessedMessage = null;
			return ret;
		});

		// Intercept commands first, in case this is from a Enter-submitted input from chat
		hookFunction("CommandParse", 5, (args, next) => {
			const msg = args[0].trim();
			if (msg && currentlyProcessedMessage) {
				currentlyProcessedMessage = parseMsg(msg);
				if (currentlyProcessedMessage) {
					const msg2 = processMsg(currentlyProcessedMessage);
					// Message is rejected
					if (msg2 === null) {
						return true;
					}
					args[0] = msg2;
				}
			}
			return next(args);
		});

		//#region Antigarble for pre-garbled whispers
		hookFunction("ServerSend", 1, (args: any, next) => {
			const data = args[1];
			if (args[0] === "ChatRoomChat" &&
				currentlyProcessedMessage &&
				isObject(data) &&
				(data.Type === "Whisper" || data.Type === "Chat") &&
				(typeof data.Target === "number" ? data.Target : null) === currentlyProcessedMessage.target &&
				data.Content !== currentlyProcessedMessage.originalMessage
			) {
				if (!Array.isArray(data.Dictionary)) {
					data.Dictionary = [];
				}
				(data.Dictionary as ChatMessageDictionary).push({ Tag: "BCX_ORIGINAL_MESSAGE", Text: currentlyProcessedMessage.originalMessage });
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

		hookFunction("ChatRoomSendAttemptEmote", 5, (args, next) => {
			if (currentlyProcessedMessage) return next(args); // We already processed that from the CommandParse hook above
			const rawMessage = args[0];
			currentlyProcessedMessage = parseMsg(rawMessage.trim());
			if (!currentlyProcessedMessage) return next(args);

			const msg2 = processMsg(currentlyProcessedMessage);
			if (msg2 !== null) {
				return next(["*" + msg2]);
			} else if (RulesGetRuleState("speech_force_retype").isEnforced) {
				const chat = document.getElementById("InputChat") as HTMLTextAreaElement | null;
				if (chat) {
					chat.value = "";
				}
			}
		});

		hookFunction("ChatRoomSendEmote", 5, (args, next) => {
			if (currentlyProcessedMessage) return next(args); // We already processed that from the CommandParse hook above
			const rawMessage = args[0];
			currentlyProcessedMessage = parseMsg(rawMessage.trim());
			if (!currentlyProcessedMessage) return next(args);

			const msg2 = processMsg(currentlyProcessedMessage);
			if (msg2 !== null) {
				return next(["*" + msg2]);
			} else if (RulesGetRuleState("speech_force_retype").isEnforced) {
				const chat = document.getElementById("InputChat") as HTMLTextAreaElement | null;
				if (chat) {
					chat.value = "";
				}
			}
		});

		hookFunction("ChatRoomSendWhisper", 5, (args, next) => {
			if (currentlyProcessedMessage) return next(args); // We already processed that from the CommandParse hook above
			const [target, msg] = args;
			currentlyProcessedMessage = parseMsg(msg, target);
			if (!currentlyProcessedMessage) return next(args);
			const msg2 = processMsg(currentlyProcessedMessage);
			if (msg2 !== null) {
				return next(args);
			}
			// Just say we processed it
			return true;
		});

		//#region Antigarble
		const ANTIGARBLE_LEVELS: Record<string, number> = {
			"0": 0,
			"1": 1,
			"2": 2,
			"normal": 0,
			"both": 1,
			"ungarbled": 2,
		};

		const ANTIGARBLE_LEVEL_NAMES: string[] = Object.keys(ANTIGARBLE_LEVELS).filter(k => k.length > 1);

		registerCommand("cheats", "antigarble", "<level> - Set garble prevention to show [normal|both|ungarbled] messages (only affects received messages!)", value => {
			const val = ANTIGARBLE_LEVELS[value || ""];
			if (val !== undefined) {
				if (setAntigarble(val)) {
					ChatRoomSendLocal(`Antigarble set to ${ANTIGARBLE_LEVEL_NAMES[val]}`);
					return true;
				}
				return false;
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
