import { contextInBCXArea, debugContextStart, debugMakeContextReport } from "./BCXContext";
import { VERSION } from "./config";
import { ModuleCategory, ModuleInitPhase } from "./constants";
import { moduleInitPhase } from "./moduleManager";
import { ConditionsGetCategoryData, ConditionsGetCategoryEnabled } from "./modules/conditions";
import { getDisabledModules } from "./modules/presets";
import { firstTimeInit } from "./modules/storage";
import { getPatchedFunctionsHashes, hookFunction } from "./patching";
import { detectOtherMods } from "./utilsClub";

const MAX_STACK_SIZE = 15;

let firstError = true;

let lastReceivedMessageType = "";
let lastReceivedMessageTime = 0;
let lastSentMessageType = "";
let lastSentMessageTime = 0;

let logServerMessages = false;
export function debugSetLogServerMessages(value: boolean): void {
	logServerMessages = value;
}

export function debugGenerateReport(includeBCX: boolean = true): string {
	let res = `----- Debug report -----\n`;
	res += `Location: ${window.location.href.replace(/\d{4,}/g, "<numbers>")}\n`;
	res += `UA: ${window.navigator.userAgent}\n`;
	res += `BC Version: ${GameVersion}\n`;
	res += `BCX Version: ${VERSION}\n`;

	const otherMods = Object.entries(detectOtherMods()).filter(i => i[1]);
	if (otherMods.length > 0) {
		res += `Other detected mods:\n` +
			otherMods
				.map(i => `  - ${i[0]}` + (typeof i[1] !== "boolean" ? `: ${i[1]}` : "") + "\n")
				.join("");
	} else {
		res += `No other mods detected.\n`;
	}

	const now = Date.now();

	res += `\n----- BC state report -----\n`;
	res += `Mouse position: ${MouseX} ${MouseY}\n`;
	res += `Connected to server: ${ServerIsConnected}\n`;
	res += `Local time: ${now}\n`;
	res += `Server time: ${CurrentTime} (diff: ${(CurrentTime - now).toFixed(2)})\n`;
	res += `Screen: ${CurrentModule}/${CurrentScreen}\n`;
	res += `In chatroom: ${ServerPlayerIsInChatRoom()}\n`;
	res += `GLVersion: ${GLVersion}\n`;
	res += `Last received message: ${lastReceivedMessageType} (${lastReceivedMessageTime})\n`;
	res += `Last sent message: ${lastSentMessageType} (${lastSentMessageTime})\n`;

	if (includeBCX) {
		res += `\n----- BCX report -----\n`;
		res += `Init state: ${ModuleInitPhase[moduleInitPhase]}\n`;
		res += `First init: ${firstTimeInit}\n`;
		res += `Disabled modules: ${getDisabledModules().map(i => ModuleCategory[i]).join(", ") || "[None]"}\n`;
		try {
			if (ConditionsGetCategoryEnabled("curses")) {
				res += `Curses: ${Object.keys(ConditionsGetCategoryData("curses").conditions).join(", ") || "[None]"}\n`;
			}
		} catch (error) {
			res += `ERROR getting Curses data: ${debugPrettifyError(error)}\n`;
		}
		try {
			if (ConditionsGetCategoryEnabled("rules")) {
				res += `Rules: ${Object.keys(ConditionsGetCategoryData("rules").conditions).join(", ") || "[None]"}\n`;
			}
		} catch (error) {
			res += `ERROR getting Rules data: ${debugPrettifyError(error)}\n`;
		}
	}

	// Patching report

	const unexpectedHashes = getPatchedFunctionsHashes(false);

	if (unexpectedHashes.length > 0) {
		res += `\n----- Patching report -----\n`;
		if (unexpectedHashes.length > 0) {
			res += `Patched functions with unknown checksums:\n` +
				unexpectedHashes.map(i => `${i[0]}: ${i[1]}\n`).join("");
		}
	} else if (includeBCX) {
		res += `\n----- Patching report -----\n`;
		res += `No warnings.\n`;
	}

	return res;
}

export function cleanupErrorLocation(location: string): string {
	return location
		.replaceAll(window.location.href.substring(0, window.location.href.lastIndexOf("/")), "<url>")
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
	const inBCX = contextInBCXArea();

	let res = `----- UNHANDLED ERROR (${inBCX ? "IN BCX" : "OUTSIDE OF BCX"}) -----\n` +
		`Message: ${event.message}\n` +
		`Source: ${cleanupErrorLocation(event.filename)}:${event.lineno}:${event.colno}\n`;

	res += debugPrettifyError(event.error) + "\n\n";

	res += debugMakeContextReport();

	try {
		res += "\n" + debugGenerateReport(inBCX);
	} catch (error) {
		res += `----- Debug report -----\nERROR GENERATING DEBUG REPORT!\n${debugPrettifyError(error)}`;
	}

	return res;
}

export function showErrorOverlay(title: string, description: string, contents: string, wrapCodeBlock: boolean = true): void {
	console.info("Error overlay displayed\n", contents);

	if (wrapCodeBlock) {
		contents = "```\n" + contents.trim() + "\n```";
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
	descriptionElement.innerHTML = description;

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
				document.execCommand("copy");
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
	const inBCX = contextInBCXArea();
	// Display error window
	showErrorOverlay(
		"Crash Handler (by BCX)",
		"The Crash Handler provided by BCX detected an uncaught error, which most likely crashed the Bondage Club.<br />" +
		"While reporting this error, please use the information below to help us find the source faster.<br />" +
		"You can use the 'Close' button at the bottom to continue, however BC may no longer work correctly until you reload the current tab." +
		(
			inBCX ?
				"<p>Whoops... seems like BCX might be to blame this time. Could you please help us by submitting the report below to the <a href='https://discord.gg/SHJMjEh9VH' target='_blank'>BC Scripting Community Discord</a> server?<br />Thank you!</p>" :
				"<br /><h3>The error seems NOT to come from BCX!</h3> Please submit the report to <a href='https://discord.gg/dkWsEjf' target='_blank'>Bondage Club's Discord</a> server instead!"),
		debugGenerateReportErrorEvent(event)
	);
}

// Server message origin
let originalSocketEmit: undefined | ((...args: any[]) => any);
function bcxSocketEmit(this: any, ...args: any[]) {
	const message = Array.isArray(args[0]) && typeof args[0][0] === "string" ? args[0][0] : "[unknown]";
	lastReceivedMessageType = message;
	lastReceivedMessageTime = Date.now();

	const parameters = Array.isArray(args[0]) ? args[0].slice(1) : [];
	if (logServerMessages) {
		console.log("\u2B07 Receive", message, ...parameters);
	}

	const ctx = debugContextStart(`Server message ${message}`, {
		root: true,
		bcxArea: false,
		extraInfo() {
			return `Event: ${message}\n` + parameters.map(i => JSON.stringify(i, undefined, "  ")).join("\n");
		}
	});
	const res = originalSocketEmit?.apply(this, args);
	ctx.end();
	return res;
}

// Click origin
let originalClick: undefined | ((event: MouseEvent) => void);
function bcxClick(this: any, event: MouseEvent) {
	const ctx = debugContextStart(`Canvas click`, {
		root: true,
		bcxArea: false,
		extraInfo: () => `X: ${MouseX}\nY: ${MouseY}`
	});
	const res = originalClick?.call(this, event);
	ctx.end();
	return res;
}

export function InitErrorReporter() {
	window.addEventListener("error", onUnhandledError);
	// Server message origin
	if (originalSocketEmit === undefined && typeof (ServerSocket as any)?.__proto__?.emitEvent === "function") {
		originalSocketEmit = (ServerSocket as any).__proto__.emitEvent;
		(ServerSocket as any).__proto__.emitEvent = bcxSocketEmit;
	}

	const canvas = document.getElementById("MainCanvas") as (HTMLCanvasElement | undefined);
	if (canvas) {
		// Click origin
		if (originalClick === undefined && typeof canvas.onclick === "function") {
			originalClick = canvas.onclick;
			canvas.onclick = bcxClick;
		}
	}

	hookFunction("ServerSend", 0, (args, next) => {
		lastSentMessageType = args[0];
		lastSentMessageTime = Date.now();
		if (logServerMessages) {
			console.log("\u2B06 Send", ...args);
		}
		return next(args);
	});
}

export function UnloadErrorReporter() {
	window.removeEventListener("error", onUnhandledError);
	// Server message origin
	if (originalSocketEmit && (ServerSocket as any).__proto__.emitEvent === bcxSocketEmit) {
		(ServerSocket as any).__proto__.emitEvent = originalSocketEmit;
		originalSocketEmit = undefined;
	}
	const canvas = document.getElementById("MainCanvas") as (HTMLCanvasElement | undefined);
	// Click origin
	if (canvas && originalClick && canvas.onclick === bcxClick) {
		canvas.onclick = originalClick;
		originalClick = undefined;
	}
}
