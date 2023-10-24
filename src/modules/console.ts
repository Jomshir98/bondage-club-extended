import { allowMode, developmentMode, setAllowMode, setDevelopmentMode } from "../utilsClub";
import { hookFunction } from "../patching";
import { j_WardrobeExportSelectionClothes, j_WardrobeImportSelectionClothes } from "./wardrobe";
import { InvisibilityEarbuds } from "./clubUtils";
import { BaseModule } from "./_BaseModule";
import { unload } from "../main";
import { modStorage, switchStorageLocation } from "./storage";
import { sendQuery } from "./messaging";
import { ChatroomCharacter, getChatroomCharacter, getPlayerCharacter } from "../characters";
import { debugGenerateReport, debugSetLogServerMessages, showErrorOverlay } from "../errorReporting";
import { VERSION } from "../config";
import { ModAPI } from "./console_modApi";
import { BCX_VERSION_PARSED } from "../utils";
import { getCurrentSubscreen } from "./gui";

import bcModSDK from "bondage-club-mod-sdk";
import { cloneDeep } from "lodash-es";

class ConsoleInterface implements BCX_ConsoleInterface {
	get version(): string {
		return VERSION;
	}

	get versionParsed(): Readonly<BCXVersion> {
		return cloneDeep(BCX_VERSION_PARSED);
	}

	getCharacterVersion(target?: number): string | null {
		if (target !== undefined && typeof target !== "number")
			return null;

		const char = target === undefined ? getPlayerCharacter() : getChatroomCharacter(target);
		return char ? char.BCXVersion : null;
	}

	get isAllow(): boolean {
		return allowMode;
	}

	AllowCheats(allow?: boolean) {
		if (typeof allow !== "boolean" && allow !== undefined) {
			return false;
		}
		if (allowMode === allow)
			return true;
		if (allow === undefined) {
			allow = !allowMode;
		}
		return setAllowMode(allow);
	}

	get isDevel(): boolean {
		return developmentMode;
	}

	Devel(devel?: boolean) {
		if (typeof devel !== "boolean" && devel !== undefined) {
			return false;
		}
		if (developmentMode === devel)
			return true;
		if (devel === undefined) {
			devel = !developmentMode;
		}
		return setDevelopmentMode(devel);
	}

	j_WardrobeExportSelectionClothes(includeBinds: boolean = false): string {
		return j_WardrobeExportSelectionClothes(includeBinds);
	}

	j_WardrobeImportSelectionClothes(data: string | ItemBundle[], includeBinds: boolean, force: boolean = false): string | true {
		return j_WardrobeImportSelectionClothes(data, includeBinds, force);
	}

	ToggleInvisibilityEarbuds(): void {
		return InvisibilityEarbuds();
	}

	Unload() {
		return unload();
	}

	get storage(): any {
		if (!developmentMode) {
			return "Development mode required";
		}
		return modStorage;
	}

	devGetCharacter(target?: number): ChatroomCharacter | null | false {
		if (!developmentMode || (target !== undefined && typeof target !== "number"))
			return false;

		if (target === undefined) {
			return getPlayerCharacter();
		}
		return getChatroomCharacter(target);
	}

	devSendQuery(target: number, query: string, data: any): boolean {
		if (!developmentMode || typeof target !== "number" || typeof query !== "string")
			return false;

		sendQuery(query as keyof BCX_queries, data, target).then(
			result => {
				console.info(`Query ${query} to ${target} resolved:`, result);
			},
			error => {
				console.warn(`Query ${query} to ${target} failed:`, error);
			}
		);

		return true;
	}

	switchStorageLocation(location: number): boolean {
		if (typeof location !== "number")
			return false;
		switchStorageLocation(location);
		return true;
	}

	showDebugReport(): void {
		showErrorOverlay(
			"BCX Debug Report",
			"This is manually created debug report.\n" +
			"You can use the 'Close' button at the bottom to close this overlay.",
			debugGenerateReport()
		);
	}

	debugSetLogServerMessages(value: boolean): boolean {
		if (typeof value !== "boolean")
			return false;

		debugSetLogServerMessages(value);
		return true;
	}

	getModApi(modName: string): BCX_ModAPI {
		if (!bcModSDK.getModsInfo().some(mod => mod.name === modName) || modName.trim().toLowerCase() === "bcx") {
			throw new Error("Only mods registered to ModSDK can request BCX API");
		}
		return Object.freeze(new ModAPI(modName));
	}

	inBcxSubscreen(): boolean {
		return getCurrentSubscreen() != null;
	}
}

export const consoleInterface: ConsoleInterface = Object.freeze(new ConsoleInterface());

export class ModuleConsole extends BaseModule {
	load() {
		window.bcx = consoleInterface;

		hookFunction("DialogDrawItemMenu", 0, (args, next) => {
			if (developmentMode) {
				DialogTextDefault = args[0].FocusGroup?.Description || "";
			}
			return next(args);
		});

		DialogSelfMenuOptions.forEach(opt => {
			if (opt.Name === "Pose") {
				opt.IsAvailable = () => true;
			}
		});
	}

	run() {
		if ((window as any).BCX_Devel) {
			setDevelopmentMode(true);
		}
	}

	unload() {
		delete window.bcx;
	}
}
