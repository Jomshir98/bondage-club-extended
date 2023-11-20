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
		const access = this.checkAccess();

		if (this.definition.dataDefinition) {
			for (const [k, v] of Object.entries<RuleCustomDataEntryDefinition>(this.definition.dataDefinition)) {
				const handler: RuleCustomDataHandler = ruleCustomDataHandlers[v.type];
				handler.onDataChange?.({
					def: v,
					active,
					key: k,
					onInput: () => {
						this.changes = this.makeChangesData();
						this.processInputs();
					},
					value: data?.data.customData![k] ?? (typeof v.default === "function" ? v.default() : v.default),
					access,
				});
			}
		}

	}

	protected override processInputs() {
		super.processInputs();

		if (this.changes && this.definition.dataDefinition) {
			for (const [k, v] of Object.entries<RuleCustomDataEntryDefinition>(this.definition.dataDefinition)) {
				const handler: RuleCustomDataHandler = ruleCustomDataHandlers[v.type];
				if (handler.processInput) {
					const res = handler.processInput({
						def: v,
						key: k,
						value: this.changes.data.customData![k],
					});
					if (res !== undefined) {
						if (!handler.validate(res, v)) {
							console.error("processInput result failed to validate", res, v);
							throw new Error("processInput result failed to validate");
						}
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
		if (this.definition.enforceable !== false) {
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
				handler.run({
					def: v,
					value: data.data.customData![k],
					Y: v.Y ?? Y,
					key: k,
					target: this.character,
					access,
				});
			}
		}

		// help text
		if (this.showHelp) {
			DrawRect(95, 80, 800, 600, "#ffff88");
			DrawEmptyRect(95, 80, 800, 600, "Black");
			MainCanvas.textAlign = "left";
			DrawTextWrap(HELP_TEXTS[Views.ConditionsEditRules], 115 - 760 / 2, 100, 760, 560, "black");
		}

		return false;
	}

	Click(): boolean {
		if (super.Click() || this.conditionCategoryData === null || this.conditionData === null)
			return true;

		const access = this.checkAccess();

		let Y = 175;

		if (this.definition.enforceable !== false) {
			if (access && MouseIn(1050, Y, 64, 64)) {
				this.changes = this.makeChangesData();
				this.changes.data.enforce = !this.changes.data.enforce;
				return true;
			}
			Y += 100;
		}

		if (this.definition.loggable !== false) {
			if (access && MouseIn(1050, Y, 64, 64)) {
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
					const res = handler.click({
						def: v,
						value: data.data.customData![k],
						Y: v.Y ?? Y,
						key: k,
						target: this.character,
						access,
					});
					if (access && res !== undefined) {
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
					handler.unload({
						def: v,
						key: k,
					});
				}
			}
		}
		super.Unload();
	}
}
