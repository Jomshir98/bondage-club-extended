import { VERSION_CHECK_BOT } from "../config";
import { moduleInitPhase } from "../moduleManager";
import { BaseModule } from "./_BaseModule";
import { isObject } from "../utils";
import { announceSelf } from "./chatroom";
import { sendHiddenBeep } from "./messaging";
import { ModuleInitPhase } from "../constants";
import { BCX_setTimeout } from "../BCXContext";

export enum StorageLocations {
	OnlineSettings = 0,
	LocalStorage = 1,
}

export let modStorage: Partial<ModStorage> = {};
let deletionPending = false;
export let firstTimeInit: boolean = false;
export let modStorageLocation: StorageLocations = StorageLocations.OnlineSettings;

export function finalizeFirstTimeInit() {
	if (!firstTimeInit)
		return;
	firstTimeInit = false;
	modStorage.chatShouldDisplayFirstTimeHelp = true;
	modStorageSync();
	console.log("BCX: First time init finalized");
	announceSelf(true);
}

function getLocalStorageName(): string {
	return `BCX_${Player.MemberNumber}`;
}

function storageClearData() {
	if (Player.OnlineSettings) {
		delete Player.OnlineSettings.BCX;
	}
	localStorage.removeItem(getLocalStorageName());

	if (typeof ServerAccountUpdate !== "undefined") {
		ServerAccountUpdate.QueueData({ OnlineSettings: Player.OnlineSettings }, true);
	} else {
		console.debug("BCX: Old sync method");
		ServerSend("AccountUpdate", { OnlineSettings: Player.OnlineSettings });
	}
}

export function switchStorageLocation(location: StorageLocations) {
	if (location !== StorageLocations.LocalStorage && location !== StorageLocations.OnlineSettings) {
		throw new Error(`Unknown storage location`);
	}
	if (modStorageLocation === location)
		return;
	console.info(`BCX: Switching storage location to: ${StorageLocations[location]}`);
	modStorageLocation = location;
	storageClearData();
	modStorageSync();
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

	const serializedData = LZString.compressToBase64(JSON.stringify(modStorage));

	if (modStorageLocation === StorageLocations.OnlineSettings) {
		Player.OnlineSettings.BCX = serializedData;
		if (typeof ServerAccountUpdate !== "undefined") {
			ServerAccountUpdate.QueueData({ OnlineSettings: Player.OnlineSettings });
		} else {
			console.debug("BCX: Old sync method");
			ServerSend("AccountUpdate", { OnlineSettings: Player.OnlineSettings });
		}
	} else if (modStorageLocation === StorageLocations.LocalStorage) {
		localStorage.setItem(getLocalStorageName(), serializedData);
	} else {
		throw new Error(`Unknown StorageLocation`);
	}
}

export function clearAllData() {
	deletionPending = true;

	storageClearData();

	sendHiddenBeep("clearData", true, VERSION_CHECK_BOT, true);
	BCX_setTimeout(() => {
		window.location.reload();
	}, 2000);
}

export class ModuleStorage extends BaseModule {
	init() {
		let saved: any = null;

		saved = localStorage.getItem(getLocalStorageName());
		if (typeof saved === "string") {
			console.info(`BCX: Detected storage location: local storage`);
			modStorageLocation = StorageLocations.LocalStorage;
		}

		if (!saved) {
			saved = Player.OnlineSettings?.BCX;
			modStorageLocation = StorageLocations.OnlineSettings;
		}

		if (typeof saved === "string") {
			try {
				const storage = JSON.parse(LZString.decompressFromBase64(saved)!);
				if (!isObject(storage)) {
					throw new Error("Bad data");
				}
				modStorage = storage;
			} catch (error) {
				console.error("BCX: Error while loading saved data, full reset.", error);
				if (confirm(`BCX Failed to load saved data! Continue anyway, resetting all data?\n(${error})`)) {
					firstTimeInit = true;
				} else {
					return false;
				}
			}
		} else {
			console.log("BCX: First time init");
			firstTimeInit = true;
		}
		return true;
	}

	run() {
		modStorageSync();
	}
}
