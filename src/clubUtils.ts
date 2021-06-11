import { Command_selectCharacter, Command_selectCharacterAutocomplete, Command_selectWornItem, Command_selectWornItemAutocomplete, registerCommandParsed } from "./commands";
import { BaseModule } from "./moduleManager";

export function InfoBeep(msg: string) {
	console.log(`BCX msg: ${msg}`);
	ServerBeep = {
		Timer: CurrentTime + 3000,
		Message: msg
	};
}

export function ChatRoomActionMessage(msg: string) {
	if (!msg) return;
	ServerSend("ChatRoomChat", {
		Content: "Beep",
		Type: "Action",
		Dictionary: [
			{ Tag: "Beep", Text: "msg" },
			{ Tag: "Biep", Text: "msg" },
			{ Tag: "Sonner", Text: "msg" },
			{ Tag: "msg", Text: msg }
		]
	});
}

export function ChatRoomSendLocal(msg: string | Node, timeout?: number, sender?: number) {
	// Adds the message and scrolls down unless the user has scrolled up
	const div = document.createElement("div");
	div.setAttribute("class", "ChatMessage ChatMessageLocalMessage");
	div.setAttribute("data-time", ChatRoomCurrentTime());
	div.setAttribute('data-sender', `${sender ?? Player.MemberNumber ?? 0}`);

	if (typeof msg === 'string')
		div.innerText = msg;
	else
		div.appendChild(msg);

	if (timeout) setTimeout(() => div.remove(), timeout);

	// Returns the focus on the chat box
	const Refocus = document.activeElement?.id === "InputChat";
	const ShouldScrollDown = ElementIsScrolledToEnd("TextAreaChatLog");
	const ChatLog = document.getElementById("TextAreaChatLog");
	if (ChatLog != null) {
		ChatLog.appendChild(div);
		if (ShouldScrollDown) ElementScrollToEnd("TextAreaChatLog");
		if (Refocus) ElementFocus("InputChat");
	}
}

export function detectOtherMods() {
	const w = window as any;
	return {
		NMod: typeof w.ChatRoomDrawFriendList === "function",
		BondageClubTools: ServerSocket.listeners("ChatRoomMessage").some(i => i.toString().includes("window.postMessage"))
	};
}

/**
 * Draws an image on canvas, applying all options
 * @param {string | HTMLImageElement | HTMLCanvasElement} Source - URL of image or image itself
 * @param {number} X - Position of the image on the X axis
 * @param {number} Y - Position of the image on the Y axis
 * @param {object} [options] - any extra options, optional
 * @param {CanvasRenderingContext2D} [options.Canvas] - Canvas on which to draw the image, defaults to `MainCanvas`
 * @param {number} [options.Alpha] - transparency between 0-1
 * @param {[number, number, number, number]} [options.SourcePos] - Area in original image to draw in format `[left, top, width, height]`
 * @param {number} [options.Width] - Width of the drawn image, defaults to width of original image
 * @param {number} [options.Height] - Height of the drawn image, defaults to height of original image
 * @param {boolean} [options.Invert=false] - If image should be flipped vertically
 * @param {boolean} [options.Mirror=false] - If image should be flipped horizontally
 * @param {number} [options.Zoom=1] - Zoom factor
 * @returns {boolean} - whether the image was complete or not
 */
export function DrawImageEx(
	Source: string | HTMLImageElement | HTMLCanvasElement,
	X: number,
	Y: number,
	{
		Canvas = MainCanvas,
		Alpha = 1,
		SourcePos,
		Width,
		Height,
		Invert = false,
		Mirror = false,
		Zoom = 1
	}: {
		Canvas?: CanvasRenderingContext2D;
		Alpha?: number;
		SourcePos?: [number, number, number, number];
		Width?: number;
		Height?: number;
		Invert?: boolean;
		Mirror?: boolean;
		Zoom?: number;
	}
) {
	if (typeof Source === "string") {
		Source = DrawGetImage(Source);
		if (!Source.complete) return false;
		if (!Source.naturalWidth) return true;
	}

	const sizeChanged = Width != null || Height != null;
	if (Width == null) {
		Width = SourcePos ? SourcePos[2] : Source.width;
	}
	if (Height == null) {
		Height = SourcePos ? SourcePos[3] : Source.height;
	}

	Canvas.save();

	Canvas.globalCompositeOperation = "source-over";
	Canvas.globalAlpha = Alpha;
	Canvas.translate(X, Y);

	if (Zoom !== 1) {
		Canvas.scale(Zoom, Zoom);
	}

	if (Invert) {
		Canvas.transform(1, 0, 0, -1, 0, Height);
	}

	if (Mirror) {
		Canvas.transform(-1, 0, 0, 1, Width, 0);
	}

	if (SourcePos) {
		Canvas.drawImage(Source, SourcePos[0], SourcePos[1], SourcePos[2], SourcePos[3], 0, 0, Width, Height);
	} else if (sizeChanged) {
		Canvas.drawImage(Source, 0, 0, Width, Height);
	} else {
		Canvas.drawImage(Source, 0, 0);
	}

	Canvas.restore();
	return true;
}

export function isCloth(item: Item | Asset, allowCosplay: boolean = false): boolean {
	const asset = (item as any).Asset ? (item as Item).Asset : item as Asset;
	return asset.Group.Category === "Appearance" && asset.Group.AllowNone && asset.Group.Clothing && (allowCosplay || !asset.Group.BodyCosplay);
}

export function isBind(item: Item | Asset): boolean {
	const asset = (item as any).Asset ? (item as Item).Asset : item as Asset;
	if (asset.Group.Category !== "Item" || asset.Group.BodyCosplay) return false;
	return !["ItemNeck", "ItemNeckAccessories", "ItemNeckRestraints"].includes(asset.Group.Name);
}

export function InvisibilityEarbuds() {
	if (InventoryGet(Player, "ItemEars")?.Asset.Name === "BluetoothEarbuds") {
		InventoryRemove(Player, "ItemEars");
	} else {
		const asset = Asset.find(A => A.Name === "BluetoothEarbuds");
		if (!asset) return;
		Player.Appearance = Player.Appearance.filter(A => A.Asset.Group.Name !== "ItemEars");
		Player.Appearance.push({
			Asset: asset,
			Color: "Default",
			Difficulty: -100,
			Property: {
				Type: "Light",
				Effect: [],
				Hide: AssetGroup.map(A => A.Name).filter(A => A !== "ItemEars")
			}
		});
		CharacterRefresh(Player);
	}
	ChatRoomCharacterUpdate(Player);
}

export class ModuleClubUtils extends BaseModule {
	load() {
		registerCommandParsed("colour", "<source> <item> <target> - Copies color of certain item from source character to target character",
			(argv) => {
				if (argv.length !== 3) {
					ChatRoomSendLocal(`Expected three arguments: <source> <item> <target>`);
					return false;
				}
				const source = Command_selectCharacter(argv[0]);
				if (typeof source === "string") {
					ChatRoomSendLocal(source);
					return false;
				}
				const target = Command_selectCharacter(argv[2]);
				if (typeof target === "string") {
					ChatRoomSendLocal(target);
					return false;
				}
				const item = Command_selectWornItem(source, argv[1]);
				if (typeof item === "string") {
					ChatRoomSendLocal(item);
					return false;
				}
				const targetItem = target.Character.Appearance.find(A => A.Asset === item.Asset);
				if (!targetItem) {
					ChatRoomSendLocal(`Target must be wearing the same item`);
					return false;
				}
				targetItem.Color = Array.isArray(item.Color) ? item.Color.slice() : item.Color;
				CharacterRefresh(target.Character);
				ChatRoomCharacterUpdate(target.Character);
				return true;
			},
			(argv) => {
				if (argv.length === 1) {
					return Command_selectCharacterAutocomplete(argv[0]);
				} else if (argv.length === 2) {
					const source = Command_selectCharacter(argv[0]);
					if (typeof source !== "string") {
						return Command_selectWornItemAutocomplete(source, argv[1]);
					}
				} else if (argv.length === 3) {
					return Command_selectCharacterAutocomplete(argv[2]);
				}
				return [];
			}
		);
		registerCommandParsed("allowactivities", "<character> <item> - Modifies item to not block activities",
			(argv) => {
				if (argv.length !== 2) {
					ChatRoomSendLocal(`Expected two arguments: <charcater> <item>`);
					return false;
				}
				const char = Command_selectCharacter(argv[0]);
				if (typeof char === "string") {
					ChatRoomSendLocal(char);
					return false;
				}
				const item = Command_selectWornItem(char, argv[1]);
				if (typeof item === "string") {
					ChatRoomSendLocal(item);
					return false;
				}
				if (!item.Property) {
					item.Property = {};
				}
				item.Property.AllowActivityOn = AssetGroup.map(A => A.Name);
				CharacterRefresh(char.Character);
				ChatRoomCharacterUpdate(char.Character);
				return true;
			},
			(argv) => {
				if (argv.length === 1) {
					return Command_selectCharacterAutocomplete(argv[0]);
				} else if (argv.length === 2) {
					const source = Command_selectCharacter(argv[0]);
					if (typeof source !== "string") {
						return Command_selectWornItemAutocomplete(source, argv[1]);
					}
				}
				return [];
			}
		);
	}
}
