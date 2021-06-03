import { detectOtherMods, DrawImageEx } from "./clubUtils";
import { VERSION } from "./config";
import { hiddenMessageHandlers, sendHiddenMessage } from "./messaging";
import { hookFunction, patchFunction } from "./patching";
import { icon_PurpleHeart } from "./resources";

class ChatroomCharacter {
	BCXVersion: string | null = null;
	Character: Character;

	constructor(character: Character) {
		this.Character = character;
		if (character.ID === 0) {
			this.BCXVersion = VERSION;
		}
		console.debug(`BCX: Loaded character ${character.Name} (${character.MemberNumber})`);
	}
}

const currentRoomCharacters: ChatroomCharacter[] = [];

function getChatroomCharacter(memberNumber: number): ChatroomCharacter | null {
	if (typeof memberNumber !== "number") return null;
	let character = currentRoomCharacters.find(c => c.Character.MemberNumber === memberNumber);
	if (!character) {
		const BCCharacter = ChatRoomCharacter.find(c => c.MemberNumber === memberNumber);
		if (!BCCharacter) {
			return null;
		}
		character = new ChatroomCharacter(BCCharacter);
		currentRoomCharacters.push(character);
	}
	return character;
}

export function init_chatroom() {
	hiddenMessageHandlers.set("hello", (sender, message: any) => {
		const char = getChatroomCharacter(sender);
		if (!char) {
			console.warn(`BCX: Hello from character not found in room`, sender);
			return;
		}
		if (typeof message?.version !== "string") {
			console.warn(`BCX: Invalid hello`, sender, message);
			return;
		}
		if (char.BCXVersion !== message.version) {
			console.log(`BCX: ${char.Character.Name} (${char.Character.MemberNumber}) uses BCX version ${message.version}`);
		}
		char.BCXVersion = message.version;
		if (message.request === true) {
			announceSelf(false);
		}
	});

	hookFunction("ChatRoomMessage", 10, (args, next) => {
		const data = args[0];

		if (data?.Type === "Action" && data.Content === "ServerEnter") {
			announceSelf(false);
		}

		return next(args);
	});

	const { NMod } = detectOtherMods();

	patchFunction("ChatRoomDrawCharacterOverlay", NMod ? {} : {
		'DrawImageResize("Icons/Small/FriendList.png", CharX + 375 * Zoom, CharY, 50 * Zoom, 50 * Zoom);': ""
	});

	if (NMod) {
		hookFunction("ChatRoomDrawFriendList", 0, (args, next) => {
			const [C, Zoom, CharX, CharY] = args as [Character, number, number, number];
			const Char = getChatroomCharacter(C.MemberNumber!);
			const Friend = (Player.FriendList ?? []).includes(C.MemberNumber!);
			if (Char?.BCXVersion) {
				DrawImageEx(icon_PurpleHeart, CharX + 375 * Zoom, CharY, {
					Width: 50 * Zoom,
					Height: 50 * Zoom,
					Alpha: C.ID === 0 || Friend ? 1 : 0.5
				});
			} else {
				next(args);
			}
		});
	} else {
		hookFunction("ChatRoomDrawCharacterOverlay", 0, (args, next) => {
			next(args);

			const [C, CharX, CharY, Zoom] = args as [Character, number, number, number];
			const Char = getChatroomCharacter(C.MemberNumber!);
			const Friend = (Player.FriendList ?? []).includes(C.MemberNumber!);
			if (Char?.BCXVersion) {
				DrawImageEx(icon_PurpleHeart, CharX + 375 * Zoom, CharY, {
					Width: 50 * Zoom,
					Height: 50 * Zoom,
					Alpha:  C.ID === 0 || Friend ? 1 : 0.5
				});
			} else if (Friend) {
				DrawImageEx("Icons/Small/FriendList.png", CharX + 375 * Zoom, CharY, {
					Width: 50 * Zoom,
					Height: 50 * Zoom
				});
			}
		});
	}

	announceSelf(true);
}

export function announceSelf(request: boolean = false) {
	sendHiddenMessage("hello", {
		version: VERSION,
		request
	});
}
