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
	| "curses_curse"
	| "curses_lift"
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

interface ConditionsConditionData<category extends ConditionsCategories = ConditionsCategories> {
	active: boolean;
	data: ConditionsCategorySpecificData[category];
}

interface ConditionsConditionPublicData<category extends ConditionsCategories = ConditionsCategories> {
	active: boolean;
	data: ConditionsCategorySpecificPublicData[category];
}

type ConditionsCategoryRecord<category extends ConditionsCategories = ConditionsCategories> = Record<ConditionsCategoryKeys[category], ConditionsConditionData<category>>;
type ConditionsCategoryPublicRecord<category extends ConditionsCategories = ConditionsCategories> = Record<ConditionsCategoryKeys[category], ConditionsConditionPublicData<category>>;

type ConditionsStorage = Partial<{
	[category in ConditionsCategories]: ConditionsCategoryRecord<category>;
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
