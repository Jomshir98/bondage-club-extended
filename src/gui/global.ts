import { ChatroomCharacter } from "../characters";
import { module_gui } from "../modules";
import { GuiGlobalDialogClearData } from "./global_dialogClearData";
import { GuiMainMenu } from "./mainmenu";
import { GuiSubscreen } from "./subscreen";

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

		DrawButton(1605, 800, 300, 90, "Clear all BCX data", "#FF3232", "", "Emergency reset of BCX");
	}

	Click() {
		if (MouseIn(1815, 75, 90, 90)) return this.Exit();

		if (!this.character.isPlayer())
			return;

		if (MouseIn(1605, 800, 300, 90)) {
			module_gui.currentSubscreen = new GuiGlobalDialogClearData(this);
			return;
		}
	}

	Exit() {
		module_gui.currentSubscreen = new GuiMainMenu(this.character);
	}
}
