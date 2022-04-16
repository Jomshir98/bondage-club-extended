import { ChatroomCharacter } from "../characters";
import { setSubscreen } from "../modules/gui";
import { GuiGlobalDialogClearData } from "./global_dialogClearData";
import { GuiMainMenu } from "./mainmenu";
import { GuiGlobalModuleToggling } from "./global_moduleToggling";
import { GuiSubscreen } from "./subscreen";
import { capitalizeFirstLetter } from "../utils";
import { DrawImageEx } from "../utilsClub";
import { getCurrentPreset } from "../modules/presets";
import { Preset } from "../constants";

export class GuiGlobal extends GuiSubscreen {

	readonly character: ChatroomCharacter;

	constructor(character: ChatroomCharacter) {
		super();
		this.character = character;
	}

	Run() {
		MainCanvas.textAlign = "left";
		DrawText(`- Global: Configuration for ${this.character.Name} -`, 125, 125, "Black", "Gray");

		MainCanvas.textAlign = "center";
		DrawButton(1815, 75, 90, 90, "", "White", "Icons/Exit.png", "BCX main menu");

		if (!this.character.isPlayer()) {
			DrawText(`Global configuration is not possible on others`, 1000, 500, "Black");
			return;
		}

		// preset
		MainCanvas.fillStyle = "#ddd";
		MainCanvas.fillRect(840, 200, 950, 90);
		DrawImageEx("Icons/Introduction.png", 840 + 20, 200 + 20, { Height: 50, Width: 50 });
		DrawTextFit(`Your initially selected BCX preset was: "${capitalizeFirstLetter(Preset[getCurrentPreset()])}"`, 1300, 244, 850, "Black");

		DrawButton(120, 200, 400, 90, "Manage BCX modules", "White", "", "Enable/Disable individual modules");

		DrawButton(1490, 800, 300, 90, "Clear all BCX data", "#FF3232", "", "Emergency reset of BCX");
	}

	Click() {
		if (MouseIn(1815, 75, 90, 90)) return this.Exit();

		if (!this.character.isPlayer())
			return;

		if (MouseIn(120, 200, 400, 90)) {
			setSubscreen(new GuiGlobalModuleToggling());
			return;
		}

		if (MouseIn(1490, 800, 300, 90)) {
			setSubscreen(new GuiGlobalDialogClearData(this));
			return;
		}
	}

	Exit() {
		setSubscreen(new GuiMainMenu(this.character));
	}
}
