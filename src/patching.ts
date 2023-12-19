import { debugContextStart } from "./BCXContext";
import { ModuleCategory } from "./constants";

import bcModSDK from "bondage-club-mod-sdk";

const modApi = bcModSDK.registerMod({
	name: "BCX",
	fullName: "Bondage Club Extended",
	version: BCX_VERSION,
	repository: "https://github.com/Jomshir98/bondage-club-extended",
});

bcModSDK.errorReporterHooks.hookEnter = (fn, mod) => {
	const ctx = debugContextStart(`Function ${fn} hook from ${mod}`, { modArea: mod });
	return () => {
		ctx.end();
	};
};

bcModSDK.errorReporterHooks.hookChainExit = (fn, mods) => {
	const ctx = debugContextStart(`Function ${fn} hook chain exit`, {
		modArea: mods.size === 0 ? "" : "[Presence of patches prevents identifying source]",
		extraInfo: () => mods.size > 0 ? `Patched by: ${Array.from(mods).join(", ")}` : "",
	});
	return () => {
		ctx.end();
	};
};

export declare type AnyFunction = (...args: any) => any;
type PatchHook<TFunction extends AnyFunction = AnyFunction> = (args: [...Parameters<TFunction>], next: (args: [...Parameters<TFunction>]) => ReturnType<TFunction>) => ReturnType<TFunction>;

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
	// Disabled, because I'm tired of updating it all the time
	// const expectedHashes = FUNCTION_HASHES[functionName] ?? [];
	// return expectedHashes.includes(hash);
	return true;
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
			hooks: [],
		};
		patchedFunctions.set(target, result);
	}
	return result;
}

/** Track function without adding any hooks - only checking hash */
export function trackFunction(target: string): void {
	initPatchableFunction(target);
}

type GetDotedPathType<Base, DotedKey extends string> = DotedKey extends `${infer Key1}.${infer Key2}` ? GetDotedPathType<GetDotedPathType<Base, Key1>, Key2> : DotedKey extends keyof Base ? Base[DotedKey] : never;

export function hookFunction<TargetName extends string>(target: TargetName, priority: number, hook: PatchHook<GetDotedPathType<typeof globalThis, TargetName>>, module: ModuleCategory | null = null): void {
	return hookFunctionSpecific<GetDotedPathType<typeof globalThis, TargetName>>(target, priority, hook, module);
}

export function hookFunctionSpecific<T extends AnyFunction>(target: string, priority: number, hook: PatchHook<T>, module: ModuleCategory | null = null): void {
	const data = initPatchableFunction(target);

	if (data.hooks.some(h => h.hook === hook)) {
		console.error(`BCX: Duplicate hook for "${target}"`, hook);
		return;
	}

	const removeCallback = modApi.hookFunction(target, priority, hook as PatchHook<AnyFunction>);

	data.hooks.push({
		hook,
		priority,
		module,
		removeCallback,
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
	initPatchableFunction(target);
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
