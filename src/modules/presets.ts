import { BaseModule, ModuleCategory, reload_modules, TOGGLEABLE_MODULES } from "../moduleManager";
import { arrayUnique } from "../utils";
import { InfoBeep } from "../utilsClub";
import { notifyOfChange } from "./messaging";
import { finalizeFirstTimeInit, firstTimeInit, modStorage, modStorageSync } from "./storage";

export enum Preset {
	dominant = 0,
	switch = 1,
	submissive = 2,
	slave = 3
}

const PRESET_DISABLED_MODULES: Record<Preset, ModuleCategory[]> = {
	[Preset.dominant]: [ModuleCategory.Log, ModuleCategory.Curses],
	[Preset.switch]: [],
	[Preset.submissive]: [],
	[Preset.slave]: []
};

export function applyPreset(preset: Preset) {
	modStorage.preset = preset;
	setDisabledModules(PRESET_DISABLED_MODULES[preset]);

	finalizeFirstTimeInit();
}

export function setDisabledModules(modules: ModuleCategory[]): boolean {
	if (!Array.isArray(modStorage.disabledModules)) {
		console.error("BCX: Attempt to set disabled modules before initializetion");
		return false;
	}

	modules = arrayUnique(modules.filter(i => TOGGLEABLE_MODULES.includes(i)));

	if (CommonArraysEqual(modules, modStorage.disabledModules))
		return true;

	modStorage.disabledModules = modules;

	if (reload_modules()) {
		modStorageSync();
		notifyOfChange();
		return true;
	}
	return false;
}

export function moduleIsEnabled(module: ModuleCategory): boolean {
	if (!TOGGLEABLE_MODULES.includes(module))
		return true;

	return Array.isArray(modStorage.disabledModules) ? !modStorage.disabledModules.includes(module) : true;
}

export class ModulePresets extends BaseModule {
	load() {
		if (typeof modStorage.preset !== "number" || Preset[modStorage.preset] === undefined) {
			modStorage.preset = Preset.switch;
		}

		if (!Array.isArray(modStorage.disabledModules)) {
			modStorage.disabledModules = [];
		} else {
			modStorage.disabledModules = modStorage.disabledModules.filter(i => TOGGLEABLE_MODULES.includes(i));
		}
	}

	run() {
		if (firstTimeInit) {
			setTimeout(() => {
				InfoBeep(`Please visit your profile to finish BCX setup`, Infinity);
			}, 2000);
		}
	}
}
