import { VERSION_CHECK_BOT } from "../config";
import { moduleInitPhase } from "../moduleManager";
import { BaseModule } from "./_BaseModule";
import { isObject } from "../utils";
import { announceSelf } from "./chatroom";
import { sendHiddenBeep } from "./messaging";
import { ModuleInitPhase } from "../constants";
import { BCX_setTimeout } from "../BCXContext";
import { isMatch } from "lodash-es";
import { reportManualError } from "../errorReporting";

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

function getLocalStorageNameBackup(): string {
	return `BCX_${Player.MemberNumber}_backup`;
}

function storageClearData() {
	if (Player.OnlineSettings) {
		delete Player.OnlineSettings.BCX;
		Player.OnlineSettings.BCXDataCleared = Date.now();
	}
	localStorage.removeItem(getLocalStorageName());
	localStorage.removeItem(getLocalStorageNameBackup());

	ServerAccountUpdate.QueueData({ OnlineSettings: Player.OnlineSettings }, true);
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

	try {
		if (typeof serializedData !== "string") {
			throw new Error("Data compression failed");
		}

		const checkParsedData = JSON.parse(LZString.decompressFromBase64(serializedData)!);

		if (!isMatch(modStorage, checkParsedData)) {
			console.warn("Current data:\n", modStorage, "\nSaved data:\n", checkParsedData);
			throw new Error("Saved data differs after load");
		}
	} catch (error) {
		reportManualError("Save data failed to validate!", error);
		return;
	}

	if (modStorageLocation === StorageLocations.OnlineSettings) {
		Player.OnlineSettings.BCX = serializedData;
		ServerAccountUpdate.QueueData({ OnlineSettings: Player.OnlineSettings });
	} else if (modStorageLocation === StorageLocations.LocalStorage) {
		localStorage.setItem(getLocalStorageName(), serializedData);
	} else {
		throw new Error(`Unknown StorageLocation`);
	}

	localStorage.setItem(getLocalStorageNameBackup(), serializedData);
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

		if (typeof saved !== "string") {
			if (!isObject(Player.OnlineSettings)) {
				console.error("BCX: Missing OnlineSettings during load");
				alert("BCX: Failed to load data, please see console for more details");
				return false;
			}
			saved = Player.OnlineSettings.BCX;
			modStorageLocation = StorageLocations.OnlineSettings;
		}

		if (typeof saved !== "string") {
			const backupSave = localStorage.getItem(getLocalStorageNameBackup());
			if (typeof backupSave === "string" &&
				confirm("BCX: Error loading saved data, but found local backup.\nDo you want to load the backup?")
			) {
				saved = backupSave;
			}
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
		} else if (saved !== undefined) {
			console.error("BCX: Unknown save data type:", saved);
			alert("BCX: Failed to load data, please see console for more details");
			return false;
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
