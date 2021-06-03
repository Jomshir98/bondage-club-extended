import { FUNCTION_HASHES } from "./config";
import { crc32 } from "./utils";

type PatchHook = (args: any[], next: (args: any[]) => any) => any;

interface IpatchedFunctionData {
	original: (...args: any[]) => any;
	final: (...args: any[]) => any;
	hooks: {
		hook: PatchHook;
		priority: number;
	}[];
	patches: Record<string, string>;
}

const patchedFunctions: Map<string, IpatchedFunctionData> = new Map();

function makePatchRouter(data: IpatchedFunctionData): (...args: any[]) => any {
	return (...args: any[]) => {
		const hooks = data.hooks.slice();
		let hookIndex = 0;
		const callNextHook = (nextargs: any[]) => {
			if (hookIndex < hooks.length) {
				hookIndex++;
				return hooks[hookIndex-1].hook(nextargs, callNextHook);
			} else {
				return data.final(...args);
			}
		};
		return callNextHook(args);
	};
}

function initPatchableFunction(target: string): IpatchedFunctionData {
	let result = patchedFunctions.get(target);
	if (!result) {
		const original = (window as any)[target];
		const expectedHashes = FUNCTION_HASHES[target] ?? [];

		if (typeof original !== "function") {
			throw new Error(`BCX: Function ${target} to be patched not found`);
		}

		const hash = crc32(original.toString());
		if (!expectedHashes.includes(hash)) {
			console.warn(`BCX: Patched function ${target} has unknown hash ${hash}`);
		}
		console.debug(`BCX: Initialized ${target} for patching`);

		result = {
			original,
			final: original,
			hooks: [],
			patches: {}
		};
		patchedFunctions.set(target, result);
		(window as any)[target] = makePatchRouter(result);
	}
	return result;
}

function applyPatches(info: IpatchedFunctionData) {
	if (Object.keys(info.patches).length === 0) {
		info.final = info.original;
		return;
	}
	let fn_str = info.original.toString();
	const N = `BCX: Patching ${info.original.name}`;
	for (const k of Object.keys(info.patches)) {
		if (!fn_str.includes(k)) {
			console.warn(`${N}: Patch ${k} not applied`);
		}
		fn_str = fn_str.replaceAll(k, info.patches[k]);
	}
	// eslint-disable-next-line no-eval
	info.final = eval(`(${fn_str})`);
}

export function hookFunction(target: string, priority: number, hook: PatchHook): void {
	const data = initPatchableFunction(target);
	data.hooks.push({
		hook,
		priority
	});
	data.hooks.sort((a, b) => b.priority - a.priority);
}

export function patchFunction(target: string, patches: Record<string, string>): void {
	const data = initPatchableFunction(target);
	Object.assign(data.patches, patches);
	applyPatches(data);
}
