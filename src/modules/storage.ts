import { VERSION_CHECK_BOT } from "../config";
import { moduleInitPhase } from "../moduleManager";
import { BaseModule } from "./_BaseModule";
import { isObject } from "../utils";
import { announceSelf } from "./chatroom";
import { sendHiddenBeep } from "./messaging";
import { ModuleInitPhase } from "../constants";

export let modStorage: Partial<ModStorage> = {};
let deletionPending = false;
export let firstTimeInit: boolean = false;

export function finalizeFirstTimeInit() {
	firstTimeInit = false;
	modStorageSync();
	console.log("BCX: First time init finalized");
	announceSelf(true);
}

export function modStorageSync() {
	if (moduleInitPhase !== ModuleInitPhase.ready && moduleInitPhase !== ModuleInitPhase.destroy)
		return;
	if (deletionPending || firstTimeInit)
		return;
	if (!Player.OnlineSettings) {
		console.error("BCX: Player OnlineSettings not defined during storage sync!");
		return;
	}
	(Player.OnlineSettings as any).BCX = LZString.compressToBase64(JSON.stringify(modStorage));
	if (typeof ServerAccountUpdate !== "undefined") {
		ServerAccountUpdate.QueueData({ OnlineSettings: Player.OnlineSettings });
	} else {
		console.debug("BCX: Old sync method");
		ServerSend("AccountUpdate", { OnlineSettings: Player.OnlineSettings });
	}
}

export function clearAllData() {
	deletionPending = true;
	delete (Player.OnlineSettings as any).BCX;
	if (typeof ServerAccountUpdate !== "undefined") {
		ServerAccountUpdate.QueueData({ OnlineSettings: Player.OnlineSettings }, true);
	} else {
		console.debug("BCX: Old sync method");
		ServerSend("AccountUpdate", { OnlineSettings: Player.OnlineSettings });
	}
	sendHiddenBeep("clearData", true, VERSION_CHECK_BOT, true);
	setTimeout(() => {
		window.location.reload();
	}, 2000);
}

export class ModuleStorage extends BaseModule {
	init() {
		const saved = (Player.OnlineSettings as any)?.BCX;
		if (typeof saved === "string") {
			try {
				const storage = JSON.parse(LZString.decompressFromBase64(saved)!);
				if (!isObject(storage)) {
					throw new Error("Bad data");
				}
				modStorage = storage;
			} catch (error) {
				console.error("BCX: Error while loading saved data, full reset.", error);
			}
		} else {
			console.log("BCX: First time init");
			firstTimeInit = true;
		}
	}

	run() {
		modStorageSync();
	}
}
