import { InfoBeep, init_findBCXSource } from "./utilsClub";
import { hookFunction } from "./patching";
import { init, loginInit } from "./main";
import { isObject } from "./utils";


import "./modules";



function initWait() {
	console.debug("HardCoreClub: Init wait");
	if (CurrentScreen == null || CurrentScreen === "Login") {
		hookFunction("LoginResponse", 0, (args, next) => {
			console.debug("HardCoreClub: Init LoginResponse caught", args);
			next(args);
			const response = args[0];
			if (isObject(response) && typeof response.Name === "string" && typeof response.AccountName === "string") {
				loginInit(args[0]);
			}
		});
		InfoBeep(`HardCoreClub Ready!`);
		console.log(`HardCoreClub Ready!`);
	} else {
		console.debug("HardCoreClub: Already logged in, init");
		init();
	}
}

init_findBCXSource();
initWait();
