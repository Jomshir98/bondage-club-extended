import { ChatroomCharacter } from "../characters";
import { setSubscreen } from "../modules/gui";
import { RulesGetDisplayDefinition, RULE_ICONS } from "../modules/rules";
import { DrawImageEx, showHelp } from "../utilsClub";
import { GuiConditionEditRules } from "./conditions_edit_rules";
import { GuiConditionGlobalRules } from "./conditions_global_rules";
import { ConditionEntry, GuiConditionView } from "./conditions_view_base";
import { GuiRulesAdd } from "./rules_add";
import { Views, HELP_TEXTS } from "../helpTexts";
import { dictionaryProcess } from "../utils";
import { GuiRulesViewDescription } from "./rules_viewDescription";

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

		DrawButton(120, 820, 384, 90, "Add new rule", "White", "",
			"...from the list of yet unestablished rules");

		// help text
		if (this.showHelp) {
			showHelp(HELP_TEXTS[Views.ConditionsViewRules]);
		}
		return false;
	}

	override Click(): boolean {
		if (super.Click() || this.conditionCategoryData === null)
			return true;

		if (MouseIn(120, 820, 384, 90)) {
			setSubscreen(new GuiRulesAdd(this.character));
			return true;
		}

		return false;
	}

	protected removeLabel: string = "Remove rule";

	protected drawCategoryImage(X: number, Y: number, entry: dataEntry): void {
		DrawImageEx(RULE_ICONS[entry.extra.definition.type], X + 6, Y + 6, {
			Height: 50,
			Width: 50,
		});
	}

	protected drawEntryExtra(X: number, Y: number, entry: dataEntry): void {
		if (entry.extra.definition.enforceable !== false) {
			DrawImageEx("Icons/Management.png", X + 610, Y + 10, {
				Height: 40,
				Width: 40,
				Alpha: entry.data.data.enforce ? 1 : 0.2,
			});
			if (MouseIn(X + 610, Y + 6, 44, 44)) {
				DrawHoverElements.push(() => {
					DrawButtonHover(X + 610, Y + 6, 44, 44, entry.data.data.enforce ? "Rule will be enforced" : "Rule will not be enforced");
				});
			}
		}
		if (entry.extra.definition.loggable !== false) {
			DrawImageEx("Icons/Title.png", X + 660, Y + 10, {
				Height: 40,
				Width: 40,
				Alpha: entry.data.data.log ? 1 : 0.2,
			});
			if (MouseIn(X + 660, Y + 6, 44, 44)) {
				DrawHoverElements.push(() => {
					DrawButtonHover(X + 660, Y + 6, 44, 44, entry.data.data.log ? "Rule violations will be logged" : "Rule violations will not be logged");
				});
			}
		}
	}

	protected headerText(): string {
		return `Rules: All active rules on ${this.character.Name}`;
	}

	protected loadCondition(condition: ConditionsCategoryKeys["rules"], data: ConditionsConditionPublicData<"rules">): [string, RuleEntry] | null {
		const definition = RulesGetDisplayDefinition(condition);
		return [definition.name, { definition }];
	}

	protected showDetailedDescriptionBackground(X: number): void {
		const backgroundY = 170;

		DrawRect(X, backgroundY, 801, 600, "White");
		DrawEmptyRect(X, backgroundY, 801, 600, "Black");
	}

	protected showDetailedDescriptionText(X: number, condition: ConditionsCategoryKeys["rules"], data: dataEntry): void {
		const backgroundY = 170;

		MainCanvas.textAlign = "left";
		DrawTextWrap(dictionaryProcess(data.extra.definition.longDescription, { PLAYER_NAME: this.character.Name }), X + 20 - 760 / 2, backgroundY + 20, 760, 560, "black");
	}

	protected onDescriptionTextClick(condition: ConditionsCategoryKeys["rules"], data: dataEntry): void {
		setSubscreen(new GuiRulesViewDescription(this.character, this, condition, false));
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
