import { ChatroomCharacter, getChatroomCharacter } from "../characters";
import { BaseModule, ModuleCategory } from "../moduleManager";
import { isObject } from "../utils";
import { AccessLevel, checkPermissionAccess, registerPermission } from "./authority";
import { notifyOfChange, queryHandlers } from "./messaging";
import { modStorage, modStorageSync } from "./storage";

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

export type LogConfig = Record<BCX_LogCategory, LogAccessLevel>;

export function logMessage<Type extends LogEntryType>(category: BCX_LogCategory, type: Type, data: LogEntryTypeData[Type]) {
	const access = modStorage.logConfig?.[category];
	if (access === undefined) {
		throw new Error(`Attempt to log message with unknown category "${category}"`);
	}
	if (access > LogAccessLevel.none) {
		logMessageAdd(access, type, data);
	}
}

function logMessageAdd<Type extends LogEntryType>(access: LogAccessLevel, type: Type, data: LogEntryTypeData[Type]) {
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
	if (character && !checkPermissionAccess("log_delete", character)) {
		return false;
	}

	const access = modStorage.logConfig?.logDeleted;
	if (access === undefined) {
		throw new Error("logDeleted category not found");
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
	if (character && !checkPermissionAccess("log_configure", character)) {
		return false;
	}

	if (modStorage.logConfig?.[category] === undefined) {
		return false;
	}

	if (![LogAccessLevel.none, LogAccessLevel.normal, LogAccessLevel.protected].includes(accessLevel)) {
		return false;
	}

	modStorage.logConfig[category] = accessLevel;
	modStorageSync();
	notifyOfChange();
	return true;
}

export function logClear() {
	modStorage.log = [];
	logMessageAdd(LogAccessLevel.everyone, LogEntryType.plaintext, "The log has been cleared");
}

export function getVisibleLogEntries(character: ChatroomCharacter): LogEntry[] {
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

const logConfigDefaults: LogConfig = {
	logConfigChange: LogAccessLevel.protected,
	logDeleted: LogAccessLevel.normal
};

export class ModuleLog extends BaseModule {
	init() {
		registerPermission("log_view_normal", {
			name: "See normal log entries",
			category: ModuleCategory.Log,
			self: true,
			min: AccessLevel.public
		});
		registerPermission("log_view_protected", {
			name: "See protected log entries",
			category: ModuleCategory.Log,
			self: true,
			min: AccessLevel.mistress
		});
		registerPermission("log_configure", {
			name: "Configure what is logged",
			category: ModuleCategory.Log,
			self: true,
			min: AccessLevel.self
		});
		registerPermission("log_delete", {
			name: "Delete log entries",
			category: ModuleCategory.Log,
			self: true,
			min: AccessLevel.self
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
			if (character && checkPermissionAccess("log_configure", character) && modStorage.logConfig) {
				resolve(true, {...modStorage.logConfig});
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
	}

	load() {
		if (!Array.isArray(modStorage.log)) {
			logClear();
		} else if (!modStorage.log.every(e =>
			Array.isArray(e) &&
			e.length === 4 &&
			typeof e[0] === "number" &&
			typeof e[1] === "number" &&
			typeof e[2] === "number"
		)) {
			console.error("BCX: Some log entries have invalid format, reseting whole log!");
			logClear();
		}

		if (!modStorage.logConfig) {
			modStorage.logConfig = {...logConfigDefaults};
		} else {
			for (const k of Object.keys(modStorage.logConfig) as BCX_LogCategory[]) {
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
	}
}
