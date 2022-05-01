import { BCXLoadedBeforeLogin, BCXLoginTimedata, BCX_setTimeout } from "../BCXContext";
import { ConditionsLimit } from "../constants";
import { registerRule, RuleType } from "../modules/rules";
import { isObject } from "../utils";
import { ChatRoomSendLocal } from "../utilsClub";

export function initRules_other() {
	let lastAction = Date.now();
	let afkDidTrigger = false;
	function afk_reset() {
		lastAction = Date.now();
		afkDidTrigger = false;
	}

	registerRule("other_forbid_afk", {
		name: "Forbid going afk",
		type: RuleType.Other,
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
	registerRule("other_log_online_time", {
		name: "Track online time",
		type: RuleType.Other,
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
		type: RuleType.Other,
		loggable: false,
		enforceable: false,
		shortDescription: "regularily show configurable sentences to PLAYER_NAME",
		longDescription: "This rule reminds or tells PLAYER_NAME one of the recorded sentences at random in a settable interval. Only PLAYER_NAME can see the set message and it is only shown if in a chat room.",
		defaultLimit: ConditionsLimit.limited,
		dataDefinition: {
			reminderText: {
				type: "stringList",
				default: [],
				description: "The sentences that will be shown at random:",
				Y: 296
			},
			reminderFrequency: {
				type: "number",
				default: 15,
				description: "Frequency of a sentence being shown (in minutes):",
				Y: 715
			}
		},
		tick(state) {
			if (state.inEffect && state.customData && state.customData.reminderText !== [] &&
				ServerPlayerIsInChatRoom() &&
				Date.now() > lastReminder + state.customData.reminderFrequency * 60 * 1000
			) {
				lastReminder = Date.now();
				ChatRoomSendLocal("[Voice] " + state.customData.reminderText[Math.floor(Math.random() * state.customData.reminderText.length)]);
				return true;
			}
			return false;
		}
	});

	registerRule("other_log_money", {
		name: "Log money changes",
		type: RuleType.Other,
		enforceable: false,
		shortDescription: "spending and/or getting money",
		longDescription: "This rule logs whenever money is used to buy something. It also shows how much money PLAYER_NAME currently has in the log entry. Optionally, earning money can also be logged. Note: Please be aware that this last option can potentially fill the whole behaviour log rapidly.",
		triggerTexts: {
			infoBeep: "A BCX rule has logged this financial transaction!",
			log: "PLAYER_NAME TYPE money: AMOUNT $ | new balance: BALANCE $",
			announce: ""
		},
		defaultLimit: ConditionsLimit.normal,
		dataDefinition: {
			logEarnings: {
				type: "toggle",
				default: false,
				description: "Also log getting money"
			}
		},
		internalDataValidate: (data) => typeof data === "number",
		internalDataDefault: () => -1,
		stateChange(state, newState) {
			if (!newState) {
				state.internalData = -1;
			}
		},
		tick(state) {
			if (!state.internalData || !Number.isFinite(Player.Money))
				return false;
			let returnValue = false;
			if (state.inEffect) {
				if (state.internalData < 0) {
					state.internalData = Player.Money;
				}
				if (state.internalData > Player.Money) {
					state.trigger({ TYPE: "spent", AMOUNT: `${state.internalData - Player.Money}`, BALANCE: `${Player.Money}` });
					returnValue = true;
				} else if (state.internalData < Player.Money && state.customData && state.customData.logEarnings) {
					state.trigger({ TYPE: "earned", AMOUNT: `${Player.Money - state.internalData}`, BALANCE: `${Player.Money}` });
					returnValue = true;
				}
				if (state.internalData !== Player.Money) {
					state.internalData = Player.Money;
				}
			}
			return returnValue;
		}
	});

	/* TODO: Idea stage
	registerRule("other_restrict_console_usage", {
		name: "Restrict console usage",
		type: RuleType.Other,
		loggable: false,
		shortDescription: "to not allow freeing oneself",
		longDescription: "Makes the player unable to use the browser console to change their own appearance in the club, such as removing restraints.",
		defaultLimit: ConditionsLimit.blocked
	});
	*/

	const removeTrackingEntry = (hiddenItems: any[]) => {
		for (; ;) {
			const index = hiddenItems.findIndex(a => isObject(a) && typeof a.Name === "string" && a.Name.startsWith("GoodGirl") && a.Group === "BCX");
			if (index < 0)
				break;
			hiddenItems.splice(index, 1);
			ServerPlayerBlockItemsSync();
		}
	};

	const hasTrackingEntry = (hiddenItems: any[], token: number) => {
		return hiddenItems.some(a => isObject(a) && a.Name === `GoodGirl${token}` && a.Group === "BCX");
	};

	const addTrackingEntry = (hiddenItems: any[], token: number) => {
		removeTrackingEntry(hiddenItems);
		hiddenItems.push({ Name: `GoodGirl${token}`, Group: "BCX" });
	};

	registerRule("other_track_BCX_activation", {
		name: "Track BCX activation",
		type: RuleType.Other,
		enforceable: false,
		shortDescription: "logs if PLAYER_NAME enters the club without BCX",
		longDescription: "This rule observes PLAYER_NAME, logging it as a rule violation if the club was previously entered at least once without BCX active.",
		triggerTexts: {
			infoBeep: "You logged in without starting BCX beforehand!",
			log: "PLAYER_NAME logged in without starting BCX beforehand at least once",
			announce: ""
		},
		internalDataValidate: (v) => typeof v === "number",
		internalDataDefault: () => Math.floor(Math.random() * 1_000_000),
		defaultLimit: ConditionsLimit.blocked,
		load(state) {
			if (state.inEffect && state.internalData !== undefined) {
				if (
					!BCXLoadedBeforeLogin ||
					!Array.isArray(BCXLoginTimedata.HiddenItems) ||
					!hasTrackingEntry(BCXLoginTimedata.HiddenItems, state.internalData)
				) {
					BCX_setTimeout(() => {
						state.trigger();
						state.internalData = Math.floor(Math.random() * 1_000_000);
						addTrackingEntry(Player.HiddenItems, state.internalData);
						ServerPlayerBlockItemsSync();
					}, 3_500);
				} else {
					state.internalData = Math.floor(Math.random() * 1_000_000);
					addTrackingEntry(Player.HiddenItems, state.internalData);
					ServerPlayerBlockItemsSync();
				}
			}
		},
		stateChange(state, newState) {
			if (newState) {
				state.internalData = Math.floor(Math.random() * 1_000_000);
				addTrackingEntry(Player.HiddenItems, state.internalData);
				ServerPlayerBlockItemsSync();
			} else {
				removeTrackingEntry(Player.HiddenItems);
				ServerPlayerBlockItemsSync();
			}
		},
		tick(state) {
			if (state.inEffect && state.internalData !== undefined) {
				if (!hasTrackingEntry(Player.HiddenItems, state.internalData) || Math.random() < 0.01) {
					state.internalData = Math.floor(Math.random() * 1_000_000);
					addTrackingEntry(Player.HiddenItems, state.internalData);
					ServerPlayerBlockItemsSync();
				}
			}
			return false;
		}
	});
}
