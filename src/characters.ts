import { VERSION } from "./config";
import { AccessLevel, getPermissionDataFromBundle, getPlayerPermissionSettings, PermissionData } from "./modules/authority";
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
