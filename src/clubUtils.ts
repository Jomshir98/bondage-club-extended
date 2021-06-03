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
		div.innerHTML = msg;
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