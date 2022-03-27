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
	ALLOW_BYPASS
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

function parseMsg(msg: string): SpeechMessageInfo | null {
	const rawMessage = msg;
	if (msg.startsWith("//")) {
		msg = msg.substr(1);
	} else if (msg.startsWith("/")) {
		return {
			type: "Command",
			rawMessage,
			originalMessage: msg,
			target: null,
			hasOOC: true
		};
	}
	if (msg.startsWith("*") || (Player.ChatSettings?.MuStylePoses && msg.startsWith(":") && msg.length > 3)) {
		// Emotes are handled in `ChatRoomSendEmote`
		return null;
	}
	return {
		type: ChatRoomTargetMemberNumber == null ? "Chat" : "Whisper",
		rawMessage,
		originalMessage: msg,
		target: ChatRoomTargetMemberNumber,
		noOOCMessage: msg.replace(/\([^)]*\)?\s?/gs, ""),
		hasOOC: msg.includes("(")
	};
}

/**
 * @returns The message that should be sent, or `null` if stopped
 */
function processMsg(msg: SpeechMessageInfo): string | null {
	// Don't modify commands this way
	if (msg.type === "Command") {
		return msg.rawMessage;
	}

	if (
		(msg.type === "Chat" || msg.type === "Whisper") &&
		ChatRoomShouldBlockGaggedOOCMessage(msg.originalMessage, ChatRoomCharacter.find(C => C.MemberNumber === ChatRoomTargetMemberNumber))
	) {
		// The message is to be blocked by BC, block it ourselves to prevent it from being deleted
		// @ts-expect-error: Wrong typing of the function, this works
		ChatRoomMessage({ Content: "ChatRoomBlockGaggedOOC", Type: "Action", Sender: Player.MemberNumber });
		return null;
	}

	// Let hooks block the messsage
	let result: SpeechHookAllow = SpeechHookAllow.ALLOW;
	for (const hook of speechHooks) {
		if (hook.allowSend) {
			const hookResult = hook.allowSend(msg);
			if (hookResult === SpeechHookAllow.ALLOW_BYPASS) {
				result = SpeechHookAllow.ALLOW_BYPASS;
			} else if (hookResult === SpeechHookAllow.BLOCK && result === SpeechHookAllow.ALLOW) {
				result = SpeechHookAllow.BLOCK;
			}
		}
	}
	if (result === SpeechHookAllow.BLOCK)
		return null;

	let message = msg.originalMessage;
	// Let hooks modify the message
	for (const hook of speechHooks) {
		if (hook.modify) {
			message = hook.modify(msg, message);
		}
	}

	// Let hooks react to actual message that will be sent
	for (const hook of speechHooks) {
		if (hook.onSend) {
			hook.onSend(msg, message);
		}
	}

	// Escape '/' if message starts with it
	if (message.startsWith("/")) {
		message = "/" + message;
	}
	return message;
}

//#region Antigarble
let antigarble = 0;

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
		let lastMessage: string = "";
		let lastMessageOriginal: string = "";
		hookFunction("ChatRoomSendChat", 5, (args, next) => {
			const chat = document.getElementById("InputChat") as HTMLTextAreaElement | null;
			if (chat) {
				const msg = chat.value.trim();
				if (msg) {
					const info = parseMsg(msg);
					if (info) {
						const msg2 = processMsg(info);
						if (msg2 === null) {
							if (RulesGetRuleState("speech_force_retype").isEnforced) {
								chat.value = "";
							}
							return;
						}
						chat.value = msg2;
						lastMessage = msg2.startsWith("//") ? msg2.substring(1) : msg2;
						lastMessageOriginal = info.originalMessage.startsWith("//") ? info.originalMessage.substring(1) : info.originalMessage;
					}
				}
			}
			return next(args);
		});

		//#region Antigarble for pre-garbled whispers
		hookFunction("ServerSend", 1, (args, next) => {
			const data = args[1];
			if (args[0] === "ChatRoomChat" &&
				isObject(data) &&
				data.Type === "Whisper" &&
				data.Content === lastMessage &&
				lastMessageOriginal &&
				data.Content !== lastMessageOriginal
			) {
				if (!Array.isArray(data.Dictionary)) {
					data.Dictionary = [];
				}
				data.Dictionary.push({ Tag: "BCX_ORIGINAL_MESSAGE", Text: lastMessageOriginal });
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
				const orig = data.Dictionary.find(i => isObject(i) && i.Tag === "BCX_ORIGINAL_MESSAGE" && typeof i.Text === "string");
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
			const rawMessage = args[0] as string;
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
				hasOOC: false
			});
			if (msg2 !== null) {
				return next(["*" + msg2]);
			} else if (RulesGetRuleState("speech_force_retype").isEnforced) {
				const chat = document.getElementById("InputChat") as HTMLTextAreaElement | null;
				if (chat) {
					chat.value = "";
				}
			}
		});

		//#region Antigarble
		const ANTIGARBLE_LEVELS: Record<string, number> = {
			"0": 0,
			"1": 1,
			"2": 2,
			"normal": 0,
			"both": 1,
			"ungarbled": 2
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

		hookFunction("SpeechGarble", 0, (args, next) => {
			if (antigarble === 2) return args[1];
			let res = next(args);
			if (typeof res === "string" && res !== args[1] && antigarble === 1) res += ` <> ${args[1]}`;
			return res;
		});
		//#endregion

		//#region Item specific fixes

		// Teach shock collar and futuristic gag, that commands are OOC
		if (typeof (window as any).InventoryItemNeckAccessoriesCollarAutoShockUnitDetectSpeech === "function") {
			hookFunction("InventoryItemNeckAccessoriesCollarAutoShockUnitDetectSpeech", 10, (args, next) => {
				if (ChatRoomLastMessage &&
					ChatRoomLastMessage.length > 0 &&
					ChatRoomLastMessage[ChatRoomLastMessage.length - 1].startsWith(".") &&
					!ChatRoomLastMessage[ChatRoomLastMessage.length - 1].startsWith("..")
				)
					return false;
				return next(args);
			});
		}

		//#endregion
	}
}
