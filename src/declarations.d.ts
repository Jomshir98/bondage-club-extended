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
	| "log_view_normal"
	| "log_view_protected"
	| "log_configure"
	| "log_delete"
	| "log_praise"
	| "log_leaveMessage"
	| "misc_test";

type PermissionsBundle = Record<string, [boolean, number]>;

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
	log: import("./modules/log").LogEntry[];
	logConfig: import("./modules/log").LogConfig;
	typingIndicatorEnable: boolean;
}
