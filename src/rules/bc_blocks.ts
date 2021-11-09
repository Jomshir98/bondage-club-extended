import { ModuleCategory, ConditionsLimit } from "../constants";
import { HookDialogMenuButtonClick as hookDialogMenuButtonClick, OverridePlayerDialog, RedirectGetImage } from "../modules/miscPatches";
import { registerRule } from "../modules/rules";
import { hookFunction } from "../patching";
import { icon_restrictions } from "../resources";
import { detectOtherMods } from "../utilsClub";

export function initRules_bc_blocks() {
	const { NMod } = detectOtherMods();

	registerRule("block_remoteuse_self", {
		name: "Forbid using remotes on self",
		icon: icon_restrictions,
		shortDescription: "PLAYER_NAME using one on PLAYER_NAME",
		longDescription: "This rule forbids PLAYER_NAME to use or trigger a vibrator or similar remote controlled item on her own body. (Others still can use remotes on her)",
		triggerTexts: {
			infoBeep: "You are not allowed to use a remote control for items on your body!",
			attempt_log: "PLAYER_NAME tried to use a remote control on her own body, which was forbidden",
			log: "PLAYER_NAME used a remote control on her own body, which was forbidden"
		},
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
			hookDialogMenuButtonClick("Remote", (C) => {
				if (C.ID === 0 && state.inEffect) {
					state.trigger();
				}
				return false;
			});
			hookDialogMenuButtonClick("BCX_RemoteDisabled", (C) => {
				if (C.ID === 0 && state.inEffect) {
					state.triggerAttempt();
				}
				return false;
			});
		}
	});

	registerRule("block_remoteuse_others", {
		name: "Forbid using remotes on others",
		icon: icon_restrictions,
		longDescription: "This rule forbids PLAYER_NAME to use or trigger a vibrator or similar remote controlled item on other club members.",
		triggerTexts: {
			infoBeep: "You are not allowed to use a remote control on other's items!",
			attempt_log: "PLAYER_NAME tried to use a remote control on TARGET_PLAYER's body, which was forbidden",
			log: "PLAYER_NAME used a remote control on TARGET_PLAYER's body, which was forbidden"
		},
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
			hookDialogMenuButtonClick("Remote", (C) => {
				if (C.ID !== 0 && state.inEffect) {
					state.trigger({ TARGET_PLAYER: `${C.Name} (${C.MemberNumber})` });
				}
				return false;
			});
			hookDialogMenuButtonClick("BCX_RemoteDisabled", (C) => {
				if (C.ID !== 0 && state.inEffect) {
					state.triggerAttempt({ TARGET_PLAYER: `${C.Name} (${C.MemberNumber})` });
				}
				return false;
			});
		}
	});

	registerRule("block_keyuse_self", {
		name: "Forbid using keys on self",
		icon: icon_restrictions,
		shortDescription: "PLAYER_NAME using one on PLAYER_NAME",
		longDescription: "This rule forbids PLAYER_NAME to unlock any locked item on her own body. Note: Despite the name, this rule also blocks unlocking locks that don't require a key (e.g. exclusive lock). However, locks that can be unlocked in other ways (timer locks by removing time, code/password locks by entering correct code) can still be unlocked by PLAYER_NAME. Others can still unlock her items on her normally.",
		triggerTexts: {
			infoBeep: "You are not allowed to use a key on items on your body!",
			attempt_log: "PLAYER_NAME tried to use a key on a worn item, which was forbidden",
			log: "PLAYER_NAME used a key on a worn item, which was forbidden"
		},
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
			hookDialogMenuButtonClick("Unlock", (C) => {
				if (C.ID === 0 && state.inEffect) {
					state.trigger();
				}
				return false;
			});
			hookDialogMenuButtonClick("BCX_UnlockDisabled", (C) => {
				if (C.ID === 0 && state.inEffect) {
					state.triggerAttempt();
				}
				return false;
			});
		}
	});

	registerRule("block_keyuse_others", {
		name: "Forbid using keys on others",
		icon: icon_restrictions,
		longDescription: "This rule forbids PLAYER_NAME to unlock any locked item on other club members, with options to still allow unlocking of owner and/or lover locks and items. Note: Despite the name, this rule also blocks unlocking locks that don't require a key (e.g. exclusive lock). However, locks that can be unlocked in other ways (timer locks by removing time, code/password locks by entering correct code) can still be unlocked by PLAYER_NAME.",
		triggerTexts: {
			infoBeep: "You are not allowed to use a key on other's items!",
			attempt_log: "PLAYER_NAME tried to use a key to unlock TARGET_PLAYER's item, which was forbidden",
			log: "PLAYER_NAME used a key to unlock TARGET_PLAYER's item, which was forbidden"
		},
		defaultLimit: ConditionsLimit.normal,
		dataDefinition: {
			allowOwnerLocks: {
				type: "toggle",
				default: false,
				description: "Still allow unlocking owner locks or items"
			},
			allowLoverLocks: {
				type: "toggle",
				default: false,
				description: "Still allow unlocking lover locks or items",
				Y: 530
			}
		},
		load(state) {
			let ignore = false;
			OverridePlayerDialog("BCX_UnlockDisabled", "Usage blocked by BCX");
			RedirectGetImage("Icons/BCX_Unlock.png", "Icons/Unlock.png");
			hookFunction("DialogCanUnlock", 0, (args, next) => {
				const C = args[0] as Character;
				const Item = args[1] as Item;
				const lock = InventoryGetLock(Item);
				if (state.customData &&
					C.ID !== 0 &&
					Item != null &&
					Item.Asset != null &&
					(
						(state.customData.allowOwnerLocks && (Item.Asset.OwnerOnly || lock?.Asset.OwnerOnly) && C.IsOwnedByPlayer()) ||
						(state.customData.allowLoverLocks && (Item.Asset.LoverOnly || lock?.Asset.LoverOnly) && C.IsLoverOfPlayer())
					)
				) {
					ignore = true;
					return next(args);
				}
				ignore = false;
				if (C.ID !== 0 && state.isEnforced)
					return false;
				return next(args);
			}, ModuleCategory.Rules);
			hookFunction("DialogMenuButtonBuild", 0, (args, next) => {
				next(args);
				if (!ignore) {
					const C = args[0] as Character;
					if (C.ID !== 0 && state.isEnforced && DialogMenuButton.includes("InspectLock")) {
						DialogMenuButton.splice(-1, 0, "BCX_UnlockDisabled");
					}
				}
			}, ModuleCategory.Rules);
			hookDialogMenuButtonClick("Unlock", (C) => {
				if (!ignore && C.ID !== 0 && state.inEffect) {
					state.trigger({ TARGET_PLAYER: `${C.Name} (${C.MemberNumber})` });
				}
				return false;
			});
			hookDialogMenuButtonClick("BCX_UnlockDisabled", (C) => {
				if (!ignore && C.ID !== 0 && state.inEffect) {
					state.triggerAttempt({ TARGET_PLAYER: `${C.Name} (${C.MemberNumber})` });
				}
				return false;
			});
		}
	});

	registerRule("block_lockpicking_self", {
		name: "Forbid picking locks on self",
		icon: icon_restrictions,
		shortDescription: "PLAYER_NAME picking one on PLAYER_NAME",
		longDescription: "This rule forbids PLAYER_NAME to lockpick any locked items on her own body. (Others still can pick locks on her normally)",
		triggerTexts: {
			infoBeep: "You are not allowed to lockpick worn items on your body!",
			attempt_log: "PLAYER_NAME tried to lockpick a worn item, which was forbidden",
			log: "PLAYER_NAME lockpicked a worn item, which was forbidden"
		},
		defaultLimit: ConditionsLimit.normal,
		load(state) {
			OverridePlayerDialog("BCX_PickLockDisabled", "Usage blocked by BCX");
			RedirectGetImage("Icons/BCX_PickLock.png", "Icons/PickLock.png");
			hookFunction("DialogMenuButtonBuild", 0, (args, next) => {
				next(args);
				const C = args[0] as Character;
				if (C.ID === 0 && state.isEnforced) {
					const index = DialogMenuButton.indexOf("PickLock");
					if (index >= 0) {
						DialogMenuButton[index] = "BCX_PickLockDisabled";
					}
				}
			}, ModuleCategory.Rules);
			hookDialogMenuButtonClick("PickLock", (C) => {
				if (C.ID === 0 && state.inEffect) {
					state.trigger();
				}
				return false;
			});
			hookDialogMenuButtonClick("BCX_PickLockDisabled", (C) => {
				if (C.ID === 0 && state.inEffect) {
					state.triggerAttempt();
				}
				return false;
			});
		}
	});

	registerRule("block_lockpicking_others", {
		name: "Forbid picking locks on others",
		icon: icon_restrictions,
		longDescription: "This rule forbids PLAYER_NAME to lockpick any locked items on other club members.",
		triggerTexts: {
			infoBeep: "You are not allowed to lockpick items on others!",
			attempt_log: "PLAYER_NAME tried to lockpick an item on TARGET_PLAYER, which was forbidden",
			log: "PLAYER_NAME lockpicked an item on TARGET_PLAYER, which was forbidden"
		},
		defaultLimit: ConditionsLimit.normal,
		load(state) {
			OverridePlayerDialog("BCX_PickLockDisabled", "Usage blocked by BCX");
			RedirectGetImage("Icons/BCX_PickLock.png", "Icons/PickLock.png");
			hookFunction("DialogMenuButtonBuild", 0, (args, next) => {
				next(args);
				const C = args[0] as Character;
				if (C.ID !== 0 && state.isEnforced) {
					const index = DialogMenuButton.indexOf("PickLock");
					if (index >= 0) {
						DialogMenuButton[index] = "BCX_PickLockDisabled";
					}
				}
			}, ModuleCategory.Rules);
			hookDialogMenuButtonClick("PickLock", (C) => {
				if (C.ID !== 0 && state.inEffect) {
					state.trigger({ TARGET_PLAYER: `${C.Name} (${C.MemberNumber})` });
				}
				return false;
			});
			hookDialogMenuButtonClick("BCX_PickLockDisabled", (C) => {
				if (C.ID !== 0 && state.inEffect) {
					state.triggerAttempt({ TARGET_PLAYER: `${C.Name} (${C.MemberNumber})` });
				}
				return false;
			});
		}
	});

	registerRule("block_lockuse_self", {
		name: "Forbid using locks on self",
		icon: icon_restrictions,
		shortDescription: "PLAYER_NAME using one on PLAYER_NAME",
		longDescription: "This rule forbids PLAYER_NAME to use any kind of lock on her own body. (Others still can add locks on her items normally)",
		triggerTexts: {
			infoBeep: "You are not allowed to lock items on your body!",
			attempt_log: "PLAYER_NAME tried to lock a worn item, which was forbidden",
			log: "PLAYER_NAME locked a worn item, which was forbidden"
		},
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
			hookDialogMenuButtonClick("Lock", (C) => {
				if (C.ID === 0 && state.inEffect) {
					state.trigger();
				}
				return false;
			});
			hookDialogMenuButtonClick("BCX_LockDisabled", (C) => {
				if (C.ID === 0 && state.inEffect) {
					state.triggerAttempt();
				}
				return false;
			});
		}
	});

	registerRule("block_lockuse_others", {
		name: "Forbid using locks on others",
		icon: icon_restrictions,
		longDescription: "This rule forbids PLAYER_NAME to use any kind of lock on other club members.",
		triggerTexts: {
			infoBeep: "You are not allowed to lock other's items!",
			attempt_log: "PLAYER_NAME tried to lock TARGET_PLAYER's item, which was forbidden",
			log: "PLAYER_NAME locked TARGET_PLAYER's item, which was forbidden"
		},
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
			hookDialogMenuButtonClick("Lock", (C) => {
				if (C.ID !== 0 && state.inEffect) {
					state.trigger({ TARGET_PLAYER: `${C.Name} (${C.MemberNumber})` });
				}
				return false;
			});
			hookDialogMenuButtonClick("BCX_LockDisabled", (C) => {
				if (C.ID !== 0 && state.inEffect) {
					state.triggerAttempt({ TARGET_PLAYER: `${C.Name} (${C.MemberNumber})` });
				}
				return false;
			});
		}
	});

	// TODO: Make it clearer it is blocked by BCX
	registerRule("block_wardrobe_access_self", {
		name: "Forbid wardrobe use on self",
		icon: icon_restrictions,
		shortDescription: "PLAYER_NAME using PLAYER_NAME's wardrobe",
		longDescription: "This rule forbids PLAYER_NAME to access her own wardrobe. (Others still can change her clothes normally)",
		triggerTexts: {
			infoBeep: "You are not allowed to change what you are wearing!",
			attempt_log: "PLAYER_NAME tried to use their wardrobe, which was forbidden",
			log: "PLAYER_NAME used their wardrobe, which was forbidden"
		},
		defaultLimit: ConditionsLimit.normal,
		load(state) {
			hookFunction("Player.CanChange", 2, (args, next) => {
				return !state.isEnforced && next(args);
			}, ModuleCategory.Rules);
			hookFunction("CharacterAppearanceLoadCharacter", 0, (args, next) => {
				const C = args[0] as Character;
				if (C.ID === 0 && state.inEffect) {
					state.trigger();
				}
				return next(args);
			}, ModuleCategory.Rules);
		}
	});

	// TODO: Make it clearer it is blocked by BCX
	registerRule("block_wardrobe_access_others", {
		name: "Forbid wardrobe use on others",
		icon: icon_restrictions,
		longDescription: "This rule forbids PLAYER_NAME to use the wardrobe of other club members.",
		triggerTexts: {
			infoBeep: "You are not allowed to change what others wear!",
			attempt_log: "PLAYER_NAME tried to use TARGET_PLAYER's wardrobe, which was forbidden",
			log: "PLAYER_NAME used TARGET_PLAYER's wardrobe, which was forbidden"
		},
		defaultLimit: ConditionsLimit.normal,
		load(state) {
			hookFunction("ChatRoomCanChangeClothes", 5, (args, next) => {
				if (state.isEnforced)
					return false;
				return next(args);
			}, ModuleCategory.Rules);
			hookFunction("CharacterAppearanceLoadCharacter", 0, (args, next) => {
				const C = args[0] as Character;
				if (C.ID !== 0 && state.inEffect) {
					state.trigger();
				}
				return next(args);
			}, ModuleCategory.Rules);
		}
	});

	/* TODO: Implement
	registerRule("restrict_allowed_poses", {
		name: "Restrict allowed body poses",
		icon: icon_restrictions,
		longDescription: "Only being allowed to be in certain poses, like kneeling or holding arms up.",
		triggerTexts: {
			infoBeep: "You are not allowed to be in the current pose!",
			attempt_log: "PLAYER_NAME tried to change her pose in a forbidden way",
			log: "PLAYER_NAME changed her pose in a forbidden way"
		},
		defaultLimit: ConditionsLimit.normal,
		dataDefinition: {
			poseButtons: {
				type: "poseSelect",
				default: [],
				description: "TODO:poseButtons"
			}
		}
	});
	*/

	// TODO: Triggers on opening chat create *window*, improve to trigger on actual room creation
	registerRule("block_creating_rooms", {
		name: "Forbid creating new rooms",
		icon: icon_restrictions,
		longDescription: "This rule forbids PLAYER_NAME to create new rooms.",
		triggerTexts: {
			infoBeep: "You are not allowed to create a new room!",
			attempt_log: "PLAYER_NAME tried to create a chatroom, which was forbidden",
			log: "PLAYER_NAME created a chatroom, which was forbidden",
			announce: "",
			attempt_announce: ""
		},
		defaultLimit: ConditionsLimit.blocked,
		load(state) {
			// TODO: Fix for NMod
			if (!NMod) {
				hookFunction("ChatSearchRun", 0, (args, next) => {
					next(args);
					if (state.isEnforced) {
						DrawButton(1280, 898, 280, 64, TextGet("CreateRoom"), "Gray", undefined, "Blocked by BCX", true);
					}
				}, ModuleCategory.Rules);
			}
			hookFunction("CommonSetScreen", 5, (args, next) => {
				if (args[0] === "Online" && args[1] === "ChatCreate") {
					if (state.isEnforced) {
						state.triggerAttempt();
						return;
					} else if (state.inEffect) {
						state.trigger();
					}
				}
				next(args);
			}, ModuleCategory.Rules);
		}
	});

	// TODO: Triggers on attempting to enter room, improve to trigger on actual room entry
	registerRule("block_entering_rooms", {
		name: "Restrict entering rooms",
		icon: icon_restrictions,
		shortDescription: "only allow entering specific ones",
		longDescription: "This rule forbids PLAYER_NAME to enter all rooms, that are not on an editable whitelist of still allowed ones. NOTE: As safety measure this rule is not in effect while the list is empty. TIP: This rule can be combined with the rule \"Forbid creating new rooms\".",
		triggerTexts: {
			infoBeep: "You are not allowed to enter this room!",
			attempt_log: "PLAYER_NAME tried to enter a forbidden room",
			log: "PLAYER_NAME entered a forbidden room",
			attempt_announce: "",
			announce: "PLAYER_NAME violated a rule to not enter this room"
		},
		defaultLimit: ConditionsLimit.blocked,
		dataDefinition: {
			roomList: {
				type: "stringList",
				default: [],
				description: "Only joining rooms with these names is allowed:"
			}
		},
		load(state) {
			// TODO: Fix for NMod
			if (!NMod) {
				hookFunction("ChatSearchJoin", 5, (args, next) => {
					if (state.inEffect && state.customData && state.customData.roomList.length > 0) {
						// Scans results
						let X = 25;
						let Y = 25;
						for (let C = ChatSearchResultOffset; C < ChatSearchResult.length && C < (ChatSearchResultOffset + 24); C++) {
							// If the player clicked on a valid room
							if (MouseIn(X, Y, 630, 85)) {
								if (!state.customData.roomList.some(name => name.toLocaleLowerCase() === ChatSearchResult[C].Name.toLocaleLowerCase())) {
									if (state.isEnforced) {
										state.triggerAttempt();
										return;
									} else {
										state.trigger();
									}
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
					if (state.isEnforced && state.customData && state.customData.roomList.length > 0) {
						// Scans results
						let X = 25;
						let Y = 25;
						for (let C = ChatSearchResultOffset; C < ChatSearchResult.length && C < (ChatSearchResultOffset + 24); C++) {
							if (!state.customData.roomList.some(name => name.toLocaleLowerCase() === ChatSearchResult[C].Name.toLocaleLowerCase())) {
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
		}
	});

	registerRule("block_freeing_self", {
		name: "Forbid freeing self",
		icon: icon_restrictions,
		shortDescription: "PLAYER_NAME removing any items from PLAYER_NAME's body",
		longDescription: "This rule forbids PLAYER_NAME to remove any items from her own body. Other people can still remove them.",
		triggerTexts: {
			infoBeep: "You are not allowed to remove an item from your body!",
			attempt_log: "PLAYER_NAME tried to remove a worn item, which was forbidden",
			log: "PLAYER_NAME removed a worn item, which was forbidden"
		},
		defaultLimit: ConditionsLimit.normal,
		load(state) {
			OverridePlayerDialog("BCX_RemoveDisabled", "Usage blocked by BCX");
			OverridePlayerDialog("BCX_StruggleDisabled", "Usage blocked by BCX");
			OverridePlayerDialog("BCX_DismountDisabled", "Usage blocked by BCX");
			OverridePlayerDialog("BCX_EscapeDisabled", "Usage blocked by BCX");
			RedirectGetImage("Icons/BCX_Remove.png", "Icons/Remove.png");
			RedirectGetImage("Icons/BCX_Struggle.png", "Icons/Struggle.png");
			RedirectGetImage("Icons/BCX_Dismount.png", "Icons/Dismount.png");
			RedirectGetImage("Icons/BCX_Escape.png", "Icons/Escape.png");
			hookFunction("DialogMenuButtonBuild", 0, (args, next) => {
				next(args);
				const C = args[0] as Character;
				if (C.ID === 0 && state.isEnforced) {
					const index_remove = DialogMenuButton.indexOf("Remove");
					const index_struggle = DialogMenuButton.indexOf("Struggle");
					const index_dismount = DialogMenuButton.indexOf("Dismount");
					const index_escape = DialogMenuButton.indexOf("Escape");
					if (index_remove >= 0) {
						DialogMenuButton[index_remove] = "BCX_RemoveDisabled";
					}
					if (index_struggle >= 0) {
						DialogMenuButton[index_struggle] = "BCX_StruggleDisabled";
					}
					if (index_dismount >= 0) {
						DialogMenuButton[index_dismount] = "BCX_DismountDisabled";
					}
					if (index_escape >= 0) {
						DialogMenuButton[index_escape] = "BCX_EscapeDisabled";
					}
				}
			}, ModuleCategory.Rules);
			const trigger = (C: Character): boolean => {
				if (C.ID === 0 && state.inEffect) {
					state.trigger();
				}
				return false;
			};
			const attempt = (C: Character): boolean => {
				if (C.ID === 0 && state.inEffect) {
					state.triggerAttempt();
				}
				return false;
			};
			hookDialogMenuButtonClick("Remove", trigger);
			hookDialogMenuButtonClick("BCX_RemoveDisabled", attempt);
			hookDialogMenuButtonClick("Struggle", trigger);
			hookDialogMenuButtonClick("BCX_StruggleDisabled", attempt);
			hookDialogMenuButtonClick("Dismount", trigger);
			hookDialogMenuButtonClick("BCX_DismountDisabled", attempt);
			hookDialogMenuButtonClick("Escape", trigger);
			hookDialogMenuButtonClick("BCX_EscapeDisabled", attempt);
		}
	});

	registerRule("block_tying_others", {
		name: "Forbid tying up others",
		icon: icon_restrictions,
		shortDescription: "either everybody or only more dominant characters",
		longDescription: "This rule forbids PLAYER_NAME to use any items on other characters. Can be set to only affect using items on characters with a higher dominant / lower submissive score than PLAYER_NAME has.",
		triggerTexts: {
			infoBeep: "You are not allowed to use an item on TARGET_PLAYER!",
			attempt_log: "PLAYER_NAME tried to use an item on TARGET_PLAYER, which was forbidden",
			log: "PLAYER_NAME used an item on TARGET_PLAYER, which was forbidden"
		},
		defaultLimit: ConditionsLimit.normal,
		dataDefinition: {
			onlyMoreDominantsToggle: {
				type: "toggle",
				default: true,
				description: "Only forbid tying people with higher dominance"
			}
		},
		load(state) {
			hookFunction("DialogItemClick", 5, (args, next) => {
				if (state.inEffect && state.customData) {
					const toggleOn = state.customData.onlyMoreDominantsToggle;
					const C = (Player.FocusGroup != null) ? Player : CurrentCharacter;
					if (C && C.ID !== 0 && (toggleOn ? ReputationCharacterGet(Player, "Dominant") < ReputationCharacterGet(C, "Dominant") : true)) {
						if (state.isEnforced) {
							state.triggerAttempt({ TARGET_PLAYER: `${C.Name} (${C.MemberNumber})` });
							return;
						} else {
							state.trigger({ TARGET_PLAYER: `${C.Name} (${C.MemberNumber})` });
						}
					}
				}
				next(args);
			}, ModuleCategory.Rules);
			hookFunction("AppearanceGetPreviewImageColor", 5, (args, next) => {
				const toggleOn = state.customData?.onlyMoreDominantsToggle;
				const C = args[0] as Character;
				if (C && C.ID !== 0 && state.isEnforced && (toggleOn ? ReputationCharacterGet(Player, "Dominant") < ReputationCharacterGet(C, "Dominant") : true)) {
					return "grey";
				}
				return next(args);
			}, ModuleCategory.Rules);
		}
	});

	registerRule("block_antiblind", {
		name: "Forbid the antiblind option",
		icon: icon_restrictions,
		shortDescription: "BCX's .antiblind command",
		longDescription: "This rule forbids PLAYER_NAME to use the antiblind command. Antiblind is a BCX feature that enables a BCX user to see the whole chat room and all other characters at all times, even when wearing a blinding item. If PLAYER_NAME should be forbidden to use the command, this rule should be used.",
		triggerTexts: {
			infoBeep: "You are not allowed to use the antiblind command!",
			attempt_log: "PLAYER_NAME tried to use the antiblind command",
			log: "PLAYER_NAME used the antiblind command"
		},
		defaultLimit: ConditionsLimit.normal
		// Implmented externally
	});
}
