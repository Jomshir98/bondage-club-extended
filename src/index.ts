import { announceSelf, ChatroomSM, init_chatroom } from "./chatroom";
import { detectOtherMods, InfoBeep } from "./clubUtils";
import { VERSION } from "./config";
import { init_commands } from "./commands";
import { init_console } from "./console";
import { init_messaging } from "./messaging";
import { init_miscPatches } from "./miscPatches";
import { init_wardrobe } from "./wardrobe";
import { hookFunction } from "./patching";

async function initWait() {
	if (CurrentScreen == null || CurrentScreen === "Login") {
		InfoBeep(`BCX Ready!`);
		hookFunction("LoginResponse", 0, (args, next) => {
			next(args);
			loginInit(args[0]);
		});
	} else {
		init();
	}
}

function loginInit(C: any) {
	if (window.BCX_Loaded) return;
	init();
}

function init() {
	// Loading into already loaded club - clear some caches
	DrawRunMap.clear();
	DrawScreen = "";

	init_messaging();
	init_chatroom();
	init_wardrobe();
	init_commands();
	init_console();
	init_miscPatches();

	//#region Other mod compatability

	const { NMod, BondageClubTools } = detectOtherMods();

	if (NMod) {
		console.warn("BCX: NMod load!");
		(window as any).ChatRoomSM = ChatroomSM;
		ServerSocket.on("ChatRoomMessageSync", () => {
			announceSelf(true);
		});
	}
	if (BondageClubTools) {
		console.warn("BCX: Bondage Club Tools detected!");
		const ChatRoomMessageForwarder = ServerSocket.listeners("ChatRoomMessage").find(i => i.toString().includes("window.postMessage"));
		const AccountBeepForwarder = ServerSocket.listeners("AccountBeep").find(i => i.toString().includes("window.postMessage"));
		console.assert(ChatRoomMessageForwarder !== undefined && AccountBeepForwarder !== undefined);
		ServerSocket.off("ChatRoomMessage");
		ServerSocket.on("ChatRoomMessage", data => {
			if (data?.Type !== "Hidden" || data.Content !== "JModMsg" || typeof data.Sender !== "number") {
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

initWait();
