import { BaseModule } from "../moduleManager";
import { InfoBeep } from "../utilsClub";
import { finalizeFirstTimeInit, firstTimeInit, modStorage } from "./storage";

export enum Preset {
	dominant = 0,
	switch = 1,
	submissive = 2,
	slave = 3
}

export function applyPreset(preset: Preset) {
	modStorage.preset = preset;
	finalizeFirstTimeInit();
}

export class ModulePresets extends BaseModule {
	load() {
		if (typeof modStorage.preset !== "number" || Preset[modStorage.preset] === undefined) {
			modStorage.preset = Preset.switch;
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
