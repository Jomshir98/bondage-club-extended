import { BaseModule } from "./moduleManager";
import { isObject } from "./utils";

export let modStorage: Partial<ModStorage> = {};

export function modStorageSync() {
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
		}
	}

	run() {
		modStorageSync();
	}
}
