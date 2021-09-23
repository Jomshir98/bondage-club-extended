import { ChatroomCharacter } from "../characters";
import { setSubscreen } from "../modules/gui";
import { RulesGetDisplayDefinition } from "../modules/rules";
import { DrawImageEx, showHelp } from "../utilsClub";
import { GuiConditionEditRules } from "./conditions_edit_rules";
import { GuiConditionGlobalRules } from "./conditions_global_rules";
import { ConditionEntry, GuiConditionView } from "./conditions_view_base";
import { GuiRulesAdd } from "./rules_add";
import { Views, HELP_TEXTS } from "../helpTexts";

interface RuleEntry {
	definition: RuleDisplayDefinition;
}

type dataEntry = ConditionEntry<"rules", RuleEntry>;

export class GuiConditionViewRules extends GuiConditionView<"rules", RuleEntry> {

	constructor(character: ChatroomCharacter) {
		super(character, "rules");
	}

	override Run(): boolean {
		if (super.Run() || this.conditionCategoryData === null)
			return true;

		const access = this.conditionCategoryData.access_normal || this.conditionCategoryData.access_limited;
		DrawButton(120, 820, 384, 90, "Create new rule", access ? "White" : "#ddd", "",
			access ? "Create new rule from list of available rules" : "You have no permission to use this", !access);

		// help text
		if (this.showHelp) {
			showHelp(HELP_TEXTS[Views.ConditionsViewRules]);
		}
		return false;
	}

	override Click(): boolean {
		if (super.Click() || this.conditionCategoryData === null)
			return true;

		const access = this.conditionCategoryData.access_normal || this.conditionCategoryData.access_limited;
		if (access && MouseIn(120, 820, 384, 90)) {
			setSubscreen(new GuiRulesAdd(this.character));
			return true;
		}

		return false;
	}

	protected removeLabel: string = "Delete rule";

	protected drawCategoryImage(X: number, Y: number, data: dataEntry): void {
		DrawImageEx(data.extra.definition.icon, X + 6, Y + 6, {
			Height: 50,
			Width: 50
		});
	}

	protected drawEntryExtra(X: number, Y: number, data: dataEntry): void {
		// TODO
	}

	protected headerText(): string {
		return `Rules: All active rules on ${this.character.Name}`;
	}

	protected loadCondition(condition: ConditionsCategoryKeys["rules"], data: ConditionsConditionPublicData<"rules">): [string, RuleEntry] | null {
		const definition = RulesGetDisplayDefinition(condition);
		return [definition.name, { definition }];
	}

	protected openEditSubscreen(condition: ConditionsCategoryKeys["rules"]): void {
		setSubscreen(new GuiConditionEditRules(this.character, condition, this));
	}

	protected removeCondition(condition: ConditionsCategoryKeys["rules"]): void {
		this.character.ruleDelete(condition);
	}

	protected openGlobalConfig(): void {
		setSubscreen(new GuiConditionGlobalRules(this.character, this));
	}
}
