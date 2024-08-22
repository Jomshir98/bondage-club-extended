import { InfoBeep, init_findBCXSource } from "./utilsClub";
import { hookFunction } from "./patching";
import { init, loginInit } from "./main";
import { isObject } from "./utils";
import { SENTRY_CONFIG } from "./config";

import "./modules";

import * as Sentry from "@sentry/browser";

Sentry.init(SENTRY_CONFIG);

function initWait() {
	console.debug("StrixtBCX: Init wait");
	if (CurrentScreen == null || CurrentScreen === "Login") {
		hookFunction("LoginResponse", 0, (args, next) => {
			console.debug("StrictBCX: Init LoginResponse caught", args);
			next(args);
			const response = args[0];
			if (isObject(response) && typeof response.Name === "string" && typeof response.AccountName === "string") {
				loginInit(args[0]);
			}
		});
		InfoBeep(`StrictBCX Ready!`);
		console.log(`StrictBCX Ready!`);
		Sentry.captureMessage("StrictBCX loaded");
	} else {
		console.debug("StrictBCX: Already logged in, init");
		init();
	}
}

init_findBCXSource();
initWait();
