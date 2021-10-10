import { ChatroomCharacter } from "../characters";
import { setSubscreen } from "../modules/gui";
import { GuiSubscreen } from "./subscreen";
import { RulesGetDisplayDefinition } from "../modules/rules";
import { dictionaryProcess } from "../utils";
import { GuiConditionEditRules } from "./conditions_edit_rules";
import { GuiConditionViewRules } from "./conditions_view_rules";

export class GuiRulesViewDescription extends GuiSubscreen {

	readonly character: ChatroomCharacter;
	readonly back: GuiSubscreen;

	readonly rule: BCX_Rule;
	readonly ruleDefinition: RuleDisplayDefinition;

	private allowAdd: boolean;

	constructor(character: ChatroomCharacter, back: GuiSubscreen, rule: BCX_Rule, allowAdd: boolean) {
		super();
		this.character = character;
		this.back = back;
		this.rule = rule;
		this.ruleDefinition = RulesGetDisplayDefinition(rule);
		this.allowAdd = allowAdd;
	}

	onChange(sender: number) {
		if (sender === this.character.MemberNumber) {
			this.Exit();
		}
	}

	Run() {
		MainCanvas.textAlign = "left";
		DrawText(`- Rules: Description of the rule: "${this.ruleDefinition.name}"-`, 125, 125, "Black", "Gray");

		MainCanvas.textAlign = "left";
		DrawTextWrap(dictionaryProcess(this.ruleDefinition.longDescription, { PLAYER_NAME: this.character.Name }), 125 - 1750 / 2, 230, 1750, 520, "Black");

		MainCanvas.textAlign = "center";
		if (this.allowAdd) {
			DrawButton(700, 800, 200, 80, "Add", "White");
			DrawButton(1100, 800, 200, 80, "Back", "White");
		} else {
			DrawButton(900, 800, 200, 80, "Back", "White");
		}
	}

	Click() {
		if (this.allowAdd) {
			if (MouseIn(700, 800, 200, 80)) {
				this.character.ruleCreate(this.rule).then(result => {
					if (result) {
						setSubscreen(new GuiConditionEditRules(this.character, this.rule, new GuiConditionViewRules(this.character)));
					}
				});
			}
			if (MouseIn(1100, 800, 200, 80)) {
				return this.Exit();
			}
		} else {
			if (MouseIn(900, 800, 200, 80)) {
				this.Exit();
			}
		}
	}

	Exit() {
		setSubscreen(this.back);
	}
}
