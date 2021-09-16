import { FUNCTION_HASHES, FUNCTION_HASHES_NMOD } from "./config";
import { ModuleCategory } from "./constants";
import { crc32 } from "./utils";
import { detectOtherMods } from "./utilsClub";

type PatchHook = (args: any[], next: (args: any[]) => any) => any;

interface IpatchedFunctionData {
	original: (...args: any[]) => any;
	final: (...args: any[]) => any;
	hooks: {
		hook: PatchHook;
		priority: number;
		module: ModuleCategory | null;
	}[];
	patches: Record<string, string>;
}

const patchedFunctions: Map<string, IpatchedFunctionData> = new Map();
let unloaded: boolean = false;


function makePatchRouter(data: IpatchedFunctionData): (...args: any[]) => any {
	return (...args: any[]) => {
		if (unloaded) {
			console.warn(`BCX: Function router called while unloaded for ${data.original.name}`);
			return data.original(...args);
		}
		const hooks = data.hooks.slice();
		let hookIndex = 0;
		const callNextHook = (nextargs: any[]) => {
			if (hookIndex < hooks.length) {
				hookIndex++;
				return hooks[hookIndex - 1].hook(nextargs, callNextHook);
			} else {
				return data.final(...args);
			}
		};
		return callNextHook(args);
	};
}

function initPatchableFunction(target: string): IpatchedFunctionData {
	if (unloaded) {
		throw new Error("Cannot init patchable function after unload");
	}
	let result = patchedFunctions.get(target);
	if (!result) {
		const original = (window as any)[target] as (...args: any[]) => any;

		const { NMod } = detectOtherMods();

		const expectedHashes = (NMod ? FUNCTION_HASHES_NMOD : FUNCTION_HASHES)[target] ?? [];

		if (typeof original !== "function") {
			throw new Error(`BCX: Function ${target} to be patched not found`);
		}

		const hash = crc32(original.toString().replaceAll("\r\n", "\n"));
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

export function hookFunction(target: string, priority: number, hook: PatchHook, module: ModuleCategory | null = null): void {
	const data = initPatchableFunction(target);

	if (data.hooks.some(h => h.hook === hook)) {
		console.error(`BCX: Duplicate hook for "${target}"`, hook);
		return;
	}

	data.hooks.push({
		hook,
		priority,
		module
	});
	data.hooks.sort((a, b) => b.priority - a.priority);
}

export function removeHooksByModule(target: string, module: ModuleCategory): boolean {
	const data = initPatchableFunction(target);

	for (let i = data.hooks.length - 1; i >= 0; i--) {
		if (data.hooks[i].module === module) {
			data.hooks.splice(i, 1);
		}
	}

	return true;
}

export function removeAllHooksByModule(module: ModuleCategory): boolean {
	for (const data of patchedFunctions.values()) {
		for (let i = data.hooks.length - 1; i >= 0; i--) {
			if (data.hooks[i].module === module) {
				data.hooks.splice(i, 1);
			}
		}
	}

	return true;
}

export function patchFunction(target: string, patches: Record<string, string>): void {
	const data = initPatchableFunction(target);
	Object.assign(data.patches, patches);
	applyPatches(data);
}

export function unload_patches() {
	unloaded = true;
	for (const [k, v] of patchedFunctions.entries()) {
		v.hooks = [];
		v.patches = {};
		v.final = v.original;
		(window as any)[k] = v.original;
	}
	patchedFunctions.clear();
}
