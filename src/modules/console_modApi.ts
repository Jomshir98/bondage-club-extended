import { cloneDeep } from "lodash-es";
import { debugContextStart } from "../BCXContext";
import { reportManualError } from "../errorReporting";
import { BCXGlobalEventSystem, TypedEventEmitter } from "../event";
import { isObject } from "../utils";
import { ConditionsGetCondition, ConditionsIsConditionInEffect } from "./conditions";
import { sendQuery } from "./messaging";
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
				extraInfo: () => `mod: ${this.modName}; rule: ${this.rule}`,
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
				extraInfo: () => `mod: ${this.modName}; rule: ${this.rule}`,
			});
			this.#ruleState.triggerAttempt(targetCharacter, dictionary);
			context.end();
		} else {
			throw Error("Invalid data");
		}
	}
}

export class ModCurseInfo implements BCX_CurseInfo {
	readonly active: boolean;

	readonly group: AssetGroupName;
	readonly asset: Asset | null;

	readonly color?: ItemColor;
	readonly curseProperty: boolean;
	readonly property?: ItemProperties;
	readonly craft?: CraftingItem;

	constructor(group: AssetGroupName, state: ConditionsConditionData<"curses">) {
		this.group = group;
		this.active = ConditionsIsConditionInEffect("curses", group);

		if (state.data != null) {
			const asset = AssetGet(Player.AssetFamily, group, state.data.Name);
			if (asset == null) {
				throw new Error(`Asset "${state.data.Name}" not found`);
			}

			this.asset = asset;
			this.color = cloneDeep(state.data.Color);
			this.curseProperty = state.data.curseProperty;
			this.property = cloneDeep(state.data.Property);
			this.craft = cloneDeep(state.data.Craft);
		} else {
			this.asset = null;
			this.color = undefined;
			this.curseProperty = false;
			this.property = undefined;
			this.craft = undefined;
		}
	}
}

export class ModAPI extends TypedEventEmitter<BCX_Events> implements BCX_ModAPI {
	readonly modName: string;

	constructor(modName: string) {
		super();
		this.modName = modName;

		BCXGlobalEventSystem.onAny((event) => {
			const context = debugContextStart("ModApiEvent", {
				modArea: this.modName,
				extraInfo: () => `mod: ${this.modName}; event: ${event.event}`,
			});
			try {
				this.emit(event.event, event.data);
			} catch (error) {
				reportManualError("While emitting BCX event", error);
			}
			context.end();
		});
	}

	getRuleState<ID extends BCX_Rule>(rule: ID): BCX_RuleStateAPI<ID> | null {
		const context = debugContextStart("ModApi::getRuleState", {
			modArea: "BCX",
			extraInfo: () => `mod: ${this.modName}, rule: ${rule}`,
		});
		try {
			const state = RulesGetRuleState(rule);
			return Object.freeze(new ModRuleState(this.modName, state));
		} catch (_) {
			return null;
		} finally {
			context.end();
		}
	}

	getCurseInfo(group: AssetGroupName): BCX_CurseInfo | null {
		if (typeof group !== "string" || AssetGroupGet(Player.AssetFamily, group) == null) {
			throw new Error(`Attempt to get curse of invalid group "${group}"`);
		}

		const context = debugContextStart("ModApi::getCurseInfo", {
			modArea: "BCX",
			extraInfo: () => `mod: ${this.modName}, group: ${group}`,
		});
		try {
			const curseCondition = ConditionsGetCondition("curses", group);
			return curseCondition != null ? Object.freeze(new ModCurseInfo(group, curseCondition)) : null;
		} catch (error) {
			reportManualError("While processing ModApi::getCurseInfo", error);
			return null;
		} finally {
			context.end();
		}
	}

	sendQuery<T extends keyof BCX_queries>(
		type: T,
		data: BCX_queries[T][0],
		target: number | "Player",
		timeout: number = 10_000
	): Promise<BCX_queries[T][1]> {
		if (typeof type !== "string") {
			throw new Error("Invalid type specified");
		}
		if (target !== "Player" && (typeof target !== "number" || !Number.isSafeInteger(target))) {
			throw new Error("Invalid target specified");
		}
		if (typeof timeout !== "number" || Number.isNaN(timeout) || timeout < 0) {
			throw new Error("Invalid timeout specified");
		}

		// Clone both sent and received data to avoid any sneaky references getting into internal data structures
		return sendQuery(type, cloneDeep(data), target === "Player" ? Player.MemberNumber : target, timeout)
			.then((result) => cloneDeep(result))
			.catch((err) => {
				throw new Error("Error processing query", { cause: err });
			});
	}
}
