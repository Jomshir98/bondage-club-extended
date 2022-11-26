import { detectOtherMods, InfoBeep } from "./utilsClub";
import { VERSION } from "./config";
import { init_modules, moduleInitPhase, unload_modules } from "./moduleManager";
import { hookFunction, unload_patches } from "./patching";
import { isObject } from "./utils";
import { InitErrorReporter, UnloadErrorReporter } from "./errorReporting";
import { debugContextStart, SetLoadedBeforeLogin } from "./BCXContext";
import { ModuleInitPhase } from "./constants";

export function loginInit(C: any) {
	if (window.BCX_Loaded || moduleInitPhase !== ModuleInitPhase.construct)
		return;
	SetLoadedBeforeLogin(C);
	init();
}

function clearCaches() {
	if (typeof DrawRunMap !== "undefined") {
		DrawRunMap.clear();
		DrawScreen = "";
	}
	if (typeof CurrentScreenFunctions !== "undefined") {
		const w = window as any;
		CurrentScreenFunctions = {
			Run: w[`${CurrentScreen}Run`],
			Click: w[`${CurrentScreen}Click`],
			Load: typeof w[`${CurrentScreen}Load`] === "function" ? w[`${CurrentScreen}Load`] : undefined,
			Unload: typeof w[`${CurrentScreen}Unload`] === "function" ? w[`${CurrentScreen}Unload`] : undefined,
			Resize: typeof w[`${CurrentScreen}Resize`] === "function" ? w[`${CurrentScreen}Resize`] : undefined,
			KeyDown: typeof w[`${CurrentScreen}KeyDown`] === "function" ? w[`${CurrentScreen}KeyDown`] : undefined,
			Exit: typeof w[`${CurrentScreen}Exit`] === "function" ? w[`${CurrentScreen}Exit`] : undefined
		};
	}
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
	clearCaches();

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
			ServerSocket.on("AccountBeep", data => {
				if (typeof data?.BeepType !== "string" || !["Leash", "BCX"].includes(data.BeepType) || !isObject(data.Message?.BCX)) {
					AccountBeepForwarder(data);
				}
			});
		}
	}

	//#endregion

	window.BCX_Loaded = true;
	InfoBeep(`BCX loaded! Version: ${VERSION.replace(/-[0-f]+$/i, "")}`);
	console.log(`BCX loaded! Version: ${VERSION}`);

	ctx.end();
}

export function unload(): true {
	unload_patches();
	unload_modules();

	UnloadErrorReporter();

	// clear some caches
	clearCaches();

	delete window.BCX_Loaded;
	console.log("BCX: Unloaded.");
	return true;
}
