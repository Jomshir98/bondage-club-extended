import { ConditionsLimit } from "../constants";
import { registerRule } from "../modules/rules";
import { AccessLevel } from "../modules/authority";

export function initRules_bc_alter() {
	registerRule("sensory_deprivation_sound", {
		name: "Sensory deprivation: Sound",
		icon: "Icons/Swap.png",
		loggable: false,
		shortDescription: "adjustable; impacting general hearing ability",
		longDescription: "Impacts PLAYER_NAME's natural ability to hear, independant of items (strength of deafening can be adjusted).",
		defaultLimit: ConditionsLimit.blocked,
		dataDefinition: {
			deafeningStrength: {
				type: "strengthSelect",
				default: "light",
				description: "Hearing impairment:"
			}
		}
	});

	registerRule("sensory_deprivation_sight", {
		name: "Sensory deprivation: Sight",
		icon: "Icons/Swap.png",
		loggable: false,
		shortDescription: "adjustable; controlling general eye sight",
		longDescription: "Impacts PLAYER_NAME's natural ability to see, independant of items (strength of blindness can be adjusted).",
		defaultLimit: ConditionsLimit.blocked,
		dataDefinition: {
			blindnessStrength: {
				type: "strengthSelect",
				default: "light",
				description: "Eyesight impairment:"
			}
		}
	});

	registerRule("sensory_deprivation_eyes", {
		name: "Full blind when eyes closed",
		icon: "Icons/Swap.png",
		loggable: false,
		longDescription: "Sensory deprivation: Enforce that there is a full blindess effect when the eyes are closed.",
		defaultLimit: ConditionsLimit.normal
	});

	registerRule("sensory_deprivation_blindfolds", {
		name: "Full blind when blindfolded",
		icon: "Icons/Swap.png",
		loggable: false,
		longDescription: "Sensory deprivation: Enforce that there is always a full blindess effect when wearing any blindfold type.",
		defaultLimit: ConditionsLimit.normal
	});

	registerRule("always_slow", {
		name: "Leave rooms slowly",
		icon: "Icons/Swap.png",
		loggable: false,
		longDescription: "PLAYER_NAME has to always slowly leave the room, independant of items",
		defaultLimit: ConditionsLimit.normal
	});

	registerRule("orgasm_control", {
		name: "Controlling ability to orgasm",
		icon: "Icons/Swap.png",
		loggable: false,
		shortDescription: "adjustable: only-edge, only-ruin, no-resist",
		longDescription: "Impacts PLAYER_NAME's ability to control their orgasms, independant of items. There are three control options, which are: Never cum (always edge), force into ruined orgasm and force into orgasm (no resist).",
		defaultLimit: ConditionsLimit.limited,
		dataDefinition: {
			orgasmHandling: {
				type: "orgasm",
				default: "edge",
				description: "Orgasm attempts will be fixed to:"
			}
		}
	});

	registerRule("room_admin_management", {
		name: "Room admin transfer",
		icon: "Icons/Swap.png",
		loggable: false,
		shortDescription: "always hand admin to defined roles",
		longDescription: "Defines a minimum role which PLAYER_NAME will automatically give admin rights to when joining a room PLAYER_NAME has room admin in. Also has option to remove admin rights from PLAYER_NAME afterwards.",
		defaultLimit: ConditionsLimit.normal,
		dataDefinition: {
			minimumRole: {
				type: "roleSelector",
				default: AccessLevel.owner,
				description: "Minimum role that gets admin:",
				Y: 320
			},
			removeAdminToggle: {
				type: "toggle",
				default: false,
				description: "Player loses admin afterwards",
				Y: 470
			}
		}
	});

	registerRule("limit_tied_admins_power", {
		name: "Limit bound admin power",
		icon: "Icons/Swap.png",
		loggable: false,
		shortDescription: "restrict room admin powers massively while restrained",
		longDescription: "When considered tied up by Bondage Club standards, PLAYER_NAME only has access to kick/ban room admin powers, nothing else. This rule can be nicely combined with the rule to enforce joining the last room to trap PLAYER_NAME in it.",
		defaultLimit: ConditionsLimit.limited
	});

	registerRule("set_profile_description", {
		name: "Control profile online description",
		icon: "Icons/Swap.png",
		loggable: false,
		shortDescription: "directly sets the player's profile",
		longDescription: "Sets PLAYER_NAME's Bondage Club online description with the text field in the rule config while blocking changing of it as long as the rule is active.",
		defaultLimit: ConditionsLimit.blocked,
		dataDefinition: {
			playersProfileDescription: {
				type: "textArea",
				default: () => (Player.Description || ""),
				description: "Edit this player's profile description:"
			}
		}
	});

	registerRule("always_in_suitcase_game", {
		name: "Always carry a suitcase",
		icon: "Icons/Swap.png",
		loggable: false,
		shortDescription: "from the kidnappers league multiplayer game",
		longDescription: "Forces PLAYER_NAME to constantly participate in the kidnappers league's suitcase delivery task, by automatically replacing the suitcase when it was opened with a new one, every time the room is changed.",
		defaultLimit: ConditionsLimit.normal
	});
}