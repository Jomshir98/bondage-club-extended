import type { Preset } from "../constants";

export abstract class BaseModule {

	init(): void | boolean {
		// Empty
	}

	load(preset: Preset) {
		// Empty
	}

	run() {
		// Empty
	}

	unload() {
		// Empty
	}

	reload(preset: Preset) {
		// Empty
	}

	applyPreset(preset: Preset) {
		// Empty
	}
}
