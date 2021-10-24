import { ConditionsLimit, ModuleCategory } from "../constants";
import { registerRule } from "../modules/rules";
import { AccessLevel, getCharacterAccessLevel } from "../modules/authority";
import { registerSpeechHook, SpeechMessageInfo, falteringSpeech } from "../modules/speech";
import { callOriginal, hookFunction } from "../patching";
import { getChatroomCharacter } from "../characters";
import { isObject } from "../utils";
import { getCharacterName } from "../utilsClub";

export function initRules_bc_speech_control() {
	registerRule("speech_specific_sound", {
		name: "Allow specific sound only",
		icon: "Icons/Chat.png",
		shortDescription: "such as an animal sound",
		longDescription: "This rule allows PLAYER_NAME to only communicate using a specific sound pattern. Any variation of it is allowed as long as the letters are in order. (Example: if the set sound is 'Meow', then this is a valid message: 'Me..ow? meeeow! mmeooowwwwwww?! meow. me.. oo..w ~')",
		triggerTexts: {
			infoBeep: "You are allowed to speak only using a specific sound!",
			attempt_log: "PLAYER_NAME tried to break a rule to only speak using a specific sound pattern",
			log: "PLAYER_NAME broke a rule to only speak using a specific sound pattern"
		},
		defaultLimit: ConditionsLimit.normal,
		dataDefinition: {
			soundWhitelist: {
				type: "string",
				default: "",
				description: "Set the allowed sound:"
			}
		},
		init(state) {
			const check = (msg: SpeechMessageInfo): boolean => {
				const sound = state.customData?.soundWhitelist.toLocaleLowerCase();
				if (sound && msg.type === "Chat") {
					let i = 0;
					for (const c of (msg.noOOCMessage ?? msg.originalMessage).toLocaleLowerCase()) {
						if (/\p{L}/igu.test(c)) {
							const nx = sound[(i + 1) % sound.length];
							if (c === nx) {
								i = (i + 1) % sound.length;
							} else if (c !== sound[i]) {
								return false;
							}
						}
					}
				}
				return true;
			};
			registerSpeechHook({
				allowSend: (msg) => {
					if (state.isEnforced && !check(msg)) {
						state.triggerAttempt();
						return false;
					}
					return true;
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
		icon: "Icons/Chat.png",
		loggable: false,
		shortDescription: "same as normal messages",
		longDescription: "This rule alters PLAYER_NAME's outgoing whisper messages while gagged to be garbled the same way normal chat messages are. This means, that strength of the effect depends on the type of gag and (OOC text) is not affected.",
		defaultLimit: ConditionsLimit.limited,
		init(state) {
			registerSpeechHook({
				modify: (info, message) => state.isEnforced && info.type === "Whisper" ? callOriginal("SpeechGarble", [Player, message, true]) : message
			});
		}
	});

	registerRule("speech_block_gagged_ooc", {
		name: "Block OOC chat while gagged",
		icon: "Icons/Chat.png",
		shortDescription: "no more misuse of OOC for normal chatting while gagged",
		longDescription: "This rule forbids PLAYER_NAME to use OOC (messages between round brackets) in chat or OOC whisper messages while she is gagged.",
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
						return false;
					}
					return true;
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
		icon: "Icons/Chat.png",
		shortDescription: "blocks use of OOC in messages",
		longDescription: "This rule forbids PLAYER_NAME to use OOC (messages between round brackets) in chat or OOC whisper messages at any moment. This is a very extreme rule and should be used with great caution!",
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
						return false;
					}
					return true;
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
		icon: "Icons/Chat.png",
		shortDescription: "allows only short sentences with simple words",
		longDescription: "This rule forbids PLAYER_NAME to use any words longer than set limit and limits number of words too. Both limits are configurable independantly. Doesn't affect OOC text.",
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
				if (msg.type !== "Chat" || !state.customData?.maxWordLength || !state.customData.maxNumberOfWords)
					return true;
				const words = Array.from((msg.noOOCMessage ?? msg.originalMessage).matchAll(/\S+/gmu)).map(i => i[0]);
				if (words.length > state.customData.maxNumberOfWords)
					return false;
				if (words.some(word => word.length > state.customData!.maxWordLength))
					return false;
				return true;
			};
			registerSpeechHook({
				allowSend: (msg) => {
					if (state.isEnforced && !check(msg)) {
						state.triggerAttempt();
						return false;
					}
					return true;
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
		icon: "Icons/Chat.png",
		shortDescription: "based on a configurable blacklist",
		longDescription: "This rule forbids PLAYER_NAME to use certain words in the chat. The list of banned words can be configured. Checks are not case sensitive (forbidding 'no' also forbids 'NO' and 'No'). Doesn't affect OOC text.",
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
				description: "All forbidden words:"
			}
		},
		init(state) {
			let transgression: undefined | string;
			const check = (msg: SpeechMessageInfo): boolean => {
				if (msg.type !== "Chat" || !state.customData?.bannedWords)
					return true;
				const words = Array.from((msg.noOOCMessage ?? msg.originalMessage).toLocaleLowerCase().matchAll(/\p{L}+/igu)).map(i => i[0]);
				transgression = state.customData?.bannedWords.find(i => words.includes(i.toLocaleLowerCase()));
				return transgression === undefined;
			};
			registerSpeechHook({
				allowSend: (msg) => {
					if (state.isEnforced && !check(msg) && transgression !== undefined) {
						state.triggerAttempt({ USED_WORD: transgression });
						return false;
					}
					return true;
				},
				onSend: (msg) => {
					if (state.inEffect && !check(msg) && transgression !== undefined) {
						state.trigger({ USED_WORD: transgression });
					}
				}
			});
		}
	});

	registerRule("speech_forbid_open_talking", {
		name: "Forbid talking openly",
		icon: "Icons/Chat.png",
		shortDescription: "in a chat room",
		longDescription: "This rule forbids PLAYER_NAME to send any message to all people inside a chat room. Does not affect whispers or emotes, but does affect OOC.",
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
						return false;
					}
					return true;
				},
				onSend: (msg) => {
					if (state.inEffect && !check(msg)) {
						state.trigger();
					}
				}
			});
		}
	});

	registerRule("speech_restrict_whispering", {
		name: "Restrict whispering",
		icon: "Icons/Chat.png",
		shortDescription: "except to defined roles",
		longDescription: "This rule forbids PLAYER_NAME to whisper anything to most people inside a chat room, except to the defined roles. Also affects whispered OOC messages.",
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
				const target = msg.target && getChatroomCharacter(msg.target);
				return msg.type !== "Whisper" || !target || !state.customData?.minimumPermittedRole || getCharacterAccessLevel(target) <= state.customData.minimumPermittedRole;
			};
			registerSpeechHook({
				allowSend: (msg) => {
					if (state.isEnforced && !check(msg)) {
						state.triggerAttempt({ TARGET_PLAYER: `${msg.target ? getCharacterName(msg.target, "[unknown]") : "[unknown]"} (${msg.target})` });
						return false;
					}
					return true;
				},
				onSend: (msg) => {
					if (state.inEffect && !check(msg)) {
						state.trigger({ TARGET_PLAYER: `${msg.target ? getCharacterName(msg.target, "[unknown]") : "[unknown]"} (${msg.target})` });
					}
				}
			});
		}
	});

	registerRule("speech_restrict_beep_send", {
		name: "Restrict sending beep messages",
		icon: "Icons/Chat.png",
		shortDescription: "except to selected members",
		longDescription: "This rule forbids PLAYER_NAME to send any beeps with message, except to the defined list of member numbers. Sending beeps without a message is not affected.",
		triggerTexts: {
			infoBeep: "You broke the rule that forbids sending a beep message to TARGET_PLAYER!",
			attempt_log: "PLAYER_NAME broke a rule by trying to send a beep message to TARGET_PLAYER",
			log: "PLAYER_NAME broke a rule by sending a beep message to TARGET_PLAYER"
		},
		defaultLimit: ConditionsLimit.blocked,
		dataDefinition: {
			whitelistedMemberNumbers: {
				type: "memberNumberList",
				default: [],
				description: "Member numbers still allowed to be beeped:"
			}
		},
		load(state) {
			hookFunction("FriendListBeepMenuSend", 5, (args, next) => {
				if (state.inEffect &&
					state.customData?.whitelistedMemberNumbers &&
					(document.getElementById("FriendListBeepTextArea") as HTMLTextAreaElement | null)?.value &&
					FriendListBeepTarget != null &&
					!state.customData.whitelistedMemberNumbers.includes(FriendListBeepTarget)
				) {
					if (state.isEnforced) {
						state.triggerAttempt({ TARGET_PLAYER: `${getCharacterName(FriendListBeepTarget, "[unknown]")} (${FriendListBeepTarget})` });
						return;
					}
					state.trigger({ TARGET_PLAYER: `${getCharacterName(FriendListBeepTarget, "[unknown]")} (${FriendListBeepTarget})` });
				}
				return next(args);
			}, ModuleCategory.Rules);
		}
	});

	registerRule("speech_restrict_beep_receive", {
		name: "Restrict recieving beeps",
		icon: "Icons/Chat.png",
		loggable: false,
		shortDescription: "and beep messages, except from selected members",
		longDescription: "This rule prevents PLAYER_NAME from receiving any beep (regardless if the beep carries a message or not), except for beeps from the defined list of member numbers. If someone tries to send PLAYER_NAME a beep message while this rule blocks them from doing so, they get an auto reply beep, if the rule has an auto reply set. PLAYER_NAME won't get any indication that she should have received a beep.",
		defaultLimit: ConditionsLimit.blocked,
		dataDefinition: {
			whitelistedMemberNumbers: {
				type: "memberNumberList",
				default: [],
				description: "Member numbers still allowed to send beeps:",
				Y: 430
			},
			autoreplyText: {
				type: "string",
				default: "",
				description: "Auto replies blocked sender with this:",
				Y: 280
			}
		},
		load(state) {
			hookFunction("ServerAccountBeep", 5, (args, next) => {
				const data = args[0];

				if (isObject(data) &&
					!data.BeepType &&
					typeof data.MemberNumber === "number" &&
					state.isEnforced &&
					state.customData?.whitelistedMemberNumbers &&
					!state.customData?.whitelistedMemberNumbers.includes(data.MemberNumber)
				) {
					if (state.customData.autoreplyText) {
						ServerSend("AccountBeep", {
							MemberNumber: data.MemberNumber,
							BeepType: "",
							Message: `[Automatic message by BCX]\n${state.customData.autoreplyText}`
						});
					}
					state.triggerAttempt({ TARGET_PLAYER: `${data.MemberName} (${data.MemberNumber})` });
					return;
				}
				return next(args);
			}, ModuleCategory.Rules);
		}
	});

	/* TODO: Implement
	registerRule("greet_order", {
		name: "Order to greet club",
		icon: "Icons/Chat.png",
		loggable: false,
		shortDescription: "when entering it through the login portal",
		longDescription: "PLAYER_NAME will automatically send all defined member numbers a beep the moment they join the club to make their presence known. Disconnects don't count as coming into the club again, as far as detectable.",
		triggerTexts: {
			infoBeep: "A BCX rule made you greet one or more people by sending a beep.",
			attempt_log: "",
			log: ""
		},
		defaultLimit: ConditionsLimit.limited,
		dataDefinition: {
			toGreetMemberNumbers: {
				type: "memberNumberList",
				default: [],
				description: "Member numbers that will be greeted:"
			}
		}
	});
	*/

	registerRule("speech_block_antigarble", {
		name: "Forbid the antigarble option",
		icon: "Icons/Chat.png",
		shortDescription: "BCX's .antigarble command",
		longDescription: "This rule forbids PLAYER_NAME to use the antigarble command. Antigarble is a BCX feature that enables a BCX user to understand muffled voices from other gagged characters or when wearing a deafening item. If PLAYER_NAME should not be able to understand speech-garbled chat, this rule should be used.",
		triggerTexts: {
			infoBeep: "You are not allowed to use the antigarble command!",
			attempt_log: "PLAYER_NAME tried to use the antigarble command",
			log: "PLAYER_NAME used the antigarble command"
		},
		defaultLimit: ConditionsLimit.normal
		// Implmented externally
	});

	/* TODO: Implement
	registerRule("replace_spoken_words", {
		name: "Replace spoken words",
		icon: "Icons/Chat.png",
		loggable: false,
		shortDescription: "with others in all chat, whisper and OOC messages",
		longDescription: "Automatically replaces specific words PLAYER_NAME uses in chat messages, whispers and OOC with another set word from a defineable a list of words with a special syntax (e.g. [Clare,Lily;Mistress],[Claudia;the maid],[I;this slut]).",
		defaultLimit: ConditionsLimit.limited,
		dataDefinition: {
			stringWithReplacingSyntax: {
				type: "string",
				default: "[I,me;this cutie],[spoken_word;replaced_with_this_word]",
				description: "List in syntax: [word1;substitute1],[w2,w3,...;s2],..."
			}
		}
	});
	*/

	/* TODO: Implement
	// TODO: { TARGET_PLAYER: `${msg.target ? getCharacterName(msg.target, "[unknown]") : "[unknown]"} (${msg.target})` }
	registerRule("using_honorifics", {
		name: "Using honorifics",
		icon: "Icons/Chat.png",
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
				description: "List in syntax: [honorific1;name1],[h2,h3,...;n2,n3,...],..."
			}
		}
	});
	*/

	registerRule("speech_force_retype", {
		name: "Force to retype",
		icon: "Icons/Chat.png",
		loggable: false,
		shortDescription: "if sending a message in chat is rejected by BCX due to a rule violation",
		longDescription: "This rule forces PLAYER_NAME to retype any chat/whisper/emote/OOC message as a punishment when they try to send it and another enforced BCX speech rule determines that there is any rule violation in that message.",
		defaultLimit: ConditionsLimit.limited
		// Implmented externally
	});

	/* TODO: Implement
	registerRule("greet_room_order", {
		name: "Order to greet room",
		icon: "Icons/Chat.png",
		shortDescription: "with a settable sentence when entering it newly",
		longDescription: "Sets a specific sentence that PLAYER_NAME must say loud after entering a room that is not empty. The sentence is autopopulating the chat window text input. When to say it is left to PLAYER_NAME, but when the rule is enforced, it is the only thing that can be said in this room after joining it. Disconnects don't count as coming into a new room again, as far as detectable.",
		triggerTexts: {
			infoBeep: "You broke the rule to greet this room as expected!",
			attempt_infoBeep: "You tried to break the rule to greet this room as expected!",
			attempt_log: "PLAYER_NAME almost broke a rule by not greeting the room in the way taught",
			log: "PLAYER_NAME broke a rule by not greeting the room in the way taught"
		},
		defaultLimit: ConditionsLimit.limited,
		dataDefinition: {
			greetingSentence: {
				type: "string",
				default: "",
				description: "The sentence that has to be used to greet any joined room:"
			}
		}
	});
	*/

	// Restrained speech:
	// the wearer is unable to speak freely, she is given a set of sentences/targets allowed and can only use those with the #name talk command.
	// The given sentences can contain the %target% placeholder to have the target inserted into the sentence. The given sentences can contain
	// the %self% placeholder which will be replaced by the given "self" attribute. By default it is "I", but could be changed to something else
	// to avoid having to rewrite all the sentences. WARNING: a target id and a message id always needs to be specified. Therefore, you will be
	// softlocked/muted if this mode is enabled and you remove all sentences and/or targets.
	/* TODO: Implement
	registerRule("restrained_speech", {
		name: "Restrained speech",
		icon: "Icons/Chat.png",
		shortDescription: "only the set sentences are allowed to be spoken",
		// TODO: needs an updatd describing the special wildcards or placeholders that can be used
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
				description: "Only these phrases are still allowed:"
			}
		}
	});
	*/

	registerRule("speech_alter_faltering", {
		name: "Enforce faltering speech",
		icon: "Icons/Chat.png",
		loggable: false,
		shortDescription: "chat text is converted to a faltering voice",
		longDescription: "Thus rule converts PLAYER_NAME's messages, so she is only able to speak studdering and with random filler sounds, for some [RP] reason (anxiousness, arousal, fear, etc.). Converts the typed chat text automatically. Affects chat messages and whispers, but not OOC.",
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

}