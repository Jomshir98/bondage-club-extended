import type { BaseModule } from "./modules/_BaseModule";
import { ModuleInitPhase, Preset } from "./constants";
import { getCurrentPreset } from "./modules/presets";

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
		m.load(getCurrentPreset());
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
		m.reload(getCurrentPreset());
	}
	return true;
}

export function modules_applyPreset(preset: Preset): boolean {
	if (moduleInitPhase !== ModuleInitPhase.ready) {
		console.error("BCX: Attempt to apply preset to modules, while not ready");
		return false;
	}
	for (const m of modules) {
		m.applyPreset(preset);
	}
	return true;
}
