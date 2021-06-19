import { BaseModule, ModuleInitPhase, moduleInitPhase } from "../moduleManager";
import { ModuleCategory } from "../moduleManager";
import { isObject } from "../utils";
import { ChatroomCharacter } from "../characters";
import { modStorage, modStorageSync } from "./storage";
import { queryHandlers } from "./messaging";

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
	if (character.isPlayer()) {
		return permData.self || permData.min === AccessLevel.self;
	}
	// TODO: Check item access
	const accessLevel = getCharacterAccessLevel(character);
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


export function setPermissionSelfAccess(permission: BCX_Permissions, self: boolean) {
	const permData = permissions.get(permission);
	if (!permData) {
		throw new Error(`Attempt to edit unknown permission "${permission}"`);
	}
	const last = permData.self;
	permData.self = self || permData.min === AccessLevel.self;
	if (permData.self !== last) {
		permissionsSync();
	}
}

export function setPermissionMinAccess(permission: BCX_Permissions, min: AccessLevel) {
	const permData = permissions.get(permission);
	if (!permData) {
		throw new Error(`Attempt to edit unknown permission "${permission}"`);
	}
	const last = permData.min;
	permData.min = min;
	if (min === AccessLevel.self) {
		permData.self = true;
	}
	if (permData.min !== last) {
		permissionsSync();
	}
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
