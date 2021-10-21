import { ConditionsLimit, ModuleCategory } from "../constants";
import { registerRule } from "../modules/rules";
import { AccessLevel, getCharacterAccessLevel } from "../modules/authority";
import { hookFunction } from "../patching";
import { InfoBeep } from "../utilsClub";
import { getAllCharactersInRoom } from "../characters";

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
		},
		load(state) {
			const strengthMap: Record<RuleCustomDataTypesMap["strengthSelect"], number> = {
				light: 1,
				medium: 2,
				heavy: 4
			};
			hookFunction("Player.GetDeafLevel", 1, (args, next) => {
				let res = next(args);
				if (state.isEnforced && state.customData) {
					res += strengthMap[state.customData.deafeningStrength];
				}
				return res;
			}, ModuleCategory.Rules);
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
		},
		load(state) {
			const strengthMap: Record<RuleCustomDataTypesMap["strengthSelect"], number> = {
				light: 1,
				medium: 2,
				heavy: 3
			};
			hookFunction("Player.GetBlindLevel", 1, (args, next) => {
				let res = next(args);
				if (state.isEnforced && state.customData) {
					res += strengthMap[state.customData.blindnessStrength];
				}
				return Math.min(res, Player.GameplaySettings?.SensDepChatLog === "SensDepLight" ? 2 : 3);
			}, ModuleCategory.Rules);
		}
	});

	registerRule("sensory_deprivation_eyes", {
		name: "Full blind when eyes closed",
		icon: "Icons/Swap.png",
		loggable: false,
		longDescription: "Sensory deprivation: Enforce that there is a full blindess effect when the eyes are closed.",
		defaultLimit: ConditionsLimit.normal,
		tick(state) {
			if (state.isEnforced) {
				DialogFacialExpressionsSelectedBlindnessLevel = 3;
			}
			return false;
		},
		load(state) {
			hookFunction("DialogClickExpressionMenu", 5, (args, next) => {
				if (state.isEnforced && MouseIn(220, 50, 90, 90))
					return;
				return next(args);
			});
		}
	});

	registerRule("sensory_deprivation_blindfolds", {
		name: "Full blind when blindfolded",
		icon: "Icons/Swap.png",
		loggable: false,
		longDescription: "Sensory deprivation: Enforce that there is always a full blindess effect when wearing any blindfold type.",
		defaultLimit: ConditionsLimit.normal,
		load(state) {
			hookFunction("Player.GetBlindLevel", 2, (args, next) => {
				if (state.isEnforced && ["BlindHeavy", "BlindNormal", "BlindLight"].some(i => Player.Effect.includes(i)))
					return 3;
				return next(args);
			}, ModuleCategory.Rules);
		}
	});

	registerRule("always_slow", {
		name: "Leave rooms slowly",
		icon: "Icons/Swap.png",
		loggable: false,
		longDescription: "PLAYER_NAME has to always slowly leave the room, independant of items",
		defaultLimit: ConditionsLimit.normal,
		load(state) {
			hookFunction("Player.IsSlow", 2, (args, next) => {
				return state.isEnforced || next(args);
			}, ModuleCategory.Rules);
		}
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
		},
		load(state) {
			hookFunction("ActivityOrgasmPrepare", 5, (args, next) => {
				const C = args[0] as Character;
				if (state.isEnforced && state.customData && C.ID === 0) {
					if (state.customData.orgasmHandling === "edge") {
						if (C.ArousalSettings) {
							C.ArousalSettings.Progress = 95;
						}
						return;
					} else if (state.customData.orgasmHandling === "ruined") {
						const backup = Player.Effect;
						Player.Effect = backup.concat("DenialMode", "RuinOrgasms");
						next(args);
						Player.Effect = backup;
						return;
					} else if (state.customData.orgasmHandling === "noResist") {
						ActivityOrgasmGameResistCount = 496.5;
					}
				}
				return next(args);
			}, ModuleCategory.Rules);
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
		},
		tick(state) {
			let changed = false;
			if (state.isEnforced && state.customData && ChatRoomPlayerIsAdmin() && ServerPlayerIsInChatRoom()) {
				let hasAdmin = false;
				for (const character of getAllCharactersInRoom()) {
					if (!character.isPlayer() && getCharacterAccessLevel(character) <= state.customData.minimumRole) {
						if (ChatRoomData?.Admin?.includes(character.MemberNumber)) {
							hasAdmin = true;
						} else {
							ServerSend("ChatRoomAdmin", { MemberNumber: character.MemberNumber, Action: "Promote" });
							changed = true;
						}
					}
				}
				if (!changed && hasAdmin && ChatRoomData && state.customData.removeAdminToggle) {
					const UpdatedRoom = {
						Name: ChatRoomData.Name,
						Description: ChatRoomData.Description,
						Background: ChatAdminBackgroundSelect,
						Limit: ChatRoomData.Limit.toString(),
						Admin: ChatRoomData.Admin.filter((i: number) => i !== Player.MemberNumber),
						Ban: ChatRoomData.Ban,
						BlockCategory: ChatRoomData.BlockCategory.slice(),
						Game: ChatRoomGame,
						Private: ChatRoomData.Private,
						Locked: ChatRoomData.Locked
					};
					ServerSend("ChatRoomAdmin", { MemberNumber: Player.ID, Room: UpdatedRoom, Action: "Update" });
					changed = true;
				}
			}
			return changed;
		}
	});

	registerRule("limit_tied_admins_power", {
		name: "Limit bound admin power",
		icon: "Icons/Swap.png",
		loggable: false,
		shortDescription: "restrict room admin powers massively while restrained",
		longDescription: "When considered tied up by Bondage Club standards, PLAYER_NAME only has access to kick/ban room admin powers, nothing else. This rule can be nicely combined with the rule to enforce joining the last room to trap PLAYER_NAME in it.",
		defaultLimit: ConditionsLimit.limited,
		load(state) {
			hookFunction("ChatAdminLoad", 0, (args, next) => {
				next(args);
				if (state.isEnforced && ChatRoomPlayerIsAdmin() && Player.IsRestrained()) {
					document.getElementById("InputName")?.setAttribute("disabled", "disabled");
					document.getElementById("InputDescription")?.setAttribute("disabled", "disabled");
					document.getElementById("InputSize")?.setAttribute("disabled", "disabled");
					document.getElementById("InputAdminList")?.setAttribute("disabled", "disabled");
				}
			});
			hookFunction("ChatAdminRun", 0, (args, next) => {
				next(args);
				if (state.isEnforced && ChatRoomPlayerIsAdmin() && Player.IsRestrained()) {
					DrawButton(100, 770, 250, 65, TextGet("AddOwnerAdminList"), "#ebebe4", "", "", true);
					DrawButton(365, 770, 250, 65, TextGet("AddLoverAdminList"), "#ebebe4", "", "", true);
					DrawBackNextButton(1300, 450, 500, 60, DialogFindPlayer(ChatAdminBackgroundSelect), "#ebebe4", "",
						() => DialogFindPlayer((ChatAdminBackgroundIndex === 0) ? ChatCreateBackgroundList[ChatCreateBackgroundList.length - 1] : ChatCreateBackgroundList[ChatAdminBackgroundIndex - 1]),
						() => DialogFindPlayer((ChatAdminBackgroundIndex >= ChatCreateBackgroundList.length - 1) ? ChatCreateBackgroundList[0] : ChatCreateBackgroundList[ChatAdminBackgroundIndex + 1]),
						true
					);
					DrawButton(1840, 450, 60, 60, "", "#ebebe4", "Icons/Small/Preference.png", "", true);
					DrawBackNextButton(1625, 575, 275, 60, TextGet("Game" + ChatAdminGame), "#ebebe4", "", () => "", () => "", true);
					DrawButton(1486, 708, 64, 64, "", "#ebebe4", ChatAdminPrivate ? "Icons/Checked.png" : "", "", true);
					DrawButton(1786, 708, 64, 64, "", "#ebebe4", ChatAdminLocked ? "Icons/Checked.png" : "", "", true);
					MainCanvas.fillStyle = "#ffff88";
					MainCanvas.fillRect(100, 850, 1125, 70);
					MainCanvas.strokeStyle = "Black";
					MainCanvas.strokeRect(100, 850, 1125, 70);
					DrawText("Some settings are not available due to a BCX rule.", 650, 885, "Black", "Gray");
				}
			});
			hookFunction("ChatAdminClick", 5, (args, next) => {
				if (state.isEnforced && ChatRoomPlayerIsAdmin() && Player.IsRestrained() && (
					MouseIn(1300, 75, 600, 350) ||
					MouseIn(1840, 450, 60, 60) ||
					MouseIn(1300, 450, 500, 60) ||
					MouseIn(1625, 575, 275, 60) ||
					MouseIn(1486, 708, 64, 64) ||
					MouseIn(1786, 708, 64, 64) ||
					MouseIn(100, 770, 250, 65) ||
					MouseIn(365, 770, 250, 65)
				))
					return;
				return next(args);
			});
			hookFunction("CommonSetScreen", 5, (args, next) => {
				if (state.isEnforced && args[0] === "Online" && args[1] === "ChatBlockItem" && ChatRoomPlayerIsAdmin() && Player.IsRestrained()) {
					ChatBlockItemEditable = false;
				}
				return next(args);
			});
			hookFunction("ChatRoomAdminAction", 5, (args, next) => {
				const ActionType = args[1] as string;
				if (state.isEnforced && Player.IsRestrained() &&
					ActionType !== "Kick" && ActionType !== "Ban"
				) {
					InfoBeep(`BCX: You are not allowed to use this while restrained.`, 7_000);
					DialogLeave();
					return;
				}
				return next(args);
			});
		}
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
		},
		tick(state) {
			if (state.isEnforced && state.customData) {
				if (Player.Description !== state.customData.playersProfileDescription) {
					let Description = Player.Description = state.customData.playersProfileDescription;
					const CompressedDescription = "╬" + LZString.compressToUTF16(Description);
					if (CompressedDescription.length < Description.length || Description.startsWith("╬")) {
						Description = CompressedDescription;
					}
					ServerAccountUpdate.QueueData({ Description });
					state.trigger();
					return true;
				}
			}
			return false;
		}
	});

	registerRule("always_in_suitcase_game", {
		name: "Always carry a suitcase",
		icon: "Icons/Swap.png",
		loggable: false,
		shortDescription: "from the kidnappers league multiplayer game",
		longDescription: "Forces PLAYER_NAME to constantly participate in the kidnappers league's suitcase delivery task, by automatically replacing the suitcase when it was opened with a new one, every time the room is changed.",
		defaultLimit: ConditionsLimit.normal,
		tick(state) {
			const misc = InventoryGet(Player, "ItemMisc");
			if (state.isEnforced && ReputationGet("Kidnap") > 0 && Player.CanTalk() && !misc) {
				KidnapLeagueOnlineBountyStart();
				return true;
			}
			return false;
		}
	});
}
