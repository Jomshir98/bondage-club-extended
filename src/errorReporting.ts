import { VERSION } from "./config";
import { ModuleCategory, ModuleInitPhase } from "./constants";
import { moduleInitPhase } from "./moduleManager";
import { ConditionsGetCategoryData, ConditionsGetCategoryEnabled } from "./modules/conditions";
import { getDisabledModules } from "./modules/presets";
import { firstTimeInit } from "./modules/storage";
import { getPatchedFunctionsHashes } from "./patching";
import { detectOtherMods } from "./utilsClub";

const MAX_STACK_SIZE = 15;

let firstError = true;

export function debugGenerateReport(): string {
	let res = `----- Debug report -----\n`;
	res += `Location: ${window.location.href.replace(/\d{4,}/g, "<numbers>")}\n`;
	res += `UA: ${window.navigator.userAgent}\n`;
	res += `BC Version: ${GameVersion}\n`;
	res += `BCX Version: ${VERSION}\n`;

	const otherMods = Object.entries(detectOtherMods()).filter(i => i[1]);
	if (otherMods.length > 0) {
		res += `Other detected mods:\n` +
			otherMods
				.map(i => `  - ${i[0]}` + (typeof i[1] !== "boolean" ? `: ${i[1]}` : "") + "\n");
	} else {
		res += `No other mods detected.\n`;
	}

	res += `\n----- BCX report -----\n`;
	res += `Init state: ${ModuleInitPhase[moduleInitPhase]}\n`;
	res += `First init: ${firstTimeInit}\n`;
	res += `Disabled modules: ${getDisabledModules().map(i => ModuleCategory[i]).join(", ") || "[None]"}\n`;
	if (ConditionsGetCategoryEnabled("curses")) {
		res += `Curses: ${Object.keys(ConditionsGetCategoryData("curses").conditions).join(", ") || "[None]"}\n`;
	}
	if (ConditionsGetCategoryEnabled("rules")) {
		res += `Rules: ${Object.keys(ConditionsGetCategoryData("rules").conditions).join(", ") || "[None]"}\n`;
	}

	res += `\n----- BC state report -----\n`;
	res += `Connected to server: ${ServerIsConnected}\n`;
	res += `Screen: ${CurrentModule}/${CurrentScreen}\n`;
	res += `In chatroom: ${ServerPlayerIsInChatRoom()}\n`;
	res += `GLVersion: ${GLVersion}\n`;

	res += `\n----- Patching report -----\n`;
	const unexpectedHashes = getPatchedFunctionsHashes(false);
	if (unexpectedHashes.length > 0) {
		res += `Patched functions with unknown checksums:\n` +
			unexpectedHashes.map(i => `${i[0]}: ${i[1]}\n`).join("");
	} else {
		res += `No warnings.\n`;
	}

	return res;
}

export function cleanupErrorLocation(location: string): string {
	return location
		.replaceAll(window.location.href.substr(0, window.location.href.lastIndexOf("/")), "<url>")
		.replace(/https:\/\/[^?/]+\/([^?]+)?bcx.js(?=$|\?|:)/, "<bcx>")
		.replace(/\/\d{4,}\.html/, "/<numbers>.html")
		.replace(/[?&]_=\d+(?=$|&|:)/, "");
}

export function debugPrettifyError(error: unknown): string {
	if (error instanceof Error) {
		let stack = `${error.stack}`.split("\n");
		if (stack.length > MAX_STACK_SIZE) {
			stack = stack.slice(0, MAX_STACK_SIZE).concat("    ...");
		}
		return stack.map(cleanupErrorLocation).join("\n");
	}
	return `${error}`;
}

export function debugGenerateReportErrorEvent(event: ErrorEvent): string {
	let res = `----- UNHANDLED ERROR -----\n` +
		`Message: ${event.message}\n` +
		`Source: ${cleanupErrorLocation(event.filename)}:${event.lineno}:${event.colno}\n`;

	res += debugPrettifyError(event.error) + "\n\n";

	res += debugGenerateReport();

	return res;
}

export function showErrorOverlay(title: string, description: string, contents: string, wrapCodeBlock: boolean = true): void {
	console.info("Error overlay displayed\n", contents);

	if (wrapCodeBlock) {
		contents = '```\n' + contents.trim() + '\n```';
	}

	const overlay = document.createElement("div");
	overlay.style.position = "fixed";
	overlay.style.top = "0px";
	overlay.style.right = "0px";
	overlay.style.bottom = "0px";
	overlay.style.left = "0px";
	overlay.style.background = "#00000090";

	// Nice window
	const win = document.createElement("div");
	overlay.appendChild(win);
	win.style.position = "absolute";
	win.style.top = "5%";
	win.style.right = "5%";
	win.style.bottom = "5%";
	win.style.left = "5%";
	win.style.background = "white";
	win.style.display = "flex";
	win.style.flexDirection = "column";
	win.style.padding = "1em";

	// Title
	const titleElem = document.createElement("h1");
	win.appendChild(titleElem);
	titleElem.innerText = title;

	// Description
	const descriptionElement = document.createElement("p");
	win.appendChild(descriptionElement);
	descriptionElement.innerText = description;

	// Copy button
	const copy = document.createElement("button");
	win.appendChild(copy);
	copy.innerText = "Copy report";

	// Content
	const contentElem = document.createElement("textarea");
	win.appendChild(contentElem);
	contentElem.readOnly = true;
	contentElem.value = contents;
	contentElem.style.flex = "1";
	contentElem.style.margin = "0.5em 0";

	copy.onclick = () => {
		contentElem.focus();
		contentElem.select();

		if (navigator.clipboard) {
			navigator.clipboard.writeText(contentElem.value);
		} else {
			try {
				document.execCommand('copy');
			} catch (err) {
				/* Ignore */
			}
		}
	};

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

export function onUnhandledError(event: ErrorEvent) {
	if (!firstError)
		return;
	firstError = false;
	// Display error window
	showErrorOverlay(
		"BCX Crash Handler",
		"The BCX Crash Handler detected an uncaught error, which most likely crashed the Bondage Club.\n" +
		"While reporting this error, please use the information below to help us find the source faster.\n" +
		"You can use the 'Close' button at the bottom to continue, however BC may no longer work correctly until you reload the current tab.",
		debugGenerateReportErrorEvent(event)
	);
}

export function InitErrorReporter() {
	window.addEventListener("error", onUnhandledError);
}

export function UnloadErrorReporter() {
	window.removeEventListener("error", onUnhandledError);
}
