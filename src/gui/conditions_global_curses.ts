import { ChatroomCharacter } from "../characters";
import { GuiConditionGlobal } from "./conditions_global_base";
import { GuiSubscreen } from "./subscreen";

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

		return false;
	}

	Click(): boolean {
		if (super.Click() || this.conditionCategoryData === null)
			return true;

		return false;
	}
}
