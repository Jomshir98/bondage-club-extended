import { ConditionsLimit, MiscCheat } from "../constants";
import { cheatIsEnabled, cheatSetEnabled } from "../modules/miscPatches";
import { registerRule, RuleType } from "../modules/rules";

export function initRules_bc_settings() {

	function preferenceSync() {
		ServerAccountUpdate.QueueData({
			ArousalSettings: Player.ArousalSettings,
			GameplaySettings: Player.GameplaySettings,
			ImmersionSettings: Player.ImmersionSettings,
			OnlineSettings: Player.OnlineSettings,
			OnlineSharedSettings: Player.OnlineSharedSettings,
			GraphicsSettings: Player.GraphicsSettings,
			ItemPermission: Player.ItemPermission,
		});
	}

	function settingHelper(setting: string, defaultLimit: ConditionsLimit, shortDescription: string = "Existing BC setting"): RuleDisplayDefinition {
		return {
			name: `Force '${setting}'`,
			type: RuleType.Setting,
			loggable: false,
			shortDescription,
			keywords: ["control", "settings", "configure", "change"],
			defaultLimit,
			longDescription: `This rule forces PLAYER_NAME's base game setting '${setting}' to configurable value and prevents her from changing it.`,
			triggerTexts: {
				infoBeep: `Rule changed your '${setting}' setting`,
			},
		};
	}

	type BooleanRule =
		| "setting_forbid_lockpicking"
		| "setting_forbid_SP_rooms"
		| "setting_forbid_safeword"
		| "setting_block_vibe_modes"
		| "setting_show_afk"
		| "setting_allow_body_mod"
		| "setting_forbid_cosplay_change"
		| "setting_hide_non_adjecent"
		| "setting_blind_room_garbling"
		| "setting_relog_keeps_restraints"
		| "setting_leashed_roomchange"
		| "setting_plug_vibe_events"
		| "setting_allow_tint_effects"
		| "setting_allow_blur_effects"
		| "setting_upsidedown_view"
		| "setting_random_npc_events";
	function toggleSettingHelper({
		id,
		setting,
		shortDescription,
		defaultValue,
		defaultLimit,
		get,
		set,
	}: {
		id: BooleanRule;
		setting: string;
		shortDescription?: string;
		defaultValue: boolean;
		defaultLimit: ConditionsLimit;
		get: () => boolean | undefined;
		set: (value: boolean) => void;
	}) {
		return registerRule<BooleanRule>(id, {
			...settingHelper(setting, defaultLimit, shortDescription),
			longDescription: `This rule forces PLAYER_NAME's base game or BCX setting '${setting}' to the configured value and prevents her from changing it. ` +
				`There is also an option to restore the setting to the state it was in before the rule changed it. The restoration happens either when the rule becomes ` +
				`inactive (for instance through toggle or unfulfilled trigger conditions) or when it is removed.`,
			dataDefinition: {
				value: {
					type: "toggle",
					description: setting,
					default: defaultValue,
				},
				restore: {
					type: "toggle",
					description: "Restore previous value when rule ends",
					default: true,
					Y: 420,
				},
			},
			internalDataValidate: (data) => typeof data === "boolean",
			internalDataDefault: () => get() ?? false,
			stateChange(state, newState) {
				if (newState) {
					const current = get();
					if (current !== undefined) {
						state.internalData = current;
					}
				} else if (state.customData?.restore) {
					const old = state.internalData;
					if (old !== undefined) {
						set(old);
						preferenceSync();
					}
				}
			},
			tick(state) {
				if (state.isEnforced && state.customData) {
					const current = get();
					if (current == null) {
						console.error(`BCX: Undfined value while forcing setting ${setting}`);
						return false;
					}
					if (current !== state.customData.value) {
						set(state.customData.value);
						state.trigger();
						preferenceSync();
						return true;
					}
				}
				return false;
			},
		});
	}

	// "General" settings

	registerRule("setting_item_permission", {
		...settingHelper("Item permission", ConditionsLimit.limited),
		dataDefinition: {
			value: {
				type: "listSelect",
				options: [
					["everyone", "Everyone, no exceptions"],
					["everyoneBlacklist", "Everyone, except blacklist"],
					["dominants", "Owner, Lovers, whitelist & Dominants"],
					["whitelist", "Owner, Lovers and whitelist only"],
				],
				default: "everyone",
				description: "Item permission",
			},
		},
		tick(state) {
			if (state.isEnforced && state.customData) {
				const VALUE_CONVERSIONS: Record<string, typeof Player.ItemPermission> = {
					everyone: 0,
					everyoneBlacklist: 1,
					dominants: 2,
					whitelist: 3,
				};
				const wanted = VALUE_CONVERSIONS[state.customData.value] ?? 0;
				if (Player.ItemPermission !== wanted) {
					Player.ItemPermission = wanted;
					state.trigger();
					preferenceSync();
					return true;
				}
			}
			return false;
		},
	});

	toggleSettingHelper({
		id: "setting_forbid_lockpicking",
		setting: "Locks on you can't be picked",
		defaultValue: true,
		defaultLimit: ConditionsLimit.limited,
		get: () => Player.OnlineSharedSettings?.DisablePickingLocksOnSelf,
		set: value => Player.OnlineSharedSettings!.DisablePickingLocksOnSelf = value,
	});

	toggleSettingHelper({
		id: "setting_forbid_SP_rooms",
		setting: "Cannot enter single-player rooms when restrained",
		defaultValue: true,
		defaultLimit: ConditionsLimit.limited,
		get: () => Player.GameplaySettings?.OfflineLockedRestrained,
		set: value => Player.GameplaySettings!.OfflineLockedRestrained = value,
	});

	toggleSettingHelper({
		id: "setting_forbid_safeword",
		setting: "Allow safeword use",
		defaultValue: false,
		defaultLimit: ConditionsLimit.limited,
		get: () => Player.GameplaySettings?.EnableSafeword,
		set: value => Player.GameplaySettings!.EnableSafeword = value,
	});

	// "Arousal" settings

	registerRule("setting_arousal_meter", {
		...settingHelper("Arousal meter", ConditionsLimit.limited),
		dataDefinition: {
			active: {
				type: "listSelect",
				options: [
					["Inactive", "Disable sexual activities"],
					["NoMeter", "Allow without a meter"],
					["Manual", "Allow with a manual meter"],
					["Hybrid", "Allow with a hybrid meter"],
					["Automatic", "Allow with a locked meter"],
				],
				default: "Hybrid",
				description: "Sexual activities - Activation",
			},
			visible: {
				type: "listSelect",
				options: [
					["All", "Show arousal to everyone"],
					["Access", "Show if they have access"],
					["Self", "Show to yourself only"],
				],
				default: "All",
				description: "Meter visibility",
				Y: 480,
			},
		},
		tick(state) {
			let change = false;
			if (state.isEnforced && state.customData && Player.ArousalSettings) {
				if (Player.ArousalSettings.Active !== state.customData.active) {
					Player.ArousalSettings.Active = state.customData.active;
					change = true;
				}
				if (Player.ArousalSettings.Visible !== state.customData.visible) {
					Player.ArousalSettings.Visible = state.customData.visible;
					change = true;
				}
				if (change) {
					state.trigger();
					preferenceSync();
				}
			}
			return change;
		},
	});

	toggleSettingHelper({
		id: "setting_block_vibe_modes",
		setting: "Block advanced vibrator modes",
		defaultValue: false,
		defaultLimit: ConditionsLimit.limited,
		get: () => Player.ArousalSettings?.DisableAdvancedVibes,
		set: value => Player.ArousalSettings!.DisableAdvancedVibes = value,
	});

	registerRule("setting_arousal_stutter", {
		...settingHelper("Arousal speech stuttering", ConditionsLimit.limited),
		dataDefinition: {
			value: {
				type: "listSelect",
				options: [
					["None", "Never stutter"],
					["Arousal", "When you're aroused"],
					["Vibration", "When you're vibrated"],
					["All", "Aroused & vibrated"],
				],
				default: "All",
				description: "Speech stuttering",
			},
		},
		tick(state) {
			if (state.isEnforced && state.customData && Player.ArousalSettings) {
				if (Player.ArousalSettings.AffectStutter !== state.customData.value) {
					Player.ArousalSettings.AffectStutter = state.customData.value;
					state.trigger();
					preferenceSync();
					return true;
				}
			}
			return false;
		},
	});

	// "Online" settings

	toggleSettingHelper({
		id: "setting_show_afk",
		setting: "Show AFK bubble",
		defaultValue: true,
		defaultLimit: ConditionsLimit.blocked,
		get: () => Player.OnlineSettings?.EnableAfkTimer,
		set: value => Player.OnlineSettings!.EnableAfkTimer = value,
	});

	toggleSettingHelper({
		id: "setting_allow_body_mod",
		setting: "Allow others to alter your whole appearance",
		defaultValue: true,
		defaultLimit: ConditionsLimit.blocked,
		get: () => Player.OnlineSharedSettings?.AllowFullWardrobeAccess,
		set: value => Player.OnlineSharedSettings!.AllowFullWardrobeAccess = value,
	});

	toggleSettingHelper({
		id: "setting_forbid_cosplay_change",
		setting: "Prevent others from changing cosplay items",
		defaultValue: false,
		defaultLimit: ConditionsLimit.blocked,
		get: () => Player.OnlineSharedSettings?.BlockBodyCosplay,
		set: value => Player.OnlineSharedSettings!.BlockBodyCosplay = value,
	});

	// "Immersion" settings

	registerRule("setting_sensdep", {
		...settingHelper("Sensory deprivation setting", ConditionsLimit.blocked),
		dataDefinition: {
			value: {
				type: "listSelect",
				options: [
					["SensDepLight", "Light"],
					["Normal", "Normal"],
					["SensDepNames", "Hide names"],
					["SensDepTotal", "Heavy"],
					["SensDepExtreme", "Total"],
				],
				default: "Normal",
				description: "Sensory deprivation setting",
			},
			disableExamine: {
				type: "toggle",
				default: false,
				description: "Disable examining when blind",
				Y: 480,
			},
			hideMessages: {
				type: "toggle",
				default: false,
				description: "Hide others' messages",
				Y: 580,
			},
		},
		tick(state) {
			let changed = false;
			if (state.isEnforced && state.customData && Player.GameplaySettings && Player.ImmersionSettings) {
				if (Player.GameplaySettings.SensDepChatLog !== state.customData.value) {
					Player.GameplaySettings.SensDepChatLog = state.customData.value;
					changed = true;
				}
				const bdeForceOff = state.customData.value === "SensDepLight";
				const bdeForceOn = state.customData.value === "SensDepExtreme";
				const bdeTarget = (state.customData.disableExamine && !bdeForceOff) || bdeForceOn;
				if (Player.GameplaySettings.BlindDisableExamine !== bdeTarget) {
					Player.GameplaySettings.BlindDisableExamine = bdeTarget;
					changed = true;
				}
				const canHideMessages = state.customData.value !== "SensDepLight";
				const hideMessagesTarget = canHideMessages && state.customData.hideMessages;
				if (Player.ImmersionSettings.SenseDepMessages !== hideMessagesTarget) {
					Player.ImmersionSettings.SenseDepMessages = hideMessagesTarget;
					changed = true;
				}
				if (changed) {
					state.trigger();
					preferenceSync();
				}
			}
			return changed;
		},
	});

	toggleSettingHelper({
		id: "setting_hide_non_adjecent",
		setting: "Hide non-adjacent players while partially blind",
		defaultValue: true,
		defaultLimit: ConditionsLimit.blocked,
		get: () => Player.ImmersionSettings?.BlindAdjacent,
		set: value => Player.ImmersionSettings!.BlindAdjacent = value,
	});

	toggleSettingHelper({
		id: "setting_blind_room_garbling",
		setting: "Garble chatroom names and descriptions while blind",
		defaultValue: true,
		defaultLimit: ConditionsLimit.blocked,
		get: () => Player.ImmersionSettings?.ChatRoomMuffle,
		set: value => Player.ImmersionSettings!.ChatRoomMuffle = value,
	});

	toggleSettingHelper({
		id: "setting_relog_keeps_restraints",
		setting: "Keep all restraints when relogging",
		defaultValue: true,
		defaultLimit: ConditionsLimit.limited,
		get: () => Player.GameplaySettings?.DisableAutoRemoveLogin,
		set: value => Player.GameplaySettings!.DisableAutoRemoveLogin = value,
	});

	toggleSettingHelper({
		id: "setting_leashed_roomchange",
		setting: "Players can drag you to rooms when leashed",
		defaultValue: true,
		defaultLimit: ConditionsLimit.blocked,
		get: () => Player.OnlineSharedSettings?.AllowPlayerLeashing,
		set: value => Player.OnlineSharedSettings!.AllowPlayerLeashing = value,
	});

	registerRule("setting_room_rejoin", {
		...settingHelper("Return to chatrooms on relog", ConditionsLimit.limited),
		dataDefinition: {
			value: {
				type: "toggle",
				default: true,
				description: "Return to chatrooms on relog",
			},
			remakeRooms: {
				type: "toggle",
				default: false,
				description: "Auto-remake rooms",
				Y: 425,
			},
		},
		tick(state) {
			let changed = false;
			if (state.isEnforced && state.customData && Player.ImmersionSettings) {
				if (Player.ImmersionSettings.ReturnToChatRoom !== state.customData.value) {
					Player.ImmersionSettings.ReturnToChatRoom = state.customData.value;
					changed = true;
				}
				const returnToRoomEnabled = state.customData.value;
				const remakeRoomTarget = returnToRoomEnabled && state.customData.remakeRooms;
				if (Player.ImmersionSettings.ReturnToChatRoomAdmin !== remakeRoomTarget) {
					Player.ImmersionSettings.ReturnToChatRoomAdmin = remakeRoomTarget;
					changed = true;
				}
				if (changed) {
					state.trigger();
					preferenceSync();
				}
			}
			return changed;
		},
	});

	toggleSettingHelper({
		id: "setting_plug_vibe_events",
		setting: "Events while plugged or vibed",
		defaultValue: true,
		defaultLimit: ConditionsLimit.normal,
		get: () => Player.ImmersionSettings?.StimulationEvents,
		set: value => Player.ImmersionSettings!.StimulationEvents = value,
	});

	toggleSettingHelper({
		id: "setting_allow_tint_effects",
		setting: "Allow item tint effects",
		defaultValue: true,
		defaultLimit: ConditionsLimit.limited,
		get: () => Player.ImmersionSettings?.AllowTints,
		set: value => Player.ImmersionSettings!.AllowTints = value,
	});

	// "Graphics" settings

	toggleSettingHelper({
		id: "setting_allow_blur_effects",
		setting: "Allow item blur effects",
		defaultValue: true,
		defaultLimit: ConditionsLimit.blocked,
		get: () => Player.GraphicsSettings?.AllowBlur,
		set: value => Player.GraphicsSettings!.AllowBlur = value,
	});

	toggleSettingHelper({
		id: "setting_upsidedown_view",
		setting: "Flip room vertically when upside-down",
		defaultValue: true,
		defaultLimit: ConditionsLimit.blocked,
		get: () => Player.GraphicsSettings?.InvertRoom,
		set: value => Player.GraphicsSettings!.InvertRoom = value,
	});

	// "Misc" module settings

	toggleSettingHelper({
		id: "setting_random_npc_events",
		setting: "Prevent random NPC events",
		shortDescription: "from BCX's Misc module",
		defaultValue: true,
		defaultLimit: ConditionsLimit.normal,
		get: () => cheatIsEnabled(MiscCheat.BlockRandomEvents),
		set: value => cheatSetEnabled(MiscCheat.BlockRandomEvents, value),
	});

}
