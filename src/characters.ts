import { VERSION } from "./config";
import { AccessLevel, getPermissionDataFromBundle, getPlayerPermissionSettings, PermissionData, setPermissionMinAccess, setPermissionSelfAccess } from "./modules/authority";
import { sendQuery } from "./modules/messaging";
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
}

const currentRoomCharacters: ChatroomCharacter[] = [];

function cleanOldCharacters(): void {
	for(let i = currentRoomCharacters.length - 1; i >= 0; i--) {
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
