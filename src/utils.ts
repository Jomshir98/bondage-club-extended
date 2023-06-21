const encoder = new TextEncoder();

/* eslint-disable no-bitwise */
export function crc32(str: string): string {
	let crc = 0 ^ -1;
	for (const b of encoder.encode(str)) {
		let c = (crc ^ b) & 0xff;
		for (let j = 0; j < 8; j++) {
			c = (c & 1) ? (-306674912 ^ (c >>> 1)) : (c >>> 1);
		}
		crc = (crc >>> 8) ^ c;
	}

	return ((crc ^ -1) >>> 0).toString(16).padStart(8, "0").toUpperCase();
}
/* eslint-enable no-bitwise */

/** Utility function to add CSS */
export function addStyle(styleString: string): void {
	const style = document.createElement("style");
	style.textContent = styleString;
	document.head.append(style);
}

/** Checks if the `obj` is an object (not null, not array) */
export function isObject(obj: unknown): obj is Record<string, any> {
	return !!obj && typeof obj === "object" && !Array.isArray(obj);
}

export function typedObjectAssumedEntries<T extends object>(obj: T): [keyof T, T[keyof T]][] {
	return Object.entries(obj) as [keyof T, T[keyof T]][];
}

export function typedObjectAssumedKeys<T extends object>(obj: T): (keyof T)[] {
	return Object.keys(obj) as (keyof T)[];
}

export function longestCommonPrefix(strings: string[]): string {
	if (strings.length === 0) return "";

	strings = strings.slice().sort();
	let i = 0;
	while (i < strings[0].length && strings[0][i] === strings[strings.length - 1][i]) {
		i++;
	}
	return strings[0].substring(0, i);
}

export function arrayUnique<T>(arr: T[]): T[] {
	const seen = new Set<T>();
	return arr.filter(i => !seen.has(i) && seen.add(i));
}

export function capitalizeFirstLetter(str: string): string {
	return str.charAt(0).toLocaleUpperCase() + str.slice(1);
}

/* eslint-disable no-bitwise */
export function uuidv4() {
	return "10000000-1000-4000-8000-100000000000".replace(/[018]/g, (c: any) =>
		(c ^ (crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (c / 4)))).toString(16)
	);
}
/* eslint-enable no-bitwise */

export const clipboardAvailable = Boolean(navigator.clipboard);

/** Clamp number between two values */
export function clamp(value: number, min: number, max: number) {
	return Math.min(Math.max(value, min), max);
}

/** Clamp number between two values, wrapping if necessary */
export function clampWrap(value: number, min: number, max: number): number {
	return value < min ? max : value > max ? min : value;
}

/** Formats time in ms into days, hours minutes and seconds - also has a short mode that only shows the largest unit, e.g. 17h */
export function formatTimeInterval(time: number, mode: "full" | "short" = "full") {
	let res = "";
	if (time < 0) {
		res = "-";
		time *= -1;
	}
	const seconds = Math.floor(time / 1000);
	const minutes = Math.floor(seconds / 60);
	const hours = Math.floor(minutes / 60);
	const days = Math.floor(hours / 24);
	if (mode === "full" || mode === undefined) {
		if (days > 0) {
			res += `${days} days, `;
		}
		if (hours > 0) {
			res += `${hours % 24} hours, `;
		}
		if (minutes > 0) {
			res += `${minutes % 60} minutes, `;
		}
		if (seconds > 0) {
			res += `${seconds % 60} seconds`;
		}
	} else if (mode === "short") {
		if (days > 1) {
			res += `${days}d`;
		} else if (hours > 1) {
			res += `${hours}h`;
		} else if (minutes > 1) {
			res += `${minutes}m`;
		} else if (seconds > 0) {
			res += `${seconds}s`;
		}
	}
	return res;
}

/**
 * Replaces texts in `text` using data in `dictionary`, adding some default replacements.
 * Default replacements:
 *
 * `PLAYER_NAME` - Name of current Player
 *
 * @param text - The text to process
 * @param dictionary - The dictionary to apply to the `text`
 * @returns The result of replacements
 */
export function dictionaryProcess(text: string, dictionary: Record<string, string>): string {
	for (const [k, v] of Object.entries({
		PLAYER_NAME: Player.Name,
		...dictionary,
	})) {
		text = text.replaceAll(k, v);
	}
	return text;
}

/**
 * Creates a new text input element in the main document.
 * @param Type - Type of the input tag to create.
 * @param MaxLength - Maximum input tag of the input to create.
 * @returns - The created HTML input element
 */
export function createInputElement(type: string, maxLength?: number): HTMLInputElement {
	const input = document.createElement("input");
	input.type = type;
	if (maxLength) {
		input.maxLength = maxLength;
	}
	input.addEventListener("keydown", GameKeyDown);
	input.className = "HideOnPopup";
	return input;
}

/**
 * Draws an existing HTML element at a specific position within the document. The element is "centered" on the given coordinates by dividing its height and width by two.
 * @param ElementID - The id of the input tag to (re-)position.
 * @param X - Center point of the element on the X axis.
 * @param Y - Center point of the element on the Y axis.
 * @param W - Width of the element.
 * @param H - Height of the element.
 */
export function positionElement(element: HTMLElement, X: number, Y: number, W: number, H?: number) {
	// Different positions based on the width/height ratio
	const HRatio = MainCanvas.canvas.clientHeight / 1000;
	const WRatio = MainCanvas.canvas.clientWidth / 2000;
	const Font = MainCanvas.canvas.clientWidth <= MainCanvas.canvas.clientHeight * 2 ? MainCanvas.canvas.clientWidth / 50 : MainCanvas.canvas.clientHeight / 25;
	const Height = H ? H * HRatio : Font * 1.15;
	const Width = W * WRatio - 18;
	const Top = MainCanvas.canvas.offsetTop + Y * HRatio - Height / 2;
	const Left = MainCanvas.canvas.offsetLeft + (X - W / 2) * WRatio;

	// Sets the element style
	Object.assign(element.style, {
		fontSize: `${Font}px`,
		fontFamily: CommonGetFontName(),
		position: "fixed",
		left: `${Left}px`,
		top: `${Top}px`,
		width: `${Width}px`,
		height: `${Height}px`,
		display: "inline",
	});
}

/**
 * Escapes regex-special characters
 * @param string The string to escape
 * @returns Escaped version of string
 */
export function escapeRegExp(string: string) {
	return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function parseBCXVersion(version: string): BCXVersion | null {
	const devMatch = /^(\d+).(\d+).(\d+)-(DEV-\d+)$/.exec(version);
	if (devMatch) {
		return {
			major: Number.parseInt(devMatch[1], 10),
			minor: Number.parseInt(devMatch[2], 10),
			patch: Number.parseInt(devMatch[3], 10),
			extra: devMatch[4],
			dev: true,
		};
	}
	const match = /^(\d+).(\d+).(\d+)-([0-f]+)$/.exec(version);
	if (match) {
		return {
			major: Number.parseInt(match[1], 10),
			minor: Number.parseInt(match[2], 10),
			patch: Number.parseInt(match[3], 10),
			extra: match[4],
			dev: false,
		};
	}
	return null;
}

export function BCXVersionCompare(a: BCXVersion, b: BCXVersion): number {
	if (a.major !== b.major) {
		return a.major - b.major;
	}
	if (a.minor !== b.minor) {
		return a.minor - b.minor;
	}
	if (a.patch !== b.patch) {
		return a.patch - b.patch;
	}
	if ((a.dev ?? false) !== (b.dev ?? false)) {
		return a.dev ? 1 : -1;
	}
	return 0;
}

export function BCXVersionToString(ver: BCXVersion): string {
	let res = `${ver.major}.${ver.minor}.${ver.patch}`;
	if (ver.extra) {
		res += `-${ver.extra}`;
	}
	return res;
}

export const BCX_VERSION_PARSED: Readonly<BCXVersion> = (() => {
	const res = parseBCXVersion(BCX_VERSION);
	if (!res) {
		throw Error("Failed to parse own version");
	}
	return res;
})();

/**
 * Shuffles an array in-place
 * @param array The array to shuffle
 */
export function shuffleArray(array: any[]) {
	for (let i = array.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[array[i], array[j]] = [array[j], array[i]];
	}
}
