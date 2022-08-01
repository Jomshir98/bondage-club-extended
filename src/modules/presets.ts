import { modules_applyPreset, reload_modules } from "../moduleManager";
import { BaseModule } from "./_BaseModule";
import { arrayUnique } from "../utils";
import { InfoBeep } from "../utilsClub";
import { notifyOfChange, queryHandlers } from "./messaging";
import { finalizeFirstTimeInit, firstTimeInit, modStorage, modStorageSync } from "./storage";
import { ModuleCategory, Preset, TOGGLEABLE_MODULES } from "../constants";
import { getCurrentSubscreen } from "./gui";
import { BCX_setTimeout } from "../BCXContext";

const PRESET_DISABLED_MODULES: Record<Preset, ModuleCategory[]> = {
	[Preset.dominant]: [ModuleCategory.Log, ModuleCategory.Curses, ModuleCategory.Rules, ModuleCategory.Commands],
	[Preset.switch]: [],
	[Preset.submissive]: [],
	[Preset.slave]: []
};

export function getCurrentPreset(): Preset {
	return modStorage.preset ?? Preset.switch;
}

export function applyPreset(preset: Preset) {
	modStorage.preset = preset;
	modules_applyPreset(preset);
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

export function getDisabledModules(): ModuleCategory[] {
	return Array.isArray(modStorage.disabledModules) ? modStorage.disabledModules.slice() : [];
}

export function moduleIsEnabled(module: ModuleCategory): boolean {
	if (!TOGGLEABLE_MODULES.includes(module))
		return true;

	return Array.isArray(modStorage.disabledModules) ? !modStorage.disabledModules.includes(module) : true;
}

export class ModulePresets extends BaseModule {
	init() {
		queryHandlers.disabledModules = () => {
			return getDisabledModules();
		};
	}

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
			BCX_setTimeout(() => {
				if (firstTimeInit && getCurrentSubscreen() === null) {
					InfoBeep(`Please visit your profile to finish BCX setup`, Infinity);
				}
			}, 2000);
		}
	}
}
