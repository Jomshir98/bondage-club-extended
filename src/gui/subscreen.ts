import { getCurrentSubscreen, setSubscreen } from "../modules/gui";

export abstract class GuiSubscreen {
	get active(): boolean {
		return getCurrentSubscreen() === this;
	}

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
		setSubscreen(null);
	}

	Unload() {
		// Empty
	}

	onChange(source: number) {
		// Empty
	}
}
