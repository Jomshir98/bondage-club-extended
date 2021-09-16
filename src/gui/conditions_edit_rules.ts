import { ChatroomCharacter } from "../characters";
import { GuiConditionEdit } from "./conditions_edit_base";
import { GuiSubscreen } from "./subscreen";
import { RulesGetDisplayDefinition } from "../modules/rules";

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
		DrawCheckbox(1050, 175, 64, 64, "Enforce this rule", data.data.enforce, !access);
		DrawCheckbox(1050, 275, 64, 64, "Behaviour log entry when rule is broken", data.data.log, !access);

		return false;
	}

	Click(): boolean {
		if (super.Click() || this.conditionCategoryData === null || this.conditionData === null)
			return true;

		if (!this.checkAccess())
			return false;


		if (MouseIn(1050, 175, 64, 64)) {
			this.changes = this.makeChangesData();
			this.changes.data.enforce = !this.changes.data.enforce;
			return true;
		}

		if (MouseIn(1050, 275, 64, 64)) {
			this.changes = this.makeChangesData();
			this.changes.data.log = !this.changes.data.log;
			return true;
		}

		return false;
	}
}
