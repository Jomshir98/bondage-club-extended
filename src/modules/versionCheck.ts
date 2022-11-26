import { VERSION, VERSION_CHECK_BOT } from "../config";
import { hiddenBeepHandlers, sendHiddenBeep } from "./messaging";
import { BaseModule } from "./_BaseModule";
import { isObject } from "../utils";
import { BCX_setTimeout } from "../BCXContext";
import { BCXSource, BCXSourceExternal, ChatRoomSendLocal, InfoBeep } from "../utilsClub";
import { unload } from "../main";
import { modStorage } from "./storage";
import { announceSelf } from "./chatroom";
import { hookFunction } from "../patching";

let nextCheckTimer: number | null = null;
export let versionCheckNewAvailable: boolean | null = null;
let versionCheckDidNotify = false;

export let supporterStatus: BCXSupporterType;
export let supporterSecret: undefined | string;

export function setSupporterVisible(visible: boolean): void {
	if (visible === !modStorage.supporterHidden)
		return;
	if (visible) {
		delete modStorage.supporterHidden;
	} else {
		modStorage.supporterHidden = true;
	}
	announceSelf();
}

export const otherSupporterStatus: Map<number, {
	verified: boolean;
	status: BCXSupporterType;
	secret: string | undefined;
}> = new Map();

export function updateOtherSupporterStatus(memberNumber: number, status: BCXSupporterType, secret: string | undefined): void {
	if (memberNumber === Player.MemberNumber)
		return;
	const current = otherSupporterStatus.get(memberNumber);
	if (current && current.secret === status && current.secret === secret && current.verified)
		return;
	if (status && secret) {
		otherSupporterStatus.set(memberNumber, {
			verified: status === undefined,
			status,
			secret
		});
		if (status && secret) {
			sendHiddenBeep("supporterCheck", {
				memberNumber,
				status,
				secret
			}, VERSION_CHECK_BOT, true);
		}
	} else {
		otherSupporterStatus.delete(memberNumber);
	}
}

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

	// Set check retry timer to 5 minutes + up to minute random delay
	nextCheckTimer = BCX_setTimeout(sendVersionCheckBeep, (5 + Math.random()) * 60_000);
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

			// Got valid version response, reset timer to 15 minutes + up to 5 minutes random delay
			if (nextCheckTimer !== null) {
				clearTimeout(nextCheckTimer);
				nextCheckTimer = null;
			}
			nextCheckTimer = BCX_setTimeout(sendVersionCheckBeep, (15 + 5 * Math.random()) * 60_000);

			if (message.status === "current") {
				versionCheckNewAvailable = false;
			} else if (message.status === "newAvailable") {
				versionCheckNewAvailable = true;
				if (!versionCheckDidNotify) {
					versionCheckDidNotify = true;

					if (ServerPlayerIsInChatRoom()) {
						ChatRoomSendLocal("New BCX version is available! You can upgrade by logging in again.");
					} else {
						InfoBeep("New BCX version is available! You can upgrade by logging in again.", 10_000);
					}
				}
			} else if (message.status === "deprecated") {
				versionCheckNewAvailable = true;

				if (!versionCheckDidNotify) {
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
				}
			} else if (message.status === "unsupported") {
				unload();
				alert("The BCX version you are trying to load is too old and either contains critical bugs or " +
					"is no longer compatible with the current Bondage Club release version. Please update your BCX.");
			} else {
				console.warn(`BCX: bad versionResponse status "${message.status}"`);
			}

			if (supporterStatus !== message.supporterStatus || supporterSecret !== message.supporterSecret) {
				supporterStatus = message.supporterStatus;
				supporterSecret = message.supporterSecret;
				announceSelf();
			}
		});

		hiddenBeepHandlers.set("supporterCheckResult", (sender, message: BCX_beeps["supporterCheckResult"]) => {
			if (sender !== VERSION_CHECK_BOT) {
				console.warn(`BCX: got supporterCheckResult from unexpected sender ${sender}, ignoring`);
				return;
			}
			if (!isObject(message) || typeof message.memberNumber !== "number" || (message.status !== undefined && typeof message.status !== "string")) {
				console.warn(`BCX: bad supporterCheckResult`, message);
				return;
			}
			const status = otherSupporterStatus.get(message.memberNumber);
			if (!status) {
				console.warn(`BCX: supporterCheckResult unknown memberNumber`, message);
				return;
			}
			status.status = message.status;
			status.verified = true;
		});

		hookFunction("LoginResponse", 0, (args, next) => {
			next(args);

			const response = args[0];
			if (isObject(response) && typeof response.Name === "string" && typeof response.AccountName === "string") {
				sendVersionCheckBeep();
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
