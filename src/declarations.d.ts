/** Package version, provided by rollup */
declare const BCX_VERSION: string;
declare const BCX_DEVEL: boolean;

interface Window {
	BCX_Loaded?: boolean;
}

declare const LZString: import("lz-string").LZStringStatic;

interface Character {
	Status?: string;
}

// Player.OnlineSettings.BCX?: string;

type BCX_Permissions =
	| "authority_edit_min"
	| "authority_grant_self"
	| "authority_revoke_self"
	| "authority_mistress_add"
	| "authority_mistress_remove"
	| "authority_owner_add"
	| "authority_owner_remove"
	| "authority_view_roles"
	| "log_view_normal"
	| "log_view_protected"
	| "log_configure"
	| "log_delete"
	| "log_praise"
	| "log_add_note"
	| "curses_normal"
	| "curses_limited"
	| "curses_global_configuration"
	| "curses_change_limits"
	| "curses_color"
	| "rules_normal"
	| "rules_limited"
	| "rules_global_configuration"
	| "rules_change_limits"
	| "misc_test";

type PermissionsBundle = Record<string, [boolean, number]>;

interface PermissionRoleBundle {
	mistresses: [number, string][];
	owners: [number, string][];
	allowAddMistress: boolean;
	allowRemoveMistress: boolean;
	allowAddOwner: boolean;
	allowRemoveOwner: boolean;
}

type BCX_LogCategory =
	| "permission_change"
	| "log_config_change"
	| "log_deleted"
	| "praise"
	| "user_note"
	| "curse_change"
	| "curse_trigger"
	| "rule_change"
	| "rule_trigger"
	| "had_orgasm"
	| "entered_public_room"
	| "entered_private_room"
	| "authority_roles_change";

interface CursedItemInfo {
	Name: string;
	curseProperty: boolean;
	Color?: string | string[];
	Difficulty?: number;
	Property?: ItemProperties;
}

interface ConditionsCategoryKeys {
	curses: string;
	rules: BCX_Rule;
}

type ConditionsCategories = keyof ConditionsCategoryKeys;

interface ConditionsCategorySpecificData {
	curses: CursedItemInfo | null;
	rules: {
		enforce?: false;
		log?: false;
		/** `RuleCustomData` */
		customData?: Record<string, any>;
		/** `RuleInternalData` */
		internalData?: any;
	};
}

interface ConditionsCategorySpecificPublicData {
	curses: {
		Name: string;
		curseProperties: boolean;
	} | null;
	rules: {
		enforce: boolean;
		log: boolean;
		/** `RuleCustomData` */
		customData?: Record<string, any>;
	};
}

interface ConditionsConditionRequirements {
	/** If the conditions should be treated as "OR". Default is "AND" */
	orLogic?: true;
	room?: {
		type: "public" | "private";
		inverted?: true;
	};
	roomName?: {
		name: string;
		inverted?: true;
	};
	role?: {
		role: import("./modules/authority").AccessLevel;
		inverted?: true;
	}
	player?: {
		memberNumber: number;
		inverted?: true;
	}
}

interface ConditionsConditionData<category extends ConditionsCategories = ConditionsCategories> {
	active: boolean;
	lastActive: boolean;
	data: ConditionsCategorySpecificData[category];
	timer?: number;
	timerRemove?: true | undefined;
	requirements?: ConditionsConditionRequirements;
}

interface ConditionsConditionPublicData<category extends ConditionsCategories = ConditionsCategories> {
	active: boolean;
	data: ConditionsCategorySpecificPublicData[category];
	timer: number | null;
	timerRemove: boolean;
	requirements: ConditionsConditionRequirements | null;
}

type ConditionsCategoryRecord<category extends ConditionsCategories = ConditionsCategories> = Record<ConditionsCategoryKeys[category], ConditionsConditionData<category>>;
type ConditionsCategoryPublicRecord<category extends ConditionsCategories = ConditionsCategories> = Record<ConditionsCategoryKeys[category], ConditionsConditionPublicData<category>>;

interface ConditionsCategoryData<category extends ConditionsCategories = ConditionsCategories> {
	conditions: Record<string, ConditionsConditionData<category>>;
	/** List of limited/blocked conditions; defaults to normal */
	limits: { [P in ConditionsCategoryKeys[category]]?: import("./constants").ConditionsLimit };
	requirements: ConditionsConditionRequirements;
	timer?: number;
	timerRemove?: true | undefined;
}

interface ConditionsCategoryConfigurableData {
	requirements: ConditionsConditionRequirements;
	timer: number | null;
	timerRemove: boolean;
}

interface ConditionsCategoryPublicData<category extends ConditionsCategories = ConditionsCategories> extends ConditionsCategoryConfigurableData {
	access_normal: boolean;
	access_limited: boolean;
	access_configure: boolean;
	access_changeLimits: boolean;
	highestRoleInRoom: import("./modules/authority").AccessLevel | null;
	conditions: ConditionsCategoryPublicRecord<category>;
	/** List of limited/blocked conditions; defaults to normal */
	limits: { [P in ConditionsCategoryKeys[category]]?: import("./constants").ConditionsLimit };
}

type ConditionsStorage = Partial<{
	[category in ConditionsCategories]: ConditionsCategoryData<category>;
}>;

type BCX_Rule =
	| "block_remoteuse_self"
	| "block_remoteuse_others"
	| "block_keyuse_self"
	| "block_keyuse_others"
	| "block_lockpicking_self"
	| "block_lockpicking_others"
	| "block_lockuse_self"
	| "block_lockuse_others"
	| "block_wardrobe_access_self"
	| "block_wardrobe_access_others"
	// | "restrict_allowed_poses"
	| "block_creating_rooms"
	| "block_entering_rooms"
	| "block_leaving_room"
	| "block_freeing_self"
	| "block_tying_others"
	| "block_blacklisting"
	| "block_antiblind"
	| "block_difficulty_change"
	| "alt_restrict_hearing"
	| "alt_restrict_sight"
	| "alt_eyes_fullblind"
	| "alt_blindfolds_fullblind"
	| "alt_always_slow"
	| "alt_control_orgasms"
	| "alt_secret_orgasms"
	| "alt_room_admin_transfer"
	| "alt_room_admin_limit"
	| "alt_set_profile_description"
	| "alt_force_suitcase_game"
	| "alt_hearing_whitelist"
	| "alt_seeing_whitelist"
	| "alt_restrict_leashability"
	| "alt_forced_summoning"
	| "rc_club_owner"
	| "rc_lover_new"
	| "rc_lover_leave"
	| "rc_sub_new"
	| "rc_sub_leave"
	| "speech_specific_sound"
	| "speech_garble_whispers"
	| "speech_block_gagged_ooc"
	| "speech_block_ooc"
	| "speech_doll_talk"
	| "speech_ban_words"
	| "speech_forbid_open_talking"
	| "speech_restrict_whisper_send"
	| "speech_restrict_whisper_receive"
	| "speech_restrict_beep_send"
	| "speech_restrict_beep_receive"
	| "speech_greet_order"
	| "speech_block_antigarble"
	// | "replace_spoken_words"
	// | "using_honorifics"
	| "speech_force_retype"
	| "greet_room_order"
	// | "restrained_speech"
	| "speech_alter_faltering"
	| "other_forbid_afk"
	// | "log_online_time"
	| "other_constant_reminder"
	// | "restrict_console_usage"
	// | "track_BCX_activation"
	| "setting_item_permission"
	| "setting_forbid_lockpicking"
	| "setting_forbid_SP_rooms"
	| "setting_forbid_safeword"
	| "setting_arousal_meter"
	| "setting_block_vibe_modes"
	| "setting_arousal_stutter"
	| "setting_show_afk"
	| "setting_show_wardrobe_use"
	| "setting_allow_body_mod"
	| "setting_forbid_cosplay_change"
	| "setting_sensdep"
	| "setting_hide_non_adjecent"
	| "setting_blind_room_garbling"
	| "setting_relog_keeps_restraints"
	| "setting_leashed_roomchange"
	| "setting_room_rejoin"
	| "setting_plug_vibe_events"
	| "setting_upsidedown_view"
	;

type RuleCustomData = {
	// restrict_allowed_poses: {
	// 	poseButtons: string[];
	// },
	block_entering_rooms: {
		roomList: string[];
	},
	block_leaving_room: {
		minimumRole: import("./modules/authority").AccessLevel;
	},
	block_tying_others: {
		onlyMoreDominantsToggle: boolean;
	},
	block_keyuse_others: {
		allowOwnerLocks: boolean;
		allowLoverLocks: boolean;
	},
	block_blacklisting: {
		minimumRole: import("./modules/authority").AccessLevel;
	},
	alt_restrict_hearing: {
		deafeningStrength: string;
	},
	alt_restrict_sight: {
		blindnessStrength: string;
	},
	alt_control_orgasms: {
		orgasmHandling: string;
	},
	alt_room_admin_transfer: {
		minimumRole: import("./modules/authority").AccessLevel;
		removeAdminToggle: boolean;
	},
	alt_set_profile_description: {
		playersProfileDescription: string;
	},
	alt_hearing_whitelist: {
		whitelistedMembers: number[];
		ignoreGaggedMembersToggle: boolean;
	},
	alt_seeing_whitelist: {
		whitelistedMembers: number[];
	},
	alt_restrict_leashability: {
		minimumRole: import("./modules/authority").AccessLevel;
	},
	alt_forced_summoning: {
		allowedMembers: number[];
		summoningText: string;
	},
	speech_specific_sound: {
		soundWhitelist: string[];
	},
	speech_doll_talk: {
		maxWordLength: number;
		maxNumberOfWords: number;
	},
	speech_ban_words: {
		bannedWords: string[];
	},
	speech_restrict_whisper_send: {
		minimumPermittedRole: import("./modules/authority").AccessLevel;
	},
	speech_restrict_whisper_receive: {
		minimumPermittedRole: import("./modules/authority").AccessLevel;
		autoreplyText: string;
	},
	speech_restrict_beep_send: {
		whitelistedMemberNumbers: number[];
		onlyWhenBound: boolean;
	},
	speech_restrict_beep_receive: {
		whitelistedMemberNumbers: number[];
		autoreplyText: string;
		onlyWhenBound: boolean;
	},
	speech_greet_order: {
		toGreetMemberNumbers: number[];
	},
	// replace_spoken_words: {
	// 	stringWithReplacingSyntax: string;
	// },
	// using_honorifics: {
	// 	stringWithRuleSyntax: string;
	// },
	greet_room_order: {
		greetingSentence: string;
	},
	// restrained_speech: {
	// 	listOfAllowedSentences: string[];
	// },
	other_forbid_afk: {
		minutesBeforeAfk: number;
	},
	other_constant_reminder: {
		reminderText: string[];
		reminderFrequency: number;
	},
	setting_item_permission: {
		value: string;
	},
	setting_forbid_lockpicking: {
		value: boolean;
		restore: boolean;
	},
	setting_forbid_SP_rooms: {
		value: boolean;
		restore: boolean;
	},
	setting_forbid_safeword: {
		value: boolean;
		restore: boolean;
	},
	setting_arousal_meter: {
		active: string;
		visible: string;
	},
	setting_block_vibe_modes: {
		value: boolean;
		restore: boolean;
	},
	setting_arousal_stutter: {
		value: string;
	},
	setting_show_afk: {
		value: boolean;
		restore: boolean;
	},
	setting_show_wardrobe_use: {
		value: boolean;
		restore: boolean;
	},
	setting_allow_body_mod: {
		value: boolean;
		restore: boolean;
	},
	setting_forbid_cosplay_change: {
		value: boolean;
		restore: boolean;
	},
	setting_sensdep: {
		value: string;
		disableExamine: boolean;
		hideMessages: boolean;
	},
	setting_hide_non_adjecent: {
		value: boolean;
		restore: boolean;
	},
	setting_blind_room_garbling: {
		value: boolean;
		restore: boolean;
	},
	setting_relog_keeps_restraints: {
		value: boolean;
		restore: boolean;
	},
	setting_leashed_roomchange: {
		value: boolean;
		restore: boolean;
	},
	setting_room_rejoin: {
		value: boolean;
		remakeRooms: boolean;
	},
	setting_plug_vibe_events: {
		value: boolean;
		restore: boolean;
	},
	setting_upsidedown_view: {
		value: boolean;
		restore: boolean;
	}
};

type RuleInternalData = {
	setting_forbid_lockpicking: boolean;
	setting_forbid_SP_rooms: boolean;
	setting_forbid_safeword: boolean;
	setting_block_vibe_modes: boolean;
	setting_show_afk: boolean;
	setting_show_wardrobe_use: boolean;
	setting_allow_body_mod: boolean;
	setting_forbid_cosplay_change: boolean;
	setting_hide_non_adjecent: boolean;
	setting_blind_room_garbling: boolean;
	setting_relog_keeps_restraints: boolean;
	setting_leashed_roomchange: boolean;
	setting_plug_vibe_events: boolean;
	setting_upsidedown_view: boolean;
};

type RuleCustomDataTypesMap = {
	listSelect: string;
	memberNumberList: number[];
	number: number;
	poseSelect: string[];
	roleSelector: import("./modules/authority").AccessLevel;
	string: string;
	stringList: string[];
	textArea: string;
	toggle: boolean;
};
type RuleCustomDataTypes = keyof RuleCustomDataTypesMap;
type RuleCustomDataTypesOptions = {
	listSelect: [string, string][];
};

type RuleCustomDataFilter<U> = {
	[K in RuleCustomDataTypes]: RuleCustomDataTypesMap[K] extends U ? K : never;
}[RuleCustomDataTypes];

type RuleCustomDataEntryDefinition<T extends RuleCustomDataTypes = RuleCustomDataTypes> = {
	type: T;
	default: RuleCustomDataTypesMap[T] | (() => RuleCustomDataTypesMap[T]);
	options?: T extends keyof RuleCustomDataTypesOptions ? RuleCustomDataTypesOptions[T] : undefined;
	description: string;
	Y?: number;
};

type RuleCustomDataEntryDefinitionStrict<ID extends keyof RuleCustomData, P extends keyof RuleCustomData[ID]> = RuleCustomDataEntryDefinition<RuleCustomDataFilter<RuleCustomData[ID][P]>>;

interface RuleDisplayDefinition<ID extends BCX_Rule = BCX_Rule> {
	name: string;
	icon: string;
	shortDescription?: string;
	longDescription: string;
	/** Texts to use for when rule is broken, set to empty string to disable */
	triggerTexts?: {
		/** When rule is broken */
		infoBeep?: string;
		/** When attempt to break rule is made; defaults to `infoBeep` */
		attempt_infoBeep?: string;
		/** When rule is broken */
		log?: string;
		/** When attempt to break rule is made */
		attempt_log?: string;
		/** When rule is broken; defaults to `log` */
		announce?: string;
		/** When attempt to break rule is made; defaults to `attempt_log` */
		attempt_announce?: string;
	};
	defaultLimit: import("./constants").ConditionsLimit;
	/** If rule can be enforced, defaults to `true` */
	enforceable?: false;
	/** If rule can be logged, defaults to `true` */
	loggable?: false;
	dataDefinition?: ID extends keyof RuleCustomData ? {
		[P in keyof RuleCustomData[ID]]: RuleCustomDataEntryDefinitionStrict<ID, P>;
	} : never;
}

interface RuleDefinition<ID extends BCX_Rule = BCX_Rule> extends RuleDisplayDefinition<ID> {
	init?: (state: import("./modules/rules").RuleState<ID>) => void;
	load?: (state: import("./modules/rules").RuleState<ID>) => void;
	unload?: () => void;
	stateChange?: (state: import("./modules/rules").RuleState<ID>, newState: boolean) => void;
	tick?: (state: import("./modules/rules").RuleState<ID>) => boolean;
	internalDataValidate?: ID extends keyof RuleInternalData ? (data: unknown) => boolean : never;
	internalDataDefault?: ID extends keyof RuleInternalData ? () => RuleInternalData[ID] : never;
}

interface RoomTemplate {
	Name: string;
	Description: string;
	Background: string;
	Limit: string;
	Admin: number[];
	Game: string;
	Private: boolean;
	Locked: boolean;
	BlockCategory: string[];
}

interface ModStorage {
	preset: import("./constants").Preset;
	chatShouldDisplayFirstTimeHelp?: true;
	cheats: import("./constants").MiscCheat[];
	disabledModules: import("./constants").ModuleCategory[];
	permissions: PermissionsBundle;
	owners: number[];
	mistresses: number[];
	log: import("./modules/log").LogEntry[];
	logConfig: import("./modules/log").LogConfig;
	typingIndicatorEnable: boolean;
	/**
	 * Maps item group to a cursed item, if there is any, otherwise undefined. Null if the group is cursed to be empty
	 * @deprecated
	 */
	cursedItems: Record<string, CursedItemInfo | null>;
	conditions: ConditionsStorage;
	roomTemplates: (RoomTemplate | null)[];
}
