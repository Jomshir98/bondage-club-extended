import { moduleInitPhase } from "../moduleManager";
import { BaseModule } from "./_BaseModule";
import { capitalizeFirstLetter, isObject } from "../utils";
import { ChatroomCharacter, getAllCharactersInRoom, getPlayerCharacter } from "../characters";
import { modStorage, modStorageSync } from "./storage";
import { notifyOfChange, queryHandlers } from "./messaging";
import { LogEntryType, logMessage } from "./log";
import { ChatRoomActionMessage, ChatRoomSendLocal, getCharacterName } from "../utilsClub";
import { moduleIsEnabled } from "./presets";
import { RulesGetRuleState } from "./rules";
import { ModuleCategory, ModuleInitPhase, MODULE_NAMES, Preset } from "../constants";
import { Command_fixExclamationMark, COMMAND_GENERIC_ERROR, Command_selectCharacterAutocomplete, Command_selectCharacterMemberNumber, registerWhisperCommand } from "./commands";

export enum AccessLevel {
	self = 0,
	clubowner = 1,
	owner = 2,
	lover = 3,
	mistress = 4,
	whitelist = 5,
	friend = 6,
	public = 7
}

export interface PermissionSetup {
	readonly name: string;
	readonly category: ModuleCategory;
	readonly defaults: {
		readonly [p in Preset]: readonly [boolean, AccessLevel];
	}
}

export interface PermissionInfo extends PermissionSetup {
	self: boolean;
	min: AccessLevel;
}

export type PermissionData = Partial<Record<BCX_Permissions, PermissionInfo>>;

const permissions: Map<BCX_Permissions, PermissionInfo> = new Map();

export function registerPermission(name: BCX_Permissions, data: PermissionSetup) {
	if (moduleInitPhase !== ModuleInitPhase.init) {
		throw new Error("Permissions can be registered only during init");
	}
	if (permissions.has(name)) {
		throw new Error(`Permission "${name}" already defined!`);
	}
	for (const [k, v] of Object.entries(data.defaults)) {
		if (v[1] === AccessLevel.self && !v[0]) {
			console.error(`BCX: register permission "${name}": default for ${k} has invalid self value`);
		}
	}
	permissions.set(name, {
		...data,
		self: data.defaults[Preset.switch][0],
		min: data.defaults[Preset.switch][1]
	});
}

export function getCharacterAccessLevel(character: ChatroomCharacter | number): AccessLevel {
	const memberNumber = typeof character === "number" ? character : character.MemberNumber;
	if (Player.MemberNumber === memberNumber) return AccessLevel.self;
	if (memberNumber !== null) {
		if (Player.IsOwnedByMemberNumber(memberNumber)) return AccessLevel.clubowner;
		if (modStorage.owners?.includes(memberNumber)) return AccessLevel.owner;
		if (Player.IsLoverOfMemberNumber(memberNumber)) return AccessLevel.lover;
		if (modStorage.mistresses?.includes(memberNumber)) return AccessLevel.mistress;
		if (Player.WhiteList.includes(memberNumber)) return AccessLevel.whitelist;
		if (Player.FriendList?.includes(memberNumber)) return AccessLevel.friend;
	}
	return AccessLevel.public;
}

/** Returns the highest role, that is currently in room (except self), `null` if not in room or alone */
export function getHighestRoleInRoom(): AccessLevel | null {
	let res: AccessLevel | null = null;
	for (const char of getAllCharactersInRoom()) {
		const role = getCharacterAccessLevel(char);
		if (role !== AccessLevel.self && (!res || role < res)) {
			res = role;
		}
	}
	return res;
}

export function checkPermissionAccess(permission: BCX_Permissions, character: ChatroomCharacter): boolean {
	const permData = permissions.get(permission);
	if (!permData) {
		console.error(new Error(`Check for unknown permission "${permission}"`));
		return false;
	}
	if (!character.hasAccessToPlayer())
		return false;
	if (!moduleIsEnabled(permData.category))
		return false;
	if (character.isPlayer() && selfAccessBlockedByRule(permData)) {
		return false;
	}
	return checkPermissionAccessData(permData, getCharacterAccessLevel(character));
}

export function checkPermissionAccessData(permData: PermissionInfo, accessLevel: AccessLevel): boolean {
	if (accessLevel === AccessLevel.self) {
		return permData.self || permData.min === AccessLevel.self;
	}
	return accessLevel <= permData.min;
}

function selfAccessBlockedByRule(permData: PermissionInfo): boolean {
	const blockRule = RulesGetRuleState("block_BCX_permissions");
	if (!blockRule.isEnforced || (permData.self && permData.min === AccessLevel.self)) {
		return false;
	}
	return true;
}

function permissionsMakeBundle(): PermissionsBundle {
	const res: PermissionsBundle = {};
	for (const [k, v] of permissions.entries()) {
		if (!moduleIsEnabled(v.category))
			continue;
		res[k] = [v.self, v.min];
	}
	return res;
}

export function getPermissionDataFromBundle(bundle: PermissionsBundle): PermissionData {
	const res: PermissionData = {};
	for (const [k, v] of permissions.entries()) {
		if (bundle[k]) {
			res[k] = {
				...v,
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

	if (!moduleIsEnabled(permData.category))
		return false;

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
		logMessage("permission_change", LogEntryType.plaintext, msg);
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

	if (!moduleIsEnabled(permData.category))
		return false;

	if (permData.min === min) return true;

	if (characterToCheck) {
		const allowed =
			// Exception: Player can always lower permissions "Self"->"Owner"
			(characterToCheck.isPlayer() && permData.min < min && min <= AccessLevel.owner) ||
			(
				// Character must have access to "allow lowest access modification"
				checkPermissionAccess("authority_edit_min", characterToCheck) &&
				(
					// Character must have access to target rule
					checkPermissionAccess(permission, characterToCheck) ||
					// Exception: Player bypasses this check when lowering "lowest access"
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
		const msg = `${characterToCheck} changed permission "${permData.name}" from ` +
			`"${getPermissionMinDisplayText(permData.min, characterToCheck)}" to "${getPermissionMinDisplayText(min, characterToCheck)}"`;
		logMessage("permission_change", LogEntryType.plaintext, msg);
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
		if (!moduleIsEnabled(v.category))
			continue;
		res[k] = { ...v };
	}
	return res;
}

export function getPermissionMinDisplayText(minAccess: AccessLevel, character?: ChatroomCharacter): string {
	if (minAccess === AccessLevel.self) {
		return character ? character.Name : "Self";
	}
	return capitalizeFirstLetter(AccessLevel[minAccess]);
}

export function getPlayerRoleData(character: ChatroomCharacter): PermissionRoleBundle {
	const loadNames = (memberNumber: number): [number, string] => [memberNumber, getCharacterName(memberNumber, "")];
	let allowedMistressList: [number, string][] = [];
	let allowedOwnerList: [number, string][] = [];

	if (checkPermissionAccess("authority_view_roles", character) || checkPermissionAccess("authority_mistress_remove", character)) {
		allowedMistressList = (modStorage.mistresses ?? []).map(loadNames);
	} else if (modStorage.mistresses?.includes(character.MemberNumber)) {
		allowedMistressList = [[character.MemberNumber, character.Name]];
	}

	if (checkPermissionAccess("authority_view_roles", character) || checkPermissionAccess("authority_owner_remove", character)) {
		allowedOwnerList = (modStorage.owners ?? []).map(loadNames);
	} else if (modStorage.owners?.includes(character.MemberNumber)) {
		allowedOwnerList = [[character.MemberNumber, character.Name]];
	}

	return {
		mistresses: allowedMistressList,
		owners: allowedOwnerList,
		allowAddMistress: checkPermissionAccess("authority_mistress_add", character),
		allowRemoveMistress: checkPermissionAccess("authority_mistress_remove", character),
		allowAddOwner: checkPermissionAccess("authority_owner_add", character),
		allowRemoveOwner: checkPermissionAccess("authority_owner_remove", character)
	};
}

export function editRole(role: "owner" | "mistress", action: "add" | "remove", target: number, character: ChatroomCharacter | null): boolean {
	if (target === Player.MemberNumber)
		return false;

	if (!modStorage.owners || !modStorage.mistresses) {
		throw new Error("Not initialized");
	}

	if (character) {
		let permissionToCheck: BCX_Permissions = "authority_mistress_add";
		if (role === "mistress" && action === "remove")
			permissionToCheck = "authority_mistress_remove";
		else if (role === "owner" && action === "add")
			permissionToCheck = "authority_owner_add";
		else if (role === "owner" && action === "remove")
			permissionToCheck = "authority_owner_remove";

		if (!checkPermissionAccess(permissionToCheck, character) && (action !== "remove" || target !== character.MemberNumber))
			return false;

		if (
			role === "mistress" && action === "add" && modStorage.owners.includes(target) && !checkPermissionAccess("authority_owner_remove", character)
		) {
			return false;
		}
	}

	if (
		role === "owner" && action === "remove" && !modStorage.owners.includes(target) ||
		role === "mistress" && action === "remove" && !modStorage.mistresses.includes(target)
	) {
		return true;
	}

	if (character) {
		const targetDescriptor = character.MemberNumber === target ? "herself" : `${getCharacterName(target, "[unknown name]")} (${target})`;
		const msg = action === "add" ?
			`${character} added ${targetDescriptor} as ${role}.` :
			`${character} removed ${targetDescriptor} from being ${role}.`;
		logMessage("authority_roles_change", LogEntryType.plaintext, msg);
		if (!character.isPlayer()) {
			ChatRoomSendLocal(msg, undefined, character.MemberNumber);
		}
		if (action === "add" && character.MemberNumber !== target) {
			const user = character.isPlayer() ? "her" : `${Player.Name}'s (${Player.MemberNumber})`;
			ChatRoomActionMessage(`${character} added you as ${user} BCX ${role}.`, target);
		}
	}

	const ownerIndex = modStorage.owners.indexOf(target);
	if (ownerIndex >= 0) {
		modStorage.owners.splice(ownerIndex, 1);
	}

	const mistressIndex = modStorage.mistresses.indexOf(target);
	if (mistressIndex >= 0) {
		modStorage.mistresses.splice(mistressIndex, 1);
	}

	if (action === "add") {
		if (role === "owner") {
			modStorage.owners.push(target);
		} else if (role === "mistress") {
			modStorage.mistresses.push(target);
		}
	}

	modStorageSync();
	notifyOfChange();
	return true;
}

export class ModuleAuthority extends BaseModule {
	init() {
		registerPermission("authority_grant_self", {
			name: "Allow granting self access",
			category: ModuleCategory.Authority,
			defaults: {
				[Preset.dominant]: [true, AccessLevel.self],
				[Preset.switch]: [true, AccessLevel.self],
				[Preset.submissive]: [false, AccessLevel.owner],
				[Preset.slave]: [false, AccessLevel.owner]
			}
		});
		registerPermission("authority_revoke_self", {
			name: "Allow forbidding self access",
			category: ModuleCategory.Authority,
			defaults: {
				[Preset.dominant]: [true, AccessLevel.self],
				[Preset.switch]: [true, AccessLevel.self],
				[Preset.submissive]: [true, AccessLevel.self],
				[Preset.slave]: [false, AccessLevel.owner]
			}
		});
		registerPermission("authority_edit_min", {
			name: "Allow lowest access modification",
			category: ModuleCategory.Authority,
			defaults: {
				[Preset.dominant]: [true, AccessLevel.self],
				[Preset.switch]: [true, AccessLevel.self],
				[Preset.submissive]: [true, AccessLevel.self],
				[Preset.slave]: [false, AccessLevel.owner]
			}
		});
		registerPermission("authority_mistress_add", {
			name: "Allow granting Mistress status",
			category: ModuleCategory.Authority,
			defaults: {
				[Preset.dominant]: [true, AccessLevel.self],
				[Preset.switch]: [true, AccessLevel.self],
				[Preset.submissive]: [true, AccessLevel.lover],
				[Preset.slave]: [true, AccessLevel.mistress]
			}
		});
		registerPermission("authority_mistress_remove", {
			name: "Allow revoking Mistress status",
			category: ModuleCategory.Authority,
			defaults: {
				[Preset.dominant]: [true, AccessLevel.self],
				[Preset.switch]: [true, AccessLevel.self],
				[Preset.submissive]: [false, AccessLevel.lover],
				[Preset.slave]: [false, AccessLevel.lover]
			}
		});
		registerPermission("authority_owner_add", {
			name: "Allow granting Owner status",
			category: ModuleCategory.Authority,
			defaults: {
				[Preset.dominant]: [true, AccessLevel.self],
				[Preset.switch]: [true, AccessLevel.self],
				[Preset.submissive]: [true, AccessLevel.clubowner],
				[Preset.slave]: [true, AccessLevel.owner]
			}
		});
		registerPermission("authority_owner_remove", {
			name: "Allow revoking Owner status",
			category: ModuleCategory.Authority,
			defaults: {
				[Preset.dominant]: [true, AccessLevel.self],
				[Preset.switch]: [true, AccessLevel.self],
				[Preset.submissive]: [false, AccessLevel.clubowner],
				[Preset.slave]: [false, AccessLevel.clubowner]
			}
		});
		registerPermission("authority_view_roles", {
			name: "Allow viewing list of owners/mistresses",
			category: ModuleCategory.Authority,
			defaults: {
				[Preset.dominant]: [true, AccessLevel.self],
				[Preset.switch]: [true, AccessLevel.mistress],
				[Preset.submissive]: [true, AccessLevel.whitelist],
				[Preset.slave]: [true, AccessLevel.public]
			}
		});

		queryHandlers.permissions = (sender, resolve) => {
			resolve(true, permissionsMakeBundle());
		};
		queryHandlers.permissionAccess = (sender, resolve, data) => {
			if (typeof data === "string") {
				resolve(true, checkPermissionAccess(data, sender));
			} else {
				resolve(false);
			}
		};
		queryHandlers.myAccessLevel = (sender, resolve) => {
			resolve(true, getCharacterAccessLevel(sender));
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

			if (!permissions.has(data.permission)) {
				console.warn(`BCX: editPermission query from ${sender}; unknown permission`, data);
				return resolve(false);
			}

			if (data.edit === "self") {
				if (typeof data.target !== "boolean") {
					throw new Error("Assertion failed");
				}
				return resolve(true, setPermissionSelfAccess(data.permission, data.target, sender));
			} else {
				if (typeof data.target !== "number") {
					throw new Error("Assertion failed");
				}
				if (AccessLevel[data.target] === undefined) {
					console.warn(`BCX: editPermission query from ${sender}; unknown access level`, data);
					return resolve(true, false);
				}
				return resolve(true, setPermissionMinAccess(data.permission, data.target, sender));
			}
		};

		queryHandlers.rolesData = (sender, resolve) => {
			if (
				!checkPermissionAccess("authority_view_roles", sender) &&
				!checkPermissionAccess("authority_mistress_add", sender) &&
				!checkPermissionAccess("authority_mistress_remove", sender) &&
				!checkPermissionAccess("authority_owner_add", sender) &&
				!checkPermissionAccess("authority_owner_remove", sender) &&
				!modStorage.mistresses?.includes(sender.MemberNumber) &&
				!modStorage.owners?.includes(sender.MemberNumber)
			) {
				return resolve(false);
			}

			resolve(true, getPlayerRoleData(sender));
		};

		queryHandlers.editRole = (sender, resolve, data) => {
			if (!isObject(data) ||
				data.type !== "owner" && data.type !== "mistress" ||
				data.action !== "add" && data.action !== "remove" ||
				typeof data.target !== "number"
			) {
				console.warn(`BCX: Bad editRole query from ${sender}`, data);
				return resolve(false);
			}

			resolve(true, editRole(data.type, data.action, data.target, sender));
		};

		registerWhisperCommand("modules", "role", "- Manage Owner & Mistress roles", (argv, sender, respond) => {
			const subcommand = (argv[0] || "").toLocaleLowerCase();
			if (subcommand === "list") {
				if (
					!checkPermissionAccess("authority_view_roles", sender) &&
					!checkPermissionAccess("authority_mistress_add", sender) &&
					!checkPermissionAccess("authority_mistress_remove", sender) &&
					!checkPermissionAccess("authority_owner_add", sender) &&
					!checkPermissionAccess("authority_owner_remove", sender) &&
					!modStorage.mistresses?.includes(sender.MemberNumber) &&
					!modStorage.owners?.includes(sender.MemberNumber)
				) {
					return respond(COMMAND_GENERIC_ERROR);
				}
				const data = getPlayerRoleData(sender);
				let res = "Visible list:";
				for (const owner of data.owners) {
					res += `\nOwner ${owner[1] || "[unknown name]"} (${owner[0]})`;
				}
				for (const mistress of data.mistresses) {
					res += `\nMistress ${mistress[1] || "[unknown name]"} (${mistress[0]})`;
				}
				respond(res);
			} else if (subcommand === "owner" || subcommand === "mistress") {
				const subcommand2 = (argv[1] || "").toLocaleLowerCase();
				if (subcommand2 !== "add" && subcommand2 !== "remove") {
					return respond(`Expected either 'add' or 'remove', got '${subcommand2}'`);
				}
				if (!argv[2]) {
					return respond(`Missing required argument: target`);
				}
				const target = Command_selectCharacterMemberNumber(argv[2], true);
				if (typeof target === "string") {
					return respond(target);
				}
				respond(editRole(subcommand, subcommand2, target, sender) ? "Ok!" : COMMAND_GENERIC_ERROR);
			} else {
				respond(Command_fixExclamationMark(sender, `!role usage:\n` +
					`!role list - List all current owners/mistresses\n` +
					`!role owner <add/remove> <target> - Add or remove target as owner\n` +
					`!role mistress <add/remove> <target> - Add or remove target as mistress`
				));
			}
		}, (argv, sender) => {
			if (argv.length <= 1) {
				const c = argv[0].toLocaleLowerCase();
				return ["list", "owner", "mistress"].filter(i => i.startsWith(c));
			}
			const subcommand = argv[0].toLocaleLowerCase();
			if (subcommand === "owner" || subcommand === "mistress") {
				if (argv.length === 2) {
					const c = argv[1].toLocaleLowerCase();
					return ["add", "remove"].filter(i => i.startsWith(c));
				}
				const subcommand2 = argv[1].toLocaleLowerCase();
				if (subcommand2 === "add" || subcommand2 === "remove") {
					return Command_selectCharacterAutocomplete(argv[2]);
				}
			}

			return [];
		});

		registerWhisperCommand("modules", "permission", "- Manage permissions", (argv, sender, respond) => {
			const subcommand = (argv[0] || "").toLocaleLowerCase();
			const permissionsList = getPlayerPermissionSettings();
			if (subcommand === "list") {
				const categories: Map<ModuleCategory, PermissionData> = new Map();
				let hasAny = false;
				const filter = argv.slice(1).map(v => v.toLocaleLowerCase());
				for (const [k, v] of Object.entries(permissionsList)) {
					if (filter.some(i =>
						!MODULE_NAMES[v.category].toLocaleLowerCase().includes(i) &&
						!v.name.toLocaleLowerCase().includes(i) &&
						!k.toLocaleLowerCase().includes(i)
					)) continue;
					let permdata = categories.get(v.category);
					if (!permdata) {
						categories.set(v.category, permdata = {});
					}
					hasAny = true;
					permdata[k as BCX_Permissions] = v;
				}
				if (!hasAny) {
					return respond("No permission matches the filter!");
				}
				for (const [category, data] of Array.from(categories.entries()).sort((a, b) => a[0] - b[0])) {
					let result = `List of ${MODULE_NAMES[category]} module permissions:`;
					for (const [k, v] of Object.entries(data).sort((a, b) => a[1].name.localeCompare(b[1].name))) {
						result += `\n${k}:\n  ${v.name} - ${v.self ? "self" : "not self"}, ${getPermissionMinDisplayText(v.min, getPlayerCharacter())}`;
					}
					respond(result);
					result = "";
				}
			} else if (permissionsList[subcommand as BCX_Permissions] !== undefined) {
				const subcommand2 = (argv[1] || "").toLocaleLowerCase();
				let subcommand3 = (argv[2] || "").toLocaleLowerCase();
				if (subcommand2 === "") {
					const v = permissionsList[subcommand as BCX_Permissions]!;
					respond(`${subcommand}:\n  ${v.name} - ${v.self ? "self" : "not self"}, ${getPermissionMinDisplayText(v.min, getPlayerCharacter())}`);
				} else if (subcommand2 === "selfaccess") {
					if (subcommand3 === "yes" || subcommand3 === "no") {
						respond(setPermissionSelfAccess(subcommand as BCX_Permissions, subcommand3 === "yes", sender) ? "Ok!" : COMMAND_GENERIC_ERROR);
					} else {
						respond(`Expected 'selfaccess yes' or 'selfaccess no'`);
					}
				} else if (subcommand2 === "lowestaccess") {
					if (subcommand3 === Player.Name.toLocaleLowerCase()) {
						subcommand3 = "self";
					}
					const level = (AccessLevel as any)[subcommand3] as AccessLevel;
					if (typeof level === "number") {
						respond(setPermissionMinAccess(subcommand as BCX_Permissions, level, sender) ? "Ok!" : COMMAND_GENERIC_ERROR);
					} else {
						respond(`Unknown AccessLevel '${subcommand3}';\n` +
							`expected one of: ${Player.Name}, clubowner, owner, lover, mistress, whitelist, friend, public`);
					}
				} else {
					respond(`Unknown setting '${subcommand2}'; expected 'selfaccess' or 'lowestaccess'`);
				}
			} else if (subcommand !== "help") {
				respond(`Unknown permission '${subcommand}'.\n` +
					`To get list of permissions use '${sender.isPlayer() ? "." : "!"}permission list'`
				);
			} else {
				respond(Command_fixExclamationMark(sender, `!permission usage:\n` +
					`!permission list [filter] - List all permissions and their current settings\n` +
					`!permission <name> selfaccess <yes|no> - Gives or revokes ${Player.Name}'s access to permission <name>\n` +
					`!permission <name> lowestaccess <${Player.Name}|clubowner|owner|lover|mistress|whitelist|friend|public> - Sets the lowest permitted role for the permission <name>`
				));
			}
		}, (argv, sender) => {
			const permissionNames = Object.keys(getPlayerPermissionSettings());
			if (argv.length <= 1) {
				const c = argv[0].toLocaleLowerCase();
				return ["list", ...permissionNames].filter(i => i.startsWith(c));
			}

			const subcommand = argv[0].toLocaleLowerCase();

			if (permissionNames.includes(subcommand)) {
				const subcommand2 = argv[1].toLocaleLowerCase();
				const subcommand3 = (argv[2] || "").toLocaleLowerCase();
				if (argv.length === 2) {
					return ["selfaccess", "lowestaccess"].filter(i => i.startsWith(subcommand2));
				} else if (argv.length === 3) {
					if (subcommand2 === "selfaccess") {
						return ["yes", "no"].filter(i => i.startsWith(subcommand3));
					} else if (subcommand2 === "lowestaccess") {
						return [Player.Name.toLocaleLowerCase(), "self", "clubowner", "owner", "lover", "mistress", "whitelist", "friend", "public"]
							.filter(i => i.startsWith(subcommand3));
					}
				}
			}

			return [];
		});
	}

	private setDefultPermissionsForPreset(preset: Preset) {
		for (const permission of permissions.values()) {
			permission.self = permission.defaults[preset][0];
			permission.min = permission.defaults[preset][1];
		}
	}

	applyPreset(preset: Preset) {
		this.setDefultPermissionsForPreset(preset);
		modStorage.permissions = permissionsMakeBundle();
	}

	load(preset: Preset) {
		this.setDefultPermissionsForPreset(preset);

		if (isObject(modStorage.permissions)) {
			const transitionDictionary: Record<string, BCX_Permissions> = {
				log_leaveMessage: "log_add_note"
			};
			for (const [k, v] of Object.entries(modStorage.permissions)) {
				if (transitionDictionary[k] !== undefined) {
					console.info(`BCX: Updating permission name "${k}"->"${transitionDictionary[k]}"`);
				}
				const perm = permissions.get(transitionDictionary[k] ?? k);
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

		const seen = new Set<number>();
		const test = (i: number): boolean => {
			if (typeof i !== "number" || i === Player.MemberNumber || seen.has(i))
				return false;
			seen.add(i);
			return true;
		};
		if (!Array.isArray(modStorage.owners)) {
			modStorage.owners = [];
		} else {
			modStorage.owners = modStorage.owners.filter(test);
		}
		if (!Array.isArray(modStorage.mistresses)) {
			modStorage.mistresses = [];
		} else {
			modStorage.mistresses = modStorage.mistresses.filter(test);
		}
	}

	reload(preset: Preset) {
		this.load(preset);
	}
}
