import { cloneDeep } from "lodash-es";
import { debugContextStart } from "../BCXContext";
import { isObject } from "../utils";
import { RulesGetRuleState, RuleState } from "./rules";

export class ModRuleState<ID extends BCX_Rule> implements BCX_RuleStateAPI<ID> {
	readonly modName: string;
	readonly rule: ID;

	readonly #ruleState: RuleState<ID>;

	constructor(modName: string, state: RuleState<ID>) {
		this.modName = modName;
		this.rule = state.rule;
		this.#ruleState = state;
	}

	get ruleDefinition(): RuleDisplayDefinition<ID> {
		return cloneDeep(this.#ruleState.ruleDefinition);
	}

	get condition(): ConditionsConditionData<"rules"> | undefined {
		return cloneDeep(this.#ruleState.condition);
	}

	get inEffect(): boolean {
		return this.#ruleState.inEffect;
	}
	get isEnforced(): boolean {
		return this.#ruleState.isEnforced;
	}
	get isLogged(): boolean {
		return this.#ruleState.isLogged;
	}

	get customData(): ID extends keyof RuleCustomData ? (RuleCustomData[ID] | undefined) : undefined {
		return cloneDeep(this.#ruleState.customData);
	}
	get internalData(): ID extends keyof RuleInternalData ? (RuleInternalData[ID] | undefined) : undefined {
		return cloneDeep(this.#ruleState.internalData);
	}

	trigger(targetCharacter: number | null = null, dictionary: Record<string, string> = {}): void {
		if (
			(targetCharacter === null || typeof targetCharacter === "number") &&
			isObject(dictionary) &&
			Object.values(dictionary).every(v => typeof v === "string")
		) {
			const context = debugContextStart("ModApiRuleTrigger", {
				modArea: this.modName,
				extraInfo: () => `mod: ${this.modName}; rule: ${this.rule}`
			});
			this.#ruleState.trigger(targetCharacter, dictionary);
			context.end();
		} else {
			throw Error("Invalid data");
		}
	}

	triggerAttempt(targetCharacter: number | null = null, dictionary: Record<string, string> = {}): void {
		if (
			(targetCharacter === null || typeof targetCharacter === "number") &&
			isObject(dictionary) &&
			Object.values(dictionary).every(v => typeof v === "string")
		) {
			const context = debugContextStart("ModApiRuleTriggerAttempt", {
				modArea: this.modName,
				extraInfo: () => `mod: ${this.modName}; rule: ${this.rule}`
			});
			this.#ruleState.triggerAttempt(targetCharacter, dictionary);
			context.end();
		} else {
			throw Error("Invalid data");
		}
	}
}

export class ModAPI implements BCX_ModAPI {
	readonly modName: string;

	constructor(modName: string) {
		this.modName = modName;
	}

	getRuleState<ID extends BCX_Rule>(rule: ID): BCX_RuleStateAPI<ID> | null {
		try {
			const state = RulesGetRuleState(rule);
			return Object.freeze(new ModRuleState(this.modName, state));
		} catch (_) {
			return null;
		}
	}
}
