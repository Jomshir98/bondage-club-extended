import { ChatroomCharacter } from "../characters";
import { GuiConditionEdit } from "./conditions_edit_base";
import { GuiSubscreen } from "./subscreen";
import { RuleCustomDataHandler, ruleCustomDataHandlers, RulesGetDisplayDefinition } from "../modules/rules";
import { Views, HELP_TEXTS } from "../helpTexts";
import { showHelp } from "../utilsClub";

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

		const active = !!this.conditionCategoryData && !!this.conditionData;
		const data = this.changes ?? this.conditionData;

		if (this.definition.dataDefinition) {
			for (const [k, v] of Object.entries<RuleCustomDataEntryDefinition>(this.definition.dataDefinition)) {
				const handler: RuleCustomDataHandler = ruleCustomDataHandlers[v.type];
				handler.onDataChange?.(v, active, k, () => {
					this.changes = this.makeChangesData();
					this.processInputs();
				}, data?.data.customData![k] ?? v.default);
			}
		}

	}

	protected override processInputs() {
		super.processInputs();

		if (this.changes && this.definition.dataDefinition) {
			for (const [k, v] of Object.entries<RuleCustomDataEntryDefinition>(this.definition.dataDefinition)) {
				const handler: RuleCustomDataHandler = ruleCustomDataHandlers[v.type];
				if (handler.processInput) {
					const res = handler.processInput(v, k);
					if (res !== undefined) {
						this.changes.data.customData![k] = res;
					}
				}
			}
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

		if (this.definition.dataDefinition) {
			for (const [k, v] of Object.entries<RuleCustomDataEntryDefinition>(this.definition.dataDefinition)) {
				const handler: RuleCustomDataHandler = ruleCustomDataHandlers[v.type];
				const Y = v.Y ?? 400;
				handler.run(v, data.data.customData![k], Y, k);
			}
		}

		// help text
		if (this.showHelp) {
			showHelp(HELP_TEXTS[Views.ConditionsEditRules]);
		}

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

		if (this.definition.dataDefinition) {
			for (const [k, v] of Object.entries<RuleCustomDataEntryDefinition>(this.definition.dataDefinition)) {
				const handler: RuleCustomDataHandler = ruleCustomDataHandlers[v.type];
				if (handler.click) {
					const Y = v.Y ?? 400;
					const data = this.changes ?? this.conditionData;
					const res = handler.click(v, data.data.customData![k], Y, k);
					if (res !== undefined) {
						this.changes = this.makeChangesData();
						this.changes.data.customData![k] = res;
						return true;
					}
				}
			}
		}

		return false;
	}

	override Unload() {
		if (this.definition.dataDefinition) {
			for (const [k, v] of Object.entries<RuleCustomDataEntryDefinition>(this.definition.dataDefinition)) {
				const handler: RuleCustomDataHandler = ruleCustomDataHandlers[v.type];
				if (handler.unload) {
					handler.unload(v, k);
				}
			}
		}
		super.Unload();
	}
}
