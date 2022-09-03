import { ConditionsLimit, ModuleCategory } from "../constants";
import { registerRule, RuleType } from "../modules/rules";
import { AccessLevel, getCharacterAccessLevel } from "../modules/authority";
import { registerSpeechHook, SpeechMessageInfo, falteringSpeech, SpeechHookAllow } from "../modules/speech";
import { callOriginal, hookFunction } from "../patching";
import { getChatroomCharacter } from "../characters";
import { dictionaryProcess, escapeRegExp, isObject } from "../utils";
import { ChatRoomSendLocal } from "../utilsClub";
import { BCX_setTimeout } from "../BCXContext";

function checkMessageForSounds(sounds: string[], message: string, allowPartialMatch: boolean = true): boolean {
	for (let sound of sounds) {
		sound = sound.toLocaleLowerCase();
		let ok = true;
		let i = 0;
		let fullMatch = allowPartialMatch;
		for (const c of message) {
			if (/\p{L}/igu.test(c)) {
				const nx = sound[(i + 1) % sound.length];
				if (c === nx) {
					i = (i + 1) % sound.length;
					if (i === sound.length - 1) {
						fullMatch = true;
					}
				} else if (c !== sound[i]) {
					ok = false;
					break;
				}
			}
		}
		if (ok && fullMatch)
			return true;
	}
	return false;
}

export function initRules_bc_speech_control() {
	registerRule("speech_specific_sound", {
		name: "Allow specific sounds only",
		type: RuleType.Speech,
		shortDescription: "such as an animal sound",
		longDescription: "This rule allows PLAYER_NAME to only communicate using a list of specific sound patterns in chat messages and whispers. These patterns cannot be mixed in the same message, though. Only one sound from the list per message is valid. That said, any variation of a sound in the list is allowed as long as the letters are in order. (Example: if the set sound is 'Meow', then this is a valid message: 'Me..ow? meeeow! mmeooowwwwwww?! meow. me.. oo..w ~')",
		keywords: ["filter", "speech", "talking", "letters"],
		triggerTexts: {
			infoBeep: "You are allowed to speak only using one of the defined sounds!",
			attempt_log: "PLAYER_NAME tried to break a rule to only speak using specific sound patterns",
			log: "PLAYER_NAME broke a rule to only speak using specific sound patterns"
		},
		defaultLimit: ConditionsLimit.normal,
		dataDefinition: {
			soundWhitelist: {
				type: "stringList",
				default: [],
				description: "Set the allowed sounds:",
				options: {
					validate: /^\p{L}*$/iu
				}
			}
		},
		init(state) {
			const check = (msg: SpeechMessageInfo): boolean => {
				const sounds = state.customData?.soundWhitelist;
				if (sounds && sounds.length > 0 && (msg.type === "Chat" || msg.type === "Whisper")) {
					const message = (msg.noOOCMessage ?? msg.originalMessage).toLocaleLowerCase();
					return checkMessageForSounds(sounds, message);
				}
				return true;
			};
			registerSpeechHook({
				allowSend: (msg) => {
					if (state.isEnforced && !check(msg)) {
						state.triggerAttempt();
						return SpeechHookAllow.BLOCK;
					}
					return SpeechHookAllow.ALLOW;
				},
				onSend: (msg) => {
					if (state.inEffect && !check(msg)) {
						state.trigger();
					}
				}
			});
		}
	});

	registerRule("speech_garble_whispers", {
		name: "Garble whispers while gagged",
		type: RuleType.Speech,
		loggable: false,
		shortDescription: "same as normal messages",
		longDescription: "This rule alters PLAYER_NAME's outgoing whisper messages while gagged to be garbled the same way normal chat messages are. This means, that strength of the effect depends on the type of gag and (OOC text) is not affected. Note: While the rule is in effect, the BC immersion preference 'Prevent OOC & whispers while gagged' is altered, to allow gagged whispers, since those are now garbled by the rule. OOC prevention is not changed.",
		keywords: ["garbling", "whispering"],
		defaultLimit: ConditionsLimit.limited,
		init(state) {
			registerSpeechHook({
				modify: (info, message) => state.isEnforced && info.type === "Whisper" ? callOriginal("SpeechGarble", [Player, message, true]) : message
			});
		},
		load(state) {
			hookFunction("ChatRoomShouldBlockGaggedOOCMessage", 2, (args, next) => {
				if (state.isEnforced && ChatRoomTargetMemberNumber !== null && !(args[0] as string).includes("(")) return false;
				return next(args);
			}, ModuleCategory.Rules);
		}
	});

	registerRule("speech_block_gagged_ooc", {
		name: "Block OOC chat while gagged",
		type: RuleType.Speech,
		shortDescription: "no more misuse of OOC for normal chatting while gagged",
		longDescription: "This rule forbids PLAYER_NAME to use OOC (messages between round brackets) in chat or OOC whisper messages while she is gagged.",
		keywords: ["parentheses", "prevent", "forbid"],
		triggerTexts: {
			infoBeep: "You are not allowed to use OOC in messages while gagged.",
			attempt_log: "PLAYER_NAME tried to use OOC in a message while gagged",
			log: "PLAYER_NAME used OOC in a message while gagged"
		},
		defaultLimit: ConditionsLimit.blocked,
		init(state) {
			const check = (msg: SpeechMessageInfo): boolean => !msg.hasOOC || Player.CanTalk() || msg.type !== "Chat" && msg.type !== "Whisper";
			registerSpeechHook({
				allowSend: (msg) => {
					if (state.isEnforced && !check(msg)) {
						state.triggerAttempt();
						return SpeechHookAllow.BLOCK;
					}
					return SpeechHookAllow.ALLOW;
				},
				onSend: (msg) => {
					if (state.inEffect && !check(msg)) {
						state.trigger();
					}
				}
			});
		}
	});

	registerRule("speech_block_ooc", {
		name: "Block OOC chat",
		type: RuleType.Speech,
		shortDescription: "blocks use of OOC in messages",
		longDescription: "This rule forbids PLAYER_NAME to use OOC (messages between round brackets) in chat or OOC whisper messages at any moment. This is a very extreme rule and should be used with great caution!",
		keywords: ["parentheses", "prevent", "forbid"],
		triggerTexts: {
			infoBeep: "You are not allowed to use OOC in messages!",
			attempt_log: "PLAYER_NAME tried to use OOC in a message",
			log: "PLAYER_NAME used OOC in a message"
		},
		defaultLimit: ConditionsLimit.blocked,
		init(state) {
			const check = (msg: SpeechMessageInfo): boolean => !msg.hasOOC || msg.type !== "Chat" && msg.type !== "Whisper";
			registerSpeechHook({
				allowSend: (msg) => {
					if (state.isEnforced && !check(msg)) {
						state.triggerAttempt();
						return SpeechHookAllow.BLOCK;
					}
					return SpeechHookAllow.ALLOW;
				},
				onSend: (msg) => {
					if (state.inEffect && !check(msg)) {
						state.trigger();
					}
				}
			});
		}
	});

	registerRule("speech_doll_talk", {
		name: "Doll talk",
		type: RuleType.Speech,
		shortDescription: "allows only short sentences with simple words",
		longDescription: "This rule forbids PLAYER_NAME to use any words longer than set limit and limits number of words too. Both limits are configurable independently. Doesn't affect OOC text, but does affect whispers. Note: Setting '0' means this part is not limited (∞), as there is another rule to forbid open talking completely.",
		keywords: ["limit", "restrict", "length", "count"],
		triggerTexts: {
			infoBeep: "You broke the doll talk rule!",
			attempt_log: "PLAYER_NAME tried to break the doll talk rule",
			log: "PLAYER_NAME broke the doll talk rule"
		},
		defaultLimit: ConditionsLimit.normal,
		dataDefinition: {
			maxWordLength: {
				type: "number",
				default: 6,
				description: "Max. character length of any word:",
				Y: 420
			},
			maxNumberOfWords: {
				type: "number",
				default: 5,
				description: "Max. number of words per message:",
				Y: 570
			}
		},
		init(state) {
			const check = (msg: SpeechMessageInfo): boolean => {
				if ((msg.type !== "Chat" && msg.type !== "Whisper") || state.customData == null)
					return true;
				const words = Array.from((msg.noOOCMessage ?? msg.originalMessage).matchAll(/[^\t\p{Z}\v.:!?~,;^]+/gmu)).map(i => i[0]);
				if (state.customData.maxNumberOfWords && words.length > state.customData.maxNumberOfWords)
					return false;
				if (state.customData.maxWordLength && words.some(word => word.length > state.customData!.maxWordLength))
					return false;
				return true;
			};
			registerSpeechHook({
				allowSend: (msg) => {
					if (state.isEnforced && !check(msg)) {
						state.triggerAttempt();
						return SpeechHookAllow.BLOCK;
					}
					return SpeechHookAllow.ALLOW;
				},
				onSend: (msg) => {
					if (state.inEffect && !check(msg)) {
						state.trigger();
					}
				}
			});
		}
	});

	registerRule("speech_ban_words", {
		name: "Forbid saying certain words in chat",
		type: RuleType.Speech,
		shortDescription: "based on a configurable blacklist",
		longDescription: "This rule forbids PLAYER_NAME to use certain words in the chat. The list of banned words can be configured. Checks are not case sensitive (forbidding 'no' also forbids 'NO' and 'No'). Doesn't affect emotes and OOC text, but does affect whispers.",
		keywords: ["limit", "restrict", "blacklist", "blocklist", "forbidden"],
		triggerTexts: {
			infoBeep: "You are not allowed to use the word 'USED_WORD'!",
			attempt_log: "PLAYER_NAME tried to use the banned word 'USED_WORD'",
			log: "PLAYER_NAME used the banned word 'USED_WORD'"
		},
		defaultLimit: ConditionsLimit.normal,
		dataDefinition: {
			bannedWords: {
				type: "stringList",
				default: [],
				description: "All forbidden words:",
				options: {
					validate: /^[\p{L} ]*$/iu
				}
			}
		},
		init(state) {
			let transgression: undefined | string;
			const check = (msg: SpeechMessageInfo): boolean => {
				if ((msg.type !== "Chat" && msg.type !== "Whisper") || !state.customData?.bannedWords)
					return true;
				transgression = state.customData?.bannedWords.find(i =>
					(msg.noOOCMessage ?? msg.originalMessage).toLocaleLowerCase().match(
						new RegExp(`([^\\p{L}]|^)${escapeRegExp(i.trim())}([^\\p{L}]|$)`, "iu")
					)
				);
				return transgression === undefined;
			};
			registerSpeechHook({
				allowSend: (msg) => {
					if (state.isEnforced && !check(msg) && transgression !== undefined) {
						state.triggerAttempt(null, { USED_WORD: transgression });
						return SpeechHookAllow.BLOCK;
					}
					return SpeechHookAllow.ALLOW;
				},
				onSend: (msg) => {
					if (state.inEffect && !check(msg) && transgression !== undefined) {
						state.trigger(null, { USED_WORD: transgression });
					}
				}
			});
		}
	});

	registerRule("speech_ban_words_in_emotes", {
		name: "Forbid saying certain words in emotes",
		type: RuleType.Speech,
		shortDescription: "based on a configurable blacklist",
		longDescription: "This rule forbids PLAYER_NAME to use certain words as part of any emote messages. The list of banned words can be configured. Checks are not case sensitive (forbidding 'no' also forbids 'NO' and 'No').",
		keywords: ["limit", "restrict", "blacklist", "blocklist", "forbidden"],
		triggerTexts: {
			infoBeep: "You are not allowed to use the word 'USED_WORD'!",
			attempt_log: "PLAYER_NAME tried to use the banned word 'USED_WORD'",
			log: "PLAYER_NAME used the banned word 'USED_WORD'"
		},
		defaultLimit: ConditionsLimit.limited,
		dataDefinition: {
			bannedWords: {
				type: "stringList",
				default: [],
				description: "All forbidden words:",
				options: {
					validate: /^[\p{L} ]*$/iu
				}
			}
		},
		init(state) {
			let transgression: undefined | string;
			const check = (msg: SpeechMessageInfo): boolean => {
				if (msg.type !== "Emote" || !state.customData?.bannedWords)
					return true;
				transgression = state.customData?.bannedWords.find(i =>
					(msg.noOOCMessage ?? msg.originalMessage).toLocaleLowerCase().match(
						new RegExp(`([^\\p{L}]|^)${escapeRegExp(i.trim())}([^\\p{L}]|$)`, "iu")
					)
				);
				return transgression === undefined;
			};
			registerSpeechHook({
				allowSend: (msg) => {
					if (state.isEnforced && !check(msg) && transgression !== undefined) {
						state.triggerAttempt(null, { USED_WORD: transgression });
						return SpeechHookAllow.BLOCK;
					}
					return SpeechHookAllow.ALLOW;
				},
				onSend: (msg) => {
					if (state.inEffect && !check(msg) && transgression !== undefined) {
						state.trigger(null, { USED_WORD: transgression });
					}
				}
			});
		}
	});

	registerRule("speech_forbid_open_talking", {
		name: "Forbid talking openly",
		type: RuleType.Speech,
		shortDescription: "in a chat room",
		longDescription: "This rule forbids PLAYER_NAME to send a message to all people inside a chat room. Does not affect whispers or emotes, but does affect OOC.",
		keywords: ["limit", "restrict", "loud", "saying", "speaking", "chatting"],
		triggerTexts: {
			infoBeep: "You are not allowed to talk openly in chatrooms!",
			attempt_log: "PLAYER_NAME tried to openly speak in a room",
			log: "PLAYER_NAME spoke openly in a room"
		},
		defaultLimit: ConditionsLimit.blocked,
		init(state) {
			const check = (msg: SpeechMessageInfo): boolean => msg.type !== "Chat";
			registerSpeechHook({
				allowSend: (msg) => {
					if (state.isEnforced && !check(msg)) {
						state.triggerAttempt();
						return SpeechHookAllow.BLOCK;
					}
					return SpeechHookAllow.ALLOW;
				},
				onSend: (msg) => {
					if (state.inEffect && !check(msg)) {
						state.trigger();
					}
				}
			});
		}
	});

	registerRule("speech_limit_open_talking", {
		name: "Limit talking openly",
		type: RuleType.Speech,
		loggable: false,
		shortDescription: "only allow a set number of chat messages per minute",
		longDescription: "This rule limits PLAYER_NAME's ability to send a message to all people inside a chat room to only the set number per minute. Does not affect whispers or emotes, but does affect OOC. Note: Setting '0' will have no effect, as there is another rule to forbid open talking completely.",
		keywords: ["limit", "restrict", "loud", "saying", "speaking", "chatting", "slow", "fast"],
		triggerTexts: {
			infoBeep: "You exceeded the number of allowed chat messages per minute!"
		},
		dataDefinition: {
			maxNumberOfMsg: {
				type: "number",
				default: 42,
				description: "Maximum allowed number of chat messages per minute (> 0):",
				Y: 380
			}
		},
		defaultLimit: ConditionsLimit.blocked,
		init(state) {
			let currentCount: number = 0;
			const check = (msg: SpeechMessageInfo): boolean => msg.type !== "Chat";
			registerSpeechHook({
				allowSend: (msg) => {
					if (state.customData?.maxNumberOfMsg && state.customData.maxNumberOfMsg !== 0 && state.isEnforced && !check(msg)) {
						if (currentCount >= state.customData.maxNumberOfMsg) {
							state.triggerAttempt();
							return SpeechHookAllow.BLOCK;
						}
						BCX_setTimeout(() => {
							if (currentCount > 0) {
								currentCount--;
							}
						}, 60_000);
					}
					return SpeechHookAllow.ALLOW;
				},
				onSend: (msg) => {
					if (state.customData?.maxNumberOfMsg && state.customData.maxNumberOfMsg !== 0 && state.isEnforced && !check(msg)) {
						currentCount++;
					}
				}
			});
		}
	});

	registerRule("speech_forbid_emotes", {
		name: "Forbid using emotes",
		type: RuleType.Speech,
		shortDescription: "in a chat room",
		longDescription: "This rule forbids PLAYER_NAME to send an emote (with * or /me) to all people inside a chat room.",
		keywords: ["limit", "restrict", "emoting", "acting"],
		triggerTexts: {
			infoBeep: "You are not allowed to use emotes in chatrooms!",
			attempt_log: "PLAYER_NAME tried to use an emote in a room",
			log: "PLAYER_NAME used an emote in a room"
		},
		defaultLimit: ConditionsLimit.blocked,
		init(state) {
			const check = (msg: SpeechMessageInfo): boolean => msg.type !== "Emote";
			registerSpeechHook({
				allowSend: (msg) => {
					if (state.isEnforced && !check(msg)) {
						state.triggerAttempt();
						return SpeechHookAllow.BLOCK;
					}
					return SpeechHookAllow.ALLOW;
				},
				onSend: (msg) => {
					if (state.inEffect && !check(msg)) {
						state.trigger();
					}
				}
			});
		}
	});

	registerRule("speech_limit_emotes", {
		name: "Limit using emotes",
		type: RuleType.Speech,
		loggable: false,
		shortDescription: "only allow a set number of emotes per minute",
		longDescription: "This rule forbids PLAYER_NAME to send an emote (with * or /me) to all people inside a chat room to only the set number per minute. Note: Setting '0' will have no effect, as there is another rule to forbid using emotes completely.",
		keywords: ["restrict", "emoting", "acting", "slow", "fast"],
		triggerTexts: {
			infoBeep: "You exceeded the number of allowed emotes per minute!"
		},
		dataDefinition: {
			maxNumberOfEmotes: {
				type: "number",
				default: 42,
				description: "Maximum allowed number of emotes per minute (> 0):",
				Y: 380
			}
		},
		defaultLimit: ConditionsLimit.blocked,
		init(state) {
			let currentCount: number = 0;
			const check = (msg: SpeechMessageInfo): boolean => msg.type !== "Emote";
			registerSpeechHook({
				allowSend: (msg) => {
					if (state.customData?.maxNumberOfEmotes && state.customData.maxNumberOfEmotes !== 0 && state.isEnforced && !check(msg)) {
						if (currentCount >= state.customData.maxNumberOfEmotes) {
							state.triggerAttempt();
							return SpeechHookAllow.BLOCK;
						}
						currentCount++;
						BCX_setTimeout(() => {
							if (currentCount > 0) {
								currentCount--;
							}
						}, 60_000);
					}
					return SpeechHookAllow.ALLOW;
				}
			});
		}
	});

	registerRule("speech_restrict_whisper_send", {
		name: "Restrict sending whispers",
		type: RuleType.Speech,
		shortDescription: "except to defined roles",
		longDescription: "This rule forbids PLAYER_NAME to whisper anything to most people inside a chat room, except to the defined roles. Also affects whispered OOC messages.",
		keywords: ["limit", "forbid", "whispering", "allowlist", "block", "whitelist"],
		triggerTexts: {
			infoBeep: "You are not allowed to whisper to TARGET_PLAYER!",
			attempt_log: "PLAYER_NAME tried to whisper to TARGET_PLAYER",
			log: "PLAYER_NAME whispered to TARGET_PLAYER"
		},
		defaultLimit: ConditionsLimit.limited,
		dataDefinition: {
			minimumPermittedRole: {
				type: "roleSelector",
				default: AccessLevel.mistress,
				description: "Minimum role whispering is still allowed to:"
			}
		},
		init(state) {
			const check = (msg: SpeechMessageInfo): boolean => {
				const target = msg.target != null && getChatroomCharacter(msg.target);
				return msg.type !== "Whisper" || !target || !state.customData?.minimumPermittedRole || getCharacterAccessLevel(target) <= state.customData.minimumPermittedRole;
			};
			registerSpeechHook({
				allowSend: (msg) => {
					if (state.isEnforced && !check(msg) && msg.target != null) {
						state.triggerAttempt(msg.target);
						return SpeechHookAllow.BLOCK;
					}
					return SpeechHookAllow.ALLOW;
				},
				onSend: (msg) => {
					if (state.inEffect && !check(msg) && msg.target != null) {
						state.trigger(msg.target);
					}
				}
			});
		}
	});

	registerRule("speech_restrict_whisper_receive", {
		name: "Restrict receiving whispers",
		type: RuleType.Speech,
		loggable: false,
		shortDescription: "except from defined roles",
		longDescription: "This rule prevents PLAYER_NAME from receiving any whispers, except from the defined roles. If someone tries to send PLAYER_NAME a whisper message while this rule blocks them from doing so, they get an auto reply whisper, if the rule has an auto reply set (text field is not empty). PLAYER_NAME won't get any indication that she would have received a whisper unless the rule is not enforced, in which case she will see both the whisper and the auto reply. This rule can also be used (by dommes) to prevent getting unwanted whispers from strangers in public.",
		keywords: ["limit", "forbid", "prevent", "whispering", "hearing", "listening", "allowlist", "block", "whitelist"],
		defaultLimit: ConditionsLimit.blocked,
		dataDefinition: {
			minimumPermittedRole: {
				type: "roleSelector",
				default: AccessLevel.whitelist,
				description: "Minimum role still allowed to send whisper:",
				Y: 480
			},
			autoreplyText: {
				type: "string",
				default: "PLAYER_NAME is currently forbidden to receive whispers.",
				description: "Auto replies blocked sender with this:",
				Y: 320,
				options: /^([^/.*].*)?$/
			}
		},
		load(state) {
			hookFunction("ChatRoomMessage", 5, (args, next) => {
				const data = args[0];

				if (isObject(data) &&
					typeof data.Content === "string" &&
					data.Content !== "" &&
					data.Type === "Whisper" &&
					typeof data.Sender === "number" &&
					state.inEffect &&
					state.customData
				) {
					const character = getChatroomCharacter(data.Sender);
					if (character && getCharacterAccessLevel(character) >= state.customData.minimumPermittedRole) {
						if (state.customData.autoreplyText && !data.Content?.startsWith("[Automatic reply by BCX]\n")) {
							const msg = `[Automatic reply by BCX]\n${dictionaryProcess(state.customData.autoreplyText, {})}`;
							ServerSend("ChatRoomChat", {
								Content: msg,
								Type: "Whisper",
								Target: data.Sender
							});
							if (!state.isEnforced) {
								ChatRoomSendLocal(msg);
							}
						}
						if (state.isEnforced) return;
					}
				}
				return next(args);
			}, ModuleCategory.Rules);
		}
	});

	registerRule("speech_restrict_beep_send", {
		name: "Restrict sending beep messages",
		type: RuleType.Speech,
		shortDescription: "except to selected members",
		longDescription: "This rule forbids PLAYER_NAME to send any beeps with message, except to the defined list of member numbers. Sending beeps without a message is not affected. Optionally, it can be set that PLAYER_NAME is only forbidden to send beeps while she is unable to use her hands (e.g. fixed to a cross).",
		triggerTexts: {
			infoBeep: "You broke the rule that forbids sending a beep message to TARGET_PLAYER!",
			attempt_log: "PLAYER_NAME broke a rule by trying to send a beep message to TARGET_PLAYER",
			log: "PLAYER_NAME broke a rule by sending a beep message to TARGET_PLAYER"
		},
		keywords: ["limit", "forbid", "prevent", "whitelist", "allowlist"],
		defaultLimit: ConditionsLimit.blocked,
		dataDefinition: {
			whitelistedMemberNumbers: {
				type: "memberNumberList",
				default: [],
				description: "Member numbers still allowed to be beeped:",
				options: {
					pageSize: 2
				}
			},
			onlyWhenBound: {
				type: "toggle",
				default: false,
				description: "Only in effect when unable to use hands",
				Y: 700
			}
		},
		load(state) {
			hookFunction("FriendListBeepMenuSend", 5, (args, next) => {
				if (state.inEffect &&
					state.customData &&
					(document.getElementById("FriendListBeepTextArea") as HTMLTextAreaElement | null)?.value &&
					FriendListBeepTarget != null &&
					!state.customData.whitelistedMemberNumbers.includes(FriendListBeepTarget) &&
					(!Player.CanInteract() || !state.customData.onlyWhenBound)
				) {
					if (state.isEnforced) {
						state.triggerAttempt(FriendListBeepTarget);
						return;
					}
					state.trigger(FriendListBeepTarget);
				}
				return next(args);
			}, ModuleCategory.Rules);
		}
	});

	registerRule("speech_restrict_beep_receive", {
		name: "Restrict receiving beeps",
		type: RuleType.Speech,
		loggable: false,
		shortDescription: "and beep messages, except from selected members",
		longDescription: "This rule prevents PLAYER_NAME from receiving any beep (regardless if the beep carries a message or not), except for beeps from the defined list of member numbers. If someone tries to send PLAYER_NAME a beep message while this rule blocks them from doing so, they get an auto reply beep, if the rule has an auto reply set. PLAYER_NAME won't get any indication that she would have received a beep unless the rule is not enforced, in which case she will see both the beep and the auto reply. Optionally, the rule can be set to only activate while PLAYER_NAME is unable to use her hands (e.g. fixed to a cross).",
		keywords: ["limit", "forbid", "prevent", "reading", "whitelist", "allowlist"],
		defaultLimit: ConditionsLimit.blocked,
		dataDefinition: {
			whitelistedMemberNumbers: {
				type: "memberNumberList",
				default: [],
				description: "Member numbers still allowed to send beeps:",
				Y: 470,
				options: {
					pageSize: 2
				}
			},
			autoreplyText: {
				type: "string",
				default: "PLAYER_NAME is currently forbidden to receive beeps.",
				description: "Auto replies blocked sender with this:",
				Y: 300
			},
			onlyWhenBound: {
				type: "toggle",
				default: false,
				description: "Only in effect when unable to use hands",
				Y: 740
			}
		},
		load(state) {
			hookFunction("ServerAccountBeep", 5, (args, next) => {
				const data = args[0];

				if (isObject(data) &&
					!data.BeepType &&
					typeof data.MemberNumber === "number" &&
					state.inEffect &&
					state.customData &&
					!state.customData.whitelistedMemberNumbers.includes(data.MemberNumber) &&
					(!Player.CanInteract() || !state.customData.onlyWhenBound)
				) {
					if (state.customData.autoreplyText && (data.Message == null || (typeof data.Message === "string" && !data.Message.startsWith("[Automatic reply by BCX]\n")))) {
						const msg = `[Automatic reply by BCX]\n${dictionaryProcess(state.customData.autoreplyText, {})}`;
						ServerSend("AccountBeep", {
							MemberNumber: data.MemberNumber,
							BeepType: "",
							Message: msg,
							IsSecret: true
						});
						if (!state.isEnforced) {
							ChatRoomSendLocal(msg);
							FriendListBeepLog.push({
								MemberNumber: data.MemberNumber,
								MemberName: Player.FriendNames?.get(data.MemberNumber) || "Unknown",
								ChatRoomName: undefined,
								Sent: true,
								Private: false,
								Time: new Date(),
								Message: msg
							});
						}
					}
					if (state.isEnforced) return;
				}
				return next(args);
			}, ModuleCategory.Rules);
		}
	});

	registerRule("speech_greet_order", {
		name: "Order to greet club",
		type: RuleType.Speech,
		loggable: false,
		shortDescription: "when entering it through the login portal",
		longDescription: "PLAYER_NAME will automatically send all defined member numbers (if they are currently online and friends with PLAYER_NAME) a beep the moment PLAYER_NAME joins the club or the moment she start BCX to make her presence known. Disconnects don't count as coming into the club again, as far as detectable. NOTE: Trigger conditions should not be selected when using this rule, as if you for instance select 'when in public room' the rule will only greet when you load BCX in a public room.",
		keywords: ["beep", "loging", "in", "online"],
		triggerTexts: {
			infoBeep: "A BCX rule made you greet one or more people (if currently online) with a beep.",
			attempt_log: "",
			log: ""
		},
		defaultLimit: ConditionsLimit.blocked,
		dataDefinition: {
			toGreetMemberNumbers: {
				type: "memberNumberList",
				default: [],
				description: "Member numbers that will be greeted:"
			}
		},
		load(state) {
			if (state.isEnforced && state.customData) {
				for (const number of state.customData.toGreetMemberNumbers) {
					ServerSend("AccountBeep", {
						MemberNumber: number,
						BeepType: "",
						IsSecret: true
					});
				}
				if (state.customData.toGreetMemberNumbers.length > 0) {
					BCX_setTimeout(() => {
						state.trigger();
					}, 5_000);
				}
			}
		}
	});

	registerRule("speech_block_antigarble", {
		name: "Forbid the antigarble option",
		type: RuleType.Speech,
		shortDescription: "BCX's .antigarble command",
		longDescription: "This rule forbids PLAYER_NAME to use the antigarble command. Antigarble is a BCX feature that enables a BCX user to understand muffled voices from other gagged characters or when wearing a deafening item. If PLAYER_NAME should be forbidden to use the command, this rule should be used.",
		keywords: ["limit", "forbid", "prevent", "garbling", "deafness", "gagged", "gagtalk"],
		triggerTexts: {
			infoBeep: "You are not allowed to use the antigarble command!",
			attempt_log: "PLAYER_NAME tried to use the antigarble command",
			log: "PLAYER_NAME used the antigarble command"
		},
		defaultLimit: ConditionsLimit.normal
		// Implemented externally
	});

	/* TODO: Implement
	registerRule("speech_replace_spoken_words", {
		name: "Replace spoken words",
		type: RuleType.Speech,
		loggable: false,
		shortDescription: "with others in all chat, whisper and OOC messages",
		longDescription: "Automatically replaces specific words PLAYER_NAME uses in chat messages, whispers and OOC with another set word from a defineable a list of words with a special syntax (e.g. [Clare,Lily;Mistress],[Claudia;the maid],[I;this slut]).",
		defaultLimit: ConditionsLimit.limited,
		dataDefinition: {
			stringWithReplacingSyntax: {
				type: "string",
				default: "[I,me;this cutie],[spoken_word;replaced_with_this_word]",
				description: "List in syntax: [word1;substitute1],[w2,w3,...;s2],...",
				options: /^([^/.*()][^()]*)?$/
			}
		}
	});
	*/

	/* TODO: Implement
	// TODO: { TARGET_PLAYER: `${msg.target ? getCharacterName(msg.target, "[unknown]") : "[unknown]"} (${msg.target})` }
	registerRule("speech_using_honorifics", {
		name: "Using honorifics",
		type: RuleType.Speech,
		shortDescription: "in front of specific names in all chat, whisper and OOC messages",
		longDescription: "Define a listing of words (e.g. Miss, Mistress, ...) where one of them always needs to be typed before any one out of a listing of names (e.g. Julia, Eve, ...) in all chat, whisper and OOC messages. Needs a certain syntax (e.g. [Goddess,Mistress;Lily,Clare],[slut;Mona], ...)",
		triggerTexts: {
			infoBeep: "You broke a rule to always use a honorific when speaking TARGET_PLAYER's name!",
			attempt_log: "PLAYER_NAME almost broke a rule by forgetting to be polite to TARGET_PLAYER",
			log: "PLAYER_NAME broke a rule by forgetting to be polite to TARGET_PLAYER"
		},
		defaultLimit: ConditionsLimit.normal,
		dataDefinition: {
			stringWithRuleSyntax: {
				type: "string",
				default: "",
				description: "List in syntax: [honorific1;name1],[h2,h3,...;n2,n3,...],...",
				options: /^([^/.*()\s][^()]*)?$/
			}
		}
	});
	*/

	registerRule("speech_force_retype", {
		name: "Force to retype",
		type: RuleType.Speech,
		loggable: false,
		shortDescription: "if sending a message in chat is rejected by BCX due to a rule violation",
		longDescription: "This rule forces PLAYER_NAME to retype any chat/whisper/emote/OOC message as a punishment when they try to send it and another enforced BCX speech rule determines that there is any rule violation in that message.",
		keywords: ["punish", "retry", "clear", "input", "blocked", "forbidden"],
		defaultLimit: ConditionsLimit.limited
		// Implemented externally
	});

	let alreadyGreeted = false;
	let lastRoomName: string = "";
	registerRule("greet_room_order", {
		name: "Order to greet room",
		type: RuleType.Speech,
		shortDescription: "with a settable sentence when entering it newly",
		longDescription: "Sets a specific sentence that PLAYER_NAME must say loud after entering a room that is not empty. The sentence is autopopulating the chat window text input. When to say it is left to PLAYER_NAME, but when the rule is enforced, it is the only thing that can be said in this room after joining it. Emotes can still be used, though, unless toggled to be forbidden. Disconnects don't count as coming into a new room again, as far as detectable.",
		keywords: ["say", "present", "introduce"],
		triggerTexts: {
			infoBeep: "You broke the rule to greet this room like taught!",
			attempt_infoBeep: "You need to greet this room like taught!",
			attempt_log: "PLAYER_NAME almost broke a rule by not greeting the room like taught",
			log: "PLAYER_NAME broke a rule by not greeting the room like taught"
		},
		defaultLimit: ConditionsLimit.limited,
		dataDefinition: {
			greetingSentence: {
				type: "string",
				default: "",
				description: "The sentence that has to be used to greet any joined room:",
				options: /^([^/.*()\s][^()]*)?$/
			},
			affectEmotes: {
				type: "toggle",
				default: false,
				description: "Also forbid emote messages before greeting",
				Y: 560
			}
		},
		load(state) {
			// 1. hook ChatRoomSync to set alreadyGreeted to false if the room name is different from the one stored locally
			hookFunction("ChatRoomSync", 0, (args, next) => {
				const data = args[0];
				if (data.Name !== lastRoomName) alreadyGreeted = false;
				next(args);
				// 2. populate chat field with the default text from the rule
				const chat = document.getElementById("InputChat") as HTMLTextAreaElement | null;
				if (chat && state.customData && state.inEffect && !alreadyGreeted && data.Name !== lastRoomName) {
					chat.value = state.customData.greetingSentence;
				} else {
					alreadyGreeted = true;
				}
			}, ModuleCategory.Rules);
		},
		// 3. do not allow sending anything else when enforced
		init(state) {
			const check = (msg: SpeechMessageInfo): boolean => (
				(msg.noOOCMessage ?? msg.originalMessage).toLocaleLowerCase() === state.customData?.greetingSentence.trim().toLocaleLowerCase() &&
				msg.type === "Chat"
			);
			registerSpeechHook({
				allowSend: (msg) => {
					if (state.isEnforced &&
						state.customData?.greetingSentence.trim() &&
						!alreadyGreeted &&
						(msg.type !== "Emote" || (msg.type === "Emote" && state.customData.affectEmotes))
					) {
						lastRoomName = ChatRoomData.Name;
						// 4. set alreadyGreeted to true and overwrite lastRoomName
						if (check(msg)) {
							alreadyGreeted = true;
							return SpeechHookAllow.ALLOW_BYPASS;
						} else {
							state.triggerAttempt();
							ChatRoomSendLocal(`You are expected to greet the room with "${state.customData?.greetingSentence}".`);
							return SpeechHookAllow.BLOCK;
						}
					}
					return SpeechHookAllow.ALLOW;
				},
				onSend: (msg) => {
					if (msg.type === "Emote") {
						return;
					}
					if (state.inEffect &&
						state.customData?.greetingSentence.trim() &&
						!alreadyGreeted
					) {
						if (!check(msg)) {
							state.trigger();
						}
						alreadyGreeted = true;
					}
				}
			});
		}
	});

	registerRule("greet_new_guests", {
		name: "Greet new guests",
		type: RuleType.Speech,
		loggable: false,
		shortDescription: "when they join the current room",
		longDescription: "Forces PLAYER_NAME to greet people newly entering the current chat room with the set sentence. NOTE: Only PLAYER_NAME and the new guest can see the message not to make it spammy. After a new person has been greeted, she will not be greeted for 10 minutes after she left (including disconnect) the room PLAYER_NAME is in. Setting an emote as a greeting is also supported by starting the set message with one or two '*' characters.",
		keywords: ["say", "present", "introduce"],
		defaultLimit: ConditionsLimit.limited,
		dataDefinition: {
			greetingSentence: {
				type: "string",
				default: "",
				description: "The sentence that will be used to greet new guests:",
				options: /^([^/.].*)?$/
			}
		},
		load(state) {
			const GREET_DELAY = 600_000;
			const nextGreet: Map<number, number> = new Map();
			hookFunction("ChatRoomSyncMemberLeave", 2, (args, next) => {
				next(args);
				const R = args[0] as Record<string, number>;
				if (nextGreet.has(R.SourceMemberNumber)) {
					nextGreet.set(R.SourceMemberNumber, Date.now() + GREET_DELAY);
				}
			}, ModuleCategory.Rules);
			hookFunction("ChatRoomAddCharacterToChatRoom", 3, (args, next) => {
				const size = ChatRoomCharacter.length;
				next(args);
				if (state.customData && state.isEnforced && size < ChatRoomCharacter.length) {
					const C = args[0] as Character;
					if (C.MemberNumber !== undefined &&
						nextGreet.has(C.MemberNumber) &&
						nextGreet.get(C.MemberNumber)! < Date.now()
					) {
						nextGreet.delete(C.MemberNumber);
					}
					BCX_setTimeout(() => {
						if (!state.customData ||
							!state.isEnforced ||
							!ChatRoomCharacter.includes(C) ||
							C.MemberNumber === undefined ||
							(
								nextGreet.has(C.MemberNumber) &&
								nextGreet.get(C.MemberNumber)! >= Date.now()
							)
						) return;
						nextGreet.set(C.MemberNumber, 0);
						if (state.customData.greetingSentence.startsWith("*")) {
							const message = state.customData.greetingSentence.slice(1);
							ServerSend("ChatRoomChat", { Content: message, Type: "Emote", Target: C.MemberNumber });
							ServerSend("ChatRoomChat", { Content: message, Type: "Emote", Target: Player.MemberNumber });
						} else {
							ServerSend("ChatRoomChat", { Content: state.customData.greetingSentence, Type: "Chat", Target: C.MemberNumber });
							ServerSend("ChatRoomChat", { Content: state.customData.greetingSentence, Type: "Chat", Target: Player.MemberNumber });
						}
					}, 5_000);
				}
			}, ModuleCategory.Rules);
		}
	});

	// Restrained speech:
	// the wearer is unable to speak freely, she is given a set of sentences/targets allowed and can only use those with the #name talk command.
	// The given sentences can contain the %target% placeholder to have the target inserted into the sentence. The given sentences can contain
	// the %self% placeholder which will be replaced by the given "self" attribute. By default it is "I", but could be changed to something else
	// to avoid having to rewrite all the sentences. WARNING: a target id and a message id always needs to be specified. Therefore, you will be
	// softlocked/muted if this mode is enabled and you remove all sentences and/or targets.
	/* TODO: Implement
	registerRule("speech_restrained_speech", {
		name: "Restrained speech",
		type: RuleType.Speech,
		shortDescription: "only the set sentences are allowed to be spoken",
		// TODO: needs an updated describing the special wildcards or placeholders that can be used
		longDescription: "This rule no longer allows PLAYER_NAME to speak freely, she is given a set of sentences allowed and can only use those in chat and whispers. Does not affect OOC.",
		triggerTexts: {
			infoBeep: "You broke a rule by not using one of the allowed phrases for you!",
			attempt_log: "PLAYER_NAME broke a rule by trying to not use one of the allowed phrases",
			log: "PLAYER_NAME broke a rule by not using one of the allowed phrases"
		},
		defaultLimit: ConditionsLimit.blocked,
		dataDefinition: {
			listOfAllowedSentences: {
				type: "stringList",
				default: [],
				// TODO: needs an update describing the special wildcards or placeholders that can be used
				description: "Only these phrases are still allowed:",
				options: {
					validate: /^([^/.*()][^()]*)?$/ // TODO: adjust
				}
			}
		}
	});
	*/

	registerRule("speech_alter_faltering", {
		name: "Enforce faltering speech",
		type: RuleType.Speech,
		loggable: false,
		shortDescription: "an enhanced studder effect is added to PLAYER_NAME's chat texts",
		longDescription: "Thus rule converts PLAYER_NAME's messages, so she is only able to speak studdering and with random filler sounds, for some [RP] reason (anxiousness, arousal, fear, etc.). Converts the typed chat text automatically. Affects chat messages and whispers, but not OOC.",
		keywords: ["garble", "saying", "talking"],
		defaultLimit: ConditionsLimit.limited,
		init(state) {
			registerSpeechHook({
				modify: (msg, text) => {
					if (state.inEffect && (msg.type === "Chat" || msg.type === "Whisper")) {
						return falteringSpeech(text);
					} else {
						return text;
					}
				}
			});
		}
	});

	registerRule("speech_mandatory_words", {
		name: "Establish mandatory words",
		type: RuleType.Speech,
		shortDescription: "of which at least one needs to always be included when speaking",
		longDescription: "This rule gives PLAYER_NAME a list of words from which at least one has to always be used in any chat message. The list of mandatory words can be configured. Checks are not case sensitive (adding 'miss' also works for 'MISS' and 'Miss' - Note: 'Miiiiissss' would also match). Doesn't affect whispers, emotes and OOC text. There is a toggle for affecting whispers, too.",
		keywords: ["force", "require", "talking", "saying", "certain", "specific"],
		triggerTexts: {
			infoBeep: "You forgot to include one of the mandatory words!",
			attempt_log: "PLAYER_NAME almost forgot to use a mandatory word while talking",
			log: "PLAYER_NAME did not use a mandatory word while talking"
		},
		defaultLimit: ConditionsLimit.normal,
		dataDefinition: {
			mandatoryWords: {
				type: "stringList",
				default: [],
				description: "At least one of these words always needs to be used:",
				options: {
					validate: /^[\p{L} ]*$/iu,
					pageSize: 3
				}
			},
			affectWhispers: {
				type: "toggle",
				default: false,
				description: "Also affect whispered messages",
				Y: 740
			}
		},
		init(state) {
			const check = (msg: SpeechMessageInfo): boolean => {
				if (
					(msg.type !== "Chat" &&
						!(
							(msg.type === "Whisper" && !(msg.originalMessage.startsWith("!") && !msg.originalMessage.startsWith("!!"))) && state.customData?.affectWhispers
						)
					) || !state.customData?.mandatoryWords?.length)
					return true;
				const checkMsg = (msg.noOOCMessage ?? msg.originalMessage).toLocaleLowerCase();
				const sounds = state.customData?.mandatoryWords.filter(e => /^[\p{L}]*$/iu.test(e));
				if (checkMsg.trim() === "") {
					return true;
				}
				return state.customData?.mandatoryWords.some(i =>
					checkMsg.match(
						new RegExp(`([^\\p{L}]|^)${escapeRegExp(i.trim())}([^\\p{L}]|$)`, "iu")
					)
				) || checkMsg.split(/[^\p{L}]+/u).some(i => checkMessageForSounds(sounds, i, false));
			};
			registerSpeechHook({
				allowSend: (msg) => {
					if (state.isEnforced && !check(msg)) {
						state.triggerAttempt();
						return SpeechHookAllow.BLOCK;
					}
					return SpeechHookAllow.ALLOW;
				},
				onSend: (msg) => {
					if (state.inEffect && !check(msg)) {
						state.trigger();
					}
				}
			});
		}
	});

	registerRule("speech_mandatory_words_in_emotes", {
		name: "Establish mandatory words in emotes",
		type: RuleType.Speech,
		shortDescription: "of which at least one needs to always be included",
		longDescription: "This rule gives PLAYER_NAME a list of words from which at least one has to always be used in any emote message. The list of mandatory words can be configured. Checks are not case sensitive (adding 'miss' also works for 'MISS' and 'Miss' - Note: 'Miiiiissss' would also match).",
		keywords: ["force", "require", "talking", "saying", "certain", "specific"],
		triggerTexts: {
			infoBeep: "You forgot to include one of the mandatory words!",
			attempt_log: "PLAYER_NAME almost forgot to use a mandatory word while talking",
			log: "PLAYER_NAME did not use a mandatory word while talking"
		},
		defaultLimit: ConditionsLimit.blocked,
		dataDefinition: {
			mandatoryWords: {
				type: "stringList",
				default: [],
				description: "At least one of these words always needs to be used:",
				options: {
					validate: /^[\p{L} ]*$/iu
				}
			}
		},
		init(state) {
			const check = (msg: SpeechMessageInfo): boolean => {
				if (msg.type !== "Emote" || !state.customData?.mandatoryWords?.length)
					return true;
				const checkMsg = (msg.noOOCMessage ?? msg.originalMessage).toLocaleLowerCase();
				const sounds = state.customData?.mandatoryWords.filter(e => /^[\p{L}]*$/iu.test(e));
				if (checkMsg.trim() === "") {
					return true;
				}
				return state.customData?.mandatoryWords.some(i =>
					checkMsg.match(
						new RegExp(`([^\\p{L}]|^)${escapeRegExp(i.trim())}([^\\p{L}]|$)`, "iu")
					)
				) || checkMsg.split(/[^\p{L}]+/u).some(i => checkMessageForSounds(sounds, i, false));
			};
			registerSpeechHook({
				allowSend: (msg) => {
					if (state.isEnforced && !check(msg)) {
						state.triggerAttempt();
						return SpeechHookAllow.BLOCK;
					}
					return SpeechHookAllow.ALLOW;
				},
				onSend: (msg) => {
					if (state.inEffect && !check(msg)) {
						state.trigger();
					}
				}
			});
		}
	});

	registerRule("speech_partial_hearing", {
		name: "Partial hearing",
		type: RuleType.Speech,
		shortDescription: "of muffled speech - random & word list based",
		longDescription: "This rule gives PLAYER_NAME ability to understand parts of a muffled sentence ungarbled, based on a white list of words and/or randomly. On default, applies only to muffled hearing from deafening effects on PLAYER_NAME, but optionally can be enhanced to allow also partially understanding the muffled speech of other persons who are speech impaired. Doesn't affect emotes and OOC text.",
		keywords: ["deafness", "garbling", "antigarble", "understanding", "ungarble", "specific", "words", "whitelist", "allowlist"],
		loggable: false,
		defaultLimit: ConditionsLimit.normal,
		dataDefinition: {
			alwaysUnderstandableWords: {
				type: "stringList",
				default: [],
				description: "Words that can always be understood:",
				options: {
					validate: /^[\p{L}]*$/iu,
					pageSize: 3
				}
			},
			randomUnderstanding: {
				type: "toggle",
				default: true,
				description: "Some words are randomly understood",
				Y: 650
			},
			affectGaggedMembersToggle: {
				type: "toggle",
				default: false,
				description: "Can also understand gagged persons",
				Y: 740
			}
		},
		load(state) {
			hookFunction("SpeechGarble", 2, (args, next) => {
				const C = args[0] as Character;
				if (!state.isEnforced ||
					(
						!C.CanTalk() &&
						state.customData &&
						!state.customData.affectGaggedMembersToggle
					)
				)
					return next(args);
				return (args[1] as string).replace(/\([^)]+\)?|\p{L}+/gmui, (word) => {
					if (word.startsWith("(")) {
						return word;
					} if (state.customData?.randomUnderstanding && Math.random() < 0.25) {
						return word;
					} else if (state.customData?.alwaysUnderstandableWords.some(
						(str) => word.toLocaleLowerCase() === str.toLocaleLowerCase())) {
						return word;
					} else {
						return callOriginal("SpeechGarble", [args[0], word, args[2]]);
					}
				});
			}, ModuleCategory.Rules);
		}
	});
}
