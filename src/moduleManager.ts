export abstract class BaseModule {

	init() {
		// Empty
	}

	load() {
		// Empty
	}

	run() {
		// Empty
	}

	unload() {
		// Empty
	}

	reload() {
		// Empty
	}
}

export enum ModuleCategory {
	Basic = 0,
	Authority = 1,
	Log = 2,
	Curses = 3,
	Misc = 99
}

export const MODULE_NAMES: Record<ModuleCategory, string> = {
	[ModuleCategory.Basic]: "Basic",
	[ModuleCategory.Authority]: "Authority",
	[ModuleCategory.Log]: "Behaviour Log",
	[ModuleCategory.Curses]: "Curses",
	[ModuleCategory.Misc]: "Miscellaneous"
};

export const MODULE_ICONS: Record<ModuleCategory, string> = {
	[ModuleCategory.Basic]: "Icons/General.png",
	[ModuleCategory.Authority]: "Icons/Security.png",
	[ModuleCategory.Log]: "Icons/Title.png",
	[ModuleCategory.Curses]: "Icons/Struggle.png",
	[ModuleCategory.Misc]: "Icons/Random.png"
};

export const TOGGLEABLE_MODULES: readonly ModuleCategory[] = [
	ModuleCategory.Log,
	ModuleCategory.Curses
];

export const enum ModuleInitPhase {
	construct,
	init,
	load,
	ready,
	destroy
}

export let moduleInitPhase: ModuleInitPhase = ModuleInitPhase.construct;
const modules: BaseModule[] = [];

export function registerModule<T extends BaseModule>(module: T): T {
	if (moduleInitPhase !== ModuleInitPhase.construct) {
		throw new Error("Modules can be registered only before initialization");
	}
	modules.push(module);
	console.debug(`BCX: Registered module ${module.constructor.name}`);
	return module;
}

export function init_modules() {
	moduleInitPhase = ModuleInitPhase.init;
	for (const m of modules) {
		m.init();
	}
	moduleInitPhase = ModuleInitPhase.load;
	for (const m of modules) {
		m.load();
	}
	moduleInitPhase = ModuleInitPhase.ready;
	for (const m of modules) {
		m.run();
	}
}

export function unload_modules() {
	moduleInitPhase = ModuleInitPhase.destroy;
	for (const m of modules) {
		m.unload();
	}
}

export function reload_modules(): boolean {
	if (moduleInitPhase !== ModuleInitPhase.ready) {
		console.error("BCX: Attempt to reload modules, while not ready");
		return false;
	}
	for (const m of modules) {
		m.reload();
	}
	return true;
}
