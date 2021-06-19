import { module_gui } from "../modules";

export abstract class GuiSubscreen {
	Load() {
		// Empty
	}

	Run() {
		// Empty
	}

	Click() {
		// Empty
	}

	Exit() {
		module_gui.currentSubscreen = null;
	}

	Unload() {
		// Empty
	}

	onChange(source: number) {
		// Empty
	}
}
