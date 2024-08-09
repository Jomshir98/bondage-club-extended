import { ModuleInitPhase } from "../constants";
import { moduleInitPhase } from "../moduleManager";
import { hookFunction } from "../patching";
import { isObject } from "../utils";
import { ChatRoomSendLocal } from "../utilsClub";
import { registerCommand } from "./commands";
import { RulesGetRuleState } from "./rules";
import { BaseModule } from "./_BaseModule";

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
	const soundList: string[] = ["uuh... ", "uhh... ", "...ah... ", "uhm... ", "mnn... ", "..nn... "];
	let oocMsg: boolean = false;
	let firstWord: boolean = true;
	let alreadyStudderedWord: boolean = false;
	let seed: number = message.length;
	for (let messageIndex = 0; messageIndex < message.length; messageIndex++) {

		const character = message.charAt(messageIndex).toLowerCase();
		// from here on out, an out of context part of the message starts that will stay unchanged
		if (character === "(") oocMsg = true;
		if (!oocMsg && !alreadyStudderedWord && /\p{L}/igu.test(character)) {
			const studderFactor: number = Math.floor(Math.sin(seed++) * 100000) % 10;
			if ((!alreadyStudderedWord && studderFactor >= 6) || firstWord) {
				message = message.substring(0, messageIndex + 1) + "-" + message.substring(messageIndex, message.length);
				seed++;
				// One third chance to add a sound before a studdered word
				if (Math.random() < 0.33 && !firstWord) {
					message = message.substring(0, messageIndex) + soundList[Math.floor(Math.random() * soundList.length)] + message.substring(messageIndex, message.length);
				}
				messageIndex += 2;
				if (firstWord) firstWord = false;
			}
			alreadyStudderedWord = true;
		}
		if (character === ")") oocMsg = false;
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
	if (msg.startsWith("*") || (Player.ChatSettings?.MuStylePoses && msg.startsWith(":") && msg.length > 3)) {
		// Emotes are handled in `ChatRoomSendEmote`
		return null;
	}

	if (msg.startsWith("//")) {
		msg = msg.substring(1);
	} else if (msg.startsWith("/")) {
		return {
			type: "Command",
			rawMessage,
			originalMessage: msg,
			target: null,
			hasOOC: false,
		};
	}

	return {
		type: ChatRoomTargetMemberNumber < 0 ? "Chat" : "Whisper",
		rawMessage,
		originalMessage: msg,
		target: ChatRoomTargetMemberNumber,
		noOOCMessage: msg.replace(/\([^)]*\)*\s?/gs, ""),
		hasOOC: msg.includes("("),
	};
}

/**
 * @returns The message that should be sent, or `null` if stopped
 */
function processMsg(msg: SpeechMessageInfo): string | null {
	console.groupCollapsed("Processing message: " + msg.originalMessage);
	console.log("Message: " + JSON.stringify(msg, null, 2));

	if (msg.type === "Command") {
		console.log("Command");
		return msg.rawMessage;
	}

	let result = msg.originalMessage;
	
	if (agreeMessageHook(msg) === SpeechHookAllow.BLOCK) {
			console.log("Message shall be blocked.");
			console.groupEnd();
			return null;
	}
	
	for (const hook of speechHooks) {
		if (hook.modify) {
			console.log("Message shall be modified.");
			result = hook.modify(msg, result);
		}
	}

	for (const hook of speechHooks) {
		if (hook.onSend) {
			console.log("Send message");
			hook.onSend(msg, result);
		}
	}

	console.groupEnd();
	return result;
}

//#region Antigarble
let antigarble = 0;

function agreeMessageHook(msg: SpeechMessageInfo) {
	console.groupCollapsed("Agree message hook");
	// Let hooks block the messsage
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
	console.groupEnd();
	return result;
}

function setAntigarble(value: number): boolean {
	if (![0, 1, 2].includes(value)) {
		throw new Error("Bad antigarble value, expected 0/1/2");
	}
	if (value !== 0) {
		const blockRule = RulesGetRuleState("speech_block_antigarble");
		if (blockRule.isEnforced) {
			blockRule.triggerAttempt();
			return false;
		} else if (blockRule.inEffect) {
			blockRule.trigger();
		}
	}
	antigarble = value;
	return true;
}
//#endregion

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
						// There is rule to force retype of rejected message
						if (RulesGetRuleState("speech_force_retype").isEnforced) {
							clearChat(msg);
						}
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
					if (antigarble === 2) {
						data.Content = orig.Text;
					} else {
						data.Content += ` <> ${orig.Text}`;
					}
				}
			}
			return next(args);
		});
		//#endregion

		// Even if not modified by hook, the hash is very important
		hookFunction("CommandParse", 0, (args, next) => next(args));

		hookFunction("ChatRoomSendEmote", 5, (args, next) => {
			const rawMessage = args[0];
			let msg = rawMessage;
			if (Player.ChatSettings?.MuStylePoses && msg.startsWith(":")) msg = msg.substring(1);
			else {
				msg = msg.replace(/^\*/, "").replace(/\*$/, "");
				if (msg.startsWith("/me ")) msg = msg.replace("/me ", "");
				if (msg.startsWith("/action ")) msg = msg.replace("/action ", "*");
			}
			msg = msg.trim();
			const msg2 = processMsg({
				type: "Emote",
				rawMessage,
				originalMessage: msg,
				target: ChatRoomTargetMemberNumber,
				noOOCMessage: msg,
				hasOOC: false,
			});
			if (msg2 !== null) {
				return next(["*" + msg2]);
			} else if (RulesGetRuleState("speech_force_retype").isEnforced) {
				clearChat(msg);
			}
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
			ChatRoomSendLocal(`Invalid antigarble level; use ${ANTIGARBLE_LEVEL_NAMES.join("/")}`);
			return false;
		}, value => {
			return ANTIGARBLE_LEVEL_NAMES.filter(k => k.length > 1 && k.startsWith(value));
		});

		hookFunction("SpeechGarble", 6, (args, next) => {
			if (antigarble === 2) return args[1];
			let res = next(args);
			if (typeof res === "string" && res !== args[1] && antigarble === 1) res += ` <> ${args[1]}`;
			return res;
		});
		//#endregion
	}
}
