import { VERSION, VERSION_CHECK_BOT } from "../config";
import { hiddenBeepHandlers, sendHiddenBeep } from "./messaging";
import { BaseModule } from "./_BaseModule";
import { isObject } from "../utils";
import { BCX_setTimeout } from "../BCXContext";
import { BCXSource, BCXSourceExternal, ChatRoomSendLocal, InfoBeep } from "../utilsClub";
import { unload } from "../main";

let nextCheckTimer: number | null = null;
export let versionCheckNewAvailable: boolean | null = null;
let versionCheckDidNotify = false;

function sendVersionCheckBeep(): void {
	if (nextCheckTimer !== null) {
		clearTimeout(nextCheckTimer);
		nextCheckTimer = null;
	}

	sendHiddenBeep("versionCheck", {
		version: VERSION,
		devel: BCX_DEVEL,
		GameVersion,
		Source: (BCXSourceExternal ? "E:" : "") + (BCXSource ?? "[UNKNOWN]"),
		UA: window.navigator.userAgent
	}, VERSION_CHECK_BOT, true);

	// Set check retry timer to 5 minutes
	nextCheckTimer = BCX_setTimeout(sendVersionCheckBeep, 5 * 60_000);
}

export class ModuleVersionCheck extends BaseModule {
	load() {
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
			nextCheckTimer = BCX_setTimeout(sendVersionCheckBeep, 15 * 60_000);

			if (message.status === "current") {
				versionCheckNewAvailable = false;
				return;
			} else if (message.status === "newAvailable") {
				versionCheckNewAvailable = true;
				if (versionCheckDidNotify)
					return;
				versionCheckDidNotify = true;

				if (ServerPlayerIsInChatRoom()) {
					ChatRoomSendLocal("New BCX version is available! You can upgrade by logging in again.");
				} else {
					InfoBeep("New BCX version is available! You can upgrade by logging in again.", 10_000);
				}
			} else if (message.status === "deprecated") {
				versionCheckNewAvailable = true;

				if (versionCheckDidNotify)
					return;
				versionCheckDidNotify = true;

				const overlay = document.createElement("div");
				overlay.style.position = "fixed";
				overlay.style.top = "0px";
				overlay.style.right = "0px";
				overlay.style.bottom = "0px";
				overlay.style.left = "0px";
				overlay.style.background = "#00000090";
				overlay.style.display = "flex";
				overlay.style.alignItems = "center";
				overlay.style.justifyContent = "center";

				// Nice window
				const win = document.createElement("div");
				overlay.appendChild(win);
				win.style.background = "white";
				win.style.display = "flex";
				win.style.flexDirection = "column";
				win.style.padding = "1em";

				// Title
				const titleElem = document.createElement("h1");
				win.appendChild(titleElem);
				titleElem.innerText = "Deprecated BCX version";

				// Description
				const descriptionElement = document.createElement("p");
				win.appendChild(descriptionElement);
				descriptionElement.innerText = "The BCX version you are using is too old and either contains critical bugs or " +
					"is no longer compatible with the current Bondage Club release version.\n" +
					"Unless you are using additional mods preventing this, please refresh the page and log into the club again to load the newest version.";

				// Close button
				const close = document.createElement("button");
				win.appendChild(close);
				close.innerText = "Close";
				close.onclick = () => {
					overlay.remove();
				};

				// Display it
				(document.activeElement as HTMLElement)?.blur?.();
				window.document.body.appendChild(overlay);
			} else if (message.status === "unsupported") {
				unload();
				alert("The BCX version you are trying to load is too old and either contains critical bugs or " +
					"is no longer compatible with the current Bondage Club release version. Please update your BCX.");
			} else {
				console.warn(`BCX: bad versionResponse status "${message.status}"`);
			}
		});
	}

	run() {
		sendVersionCheckBeep();
	}

	unload() {
		if (nextCheckTimer !== null) {
			clearTimeout(nextCheckTimer);
			nextCheckTimer = null;
		}
	}
}
