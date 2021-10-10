import { ConditionsLimit } from "../constants";
import { registerRule } from "../modules/rules";
import { AccessLevel } from "../modules/authority";

export function initRules_bc_speech_control() {
	registerRule("allow_set_sound_only", {
		name: "Allow specific sounds only",
		icon: "Icons/Chat.png",
		shortDescription: "such as an animal sound",
		longDescription: "Only allowed to communicate using a specific sound pattern. Any variation of it is allowed as long as the letters are in order. Therefore if your sound is 'Meow' this is a valid message: 'Me..ow? meeeow! mmeooowwwwwww?! meow. me.. oo..w ~'",
		defaultLimit: ConditionsLimit.limited,
		dataDefinition: {
			soundWhitelist: {
				type: "string",
				default: "", //default should be the previous string
				description: "Set the allowed sound:"
			}
		}
	});

	registerRule("garble_gagged_whispers", {
		name: "Speech garble gagged whispers",
		icon: "Icons/Chat.png",
		loggable: false,
		shortDescription: "as it should be when gagged! ",
		longDescription: "Speech garbles PLAYER_NAMEs outgoing whisper messages while gagged. Strength of the effect depends on the type of gag.",
		defaultLimit: ConditionsLimit.normal
	});

	registerRule("block_OOC_while_gagged", {
		name: "Block OOC chat while gagged",
		icon: "Icons/Chat.png",
		loggable: false,
		shortDescription: "no more misuse of OOC for normal chatting while gagged",
		longDescription: "Prevents any use of OOC (messages between round brackets) chat messages or whisper messages while PLAYER_NAME is gagged.",
		defaultLimit: ConditionsLimit.blocked
	});

	registerRule("doll_talk", {
		name: "Doll talk",
		icon: "Icons/Chat.png",
		shortDescription: "allows only short sentences with simple words",
		longDescription: "Any typed message is only allowed to consist of a settable maximum length of words and each typed word of that message has a settable maximum character limit.",
		defaultLimit: ConditionsLimit.limited,
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
		}
	});

	registerRule("banning_words", {
		name: "Ban certain words in chat",
		icon: "Icons/Chat.png",
		shortDescription: "based on a configurable blacklist",
		longDescription: "Prevents/logs the usage of certain words in the chat. Trying to send a sentence with a banned word will be rejected or logged. The list of banned words can be configured for the rule. Checks are not case sensitive.",
		defaultLimit: ConditionsLimit.normal,
		dataDefinition: {
			bannedWords: {
				type: "stringList",
				default: ["I"], //default should be the previous list
				description: "All forbidden words:"
			}
		}
	});

	// also blocks OOC chat
	registerRule("forbid_talking", {
		name: "Forbid talking",
		icon: "Icons/Chat.png",
		shortDescription: "openly in a chat room",
		longDescription: "Prevents PLAYER_NAME from sending any text to all people inside a chat room and/or logs it. Does not affect whispers or emotes, but does affect OOC.",
		defaultLimit: ConditionsLimit.limited
	});

	// also blocks OOC whispers
	registerRule("restricted_whispering", {
		name: "Restrict whispering",
		icon: "Icons/Chat.png",
		shortDescription: "inside chat room - except to defined roles",
		longDescription: "Logs and/or prevents PLAYER_NAME from whispering any text to most people inside a chat room, except the defined roles. Does also affect whispered OOC messages.",
		defaultLimit: ConditionsLimit.limited,
		dataDefinition: {
			minimumPermittedRole: {
				type: "roleSelector",
				default: AccessLevel.mistress,
				description: "Minimum role whispering is still allowed to:"
			}
		}
	});

	registerRule("forbid_beeping", {
		name: "Restrict beep messages",
		icon: "Icons/Chat.png",
		shortDescription: "sending and recieving, except to/from whitelisted members",
		longDescription: "Logs and/or prevents PLAYER_NAME from sending and recieving any beep messages, except to the editable white list of member numbers who can still send PLAYER_NAME beep messages and can recieve them also. If someone tries to send PLAYER_NAME a beep message while this rule is in effect, they get an auto reply that there is currently a BCX rule in effect that blocks them from recieving beep message.",
		defaultLimit: ConditionsLimit.blocked,
		dataDefinition: {
			whitelistedMemberNumbers: {
				type: "memberNumberList",
				default: [],
				description: "Member numbers still allowed to beep (to):"
			}
		}
	});

	registerRule("greet_order", {
		name: "Order to greet club",
		icon: "Icons/Chat.png",
		loggable: false,
		shortDescription: "when entering it through the login portal",
		longDescription: "PLAYER_NAME will automatically send all defined member numbers a beep the moment they join the club to make their presence known.",
		defaultLimit: ConditionsLimit.limited,
		dataDefinition: {
			toGreetMemberNumbers: {
				type: "memberNumberList",
				default: [],
				description: "Member numbers that will be greeted:"
			}
		}
	});

	registerRule("forbid_antigarble", {
		name: "Forbid the antigarble option",
		icon: "Icons/Chat.png",
		shortDescription: "BCX's .antigarble command",
		longDescription: "Prevents/logs PLAYER_NAME from using the antigarble command in the help chat menu. Antigarble is a BCX feature that enables a BCX user to understand muffled voices from other gagged characters or when PLAYER_NAME wears a deafening item. So if PLAYER_NAME should not be able to understand speech-garbled chat, this rule should be used.",
		defaultLimit: ConditionsLimit.normal
	});
}