
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

/**
 * Waits for set amount of time, returning promes
 * @param ms The time in ms to wait for
 */
export function wait(ms: number): Promise<void> {
	return new Promise(r => setTimeout(r, ms));
}

/** Checks if the `obj` is an object (not null, not array) */
export function isObject(obj: unknown): obj is Record<string, any> {
	return !!obj && typeof obj === "object" && !Array.isArray(obj);
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

export const clipboardAvailable = Boolean(navigator.clipboard);
