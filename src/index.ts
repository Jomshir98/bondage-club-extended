import { InfoBeep } from "./utilsClub";
import { hookFunction } from "./patching";
import { init, loginInit } from "./main";

import "./modules";

async function initWait() {
	if (CurrentScreen == null || CurrentScreen === "Login") {
		hookFunction("LoginResponse", 0, (args, next) => {
			next(args);
			loginInit(args[0]);
		});
		InfoBeep(`BCX Ready!`);
	} else {
		init();
	}
}

initWait();
