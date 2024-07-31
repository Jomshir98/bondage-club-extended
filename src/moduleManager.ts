import type { BaseModule } from "./modules/_BaseModule";
import { ModuleInitPhase, Preset } from "./constants";
import { getCurrentPreset } from "./modules/presets";
import { modStorage } from "./modules/storage";
import { BCX_VERSION_PARSED, parseBCXVersion } from "./utils";
import { runMigration } from "./migration";

export let moduleInitPhase: ModuleInitPhase = ModuleInitPhase.construct;
const modules: BaseModule[] = [];

export function registerModule<T extends BaseModule>(module: T): T {
	if (moduleInitPhase !== ModuleInitPhase.construct) {
		throw new Error("Modules can be registered only before initialization");
	}
	modules.push(module);
	return module;
}

export function init_modules(): boolean {
	moduleInitPhase = ModuleInitPhase.init;
	for (const m of modules) {
		if (m.init() === false) {
			return false;
		}
	}

	const oldVersion: BCXVersion | null = typeof modStorage.version === "string" ? parseBCXVersion(modStorage.version) : { major: 0, minor: 0, patch: 0 };
	if (!oldVersion) {
		alert(
			"Failed to parse BCX version in your saved data.\n" +
			"Are you loading older version or is your data corrupted?\n" +
			"Refusing to load."
		);
		return false;
	}
	if (!runMigration(oldVersion, BCX_VERSION_PARSED))
		return false;
	modStorage.version = BCX_VERSION;

	moduleInitPhase = ModuleInitPhase.load;
	for (const m of modules) {
		m.load(getCurrentPreset());
	}
	moduleInitPhase = ModuleInitPhase.ready;
	for (const m of modules) {
		m.run();
	}
	return true;
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
