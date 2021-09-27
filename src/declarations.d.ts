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
	highestRoleInRoom: import("./modules/authority").AccessLevel;
	conditions: ConditionsCategoryPublicRecord<category>;
	/** List of limited/blocked conditions; defaults to normal */
	limits: { [P in ConditionsCategoryKeys[category]]?: import("./constants").ConditionsLimit };
}

type ConditionsStorage = Partial<{
	[category in ConditionsCategories]: ConditionsCategoryData<category>;
}>;

type BCX_Rule =
	| "forbid_remoteuse_self"
	| "forbid_remoteuse_others"
	| "forbid_keyuse_self"
	| "forbid_keyuse_others"
	| "forbid_lockuse_self"
	| "forbid_lockuse_others"
	| "forbid_wardrobeaccess_self"
	| "forbid_wardrobeaccess_others"
	| "restrict_allowed_poses"
	| "forbid_creating_rooms"
	| "restrict_accessible_rooms"
	| "sensory_deprivation_sound"
	| "sensory_deprivation_sight"
	| "sensory_deprivation_eyes"
	| "sensory_deprivation_blindfolds"
	| "always_slow"
	| "orgasm_control"
	| "room_admin_management"
	| "limit_tied_admins_power"
	| "set_profile_description"
	| "always_in_suitcase_game"
	| "rc_club_owner"
	| "rc_new_lovers"
	| "rc_leave_lovers"
	| "rc_new_subs"
	| "rc_leave_subs"
	| "allow_set_sound_only"
	| "garble_gagged_whispers"
	| "block_OOC_while_gagged"
	| "doll_talk"
	| "banning_words"
	| "forbid_talking"
	| "restricted_whispering";

type RuleCustomData = {
	restrict_accessible_rooms: {
		roomList: string[];
	},
	restrict_allowed_poses: {
		poseButtons: string[];
	},
	sensory_deprivation_sound: {
		deafeningStrength: "light" | "medium" | "heavy";
	},
	sensory_deprivation_sight: {
		blindnessStrength: "light" | "medium" | "heavy";
	},
	orgasm_control: {
		orgasmHandling: "edge" | "ruined" | "noResist";
	},
	room_admin_management: {
		minimumRole: import("./modules/authority").AccessLevel;
		removeAdminToggle: boolean;
	},
	set_profile_description: {
		playersProfileDescription: string;
	},
	allow_set_sound_only: {
		soundWhitelist: string;
	},
	doll_talk: {
		maxWordLength: number;
		maxNumberOfWords: number;
	},
	banning_words: {
		bannedWords: string[];
	},
	restricted_whispering: {
		minimumPermittedRole: import("./modules/authority").AccessLevel;
	}
};

type RuleCustomDataTypesMap = {
	memberNumberList: number[];
	number: number;
	orgasm: "edge" | "ruined" | "noResist";
	poseSelect: string[];
	roleSelector: import("./modules/authority").AccessLevel;
	strengthSelect: "light" | "medium" | "heavy";
	string: string;
	stringList: string[];
	toggle: boolean;
};
type RuleCustomDataTypes = keyof RuleCustomDataTypesMap;

type RuleCustomDataFilter<U> = {
	[K in RuleCustomDataTypes]: RuleCustomDataTypesMap[K] extends U ? K : never;
}[RuleCustomDataTypes];

type RuleCustomDataEntryDefinition = {
	type: RuleCustomDataTypes;
	default: RuleCustomDataTypesMap[RuleCustomDataTypes];
	description: string;
	Y?: number;
};

type RuleCustomDataEntryDefinitionStrict<ID extends keyof RuleCustomData, P extends keyof RuleCustomData[ID]> = RuleCustomDataEntryDefinition & {
	type: RuleCustomDataFilter<RuleCustomData[ID][P]>;
	default: RuleCustomData[ID][P];
};

interface RuleDisplayDefinition<ID extends BCX_Rule = BCX_Rule> {
	name: string;
	icon: string;
	shortDescription?: string;
	longDescription: string;
	defaultLimit: import("./constants").ConditionsLimit;
	/** If rule can be enforced, defaults to `true` */
	enforcabe?: false;
	/** If rule can be logged, defaults to `true` */
	loggable?: false;
	dataDefinition?: ID extends keyof RuleCustomData ? {
		[P in keyof RuleCustomData[ID]]: RuleCustomDataEntryDefinitionStrict<ID, P>;
	} : never;
}

interface RuleDefinition<ID extends BCX_Rule = BCX_Rule> extends RuleDisplayDefinition<ID> {
	load?: () => void;
	unload?: () => void;
	tick?: () => boolean;
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
}
