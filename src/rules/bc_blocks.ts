import { ModuleCategory, ConditionsLimit } from "../constants";
import { OverridePlayerDialog, RedirectGetImage } from "../modules/miscPatches";
import { registerRule } from "../modules/rules";
import { hookFunction } from "../patching";
import { icon_restrictions } from "../resources";

export function initRules_bc_blocks() {
	registerRule("forbid_remoteuse_self", {
		name: "Forbid using remotes on self",
		icon: icon_restrictions,
		longDescription: "This rule forbids PLAYER_NAME to use or triggering a vibrator or similar remote controlled item on the own body.",
		defaultLimit: ConditionsLimit.normal,
		load(state) {
			OverridePlayerDialog("BCX_RemoteDisabled", "Usage blocked by BCX");
			RedirectGetImage("Icons/BCX_Remote.png", "Icons/Remote.png");
			hookFunction("DialogMenuButtonBuild", 0, (args, next) => {
				next(args);
				const C = args[0] as Character;
				if (C.ID === 0 && state.isEnforced) {
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
		defaultLimit: ConditionsLimit.normal,
		load(state) {
			OverridePlayerDialog("BCX_RemoteDisabled", "Usage blocked by BCX");
			RedirectGetImage("Icons/BCX_Remote.png", "Icons/Remote.png");
			hookFunction("DialogMenuButtonBuild", 0, (args, next) => {
				next(args);
				const C = args[0] as Character;
				if (C.ID !== 0 && state.isEnforced) {
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
		defaultLimit: ConditionsLimit.normal,
		load(state) {
			OverridePlayerDialog("BCX_UnlockDisabled", "Usage blocked by BCX");
			RedirectGetImage("Icons/BCX_Unlock.png", "Icons/Unlock.png");
			hookFunction("DialogCanUnlock", 0, (args, next) => {
				const C = args[0] as Character;
				if (C.ID === 0 && state.isEnforced)
					return false;
				return next(args);
			}, ModuleCategory.Rules);
			hookFunction("DialogMenuButtonBuild", 0, (args, next) => {
				next(args);
				const C = args[0] as Character;
				if (C.ID === 0 && state.isEnforced && DialogMenuButton.includes("InspectLock")) {
					DialogMenuButton.splice(-1, 0, "BCX_UnlockDisabled");
				}
			}, ModuleCategory.Rules);
		}
	});

	registerRule("forbid_keyuse_others", {
		name: "Forbid using keys on others",
		icon: icon_restrictions,
		longDescription: "This rule forbids PLAYER_NAME to use any kind of key for locked items on other club members.",
		defaultLimit: ConditionsLimit.normal,
		load(state) {
			OverridePlayerDialog("BCX_UnlockDisabled", "Usage blocked by BCX");
			RedirectGetImage("Icons/BCX_Unlock.png", "Icons/Unlock.png");
			hookFunction("DialogCanUnlock", 0, (args, next) => {
				const C = args[0] as Character;
				if (C.ID !== 0 && state.isEnforced)
					return false;
				return next(args);
			}, ModuleCategory.Rules);
			hookFunction("DialogMenuButtonBuild", 0, (args, next) => {
				next(args);
				const C = args[0] as Character;
				if (C.ID !== 0 && state.isEnforced && DialogMenuButton.includes("InspectLock")) {
					DialogMenuButton.splice(-1, 0, "BCX_UnlockDisabled");
				}
			}, ModuleCategory.Rules);
		}
	});

	registerRule("forbid_lockuse_self", {
		name: "Forbid using locks on self",
		icon: icon_restrictions,
		longDescription: "This rule forbids PLAYER_NAME to use any kind of lock on the own body.",
		defaultLimit: ConditionsLimit.normal,
		load(state) {
			OverridePlayerDialog("BCX_LockDisabled", "Usage blocked by BCX");
			RedirectGetImage("Icons/BCX_Lock.png", "Icons/Lock.png");
			hookFunction("DialogMenuButtonBuild", 0, (args, next) => {
				next(args);
				const C = args[0] as Character;
				if (C.ID === 0 && state.isEnforced) {
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
		defaultLimit: ConditionsLimit.normal,
		load(state) {
			OverridePlayerDialog("BCX_LockDisabled", "Usage blocked by BCX");
			RedirectGetImage("Icons/BCX_Lock.png", "Icons/Lock.png");
			hookFunction("DialogMenuButtonBuild", 0, (args, next) => {
				next(args);
				const C = args[0] as Character;
				if (C.ID !== 0 && state.isEnforced) {
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
		defaultLimit: ConditionsLimit.normal,
		load(state) {
			PlayerCanChange_saved = Player.CanChange;
			Player.CanChange = () => !state.isEnforced && PlayerCanChange_saved.apply(Player);
		},
		unload() {
			Player.CanChange = PlayerCanChange_saved;
		}
	});

	registerRule("forbid_wardrobeaccess_others", {
		name: "Forbid wardrobe use on others",
		icon: icon_restrictions,
		longDescription: "This rule forbids PLAYER_NAME to use the wardrobe of other club members.",
		defaultLimit: ConditionsLimit.normal,
		load(state) {
			hookFunction("ChatRoomCanChangeClothes", 5, (args, next) => {
				if (state.isEnforced)
					return false;
				return next(args);
			}, ModuleCategory.Rules);
		}
	});

	registerRule("restrict_allowed_poses", {
		name: "Restrict allowed body poses",
		icon: icon_restrictions,
		longDescription: "Only being allowed to be in certain poses, like kneeling or holding arms up.",
		defaultLimit: ConditionsLimit.normal,
		dataDefinition: {
			poseButtons: {
				type: "poseSelect",
				default: [],
				description: "TODO:poseButtons"
			}
		}
	});

	registerRule("forbid_creating_rooms", {
		name: "Forbid creating own rooms",
		icon: icon_restrictions,
		longDescription: "Blocks/logs PLAYER_NAME from creating public and private rooms.",
		defaultLimit: ConditionsLimit.limited,
		load(state) {
			hookFunction("ChatSearchRun", 0, (args, next) => {
				next(args);
				if (state.isEnforced) {
					DrawButton(1280, 898, 280, 64, TextGet("CreateRoom"), "Gray", undefined, "Blocked by BCX", true);
				}
			}, ModuleCategory.Rules);
			hookFunction("CommonSetScreen", 5, (args, next) => {
				if (state.isEnforced && args[0] === "Online" && args[1] === "ChatCreate")
					return;
				next(args);
			}, ModuleCategory.Rules);
		}
	});

	registerRule("restrict_accessible_rooms", {
		name: "Restrict accessible rooms",
		icon: icon_restrictions,
		shortDescription: "only allow specific ones",
		longDescription: "This rule blocks/logs entering of not allowed rooms, based on a editable whitelist of rooms that are still permitted for the player to join. This rule could for instance be combined with the rule that forbids the player to create their own rooms.",
		defaultLimit: ConditionsLimit.blocked,
		dataDefinition: {
			roomList: {
				type: "stringList",
				default: [],
				description: "Only joining rooms with these names is allowed:"
			}
		},
		load(state) {
			hookFunction("ChatSearchJoin", 5, (args, next) => {
				if (state.isEnforced && state.customData) {
					// Scans results
					let X = 25;
					let Y = 25;
					for (let C = ChatSearchResultOffset; C < ChatSearchResult.length && C < (ChatSearchResultOffset + 24); C++) {
						// If the player clicked on a valid room
						if (MouseIn(X, Y, 630, 85)) {
							if (!state.customData.roomList.includes(ChatSearchResult[C].Name)) {
								InfoBeep(`You tried to enter a room that is currently forbidden to you!`);
								return;
							}
						}

						// Moves the next window position
						X += 660;
						if (X > 1500) {
							X = 25;
							Y += 109;
						}
					}
				}
				next(args);
			}, ModuleCategory.Rules);
			hookFunction("ChatSearchNormalDraw", 5, (args, next) => {
				next(args);
				if (state.isEnforced && state.customData) {
					// Scans results
					let X = 25;
					let Y = 25;
					for (let C = ChatSearchResultOffset; C < ChatSearchResult.length && C < (ChatSearchResultOffset + 24); C++) {
						if (!state.customData.roomList.includes(ChatSearchResult[C].Name)) {
							DrawButton(X, Y, 630, 85, "", "#88c", undefined, "Blocked by BCX", true);
							DrawTextFit((ChatSearchResult[C].Friends != null && ChatSearchResult[C].Friends.length > 0 ? "(" + ChatSearchResult[C].Friends.length + ") " : "") + ChatSearchMuffle(ChatSearchResult[C].Name) + " - " + ChatSearchMuffle(ChatSearchResult[C].Creator) + " " + ChatSearchResult[C].MemberCount + "/" + ChatSearchResult[C].MemberLimit + "", X + 315, Y + 25, 620, "black");
							DrawTextFit(ChatSearchMuffle(ChatSearchResult[C].Description), X + 315, Y + 62, 620, "black");
						}

						// Moves the next window position
						X += 660;
						if (X > 1500) {
							X = 25;
							Y += 109;
						}
					}
				}
			}, ModuleCategory.Rules);
		}
	});
}
