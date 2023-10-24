import { ConditionsLimit, ModuleCategory } from "../constants";
import { registerRule, RuleType } from "../modules/rules";
import { hookFunction } from "../patching";

export function initRules_bc_relation_control() {
	registerRule("rc_club_owner", {
		name: "Forbid club owner changes",
		type: RuleType.RC,
		shortDescription: "getting or leaving owner",
		longDescription: "This rule forbids PLAYER_NAME to leave their current club owner or get a new one. Advancing ownership from trial to full ownership is unaffected. Doesn't prevent the club owner from releasing her.",
		keywords: ["prevent", "ownership", "collaring", "break"],
		// Logs are not implemented
		loggable: false,
		// triggerTexts: {
		// 	infoBeep: "You are not allowed to [leave your|get an] owner!",
		// 	attempt_log: "PLAYER_NAME tried to [leave their|get an] owner, which was forbidden.",
		// 	log: "PLAYER_NAME [left their|got an] owner, which was forbidden."
		// },
		defaultLimit: ConditionsLimit.blocked,
		load(state) {
			hookFunction("ChatRoomOwnershipOptionIs", 5, (args, next) => {
				const Option = args[0] as string;
				if (state.isEnforced && Option === "CanStartTrial")
					return false;
				return next(args);
			}, ModuleCategory.Rules);
			for (const fun of [
				"ManagementCanBeReleasedOnline",
				"ManagementCanBreakTrialOnline",
				"ManagementCannotBeReleasedOnline",
				"ManagementCanBeReleased",
				"ManagementCannotBeReleased",
			] as const) {
				hookFunction(fun, 5, (args, next) => {
					return !state.isEnforced && next(args);
				}, ModuleCategory.Rules);
			}
			hookFunction("ManagementCannotBeReleasedExtreme", 5, (args, next) => {
				return state.isEnforced || next(args);
			}, ModuleCategory.Rules);
		},
	});

	registerRule("rc_lover_new", {
		name: "Forbid getting new lovers",
		type: RuleType.RC,
		longDescription: "This rule forbids PLAYER_NAME to get a new lover. Advancing lovership from dating to engagement or from engagement to marriage is unaffected.",
		keywords: ["prevent", "lovership", "dating"],
		// Logs are not implemented
		loggable: false,
		// triggerTexts: {
		// 	infoBeep: "Due to a rule, you are not allowed to get a new lover!",
		// 	attempt_log: "PLAYER_NAME tried to get a new lover, TARGET_PLAYER, which was forbidden",
		// 	log: "PLAYER_NAME got a new lover, TARGET_PLAYER, which was forbidden"
		// },
		defaultLimit: ConditionsLimit.blocked,
		load(state) {
			hookFunction("ChatRoomLovershipOptionIs", 5, (args, next) => {
				const Option = args[0] as string;
				if (state.isEnforced && (Option === "CanOfferBeginDating" || Option === "CanBeginDating"))
					return false;
				return next(args);
			}, ModuleCategory.Rules);
		},
	});

	registerRule("rc_lover_leave", {
		name: "Forbid breaking up with lovers",
		type: RuleType.RC,
		longDescription: "This rule forbids PLAYER_NAME to leave any of their lovers, independent of lovership stage (leaving dating, engaged and married characters is forbidden). Doesn't prevent her lovers from breaking up with her.",
		keywords: ["prevent", "lovership", "dating", "leave", "leaving"],
		// Logs are not implemented
		loggable: false,
		// triggerTexts: {
		// 	infoBeep: "Due to a rule, you are not allowed to leave your lover!",
		// 	attempt_log: "PLAYER_NAME tried to leave their lover, TARGET_PLAYER, which was forbidden",
		// 	log: "PLAYER_NAME left their lover, TARGET_PLAYER, which was forbidden"
		// },
		defaultLimit: ConditionsLimit.blocked,
		load(state) {
			for (const fun of [
				"ManagementCanBreakDatingLoverOnline",
				"ManagementCanBreakUpLoverOnline",
			] as const) {
				hookFunction(fun, 5, (args, next) => {
					return !state.isEnforced && next(args);
				}, ModuleCategory.Rules);
			}
		},
	});

	registerRule("rc_sub_new", {
		name: "Forbid taking new submissives",
		type: RuleType.RC,
		shortDescription: "by offering them an ownership trial",
		longDescription: "This rule forbids PLAYER_NAME to start a trial with new submissive. Advancing ownership from trial to full ownership is unaffected.",
		keywords: ["prevent", "subbies", "collaring"],
		// Logs are not implemented
		loggable: false,
		// triggerTexts: {
		// 	infoBeep: "Due to a rule, you are not allowed to own a new submissive!",
		// 	attempt_log: "PLAYER_NAME tried to collar a new sub, TARGET_PLAYER, which was forbidden",
		// 	log: "PLAYER_NAME collared a new sub, TARGET_PLAYER, which was forbidden"
		// },
		defaultLimit: ConditionsLimit.blocked,
		load(state) {
			hookFunction("ChatRoomOwnershipOptionIs", 5, (args, next) => {
				const Option = args[0] as string;
				if (state.isEnforced && Option === "Propose")
					return false;
				return next(args);
			}, ModuleCategory.Rules);
		},
	});

	registerRule("rc_sub_leave", {
		name: "Forbid disowning submissives",
		type: RuleType.RC,
		longDescription: "This rule forbids PLAYER_NAME to let go of any of their subs. (affects both trial and full ownerships). Doesn't prevent her submissives from breaking the bond.",
		keywords: ["prevent", "subbies", "collar", "freeing", "releasing", "release"],
		// Logs are not implemented
		loggable: false,
		// triggerTexts: {
		// 	infoBeep: "Due to a rule, you are not allowed to let go of any of your submissive!",
		// 	attempt_log: "PLAYER_NAME tried to let go of their sub, TARGET_PLAYER, which was forbidden",
		// 	log: "PLAYER_NAME let go of their sub, TARGET_PLAYER, which was forbidden"
		// },
		defaultLimit: ConditionsLimit.blocked,
		load(state) {
			hookFunction("ChatRoomIsOwnedByPlayer", 5, (args, next) => {
				return !state.isEnforced && next(args);
			}, ModuleCategory.Rules);
		},
	});
}
