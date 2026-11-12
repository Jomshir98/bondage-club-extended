import { InfoBeep, init_findBCXSource, bcVersionGreaterThan } from "./utilsClub";
import { hookFunction, unloadBCX } from "./patching";
import { init, loginInit } from "./main";
import { isObject } from "./utils";

import "./modules";

function initWait() {
	console.debug("BCX: Init wait");
	if (typeof globalThis.GameVersion !== "string") {
		// Precaution against `GameVersion` formatting screw ups in BC
		unloadBCX(`Detected an invalid BC version: "${globalThis.GameVersion}"`);
		return;
	} else if (!bcVersionGreaterThan(GameVersion, BC_VERSION_MIN)) {
		unloadBCX(`BCX "${BCX_VERSION}" requires BC "${BC_VERSION_MIN}" or later\nDetected BC version: "${GameVersion}"`);
		return;
	}

	if (CurrentScreen == null || CurrentScreen === "Login") {
		hookFunction("LoginResponse", 0, (args, next) => {
			console.debug("BCX: Init LoginResponse caught", args);
			next(args);
			const response = args[0];
			if (isObject(response) && typeof response.Name === "string" && typeof response.AccountName === "string") {
				loginInit(args[0]);
			}
		});
		InfoBeep(`BCX Ready!`);
		console.log(`BCX Ready!`);
	} else {
		console.debug("BCX: Already logged in, init");
		init();
	}
}

init_findBCXSource();
initWait();
