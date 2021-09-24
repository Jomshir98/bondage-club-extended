import { ConditionsLimit } from "../constants";
import { registerRule } from "../modules/rules";

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
				description: "TODO:deafeningStrength"
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
				description: "TODO:blindnessStrength"
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
		name: "Controlling ability to orgasmn",
		icon: "Icons/Swap.png",
		loggable: false,
		shortDescription: "adjustable: only-edge, only-ruin, no-resist",
		longDescription: "Impacts PLAYER_NAME's ability to control their orgasms, independant of items. These are the control options:\n- Never cum (always edge)\n- Force into ruined orgasm\n- Force into orgasm (no resist)",
		defaultLimit: ConditionsLimit.limited,
		dataDefinition: {
			orgasmHandling: {
				type: "orgasm",
				default: "edge",
				description: "TODO:orgasmHandling"
			}
		}
	});
}