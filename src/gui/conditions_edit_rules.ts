import { ChatroomCharacter } from "../characters";
import { GuiConditionEdit } from "./conditions_edit_base";
import { GuiSubscreen } from "./subscreen";
import { RulesGetDisplayDefinition } from "../modules/rules";

import cloneDeep from "lodash-es/cloneDeep";

export class GuiConditionEditRules extends GuiConditionEdit<"rules"> {

	private definition: RuleDisplayDefinition;

	constructor(character: ChatroomCharacter,
		conditionName: ConditionsCategoryKeys["rules"],
		back: GuiSubscreen
	) {
		super(character, "rules", conditionName, back);
		this.definition = RulesGetDisplayDefinition(conditionName);
	}

	protected override headerText(): string {
		return `View / Edit the '${this.definition.name}' rule`;
	}

	protected override onDataChange() {
		super.onDataChange();

		if (!this.conditionCategoryData || !this.conditionData) {
			return;
		}

	}

	Run(): boolean {
		if (super.Run() || this.conditionCategoryData === null || this.conditionData === null)
			return true;

		const data = this.changes ?? this.conditionData;
		const access = this.checkAccess();

		MainCanvas.textAlign = "left";

		////// right side: special rules category options

		return false;
	}

	Click(): boolean {
		if (super.Click() || this.conditionCategoryData === null || this.conditionData === null)
			return true;

		if (!this.checkAccess())
			return false;

		const data = this.changes ?? this.conditionData;

		return false;
	}
}
