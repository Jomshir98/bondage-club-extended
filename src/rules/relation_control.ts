import { ConditionsLimit } from "../constants";
import { registerRule } from "../modules/rules";
import { icon_OwnerList } from "../resources";

export function initRules_bc_relation_control() {
	registerRule("rc_club_owner", {
		name: "Forbid club owner changes",
		icon: icon_OwnerList,
		shortDescription: "relationship control",
		longDescription: "Forbid the player to leave or get a club owner",
		defaultLimit: ConditionsLimit.limited
	});

	registerRule("rc_new_lovers", {
		name: "Forbid getting lovers",
		icon: icon_OwnerList,
		shortDescription: "relationship control",
		longDescription: "Forbid the player to get a new lover",
		defaultLimit: ConditionsLimit.limited
	});

	registerRule("rc_leave_lovers", {
		name: "Forbid leaving lovers",
		icon: icon_OwnerList,
		shortDescription: "relationship control",
		longDescription: "Forbid the player to leave any of their lovers",
		defaultLimit: ConditionsLimit.limited
	});

	registerRule("rc_new_subs", {
		name: "Forbid getting subs",
		icon: icon_OwnerList,
		shortDescription: "relationship control",
		longDescription: "Forbid the player to collar a new submissive",
		defaultLimit: ConditionsLimit.limited
	});

	registerRule("rc_leave_subs", {
		name: "Forbid to disown subs",
		icon: icon_OwnerList,
		shortDescription: "relationship control",
		longDescription: "Forbid the player to uncollar and let go of any of their subs",
		defaultLimit: ConditionsLimit.limited
	});
}