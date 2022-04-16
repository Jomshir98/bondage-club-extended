import { debugContextStart } from "./BCXContext";
import { FUNCTION_HASHES, FUNCTION_HASHES_NMOD } from "./config";
import { ModuleCategory } from "./constants";
import { isNModClient } from "./utilsClub";

import bcModSDK from "bondage-club-mod-sdk";

const modApi = bcModSDK.registerMod("BCX", BCX_VERSION);

bcModSDK.errorReporterHooks.hookEnter = (fn, mod) => {
	const ctx = debugContextStart(`Function ${fn} hook from ${mod}`, { bcxArea: mod === "BCX" });
	return () => {
		ctx.end();
	};
};

bcModSDK.errorReporterHooks.hookChainExit = (fn, mods) => {
	const ctx = debugContextStart(`Function ${fn} hook chain exit`, {
		bcxArea: mods.has("BCX"),
		extraInfo: () => mods.size > 0 ? `Patched by: ${Array.from(mods).join(", ")}` : ""
	});
	return () => {
		ctx.end();
	};
};

type PatchHook = (args: any[], next: (args: any[]) => any) => any;

interface IPatchedFunctionData {
	name: string;
	originalHash: string;
	hooks: {
		hook: PatchHook;
		priority: number;
		module: ModuleCategory | null;
		removeCallback: () => void;
	}[];
}

const patchedFunctions: Map<string, IPatchedFunctionData> = new Map();
let unloaded: boolean = false;

function isHashExpected(functionName: string, hash: string): boolean {
	const expectedHashes = FUNCTION_HASHES[functionName] ?? [];
	if (isNModClient() && FUNCTION_HASHES_NMOD[functionName]) {
		expectedHashes.push(...FUNCTION_HASHES_NMOD[functionName]);
	}
	return expectedHashes.includes(hash);
}

function initPatchableFunction(target: string): IPatchedFunctionData {
	if (unloaded) {
		throw new Error("Cannot init patchable function after unload");
	}
	let result = patchedFunctions.get(target);
	if (!result) {
		const originalHash = modApi.getOriginalHash(target);
		if (!isHashExpected(target, originalHash)) {
			console.warn(`BCX: Patched function ${target} has unknown hash ${originalHash}`);
		}
		console.debug(`BCX: Initialized ${target} for patching, hash ${originalHash}`);

		result = {
			name: target,
			originalHash,
			hooks: []
		};
		patchedFunctions.set(target, result);
	}
	return result;
}

export function hookFunction(target: string, priority: number, hook: PatchHook, module: ModuleCategory | null = null): void {
	const data = initPatchableFunction(target);

	if (data.hooks.some(h => h.hook === hook)) {
		console.error(`BCX: Duplicate hook for "${target}"`, hook);
		return;
	}

	const removeCallback = modApi.hookFunction(target, priority, hook);

	data.hooks.push({
		hook,
		priority,
		module,
		removeCallback
	});
	data.hooks.sort((a, b) => b.priority - a.priority);
}

export function removeHooksByModule(target: string, module: ModuleCategory): boolean {
	const data = initPatchableFunction(target);

	for (let i = data.hooks.length - 1; i >= 0; i--) {
		if (data.hooks[i].module === module) {
			data.hooks[i].removeCallback();
			data.hooks.splice(i, 1);
		}
	}

	return true;
}

export function removeAllHooksByModule(module: ModuleCategory): boolean {
	for (const data of patchedFunctions.values()) {
		for (let i = data.hooks.length - 1; i >= 0; i--) {
			if (data.hooks[i].module === module) {
				data.hooks[i].removeCallback();
				data.hooks.splice(i, 1);
			}
		}
	}

	return true;
}

export function patchFunction(target: string, patches: Record<string, string>): void {
	modApi.patchFunction(target, patches);
}

export function unload_patches() {
	unloaded = true;
	patchedFunctions.clear();
	modApi.unload();
}

export function callOriginal(target: string, args: any[]): any {
	return modApi.callOriginal(target, args);
}

export function getPatchedFunctionsHashes(includeExpected: boolean): [string, string][] {
	return Array
		.from(patchedFunctions.entries())
		.map<[string, string]>(i => [i[0], i[1].originalHash])
		.filter(i => includeExpected || !isHashExpected(...i));
}
