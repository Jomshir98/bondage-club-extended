import { ModuleCategory } from "../constants";
import { OverridePlayerDialog, RedirectGetImage } from "../modules/miscPatches";
import { registerRule, RuleIsEnforced } from "../modules/rules";
import { hookFunction } from "../patching";
import { icon_restrictions } from "../resources";

export function initRules_bc_blocks() {
	registerRule("forbid_remoteuse_self", {
		name: "Forbid using remotes on self",
		icon: icon_restrictions,
		longDescription: "This rule forbids PLAYER_NAME to use or triggering a vibrator or similar remote controlled item on the own body.",
		load() {
			OverridePlayerDialog("BCX_RemoteDisabled", "Usage blocked by BCX");
			RedirectGetImage("Icons/BCX_Remote.png", "Icons/Remote.png");
			hookFunction("DialogMenuButtonBuild", 0, (args, next) => {
				next(args);
				const C = args[0] as Character;
				if (C.ID === 0 && RuleIsEnforced("forbid_remoteuse_self")) {
					const index = DialogMenuButton.indexOf("Remote");
					if (index >= 0) {
						DialogMenuButton[index] = "BCX_RemoteDisabled";
					}
				}
			}, ModuleCategory.Rules);
		}
	});

	registerRule("forbid_remoteuse_others", {
		name: "Forbid using remotes on others",
		icon: icon_restrictions,
		longDescription: "This rule forbids PLAYER_NAME to use or trigger a vibrator or similar remote controlled item on other club members.",
		load() {
			OverridePlayerDialog("BCX_RemoteDisabled", "Usage blocked by BCX");
			RedirectGetImage("Icons/BCX_Remote.png", "Icons/Remote.png");
			hookFunction("DialogMenuButtonBuild", 0, (args, next) => {
				next(args);
				const C = args[0] as Character;
				if (C.ID !== 0 && RuleIsEnforced("forbid_remoteuse_others")) {
					const index = DialogMenuButton.indexOf("Remote");
					if (index >= 0) {
						DialogMenuButton[index] = "BCX_RemoteDisabled";
					}
				}
			}, ModuleCategory.Rules);
		}
	});

	registerRule("forbid_keyuse_self", {
		name: "Forbid using keys on self",
		icon: icon_restrictions,
		longDescription: "This rule forbids PLAYER_NAME to use any kind of key for locked items on the own body.",
		load() {
			OverridePlayerDialog("BCX_UnlockDisabled", "Usage blocked by BCX");
			RedirectGetImage("Icons/BCX_Unlock.png", "Icons/Unlock.png");
			hookFunction("DialogCanUnlock", 0, (args, next) => {
				const C = args[0] as Character;
				if (C.ID === 0 && RuleIsEnforced("forbid_keyuse_self"))
					return false;
				return next(args);
			}, ModuleCategory.Rules);
			hookFunction("DialogMenuButtonBuild", 0, (args, next) => {
				next(args);
				const C = args[0] as Character;
				if (C.ID === 0 && RuleIsEnforced("forbid_keyuse_self") && DialogMenuButton.includes("InspectLock")) {
					DialogMenuButton.splice(-1, 0, "BCX_UnlockDisabled");
				}
			}, ModuleCategory.Rules);
		}
	});

	registerRule("forbid_keyuse_others", {
		name: "Forbid using keys on others",
		icon: icon_restrictions,
		longDescription: "This rule forbids PLAYER_NAME to use any kind of key for locked items on other club members.",
		load() {
			OverridePlayerDialog("BCX_UnlockDisabled", "Usage blocked by BCX");
			RedirectGetImage("Icons/BCX_Unlock.png", "Icons/Unlock.png");
			hookFunction("DialogCanUnlock", 0, (args, next) => {
				const C = args[0] as Character;
				if (C.ID !== 0 && RuleIsEnforced("forbid_keyuse_others"))
					return false;
				return next(args);
			}, ModuleCategory.Rules);
			hookFunction("DialogMenuButtonBuild", 0, (args, next) => {
				next(args);
				const C = args[0] as Character;
				if (C.ID !== 0 && RuleIsEnforced("forbid_keyuse_others") && DialogMenuButton.includes("InspectLock")) {
					DialogMenuButton.splice(-1, 0, "BCX_UnlockDisabled");
				}
			}, ModuleCategory.Rules);
		}
	});

	registerRule("forbid_lockuse_self", {
		name: "Forbid using locks on self",
		icon: icon_restrictions,
		longDescription: "This rule forbids PLAYER_NAME to use any kind of lock on the own body.",
		load() {
			OverridePlayerDialog("BCX_LockDisabled", "Usage blocked by BCX");
			RedirectGetImage("Icons/BCX_Lock.png", "Icons/Lock.png");
			hookFunction("DialogMenuButtonBuild", 0, (args, next) => {
				next(args);
				const C = args[0] as Character;
				if (C.ID === 0 && RuleIsEnforced("forbid_lockuse_self")) {
					const index = DialogMenuButton.indexOf("Lock");
					if (index >= 0) {
						DialogMenuButton[index] = "BCX_LockDisabled";
					}
				}
			}, ModuleCategory.Rules);
		}
	});

	registerRule("forbid_lockuse_others", {
		name: "Forbid using locks on others",
		icon: icon_restrictions,
		longDescription: "This rule forbids PLAYER_NAME to use any kind of lock on other club members.",
		load() {
			OverridePlayerDialog("BCX_LockDisabled", "Usage blocked by BCX");
			RedirectGetImage("Icons/BCX_Lock.png", "Icons/Lock.png");
			hookFunction("DialogMenuButtonBuild", 0, (args, next) => {
				next(args);
				const C = args[0] as Character;
				if (C.ID !== 0 && RuleIsEnforced("forbid_lockuse_others")) {
					const index = DialogMenuButton.indexOf("Lock");
					if (index >= 0) {
						DialogMenuButton[index] = "BCX_LockDisabled";
					}
				}
			}, ModuleCategory.Rules);
		}
	});

	let PlayerCanChange_saved: PlayerCharacter["CanChange"];

	registerRule("forbid_wardrobeaccess_self", {
		name: "Forbid wardrobe use on self",
		icon: icon_restrictions,
		longDescription: "This rule forbids PLAYER_NAME to access the own wardrobe.",
		load() {
			PlayerCanChange_saved = Player.CanChange;
			Player.CanChange = () => !RuleIsEnforced("forbid_wardrobeaccess_self") && PlayerCanChange_saved.apply(Player);
		},
		unload() {
			Player.CanChange = PlayerCanChange_saved;
		}
	});

	registerRule("forbid_wardrobeaccess_others", {
		name: "Forbid wardrobe use on others",
		icon: icon_restrictions,
		longDescription: "This rule forbids PLAYER_NAME to use the wardrobe of other club members.",
		load() {
			hookFunction("ChatRoomCanChangeClothes", 5, (args, next) => {
				if (RuleIsEnforced("forbid_wardrobeaccess_others"))
					return false;
				return next(args);
			}, ModuleCategory.Rules);
		}
	});

	// registerRule("restrict_allowed_poses", {
	// 	name: "Restrict allowed body poses",
	// 	icon: icon_restrictions,
	// 	longDescription: "Only being allowed to be in certain poses, like kneeling or holding arms up."
	// });

	registerRule("forbid_creating_rooms", {
		name: "Forbid creating own rooms",
		icon: icon_restrictions,
		longDescription: "Blocks/logs PLAYER_NAME from creating public and private rooms.",
		load() {
			hookFunction("ChatSearchRun", 0, (args, next) => {
				next(args);
				if (RuleIsEnforced("forbid_creating_rooms")) {
					DrawButton(1280, 898, 280, 64, TextGet("CreateRoom"), "Gray", undefined, "Blocked by BCX", true);
				}
			}, ModuleCategory.Rules);
			hookFunction("CommonSetScreen", 5, (args, next) => {
				if (RuleIsEnforced("forbid_creating_rooms") && args[0] === "Online" && args[1] === "ChatCreate")
					return;
				next(args);
			}, ModuleCategory.Rules);
		}
	});

	// registerRule("restrict_accessible_rooms", {
	// 	name: "Restrict accessible rooms",
	// 	icon: icon_restrictions,
	// 	longDescription: "This rule blocks/logs entering of not allowed rooms, based on a white list."
	// });

	// registerRule("sensory_deprivation_sound", {
	// 	name: "Sensory deprivation: Sound",
	// 	icon: "Icons/Swap.png",
	// 	longDescription: "Impacts PLAYER_NAME's ability to hear (strength of the deafening can be adjusted)."
	// });
}
