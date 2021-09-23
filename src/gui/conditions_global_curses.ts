import { ChatroomCharacter } from "../characters";
import { GuiConditionGlobal } from "./conditions_global_base";
import { GuiSubscreen } from "./subscreen";
import { Views, HELP_TEXTS } from "../helpTexts";
import { showHelp } from "../utilsClub";

export class GuiConditionGlobalCurses extends GuiConditionGlobal<"curses"> {

	constructor(character: ChatroomCharacter,
		back: GuiSubscreen
	) {
		super(character, "curses", back);
	}

	protected override headerText(): string {
		return `View / Edit the global ${this.conditionCategory} configuration`;
	}

	Run(): boolean {
		if (super.Run() || this.conditionCategoryData === null)
			return true;

		MainCanvas.textAlign = "left";
		DrawText(`Note: Settings are applied to new curses and all existing ones set to the global config.`, 130, 210, "Black", "");

		// help text
		if (this.showHelp) {
			showHelp(HELP_TEXTS[Views.ConditionsGlobalCurses]);
		}

		return false;
	}

	Click(): boolean {
		if (super.Click() || this.conditionCategoryData === null)
			return true;

		return false;
	}
}
