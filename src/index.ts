import { InfoBeep } from "./utilsClub";
import { hookFunction } from "./patching";
import { init, loginInit } from "./main";
import { isObject } from "./utils";

import "./modules";

async function initWait() {
	if (CurrentScreen == null || CurrentScreen === "Login") {
		hookFunction("LoginResponse", 0, (args, next) => {
			next(args);
			const response = args[0];
			if (isObject(response) && typeof response.Name === "string" && typeof response.AccountName === "string") {
				loginInit(args[0]);
			}
		});
		InfoBeep(`BCX Ready!`);
		console.log(`BCX Ready!`);
	} else {
		init();
	}
}

initWait();
