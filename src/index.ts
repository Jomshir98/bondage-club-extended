import { init_chatroom } from "./chatroom";
import { InfoBeep } from "./clubUtils";
import { VERSION } from "./config";
import { init_messaging } from "./messaging";
import { init_miscPatches } from "./miscPatches";

function init() {
	// Loading into already loaded club - clear some caches
	DrawRunMap.clear();
	DrawScreen = "";

	init_messaging();
	init_chatroom();
	init_miscPatches();

	window.BCX_Loaded = true;
	InfoBeep(`BCX loaded! Version: ${VERSION}`);
}

init();
