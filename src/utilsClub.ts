const GROUP_NAME_OVERRIDES: Record<string, string> = {
	"ItemNeckAccessories": "Collar Addon",
	"ItemNeckRestraints": "Collar Restraint",
	"ItemNipplesPiercings": "Nipple Piercing",
	"ItemHood": "Hood",
	"ItemMisc": "Miscellaneous",
	"ItemDevices": "Devices",
	"ItemHoodAddon": "Hood Addon",
	"ItemAddon": "General Addon",
	"ItemFeet": "Upper Leg",
	"ItemLegs": "Lower Leg",
	"ItemBoots": "Feet",
	"ItemMouth": "Mouth (1)",
	"ItemMouth2": "Mouth (2)",
	"ItemMouth3": "Mouth (3)"
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

export function getVisibleGroupName(group: AssetGroup): string {
	return developmentMode ? group.Name : (GROUP_NAME_OVERRIDES[group.Name] ?? group.Description);
}

export function InfoBeep(msg: string, timer: number = 3000) {
	ServerBeep = {
		Timer: Date.now() + timer,
		Message: msg
	};
}

export function ChatRoomActionMessage(msg: string, target: null | number = null) {
	if (!msg) return;
	ServerSend("ChatRoomChat", {
		Content: "Beep",
		Type: "Action",
		Target: target,
		Dictionary: [
			{ Tag: "Beep", Text: "msg" },
			{ Tag: "Biep", Text: "msg" },
			{ Tag: "Sonner", Text: "msg" },
			{ Tag: "msg", Text: msg }
		]
	});
}

export function ChatRoomSendLocal(msg: string | Node, timeout?: number, sender?: number): HTMLDivElement | null {
	// Adds the message and scrolls down unless the user has scrolled up
	const div = document.createElement("div");
	div.setAttribute("class", "ChatMessage ChatMessageLocalMessage");
	div.setAttribute("data-time", ChatRoomCurrentTime());
	div.setAttribute('data-sender', `${sender ?? Player.MemberNumber ?? 0}`);
	div.style.background = "#6e6eff54";
	div.style.margin = "0.15em 0";

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
		return div;
	}
	return null;
}

export function detectOtherMods() {
	const w = window as any;
	return {
		NMod: typeof w.ChatRoomDrawFriendList === "function",
		BondageClubTools: (window as any).BCX_BondageClubToolsPatch === true || ServerSocket.listeners("ChatRoomMessage").some(i => i.toString().includes("window.postMessage"))
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
	} = {}
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

export function isBind(item: Item | Asset | AssetGroup): boolean {
	const group = smartGetAssetGroup(item);
	if (group.Category !== "Item" || group.BodyCosplay) return false;
	return !["ItemNeck", "ItemNeckAccessories", "ItemNeckRestraints"].includes(group.Name);
}

export function getCharacterName(memberNumber: number, defaultText: string): string;
export function getCharacterName(memberNumber: number, defaultText: string | null): string | null;
export function getCharacterName(memberNumber: number, defaultText: string | null = null): string | null {
	const character = ChatRoomCharacter.find(c => c.MemberNumber === memberNumber);
	if (character)
		return character.Name;
	const friendName = Player.FriendNames?.get(memberNumber);
	if (friendName)
		return friendName;
	return defaultText;
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
	MainCanvas.fillStyle = "#ffff88";
	MainCanvas.fillRect(1000, 190, 800, 600);
	MainCanvas.strokeStyle = "Black";
	MainCanvas.strokeRect(1000, 190, 800, 600);
	MainCanvas.textAlign = "left";
	DrawTextWrap(helpText, 1020 - 760 / 2, 210, 760, 560, "black");
}
