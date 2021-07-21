import { ChatroomCharacter } from "../characters";
import { setSubscreen } from "../modules/gui";
import { modStorage, modStorageSync } from "../modules/storage";
import { GuiMainMenu } from "./mainmenu";
import { GuiSubscreen } from "./subscreen";

export class GuiMisc extends GuiSubscreen {

	readonly character: ChatroomCharacter;

	constructor(character: ChatroomCharacter) {
		super();
		this.character = character;
	}


	Run() {
		MainCanvas.textAlign = "left";
		DrawText(`- Miscellaneous: Configuration for ${this.character.Name} -`, 125, 125, "Black", "Gray");

		MainCanvas.textAlign = "center";
		DrawButton(1815, 75, 90, 90, "", "White", "Icons/Exit.png", "BCX main menu");

		if (!this.character.isPlayer()) {
			DrawText(`Miscellaneous module configuration is not possible on others`, 1000, 500, "Black");
			return;
		}

		MainCanvas.textAlign = "left";

		DrawCheckbox(125, 200, 64, 64, "Enable typing indicator", !!modStorage.typingIndicatorEnable);
	}

	Click() {
		if (MouseIn(1815, 75, 90, 90)) return this.Exit();

		if (!this.character.isPlayer())
			return;

		if (MouseIn(125, 200, 64, 64)) {
			modStorage.typingIndicatorEnable = !modStorage.typingIndicatorEnable;
			modStorageSync();
		}
	}

	Exit() {
		setSubscreen(new GuiMainMenu(this.character));
	}
}
