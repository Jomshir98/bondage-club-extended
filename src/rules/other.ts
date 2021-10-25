import { ConditionsLimit } from "../constants";
import { registerRule } from "../modules/rules";
import { ChatRoomActionMessage, ChatRoomSendLocal } from "../utilsClub";

export function initRules_other() {
	let lastAction = Date.now();
	let afkDidTrigger = false;
	function afk_reset() {
		lastAction = Date.now();
		afkDidTrigger = false;
	}

	registerRule("other_forbid_afk", {
		name: "Forbid going afk",
		icon: "Icons/Chest.png",
		enforceable: false,
		shortDescription: "logs whenever PLAYER_NAME is inactive",
		longDescription: "This rule forbids PLAYER_NAME to go afk and logs when the allowed inactivity threshold is overstepped.",
		triggerTexts: {
			log: "PLAYER_NAME became inactive, which was forbidden",
			announce: ""
		},
		defaultLimit: ConditionsLimit.blocked,
		dataDefinition: {
			minutesBeforeAfk: {
				type: "number",
				default: 10,
				description: "Amount of minutes, before being considered inactive:"
			}
		},
		load() {
			AfkTimerEventsList.forEach(e => document.addEventListener(e, afk_reset, true));
		},
		tick(state) {
			if (!afkDidTrigger && state.inEffect && state.customData &&
				Date.now() > lastAction + state.customData.minutesBeforeAfk * 60 * 1000
			) {
				afkDidTrigger = true;
				state.trigger();
				ChatRoomSendLocal("You broke a BCX rule by being inactive for too long. The transgression was logged.");
				return true;
			}
			return false;
		},
		unload() {
			AfkTimerEventsList.forEach(e => document.removeEventListener(e, afk_reset, true));
		}
	});

	/* TODO: Implement
	registerRule("log_online_time", {
		name: "Track online time",
		icon: "Icons/Chest.png",
		enforceable: false,
		loggable: false,
		shortDescription: "counts the time PLAYER_NAME spent in the club",
		longDescription: "This rule shows the constantly updated amount of minutes, hours and days PLAYER_NAME spent (online) in the club since the rule was added. The value is shown inside the configuration screen of this rule. To reset the counter, remove and add the rule again.",
		defaultLimit: ConditionsLimit.blocked
	});
	*/

	let lastReminder = 0;
	registerRule("other_constant_reminder", {
		name: "Listen to my voice",
		icon: "Icons/Chest.png",
		loggable: false,
		enforceable: false,
		shortDescription: "regularily show configurable text to PLAYER_NAME",
		longDescription: "This rule reminds or tells PLAYER_NAME something in a settable interval. Only PLAYER_NAME can see the set message and it is only shown if in a chat room.",
		defaultLimit: ConditionsLimit.limited,
		dataDefinition: {
			reminderText: {
				type: "string",
				default: "",
				description: "The sentence that will be shown:",
				Y: 300
			},
			reminderFrequency: {
				type: "number",
				default: 15,
				description: "Frequency of the sentence being shown (in minutes):",
				Y: 490
			}
		},
		tick(state) {
			if (state.inEffect && state.customData &&
				ServerPlayerIsInChatRoom() &&
				Date.now() > lastReminder + state.customData.reminderFrequency * 60 * 1000
			) {
				lastReminder = Date.now();
				ChatRoomActionMessage(state.customData.reminderText, Player.MemberNumber);
				return true;
			}
			return false;
		}
	});

	/* TODO: Idea stage
	registerRule("restrict_console_usage", {
		name: "Restrict console usage",
		icon: "Icons/Chest.png",
		loggable: false,
		shortDescription: "to not allow freeing oneself",
		longDescription: "Makes the player unable to use the browser console to change their own appearance in the club, such as removing restraints.",
		defaultLimit: ConditionsLimit.blocked
	});
	*/

	/* TODO: Idea stage
	registerRule("track_BCX_activation", {
		name: "Track BCX activation",
		icon: "Icons/Chest.png",
		enforceable: false,
		shortDescription: "logs if PLAYER_NAME enters the club without BCX",
		longDescription: "This rule observes PLAYER_NAME, logging it as a rule violation if the club is entered without BCX active.",
		defaultLimit: ConditionsLimit.blocked
	});
	*/
}
