import { icon_Typing_star, icon_Typing_base, icon_Typing_dot } from "./resources";
import { BCX_setTimeout } from "./BCXContext";
import { getChatroomCharacter } from "./characters";
import { RelationshipsGetNickname } from "./modules/relationships";

import bcModSDK from "bondage-club-mod-sdk";

const GROUP_NAME_OVERRIDES: Record<string, string> = {
	"ItemNeckAccessories": "Collar Addon",
	"ItemNeckRestraints": "Collar Restraint",
	"ItemNipplesPiercings": "Nipple Piercing",
	"ItemHood": "Hood",
	"ItemMisc": "Miscellaneous",
	"ItemDevices": "Devices",
	"ItemHoodAddon": "Hood Addon",
	"ItemAddon": "General Addon",
	"ItemLegs": "Upper Leg",
	"ItemFeet": "Lower Leg",
	"ItemBoots": "Feet",
	"ItemMouth": "Mouth (1)",
	"ItemMouth2": "Mouth (2)",
	"ItemMouth3": "Mouth (3)",
	"HairAccessory2": "Ears Accessory",
	"Height": "Character Height",
	"Mouth": "Mouth Style",
	"Pussy": "Pussy Style"
};

export let allowMode: boolean = false;
export let developmentMode: boolean = false;

export function setAllowMode(allow: boolean): boolean {
	if (allow) {
		console.warn("Cheats enabled; please be careful not to break things");
	} else {
		if (!setDevelopmentMode(false))
			return false;
		console.info("Cheats disabled");
	}
	allowMode = allow;
	return true;
}

export function setDevelopmentMode(devel: boolean): boolean {
	if (devel) {
		if (!setAllowMode(true)) {
			console.info("To use developer mode, cheats must be enabled first!");
			return false;
		}
		(window as any).BCX_Devel = true;
		AssetGroup.forEach(G => G.Description = G.Name);
		Asset.forEach(A => A.Description = A.Group.Name + ":" + A.Name);
		BackgroundSelectionAll.forEach(B => {
			B.Description = B.Name;
			B.Low = B.Description.toLowerCase();
		});
		console.warn("Developer mode enabled");
	} else {
		delete (window as any).BCX_Devel;
		AssetLoadDescription("Female3DCG");
		BackgroundSelectionAll.forEach(B => {
			B.Description = DialogFindPlayer(B.Name);
			B.Low = B.Description.toLowerCase();
		});
		console.info("Developer mode disabled");
	}
	developmentMode = devel;
	return true;
}

export let BCXSource: string | null = null;
export let BCXSourceExternal: boolean = false;

export function init_findBCXSource(): void {
	for (const elem of Array.from(document.getElementsByTagName("script"))) {
		const match = /^(https:\/\/[^?/]+\/([^?]+)?|http:\/\/localhost(?::[0-9]+)?\/)bcx.js($|\?)/i.exec(elem.src);
		if (match) {
			BCXSource = match[1];
			return;
		}
	}
	const externalSrc = (window as any).BCX_SOURCE as unknown;
	if (typeof externalSrc === "string") {
		BCXSourceExternal = true;
		const match = /^(https:\/\/[^?/]+\/(?:[^?]+?)?)(?:bcx.js)?(?:$|\?)/i.exec(externalSrc);
		if (match) {
			BCXSource = match[1];
			console.log("BCX: External BCX_SOURCE supplied, using it");
			return;
		}
		console.warn("BCX: External BCX_SOURCE supplied, but malformed, ignoring", externalSrc);
	}
	const msg = "BCX: Failed to find BCX's source! Some functions will not work properly. Are you using the official version?";
	console.error(msg);
	alert(msg);
}

export function getVisibleGroupName(group: AssetGroup): string {
	return developmentMode ? group.Name : (GROUP_NAME_OVERRIDES[group.Name] ?? group.Description);
}

export function InfoBeep(msg: string, timer: number = 3000) {
	ServerBeep = {
		Timer: CommonTime() + timer,
		Message: msg
	};
}

export function ChatRoomActionMessage(msg: string, target: null | number = null, dictionary: ChatMessageDictionaryEntry[] = []) {
	if (!msg) return;
	ServerSend("ChatRoomChat", {
		Content: "Beep",
		Type: "Action",
		Target: target,
		Dictionary: [
			{ Tag: "Beep", Text: "msg" },
			{ Tag: "Biep", Text: "msg" },
			{ Tag: "Sonner", Text: "msg" },
			{ Tag: "发送私聊", Text: "msg" },
			{ Tag: "msg", Text: msg },
			...dictionary
		]
	});
}

export function ChatRoomSendLocal(msg: string | Node, timeout?: number, sender?: number): HTMLDivElement | null {
	// Adds the message and scrolls down unless the user has scrolled up
	const div = document.createElement("div");
	div.setAttribute("class", "ChatMessage ChatMessageLocalMessage");
	div.setAttribute("data-time", ChatRoomCurrentTime());
	div.setAttribute("data-sender", `${sender ?? Player.MemberNumber ?? 0}`);
	div.style.background = "#6e6eff54";
	div.style.margin = "0.15em 0";

	if (typeof msg === "string")
		div.innerText = msg;
	else
		div.appendChild(msg);

	if (timeout) BCX_setTimeout(() => div.remove(), timeout);

	// Returns the focus on the chat box
	const Refocus = document.activeElement?.id === "InputChat";
	const ShouldScrollDown = ElementIsScrolledToEnd("TextAreaChatLog");
	const ChatLog = document.getElementById("TextAreaChatLog");
	if (ChatLog != null) {
		ChatLog.appendChild(div);
		if (ShouldScrollDown) ElementScrollToEnd("TextAreaChatLog");
		if (Refocus) ElementFocus("InputChat");
		return div;
	}
	return null;
}

export function isNModClient(): boolean {
	return typeof (window as any).ChatRoomDrawFriendList === "function";
}

export function detectOtherMods() {
	const w = window as any;
	const ModSDKMods: Record<string, string | boolean> = {};
	for (const mod of bcModSDK.getModsInfo()) {
		if (mod.name === "BCX")
			continue;
		ModSDKMods[mod.name] = mod.version || true;
	}
	return {
		...ModSDKMods,
		NMod: isNModClient(),
		BondageClubTools: (window as any).BCX_BondageClubToolsPatch === true || ServerSocket.listeners("ChatRoomMessage").some(i => i.toString().includes("window.postMessage")),
		BCFriendList: ServerSocket.listeners("AccountQueryResult").some(i => i.toString().includes("f_t_body.innerText")),
		Curse: typeof w.CursedStarter === "function" ? (`${w.currentManifestVersion}` || true) : false,
		RPScript: typeof (Player as any)?.RPSScriptstatus === "string" ? (`${(Player as any)?.RPSScriptstatus}` || true) : false,
		Moaner: w.M_MOANER_scriptOn !== undefined ? (`${w.M_MOANER_scriptOn}` || true) : false,
		BcUtil: typeof w.StartBcUtil === "function",
		QuickAccessMenu: typeof w.OLDmenu === "function" && typeof w.NEWmenu === "function",
		ImprovedStruggle: typeof w.OLDclick === "function" && typeof w.NEWclick === "function",
		BCE: w.BCE_VERSION !== undefined ? (`${w.BCE_VERSION}` || true) : false
	};
}

interface DrawImageExOptions {
	Canvas?: CanvasRenderingContext2D;
	Alpha?: number;
	SourcePos?: [number, number, number, number];
	Width?: number;
	Height?: number;
	Invert?: boolean;
	Mirror?: boolean;
	Zoom?: number;
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
	}: DrawImageExOptions = {}
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

export function DrawImageBCX(Name: string, X: number, Y: number, options?: DrawImageExOptions): boolean {
	if (!BCXSource) {
		return true;
	}
	return DrawImageEx(BCXSource + "resources/" + Name, X, Y, options);
}

export function smartGetAsset(item: Item | Asset): Asset {
	const asset = Asset.includes(item as Asset) ? item as Asset : (item as Item).Asset;
	if (!Asset.includes(asset)) {
		throw new Error("Failed to convert item to asset");
	}
	return asset;
}

export function smartGetAssetGroup(item: Item | Asset | AssetGroup): AssetGroup {
	const group = AssetGroup.includes(item as AssetGroup) ? item as AssetGroup : Asset.includes(item as Asset) ? (item as Asset).Group : (item as Item).Asset.Group;
	if (!AssetGroup.includes(group)) {
		throw new Error("Failed to convert item to group");
	}
	return group;
}

export function isCloth(item: Item | Asset | AssetGroup, allowCosplay: boolean = false): boolean {
	const group = smartGetAssetGroup(item);
	return group.Category === "Appearance" && group.AllowNone && group.Clothing && (allowCosplay || !group.BodyCosplay);
}

export function isCosplay(item: Item | Asset | AssetGroup): boolean {
	const group = smartGetAssetGroup(item);
	return group.Category === "Appearance" && group.AllowNone && group.Clothing && group.BodyCosplay;
}

export function isBody(item: Item | Asset | AssetGroup): boolean {
	const group = smartGetAssetGroup(item);
	return group.Category === "Appearance" && !group.Clothing;
}

export function isBind(item: Item | Asset | AssetGroup, excludeSlots: AssetGroupName[] = ["ItemNeck", "ItemNeckAccessories", "ItemNeckRestraints"]): boolean {
	const group = smartGetAssetGroup(item);
	if (group.Category !== "Item" || group.BodyCosplay) return false;
	return !excludeSlots.includes(group.Name);
}

export function getCharacterName(memberNumber: number, defaultText: string): string;
export function getCharacterName(memberNumber: number, defaultText: string | null): string | null;
export function getCharacterName(memberNumber: number, defaultText: string | null = null): string | null {
	const c = getChatroomCharacter(memberNumber);
	if (c) {
		return c.Name;
	}
	if (Player.MemberNumber === memberNumber) {
		return Player.Name;
	}
	for (const char of ChatRoomCharacter) {
		if (char.MemberNumber === memberNumber)
			return char.Name;
		if (char.Ownership?.MemberNumber === memberNumber)
			return char.Ownership.Name;
		if (Array.isArray(char.Lovership)) {
			for (const lover of char.Lovership) {
				if (lover.MemberNumber === memberNumber)
					return lover.Name;
			}
		}
	}
	const friendName = Player.FriendNames?.get(memberNumber);
	if (friendName)
		return friendName;
	return defaultText;
}

export function getCharacterNickname(memberNumber: number, defaultText: string): string;
export function getCharacterNickname(memberNumber: number, defaultText: string | null): string | null;
export function getCharacterNickname(memberNumber: number, defaultText: string | null = null): string | null {
	const relNickname = RelationshipsGetNickname(memberNumber);
	if (relNickname != null)
		return relNickname;
	const c = getChatroomCharacter(memberNumber);
	if (c)
		return c.Nickname;
	return getCharacterName(memberNumber, defaultText);
}

export function itemColorsEquals(color1: null | undefined | string | string[], color2: null | undefined | string | string[]): boolean {
	if (color1 == null) {
		color1 = "Default";
	} else if (Array.isArray(color1) && color1.length === 1) {
		color1 = color1[0];
	}

	if (color2 == null) {
		color2 = "Default";
	} else if (Array.isArray(color2) && color2.length === 1) {
		color2 = color2[0];
	}

	return (!Array.isArray(color1) || !Array.isArray(color2)) ? color1 === color2 : CommonArraysEqual(color1, color2);
}

export function showHelp(helpText: string) {
	DrawHoverElements.push(() => {
		MainCanvas.save();
		MainCanvas.fillStyle = "#ffff88";
		MainCanvas.fillRect(1000, 190, 800, 600);
		MainCanvas.strokeStyle = "Black";
		MainCanvas.strokeRect(1000, 190, 800, 600);
		MainCanvas.textAlign = "left";
		DrawTextWrap(helpText, 1020 - 760 / 2, 210, 760, 560, "black");
		MainCanvas.restore();
	});
}

interface RoomInfo {
	Name: string;
	// Space: string;
	Description: string;
	Background: string;
	Limit: number;
	Admin: number[];
	Ban: number[];
	Game: string;
	Private: boolean;
	Locked: boolean;
	BlockCategory: any[];
}

export function getCurrentRoomData(): RoomInfo | null {
	if (!ChatRoomData)
		return null;
	return ({
		Name: ChatRoomData.Name,
		Description: ChatRoomData.Description,
		Background: ChatRoomData.Background,
		Limit: ChatRoomData.Limit,
		Admin: ChatRoomData.Admin.slice(),
		Ban: ChatRoomData.Ban.slice(),
		BlockCategory: ChatRoomData.BlockCategory.slice(),
		Game: ChatRoomGame,
		Private: ChatRoomData.Private,
		Locked: ChatRoomData.Locked
	});
}

export function updateChatroom(newData: Partial<RoomInfo>): boolean {
	const data = getCurrentRoomData();
	if (!ServerPlayerIsInChatRoom() || !ChatRoomPlayerIsAdmin() || !data)
		return false;
	const Room: Record<string, any> = { ...data, ...newData };
	Room.Limit = String(Room.Limit);
	ServerSend("ChatRoomAdmin", { MemberNumber: Player.ID, Action: "Update", Room });
	return true;
}

export function drawTypingIndicatorSpeechBubble(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, alpha: number, emote: boolean = false) {
	ctx.save();
	ctx.globalAlpha = alpha;
	ctx.translate(x, y);
	ctx.scale(width / 50, height / 50);
	ctx.fillStyle = "white";
	ctx.strokeStyle = "black";
	ctx.lineWidth = 3;
	let p = new Path2D(icon_Typing_base);
	ctx.fill(p);
	ctx.stroke(p);
	ctx.fillStyle = "black";
	p = new Path2D(emote ? icon_Typing_star : icon_Typing_dot);
	for (const dx of [0, 12, 12]) {
		ctx.translate(dx, 0);
		ctx.fill(p);
	}
	ctx.restore();
}

/**
 * Draws a path from an SVG on canvas, applying all options
 * @param {CanvasRenderingContext2D} ctx - Context of the canvas
 * @param {string} icon - The SVG path for drawing
 * @param {number} x - Icon position on the X axis
 * @param {number} y - Icon position on the Y axis
 * @param {number} width - Width of the icon
 * @param {number} height - Height of the icon
 * @param {number} baseSize - The base size of the provided path from the SVG, assuming equal width and height
 * @param {number} alpha - Transparency between 0-1
 * @param {number} lineWidth - Thickness of icon outline
 * @param {string} fillColor - Icon fill colour
 * @returns {void} - Nothing
 */
export function drawIcon(
	ctx: CanvasRenderingContext2D,
	icon: string,
	x: number, y: number,
	width: number, height: number,
	baseSize: number,
	alpha: number,
	lineWidth: number,
	fillColor: string,
	strokeColor: string = "black"
) {
	ctx.save();
	ctx.globalAlpha = alpha;
	ctx.translate(x, y);
	ctx.scale(width / baseSize, height / baseSize);
	ctx.fillStyle = fillColor;
	if (strokeColor) {
		ctx.strokeStyle = strokeColor;
	}
	ctx.lineWidth = lineWidth;
	const p = new Path2D(icon);
	ctx.fill(p);
	if (strokeColor) {
		ctx.stroke(p);
	}
	ctx.restore();
}

/**
 * Draws a word wrapped text in a rectangle
 * @param {string} Text - Text to draw
 * @param {number} X - Position of the rectangle on the X axis
 * @param {number} Y - Position of the rectangle on the Y axis
 * @param {number} Width - Width of the rectangle
 * @param {number} Height - Height of the rectangle
 * @param {string} ForeColor - Foreground color
 * @param {string} [BackColor] - Background color
 * @param {number} [MaxLine] - Maximum of lines the word can wrap for
 * @returns {void} - Nothing
 */
export function BCXDrawTextWrap(Text: string, X: number, Y: number, Width: number, Height: number, ForeColor: string, BackColor?: string, MaxLine?: number): void {
	MainCanvas.save();
	// Draw the rectangle if we need too
	if (BackColor != null) {
		MainCanvas.fillStyle = BackColor;
		MainCanvas.fillRect(X, Y, Width, Height);
		MainCanvas.lineWidth = 2;
		MainCanvas.strokeStyle = ForeColor;
		MainCanvas.strokeRect(X, Y, Width, Height);
	}
	if (!Text) return;

	if (MainCanvas.textAlign === "center") {
		X += Math.floor(Width / 2);
	}

	// Sets the text size if there's a maximum number of lines

	const lines = SubdivideTextSize(Text, Width, MaxLine);

	Y = Math.round(Y + (Height / 2) - ((lines.length - 1) * 23));

	for (const line of lines) {
		MainCanvas.fillText(line, X, Y);
		Y += 46;
	}

	// Resets the font text size
	MainCanvas.restore();
}

function SubdivideLine(Text: string, Width: number): string[] {
	// Don't bother if it fits on one line
	if (MainCanvas.measureText(Text).width <= Width) return [Text];

	const lines: string[] = [];
	let line = "";

	// Find the number of lines
	for (const word of Text.split(" ")) {
		const testLine = line + " " + word;
		if (line && MainCanvas.measureText(testLine).width > Width) {
			lines.push(line);
			line = word;
		} else line = testLine;
	}
	if (line) {
		lines.push(line);
	}
	return lines;
}

/**
 * Reduces the font size progressively until the text fits the wrap size
 * @param {string} Text - Text that will be drawn
 * @param {number} Width - Width in which the text must fit
 * @param {number} MaxLine - Maximum of lines the word can wrap for
 * @returns {void} - Nothing
 */
function SubdivideTextSize(Text: string, Width: number, MaxLine?: number): string[] {

	const initialLines = Text.split("\n").map(l => l.trim());

	if (MaxLine && initialLines.length > MaxLine) {
		MaxLine = undefined;
	}

	const finalLines: string[] = [];

	for (const line of initialLines) {
		finalLines.push(...SubdivideLine(line, Width));
	}

	// If there's too many lines, we launch the function again with size minus 2
	if (MaxLine && finalLines.length > MaxLine) {
		MainCanvas.font = (parseInt(MainCanvas.font.substring(0, 2), 10) - 2).toString() + "px arial";
		return SubdivideTextSize(Text, Width, MaxLine);
	}

	return finalLines;
}
