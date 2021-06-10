import { VERSION, VERSION_CHECK_BOT } from "./config";
import { hiddenBeepHandlers, sendHiddenBeep } from "./messaging";
import { isObject } from "./utils";

let nextCheckTimer: number | null = null;

function sendVersionCheckBeep(): void {
	if (nextCheckTimer !== null) {
		clearTimeout(nextCheckTimer);
		nextCheckTimer = null;
	}

	sendHiddenBeep("versionCheck", {
		version: VERSION,
		UA: window.navigator.userAgent
	}, VERSION_CHECK_BOT, true);

	// Set check retry timer to 5 minutes
	nextCheckTimer = setTimeout(sendVersionCheckBeep, 5 * 60_000);
}

export function init_versionCheck(): void {
	hiddenBeepHandlers.set("versionResponse", (sender, message: BCX_beep_versionResponse) => {
		if (sender !== VERSION_CHECK_BOT) {
			console.warn(`BCX: got versionResponse from unexpected sender ${sender}, ignoring`);
			return;
		}
		if (!isObject(message) || typeof message.status !== "string") {
			console.warn(`BCX: bad versionResponse`, message);
			return;
		}

		// Got valid version response, reset timer to 15 minutes
		if (nextCheckTimer !== null) {
			clearTimeout(nextCheckTimer);
		}
		nextCheckTimer = setTimeout(sendVersionCheckBeep, 15 * 60_000);

		if (message.status === "current") {
			return;
		} else if (message.status === "newAvailable") {
			// TODO
		} else if (message.status === "deprecated") {
			// TODO
		} else if (message.status === "unsupported") {
			// TODO
		} else {
			console.warn(`BCX: bad versionResponse status "${message.status}"`);
		}
	});

	sendVersionCheckBeep();
}
