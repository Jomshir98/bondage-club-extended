import { ChatroomCharacter, getChatroomCharacter } from "../characters";
import { BaseModule } from "./_BaseModule";
import { hookFunction, removeHooksByModule } from "../patching";
import { isObject } from "../utils";
import { ChatRoomSendLocal } from "../utilsClub";
import { AccessLevel, checkPermissionAccess, registerPermission } from "./authority";
import { notifyOfChange, queryHandlers } from "./messaging";
import { moduleIsEnabled } from "./presets";
import { modStorage, modStorageSync } from "./storage";
import { ModuleCategory, Preset } from "../constants";

export const LOG_ENTRIES_LIMIT = 256;

export enum LogEntryType {
	plaintext = 0,
	deleted = 1
}

export enum LogAccessLevel {
	none = 0,
	protected = 1,
	normal = 2,
	everyone = 3
}

export type LogEntryTypeData = {
	/** The data itself */
	[LogEntryType.plaintext]: string;
	/** Deleted log entries are replaced with this */
	[LogEntryType.deleted]: null;
};

/**
 * Compact format containing following:
 * @property {number} 0 - The time this log was recorded
 * @property {LogAccessLevel} 1 - The required access level to view this log
 * @property {LogEntryType} 2 - The type of the entry
 * @property {LogEntryTypeData} 3 - Extra data defined by the entry type
 */
export type LogEntry<Type extends LogEntryType = LogEntryType> = [number, LogAccessLevel, Type, LogEntryTypeData[Type]];

export type LogConfig = Partial<Record<BCX_LogCategory, LogAccessLevel>>;

export function logMessage<Type extends LogEntryType>(category: BCX_LogCategory, type: Type, data: LogEntryTypeData[Type]) {
	if (!moduleIsEnabled(ModuleCategory.Log))
		return;

	const access = modStorage.logConfig?.[category];
	if (access === undefined) {
		throw new Error(`Attempt to log message with unknown category "${category}"`);
	}
	if (access > LogAccessLevel.none) {
		logMessageAdd(access, type, data);
	}
}

function logMessageAdd<Type extends LogEntryType>(access: LogAccessLevel, type: Type, data: LogEntryTypeData[Type]) {
	if (!moduleIsEnabled(ModuleCategory.Log))
		return;

	if (!modStorage.log) {
		throw new Error("Mod storage log not initialized");
	}
	modStorage.log.unshift([Date.now(), access, type, data]);
	// Time must me unique
	if (modStorage.log.length >= 2 && modStorage.log[0][0] <= modStorage.log[1][0]) {
		modStorage.log[0][0] = modStorage.log[1][0] + 1;
	}
	modStorage.log.splice(LOG_ENTRIES_LIMIT);
	modStorageSync();
	notifyOfChange();
}

export function logMessageDelete(time: number, character: ChatroomCharacter | null): boolean {
	if (!moduleIsEnabled(ModuleCategory.Log))
		return false;

	if (character && !checkPermissionAccess("log_delete", character)) {
		return false;
	}

	const access = modStorage.logConfig?.log_deleted;
	if (access === undefined) {
		throw new Error("log_deleted category not found");
	}
	if (!modStorage.log) {
		throw new Error("Mod storage log not initialized");
	}
	for (let i = 0; i < modStorage.log.length; i++) {
		const e = modStorage.log[i];
		if (e[0] === time) {
			if (access === LogAccessLevel.none) {
				modStorage.log.splice(i, 1);
			} else {
				e[1] = access;
				e[2] = LogEntryType.deleted;
				e[3] = null;
			}
			modStorageSync();
			notifyOfChange();
			return true;
		}
	}
	return false;
}

export function logConfigSet(category: BCX_LogCategory, accessLevel: LogAccessLevel, character: ChatroomCharacter | null): boolean {
	if (!moduleIsEnabled(ModuleCategory.Log))
		return false;

	if (character && !checkPermissionAccess("log_configure", character)) {
		return false;
	}

	if (modStorage.logConfig?.[category] === undefined) {
		return false;
	}

	if (![LogAccessLevel.none, LogAccessLevel.normal, LogAccessLevel.protected].includes(accessLevel)) {
		return false;
	}

	if (character) {
		const msg = `${character} changed log configuration "${LOG_CONFIG_NAMES[category]}" ` +
			`from "${LOG_LEVEL_NAMES[modStorage.logConfig[category]!]}" to "${LOG_LEVEL_NAMES[accessLevel]}"`;
		logMessage("log_config_change", LogEntryType.plaintext, msg);
		if (!character.isPlayer()) {
			ChatRoomSendLocal(msg, undefined, character.MemberNumber);
		}
	}

	modStorage.logConfig[category] = accessLevel;
	modStorageSync();
	notifyOfChange();
	return true;
}

export function logClear(character: ChatroomCharacter | null): boolean {
	if (!moduleIsEnabled(ModuleCategory.Log))
		return false;

	if (character && !checkPermissionAccess("log_delete", character)) {
		return false;
	}

	modStorage.log = [];
	logMessageAdd(LogAccessLevel.everyone, LogEntryType.plaintext, "The log has been cleared");

	return true;
}

export function getVisibleLogEntries(character: ChatroomCharacter): LogEntry[] {
	if (!moduleIsEnabled(ModuleCategory.Log))
		return [];

	if (!modStorage.log) {
		throw new Error("Mod storage log not initialized");
	}

	const allow: Record<LogAccessLevel, boolean> = {
		[LogAccessLevel.none]: character.isPlayer(),
		[LogAccessLevel.normal]: checkPermissionAccess("log_view_normal", character),
		[LogAccessLevel.protected]: checkPermissionAccess("log_view_protected", character),
		[LogAccessLevel.everyone]: true
	};
	return modStorage.log.filter(e => allow[e[1]]);
}

export function logMessageRender(entry: LogEntry): string {
	if (entry[2] === LogEntryType.plaintext) {
		const e = entry as LogEntry<LogEntryType.plaintext>;
		return e[3];
	} else if (entry[2] === LogEntryType.deleted) {
		return "[Log message deleted]";
	}
	return `[ERROR: Unknown entry type ${entry[2]}]`;
}

const alreadyPraisedBy: Set<number> = new Set();

export function logGetAllowedActions(character: ChatroomCharacter): BCX_logAllowedActions {
	return {
		configure: checkPermissionAccess("log_configure", character),
		delete: checkPermissionAccess("log_delete", character),
		leaveMessage: checkPermissionAccess("log_add_note", character) && !!(modStorage.logConfig?.user_note),
		praise: checkPermissionAccess("log_praise", character) && !alreadyPraisedBy.has(character.MemberNumber)
	};
}

export function logGetConfig(): LogConfig {
	if (!moduleIsEnabled(ModuleCategory.Log))
		return {};

	if (!modStorage.logConfig) {
		throw new Error("Mod storage log not initialized");
	}

	return { ...modStorage.logConfig };
}

export function logPraise(value: -1 | 0 | 1, message: string | null, character: ChatroomCharacter): boolean {
	if (!moduleIsEnabled(ModuleCategory.Log))
		return false;

	if (![-1, 0, 1].includes(value)) {
		throw new Error("Invalid value");
	}

	if (value === 0 && !message)
		return false;

	const allowed = logGetAllowedActions(character);

	if (value !== 0 && !allowed.praise)
		return false;
	if (message && !allowed.leaveMessage)
		return false;

	if (value !== 0) {
		alreadyPraisedBy.add(character.MemberNumber);
	}

	if (value > 0) {
		if (message) {
			logMessage("user_note", LogEntryType.plaintext, `Praised by ${character} with note: ${message}`);
		} else {
			logMessage("praise", LogEntryType.plaintext, `Praised by ${character}`);
		}
	} else if (value < 0) {
		if (message) {
			logMessage("user_note", LogEntryType.plaintext, `Scolded by ${character} with note: ${message}`);
		} else {
			logMessage("praise", LogEntryType.plaintext, `Scolded by ${character}`);
		}
	} else if (message) {
		logMessage("user_note", LogEntryType.plaintext, `${character} attached a note: ${message}`);
	}

	return true;
}

const logConfigDefaults: LogConfig = {
	log_config_change: LogAccessLevel.protected,
	log_deleted: LogAccessLevel.normal,
	praise: LogAccessLevel.normal,
	user_note: LogAccessLevel.normal,
	entered_public_room: LogAccessLevel.none,
	entered_private_room: LogAccessLevel.none,
	had_orgasm: LogAccessLevel.none,
	permission_change: LogAccessLevel.protected,
	curse_change: LogAccessLevel.none,
	curse_trigger: LogAccessLevel.none,
	authority_roles_change: LogAccessLevel.protected
};

export const LOG_CONFIG_NAMES: Record<BCX_LogCategory, string> = {
	log_config_change: "Log changes in logging configuration",
	log_deleted: "Log deleted log entries",
	praise: "Log praising or scolding behavior",
	user_note: "Ability to see attached notes",
	entered_public_room: "Log which public rooms are entered",
	entered_private_room: "Log which private rooms are entered",
	had_orgasm: "Log each single orgasm",
	permission_change: "Log changes in permission settings",
	curse_change: "Log each application or removal of curses",
	curse_trigger: "Log every time a triggered curse reapplies an item",
	authority_roles_change: "Log getting or losing a BCX owner/mistress"
};

export const LOG_LEVEL_NAMES: Record<LogAccessLevel, string> = {
	[LogAccessLevel.everyone]: "[ERROR]",
	[LogAccessLevel.none]: "No",
	[LogAccessLevel.protected]: "Protected",
	[LogAccessLevel.normal]: "Yes"
};

export class ModuleLog extends BaseModule {
	init() {
		registerPermission("log_view_normal", {
			name: "Allow to see normal log entries",
			category: ModuleCategory.Log,
			defaults: {
				[Preset.dominant]: [true, AccessLevel.mistress],
				[Preset.switch]: [true, AccessLevel.mistress],
				[Preset.submissive]: [true, AccessLevel.friend],
				[Preset.slave]: [true, AccessLevel.public]
			}
		});
		registerPermission("log_view_protected", {
			name: "Allow to see protected log entries",
			category: ModuleCategory.Log,
			defaults: {
				[Preset.dominant]: [true, AccessLevel.lover],
				[Preset.switch]: [true, AccessLevel.lover],
				[Preset.submissive]: [true, AccessLevel.mistress],
				[Preset.slave]: [true, AccessLevel.mistress]
			}
		});
		registerPermission("log_configure", {
			name: "Allow to configure what is logged",
			category: ModuleCategory.Log,
			defaults: {
				[Preset.dominant]: [true, AccessLevel.self],
				[Preset.switch]: [true, AccessLevel.self],
				[Preset.submissive]: [true, AccessLevel.owner],
				[Preset.slave]: [false, AccessLevel.owner]
			}
		});
		registerPermission("log_delete", {
			name: "Allow deleting log entries",
			category: ModuleCategory.Log,
			defaults: {
				[Preset.dominant]: [true, AccessLevel.self],
				[Preset.switch]: [true, AccessLevel.self],
				[Preset.submissive]: [true, AccessLevel.owner],
				[Preset.slave]: [false, AccessLevel.owner]
			}
		});
		registerPermission("log_praise", {
			name: "Allow to praise or scold",
			category: ModuleCategory.Log,
			defaults: {
				[Preset.dominant]: [false, AccessLevel.friend],
				[Preset.switch]: [false, AccessLevel.friend],
				[Preset.submissive]: [false, AccessLevel.public],
				[Preset.slave]: [false, AccessLevel.public]
			}
		});
		registerPermission("log_add_note", {
			name: "Allow to attach notes to the body",
			category: ModuleCategory.Log,
			defaults: {
				[Preset.dominant]: [false, AccessLevel.mistress],
				[Preset.switch]: [false, AccessLevel.mistress],
				[Preset.submissive]: [false, AccessLevel.friend],
				[Preset.slave]: [false, AccessLevel.public]
			}
		});

		queryHandlers.logData = (sender, resolve) => {
			const character = getChatroomCharacter(sender);
			if (character) {
				resolve(true, getVisibleLogEntries(character));
			} else {
				resolve(false);
			}
		};
		queryHandlers.logDelete = (sender, resolve, data) => {
			const character = getChatroomCharacter(sender);
			if (character && typeof data === "number") {
				resolve(true, logMessageDelete(data, character));
			} else {
				resolve(false);
			}
		};
		queryHandlers.logConfigGet = (sender, resolve) => {
			const character = getChatroomCharacter(sender);
			if (character && checkPermissionAccess("log_configure", character)) {
				resolve(true, logGetConfig());
			} else {
				resolve(false);
			}
		};
		queryHandlers.logConfigEdit = (sender, resolve, data) => {
			if (!isObject(data) ||
				typeof data.category !== "string" ||
				typeof data.target !== "number"
			) {
				console.warn(`BCX: Bad logConfigEdit query from ${sender}`, data);
				return resolve(false);
			}
			const character = getChatroomCharacter(sender);
			if (character) {
				resolve(true, logConfigSet(data.category, data.target, character));
			} else {
				resolve(false);
			}
		};
		queryHandlers.logClear = (sender, resolve) => {
			const character = getChatroomCharacter(sender);
			if (character) {
				resolve(true, logClear(character));
			} else {
				resolve(false);
			}
		};
		queryHandlers.logPraise = (sender, resolve, data) => {
			if (!isObject(data) ||
				(data.message !== null && typeof data.message !== "string") ||
				![-1, 0, 1].includes(data.value)
			) {
				console.warn(`BCX: Bad logPraise query from ${sender}`, data);
				return resolve(false);
			}
			const character = getChatroomCharacter(sender);
			if (character) {
				resolve(true, logPraise(data.value, data.message, character));
			} else {
				resolve(false);
			}
		};
		queryHandlers.logGetAllowedActions = (sender, resolve) => {
			const character = getChatroomCharacter(sender);
			if (character) {
				resolve(true, logGetAllowedActions(character));
			} else {
				resolve(false);
			}
		};
	}

	load() {
		if (!moduleIsEnabled(ModuleCategory.Log)) {
			delete modStorage.log;
			delete modStorage.logConfig;
			removeHooksByModule("ActivityOrgasmStart", ModuleCategory.Log);
			removeHooksByModule("ChatRoomSync", ModuleCategory.Log);
			return;
		}

		if (!Array.isArray(modStorage.log)) {
			logClear(null);
		} else if (!modStorage.log.every(e =>
			Array.isArray(e) &&
			e.length === 4 &&
			typeof e[0] === "number" &&
			typeof e[1] === "number" &&
			typeof e[2] === "number"
		)) {
			console.error("BCX: Some log entries have invalid format, reseting whole log!");
			logClear(null);
		}

		if (!modStorage.logConfig) {
			modStorage.logConfig = { ...logConfigDefaults };
		} else {
			const transitionDictionary: Record<string, BCX_LogCategory> = {
				permissionChange: "permission_change",
				logConfigChange: "log_config_change",
				logDeleted: "log_deleted",
				userNote: "user_note",
				curseChange: "curse_change",
				curseTrigger: "curse_trigger",
				hadOrgasm: "had_orgasm",
				enteredPublicRoom: "entered_public_room",
				enteredPrivateRoom: "entered_private_room",
				ownershipChangesBCX: "authority_roles_change"
			};
			for (const k of Object.keys(modStorage.logConfig) as BCX_LogCategory[]) {
				if (transitionDictionary[k] !== undefined) {
					console.info(`BCX: Updating log config name "${k}"->"${transitionDictionary[k]}"`);
					modStorage.logConfig[transitionDictionary[k]] = modStorage.logConfig[k];
					delete modStorage.logConfig[k];
					continue;
				}
				if (logConfigDefaults[k] === undefined) {
					console.info(`BCX: Removing unknown log config category "${k}"`);
					delete modStorage.logConfig[k];
				}
			}
			for (const k of Object.keys(logConfigDefaults) as BCX_LogCategory[]) {
				if (modStorage.logConfig[k] === undefined) {
					console.info(`BCX: Adding missing log category "${k}"`);
					modStorage.logConfig[k] = logConfigDefaults[k];
				}
			}
		}

		hookFunction("ActivityOrgasmStart", 0, (args, next) => {
			const C = args[0] as Character;
			if (C.ID === 0 && (typeof ActivityOrgasmRuined === "undefined" || !ActivityOrgasmRuined)) {
				logMessage("had_orgasm", LogEntryType.plaintext, `${Player.Name} had an orgasm`);
			}
			return next(args);
		}, ModuleCategory.Log);

		hookFunction("ChatRoomSync", 0, (args, next) => {
			const data = args[0];
			if (data.Private) {
				logMessage("entered_private_room", LogEntryType.plaintext, `${Player.Name} entered private room "${data.Name}"`);
			} else {
				logMessage("entered_public_room", LogEntryType.plaintext, `${Player.Name} entered public room "${data.Name}"`);
			}
			return next(args);
		}, ModuleCategory.Log);
	}

	reload() {
		this.load();
	}
}