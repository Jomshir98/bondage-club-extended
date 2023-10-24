import { isNModClient, drawIcon, DrawImageEx, drawTypingIndicatorSpeechBubble } from "../utilsClub";
import { VERSION } from "../config";
import { hiddenMessageHandlers, sendHiddenMessage } from "./messaging";
import { BaseModule } from "./_BaseModule";
import { hookFunction, patchFunction } from "../patching";
import { getChatroomCharacter, getPlayerCharacter } from "../characters";
import { modStorage } from "./storage";
import cloneDeep from "lodash-es/cloneDeep";
import { defaultBCXEffects } from "../constants";
import { isObject } from "../utils";
import { icon_heart, icon_BCX_cross } from "../resources";
import { BCX_setTimeout } from "../BCXContext";
import { getCurrentSubscreen } from "./gui";
import { supporterSecret, supporterStatus, updateOtherSupporterStatus } from "./versionCheck";

export enum ChatRoomStatusManagerStatusType {
	None = "None",
	Typing = "Typing",
	Emote = "Emote",
	Whisper = "Whisper",
	DMS1 = "DMS1",
	DMS2 = "DMS2",
	Color = "Color",
	Wardrobe = "Wardrobe",
	Profile = "Profile",
	// NMod
	Action = "Action",
	Afk = "Afk",
}

const CharacterStatuses: WeakMap<Character, string> = new WeakMap();

class ChatRoomStatusManager {
	InputTimeoutMs = 3_000;

	// Required for NMod!
	StatusTypes = {};

	private InputElement: HTMLTextAreaElement | null = null;

	private InputTimeout: number | null = null;

	Status: ChatRoomStatusManagerStatusType = ChatRoomStatusManagerStatusType.None;
	private StatusTarget: number | null = null;

	// Status triggers
	DMS: 0 | 1 | 2 = 0;
	DMSUnlock = false;
	private TypingStatus: ChatRoomStatusManagerStatusType = ChatRoomStatusManagerStatusType.None;
	private WhisperTarget: number | null = null;

	GetCharacterStatus(C: Character): string | undefined {
		return C.ID === 0 ? ChatroomSM.Status : CharacterStatuses.get(C);
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

	GetStatus(): ChatRoomStatusManagerStatusType {
		if (this.DMS === 2) {
			this.DMSUnlock = true;
			return ChatRoomStatusManagerStatusType.DMS2;
		}
		if (this.DMS === 1 && this.DMSUnlock)
			return ChatRoomStatusManagerStatusType.DMS1;
		if (modStorage.screenIndicatorEnable) {
			if (CurrentScreen === "Appearance")
				return ChatRoomStatusManagerStatusType.Wardrobe;
			if (CurrentScreen === "OnlineProfile" || getCurrentSubscreen() != null)
				return ChatRoomStatusManagerStatusType.Profile;
			if (ItemColorItem != null)
				return ChatRoomStatusManagerStatusType.Color;
		}
		if (modStorage.typingIndicatorEnable)
			return this.TypingStatus;
		return ChatRoomStatusManagerStatusType.None;
	}

	UpdateStatus() {
		const oldStatus = this.Status;
		const oldStatusTarget = this.StatusTarget;
		this.Status = this.GetStatus();
		this.StatusTarget = this.Status === ChatRoomStatusManagerStatusType.Whisper ? this.WhisperTarget : null;
		if (this.Status !== oldStatus || this.StatusTarget !== oldStatusTarget) {
			if (this.StatusTarget !== oldStatusTarget && oldStatus !== ChatRoomStatusManagerStatusType.None) {
				this.SendUpdate(ChatRoomStatusManagerStatusType.None, oldStatusTarget);
				if (this.Status === ChatRoomStatusManagerStatusType.None)
					return;
			}
			this.SendUpdate(this.Status, this.StatusTarget);
		}
	}

	private SendUpdate(type: ChatRoomStatusManagerStatusType, target: number | null = null) {
		sendHiddenMessage("ChatRoomStatusEvent", { Type: type, Target: target }, target);
	}

	InputChange() {
		const value = this.InputElement?.value;
		if (typeof value === "string" && value.length > 1) {
			this.TypingStatus = ChatRoomStatusManagerStatusType.Typing;
			this.WhisperTarget = null;
			if (value.startsWith("*") || value.startsWith("/me ") || value.startsWith("/emote ") || value.startsWith("/action ")) {
				this.TypingStatus = ChatRoomStatusManagerStatusType.Emote;
			} else if (
				(value.startsWith("/") && !value.startsWith("//")) ||
				(value.startsWith(".") && !value.startsWith(".."))
			) {
				return this.InputEnd();
			} else if (ChatRoomTargetMemberNumber !== null) {
				this.TypingStatus = ChatRoomStatusManagerStatusType.Whisper;
				this.WhisperTarget = ChatRoomTargetMemberNumber;
			}
			if (this.InputTimeout !== null) {
				clearTimeout(this.InputTimeout);
			}
			this.InputTimeout = BCX_setTimeout(this.InputEnd.bind(this), this.InputTimeoutMs);
			this.UpdateStatus();
		} else {
			this.InputEnd();
		}
	}

	InputEnd() {
		if (this.InputTimeout !== null) {
			clearTimeout(this.InputTimeout);
			this.InputTimeout = null;
		}
		this.TypingStatus = ChatRoomStatusManagerStatusType.None;
		this.UpdateStatus();
	}

	unload() {
		this.DMS = 0;
		this.InputEnd();
	}
}

function DMSKeydown(ev: KeyboardEvent) {
	if (ev.altKey && ev.code === "NumpadEnter") {
		ev.preventDefault();
		ev.stopImmediatePropagation();
		if (document.activeElement instanceof HTMLElement) {
			document.activeElement.blur();
		}
		ChatroomSM.DMS = 2;
		ChatroomSM.UpdateStatus();
	} else if (ev.altKey && ChatroomSM.DMS === 0) {
		ChatroomSM.DMS = 1;
		ChatroomSM.UpdateStatus();
	}
}

function DMSKeyup(ev: KeyboardEvent) {
	if (ChatroomSM.DMS > 0 && (ev.key === "Alt" || ev.code === "NumpadEnter")) {
		ev.preventDefault();
		ev.stopImmediatePropagation();
		ChatroomSM.DMS = ev.altKey ? 1 : 0;
		ChatroomSM.UpdateStatus();
	}
}

function DMSBlur() {
	if (ChatroomSM.DMS > 0) {
		ChatroomSM.DMS = 0;
		ChatroomSM.UpdateStatus();
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

	private o_ChatRoomSM: any = null;

	load() {
		if (typeof modStorage.typingIndicatorEnable !== "boolean") {
			modStorage.typingIndicatorEnable = true;
		}
		if (typeof modStorage.typingIndicatorHideBC !== "boolean") {
			modStorage.typingIndicatorHideBC = true;
		}
		if (typeof modStorage.screenIndicatorEnable !== "boolean") {
			modStorage.screenIndicatorEnable = true;
		}

		hiddenMessageHandlers.set("hello", (sender, message: BCX_message_hello) => {
			const char = getChatroomCharacter(sender);
			if (!char) {
				console.warn(`BCX: Hello from character not found in room`, sender);
				return;
			}
			if (
				typeof message?.version !== "string" ||
				(message.supporterStatus !== undefined && typeof message.supporterStatus !== "string") ||
				(message.supporterSecret !== undefined && typeof message.supporterSecret !== "string")
			) {
				console.warn(`BCX: Invalid hello`, sender, message);
				return;
			}
			// if (char.BCXVersion !== message.version) {
			// 	console.log(`BCX: ${char.Character.Name} (${char.Character.MemberNumber}) uses BCX version ${message.version}`);
			// }
			char.BCXVersion = message.version;
			// Apply effects
			const effects: Partial<BCX_effects> = isObject(message.effects) ? message.effects : {};
			char.Effects = cloneDeep(defaultBCXEffects);
			if (Array.isArray(effects.Effect) && effects.Effect.every(i => typeof i === "string")) {
				char.Effects.Effect = effects.Effect;
			}
			CharacterRefresh(char.Character, false);
			if (typeof message.typingIndicatorEnable === "boolean") {
				char.typingIndicatorEnable = message.typingIndicatorEnable;
			}
			if (typeof message.screenIndicatorEnable === "boolean") {
				char.screenIndicatorEnable = message.screenIndicatorEnable;
			}
			// Supporter status
			updateOtherSupporterStatus(sender, message.supporterStatus, message.supporterSecret);
			// Send announcement, if requested
			// eslint-disable-next-line @typescript-eslint/no-unnecessary-boolean-literal-compare
			if (message.request === true) {
				announceSelf(false);
			}
		});

		hiddenMessageHandlers.set("goodbye", (sender) => {
			const char = getChatroomCharacter(sender);
			if (char) {
				char.BCXVersion = null;
				char.Effects = cloneDeep(defaultBCXEffects);
				CharacterRefresh(char.Character, false);
			}
		});

		hookFunction("ChatRoomMessage", 10, (args, next) => {
			const data = args[0];

			if (data?.Type === "Action" && data.Content === "ServerEnter") {
				announceSelf(false);
			}

			return next(args);
		});

		patchFunction("ChatRoomDrawCharacterOverlay", {
			'DrawImageResize("Icons/Small/Admin.png", CharX + 390 * Zoom, CharY, 40 * Zoom, 40 * Zoom);': 'DrawImageResize("Icons/Small/Admin.png", CharX + 400 * Zoom, CharY, 40 * Zoom, 40 * Zoom);',
		});

		hookFunction("ChatRoomDrawCharacterOverlay", 0, (args, next) => {
			next(args);

			const [C, CharX, CharY, Zoom] = args;
			const Char = getChatroomCharacter(C.MemberNumber!);
			const Friend = C.ID === 0 || (Player.FriendList ?? []).includes(C.MemberNumber!);
			const Ghosted = (Player.GhostList ?? []).includes(C.MemberNumber!);
			if (Char?.BCXVersion &&
				!Ghosted &&
				ChatRoomHideIconState === 0 &&
				!modStorage.chatroomIconHidden
			) {
				if (Friend) {
					drawIcon(MainCanvas, icon_heart, CharX + 375 * Zoom, CharY + 5, 30 * Zoom, 30 * Zoom, 50, 0.7, 4, "#6e6eff");
				} else {
					drawIcon(MainCanvas, icon_BCX_cross, CharX + 375 * Zoom, CharY + 5, 30 * Zoom, 30 * Zoom, 50, 0.5, 3, "#6e6eff");
				}
			}
		});

		const NMod = isNModClient();

		if (!NMod) {
			hookFunction("ChatRoomCreateElement", 0, (args, next) => {
				next(args);
				ChatroomSM.SetInputElement(document.getElementById("InputChat") as HTMLTextAreaElement);
			});
		}

		hookFunction("ChatRoomDrawCharacterOverlay", 0, (args, next) => {
			next(args);

			if (ChatRoomHideIconState >= 2)
				return;
			const [C, CharX, CharY, Zoom] = args;
			switch (ChatroomSM.GetCharacterStatus(C)) {
				case ChatRoomStatusManagerStatusType.Typing:
					drawTypingIndicatorSpeechBubble(MainCanvas, CharX + 375 * Zoom, CharY + 54 * Zoom, 50 * Zoom, 48 * Zoom, 1);
					break;
				case ChatRoomStatusManagerStatusType.Whisper:
					drawTypingIndicatorSpeechBubble(MainCanvas, CharX + 375 * Zoom, CharY + 54 * Zoom, 50 * Zoom, 48 * Zoom, 0.5);
					break;
				case ChatRoomStatusManagerStatusType.Emote:
					drawTypingIndicatorSpeechBubble(MainCanvas, CharX + 375 * Zoom, CharY + 54 * Zoom, 50 * Zoom, 48 * Zoom, 1, true);
					break;
				case ChatRoomStatusManagerStatusType.DMS1:
					DrawRect(CharX + 380 * Zoom, CharY + 53 * Zoom, 40 * Zoom, 40 * Zoom, "White");
					break;
				case ChatRoomStatusManagerStatusType.DMS2:
					DrawRect(CharX + 380 * Zoom, CharY + 53 * Zoom, 40 * Zoom, 40 * Zoom, "White");
					DrawImageEx("Icons/Import.png", CharX + 375 * Zoom, CharY + 50 * Zoom, {
						Width: 50 * Zoom,
						Height: 50 * Zoom,
					});
					break;
				case ChatRoomStatusManagerStatusType.Color:
					DrawImageEx("Assets/Female3DCG/Emoticon/Spectator/Icon.png", CharX + 375 * Zoom, CharY + 50 * Zoom, {
						Width: 50 * Zoom,
						Height: 50 * Zoom,
					});
					DrawImageEx("Icons/ColorPick.png", CharX + 380 * Zoom, CharY + 51 * Zoom, {
						Width: 40 * Zoom,
						Height: 40 * Zoom,
					});
					break;
				case ChatRoomStatusManagerStatusType.Wardrobe:
					DrawImageEx("Assets/Female3DCG/Emoticon/Wardrobe/Icon.png", CharX + 375 * Zoom, CharY + 50 * Zoom, {
						Width: 50 * Zoom,
						Height: 50 * Zoom,
					});
					break;
				case ChatRoomStatusManagerStatusType.Profile:
					DrawImageEx("Assets/Female3DCG/Emoticon/Read/Icon.png", CharX + 375 * Zoom, CharY + 50 * Zoom, {
						Width: 50 * Zoom,
						Height: 50 * Zoom,
					});
					break;
			}
		});

		window.addEventListener("keydown", DMSKeydown);
		window.addEventListener("keyup", DMSKeyup);
		window.addEventListener("blur", DMSBlur);

		hookFunction("ChatRoomStatusUpdate", 10, (args, next) => {
			if (args[0] === "Talk") {
				const text = ElementValue("InputChat");
				if (text && text.startsWith(".") && !text.startsWith("..")) {
					args[0] = null;
				}
			}
			return next(args);
		});
		hookFunction("DrawStatus", 10, (args, next) => {
			const C = args[0];
			const char = getChatroomCharacter(C.MemberNumber!);
			if (char?.BCXVersion != null &&
				char.typingIndicatorEnable &&
				modStorage.typingIndicatorHideBC &&
				C.Status === "Talk"
			) {
				return;
			}
			if (char?.BCXVersion != null &&
				char.screenIndicatorEnable &&
				modStorage.typingIndicatorHideBC &&
				C.Status === "Wardrobe"
			) {
				return;
			}
			return next(args);
		});

		hookFunction("ChatRoomSendChat", 0, (args, next) => {
			next(args);
			ChatroomSM.InputEnd();
		});

		hookFunction("ChatRoomClearAllElements", 0, (args, next) => {
			next(args);
			ChatroomSM.SetInputElement(null);
		});

		// Screen indicator
		hookFunction("CommonSetScreen", 0, (args, next) => {
			next(args);
			ChatroomSM.UpdateStatus();
		});
		hookFunction("ItemColorStateBuild", 0, (args, next) => {
			next(args);
			ChatroomSM.UpdateStatus();
		});
		hookFunction("ItemColorReset", 0, (args, next) => {
			next(args);
			ChatroomSM.UpdateStatus();
		});
		// Suppress BC wardrobe indicator if BCX one is active
		hookFunction("ServerSend", 5, (args: any, next) => {
			if (modStorage.screenIndicatorEnable &&
				args[0] === "ChatRoomCharacterExpressionUpdate" &&
				isObject(args[1]) &&
				args[1].Group === "Emoticon" &&
				args[1].Name === "Wardrobe"
			)
				return;
			next(args);
		});

		hookFunction("ChatSearchLoad", 5, (args, next) => {
			next(args);
			const field = document.getElementById("InputSearch") as HTMLInputElement | undefined;
			if (field && modStorage.roomSearchAutoFill && ChatSearchMode === "") {
				field.value = modStorage.roomSearchAutoFill;
			}
		});

		hiddenMessageHandlers.set("ChatRoomStatusEvent", (src, data: any) => {
			for (const char of ChatRoomCharacter) {
				if (char.MemberNumber === src) {
					CharacterStatuses.set(char, data.Target == null || data.Target === Player.MemberNumber ? data.Type : "None");
				}
			}
		});
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
		sendHiddenMessage("goodbye", undefined);

		window.removeEventListener("keydown", DMSKeydown);
		window.removeEventListener("keyup", DMSKeyup);
		window.removeEventListener("blur", DMSBlur);
	}
}

export function announceSelf(request: boolean = false) {
	const player = getPlayerCharacter();
	const msg: BCX_message_hello = {
		version: VERSION,
		request,
		effects: player.Effects,
		typingIndicatorEnable: modStorage.typingIndicatorEnable,
		screenIndicatorEnable: modStorage.screenIndicatorEnable,
	};
	if (supporterStatus && supporterSecret && !modStorage.supporterHidden) {
		msg.supporterStatus = supporterStatus;
		msg.supporterSecret = supporterSecret;
	}
	sendHiddenMessage("hello", msg);
}
