import { BaseModule, ModuleInitPhase, moduleInitPhase } from "../moduleManager";
import { ModuleCategory } from "../moduleManager";
import { capitalizeFirstLetter, isObject } from "../utils";
import { ChatroomCharacter, getChatroomCharacter } from "../characters";
import { modStorage, modStorageSync } from "./storage";
import { notifyOfChange, queryHandlers } from "./messaging";
import { LogEntryType, logMessage } from "./log";
import { ChatRoomSendLocal } from "../utilsClub";

export enum AccessLevel {
	self = 0,
	clubowner = 1,
	owner = 2, // TODO
	lover = 3,
	mistress = 4, // TODO
	whitelist = 5,
	friend = 6,
	public = 7
}

export interface PermissionInfo {
	name: string;
	category: ModuleCategory;
	self: boolean;
	min: AccessLevel;
}

export type PermissionData = Partial<Record<BCX_Permissions, PermissionInfo>>;

const permissions: Map<BCX_Permissions, PermissionInfo> = new Map();

export function registerPermission(name: BCX_Permissions, data: PermissionInfo) {
	if (moduleInitPhase !== ModuleInitPhase.init) {
		throw new Error("Permissions can be registered only during init");
	}
	if (permissions.has(name)) {
		throw new Error(`Permission "${name}" already defined!`);
	}
	permissions.set(name, data);
}

export function getCharacterAccessLevel(character: ChatroomCharacter): AccessLevel {
	if (character.isPlayer()) return AccessLevel.self;
	if (character.MemberNumber !== null) {
		if (Player.IsOwnedByMemberNumber(character.MemberNumber)) return AccessLevel.clubowner;
		if (Player.IsLoverOfMemberNumber(character.MemberNumber)) return AccessLevel.lover;
		if (Player.WhiteList.includes(character.MemberNumber)) return AccessLevel.whitelist;
		if (Player.FriendList?.includes(character.MemberNumber)) return AccessLevel.friend;
	}
	return AccessLevel.public;
}

export function checkPermissionAccess(permission: BCX_Permissions, character: ChatroomCharacter): boolean {
	const permData = permissions.get(permission);
	if (!permData) {
		console.error(new Error(`Check for unknown permission "${permission}"`));
		return false;
	}
	// TODO: Check item access
	return checkPermisionAccesData(permData, getCharacterAccessLevel(character));
}

export function checkPermisionAccesData(permData: PermissionInfo, accessLevel: AccessLevel): boolean {
	if (accessLevel === AccessLevel.self) {
		return permData.self || permData.min === AccessLevel.self;
	}
	return accessLevel <= permData.min;
}

function permissionsMakeBundle(): PermissionsBundle {
	const res: PermissionsBundle = {};
	for (const [k, v] of permissions.entries()) {
		res[k] = [v.self, v.min];
	}
	return res;
}

export function getPermissionDataFromBundle(bundle: PermissionsBundle): PermissionData {
	const res: PermissionData = {};
	for (const [k, v] of permissions.entries()) {
		if (bundle[k]) {
			res[k] = {
				category: v.category,
				name: v.name,
				self: bundle[k][0],
				min: bundle[k][1]
			};
		}
	}

	return res;
}

export function setPermissionSelfAccess(permission: BCX_Permissions, self: boolean, characterToCheck: ChatroomCharacter | null): boolean {
	const permData = permissions.get(permission);
	if (!permData) {
		throw new Error(`Attempt to edit unknown permission "${permission}"`);
	}

	self = self || permData.min === AccessLevel.self;

	if (permData.self === self) return true;

	if (characterToCheck) {
		if (!checkPermissionAccess(self ? "authority_grant_self" : "authority_revoke_self", characterToCheck) ||
			!characterToCheck.isPlayer() && !checkPermissionAccess(permission, characterToCheck)
		) {
			console.warn(`BCX: Unauthorized self permission edit attempt for "${permission}" by ${characterToCheck}`);
			return false;
		}
	}

	if (characterToCheck) {
		const msg = `${characterToCheck} ` +
			(self ? `gave ${characterToCheck.isPlayer() ? "herself" : Player.Name}` : `removed ${characterToCheck?.isPlayer() ? "her" : Player.Name + "'s"}`) +
			` control over permission "${permData.name}"`;
		logMessage("permissionChange", LogEntryType.plaintext, msg);
		if (!characterToCheck.isPlayer()) {
			ChatRoomSendLocal(msg, undefined, characterToCheck.MemberNumber);
		}
	}

	permData.self = self;
	permissionsSync();
	notifyOfChange();

	return true;
}

export function setPermissionMinAccess(permission: BCX_Permissions, min: AccessLevel, characterToCheck: ChatroomCharacter | null): boolean {
	const permData = permissions.get(permission);
	if (!permData) {
		throw new Error(`Attempt to edit unknown permission "${permission}"`);
	}

	if (permData.min === min) return true;

	if (characterToCheck) {
		const allowed =
		// Exception: Player can always lower permissions "Self"->"Owner"
		(characterToCheck.isPlayer() && permData.min < min && min <= AccessLevel.owner) ||
		(
			// Character must have access to "allow minimal access modification"
			checkPermissionAccess("authority_edit_min", characterToCheck) &&
			(
				// Character must have access to target rule
				checkPermissionAccess(permission, characterToCheck) ||
				// Exception: Player bypasses this check when lowering "minimal access"
				characterToCheck.isPlayer() && min >= permData.min
			) &&
			(
				// Not player must have access to target level
				!characterToCheck.isPlayer() ||
				getCharacterAccessLevel(characterToCheck) <= min
			)
		);
		if (!allowed) {
			console.warn(`BCX: Unauthorized min permission edit attempt for "${permission}" by ${characterToCheck}`);
			return false;
		}
	}

	if (characterToCheck) {
		const msg = `${characterToCheck} changed permission "${permData.name}" from ${getPermissionMinDisplayText(permData.min, characterToCheck)} to ${getPermissionMinDisplayText(min, characterToCheck)}`;
		logMessage("permissionChange", LogEntryType.plaintext, msg);
		if (!characterToCheck.isPlayer()) {
			ChatRoomSendLocal(msg, undefined, characterToCheck.MemberNumber);
		}
	}

	permData.min = min;
	if (min === AccessLevel.self) {
		permData.self = true;
	}
	permissionsSync();
	notifyOfChange();

	return true;
}

function permissionsSync() {
	modStorage.permissions = permissionsMakeBundle();
	modStorageSync();
}

export function getPlayerPermissionSettings(): PermissionData {
	const res: PermissionData = {};
	for (const [k, v] of permissions.entries()) {
		res[k] = {...v};
	}
	return res;
}

export function getPermissionMinDisplayText(minAccess: AccessLevel, character?: ChatroomCharacter): string {
	if (minAccess === AccessLevel.self) {
		return character ? character.Name : "Self";
	}
	return capitalizeFirstLetter(AccessLevel[minAccess]);
}

export class ModuleAuthority extends BaseModule {
	init() {
		registerPermission("authority_grant_self", {
			name: "Allow granting self access",
			category: ModuleCategory.Authority,
			self: true,
			min: AccessLevel.self
		});
		registerPermission("authority_revoke_self", {
			name: "Allow forbidding self access",
			category: ModuleCategory.Authority,
			self: true,
			min: AccessLevel.self
		});
		registerPermission("authority_edit_min", {
			name: "Allow minimal access modification",
			category: ModuleCategory.Authority,
			self: true,
			min: AccessLevel.self
		});

		queryHandlers.permissions = (sender, resolve) => {
			resolve(true, permissionsMakeBundle());
		};
		queryHandlers.permissionAccess = (sender, resolve, data) => {
			const character = getChatroomCharacter(sender);
			if (character && typeof data === "string") {
				resolve(true, checkPermissionAccess(data, character));
			} else {
				resolve(false);
			}
		};
		queryHandlers.myAccessLevel = (sender, resolve) => {
			const character = getChatroomCharacter(sender);
			if (character) {
				resolve(true, getCharacterAccessLevel(character));
			} else {
				resolve(false);
			}
		};
		queryHandlers.editPermission = (sender, resolve, data) => {
			if (!isObject(data) ||
				typeof data.permission !== "string" ||
				(data.edit !== "min" && data.edit !== "self") ||
				(data.edit === "min" && typeof data.target !== "number") ||
				(data.edit === "self" && typeof data.target !== "boolean")
			) {
				console.warn(`BCX: Bad editPermission query from ${sender}`, data);
				return resolve(false);
			}

			const character = getChatroomCharacter(sender);
			if (!character) {
				console.warn(`BCX: editPermission query from ${sender}; not found in room`, data);
				return resolve(false);
			}

			if (!permissions.has(data.permission)) {
				console.warn(`BCX: editPermission query from ${sender}; unknown permission`, data);
				return resolve(false);
			}

			if (data.edit === "self") {
				if (typeof data.target !== "boolean") {
					throw new Error("Assertion failed");
				}
				return resolve(true, setPermissionSelfAccess(data.permission, data.target, character));
			} else {
				if (typeof data.target !== "number") {
					throw new Error("Assertion failed");
				}
				if (AccessLevel[data.target] === undefined) {
					console.warn(`BCX: editPermission query from ${sender}; unknown access level`, data);
					return resolve(true, false);
				}
				return resolve(true, setPermissionMinAccess(data.permission, data.target, character));
			}
		};
	}

	load() {
		if (isObject(modStorage.permissions)) {
			for (const [k, v] of Object.entries(modStorage.permissions)) {
				const perm = permissions.get(k as BCX_Permissions);
				if (!Array.isArray(v) || typeof v[0] !== "boolean" || typeof v[1] !== "number") {
					console.warn(`BCX: Storage: bad permission ${k}`);
				} else if (AccessLevel[v[1]] === undefined) {
					console.warn(`BCX: Storage: bad permission ${k} level ${v[1]}`);
				} else if (perm === undefined) {
					console.warn(`BCX: Storage: unknown permission ${k}`);
				} else {
					perm.self = v[0];
					perm.min = v[1];
				}
			}
		}
		modStorage.permissions = permissionsMakeBundle();
	}
}
