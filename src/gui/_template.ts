import { ChatroomCharacter } from "../characters";
import { setSubscreen } from "../modules/gui";
import { GuiMainMenu } from "./mainmenu";
import { GuiSubscreen } from "./subscreen";

export class GuiWithSomeName extends GuiSubscreen {

	readonly character: ChatroomCharacter;

	constructor(character: ChatroomCharacter) {
		super();
		this.character = character;
	}

	Load() {
		// On screen load
	}

	Run() {
		// On each frame

		MainCanvas.textAlign = "left";
		DrawText(`- MODULE: some text for ${this.character.Name} -`, 125, 125, "Black", "Gray");
		MainCanvas.textAlign = "center";
		DrawButton(1815, 75, 90, 90, "", "White", "Icons/Exit.png", "BCX main menu");

	}

	Click() {
		// On click

		if (MouseIn(1815, 75, 90, 90)) return this.Exit();

	}

	Exit() {
		setSubscreen(new GuiMainMenu(this.character));
	}

	Unload() {
		// On screen unload
	}
}
