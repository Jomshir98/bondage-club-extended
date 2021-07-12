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
	| "logConfigChange"
	| "logDeleted"
	| "praise"
	| "userNote"
	| "enteredPublicRoom"
	| "enteredPrivateRoom"
	| "hadOrgasm"
	| "permissionChange";

interface ModStorage {
	permissions: PermissionsBundle;
	owners: number[];
	mistresses: number[];
	log: import("./modules/log").LogEntry[];
	logConfig: import("./modules/log").LogConfig;
	typingIndicatorEnable: boolean;
}
