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
