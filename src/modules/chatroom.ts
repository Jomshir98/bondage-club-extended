import { detectOtherMods, DrawImageEx } from "../utilsClub";
import { VERSION } from "../config";
import { hiddenMessageHandlers, sendHiddenMessage } from "./messaging";
import { BaseModule } from "../moduleManager";
import { hookFunction, patchFunction } from "../patching";
import { icon_Emote, icon_PurpleHeart, icon_Typing } from "../resources";

export class ChatroomCharacter {
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
}

const currentRoomCharacters: ChatroomCharacter[] = [];

export function getChatroomCharacter(memberNumber: number): ChatroomCharacter | null {
	if (typeof memberNumber !== "number") return null;
	let character = currentRoomCharacters.find(c => c.Character.MemberNumber === memberNumber);
	if (!character) {
		const BCCharacter = Player.MemberNumber === memberNumber ? Player : ChatRoomCharacter.find(c => c.MemberNumber === memberNumber);
		if (!BCCharacter) {
			return null;
		}
		character = new ChatroomCharacter(BCCharacter);
		currentRoomCharacters.push(character);
	}
	return character;
}

export function getAllCharactersInRoom(): ChatroomCharacter[] {
	return ChatRoomCharacter.map(c => getChatroomCharacter(c.MemberNumber!)).filter(Boolean) as ChatroomCharacter[];
}

class ChatRoomStatusManager {
	InputTimeoutMs = 3_000;

	StatusTypes = {
		None: "None",
		Typing: "Typing",
		Emote: "Emote",
		Whisper: "Whisper",
		// NMod
		Action: "Action",
		Afk: 'Afk'
	};

	private InputElement: HTMLTextAreaElement | null = null;

	private InputTimeout: number | null = null;

	Status: string;

	constructor() {
		this.Status = this.StatusTypes.None;
	}

	SetInputElement(elem: HTMLTextAreaElement | null) {
		if (this.InputElement !== elem) {
			this.InputElement = elem;
			if (elem !== null) {
				elem.addEventListener("blur", this.InputEnd.bind(this));
				elem.addEventListener("input", this.InputChange.bind(this));
			}
		}
	}

	SetStatus(type: string, target: number | null = null) {
		if (type !== this.Status) {
			if (target !== null && this.Status === this.StatusTypes.Whisper) {
				this.SetStatus(this.StatusTypes.None, null);
			}
			this.Status = type;
			sendHiddenMessage("ChatRoomStatusEvent", { Type: type, Target: target }, target);
			const { NMod } = detectOtherMods();
			if (NMod) ServerSend("ChatRoomStatusEvent", { Type: type, Target: target });
		}
	}

	InputChange() {
		const value = this.InputElement?.value;
		if (typeof value === "string" && value.length > 1) {
			let type = this.StatusTypes.Typing;
			let target = null;
			if (value.startsWith("*") || value.startsWith("/me ") || value.startsWith("/emote ") || value.startsWith("/action ")) {
				type = this.StatusTypes.Emote;
			} else if (value.startsWith("/") || value.startsWith(".")) {
				return this.InputEnd();
			} else if (ChatRoomTargetMemberNumber !== null) {
				type = this.StatusTypes.Whisper;
				target = ChatRoomTargetMemberNumber;
			}
			if (this.InputTimeout !== null) {
				clearTimeout(this.InputTimeout);
			}
			this.InputTimeout = setTimeout(this.InputEnd.bind(this), this.InputTimeoutMs);
			this.SetStatus(type, target);
		} else {
			this.InputEnd();
		}
	}

	InputEnd() {
		if (this.InputTimeout !== null) {
			clearTimeout(this.InputTimeout);
			this.InputTimeout = null;
		}
		this.SetStatus(this.StatusTypes.None);
	}

	unload() {
		this.InputEnd();
	}
}

export let ChatroomSM: ChatRoomStatusManager;

function queryAnnounce() {
	announceSelf(true);
}

export class ModuleChatroom extends BaseModule {
	init() {
		ChatroomSM = new ChatRoomStatusManager();
	}

	private o_ChatRoomSM: any | null = null;

	load() {
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

		hiddenMessageHandlers.set("goodbye", (sender) => {
			const char = getChatroomCharacter(sender);
			if (char) {
				char.BCXVersion = null;
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
			patchFunction("ChatRoomDrawCharacterOverlay", {
				'DrawImageResize("Icons/Small/FriendList.png", CharX + 375 * Zoom, CharY, 50 * Zoom, 50 * Zoom);': ""
			});
			hookFunction("ChatRoomDrawCharacterOverlay", 0, (args, next) => {
				next(args);

				const [C, CharX, CharY, Zoom] = args as [Character, number, number, number];
				const Char = getChatroomCharacter(C.MemberNumber!);
				const Friend = (Player.FriendList ?? []).includes(C.MemberNumber!);
				if (Char?.BCXVersion) {
					DrawImageEx(icon_PurpleHeart, CharX + 375 * Zoom, CharY, {
						Width: 50 * Zoom,
						Height: 50 * Zoom,
						Alpha: C.ID === 0 || Friend ? 1 : 0.5
					});
				} else if (Friend) {
					DrawImageEx("Icons/Small/FriendList.png", CharX + 375 * Zoom, CharY, {
						Width: 50 * Zoom,
						Height: 50 * Zoom
					});
				}

				switch (C.ID === 0 ? ChatroomSM.Status : C.Status) {
					case ChatroomSM.StatusTypes.Typing:
						DrawImageEx(icon_Typing, CharX + 375 * Zoom, CharY + 50 * Zoom, {
							Width: 50 * Zoom,
							Height: 50 * Zoom
						});
						break;
					case ChatroomSM.StatusTypes.Whisper:
						DrawImageEx(icon_Typing, CharX + 375 * Zoom, CharY + 50 * Zoom, {
							Width: 50 * Zoom,
							Height: 50 * Zoom,
							Alpha: 0.5
						});
						break;
					case ChatroomSM.StatusTypes.Emote:
						DrawImageEx(icon_Emote, CharX + 375 * Zoom, CharY + 50 * Zoom, {
							Width: 50 * Zoom,
							Height: 50 * Zoom
						});
						break;
				}
			});
		}

		hookFunction("ChatRoomSendChat", 0, (args, next) => {
			next(args);
			ChatroomSM.InputEnd();
		});

		hookFunction("ChatRoomCreateElement", 0, (args, next) => {
			next(args);
			ChatroomSM.SetInputElement(document.getElementById("InputChat") as HTMLTextAreaElement);
		});

		hookFunction("ChatRoomClearAllElements", 0, (args, next) => {
			next(args);
			ChatroomSM.SetInputElement(null);
		});

		hiddenMessageHandlers.set("ChatRoomStatusEvent", (src, data: any) => {
			for (const char of ChatRoomCharacter) {
				if (char.MemberNumber === src) {
					char.Status = data.Target == null || data.Target === Player.MemberNumber ? data.Type : "None";
				}
			}
		});

		if (NMod) {
			this.o_ChatRoomSM = (window as any).ChatRoomSM;
			(window as any).ChatRoomSM = ChatroomSM;
			ServerSocket.on("ChatRoomMessageSync", queryAnnounce);
		}
	}

	run() {
		if (document.getElementById("InputChat") != null) {
			ChatroomSM.SetInputElement(document.getElementById("InputChat") as HTMLTextAreaElement);
		}
		queryAnnounce();
	}

	unload() {
		ChatroomSM.unload();
		if (this.o_ChatRoomSM) {
			(window as any).ChatRoomSM = this.o_ChatRoomSM;
		}
		ServerSocket.off("ChatRoomMessageSync", queryAnnounce);
		sendHiddenMessage("goodbye", undefined);
	}
}

export function announceSelf(request: boolean = false) {
	sendHiddenMessage("hello", {
		version: VERSION,
		request
	});
}
