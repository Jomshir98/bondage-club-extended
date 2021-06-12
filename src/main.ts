import { detectOtherMods, InfoBeep } from "./utilsClub";
import { VERSION } from "./config";
import { init_modules, unload_modules } from "./moduleManager";
import { unload_patches } from "./patching";

export function loginInit(C: any) {
	if (window.BCX_Loaded) return;
	init();
}

export function init() {
	// Loading into already loaded club - clear some caches
	DrawRunMap.clear();
	DrawScreen = "";

	init_modules();

	//#region Other mod compatability

	const { BondageClubTools } = detectOtherMods();

	if (BondageClubTools) {
		console.warn("BCX: Bondage Club Tools detected!");
		const ChatRoomMessageForwarder = ServerSocket.listeners("ChatRoomMessage").find(i => i.toString().includes("window.postMessage"));
		const AccountBeepForwarder = ServerSocket.listeners("AccountBeep").find(i => i.toString().includes("window.postMessage"));
		console.assert(ChatRoomMessageForwarder !== undefined && AccountBeepForwarder !== undefined);
		ServerSocket.off("ChatRoomMessage");
		ServerSocket.on("ChatRoomMessage", data => {
			if (data?.Type !== "Hidden" || data.Content !== "BCXMsg" || typeof data.Sender !== "number") {
				ChatRoomMessageForwarder!(data);
			}
			return ChatRoomMessage(data);
		});
		ServerSocket.off("AccountBeep");
		ServerSocket.on("AccountBeep", data => {
			if (typeof data?.BeepType !== "string" || !data.BeepType.startsWith("Jmod:")) {
				AccountBeepForwarder!(data);
			}
			return ServerAccountBeep(data);
		});
	}

	//#endregion

	window.BCX_Loaded = true;
	InfoBeep(`BCX loaded! Version: ${VERSION}`);
}

export function unload() {
	const { BondageClubTools } = detectOtherMods();

	if (BondageClubTools) {
		throw new Error("BCX: Unload not supported when BondageClubTools are present");
	}

	unload_patches();
	unload_modules();

	// clear some caches
	DrawRunMap.clear();
	DrawScreen = "";

	delete window.BCX_Loaded;
	console.log("BCX: Unloaded.");
}
