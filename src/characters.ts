import { VERSION } from "./config";
import { AccessLevel, checkPermissionAccess, editRole, getPermissionDataFromBundle, getPlayerPermissionSettings, getPlayerRoleData, PermissionData, setPermissionMinAccess, setPermissionSelfAccess } from "./modules/authority";
import { curseGetInfo, curseItem, curseLift } from "./modules/curses";
import { getVisibleLogEntries, LogAccessLevel, logClear, LogConfig, logConfigSet, LogEntry, logGetAllowedActions, logMessageDelete, logPraise } from "./modules/log";
import { sendQuery } from "./modules/messaging";
import { modStorage } from "./modules/storage";
import { isObject } from "./utils";

export class ChatroomCharacter {
	isPlayer(): this is PlayerCharacter {
		return false;
	}

	BCXVersion: string | null = null;
	Character: Character;

	get MemberNumber(): number {
		if (typeof this.Character.MemberNumber !== "number") {
			throw new Error("Character without MemberNumber");
		}
		return this.Character.MemberNumber;
	}

	get Name(): string {
		return this.Character.Name;
	}

	toString(): string {
		return `${this.Name} (${this.MemberNumber})`;
	}

	constructor(character: Character) {
		this.Character = character;
		if (character.ID === 0) {
			this.BCXVersion = VERSION;
		}
		console.debug(`BCX: Loaded character ${character.Name} (${character.MemberNumber})`);
	}

	getPermissions(): Promise<PermissionData> {
		return sendQuery("permissions", undefined, this.MemberNumber).then(data => {
			if (!isObject(data) ||
				Object.values(data).some(v =>
					!Array.isArray(v) ||
					typeof v[0] !== "boolean" ||
					typeof v[1] !== "number" ||
					AccessLevel[v[1]] === undefined
				)
			) {
				throw new Error("Bad data");
			}

			return getPermissionDataFromBundle(data);
		});
	}

	getPermissionAccess(permission: BCX_Permissions): Promise<boolean> {
		return sendQuery("permissionAccess", permission, this.MemberNumber).then(data => {
			if (typeof data !== "boolean") {
				throw new Error("Bad data");
			}
			return data;
		}).catch(err => {
			console.error(`BCX: Error while querying permission "${permission}" access for ${this}`, err);
			return false;
		});
	}

	getMyAccessLevel(): Promise<AccessLevel> {
		return sendQuery("myAccessLevel", undefined, this.MemberNumber).then(data => {
			if (typeof data !== "number" || AccessLevel[data] === undefined) {
				throw new Error("Bad data");
			}
			return data;
		});
	}

	setPermission(permission: BCX_Permissions, type: "self", target: boolean): Promise<boolean>
	setPermission(permission: BCX_Permissions, type: "min", target: AccessLevel): Promise<boolean>
	setPermission(permission: BCX_Permissions, type: "self" | "min", target: boolean | AccessLevel): Promise<boolean> {
		return sendQuery("editPermission", {
			permission,
			edit: type,
			target
		}, this.MemberNumber).then(data => {
			if (typeof data !== "boolean") {
				throw new Error("Bad data");
			}
			return data;
		});
	}

	getRolesData(): Promise<PermissionRoleBundle> {
		return sendQuery("rolesData", undefined, this.MemberNumber).then(data => {
			if (!isObject(data) ||
				!Array.isArray(data.mistresses) ||
				!data.mistresses.every(i => Array.isArray(i) && i.length === 2 && typeof i[0] === "number" && typeof i[1] === "string") ||
				!Array.isArray(data.owners) ||
				!data.owners.every(i => Array.isArray(i) && i.length === 2 && typeof i[0] === "number" && typeof i[1] === "string") ||
				typeof data.allowAddMistress !== "boolean" ||
				typeof data.allowRemoveMistress !== "boolean" ||
				typeof data.allowAddOwner !== "boolean" ||
				typeof data.allowRemoveOwner !== "boolean"
			) {
				throw new Error("Bad data");
			}
			return data;
		});
	}

	editRole(role: "owner" | "mistress", action: "add" | "remove", target: number): Promise<boolean> {
		return sendQuery("editRole", {
			type: role,
			action,
			target
		}, this.MemberNumber).then(data => {
			if (typeof data !== "boolean") {
				throw new Error("Bad data");
			}
			return data;
		});
	}

	getLogEntries(): Promise<LogEntry[]> {
		return sendQuery("logData", undefined, this.MemberNumber).then(data => {
			if (
				!Array.isArray(data) ||
				!data.every(e =>
					Array.isArray(e) &&
					e.length === 4 &&
					typeof e[0] === "number" &&
					typeof e[1] === "number" &&
					typeof e[2] === "number"
				)
			) {
				throw new Error("Bad data");
			}
			return data;
		});
	}

	logMessageDelete(time: number): Promise<boolean> {
		return sendQuery("logDelete", time, this.MemberNumber).then(data => {
			if (typeof data !== "boolean") {
				throw new Error("Bad data");
			}
			return data;
		});
	}

	getLogConfig(): Promise<LogConfig> {
		return sendQuery("logConfigGet", undefined, this.MemberNumber).then(data => {
			if (!isObject(data) ||
				Object.values(data).some(v => typeof v !== "number")
			) {
				throw new Error("Bad data");
			}
			for (const k of Object.keys(data) as BCX_LogCategory[]) {
				if (modStorage.logConfig?.[k] === undefined || LogAccessLevel[data[k]] === undefined) {
					delete data[k];
				}
			}
			return data;
		});
	}

	setLogConfig(category: BCX_LogCategory, target: LogAccessLevel): Promise<boolean> {
		return sendQuery("logConfigEdit", {
			category,
			target
		}, this.MemberNumber).then(data => {
			if (typeof data !== "boolean") {
				throw new Error("Bad data");
			}
			return data;
		});
	}

	logClear(): Promise<boolean> {
		return sendQuery("logClear", undefined, this.MemberNumber).then(data => {
			if (typeof data !== "boolean") {
				throw new Error("Bad data");
			}
			return data;
		});
	}

	logPraise(value: -1 | 0 | 1, message: string | null): Promise<boolean> {
		return sendQuery("logPraise", {
			message,
			value
		}, this.MemberNumber).then(data => {
			if (typeof data !== "boolean") {
				throw new Error("Bad data");
			}
			return data;
		});
	}

	logGetAllowedActions(): Promise<BCX_logAllowedActions> {
		return sendQuery("logGetAllowedActions", undefined, this.MemberNumber).then(data => {
			if (!isObject(data) ||
				typeof data.delete !== "boolean" ||
				typeof data.configure !== "boolean" ||
				typeof data.praise !== "boolean" ||
				typeof data.leaveMessage !== "boolean"
			) {
				throw new Error("Bad data");
			}
			return data;
		});
	}

	curseGetInfo(): Promise<BCX_curseInfo> {
		return sendQuery("curseGetInfo", undefined, this.MemberNumber).then(data => {
			if (!isObject(data) ||
				typeof data.allowCurse !== "boolean" ||
				typeof data.allowLift !== "boolean" ||
				!isObject(data.curses) ||
				Object.values(data.curses).some(v =>
					v !== null &&
					(
						!isObject(v) ||
						typeof v.Name !== "string" ||
						typeof v.curseProperties !== "boolean"
					)
				)
			) {
				throw new Error("Bad data");
			}
			return data;
		});
	}

	curseItem(Group: string, curseProperties: boolean | null): Promise<boolean> {
		return sendQuery("curseItem", { Group, curseProperties }, this.MemberNumber).then(data => {
			if (typeof data !== "boolean") {
				throw new Error("Bad data");
			}
			return data;
		});
	}

	curseLift(Group: string): Promise<boolean> {
		return sendQuery("curseLift", Group, this.MemberNumber).then(data => {
			if (typeof data !== "boolean") {
				throw new Error("Bad data");
			}
			return data;
		});
	}

	hasAccessToPlayer(): boolean {
		return ServerChatRoomGetAllowItem(this.Character, Player);
	}

	playerHasAccessToCharacter(): boolean {
		return ServerChatRoomGetAllowItem(Player, this.Character);
	}
}

export class PlayerCharacter extends ChatroomCharacter {
	/** HACK: Otherwise TS wrongly assumes PlayerCharacter to be identical to ChatroomCharacter */
	public readonly playerObject = true;

	override isPlayer(): this is PlayerCharacter {
		return true;
	}

	override getPermissions(): Promise<PermissionData> {
		return Promise.resolve(getPlayerPermissionSettings());
	}

	override getPermissionAccess(permission: BCX_Permissions): Promise<boolean> {
		return Promise.resolve(checkPermissionAccess(permission, this));
	}

	override getMyAccessLevel(): Promise<AccessLevel.self> {
		return Promise.resolve(AccessLevel.self);
	}

	override setPermission(permission: BCX_Permissions, type: "self", target: boolean): Promise<boolean>
	override setPermission(permission: BCX_Permissions, type: "min", target: AccessLevel): Promise<boolean>
	override setPermission(permission: BCX_Permissions, type: "self" | "min", target: boolean | AccessLevel): Promise<boolean> {
		if (type === "self") {
			if (typeof target !== "boolean") {
				throw new Error("Invalid target value for self permission edit");
			}
			return Promise.resolve(setPermissionSelfAccess(permission, target, this));
		} else {
			if (typeof target !== "number") {
				throw new Error("Invalid target value for min permission edit");
			}
			return Promise.resolve(setPermissionMinAccess(permission, target, this));
		}
	}

	override getRolesData(): Promise<PermissionRoleBundle> {
		return Promise.resolve(getPlayerRoleData(this));
	}

	override editRole(role: "owner" | "mistress", action: "add" | "remove", target: number): Promise<boolean> {
		return Promise.resolve(editRole(role, action, target, this));
	}

	override getLogEntries(): Promise<LogEntry[]> {
		return Promise.resolve(getVisibleLogEntries(this));
	}

	override logMessageDelete(time: number): Promise<boolean> {
		return Promise.resolve(logMessageDelete(time, this));
	}

	override getLogConfig(): Promise<LogConfig> {
		if (!modStorage.logConfig) {
			return Promise.reject("Not initialized");
		}
		return Promise.resolve({ ...modStorage.logConfig });
	}

	override setLogConfig(category: BCX_LogCategory, target: LogAccessLevel): Promise<boolean> {
		return Promise.resolve(logConfigSet(category, target, this));
	}

	override logClear(): Promise<boolean> {
		return Promise.resolve(logClear(this));
	}

	override logPraise(value: -1 | 0 | 1, message: string | null): Promise<boolean> {
		return Promise.resolve(logPraise(value, message, this));
	}

	override logGetAllowedActions(): Promise<BCX_logAllowedActions> {
		return Promise.resolve(logGetAllowedActions(this));
	}

	override curseGetInfo(): Promise<BCX_curseInfo> {
		return Promise.resolve(curseGetInfo(this));
	}

	override curseItem(Group: string, curseProperties: boolean): Promise<boolean> {
		return Promise.resolve(curseItem(Group, curseProperties, this));
	}

	override curseLift(Group: string): Promise<boolean> {
		return Promise.resolve(curseLift(Group, this));
	}
}

const currentRoomCharacters: ChatroomCharacter[] = [];

function cleanOldCharacters(): void {
	for (let i = currentRoomCharacters.length - 1; i >= 0; i--) {
		if (!currentRoomCharacters[i].isPlayer() && !ChatRoomCharacter.includes(currentRoomCharacters[i].Character)) {
			currentRoomCharacters.splice(i, 1);
		}
	}
}

export function getChatroomCharacter(memberNumber: number): ChatroomCharacter | null {
	if (typeof memberNumber !== "number")
		return null;
	cleanOldCharacters();
	let character = currentRoomCharacters.find(c => c.Character.MemberNumber === memberNumber);
	if (!character) {
		if (Player.MemberNumber === memberNumber) {
			character = new PlayerCharacter(Player);
		} else {
			const BCCharacter = ChatRoomCharacter.find(c => c.MemberNumber === memberNumber);
			if (!BCCharacter) {
				return null;
			}
			character = new ChatroomCharacter(BCCharacter);
		}
		currentRoomCharacters.push(character);
	}
	return character;
}

export function getAllCharactersInRoom(): ChatroomCharacter[] {
	return ChatRoomCharacter.map(c => getChatroomCharacter(c.MemberNumber!)).filter(Boolean) as ChatroomCharacter[];
}

export function getPlayerCharacter(): PlayerCharacter {
	let character = currentRoomCharacters.find(c => c.Character === Player) as PlayerCharacter | undefined;
	if (!character) {
		character = new PlayerCharacter(Player);
		currentRoomCharacters.push(character);
	}
	return character;
}
