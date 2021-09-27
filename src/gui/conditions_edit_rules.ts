import { ChatroomCharacter } from "../characters";
import { GuiConditionEdit } from "./conditions_edit_base";
import { GuiSubscreen } from "./subscreen";
import { RuleCustomDataHandler, ruleCustomDataHandlers, RulesGetDisplayDefinition } from "../modules/rules";
import { Views, HELP_TEXTS } from "../helpTexts";

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

		let Y = 175;

		////// right side: special rules category options
		if (this.definition.enforcabe !== false) {
			DrawCheckbox(1050, Y, 64, 64, "Enforce this rule", data.data.enforce, !access);
			Y += 100;
		}
		if (this.definition.loggable !== false) {
			DrawCheckbox(1050, Y, 64, 64, "Behaviour log entry when rule is violated", data.data.log, !access);
			Y += 100;
		}

		Y += 45;

		if (this.definition.dataDefinition) {
			for (const [k, v] of Object.entries<RuleCustomDataEntryDefinition>(this.definition.dataDefinition)) {
				const handler: RuleCustomDataHandler = ruleCustomDataHandlers[v.type];
				handler.run(v, data.data.customData![k], v.Y ?? Y, k);
			}
		}

		// help text
		if (this.showHelp) {
			MainCanvas.fillStyle = "#ffff88";
			MainCanvas.fillRect(95, 80, 800, 600);
			MainCanvas.strokeStyle = "Black";
			MainCanvas.strokeRect(95, 80, 800, 600);
			MainCanvas.textAlign = "left";
			DrawTextWrap(HELP_TEXTS[Views.ConditionsEditRules], 115 - 760 / 2, 100, 760, 560, "black");
		}

		return false;
	}

	Click(): boolean {
		if (super.Click() || this.conditionCategoryData === null || this.conditionData === null)
			return true;

		if (!this.checkAccess())
			return false;

		let Y = 175;

		if (this.definition.enforcabe !== false) {
			if (MouseIn(1050, Y, 64, 64)) {
				this.changes = this.makeChangesData();
				this.changes.data.enforce = !this.changes.data.enforce;
				return true;
			}
			Y += 100;
		}

		if (this.definition.loggable !== false) {
			if (MouseIn(1050, Y, 64, 64)) {
				this.changes = this.makeChangesData();
				this.changes.data.log = !this.changes.data.log;
				return true;
			}
			Y += 100;
		}

		Y += 45;

		if (this.definition.dataDefinition) {
			for (const [k, v] of Object.entries<RuleCustomDataEntryDefinition>(this.definition.dataDefinition)) {
				const handler: RuleCustomDataHandler = ruleCustomDataHandlers[v.type];
				if (handler.click) {
					const data = this.changes ?? this.conditionData;
					const res = handler.click(v, data.data.customData![k], v.Y ?? Y, k);
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
