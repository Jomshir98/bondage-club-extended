import { ConditionsLimit, ModuleCategory } from "../constants";
import { registerRule } from "../modules/rules";
import { AccessLevel, getCharacterAccessLevel } from "../modules/authority";
import { patchFunction, hookFunction } from "../patching";
import { ChatRoomActionMessage, getCharacterName, InfoBeep } from "../utilsClub";
import { ChatroomCharacter, getChatroomCharacter } from "../characters";
import { getAllCharactersInRoom, registerEffectBuilder } from "../characters";
import { isObject } from "../utils";

export function initRules_bc_alter() {
	registerRule("alt_restrict_hearing", {
		name: "Sensory deprivation: Sound",
		icon: "Icons/Swap.png",
		loggable: false,
		shortDescription: "impacts PLAYER_NAME's hearing; adjustable",
		longDescription: "This rule impacts PLAYER_NAME's natural ability to hear in the same way items do, independent of them (strength of deafening can be adjusted).",
		defaultLimit: ConditionsLimit.normal,
		dataDefinition: {
			deafeningStrength: {
				type: "listSelect",
				options: [["light", "Light"], ["medium", "Medium"], ["heavy", "Heavy"]],
				default: "light",
				description: "Hearing impairment:"
			}
		},
		load(state) {
			const strengthMap: Record<string, number> = {
				light: 1,
				medium: 2,
				heavy: 4
			};
			hookFunction("Player.GetDeafLevel", 1, (args, next) => {
				let res = next(args);
				if (state.isEnforced && state.customData) {
					res += strengthMap[state.customData.deafeningStrength] ?? 0;
				}
				return res;
			}, ModuleCategory.Rules);
		}
	});

	registerRule("alt_hearing_whitelist", {
		name: "Hearing whitelist",
		icon: "Icons/Swap.png",
		loggable: false,
		shortDescription: "of members whom PLAYER_NAME can always understand",
		longDescription: "This rule defines a list of members whose voice can always be understood by PLAYER_NAME - independent of any sensory deprivation items or hearing impairing BCX rules on PLAYER_NAME. There is an additional option to toggle whether PLAYER_NAME can still understand a white-listed member's voice if that member is speech impaired herself (e.g. by being gagged).",
		defaultLimit: ConditionsLimit.normal,
		dataDefinition: {
			whitelistedMembers: {
				type: "memberNumberList",
				default: [],
				description: "Members numbers still heard while hearing impaired:",
				Y: 350
			},
			ignoreGaggedMembersToggle: {
				type: "toggle",
				default: false,
				description: "Also understand if those are speech impaired",
				Y: 750
			}
		},
		load(state) {
			hookFunction("SpeechGarble", 2, (args, next) => {
				const C = args[0] as Character;
				if (state.isEnforced &&
					state.customData &&
					C.MemberNumber != null &&
					state.customData.whitelistedMembers
						.filter(m => m !== Player.MemberNumber)
						.includes(C.MemberNumber) &&
					(C.CanTalk() || state.customData.ignoreGaggedMembersToggle)
				) {
					return args[1];
				}
				return next(args);
			}, ModuleCategory.Rules);
		}
	});

	registerRule("alt_restrict_sight", {
		name: "Sensory deprivation: Sight",
		icon: "Icons/Swap.png",
		loggable: false,
		shortDescription: "impacts PLAYER_NAME's sight; adjustable",
		longDescription: "This rule impacts PLAYER_NAME's natural ability to see in the same way items do, independent of them (strength of blindness can be adjusted).",
		defaultLimit: ConditionsLimit.normal,
		dataDefinition: {
			blindnessStrength: {
				type: "listSelect",
				options: [["light", "Light"], ["medium", "Medium"], ["heavy", "Heavy"]],
				default: "light",
				description: "Eyesight impairment:"
			}
		},
		load(state) {
			const strengthMap: Record<string, number> = {
				light: 1,
				medium: 2,
				heavy: 3
			};
			hookFunction("Player.GetBlindLevel", 1, (args, next) => {
				let res = next(args);
				if (state.isEnforced && state.customData) {
					res += strengthMap[state.customData.blindnessStrength] ?? 0;
				}
				return Math.min(res, Player.GameplaySettings?.SensDepChatLog === "SensDepLight" ? 2 : 3);
			}, ModuleCategory.Rules);
		}
	});

	registerRule("alt_seeing_whitelist", {
		name: "Seeing whitelist",
		icon: "Icons/Swap.png",
		loggable: false,
		shortDescription: "of members whom PLAYER_NAME can always see",
		longDescription: "This rule defines a list of members whose appearance can always be seen normally by PLAYER_NAME - independent of any blinding items or seeing impairing BCX rules on PLAYER_NAME.",
		defaultLimit: ConditionsLimit.normal,
		dataDefinition: {
			whitelistedMembers: {
				type: "memberNumberList",
				default: [],
				description: "Members still seen while under blindness:"
			}
		},
		load(state) {
			let noBlind = false;
			hookFunction("DrawCharacter", 0, (args, next) => {
				const C = args[0] as Character;
				if (state.isEnforced && state.customData && C.MemberNumber != null && state.customData.whitelistedMembers.includes(C.MemberNumber)) {
					noBlind = true;
				}
				next(args);
				noBlind = false;
			}, ModuleCategory.Rules);
			hookFunction("DialogMenuButtonBuild", 0, (args, next) => {
				const C = args[0] as Character;
				if (state.isEnforced && state.customData && C.MemberNumber != null && state.customData.whitelistedMembers.includes(C.MemberNumber)) {
					noBlind = true;
				}
				next(args);
				noBlind = false;
			}, ModuleCategory.Rules);
			hookFunction("ChatRoomClickCharacter", 0, (args, next) => {
				const C = args[0] as Character;
				if (state.isEnforced && state.customData && C.MemberNumber != null && state.customData.whitelistedMembers.includes(C.MemberNumber)) {
					noBlind = true;
				}
				next(args);
				noBlind = false;
			}, ModuleCategory.Rules);
			hookFunction("ChatRoomMessage", 0, (args, next) => {
				let C: ChatroomCharacter | null = null;
				if (typeof args[0]?.Sender === "number") {
					C = getChatroomCharacter(args[0].Sender);
				}
				if (C && state.isEnforced && state.customData && C.MemberNumber != null && state.customData.whitelistedMembers.includes(C.MemberNumber)) {
					noBlind = true;
				}
				next(args);
				noBlind = false;
			}, ModuleCategory.Rules);
			hookFunction("Player.GetBlindLevel", 6, (args, next) => {
				if (noBlind)
					return 0;
				return next(args);
			}, ModuleCategory.Rules);
			hookFunction("ChatRoomUpdateDisplay", 0, (args, next) => {
				next(args);
				if (state.isEnforced && state.customData) {
					if (ChatRoomCharacterCount === 1) {
						ChatRoomCharacterDrawlist = [Player];
					}
					ChatRoomSenseDepBypass = true;
					for (const C of ChatRoomCharacter) {
						if (C.MemberNumber != null && !ChatRoomCharacterDrawlist.includes(C) && state.customData.whitelistedMembers.includes(C.MemberNumber)) {
							ChatRoomCharacterDrawlist.push(C);
						}
					}
					ChatRoomCharacterDrawlist.sort((a, b) => {
						return ChatRoomCharacter.indexOf(a) - ChatRoomCharacter.indexOf(b);
					});
					ChatRoomCharacterCount = ChatRoomCharacterDrawlist.length;
				}
			});
		}
	});

	registerRule("alt_eyes_fullblind", {
		name: "Fully blind when eyes are closed",
		icon: "Icons/Swap.png",
		loggable: false,
		longDescription: "This rule enforces full blindness when the eyes are closed. (Light sensory deprivation setting is still respected and doesn't blind fully)",
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

	registerRule("alt_blindfolds_fullblind", {
		name: "Fully blind when blindfolded",
		icon: "Icons/Swap.png",
		loggable: false,
		longDescription: "This rule enforces full blindness when wearing any item that limits sight in any way. (This rules does NOT respect Light sensory deprivation setting and always forces player to be fully blind)",
		defaultLimit: ConditionsLimit.normal,
		load(state) {
			hookFunction("Player.GetBlindLevel", 2, (args, next) => {
				if (state.isEnforced && ["BlindHeavy", "BlindNormal", "BlindLight"].some(i => Player.Effect.includes(i)))
					return 3;
				return next(args);
			}, ModuleCategory.Rules);
		}
	});

	registerRule("alt_always_slow", {
		name: "Always leave rooms slowly",
		icon: "Icons/Swap.png",
		loggable: false,
		longDescription: "This rule forces PLAYER_NAME to always leave the room slowly, independent of the items she is wearing. WARNING: Due to limitation in Bondage Club itself, only BCX users will be able to stop PLAYER_NAME from leaving the room.",
		defaultLimit: ConditionsLimit.normal,
		init(state) {
			registerEffectBuilder(PlayerEffects => {
				if (state.isEnforced && !PlayerEffects.Effect.includes("Slow")) {
					PlayerEffects.Effect.push("Slow");
				}
			});
		}
	});

	registerRule("alt_control_orgasms", {
		name: "Control ability to orgasm",
		icon: "Icons/Swap.png",
		loggable: false,
		shortDescription: "adjustable: only-edge, only-ruin, no-resist",
		longDescription: "This rule impacts PLAYER_NAME's ability to control their orgasms, independent of items. There are three control options, which are: Never cum (always edge, the bar never reaches 100%), force into ruined orgasm (orgasm screen starts, but doesn't let her actually cum) and prevent resisting orgasm (able to enter orgasm screen, but unable to resist it).",
		defaultLimit: ConditionsLimit.limited,
		dataDefinition: {
			orgasmHandling: {
				type: "listSelect",
				default: "edge",
				options: [["edge", "Edge"], ["ruined", "Ruin"], ["noResist", "Prevent resisting"]],
				description: "Orgasm attempts will be fixed to:"
			}
		},
		load(state) {
			hookFunction("ServerSend", 0, (args, next) => {
				if (args[0] === "ChatRoomChat" && isObject(args[1]) && typeof args[1].Content === "string" && args[1].Type === "Activity" && state.isEnforced) {
					if (args[1].Content.startsWith("OrgasmFailPassive")) {
						args[1].Content = "OrgasmFailPassive0";
					} else if (args[1].Content.startsWith("OrgasmFailTimeout")) {
						args[1].Content = "OrgasmFailTimeout2";
					} else if (args[1].Content.startsWith("OrgasmFailResist")) {
						args[1].Content = "OrgasmFailResist2";
					} else if (args[1].Content.startsWith("OrgasmFailSurrender")) {
						args[1].Content = "OrgasmFailSurrender2";
					}
				}
				next(args);
			});
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

	registerRule("alt_secret_orgasms", {
		name: "Secret orgasm progress",
		icon: "Icons/Swap.png",
		loggable: false,
		shortDescription: "unable to see the own arousal meter",
		longDescription: "This rule prevents PLAYER_NAME from seeing their own arousal meter, even while it is active and working. This means, that it is a surprise to them, when the orgasm (quick-time event) happens. Does not effect other characters being able to see the meter, if club settings allow that.",
		defaultLimit: ConditionsLimit.limited,
		load(state) {
			hookFunction("DrawArousalMeter", 5, (args, next) => {
				const C = args[0] as Character;
				if (C.ID === 0 && state.isEnforced)
					return;
				return next(args);
			});
			hookFunction("ChatRoomClickCharacter", 5, (args, next) => {
				const C = args[0] as Character;
				const CharX = args[1];
				const CharY = args[2];
				const Zoom = args[3];
				if (C.ID === 0 && state.isEnforced && MouseIn(CharX + 60 * Zoom, CharY + 400 * Zoom, 80 * Zoom, 100 * Zoom) && !C.ArousalZoom) return;
				if (C.ID === 0 && state.isEnforced && MouseIn(CharX + 50 * Zoom, CharY + 200 * Zoom, 100 * Zoom, 500 * Zoom) && C.ArousalZoom) return;
				return next(args);
			});
		}
	});

	registerRule("alt_room_admin_transfer", {
		name: "Room admin transfer",
		icon: "Icons/Swap.png",
		loggable: false,
		shortDescription: "give admin to defined roles",
		longDescription: "This rule lets you define a minimum role which PLAYER_NAME will automatically give room admin rights to (if she has admin rights in the room). Also has the option to remove admin rights from PLAYER_NAME afterwards.",
		defaultLimit: ConditionsLimit.blocked,
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
						Background: ChatRoomData.Background,
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

	registerRule("alt_room_admin_limit", {
		name: "Limit bound admin power",
		icon: "Icons/Swap.png",
		loggable: false,
		shortDescription: "restrict room admin powers while restrained",
		longDescription: "This rule forbids PLAYER_NAME to do any room admin actions (except for kick/ban), when she is tied (meaning either being unable to use her hands or unable to leave the room). Tip: This rule can be combined with the rule to enforce joining the last room to trap her in it.",
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

	registerRule("alt_set_profile_description", {
		name: "Control profile online description",
		icon: "Icons/Swap.png",
		loggable: false,
		shortDescription: "directly sets PLAYER_NAME's description",
		longDescription: "This rule sets PLAYER_NAME's online description (in her profile) to any text entered in the rule config, blocking changes to it.",
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

	registerRule("alt_force_suitcase_game", {
		name: "Always carry a suitcase",
		icon: "Icons/Swap.png",
		loggable: false,
		shortDescription: "from the kidnappers league multiplayer game",
		longDescription: "This rule forces PLAYER_NAME to constantly participate in the kidnappers league's suitcase delivery task, by automatically giving her a new suitcase, whenever the suitcase item slot is empty.",
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

	registerRule("alt_restrict_leashability", {
		name: "Restrict being leashed by others",
		icon: "Icons/Swap.png",
		loggable: false,
		longDescription: "This rule only allows selected roles to leash PLAYER_NAME, responding with a message about unsuccessful leashing to others when they attempt to do so.",
		defaultLimit: ConditionsLimit.limited,
		dataDefinition: {
			minimumRole: {
				type: "roleSelector",
				default: AccessLevel.owner,
				description: "Minimum role that is allowed to leash:",
				Y: 320
			}
		},
		load(state) {
			hookFunction("ChatRoomCanBeLeashedBy", 4, (args, next) => {
				const sourceMemberNumber = args[0] as number;
				if (sourceMemberNumber !== 0 &&
					sourceMemberNumber !== Player.MemberNumber &&
					state.isEnforced &&
					state.customData &&
					getCharacterAccessLevel(sourceMemberNumber) > state.customData.minimumRole
				) {
					ChatRoomActionMessage(`${Player.Name}'s leash seems to be cursed and slips out of ${getCharacterName(sourceMemberNumber, "[unknown]")}'s hand.`);
					return false;
				}
				return next(args);
			});
		}
	});

	registerRule("alt_hide_friends", {
		name: "Hide online friends if blind",
		icon: "Icons/Swap.png",
		loggable: false,
		shortDescription: "also preventing beeps from the friendlist - exceptions settable",
		longDescription: "This rule hides persons on PLAYER_NAME's friend list when she is fully blinded, which also makes sending beeps impossible. Recieved beeps can still be answered. The rule allows to manage a list of members who can be seen normally.",
		defaultLimit: ConditionsLimit.blocked,
		dataDefinition: {
			allowedMembers: {
				type: "memberNumberList",
				default: [],
				description: "Members numbers that can always be seen:"
			}
		},
		load(state) {
			patchFunction("FriendListLoadFriendList", {
				'data.forEach(friend => {': 'data.forEach(friend => { if (typeof friend.MemberNumber !== "number") return;'
			});
			patchFunction("FriendListLoadFriendList", {
				"FriendListContent += `<div class='FriendListLinkColumn' onClick='FriendListBeep(${friend.MemberNumber})'> ${BeepCaption} </div>`;": "if (typeof friend.MemberNumber === 'number') FriendListContent += `<div class='FriendListLinkColumn' onClick='FriendListBeep(${friend.MemberNumber})'> ${BeepCaption} </div>`;"
			});
			hookFunction("FriendListLoadFriendList", 1, (args, next) => {
				const data = args[0];
				const allowList = state.customData?.allowedMembers;
				if (state.isEnforced && allowList && Player.GetBlindLevel() >= 3) {
					data.forEach((friend: any) => {
						if (!allowList.includes(friend.MemberNumber)) {
							friend.MemberName = "Someone";
							friend.MemberNumber = "######";
						}
					});
				}
				return next(args);
			});
		}
	});

	registerRule("alt_forced_summoning", {
		name: "Ready to be summoned",
		icon: "Icons/Swap.png",
		loggable: false,
		shortDescription: "from anywhere to the room of the permitted caller",
		longDescription: "This rule forces PLAYER_NAME to switch rooms from anywhere in the club to the chat room of the one sending the summon after 15 seconds have passed. The rule allows to manage a list of members who are allowed to send a summon to PLAYER_NAME. It works by sending a beep message with either the set summoning text to PLAYER_NAME or just sending the word 'summon'.",
		triggerTexts: {
			infoBeep: "You are summoned by SUMMONER!"
		},
		defaultLimit: ConditionsLimit.blocked,
		dataDefinition: {
			allowedMembers: {
				type: "memberNumberList",
				default: [],
				description: "Members numbers allowed to summon:",
				Y: 300
			},
			summoningText: {
				type: "string",
				default: "Come to my room immediately",
				description: "The text used for summoning:",
				Y: 715
			}
		},
		load(state) {
			let beep = false;
			hookFunction("ServerAccountBeep", 7, (args, next) => {
				const data = args[0];

				if (isObject(data) &&
					!data.BeepType &&
					typeof data.MemberNumber === "number" &&
					state.isEnforced &&
					state.customData &&
					state.customData.allowedMembers.includes(data.MemberNumber) &&
					(data.Message.includes(state.customData.summoningText) || data.Message === "summon") &&
					data.ChatRoomName
				) {
					ChatRoomActionMessage(`${Player.Name} recieved a summon: "${state.customData.summoningText}".`);
					beep = true;
					setTimeout(() => {
						// Check if rule is still in effect!
						if (!state.isEnforced || !state.inEffect) return;

						// leave
						ChatRoomActionMessage(`The demand for ${Player.Name}'s presence is now enforced.`);
						DialogLentLockpicks = false;
						ChatRoomClearAllElements();
						ServerSend("ChatRoomLeave", "");
						ChatRoomSetLastChatRoom("");
						ChatRoomLeashPlayer = null;
						CommonSetScreen("Online", "ChatSearch");
						CharacterDeleteAllOnline();

						// join
						ChatRoomPlayerCanJoin = true;
						ServerSend("ChatRoomJoin", { Name: data.ChatRoomName });
					}, 15_000);
				}
				next(args);
				if (beep) state.triggerAttempt({ SUMMONER: `${data.MemberName} (${data.MemberNumber})` });
				beep = false;
			}, ModuleCategory.Rules);
		}
	});
}
