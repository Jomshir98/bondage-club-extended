import { ConditionsLimit } from "../constants";
import { registerRule } from "../modules/rules";

export function initRules_other() {
	registerRule("forbid_afk", {
		name: "Forbid going afk",
		icon: "Icons/Chest.png",
		enforceable: false,
		shortDescription: "logs whenever PLAYER_NAME is inactive",
		longDescription: "This rule forbids PLAYER_NAME to go afk and logs it when the allowed inactivity threshold is overstepped.",
		triggerTexts: {
			infoBeep: "",
			attempt_log: "",
			log: "PLAYER_NAME became inactive, which was forbidden"
		},
		defaultLimit: ConditionsLimit.blocked,
		dataDefinition: {
			minutesBeforeAfk: {
				type: "number",
				default: 10,
				description: "Amount of minutes, before being considered inactive:"
			}
		}
	});

	registerRule("log_online_time", {
		name: "Track online time",
		icon: "Icons/Chest.png",
		enforceable: false,
		loggable: false,
		shortDescription: "counts the time PLAYER_NAME spent in the club",
		longDescription: "This rule shows the constantly updated amount of minutes, hours and days PLAYER_NAME spent (online) in the club since the rule was added. The value is shown inside the configuration screen of this rule. To reset the counter, remove and add the rule again.",
		defaultLimit: ConditionsLimit.blocked
	});

	registerRule("constant_reminder", {
		name: "Listen to my voice",
		icon: "Icons/Chest.png",
		loggable: false,
		shortDescription: "sets a sentence that will be shown to PLAYER_NAME regularily",
		longDescription: "This rule reminds or tells PLAYER_NAME something in a settable interval. Only PLAYER_NAME can see the set message and it is only shown if in a chat room.",
		defaultLimit: ConditionsLimit.limited,
		dataDefinition: {
			reminderText: {
				type: "string",
				default: "",
				description: "The sentence that will be shown:"
			},
			reminderFrequency: {
				type: "number",
				default: 15,
				description: "Frequency of the sentence being shown (in minutes):",
				Y: 490
			}
		}
	});

}
