import { ChatroomCharacter } from "../characters";
import { MiscCheat } from "../constants";
import { setSubscreen } from "../modules/gui";
import { cheatIsEnabled, cheatToggle } from "../modules/miscPatches";
import { modStorage, modStorageSync } from "../modules/storage";
import { GuiMainMenu } from "./mainmenu";
import { GuiSubscreen } from "./subscreen";
import { Views, HELP_TEXTS } from "../helpTexts";
import { showHelp } from "../utilsClub";

export class GuiMisc extends GuiSubscreen {

	readonly character: ChatroomCharacter;

	private showHelp: boolean = false;

	constructor(character: ChatroomCharacter) {
		super();
		this.character = character;
	}


	Run() {
		MainCanvas.textAlign = "left";
		DrawText(`- Miscellaneous: Configuration for ${this.character.Name} -`, 125, 125, "Black", "Gray");

		MainCanvas.textAlign = "center";
		DrawButton(1815, 75, 90, 90, "", "White", "Icons/Exit.png", "BCX main menu");
		if (this.character.isPlayer()) {
			DrawButton(1815, 190, 90, 90, "", "White", "Icons/Question.png");
		}

		if (!this.character.isPlayer()) {
			DrawText(`Miscellaneous module configuration is not possible on others`, 1000, 500, "Black");
			return;
		}

		MainCanvas.textAlign = "left";

		DrawCheckbox(125, 200, 64, 64, "Enable typing indicator", !!modStorage.typingIndicatorEnable);
		DrawCheckbox(125, 300, 64, 64, "Cheat: Prevent random NPC events (kidnappings, ransoms, asylum, club slaves)", cheatIsEnabled(MiscCheat.BlockRandomEvents));
		DrawCheckbox(125, 400, 64, 64, "Cheat: Prevent loosing Mistress status when reputation falls below 50 dominance", cheatIsEnabled(MiscCheat.CantLoseMistress));
		DrawCheckbox(125, 500, 64, 64, "Cheat: Give yourself the mistress padlock and its key", cheatIsEnabled(MiscCheat.GiveMistressKey));
		DrawCheckbox(125, 600, 64, 64, "Cheat: Give yourself the pandora padlock and its key", cheatIsEnabled(MiscCheat.GivePandoraKey));

		// help text
		if (this.showHelp) {
			showHelp(HELP_TEXTS[Views.Misc]);
		}
	}

	Click() {
		if (MouseIn(1815, 75, 90, 90)) return this.Exit();
		if (MouseIn(1815, 190, 90, 90) && this.character.isPlayer()) {
			this.showHelp = !this.showHelp;
			return;
		}

		if (!this.character.isPlayer())
			return;

		if (MouseIn(125, 200, 64, 64)) {
			modStorage.typingIndicatorEnable = !modStorage.typingIndicatorEnable;
			modStorageSync();
		}

		if (MouseIn(125, 300, 64, 64)) {
			cheatToggle(MiscCheat.BlockRandomEvents);
		}

		if (MouseIn(125, 400, 64, 64)) {
			cheatToggle(MiscCheat.CantLoseMistress);
		}

		if (MouseIn(125, 500, 64, 64)) {
			cheatToggle(MiscCheat.GiveMistressKey);
		}

		if (MouseIn(125, 600, 64, 64)) {
			cheatToggle(MiscCheat.GivePandoraKey);
		}
	}

	Exit() {
		setSubscreen(new GuiMainMenu(this.character));
	}
}
