import { module_gui } from "../modules";

export abstract class GuiSubscreen {
	Run() {
		// Empty
	}

	Click() {
		// Empty
	}

	Exit() {
		module_gui.currentSubscreen = null;
	}
}
