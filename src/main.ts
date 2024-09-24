import { detectOtherMods, InfoBeep } from "./utilsClub";
import { VERSION } from "./config";
import { init_modules, moduleInitPhase, unload_modules } from "./moduleManager";
import { hookFunction, replacePatchedMethodsDeep, unload_patches } from "./patching";
import { isObject } from "./utils";
import { InitErrorReporter, UnloadErrorReporter } from "./errorReporting";
import { BCX_setInterval, debugContextStart, SetLoadedBeforeLogin } from "./BCXContext";
import { ModuleInitPhase } from "./constants";
import { detectForbiddenOtherMods } from "./utilsClub";

export function loginInit(C: any) {
	if (window.BCX_Loaded || moduleInitPhase !== ModuleInitPhase.construct)
		return;
	SetLoadedBeforeLogin(C);
	init();
}

function replaceReferencedFunctions() {
	// Run patching replacer on objects that hold references to patched functions
	replacePatchedMethodsDeep("ChatRoomViews", ChatRoomViews);
	replacePatchedMethodsDeep("CurrentScreenFunctions", CurrentScreenFunctions);
	replacePatchedMethodsDeep("DialogSelfMenuOptions", DialogSelfMenuOptions);
}

export function init() {
	if (window.BCX_Loaded || moduleInitPhase !== ModuleInitPhase.construct)
		return;

	const ctx = debugContextStart("BCX init", { modArea: "BCX" });

	InitErrorReporter();

	if (!init_modules()) {
		ctx.end();
		unload();
		return;
	}

	const currentAccount = Player.MemberNumber;
	if (currentAccount == null) {
		throw new Error("No player MemberNumber");
	}

	hookFunction("LoginResponse", 0, (args, next) => {
		const response = args[0];
		if (isObject(response) && typeof response.Name === "string" && typeof response.AccountName === "string" && response.MemberNumber !== currentAccount) {
			alert(`Attempting to load BCX with different account than already loaded (${response.MemberNumber} vs ${currentAccount}). This is not supported, please refresh the page.`);
			throw new Error("Attempting to load BCX with different account");
		}
		return next(args);
	});

	// Loading into already loaded club - clear some caches
	replaceReferencedFunctions();

	//#region Other mod compatability

	const { BondageClubTools } = detectOtherMods();

	if (BondageClubTools) {
		console.warn("BCX: Bondage Club Tools detected!");
		if ((window as any).BCX_BondageClubToolsPatch === true) {
			console.info("BCX: Bondage Club Tools already patched, skip!");
		} else {
			(window as any).BCX_BondageClubToolsPatch = true;
			const ChatRoomMessageForwarder = ServerSocket.listeners("ChatRoomMessage").find(i => i.toString().includes("window.postMessage"));
			const AccountBeepForwarder = ServerSocket.listeners("AccountBeep").find(i => i.toString().includes("window.postMessage"));
			if (!ChatRoomMessageForwarder || !AccountBeepForwarder) {
				throw new Error("Failed to patch for Bondage Club Tools!");
			}
			ServerSocket.off("ChatRoomMessage", ChatRoomMessageForwarder);
			ServerSocket.on("ChatRoomMessage", data => {
				if (data?.Type !== "Hidden" || data.Content !== "BCXMsg" || typeof data.Sender !== "number") {
					ChatRoomMessageForwarder(data);
				}
			});
			ServerSocket.off("AccountBeep", AccountBeepForwarder);
			ServerSocket.on("AccountBeep", (data: any) => {
				if (typeof data?.BeepType !== "string" || !["Leash", "BCX"].includes(data.BeepType) || !isObject(data.Message?.BCX)) {
					AccountBeepForwarder(data);
				}
			});
		}
	}

	//#endregion
	console.log("CHECKING ENABLED MODULES AGAINST FORBIDDEN LIST");
	console.log("---> Waiting 10s for the initialization of modules");
	const waitForModulesInit = () => {
		const enabledForbiddenMods: string[] = detectForbiddenOtherMods();
		if (enabledForbiddenMods.length>0) {
			alert("Found forbidden BC modules. Please disable them first!");
			console.log("Found forbidden BC modules. Please disable them first!");
			InfoBeep("HardCoreClub Found forbidden BC modules. Please disable them first! The list of mods: " + enabledForbiddenMods.toString());
			window.BCX_Loaded = false;
			window.close();
			unload();
		}
	};

	BCX_setInterval(waitForModulesInit, 10000);

	window.BCX_Loaded = true;
	InfoBeep(`HardCoreClub loaded! Version: ${VERSION.replace(/-[0-f]+$/i, "")}`);
	console.info(`HardCoreClub loaded! Version: ${VERSION}`);

	checkWCEAntiGarble();

	ctx.end();
}

export function unload(): true {
	unload_patches();
	unload_modules();

	UnloadErrorReporter();

	delete window.BCX_Loaded;
	console.info("BCX: Unloaded.");
	return true;
}

interface wceSettings {
	[index: string]: string | boolean;
}

export function checkWCEAntiGarble(): boolean {

	const settings: wceSettings | null = parseJSON(LZString.decompressFromBase64(Player.ExtensionSettings.FBC));

	const bceKey: string= `bce.settings.${Player?.AccountName}`;
	const localSettings: wceSettings | null = parseJSON(localStorage.getItem(bceKey));

	console.groupCollapsed("WCE AntiGarble");

	if (localSettings) {
		console.log("Local Settings");
		console.log(localSettings);
		if (localSettings.antiGarble) {
			InfoBeep("Talking disabled if WCE AntiGarble activated. Don't cheat!");
			console.groupEnd();
			return true;
		}
	}

	if (settings) {
		console.log("Remote Settings");
		console.log(settings);

		if (settings.antiGarble === "true") {
			console.log("Found antiGarble enabled (" + settings.antiGarble + ")");
			console.groupEnd();
			return true;
		}
		console.groupEnd();
		return false;
	}
	console.groupEnd();
	return false;
}

export function parseJSON<T>(jsonString: string | null): T | null {
	if (jsonString === null) {
		return null;
	}
	try {
		return JSON.parse(jsonString) as T;
	} catch (e) {
		console.error("parsing JSON", e);
		return null;
	}
}
