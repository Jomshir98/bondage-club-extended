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
}

export enum ModuleCategory {
	Basic,
	Authority,
	Log,
	Misc
}

export const MODULE_NAMES: Record<ModuleCategory, string> = {
	[ModuleCategory.Basic]: "Basic",
	[ModuleCategory.Authority]: "Authority",
	[ModuleCategory.Log]: "Behaviour Log",
	[ModuleCategory.Misc]: "Miscellaneous"
};

export const MODULE_ICONS: Record<ModuleCategory, string> = {
	[ModuleCategory.Basic]: "Icons/General.png",
	[ModuleCategory.Authority]: "Icons/Security.png",
	[ModuleCategory.Log]: "Icons/Title.png",
	[ModuleCategory.Misc]: "Icons/Random.png"
};

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
