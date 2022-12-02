import { BCX_setInterval, BCX_setTimeout, contextCurrentModArea, debugContextStart, debugMakeContextReport } from "./BCXContext";
import { VERSION, SUPPORTED_BC_VERSIONS } from "./config";
import { ModuleCategory, ModuleInitPhase } from "./constants";
import { moduleInitPhase } from "./moduleManager";
import { ConditionsGetCategoryData, ConditionsGetCategoryEnabled } from "./modules/conditions";
import { getDisabledModules } from "./modules/presets";
import { firstTimeInit, modStorage, modStorageSync } from "./modules/storage";
import { getPatchedFunctionsHashes, hookFunction } from "./patching";
import { detectOtherMods } from "./utilsClub";
import { crc32 } from "./utils";

import bcModSDK from "bondage-club-mod-sdk";

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
	res += `ModSDK Version: ${bcModSDK.version}\n`;

	res += `Mods:\n` +
		bcModSDK.getModsInfo()
			.map(mod => `  - ${mod.fullName} (${mod.name}): ${mod.version}\n` + (mod.repository ? `    repository: ${mod.repository}\n` : ""))
			.join("");

	const otherMods = Object.entries(detectOtherMods()).filter(i => i[1]);
	if (otherMods.length > 0) {
		res += `Detected legacy mods (NOT USING ModSDK):\n` +
			otherMods
				.map(i => `  - ${i[0]}` + (typeof i[1] !== "boolean" ? `: ${i[1]}` : "") + "\n")
				.join("");
	} else {
		res += `No known legacy mods detected.\n`;
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
		res += `Version: ${VERSION}\n`;
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

	// SDK report
	res += "\n" + debugGenerateSDKReport(includeBCX);

	return res;
}

export function debugGenerateSDKReport(verbose: boolean = false): string {
	let res = `----- ModSDK report -----\n`;
	const patchingInfo = Array.from(bcModSDK.getPatchingInfo().values());
	let hadWarnings = false;

	const overwrittenFunctions = patchingInfo.filter(fn => fn.currentEntrypoint !== fn.sdkEntrypoint);
	if (overwrittenFunctions.length > 0) {
		hadWarnings = true;
		res += `Functions overwritten by non-ModSDK mods:\n` +
			overwrittenFunctions.map(fn => `  - ${fn.name}: ${crc32(fn.currentEntrypoint?.toString().replaceAll("\r\n", "\n") ?? "")}\n`).join("");
	}

	if (!hadWarnings) {
		res += `No warnings.\n`;
	}

	const unexpectedHashes = getPatchedFunctionsHashes(false);
	if (unexpectedHashes.length > 0 && (verbose || SUPPORTED_BC_VERSIONS.includes(GameVersion))) {
		res += `\n----- BCX Patching report -----\n`;
		if (unexpectedHashes.length > 0) {
			res += `Patched functions with unknown checksums:\n` +
				unexpectedHashes.map(i => `  - ${i[0]}: ${i[1]}\n`).join("");
		}
	} else if (verbose) {
		res += `\n----- BCX Patching report -----\n`;
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
	const currentMod = contextCurrentModArea();

	let res = `----- UNHANDLED ERROR ${currentMod != null ? `(IN ${currentMod || "BC"}) ` : ""}-----\n` +
		`Message: ${event.message}\n` +
		`Source: ${cleanupErrorLocation(event.filename)}:${event.lineno}:${event.colno}\n`;

	res += debugPrettifyError(event.error) + "\n\n";

	res += debugMakeContextReport();

	try {
		res += "\n" + debugGenerateReport(currentMod === "BCX");
	} catch (error) {
		res += `----- Debug report -----\nERROR GENERATING DEBUG REPORT!\n${debugPrettifyError(error)}`;
	}

	return res;
}

export function showErrorOverlay(
	title: string,
	description: string,
	contents: string,
	wrapCodeBlock: boolean = true,
	minTimeout?: number,
	preContentHook?: (win: HTMLDivElement) => void
): void {
	console.info("Error overlay displayed\n", contents);

	if (wrapCodeBlock) {
		contents = "```\n" + contents.trim() + "\n```";
	}

	const overlay = document.createElement("div");
	overlay.style.position = "fixed";
	overlay.style.inset = "0px";
	overlay.style.zIndex = "999999";
	overlay.style.background = "#00000090";

	// Nice window
	const win = document.createElement("div");
	overlay.appendChild(win);
	win.style.position = "absolute";
	win.style.inset = "5%";
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

	const contentElem = document.createElement("textarea");

	// Copy button
	if (preContentHook) {
		preContentHook(win);
	} else {
		const copy = document.createElement("button");
		copy.style.cursor = "pointer";
		win.appendChild(copy);
		copy.innerText = "Copy report";

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
	}

	// Content
	win.appendChild(contentElem);
	contentElem.readOnly = true;
	contentElem.value = contents;
	contentElem.style.flex = "1";
	contentElem.style.margin = "0.5em 0";

	// Close button
	let timeout = minTimeout ?? 0;
	const close = document.createElement("button");
	win.appendChild(close);
	close.onclick = () => {
		if (timeout > 0)
			return;
		overlay.remove();
	};
	const updateCloseButton = () => {
		close.innerText = timeout > 0 ? `Close (${timeout})` : "Close";
		close.disabled = timeout > 0;
		if (timeout > 0) {
			BCX_setTimeout(() => {
				timeout--;
				updateCloseButton();
			}, 1000);
		} else {
			close.style.cursor = "pointer";
		}
	};
	updateCloseButton();

	// Display it
	(document.activeElement as HTMLElement)?.blur?.();
	window.document.body.appendChild(overlay);
}

let compatibilityCheckTimeout: number | undefined;
const COMPATIBILITY_CHECK_INTERVAL = 60_000;
let didReportCompatibilityIssues = false;

export function detectCompatibilityProblems(): void {
	if (didReportCompatibilityIssues || moduleInitPhase !== ModuleInitPhase.ready)
		return;

	const legacyMods = detectOtherMods();
	let result = "";
	let wait = 0;

	if (legacyMods.BcUtil) {
		wait = 5;
		result += `----- BC-Util -----\n` +
			`BCX detected the presence of the incompatible mod BC-Util.\n` +
			`BC-Util is a useful and high quality mod, which has unfortunately not been updated since September 2021 and doesn't use ModSDK.\n` +
			`It isn't compatible with BCX due to that and is known to cause problems, including crashes (especially in the wardrobe).\n` +
			`\n`;
	}

	if (legacyMods.QuickAccessMenu) {
		wait = 5;
		result += `----- Quick Access Menu (QAM) -----\n` +
			`BCX detected the presence of the incompatible mod Quick Access Menu.\n` +
			`Besides not using ModSDK to support compatibility with other mods, it also modifies parts of the game such that it can break parts of BCX's functionality.\n` +
			`Its author has refused multiple times to make the mod more compatible with other mods, causing a fair amount of extra work for other moders (for example BCX & FBC).\n` +
			`Error reports while using QAM will not be acted upon.\n` +
			`\n`;
	}

	if (legacyMods.Curse) {
		result += `----- "Cursed" Script -----\n` +
			`BCX detected the presence of the obsolete mod Cursed script.\n` +
			`Curse is the spiritual predecessor of BCX, and can be considered obsolete since BCX has almost the same features (and much more). Curse is no longer updated since September 2021 and doesn't use ModSDK.\n` +
			`As BCX is meant to supersede Curse, no compatibility can be guaranteed.\n` +
			`\n`;
	}

	const patchingInfo = Array.from(bcModSDK.getPatchingInfo().values());
	const unexpectedHashes = SUPPORTED_BC_VERSIONS.includes(GameVersion) ? getPatchedFunctionsHashes(false) : [];
	const overwrittenFunctions = patchingInfo.filter(fn => fn.currentEntrypoint !== fn.sdkEntrypoint);

	// If no known legacy mods are detected, look for unknown ones where it matters
	if (Array.from(Object.values(legacyMods)).every(v => !v) && (unexpectedHashes.length > 0 || overwrittenFunctions.length > 0)) {
		result += `----- Unknown mod not using ModSDK -----\n` +
			`BCX detected the presence of modifications not done using ModSDK or any known legacy mod.\n` +
			`If you are not author of the mod, please report what mod caused this warning on the BC Scripting Community Discord server: https://discord.gg/SHJMjEh9VH\n` +
			`If you are author of the mod triggering this warning, please modify your mod to use ModSDK: https://github.com/Jomshir98/bondage-club-mod-sdk. Feel free to ask for help doing that on the above-mentioned Discord server.\n` +
			`\n`;

	}

	// If there is a result, attach extra info to trace it
	if (result) {
		result += `----- Detected modifications -----\n` +
			(unexpectedHashes.length > 0 ? `Patched functions with unknown checksums:\n` + unexpectedHashes.map(i => `  - ${i[0]}: ${i[1]}\n`).join("") : "") +
			(overwrittenFunctions.length > 0 ? `Overwritten functions:\n` + overwrittenFunctions.map(fn => `  - ${fn.name}: ${crc32(fn.currentEntrypoint?.toString().replaceAll("\r\n", "\n") ?? "")}\n`).join("") : "") +
			`\n`;
	}

	if (result) {
		// Checksum the result and check against already seen one
		const checksum = crc32(result);
		if (modStorage.compatibilityCheckerWarningIgnore === checksum)
			return;

		didReportCompatibilityIssues = true;
		showErrorOverlay(
			"BCX Compatibility checker",
			"BCX's Compatibility checker detected problems with other mods you appear to be using.<br />" +
			"For reasons stated below please reconsider using mentioned mods.<br />" +
			"Please note, that this is a warning for you, not meant to be reported. It says that some features are likely to be broken.<br />" +
			"If you have any questions or think this message is an error, please get in touch with us on <a href='https://discord.gg/SHJMjEh9VH' target='_blank'>BC Scripting Community</a> Discord server.<br />" +
			"You can use the 'Close' button at the bottom to continue anyway.",
			result + `Report signature: ${checksum}`,
			false,
			wait,
			(win) => {
				const doNotShowAgain = document.createElement("button");
				doNotShowAgain.style.cursor = "pointer";
				win.appendChild(doNotShowAgain);
				doNotShowAgain.innerText = "Do not show this report again unless something changes";

				doNotShowAgain.onclick = () => {
					doNotShowAgain.innerText = "This report won't show again unless something changes.";
					doNotShowAgain.disabled = true;
					modStorage.compatibilityCheckerWarningIgnore = checksum;
					modStorageSync();
				};
			}
		);
	} else if (modStorage.compatibilityCheckerWarningIgnore != null) {
		delete modStorage.compatibilityCheckerWarningIgnore;
		modStorageSync();
	}
}

const sourceBasedErrorMessage = {
	bcx: "<br /><h3>Whoops... seems like BCX might be to blame this time</h3> Could you please help us by submitting the report below to the <a href='https://discord.gg/SHJMjEh9VH' target='_blank'>BC Scripting Community Discord</a> server?<br />Thank you!</p>",
	knownMod: (mod: string) => `<br /><h3>The error seems to come from mod ${mod}</h3> Please submit the report to <a href='https://discord.gg/SHJMjEh9VH' target='_blank'>BC Scripting Community Discord</a> server!`,
	bc: "<br /><h3>The error seems not to come from any ModSDK mod!</h3> Please submit the report to <a href='https://discord.gg/dkWsEjf' target='_blank'>Bondage Club's Discord</a> server!",
	unknown: "<br /><h3>Could not detect origin of the error.</h3> Please submit the report to <a href='https://discord.gg/dkWsEjf' target='_blank'>Bondage Club's Discord</a> server!"
} as const;

export function onUnhandledError(event: ErrorEvent) {
	if (!firstError)
		return;
	firstError = false;
	const currentMod = contextCurrentModArea();
	// Display error window
	showErrorOverlay(
		"Crash Handler (by ModSDK)",
		"The Crash Handler provided by ModSDK detected an uncaught error, which most likely crashed the Bondage Club.<br />" +
		"While reporting this error, please use the information below to help us find the source faster.<br />" +
		"You can use the 'Close' button at the bottom to continue, however BC may no longer work correctly until you reload the current tab." +
		(
			currentMod === "BCX" ? sourceBasedErrorMessage.bcx :
				currentMod === "" ? sourceBasedErrorMessage.bc :
					currentMod == null ? sourceBasedErrorMessage.unknown :
						sourceBasedErrorMessage.knownMod(currentMod)
		),
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
		modArea: "",
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
		modArea: "",
		extraInfo: () => `X: ${MouseX}\nY: ${MouseY}`
	});
	const res = originalClick?.call(this, event);
	ctx.end();
	return res;
}

let originalRAF: Window["requestAnimationFrame"] | undefined;
function bcxRaf(this: any, fn: FrameRequestCallback): number {
	return originalRAF?.call(this, (...rafArgs: [DOMHighResTimeStamp]) => {
		const ctx = debugContextStart(`Animation frame`, {
			root: true,
			modArea: "",
			extraInfo: () => `time: ${rafArgs}`
		});
		const res = fn.apply(window, rafArgs);
		ctx.end();
		return res;
	}) ?? 0;
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

	// Frame origin
	if (originalRAF === undefined && typeof window.requestAnimationFrame === "function") {
		originalRAF = window.requestAnimationFrame;
		window.requestAnimationFrame = bcxRaf;
	}

	hookFunction("ServerSend", 0, (args, next) => {
		lastSentMessageType = args[0];
		lastSentMessageTime = Date.now();
		if (logServerMessages) {
			console.log("\u2B06 Send", ...args);
		}
		return next(args);
	});

	if (compatibilityCheckTimeout == null) {
		compatibilityCheckTimeout = BCX_setInterval(() => {
			detectCompatibilityProblems();
		}, COMPATIBILITY_CHECK_INTERVAL);
		BCX_setTimeout(() => {
			detectCompatibilityProblems();
		}, 3_000);
	}
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
	// Frame origin
	if (originalRAF && window.requestAnimationFrame === bcxRaf) {
		window.requestAnimationFrame = originalRAF;
		originalRAF = undefined;
	}

	if (compatibilityCheckTimeout != null) {
		clearInterval(compatibilityCheckTimeout);
		compatibilityCheckTimeout = undefined;
	}
}
