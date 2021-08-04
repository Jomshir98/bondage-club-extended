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
	| "log_view_normal"
	| "log_view_protected"
	| "log_configure"
	| "log_delete"
	| "log_praise"
	| "log_leaveMessage"
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
	| "permissionChange"
	| "logConfigChange"
	| "logDeleted"
	| "praise"
	| "userNote"
	| "curseChange"
	| "curseTrigger"
	| "hadOrgasm"
	| "enteredPublicRoom"
	| "enteredPrivateRoom";

interface CursedItemInfo {
	Name: string;
	curseProperty: boolean;
	Color?: string | string[];
	Difficulty?: number;
	Property?: ItemProperties;
}

interface ModStorage {
	preset: import("./constants").Preset;
	disabledModules: import("./constants").ModuleCategory[];
	permissions: PermissionsBundle;
	owners: number[];
	mistresses: number[];
	log: import("./modules/log").LogEntry[];
	logConfig: import("./modules/log").LogConfig;
	typingIndicatorEnable: boolean;
	/**
	 * Maps item group to a cursed item, if there is any, otherwise undefined. Null if the group is cursed to be empty
	 */
	cursedItems: Record<string, CursedItemInfo | null>;
}
