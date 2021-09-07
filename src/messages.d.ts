type BCX_beep_versionCheck = {
	version: string;
	UA: string;
};

type BCX_beep_versionResponse = {
	status: "unsupported" | "deprecated" | "newAvailable" | "current";
};

type BCX_beeps = {
	versionCheck: BCX_beep_versionCheck;
	versionResponse: BCX_beep_versionResponse;
	clearData: true;
};

type BCX_message_ChatRoomStatusEvent = {
	Type: string;
	Target: number | null;
};

type BCX_message_hello = {
	version: string;
	request: boolean;
};

type BCX_message_query = {
	id: string;
	query: keyof BCX_queries;
	data?: any;
};

type BCX_message_queryAnswer = {
	id: string;
	ok: boolean;
	data?: any;
};

type BCX_messages = {
	ChatRoomStatusEvent: BCX_message_ChatRoomStatusEvent;
	hello: BCX_message_hello;
	goodbye: undefined;
	query: BCX_message_query;
	queryAnswer: BCX_message_queryAnswer;
	somethingChanged: undefined;
};

type BCX_logAllowedActions = {
	delete: boolean;
	configure: boolean;
	praise: boolean;
	leaveMessage: boolean;
};

type BCX_curseInfo = {
	allowCurse: boolean;
	allowLift: boolean;
	curses: Record<string, {
		Name: string;
		curseProperties: boolean;
	} | null>;
};

type BCX_queries = {
	disabledModules: [undefined, import("./constants").ModuleCategory[]];
	commandHint: [string, [string, string[] | null]];
	permissions: [undefined, PermissionsBundle];
	myAccessLevel: [undefined, import("./modules/authority").AccessLevel];
	editPermission: [{
		permission: BCX_Permissions;
		edit: "self" | "min";
		target: boolean | number;
	}, boolean];
	permissionAccess: [BCX_Permissions, boolean];
	rolesData: [undefined, PermissionRoleBundle];
	editRole: [
		{
			type: "owner" | "mistress";
			action: "add" | "remove";
			target: number;
		},
		boolean
	];
	logData: [undefined, import("./modules/log").LogEntry[]];
	logDelete: [number, boolean];
	logConfigGet: [undefined, import("./modules/log").LogConfig];
	logConfigEdit: [{
		category: BCX_LogCategory;
		target: import("./modules/log").LogAccessLevel;
	}, boolean];
	logClear: [undefined, boolean];
	logPraise: [
		{
			message: string | null;
			value: -1 | 0 | 1;
		},
		boolean
	];
	logGetAllowedActions: [undefined, BCX_logAllowedActions];
	curseGetInfo: [undefined, BCX_curseInfo];
	curseItem: [
		{
			Group: string;
			curseProperties: boolean | null;
		},
		boolean
	];
	curseLift: [string, boolean];
	curseLiftAll: [undefined, boolean];
	curseBatch: [
		{
			mode: "items" | "clothes";
			includingEmpty: boolean;
		},
		boolean
	];
	conditionsGet: [ConditionsCategories, ConditionsCategoryPublicData<ConditionsCategories>];
	conditionSetActive: [{
		category: ConditionsCategories;
		condition: string;
		active: boolean;
	}, boolean];
	conditionSetLimit: [{
		category: ConditionsCategories;
		condition: string;
		limit: import("./constants").ConditionsLimit;
	}, boolean];
	conditionUpdate: [{
		category: ConditionsCategories;
		condition: string;
		data: ConditionsConditionPublicData;
	}, boolean];
	conditionCategoryUpdate: [{
		category: ConditionsCategories;
		data: ConditionsCategoryConfigurableData;
	}, boolean];
};
