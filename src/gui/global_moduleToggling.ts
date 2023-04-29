import { setSubscreen } from "../modules/gui";
import { GuiSubscreen } from "./subscreen";
import { ModuleCategory, MODULE_ICONS, MODULE_NAMES, TOGGLEABLE_MODULES } from "../constants";
import { DrawImageEx } from "../utilsClub";
import { moduleIsEnabled, setDisabledModules } from "../modules/presets";
import { GuiGlobal } from "./global";
import { getPlayerCharacter } from "../characters";

export class GuiGlobalModuleToggling extends GuiSubscreen {

	private enabledModules = new Set<ModuleCategory>();
	private changed: boolean = false;

	Load() {
		this.enabledModules.clear();
		for (const m of TOGGLEABLE_MODULES.filter(i => moduleIsEnabled(i))) {
			this.enabledModules.add(m);
		}
		this.changed = false;
	}

	Run() {
		MainCanvas.textAlign = "left";
		DrawText(`- Global: Enable/Disable BCX's modules -`, 125, 125, "Black", "Gray");
		DrawText(`Warning: Disabling a module will reset all its settings and stored data!`, 125, 180, "FireBrick");

		for (let i = 0; i < TOGGLEABLE_MODULES.length; i++) {
			const module = TOGGLEABLE_MODULES[i];
			const PX = Math.floor(i / 5);
			const PY = i % 5;

			DrawCheckbox(150 + 500 * PX, 240 + 110 * PY, 64, 64, "", this.enabledModules.has(module));
			DrawImageEx(MODULE_ICONS[module], 280 + 500 * PX, 240 + 110 * PY, {
				Height: 64,
				Width: 64,
			});
			DrawText(MODULE_NAMES[module], 370 + 500 * PX, 240 + 32 + 110 * PY, "Black");
		}

		MainCanvas.textAlign = "center";

		DrawButton(300, 800, 200, 80, "Confirm", this.changed ? "White" : "#ddd", undefined, undefined, !this.changed);

		DrawButton(1520, 800, 200, 80, "Cancel", "White");
	}

	Click() {
		if (MouseIn(1815, 75, 90, 90)) return this.Exit();

		for (let i = 0; i < TOGGLEABLE_MODULES.length; i++) {
			const module = TOGGLEABLE_MODULES[i];
			const PX = Math.floor(i / 5);
			const PY = i % 5;

			if (MouseIn(150 + 500 * PX, 240 + 110 * PY, 64, 64)) {
				if (this.enabledModules.has(module)) {
					this.enabledModules.delete(module);
				} else {
					this.enabledModules.add(module);
				}
				this.changed = true;
				return;
			}
		}

		if (MouseIn(300, 800, 200, 80) && this.changed) {
			if (setDisabledModules(TOGGLEABLE_MODULES.filter(i => !this.enabledModules.has(i)))) {
				this.Exit();
			}
			return;
		}

		if (MouseIn(1520, 800, 200, 80)) {
			return this.Exit();
		}
	}

	Exit() {
		setSubscreen(new GuiGlobal(getPlayerCharacter()));
	}
}
