import { isMatch } from "lodash-es";
import { Buffer } from "safe-buffer";
import { sha256 } from "sha.js";
import { VERSION_CHECK_BOT } from "../config";
import { ModuleInitPhase } from "../constants";
import { moduleInitPhase } from "../moduleManager";
import { BCXVersionCompare, isObject, parseBCXVersion } from "../utils";
import { BaseModule } from "./_BaseModule";
import { announceSelf } from "./chatroom";
import { sendHiddenBeep } from "./messaging";
import { BCX_setTimeout } from "../BCXContext";
import { reportManualError } from "../errorReporting";

export enum StorageLocations {
	OnlineSettings = 0,
	LocalStorage = 1,
	ExtensionSettings = 2,
}

export let modStorage: Partial<ModStorage> = {};
let deletionPending = false;
export let firstTimeInit: boolean = false;
export let modStorageLocation: StorageLocations = StorageLocations.ExtensionSettings;

const AUTH_STRING_MIN_SIZE = 8;
const AUTH_STRING_SIZE = 8;
/** List of past auth keys to accept and the versions they were replaced, should be in reverse order of issuing */
const ACCEPT_PAST_AUTH: readonly [string, BCXVersion][] = [
];

export function finalizeFirstTimeInit() {
	if (!firstTimeInit)
		return;
	firstTimeInit = false;
	modStorage.chatShouldDisplayFirstTimeHelp = true;
	modStorageSync();
	console.log("HardCoreClub: First time init finalized");
	announceSelf(true);
}

function getLocalStorageName(): string {
	return `BCX_${Player.MemberNumber}`;
}

function getLocalStorageNameBackup(): string {
	return `BCX_${Player.MemberNumber}_backup`;
}

function storageClearData() {
	// Online settings storage
	if (Player.OnlineSettings?.BCX !== undefined) {
		delete Player.OnlineSettings.BCX;
		Player.OnlineSettings.BCXDataCleared = Date.now();
		ServerAccountUpdate.QueueData({ OnlineSettings: Player.OnlineSettings }, true);
	}

	// Localstorage and backup
	localStorage.removeItem(getLocalStorageName());
	localStorage.removeItem(getLocalStorageNameBackup());

	// Extension settings
	if (Player.ExtensionSettings.BCX != null) {
		Player.ExtensionSettings.BCX = null;
		ServerPlayerExtensionSettingsSync("BCX", true);
	}
}

export function switchStorageLocation(location: StorageLocations) {
	if (location !== StorageLocations.LocalStorage && location !== StorageLocations.OnlineSettings && location !== StorageLocations.ExtensionSettings) {
		throw new Error(`Unknown storage location`);
	}
	if (modStorageLocation === location)
		return;
	console.info(`HardCoreClub: Switching storage location to: ${StorageLocations[location]}`);
	modStorageLocation = location;
	storageClearData();
	modStorageSync();
}

export function calculateSaveHmac(save: string, key: string): string {
	const keyBase = new sha256().update(key, "utf-8").digest();
	const blocksize = 64;

	const iPad = Buffer.allocUnsafe(blocksize);
	const oPad = Buffer.allocUnsafe(blocksize);

	for (let i = 0; i < blocksize; i++) {
		/* eslint-disable no-bitwise */
		const k = i < keyBase.length ? keyBase.readInt8(i) : 0;
		iPad.writeInt8(k ^ 0x36, i);
		oPad.writeInt8(k ^ 0x5C, i);
		/* eslint-enable no-bitwise */
	}
	const iHash = new sha256()
		.update(iPad)
		.update(save, "utf-8")
		.digest();

	const result = new sha256()
		.update(oPad)
		.update(iHash)
		.digest("base64")
		.substring(0, AUTH_STRING_SIZE);

	if (result.length !== AUTH_STRING_SIZE) {
		throw new Error("Failed to generate save HMAC");
	}
	return result;
}

export function modStorageSync() {
	if (moduleInitPhase !== ModuleInitPhase.ready && moduleInitPhase !== ModuleInitPhase.destroy)
		return;
	if (deletionPending || firstTimeInit)
		return;
	if (!Player.OnlineSettings) {
		console.error("HardCoreClub: Player OnlineSettings not defined during storage sync!");
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

		if (serializedData.includes(":")) {
			throw new Error("Saved data contains forbidden characters");
		}
	} catch (error) {
		reportManualError("Save data failed to validate!", error);
		return;
	}

	// Additional wrapping format for authenticating saves
	const formatVersion = 2;
	const authString = BCX_SAVE_AUTH ? calculateSaveHmac(serializedData, BCX_SAVE_AUTH) : "-";
	const finalSave = `${formatVersion}:${serializedData}:${authString}`;

	if (modStorageLocation === StorageLocations.OnlineSettings) {
		Player.OnlineSettings.BCX = finalSave;
		ServerAccountUpdate.QueueData({ OnlineSettings: Player.OnlineSettings });
	} else if (modStorageLocation === StorageLocations.LocalStorage) {
		localStorage.setItem(getLocalStorageName(), finalSave);
	} else if (modStorageLocation === StorageLocations.ExtensionSettings) {
		Player.ExtensionSettings.BCX = finalSave;
		ServerPlayerExtensionSettingsSync("BCX", true);
	} else {
		throw new Error(`Unknown StorageLocation`);
	}

	localStorage.setItem(getLocalStorageNameBackup(), finalSave);
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
			console.info(`HardCoreClub: Detected storage location: local storage`);
			modStorageLocation = StorageLocations.LocalStorage;
		}

		if (typeof saved !== "string") {
			if (!isObject(Player.ExtensionSettings)) {
				console.error("BCX: Missing ExtensionSettings during load");
				alert("BCX: Failed to load data, please see console for more details");
				return false;
			}
			saved = Player.ExtensionSettings.BCX;
			modStorageLocation = StorageLocations.ExtensionSettings;
		}

		if (typeof saved !== "string") {
			if (!isObject(Player.OnlineSettings)) {
				console.error("HardCoreClub: Missing OnlineSettings during load");
				alert("HardCoreClub: Failed to load data, please see console for more details");
				return false;
			}
			saved = Player.OnlineSettings.BCX;
			modStorageLocation = StorageLocations.OnlineSettings;
		}

		if (typeof saved !== "string") {
			const backupSave = localStorage.getItem(getLocalStorageNameBackup());
			if (typeof backupSave === "string" &&
				confirm("HardCoreClub: Error loading saved data, but found local backup.\nDo you want to load the backup?")
			) {
				saved = backupSave;
				modStorageLocation = StorageLocations.OnlineSettings; // Fake online settings source to allow loading pre-auth backup
			}
		}

		if (typeof saved === "string") {
			try {
				let requireAuth = modStorageLocation === StorageLocations.ExtensionSettings;
				let authSuccessVersion: BCXVersion | true | null = null;
				let hasAuth = false;
				// Unpack wrapping format, if there is one
				if (/^[0-9]+:/.test(saved)) {
					const parts = saved.split(":");
					const saveVersion = Number.parseInt(parts[0], 10);
					if (saveVersion === 2) {
						if (parts.length !== 3) {
							throw new Error("Invalid save part count.");
						}
						saved = parts[1];
						if (parts[2] && parts[2] !== "-" && parts[2].length >= AUTH_STRING_MIN_SIZE) {
							hasAuth = true;
							let accept: readonly [string, BCXVersion | true][] = ACCEPT_PAST_AUTH;
							if (BCX_SAVE_AUTH) {
								accept = [[BCX_SAVE_AUTH, true], ...accept];
							}
							for (const [key, version] of accept) {
								const auth = calculateSaveHmac(saved, key);
								if (auth.startsWith(parts[2])) {
									authSuccessVersion = version;
									break;
								}
							}
						}
					} else {
						throw new Error("Unknown save version. Are you loading older version of BCX?");
					}
				}

				const storage: Partial<ModStorage> = JSON.parse(LZString.decompressFromBase64(saved)!);
				if (!isObject(storage)) {
					throw new Error("Bad data");
				}
				const saveBCXVersion: BCXVersion | null = typeof storage.version === "string" ? parseBCXVersion(storage.version) : { major: 0, minor: 0, patch: 0 };
				// We know for a fact, that all versions in online storage should be parsable. No future version will use that place
				if (modStorageLocation === StorageLocations.OnlineSettings && storage.version !== undefined && saveBCXVersion == null) {
					throw new Error("Failed to read save version. Did you use an unofficial fork?");
				}
				// Validate that we are not loading a save that is signed by no longer valid key (relative to its version)
				if (authSuccessVersion != null && authSuccessVersion !== true && (saveBCXVersion == null || BCXVersionCompare(saveBCXVersion, authSuccessVersion) >= 0)) {
					authSuccessVersion = null;
				}
				// From version 1.1.0 saves, auth is always required
				if (saveBCXVersion != null && BCXVersionCompare(saveBCXVersion, { major: 1, minor: 1, patch: 0 }) >= 0) {
					requireAuth = true;
				}

				if (requireAuth && !!BCX_SAVE_AUTH && authSuccessVersion == null) {
					throw new Error("Failed to verify save signature. Did you use an unofficial fork?");
				}

				if (hasAuth && !BCX_SAVE_AUTH) {
					if (!confirm("You are attempting to load an unofficial BCX version.\n" +
						"If you continue, you will not be able to return to the official version without resetting all data.\n" +
						"Are you sure you want to continue?"
					)) {
						return false;
					}
				}

				modStorage = storage;
			} catch (error) {
				console.error("HardCoreClub: Error while loading saved data, full reset.", error);
				if (confirm(`HardCoreClub Failed to load saved data!\n` +
					`${error}\n\n` +
					`Continue anyway, resetting all data?`
				)) {
					firstTimeInit = true;
				} else {
					return false;
				}
			}
		} else if (saved !== undefined) {
			console.error("HardCoreClub: Unknown save data type:", saved);
			alert("HardCoreClub: Failed to load data, please see console for more details");
			return false;
		} else {
			console.log("HardCoreClub: First time init");
			firstTimeInit = true;
		}
		return true;
	}

	run() {
		if (modStorageLocation === StorageLocations.ExtensionSettings) {
			// If we loaded from extension settings, delete possible old online settings
			if (Player.OnlineSettings?.BCX !== undefined || Player.OnlineSettings?.BCXDataCleared !== undefined) {
				delete Player.OnlineSettings.BCX;
				delete Player.OnlineSettings.BCXDataCleared;
				ServerAccountUpdate.QueueData({ OnlineSettings: Player.OnlineSettings });
			}
		} else if (modStorageLocation === StorageLocations.OnlineSettings) {
			// Online settings should get seamlessly redirected to extension settings
			// (but delete online settings only the next time around to avoid possibility of data loss during transition)
			modStorageLocation = StorageLocations.ExtensionSettings;
		}
		modStorageSync();
	}
}
