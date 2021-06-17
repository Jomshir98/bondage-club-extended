import { VERSION } from "./config";
import { getPlayerPermissionSettings, PermissionData } from "./modules/authority";

export class ChatroomCharacter {
	isPlayer(): this is PlayerCharacter {
		return false;
	}

	BCXVersion: string | null = null;
	Character: Character;

	get MemberNumber(): number | null {
		return this.Character.MemberNumber ?? null;
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
		// TODO
		return Promise.reject("Not implemented");
	}
}

export class PlayerCharacter extends ChatroomCharacter {
	override isPlayer(): this is PlayerCharacter {
		return true;
	}

	override getPermissions(): Promise<PermissionData> {
		return Promise.resolve(getPlayerPermissionSettings());
	}
}

const currentRoomCharacters: ChatroomCharacter[] = [];

export function getChatroomCharacter(memberNumber: number): ChatroomCharacter | null {
	if (typeof memberNumber !== "number")
		return null;
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
