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
	rules: string;
}

type ConditionsCategories = keyof ConditionsCategoryKeys;

interface ConditionsCategorySpecificData {
	curses: CursedItemInfo | null;
	rules: null;
}

interface ConditionsCategorySpecificPublicData {
	curses: {
		Name: string;
		curseProperties: boolean;
	} | null;
	rules: null;
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
