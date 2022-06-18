import { ConditionsLimit, ModuleCategory } from "../constants";
import { registerRule, RuleType } from "../modules/rules";
import { AccessLevel, getCharacterAccessLevel } from "../modules/authority";
import { patchFunction, hookFunction } from "../patching";
import { ChatRoomActionMessage, getCharacterName, InfoBeep } from "../utilsClub";
import { ChatroomCharacter, getChatroomCharacter } from "../characters";
import { getAllCharactersInRoom, registerEffectBuilder } from "../characters";
import { isObject } from "../utils";
import { BCX_setTimeout } from "../BCXContext";
import { queryHandlers, sendQuery } from "../modules/messaging";

export function initRules_bc_alter() {
	registerRule("alt_restrict_hearing", {
		name: "Sensory deprivation: Sound",
		type: RuleType.Alt,
		loggable: false,
		shortDescription: "impacts PLAYER_NAME's hearing; adjustable",
		longDescription: "This rule impacts PLAYER_NAME's natural ability to hear in the same way items do, independent of them (strength of deafening can be adjusted).",
		keywords: ["deafness", "limit", "permanent", "ears"],
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
		type: RuleType.Alt,
		loggable: false,
		shortDescription: "of members whom PLAYER_NAME can always understand",
		longDescription: "This rule defines a list of members whose voice can always be understood by PLAYER_NAME - independent of any sensory deprivation items or hearing impairing BCX rules on PLAYER_NAME. There is an additional option to toggle whether PLAYER_NAME can still understand a white-listed member's voice if that member is speech impaired herself (e.g. by being gagged).",
		keywords: ["deafness", "bypass", "ignore", "antigarble", "ears", "exception", "understanding"],
		defaultLimit: ConditionsLimit.normal,
		dataDefinition: {
			whitelistedMembers: {
				type: "memberNumberList",
				default: [],
				description: "Members numbers still heard while hearing impaired:",
				Y: 350,
				options: {
					pageSize: 3
				}
			},
			ignoreGaggedMembersToggle: {
				type: "toggle",
				default: false,
				description: "Also understand if those are speech impaired",
				Y: 710
			}
		},
		load(state) {
			let ignoreDeaf = false;
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
			// depends on the function PreferenceIsPlayerInSensDep()
			hookFunction("ChatRoomMessage", 9, (args, next) => {
				const data = args[0] as Record<string, unknown>;
				const C = args[0].Sender;
				if (state.isEnforced &&
					state.customData &&
					typeof C === "number" &&
					state.customData.whitelistedMembers
						.filter(m => m !== Player.MemberNumber)
						.includes(C)
				) {
					ignoreDeaf = true;
					// Handle garbled whispers
					const orig = Array.isArray(data.Dictionary) && (data.Dictionary as unknown[]).find((i): i is { Text: string; } => isObject(i) && i.Tag === "BCX_ORIGINAL_MESSAGE" && typeof i.Text === "string");
					if (orig && state.customData.ignoreGaggedMembersToggle) {
						data.Content = orig.Text;
					}
				}
				next(args);
				ignoreDeaf = false;
			}, ModuleCategory.Rules);
			// does nothing but uses GetDeafLevel -> needs to be watched
			hookFunction("PreferenceIsPlayerInSensDep", 4, (args, next) => next(args), ModuleCategory.Rules);
			hookFunction("Player.GetDeafLevel", 9, (args, next) => {
				if (ignoreDeaf) {
					return 0;
				}
				return next(args);
			}, ModuleCategory.Rules);
		}
	});

	registerRule("alt_restrict_sight", {
		name: "Sensory deprivation: Sight",
		type: RuleType.Alt,
		loggable: false,
		shortDescription: "impacts PLAYER_NAME's sight; adjustable",
		longDescription: "This rule impacts PLAYER_NAME's natural ability to see in the same way items do, independent of them (strength of blindness can be adjusted).",
		keywords: ["seeing", "blindfold", "limit", "permanent", "eyes"],
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
		type: RuleType.Alt,
		loggable: false,
		shortDescription: "of members whom PLAYER_NAME can always see",
		longDescription: "This rule defines a list of members whose appearance can always be seen normally by PLAYER_NAME - independent of any blinding items or seeing impairing BCX rules on PLAYER_NAME.",
		keywords: ["sight", "blindness", "bypass", "ignore", "antiblind", "blindfold", "eyes", "seeing"],
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
		type: RuleType.Alt,
		loggable: false,
		longDescription: "This rule enforces full blindness when the eyes are closed. (Light sensory deprivation setting is still respected and doesn't blind fully)",
		keywords: ["seeing", "blindness", "eyes", "blindfold", "realistic", "room"],
		defaultLimit: ConditionsLimit.normal,
		dataDefinition: {
			affectPlayer: {
				type: "toggle",
				default: false,
				description: "Player sees the effect also on herself"
			},
			hideNames: {
				type: "toggle",
				default: false,
				description: "Hide names and icons during the effect",
				Y: 440
			}
		},
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
			hookFunction("ChatRoomDrawCharacter", 1, (args, next) => {
				if (args[0])
					return next(args);

				const ChatRoomHideIconStateBackup = ChatRoomHideIconState;
				const eyes1 = InventoryGet(Player, "Eyes");
				const eyes2 = InventoryGet(Player, "Eyes2");
				if (
					state.isEnforced &&
					state.customData?.hideNames &&
					eyes1?.Property?.Expression === "Closed" &&
					eyes2?.Property?.Expression === "Closed"
				) {
					ChatRoomHideIconState = 3;
				}

				next(args);

				ChatRoomHideIconState = ChatRoomHideIconStateBackup;
			});
			hookFunction("DrawCharacter", 1, (args, next) => {
				const eyes1 = InventoryGet(Player, "Eyes");
				const eyes2 = InventoryGet(Player, "Eyes2");
				if (
					state.isEnforced &&
					Player.GameplaySettings?.SensDepChatLog !== "SensDepLight" &&
					eyes1?.Property?.Expression === "Closed" &&
					eyes2?.Property?.Expression === "Closed" &&
					CurrentModule === "Online" &&
					CurrentScreen === "ChatRoom" &&
					(args[0] as Character).IsPlayer() &&
					state.customData?.affectPlayer
				)
					return;
				return next(args);
			});
		}
	});

	registerRule("alt_field_of_vision", {
		name: "Field of vision for eyes",
		type: RuleType.Alt,
		loggable: false,
		longDescription: "This rule blacks out the bottom half of the room view when eyes are looking up and the upper half when eyes are looking down.",
		keywords: ["seeing", "limit", "angle", "room", "blindfold", "partially", "movement", "gaze", "gazing", "teasing"],
		defaultLimit: ConditionsLimit.normal,
		dataDefinition: {
			affectPlayer: {
				type: "toggle",
				default: false,
				description: "Player sees the effect also on herself"
			},
			hideNames: {
				type: "toggle",
				default: false,
				description: "Hide names and icons during the effect",
				Y: 440
			}
		},
		load(state) {
			let limitTop = 0;
			let limitBottom = 0;
			const GRADIENT_TIP_POINT = 0.9;
			let inRoomDraw = false;
			hookFunction("ChatRoomDrawBackground", 6, (args, next) => {
				next(args);

				const Y = args[1];
				const Zoom = args[2];
				const height = 1000 * Zoom;
				if (limitTop > 0) {
					const Grad = MainCanvas.createLinearGradient(0, Y, 0, Y + limitTop * height);
					Grad.addColorStop(0, "#000");
					Grad.addColorStop(GRADIENT_TIP_POINT, "#000");
					Grad.addColorStop(1, "rgba(0,0,0,0)");
					MainCanvas.fillStyle = Grad;
					MainCanvas.fillRect(0, Y, 1000, limitTop * height);
				}
				if (limitBottom > 0) {
					const bottomY = Y + (1 - limitBottom) * height;
					const Grad = MainCanvas.createLinearGradient(0, bottomY + limitBottom * height, 0, bottomY);
					Grad.addColorStop(0, "#000");
					Grad.addColorStop(GRADIENT_TIP_POINT, "#000");
					Grad.addColorStop(1, "rgba(0,0,0,0)");
					MainCanvas.fillStyle = Grad;
					MainCanvas.fillRect(0, bottomY, 1000, limitBottom * height);
				}
			});
			hookFunction("ChatRoomDrawCharacter", 1, (args, next) => {
				if (args[0])
					return next(args);

				const ChatRoomHideIconStateBackup = ChatRoomHideIconState;
				limitTop = 0;
				limitBottom = 0;

				if (state.isEnforced) {
					const offset = Player.IsKneeling() ? 0.28 : 0;
					const eyes1 = InventoryGet(Player, "Eyes");
					const eyes2 = InventoryGet(Player, "Eyes2");
					if (eyes1 && eyes2) {
						if (eyes1.Property?.Expression === "Shy" || eyes2.Property?.Expression === "Shy") {
							limitTop = 0.58 + offset;
						} else if (eyes1.Property?.Expression === "Lewd" || eyes2.Property?.Expression === "Lewd") {
							limitBottom = 0.76 - offset;
						} else if (eyes1.Property?.Expression === "VeryLewd" || eyes2.Property?.Expression === "VeryLewd") {
							limitBottom = 0.93 - offset;
						}
					}

					if (CharacterAppearsInverted(Player)) {
						[limitTop, limitBottom] = [limitBottom, limitTop];
					}
				}

				if (limitTop || limitBottom) {
					inRoomDraw = true;
					if (state.customData?.hideNames) {
						ChatRoomHideIconState = 3;
					}
				}
				next(args);

				inRoomDraw = false;
				ChatRoomHideIconState = ChatRoomHideIconStateBackup;
			});

			let DrawC: Character | null = null;
			hookFunction("DrawCharacter", 0, (args, next) => {
				DrawC = args[0];
				const res = next(args);
				DrawC = null;
				return res;
			});

			hookFunction("DrawImageEx", 6, (args, next) => {
				const Source = args[0] as string | HTMLImageElement | HTMLCanvasElement;
				if (inRoomDraw &&
					(
						ChatRoomCharacterDrawlist.some(C => C.Canvas === Source || C.CanvasBlink === Source) ||
						CharacterCanvas.canvas === Source
					) &&
					Source instanceof HTMLCanvasElement &&
					DrawC &&
					(!DrawC.IsPlayer() || state.customData?.affectPlayer)
				) {
					const Canvas = Source;
					const CharacterCanvas = document.createElement("canvas").getContext("2d")!;
					CharacterCanvas.canvas.width = 500;
					CharacterCanvas.canvas.height = CanvasDrawHeight;

					CharacterCanvas.globalCompositeOperation = "copy";
					CharacterCanvas.drawImage(Canvas, 0, 0);

					CharacterCanvas.globalCompositeOperation = "source-atop";

					const HeightRatio = DrawC.HeightRatio;
					const YOffset = CharacterAppearanceYOffset(DrawC, HeightRatio);
					const YCutOff = YOffset >= 0 || CurrentScreen === "ChatRoom";
					const YStart = CanvasUpperOverflow + (YCutOff ? -YOffset / HeightRatio : 0);
					const SourceHeight = 1000 / HeightRatio + (YCutOff ? 0 : -YOffset / HeightRatio);

					const [top, bottom] = CharacterAppearsInverted(DrawC) ? [limitBottom, limitTop] : [limitTop, limitBottom];

					if (top) {
						const Grad = CharacterCanvas.createLinearGradient(0, YStart, 0, YStart + SourceHeight * top);
						Grad.addColorStop(0, "#000");
						Grad.addColorStop(GRADIENT_TIP_POINT, "#000");
						Grad.addColorStop(1, "rgba(0,0,0,0)");
						CharacterCanvas.fillStyle = Grad;
						CharacterCanvas.fillRect(0, YStart, Canvas.width, SourceHeight * top);
					}
					if (bottom) {
						const Y = YStart + (1 - bottom) * SourceHeight;
						const Grad = CharacterCanvas.createLinearGradient(0, YStart + SourceHeight, 0, Y);
						Grad.addColorStop(0, "#000");
						Grad.addColorStop(GRADIENT_TIP_POINT, "#000");
						Grad.addColorStop(1, "rgba(0,0,0,0)");
						CharacterCanvas.fillStyle = Grad;
						CharacterCanvas.fillRect(0, Y, Canvas.width, Canvas.height - Y);
					}

					args[0] = CharacterCanvas.canvas;
				}
				return next(args);
			});
		}
	});

	registerRule("alt_blindfolds_fullblind", {
		name: "Fully blind when blindfolded",
		type: RuleType.Alt,
		loggable: false,
		longDescription: "This rule enforces full blindness when wearing any item that limits sight in any way. (This rules does NOT respect Light sensory deprivation setting and always forces player to be fully blind)",
		keywords: ["seeing", "blindness", "limit", "eyes", "realistic", "room", "light"],
		defaultLimit: ConditionsLimit.normal,
		load(state) {
			hookFunction("Player.GetBlindLevel", 2, (args, next) => {
				if (state.isEnforced && ["BlindHeavy", "BlindNormal", "BlindLight"].some(i => Player.Effect.includes(i) && !Player.Effect.includes("VRAvatars")))
					return 3;
				return next(args);
			}, ModuleCategory.Rules);
		}
	});

	registerRule("alt_always_slow", {
		name: "Always leave rooms slowly",
		type: RuleType.Alt,
		loggable: false,
		longDescription: "This rule forces PLAYER_NAME to always leave the room slowly, independent of the items she is wearing. WARNING: Due to limitation in Bondage Club itself, only BCX users will be able to stop PLAYER_NAME from leaving the room. This rule will ignore BC's roleplay difficulty setting 'Cannot be slowed down' and slow down PLAYER_NAME regardless!",
		keywords: ["slowness", "limit", "leaving", "permanent", "stopping", "exit", "blocking"],
		defaultLimit: ConditionsLimit.normal,
		init(state) {
			registerEffectBuilder(PlayerEffects => {
				if (state.isEnforced && !PlayerEffects.Effect.includes("Slow")) {
					PlayerEffects.Effect.push("Slow");
				}
			});
			hookFunction("Player.IsSlow", 2, (args, next) => {
				if (state.isEnforced)
					return true;
				return next(args);
			});
		}
	});

	registerRule("alt_control_orgasms", {
		name: "Control ability to orgasm",
		type: RuleType.Alt,
		loggable: false,
		shortDescription: "adjustable: only-edge, only-ruin, no-resist",
		longDescription: "This rule impacts PLAYER_NAME's ability to control their orgasms, independent of items. There are three control options, which are: Never cum (always edge, the bar never reaches 100%), force into ruined orgasm (orgasm screen starts, but doesn't let her actually cum) and prevent resisting orgasm (able to enter orgasm screen, but unable to resist it).",
		keywords: ["deny", "denial", "prevent", "edging", "hypno", "cumming"],
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
		type: RuleType.Alt,
		loggable: false,
		shortDescription: "unable to see the own arousal meter",
		longDescription: "This rule prevents PLAYER_NAME from seeing their own arousal meter, even while it is active and working. This means, that it is a surprise to them, when the orgasm (quick-time event) happens. Does not effect other characters being able to see the meter, if club settings allow that.",
		keywords: ["hide", "hidden", "control", "cumming"],
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

	const gaveAdminTo: Set<number> = new Set();
	registerRule("alt_room_admin_transfer", {
		name: "Room admin transfer",
		type: RuleType.Alt,
		loggable: false,
		shortDescription: "give admin to defined roles",
		longDescription: "This rule lets you define a minimum role which PLAYER_NAME will automatically give room admin rights to (if she has admin rights in the room). Also has the option to remove admin rights from PLAYER_NAME afterwards.",
		keywords: ["automatic", "authority", "power", "exchange", "loss", "control"],
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
		load() {
			hookFunction("ChatRoomSyncMemberLeave", 3, (args, next) => {
				next(args);
				const R = args[0] as Record<string, number>;
				if (gaveAdminTo.has(R.SourceMemberNumber)) {
					gaveAdminTo.delete(R.SourceMemberNumber);
				}
			}, ModuleCategory.Rules);
			hookFunction("ChatRoomClearAllElements", 3, (args, next) => {
				gaveAdminTo.clear();
				next(args);
			}, ModuleCategory.Rules);
		},
		tick(state) {
			let changed = false;
			if (state.isEnforced && state.customData && ChatRoomPlayerIsAdmin() && ServerPlayerIsInChatRoom()) {
				let hasAdmin = false;
				for (const character of getAllCharactersInRoom()) {
					if (!character.isPlayer() && getCharacterAccessLevel(character) <= state.customData.minimumRole) {
						if (ChatRoomData?.Admin?.includes(character.MemberNumber)) {
							hasAdmin = true;
						} else if (!gaveAdminTo.has(character.MemberNumber)) {
							ServerSend("ChatRoomAdmin", { MemberNumber: character.MemberNumber, Action: "Promote" });
							changed = true;
							gaveAdminTo.add(character.MemberNumber);
						}
					}
				}
				if (CurrentModule === "Online" && CurrentScreen === "ChatRoom" && !changed && hasAdmin && ChatRoomData && state.customData.removeAdminToggle) {
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
		type: RuleType.Alt,
		loggable: false,
		shortDescription: "restrict room admin powers while restrained",
		longDescription: "This rule forbids PLAYER_NAME to do any room admin actions (except for kick/ban), when she is restrained. Note: This rule does not affect an admin's ability to bypass locked rooms, if restraints allow it. Tip: This rule can be combined with the rule 'Force ´Return to chatrooms on relog´' to trap PLAYER_NAME in it.",
		keywords: ["restraints", "authority", "suppressing", "bindings", "helpless"],
		defaultLimit: ConditionsLimit.limited,
		triggerTexts: {
			attempt_infoBeep: "You are forbidden from changing room settings while restrained"
		},
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
					DrawButton(505, 172, 300, 60, TextGet("Language" + ChatAdminLanguage), "#ebebe4", "", "", true);
					DrawButton(125, 770, 250, 65, TextGet("AddOwnerAdminList"), "#ebebe4", "", "", true);
					DrawButton(390, 770, 250, 65, TextGet("AddLoverAdminList"), "#ebebe4", "", "", true);
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
					MouseIn(505, 172, 300, 60) ||
					MouseIn(1300, 75, 600, 350) ||
					MouseIn(1840, 450, 60, 60) ||
					MouseIn(1300, 450, 500, 60) ||
					MouseIn(1625, 575, 275, 60) ||
					MouseIn(1486, 708, 64, 64) ||
					MouseIn(1786, 708, 64, 64) ||
					MouseIn(125, 770, 250, 65) ||
					MouseIn(390, 770, 250, 65)
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
		type: RuleType.Alt,
		loggable: false,
		shortDescription: "directly sets PLAYER_NAME's description",
		longDescription: "This rule sets PLAYER_NAME's online description (in her profile) to any text entered in the rule config, blocking changes to it. Warning: This rule is editing the actual profile text. This means that after saving a changed text, the original text is lost!",
		keywords: ["edit", "change", "force", "biography", "information", "story", "control"],
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

	registerRule("alt_set_nickname", {
		name: "Control nickname",
		type: RuleType.Alt,
		loggable: false,
		shortDescription: "directly sets PLAYER_NAME's nickname",
		longDescription: "This rule sets PLAYER_NAME's nickname (replacing her name in most cases) to any text entered in the rule config, blocking changes to it.",
		keywords: ["edit", "change", "force", "petname", "naming"],
		defaultLimit: ConditionsLimit.blocked,
		dataDefinition: {
			nickname: {
				type: "string",
				default: () => (Player.Nickname || Player.Name),
				description: "Set this player's nickname:",
				options: /^[a-zA-Z\s]{0,20}$/
			}
		},
		tick(state) {
			if (state.isEnforced && state.customData) {
				let nick = state.customData.nickname.trim();
				if (nick === Player.Name) {
					nick = "";
				}
				if (Player.Nickname !== nick) {
					Player.Nickname = nick;
					ServerAccountUpdate.QueueData({ Nickname: nick }, true);
					state.trigger();
					return true;
				}
			}
			return false;
		}
	});

	registerRule("alt_force_suitcase_game", {
		name: "Always carry a suitcase",
		type: RuleType.Alt,
		loggable: false,
		shortDescription: "from the kidnappers league multiplayer game",
		longDescription: "This rule forces PLAYER_NAME to constantly participate in the kidnappers league's suitcase delivery task, by automatically giving her a new suitcase, whenever the suitcase item slot is empty.",
		keywords: ["permanent", "money", "tasks"],
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
		type: RuleType.Alt,
		loggable: false,
		longDescription: "This rule only allows selected roles to leash PLAYER_NAME, responding with a message about unsuccessful leashing to others when they attempt to do so.",
		keywords: ["limit", "prevent", "leashing", "room"],
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
		type: RuleType.Alt,
		loggable: false,
		shortDescription: "also preventing beeps from the friendlist - exceptions settable",
		longDescription: "This rule hides persons on PLAYER_NAME's friend list when she is fully blinded, which also makes sending beeps impossible. Received beeps can still be answered. The rule allows to manage a list of members who can be seen normally.",
		keywords: ["blindfold", "control"],
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
				"data.forEach(friend => {": 'data.forEach(friend => { if (typeof friend.MemberNumber !== "number") return;'
			});
			patchFunction("FriendListLoadFriendList", {
				"FriendListContent += `<div class='FriendListLinkColumn' onClick='FriendListBeep(${friend.MemberNumber})'> ${BeepCaption} </div>`;": "if (typeof friend.MemberNumber === 'number') FriendListContent += `<div class='FriendListLinkColumn' onClick='FriendListBeep(${friend.MemberNumber})'> ${BeepCaption} </div>`;"
			});
			hookFunction("FriendListLoadFriendList", 1, (args, next) => {
				const data = args[0] as any[];
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
		type: RuleType.Alt,
		loggable: false,
		shortDescription: "leash PLAYER_NAME from anywhere using a beep with message",
		longDescription: "This rule forces PLAYER_NAME to switch rooms from anywhere in the club to the chat room of the summoner after 15 seconds. It works by sending a beep message with the set text or simply the word 'summon' to PLAYER_NAME. Members who are allowed to summon PLAYER_NAME can be set. NOTES: PLAYER_NAME can always be summoned no matter if she has a leash or is prevented from leaving the room (ignoring restraints or locked rooms). However, if the target room is full or locked, she will end up in the lobby. Summoning will not work if the room name is not included with the beep message!",
		keywords: ["leashing", "room", "calling", "ordering", "move", "moving", "movement", "warping", "beaming", "transporting"],
		triggerTexts: {
			infoBeep: "You are summoned by SUMMONER!"
		},
		defaultLimit: ConditionsLimit.blocked,
		dataDefinition: {
			allowedMembers: {
				type: "memberNumberList",
				default: [],
				description: "Members numbers allowed to summon:",
				Y: 325,
				options: {
					pageSize: 1
				}
			},
			summoningText: {
				type: "string",
				default: "Come to my room immediately",
				description: "The text used for summoning:",
				Y: 705
			},
			summonTime: {
				type: "number",
				default: 15,
				description: "Time in seconds before enforcing summon:",
				Y: 550
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
					typeof data.Message === "string" &&
					(data.Message.toLocaleLowerCase().startsWith(state.customData.summoningText.trim().toLocaleLowerCase()) || data.Message.trim().toLocaleLowerCase() === "summon") &&
					data.ChatRoomName
				) {
					ChatRoomActionMessage(`${Player.Name} received a summon: "${state.customData.summoningText}".`);
					beep = true;
					BCX_setTimeout(() => {
						// Check if rule is still in effect or if we are already there
						if (!state.isEnforced || (ServerPlayerIsInChatRoom() && ChatRoomData.Name === data.ChatRoomName)) return;

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
					}, state.customData.summonTime * 1000);
				}
				next(args);
				if (beep) state.triggerAttempt({ SUMMONER: `${data.MemberName} (${data.MemberNumber})` });
				beep = false;
			}, ModuleCategory.Rules);
		}
	});

	registerRule("alt_allow_changing_appearance", {
		name: "Allow changing the whole appearance",
		type: RuleType.Alt,
		loggable: false,
		shortDescription: "of PLAYER_NAME - for the defined roles",
		keywords: ["force", "setting", "wardrobe", "body", "modifications"],
		longDescription: "This rule lets you define a minimum role which (and all higher roles) has permission to fully change the whole appearance of PLAYER_NAME (body and cosplay items), ignoring the settings of the BC online preferences 'Allow others to alter your whole appearance' and 'Prevent others from changing cosplay items'. So this rule can define a group of people which is allowed, while everyone else is not. IMPORTANT: Only other BCX users will be able to change PLAYER_NAME's appearance if this rule allows them to, while the BC settings would forbid them to.",
		defaultLimit: ConditionsLimit.blocked,
		dataDefinition: {
			minimumRole: {
				type: "roleSelector",
				default: AccessLevel.owner,
				description: "Minimum role that is allowed:"
			}
		},
		init(state) {
			queryHandlers.rule_alt_allow_changing_appearance = (sender, resolve) => {
				resolve(true, state.inEffect && !!state.customData && getCharacterAccessLevel(sender) <= state.customData.minimumRole);
			};
			let appearanceCharacterAllowed: null | number = null;
			hookFunction("CharacterAppearanceLoadCharacter", 0, (args, next) => {
				appearanceCharacterAllowed = null;
				const C = args[0] as Character;
				const char = C.MemberNumber && getChatroomCharacter(C.MemberNumber);
				if (!C.IsPlayer() && char && char.BCXVersion) {
					sendQuery("rule_alt_allow_changing_appearance", undefined, char.MemberNumber).then(res => {
						if (res) {
							appearanceCharacterAllowed = char.MemberNumber;
						}
					});
				}
				return next(args);
			}, null);
			hookFunction("WardrobeGroupAccessible", 4, (args, next) => {
				const C = args[0] as Character;
				if (!C.IsPlayer() && C.MemberNumber && C.MemberNumber === appearanceCharacterAllowed && C.OnlineSharedSettings) {
					const AllowFullWardrobeAccess = C.OnlineSharedSettings.AllowFullWardrobeAccess;
					const BlockBodyCosplay = C.OnlineSharedSettings.BlockBodyCosplay;
					try {
						C.OnlineSharedSettings.AllowFullWardrobeAccess = true;
						C.OnlineSharedSettings.BlockBodyCosplay = false;
						return next(args);
					} finally {
						C.OnlineSharedSettings.AllowFullWardrobeAccess = AllowFullWardrobeAccess;
						C.OnlineSharedSettings.BlockBodyCosplay = BlockBodyCosplay;
					}
				}
				return next(args);
			}, null);
		},
		load(state) {
			const allow = (memberNumber: number): boolean => {
				return state.inEffect && !!state.customData && getCharacterAccessLevel(memberNumber) <= state.customData.minimumRole;
			};
			hookFunction("ValidationCanAddOrRemoveItem", 4, (args, next) => {
				const params = args[1] as AppearanceUpdateParameters;
				if (allow(params.sourceMemberNumber) && params.C.IsPlayer() && params.C.OnlineSharedSettings) {
					const AllowFullWardrobeAccess = params.C.OnlineSharedSettings.AllowFullWardrobeAccess;
					const BlockBodyCosplay = params.C.OnlineSharedSettings.BlockBodyCosplay;
					try {
						params.C.OnlineSharedSettings.AllowFullWardrobeAccess = true;
						params.C.OnlineSharedSettings.BlockBodyCosplay = false;
						return next(args);
					} finally {
						params.C.OnlineSharedSettings.AllowFullWardrobeAccess = AllowFullWardrobeAccess;
						params.C.OnlineSharedSettings.BlockBodyCosplay = BlockBodyCosplay;
					}
				}
				return next(args);
			}, ModuleCategory.Rules);
		}
	});
}
