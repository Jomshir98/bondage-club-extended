import { ChatroomCharacter } from "../characters";
import { ModuleCategory, MODULE_ICONS, MODULE_NAMES } from "../moduleManager";
import { module_gui } from "../modules";
import { GuiAuthorityPermissions } from "./authority_permissions";
import { GuiGlobal } from "./global";
import { GuiLog } from "./log";
import { GuiMisc } from "./misc";
import { GuiSubscreen } from "./subscreen";

const MAIN_MENU_ITEMS: {module: ModuleCategory; onclick: (C: ChatroomCharacter) => void; }[] = [
	{
		module: ModuleCategory.Basic,
		onclick: (C) => {
			module_gui.currentSubscreen = new GuiGlobal(C);
		}
	},
	{
		module: ModuleCategory.Authority,
		onclick: (C) => {
			module_gui.currentSubscreen = new GuiAuthorityPermissions(C);
		}
	},
	{
		module: ModuleCategory.Log,
		onclick: (C) => {
			module_gui.currentSubscreen = new GuiLog(C);
		}
	},
	{
		module: ModuleCategory.Misc,
		onclick: (C) => {
			module_gui.currentSubscreen = new GuiMisc(C);
		}
	}
];

export class GuiMainMenu extends GuiSubscreen {

	readonly character: ChatroomCharacter;

	constructor(character: ChatroomCharacter) {
		super();
		this.character = character;
	}

	Run() {
		DrawText("- Bondage Club Extended -", 125, 125, "Black", "Gray");
		DrawButton(1815, 75, 90, 90, "", "White", "Icons/Exit.png");

		for (let i = 0; i < MAIN_MENU_ITEMS.length; i++) {
			const e = MAIN_MENU_ITEMS[i];
			const PX = Math.floor(i / 7);
			const PY = i % 7;
			DrawButton(150 + 420 * PX, 160 + 110 * PY, 400, 90, "", "White", MODULE_ICONS[e.module]);
			DrawTextFit(MODULE_NAMES[e.module], 250 + 420 * PX, 205 + 110 * PY, 310, "Black");
		}
	}

	Click() {
		if (MouseIn(1815, 75, 90, 90)) return this.Exit();

		for (let i = 0; i < MAIN_MENU_ITEMS.length; i++) {
			const e = MAIN_MENU_ITEMS[i];
			const PX = Math.floor(i / 7);
			const PY = i % 7;
			if (MouseIn(150 + 420 * PX, 160 + 110 * PY, 400, 90)) {
				return e.onclick(this.character);
			}
		}
	}
}
