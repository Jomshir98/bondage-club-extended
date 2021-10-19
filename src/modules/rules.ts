import cloneDeep from "lodash-es/cloneDeep";
import isEqual from "lodash-es/isEqual";
import { ChatroomCharacter } from "../characters";
import { ModuleCategory, ModuleInitPhase, Preset, ConditionsLimit } from "../constants";
import { moduleInitPhase } from "../moduleManager";
import { initRules_bc_alter } from "../rules/bc_alter";
import { initRules_bc_blocks } from "../rules/bc_blocks";
import { initRules_bc_relation_control } from "../rules/relation_control";
import { initRules_bc_speech_control } from "../rules/speech_control";
import { initRules_other } from "../rules/other";
import { capitalizeFirstLetter, clamp, dictionaryProcess, formatTimeInterval, isObject } from "../utils";
import { ChatRoomActionMessage, ChatRoomSendLocal, getCharacterName, InfoBeep } from "../utilsClub";
import { AccessLevel, registerPermission } from "./authority";
import { Command_fixExclamationMark, Command_pickAutocomplete, registerWhisperCommand } from "./commands";
import { ConditionsAutocompleteSubcommand, ConditionsCheckAccess, ConditionsGetCategoryPublicData, ConditionsGetCondition, ConditionsIsConditionInEffect, ConditionsRegisterCategory, ConditionsRemoveCondition, ConditionsRunSubcommand, ConditionsSetCondition, ConditionsSubcommand, ConditionsSubcommands } from "./conditions";
import { LogEntryType, logMessage } from "./log";
import { queryHandlers } from "./messaging";
import { moduleIsEnabled } from "./presets";
import { BaseModule } from "./_BaseModule";

const RULES_ANTILOOP_RESET_INTERVAL = 60_000;
const RULES_ANTILOOP_THRESHOLD = 10;
const RULES_ANTILOOP_SUSPEND_TIME = 600_000;

export function guard_BCX_Rule(name: unknown): name is BCX_Rule {
	return typeof name === "string" && rules.has(name as BCX_Rule);
}

export function guard_RuleCustomData(rule: BCX_Rule, data: unknown): boolean {
	const descriptor = rules.get(rule as BCX_Rule);
	if (!descriptor)
		return false;

	if (descriptor.dataDefinition) {
		if (!isObject(data))
			return false;
		for (const k of Object.keys(data)) {
			if (!(descriptor.dataDefinition as Record<string, any>)[k])
				return false;
		}
		for (const [k, def] of Object.entries<RuleCustomDataEntryDefinition>(descriptor.dataDefinition)) {
			const handler = ruleCustomDataHandlers[def.type];
			if (!handler || !handler.validate(data[k], def))
				return false;
		}
	} else if (data !== undefined) {
		return false;
	}

	return true;
}

interface RuleEntry<ID extends BCX_Rule> extends RuleDefinition<ID> {
	state: RuleState<ID>;
}

const rules: Map<BCX_Rule, RuleEntry<BCX_Rule>> = new Map();
const rulesList: BCX_Rule[] = [];

export function registerRule<ID extends BCX_Rule>(name: ID, data: RuleDefinition<ID>) {
	if (moduleInitPhase !== ModuleInitPhase.init) {
		throw new Error("Rules can be registered only during init");
	}
	if (rules.has(name)) {
		throw new Error(`Rule "${name}" already defined!`);
	}
	rules.set(name, {
		...(data as RuleDefinition<BCX_Rule>),
		state: new RuleState<BCX_Rule>(name, data)
	});
	rulesList.push(name);
}

export function RulesGetDisplayDefinition(rule: BCX_Rule): RuleDisplayDefinition {
	const data = rules.get(rule);
	if (!data) {
		throw new Error(`Attempt to get display definition for unknown rule '${rule}'`);
	}
	return {
		name: data.name,
		icon: data.icon,
		shortDescription: data.shortDescription,
		longDescription: data.longDescription,
		triggerTexts: data.triggerTexts,
		defaultLimit: data.defaultLimit,
		enforceable: data.enforceable,
		loggable: data.loggable,
		dataDefinition: data.dataDefinition
	};
}

export function RulesGetRuleState<ID extends BCX_Rule>(rule: ID): RuleState<ID> {
	const data = rules.get(rule);
	if (!data) {
		throw new Error(`Attempt to get state for unknown rule '${rule}'`);
	}
	return data.state as RuleState<ID>;
}

export type RuleCustomDataHandler<type extends RuleCustomDataTypes = RuleCustomDataTypes> = {
	validate(value: unknown, def: RuleCustomDataEntryDefinition): boolean;
	onDataChange?(def: RuleCustomDataEntryDefinition, active: boolean, key: string, onInput: () => void, value: RuleCustomDataTypesMap[type]): void;
	processInput?(def: RuleCustomDataEntryDefinition, key: string, value: RuleCustomDataTypesMap[type]): RuleCustomDataTypesMap[type] | undefined;
	unload?(def: RuleCustomDataEntryDefinition, key: string): void;
	run(def: RuleCustomDataEntryDefinition, value: RuleCustomDataTypesMap[type], Y: number, key: string): void;
	click?(def: RuleCustomDataEntryDefinition, value: RuleCustomDataTypesMap[type], Y: number, key: string): RuleCustomDataTypesMap[type] | undefined;
};

const ruleCustomDataHandlerPage: Map<string, number> = new Map();

export const ruleCustomDataHandlers: {
	[type in RuleCustomDataTypes]: RuleCustomDataHandler<type>;
} = {
	memberNumberList: {
		validate: value => Array.isArray(value) && value.every(Number.isInteger),
		onDataChange(def, active, key) {
			let input = document.getElementById(`BCX_RCDH_${key}`) as HTMLInputElement | undefined;
			if (!active) {
				if (input) {
					input.remove();
				}
			} else if (!input) {
				input = ElementCreateInput(`BCX_RCDH_${key}`, "text", "", "100");
				input.inputMode = "numeric";
				input.pattern = "[0-9]+";
			}
		},
		run(def, value, Y, key) {
			Y -= 20;
			const PAGE_SIZE = 4;
			const totalPages = Math.max(1, Math.ceil(value.length / PAGE_SIZE));
			const page = clamp(ruleCustomDataHandlerPage.get(key) ?? 0, 0, totalPages - 1);
			DrawTextFit(def.description, 1050, Y + 0, 900, "Black");
			for (let i = 0; i < PAGE_SIZE; i++) {
				const e = page * PAGE_SIZE + i;
				if (e >= value.length)
					break;
				MainCanvas.strokeRect(1050, Y + 26 + i * 70, 766, 64);
				const msg = `${getCharacterName(value[e], "[unknown]")} (${value[e]})`;
				DrawTextFit(msg, 1060, Y + 26 + i * 70 + 34, 380, "Black");
				MainCanvas.textAlign = "center";
				DrawButton(1836, Y + 26 + i * 70, 64, 64, "X", "White");
				MainCanvas.textAlign = "left";
			}
			ElementPositionFix(`BCX_RCDH_${key}`, 40, 1050, Y + PAGE_SIZE * 70 + 43, 450, 60);
			MainCanvas.textAlign = "center";
			const input = document.getElementById(`BCX_RCDH_${key}`) as HTMLInputElement | undefined;
			if (input && document.activeElement === input) {
				DrawHoverElements.push(() => {
					const val = input.value && Number.parseInt(input.value, 10);
					if (!val)
						return;
					const Left = 580;
					const Top = 630;
					MainCanvas.fillStyle = "#FFFF88";
					MainCanvas.fillRect(Left, Top, 450, 65);
					MainCanvas.lineWidth = 2;
					MainCanvas.strokeStyle = 'black';
					MainCanvas.strokeRect(Left, Top, 450, 65);
					DrawTextFit(getCharacterName(val, "[unknown]"), Left + 225, Top + 33, 444, "black");
				});
			}
			DrawButton(1530, Y + PAGE_SIZE * 70 + 43, 100, 64, "Add", "White");
			DrawBackNextButton(1650, Y + PAGE_SIZE * 70 + 43, 250, 64, `Page ${page + 1}/${totalPages}`, "White", undefined, () => "", () => "");
			MainCanvas.textAlign = "left";
		},
		click(def, value, Y, key) {
			Y -= 20;
			const PAGE_SIZE = 4;
			const totalPages = Math.max(1, Math.ceil(value.length / PAGE_SIZE));
			const page = clamp(ruleCustomDataHandlerPage.get(key) ?? 0, 0, totalPages - 1);
			for (let i = 0; i < PAGE_SIZE; i++) {
				const e = page * PAGE_SIZE + i;
				if (e >= value.length)
					break;
				if (MouseIn(1836, Y + 26 + i * 70, 64, 64)) {
					value.splice(e, 1);
					return value;
				}
			}
			const input = document.getElementById(`BCX_RCDH_${key}`) as HTMLInputElement | undefined;
			if (MouseIn(1530, Y + PAGE_SIZE * 70 + 43, 100, 64) && input && input.value) {
				const num = Number.parseInt(input.value, 10);
				if (Number.isInteger(num) && !value.includes(num)) {
					value.push(num);
					value.sort((a, b) => a - b);
					input.value = "";
					return value;
				}
			}
			if (MouseIn(1650, Y + PAGE_SIZE * 70 + 43, 125, 64) && page > 0) {
				ruleCustomDataHandlerPage.set(key, page - 1);
			} else if (MouseIn(1650 + 125, Y + PAGE_SIZE * 70 + 43, 125, 64) && page + 1 < totalPages) {
				ruleCustomDataHandlerPage.set(key, page + 1);
			}
			return undefined;
		},
		unload(def, key) {
			ElementRemove(`BCX_RCDH_${key}`);
			ruleCustomDataHandlerPage.delete(key);
		}
	},
	number: {
		validate: value => typeof value === "number" && Number.isInteger(value),
		onDataChange(def, active, key, onInput, value) {
			let input = document.getElementById(`BCX_RCDH_${key}`) as HTMLInputElement | undefined;
			if (!active) {
				if (input) {
					input.remove();
				}
			} else if (!input) {
				input = ElementCreateInput(`BCX_RCDH_${key}`, "text", value.toString(10), "50");
				input.inputMode = "numeric";
				input.pattern = "[0-9]+";
				input.oninput = onInput;
			} else {
				input.value = value.toString(10);
			}
		},
		processInput(def, key, value) {
			const input = document.getElementById(`BCX_RCDH_${key}`) as HTMLInputElement | undefined;
			if (input && input.value) {
				if (/^[0-9]+$/.test(input.value)) {
					return Number.parseInt(input.value, 10);
				} else {
					input.value = value.toString(10);
				}
			}
			return undefined;
		},
		run(def, value, Y, key) {
			DrawTextFit(def.description, 1050, Y + 0, 850, "Black");
			ElementPositionFix(`BCX_RCDH_${key}`, 40, 1050, Y + 26, 850, 60);
		},
		unload(def, key) {
			ElementRemove(`BCX_RCDH_${key}`);
		}
	},
	// element has Y length of 150px (description + elmement plus offset to the next one)
	orgasm: {
		validate: value => value === "edge" || value === "ruined" || value === "noResist",
		run(def, value, Y) {
			DrawTextFit(def.description, 1050, Y + 0, 900, "Black");
			const roleSelectionNext: typeof value = value === "edge" ? "ruined" : value === "ruined" ? "noResist" : "edge";
			const roleSelectionPrev: typeof value = value === "edge" ? "noResist" : value === "ruined" ? "edge" : "ruined";
			const display: Record<typeof value, string> = {
				edge: "Edge",
				ruined: "Ruin",
				noResist: "Prevent resisting"
			};
			MainCanvas.textAlign = "center";
			DrawBackNextButton(1050, Y + 46, 500, 60,
				display[value],
				"White", "",
				() => display[roleSelectionPrev],
				() => display[roleSelectionNext]
			);
			MainCanvas.textAlign = "left";
		},
		click(def, value, Y) {
			if (MouseIn(1050, Y + 46, 250, 60)) {
				return value === "edge" ? "noResist" : value === "ruined" ? "edge" : "ruined";
			}
			if (MouseIn(1050 + 250, Y + 46, 250, 60)) {
				return value === "edge" ? "ruined" : value === "ruined" ? "noResist" : "edge";
			}
			return undefined;
		}
	},
	poseSelect: {
		// TODO: stricten
		validate: value => Array.isArray(value) && value.every(i => typeof i === "string"),
		run(def, value, Y) { /* TODO */ },
		click(def, value, Y) { return undefined; }
	},
	// element has Y length of 150px (description + elmement plus offset to the next one)
	roleSelector: {
		validate: value => typeof value === "number" && AccessLevel[value] !== undefined,
		run(def, value, Y) {
			DrawTextFit(def.description, 1050, Y + 0, 900, "Black");
			const roleSelectionNext = value < AccessLevel.public ? value + 1 : AccessLevel.clubowner;
			const roleSelectionPrev = value > AccessLevel.clubowner ? value - 1 : AccessLevel.public;
			MainCanvas.textAlign = "center";
			DrawBackNextButton(1050, Y + 46, 250, 60,
				capitalizeFirstLetter(AccessLevel[value]) + (value !== AccessLevel.clubowner ? " ↑" : ""),
				"White", "",
				() => capitalizeFirstLetter(AccessLevel[roleSelectionPrev]),
				() => capitalizeFirstLetter(AccessLevel[roleSelectionNext])
			);
			MainCanvas.textAlign = "left";
		},
		click(def, value, Y) {
			if (MouseIn(1050, Y + 46, 125, 60)) {
				return value > AccessLevel.clubowner ? value - 1 : AccessLevel.public;
			}
			if (MouseIn(1050 + 125, Y + 46, 125, 60)) {
				return value < AccessLevel.public ? value + 1 : AccessLevel.clubowner;
			}
			return undefined;
		}
	},
	// element has Y length of 150px (description + elmement plus offset to the next one)
	strengthSelect: {
		validate: value => value === "light" || value === "medium" || value === "heavy",
		run(def, value, Y) {
			DrawTextFit(def.description, 1050, Y + 0, 900, "Black");
			const roleSelectionNext: typeof value = value === "light" ? "medium" : value === "medium" ? "heavy" : "light";
			const roleSelectionPrev: typeof value = value === "light" ? "heavy" : value === "medium" ? "light" : "medium";
			MainCanvas.textAlign = "center";
			DrawBackNextButton(1050, Y + 46, 250, 60,
				capitalizeFirstLetter(value),
				"White", "",
				() => capitalizeFirstLetter(roleSelectionPrev),
				() => capitalizeFirstLetter(roleSelectionNext)
			);
			MainCanvas.textAlign = "left";
		},
		click(def, value, Y) {
			if (MouseIn(1050, Y + 46, 125, 60)) {
				return value === "light" ? "heavy" : value === "medium" ? "light" : "medium";
			}
			if (MouseIn(1050 + 125, Y + 46, 125, 60)) {
				return value === "light" ? "medium" : value === "medium" ? "heavy" : "light";
			}
			return undefined;
		}
	},
	string: {
		validate: value => typeof value === "string",
		onDataChange(def, active, key, onInput, value) {
			let input = document.getElementById(`BCX_RCDH_${key}`) as HTMLInputElement | undefined;
			if (!active) {
				if (input) {
					input.remove();
				}
			} else if (!input) {
				input = ElementCreateInput(`BCX_RCDH_${key}`, "text", value, "160");
				input.oninput = onInput;
			} else {
				input.value = value;
			}
		},
		processInput(def, key) {
			const input = document.getElementById(`BCX_RCDH_${key}`) as HTMLInputElement | undefined;
			return input ? input.value : undefined;
		},
		run(def, value, Y, key) {
			DrawTextFit(def.description, 1050, Y + 0, 850, "Black");
			ElementPositionFix(`BCX_RCDH_${key}`, 40, 1050, Y + 26, 850, 60);
		},
		unload(def, key) {
			ElementRemove(`BCX_RCDH_${key}`);
		}
	},
	stringList: {
		validate: value => Array.isArray(value) && value.every(i => typeof i === "string"),
		onDataChange(def, active, key) {
			let input = document.getElementById(`BCX_RCDH_${key}`) as HTMLInputElement | undefined;
			if (!active) {
				if (input) {
					input.remove();
				}
			} else if (!input) {
				input = ElementCreateInput(`BCX_RCDH_${key}`, "text", "", "120");
			}
		},
		run(def, value, Y, key) {
			Y -= 20;
			const PAGE_SIZE = 4;
			const totalPages = Math.max(1, Math.ceil(value.length / PAGE_SIZE));
			const page = clamp(ruleCustomDataHandlerPage.get(key) ?? 0, 0, totalPages - 1);
			DrawTextFit(def.description, 1050, Y + 0, 900, "Black");
			for (let i = 0; i < PAGE_SIZE; i++) {
				const e = page * PAGE_SIZE + i;
				if (e >= value.length)
					break;
				MainCanvas.strokeRect(1050, Y + 26 + i * 70, 766, 64);
				const msg = value[e];
				DrawTextFit(msg, 1060, Y + 26 + i * 70 + 34, 380, "Black");
				MainCanvas.textAlign = "center";
				DrawButton(1836, Y + 26 + i * 70, 64, 64, "X", "White");
				MainCanvas.textAlign = "left";
			}
			ElementPositionFix(`BCX_RCDH_${key}`, 40, 1050, Y + PAGE_SIZE * 70 + 43, 450, 60);
			MainCanvas.textAlign = "center";
			DrawButton(1530, Y + PAGE_SIZE * 70 + 43, 100, 64, "Add", "White");
			DrawBackNextButton(1650, Y + PAGE_SIZE * 70 + 43, 250, 64, `Page ${page + 1}/${totalPages}`, "White", undefined, () => "", () => "");
			MainCanvas.textAlign = "left";
		},
		click(def, value, Y, key) {
			Y -= 20;
			const PAGE_SIZE = 4;
			const totalPages = Math.max(1, Math.ceil(value.length / PAGE_SIZE));
			const page = clamp(ruleCustomDataHandlerPage.get(key) ?? 0, 0, totalPages - 1);
			for (let i = 0; i < PAGE_SIZE; i++) {
				const e = page * PAGE_SIZE + i;
				if (e >= value.length)
					break;
				if (MouseIn(1836, Y + 26 + i * 70, 64, 64)) {
					value.splice(e, 1);
					return value;
				}
			}
			const input = document.getElementById(`BCX_RCDH_${key}`) as HTMLInputElement | undefined;
			if (MouseIn(1530, Y + PAGE_SIZE * 70 + 43, 100, 64) && input && input.value && !value.includes(input.value)) {
				value.push(input.value);
				value.sort();
				input.value = "";
				return value;
			}
			if (MouseIn(1650, Y + PAGE_SIZE * 70 + 43, 125, 64) && page > 0) {
				ruleCustomDataHandlerPage.set(key, page - 1);
			} else if (MouseIn(1650 + 125, Y + PAGE_SIZE * 70 + 43, 125, 64) && page + 1 < totalPages) {
				ruleCustomDataHandlerPage.set(key, page + 1);
			}
			return undefined;
		},
		unload(def, key) {
			ElementRemove(`BCX_RCDH_${key}`);
			ruleCustomDataHandlerPage.delete(key);
		}
	},
	textArea: {
		validate: value => typeof value === "string",
		onDataChange(def, active, key, onInput, value) {
			let input = document.getElementById(`BCX_RCDH_${key}`) as HTMLTextAreaElement | undefined;
			if (!active) {
				if (input) {
					input.remove();
				}
			} else if (!input) {
				input = document.createElement("textarea");
				input.id = `BCX_RCDH_${key}`;
				input.name = `BCX_RCDH_${key}`;
				input.value = value;
				input.maxLength = 10000;
				input.setAttribute("screen-generated", CurrentScreen);
				input.className = "HideOnPopup";
				input.oninput = onInput;
				document.body.appendChild(input);
			} else {
				input.value = value;
			}
		},
		processInput(def, key) {
			const input = document.getElementById(`BCX_RCDH_${key}`) as HTMLTextAreaElement | undefined;
			return input ? input.value : undefined;
		},
		run(def, value, Y, key) {
			DrawTextFit(def.description, 1000, Y + 0, 900, "Black");
			const input = document.getElementById(`BCX_RCDH_${key}`) as HTMLTextAreaElement | undefined;
			if (input && document.activeElement === input) {
				ElementPositionFix(`BCX_RCDH_${key}`, 36, 105, 170, 1790, 750);
			} else {
				ElementPositionFix(`BCX_RCDH_${key}`, 28, 1000, Y + 26, 900, 765 - Y);
			}
		},
		unload(def, key) {
			ElementRemove(`BCX_RCDH_${key}`);
		}
	},
	toggle: {
		validate: value => typeof value === "boolean",
		run(def, value, Y) {
			DrawCheckbox(1050, Y, 64, 64, def.description, value);
		},
		click(def, value, Y) {
			if (MouseIn(1050, Y, 64, 64)) {
				return !value;
			}
			return undefined;
		}
	}
};

function parseRuleName(selector: string, filter?: (ruleName: BCX_Rule) => boolean): [true, BCX_Rule] | [false, string] {
	selector = selector.toLocaleLowerCase();
	const rule = Array.from(rules.entries())
		.filter(r => !filter || filter(r[0]))
		.find(([ruleName, data]) => ruleName.toLocaleLowerCase() === selector || data.name.toLocaleLowerCase() === selector);
	return rule ? [true, rule[0]] : [false, `Unknown rule "${selector}".`];
}

function autocompleteRuleName(selector: string, filter?: (ruleName: BCX_Rule) => boolean): string[] {
	selector = selector.toLocaleLowerCase();

	let options: string[] = Array.from(rules.entries())
		.filter(r => r[1].name.toLocaleLowerCase().startsWith(selector) && (!filter || filter(r[0])))
		.map(r => r[1].name);

	if (options.length === 0) {
		options = Array.from(rules.entries())
			.filter(r => r[0].toLocaleLowerCase().startsWith(selector) && (!filter || filter(r[0])))
			.map(r => r[0]);
	}

	return options;
}

export function RulesGetList(): [BCX_Rule, RuleDisplayDefinition][] {
	return rulesList.map(rule => [rule, RulesGetDisplayDefinition(rule)]);
}

export function RulesCreate(rule: BCX_Rule, character: ChatroomCharacter | null): boolean {
	if (!moduleIsEnabled(ModuleCategory.Rules))
		return false;

	if (character && !ConditionsCheckAccess("rules", rule, character))
		return false;

	const display = RulesGetDisplayDefinition(rule);

	if (!ConditionsGetCondition("rules", rule)) {
		const ruleData: ConditionsCategorySpecificData["rules"] = {};
		if (display.dataDefinition) {
			ruleData.customData = {};
			for (const [k, v] of Object.entries<RuleCustomDataEntryDefinition>(display.dataDefinition)) {
				ruleData.customData[k] = cloneDeep(typeof v.default === "function" ? v.default() : v.default);
			}
		}
		ConditionsSetCondition("rules", rule, ruleData);
		if (character) {
			logMessage("rule_change", LogEntryType.plaintext, `${character} added a new rule: ${display.name}`);
			if (!character.isPlayer()) {
				ChatRoomSendLocal(`${character} gave you a new rule: "${display.name}"`);
			}
		}
	}

	return true;
}

export function RulesDelete(rule: BCX_Rule, character: ChatroomCharacter | null): boolean {
	if (!moduleIsEnabled(ModuleCategory.Rules))
		return false;

	if (character && !ConditionsCheckAccess("rules", rule, character))
		return false;

	const display = RulesGetDisplayDefinition(rule);

	if (ConditionsRemoveCondition("rules", rule) && character) {
		logMessage("rule_change", LogEntryType.plaintext, `${character} removed the rule: ${display.name}`);
		if (!character.isPlayer()) {
			ChatRoomSendLocal(`${character} removed your rule "${display.name}"`);
		}
	}

	return true;
}

export class RuleState<ID extends BCX_Rule> {
	readonly rule: ID;
	readonly ruleDefinition: RuleDisplayDefinition<ID>;

	get condition(): ConditionsConditionData<"rules"> | undefined {
		return ConditionsGetCondition("rules", this.rule);
	}

	get inEffect(): boolean {
		return ConditionsIsConditionInEffect("rules", this.rule);
	}

	get isEnforced(): boolean {
		const data = this.condition;
		if (!data || !this.inEffect)
			return false;
		return data.data.enforce !== false;
	}

	get isLogged(): boolean {
		const data = this.condition;
		if (!data || !this.inEffect)
			return false;
		return data.data.log !== false;
	}

	get customData(): ID extends keyof RuleCustomData ? (RuleCustomData[ID] | undefined) : undefined {
		return this.condition?.data.customData as any;
	}

	constructor(rule: ID, definition: RuleDisplayDefinition<ID>) {
		this.rule = rule;
		this.ruleDefinition = definition;
	}

	trigger(dictionary: Record<string, string> = {}): void {
		const texts = this.ruleDefinition.triggerTexts;
		if (texts) {
			if (texts.infoBeep) {
				InfoBeep("BCX: " + dictionaryProcess(texts.infoBeep, dictionary), 7_000);
			}
			if (this.isLogged) {
				const log = texts.log;
				if (log) {
					logMessage("rule_trigger", LogEntryType.ruleTrigger, [this.rule, dictionary]);
				}
				const announce = texts.announce ?? texts.log;
				if (announce) {
					ChatRoomActionMessage(`${dictionaryProcess(announce, dictionary)}.`);
				}
			}
		}
	}

	triggerAttempt(dictionary: Record<string, string> = {}): void {
		const texts = this.ruleDefinition.triggerTexts;
		if (texts) {
			const infoBeep = texts.attempt_infoBeep ?? texts.infoBeep;
			if (infoBeep) {
				InfoBeep("BCX: " + dictionaryProcess(infoBeep, dictionary), 7_000);
			}
			if (this.isLogged) {
				const log = texts.attempt_log;
				if (log) {
					logMessage("rule_trigger", LogEntryType.ruleTriggerAttempt, [this.rule, dictionary]);
				}
				const announce = texts.attempt_announce ?? texts.attempt_log;
				if (announce) {
					ChatRoomActionMessage(`${dictionaryProcess(announce, dictionary)}.`);
				}
			}
		}
	}
}

export class ModuleRules extends BaseModule {
	private resetTimer: number | null = null;
	private triggerCounts: Map<BCX_Rule, number> = new Map();
	private suspendedUntil: number | null = null;

	init() {
		registerPermission("rules_normal", {
			name: "Allows controlling non-limited rules",
			category: ModuleCategory.Rules,
			defaults: {
				[Preset.dominant]: [true, AccessLevel.lover],
				[Preset.switch]: [true, AccessLevel.lover],
				[Preset.submissive]: [false, AccessLevel.mistress],
				[Preset.slave]: [false, AccessLevel.mistress]
			}
		});
		registerPermission("rules_limited", {
			name: "Allows controlling limited rules",
			category: ModuleCategory.Rules,
			defaults: {
				[Preset.dominant]: [true, AccessLevel.owner],
				[Preset.switch]: [true, AccessLevel.owner],
				[Preset.submissive]: [false, AccessLevel.lover],
				[Preset.slave]: [false, AccessLevel.lover]
			}
		});
		registerPermission("rules_global_configuration", {
			name: "Allows editing the global rules configuration",
			category: ModuleCategory.Rules,
			defaults: {
				[Preset.dominant]: [true, AccessLevel.owner],
				[Preset.switch]: [true, AccessLevel.owner],
				[Preset.submissive]: [false, AccessLevel.lover],
				[Preset.slave]: [false, AccessLevel.lover]
			}
		});
		registerPermission("rules_change_limits", {
			name: "Allows to limit/block specific rules",
			category: ModuleCategory.Rules,
			defaults: {
				[Preset.dominant]: [true, AccessLevel.self],
				[Preset.switch]: [true, AccessLevel.self],
				[Preset.submissive]: [true, AccessLevel.self],
				[Preset.slave]: [false, AccessLevel.owner]
			}
		});

		queryHandlers.ruleCreate = (sender, resolve, data) => {
			if (guard_BCX_Rule(data)) {
				resolve(true, RulesCreate(data, sender));
			} else {
				resolve(false);
			}
		};
		queryHandlers.ruleDelete = (sender, resolve, data) => {
			if (guard_BCX_Rule(data)) {
				resolve(true, RulesDelete(data, sender));
			} else {
				resolve(false);
			}
		};

		registerWhisperCommand("rules", "- Manage rules", (argv, sender, respond) => {
			if (!moduleIsEnabled(ModuleCategory.Rules)) {
				return respond(`Rules module is disabled.`);
			}
			const subcommand = (argv[0] || "").toLocaleLowerCase();
			const rulesInfo = ConditionsGetCategoryPublicData("rules", sender).conditions;
			if (ConditionsSubcommands.includes(subcommand as ConditionsSubcommand)) {
				return ConditionsRunSubcommand("rules", argv, sender, respond);
			} else if (subcommand === "list") {
				let result = "Current rules:";
				for (const [k, v] of Object.entries(rulesInfo)) {
					const data = RulesGetDisplayDefinition(k as BCX_Rule);
					const timerText = `Timer: ${v.timer ? formatTimeInterval(v.timer - Date.now(), "short") : "∞"}`;
					result += `\n${data.name} | ${timerText}`;
				}
				respond(result);
			} else {
				respond(Command_fixExclamationMark(sender, `!rules usage (page 1):\n` +
					`!rules list - List all currently applied rules\n`
				));
				respond(Command_fixExclamationMark(sender, `!rules usage (page 2):\n` +
					`!rules setactive <rule> <yes/no> - Switch the rule and its conditions on and off\n` +
					`!rules triggers <rule> global <yes/no> - Set the trigger condition of this rule to the global configuration\n` +
					`!rules triggers <rule> help - Set the trigger configuration of a rule\n` +
					`!rules globaltriggers help - Set global trigger configuration\n` +
					`!rules timer <rule> help - Set timer options of a rule\n` +
					`!rules defaulttimer help - Set default timer options used on new rules\n` +
					`!rules setlimit <rule> <normal/limited/blocked> - Set a limit on certain <rule>\n` +
					`\nHint: If an argument contains spaces: "put it in quotes"`
				));
			}
		}, (argv, sender) => {
			if (!moduleIsEnabled(ModuleCategory.Rules)) {
				return [];
			}
			if (argv.length <= 1) {
				return Command_pickAutocomplete(argv[0], ["list", ...ConditionsSubcommands]);
			}

			const subcommand = argv[0].toLocaleLowerCase();

			if (ConditionsSubcommands.includes(subcommand as ConditionsSubcommand)) {
				return ConditionsAutocompleteSubcommand("rules", argv, sender);
			}

			return [];
		});

		ConditionsRegisterCategory("rules", {
			category: ModuleCategory.Rules,
			permission_normal: "rules_normal",
			permission_limited: "rules_limited",
			permission_configure: "rules_global_configuration",
			permission_changeLimits: "rules_change_limits",
			loadValidateConditionKey: rule => guard_BCX_Rule(rule),
			loadValidateCondition: (rule, data) => {
				const info = data.data;
				const descriptor = rules.get(rule as BCX_Rule);
				if (!descriptor) {
					console.error(`BCX: Bad data for rule ${rule}: descriptor not found, removing it`);
					return false;
				}

				if (!isObject(info) ||
					// eslint-disable-next-line @typescript-eslint/no-unnecessary-boolean-literal-compare
					(info.enforce !== undefined && info.enforce !== false) ||
					// eslint-disable-next-line @typescript-eslint/no-unnecessary-boolean-literal-compare
					(info.log !== undefined && info.log !== false)
				) {
					console.error(`BCX: Bad data for rule ${rule}, removing it`, info);
					return false;
				}

				if (descriptor.dataDefinition) {
					if (!isObject(info.customData)) {
						console.error(`BCX: Bad custom data for rule ${rule}, removing it`, info);
						return false;
					}
					for (const k of Object.keys(info.customData)) {
						if (!(descriptor.dataDefinition as Record<string, any>)[k]) {
							console.error(`BCX: Unknown custom data attribute '${k}' for rule ${rule}, removing it`, info);
							return false;
						}
					}
					for (const [k, def] of Object.entries<RuleCustomDataEntryDefinition>(descriptor.dataDefinition)) {
						const handler = ruleCustomDataHandlers[def.type];
						if (!handler) {
							console.error(`BCX: Custom data for rule ${rule} unknown type ${def.type}, removing it`, info);
							return false;
						}
						if (!handler.validate(info.customData[k], def)) {
							console.error(`BCX: Bad custom data ${k} for rule ${rule}, expected type ${def.type}, removing it`, info);
							return false;
						}
					}
				} else if (info.customData !== undefined) {
					console.error(`BCX: Custom data for rule ${rule} without data definition, removing it`, info);
					return false;
				}

				return true;
			},
			tickHandler: this.ruleTick.bind(this),
			makePublicData: (rule, data) => ({
				enforce: data.data.enforce ?? true,
				log: data.data.log ?? true,
				customData: cloneDeep(data.data.customData)
			}),
			validatePublicData: (rule, data) =>
				isObject(data) &&
				typeof data.enforce === "boolean" &&
				typeof data.log === "boolean" &&
				guard_RuleCustomData(rule, data.customData),
			updateCondition: (condition, data, updateData) => {
				if (updateData.enforce) {
					delete data.data.enforce;
				} else {
					data.data.enforce = false;
				}

				if (updateData.log) {
					delete data.data.log;
				} else {
					data.data.log = false;
				}

				if (updateData.customData) {
					data.data.customData = cloneDeep(updateData.customData);
				}

				return true;
			},
			parseConditionName: (selector, onlyExisting) => {
				return parseRuleName(selector, onlyExisting ? (rule => onlyExisting.includes(rule)) : undefined);
			},
			autocompleteConditionName: (selector, onlyExisting) => {
				return autocompleteRuleName(selector, onlyExisting ? (rule => onlyExisting.includes(rule)) : undefined);
			},
			logLimitChange: (rule, character, newLimit) => {
				const definition = RulesGetDisplayDefinition(rule);
				logMessage("rule_change", LogEntryType.plaintext,
					`${character} changed ${Player.Name}'s '${definition.name}' rule permission to ${ConditionsLimit[newLimit]}`);
				if (!character.isPlayer()) {
					ChatRoomSendLocal(`${character} changed '${definition.name}' rule permission to ${ConditionsLimit[newLimit]}`, undefined, character.MemberNumber);
				}
			},
			logConditionUpdate: (rule, character, newData, oldData) => {
				const definition = RulesGetDisplayDefinition(rule);
				const visibleName = definition.name;

				const didTimerChange = newData.timer !== oldData.timer || newData.timerRemove !== oldData.timerRemove;
				const didTriggerChange = !isEqual(newData.requirements, oldData.requirements);
				const changeEvents: string[] = [];
				if (didTimerChange)
					changeEvents.push("timer");
				if (didTriggerChange)
					changeEvents.push("trigger condition");
				if (definition.dataDefinition) {
					for (const [k, def] of Object.entries<RuleCustomDataEntryDefinition>(definition.dataDefinition)) {
						if (!isEqual(oldData.data.customData?.[k], newData.data.customData?.[k])) {
							changeEvents.push(def.description);
						}
					}
				}
				if (changeEvents.length > 0) {
					logMessage("rule_change", LogEntryType.plaintext,
						`${character} changed the ${changeEvents.join(", ")} of ${Player.Name}'s '${visibleName}' rule`);
				}
				if (!character.isPlayer()) {
					if (newData.timer !== oldData.timer)
						if (newData.timer === null) {
							ChatRoomSendLocal(`${character} disabled the timer of the '${visibleName}' rule`, undefined, character.MemberNumber);
						} else {
							ChatRoomSendLocal(`${character} changed the remaining time of the timer of the '${visibleName}' rule to ${formatTimeInterval(newData.timer - Date.now())}`, undefined, character.MemberNumber);
						}
					if (newData.timer !== null && newData.timerRemove !== oldData.timerRemove)
						ChatRoomSendLocal(`${character} changed the timer behavior of the '${visibleName}' rule to ${newData.timerRemove ? "remove" : "disable"} the rule when time runs out`, undefined, character.MemberNumber);
					if (didTriggerChange)
						if (newData.requirements === null) {
							ChatRoomSendLocal(`${character} set the triggers of '${visibleName}' rule to the global rules configuration`, undefined, character.MemberNumber);
						} else {
							const triggers: string[] = [];
							const r = newData.requirements;
							if (r.room) {
								triggers.push(`When ${r.room.inverted ? "not in" : "in"} ${r.room.type} room`);
							}
							if (r.roomName) {
								triggers.push(`When ${r.roomName.inverted ? "not in" : "in"} room named '${r.roomName.name}'`);
							}
							if (r.role) {
								const role = capitalizeFirstLetter(AccessLevel[r.role.role]) + (r.role.role !== AccessLevel.clubowner ? " ↑" : "");
								triggers.push(`When ${r.role.inverted ? "not in" : "in"} room with role '${role}'`);
							}
							if (r.player) {
								const name = getCharacterName(r.player.memberNumber, null);
								triggers.push(`When ${r.player.inverted ? "not in" : "in"} room with member '${r.player.memberNumber}'${name ? ` (${name})` : ""}`);
							}
							if (triggers.length > 0) {
								ChatRoomSendLocal(`${character} set the '${visibleName}' rule to trigger under following conditions:\n` + triggers.join("\n"), undefined, character.MemberNumber);
							} else {
								ChatRoomSendLocal(`${character} deactivated all trigger conditions of the '${visibleName}' rule. The rule will now always trigger, while it is active`, undefined, character.MemberNumber);
							}
						}
					if (definition.dataDefinition) {
						for (const [k, def] of Object.entries<RuleCustomDataEntryDefinition>(definition.dataDefinition)) {
							if (!isEqual(oldData.data.customData?.[k], newData.data.customData?.[k])) {
								ChatRoomSendLocal(`${character} changed the '${visibleName}' rule '${def.description}' setting:`, undefined, character.MemberNumber);
							}
						}
					}
				}
			},
			logCategoryUpdate: (character, newData, oldData) => {
				const didTimerChange = newData.timer !== oldData.timer || newData.timerRemove !== oldData.timerRemove;
				const didTriggerChange = !isEqual(newData.requirements, oldData.requirements);
				const changeEvents = [];
				if (didTimerChange)
					changeEvents.push("default timer");
				if (didTriggerChange)
					changeEvents.push("trigger condition");
				if (changeEvents.length > 0) {
					logMessage("curse_change", LogEntryType.plaintext,
						`${character} changed the ${changeEvents.join(", ")} of ${Player.Name}'s global rules config`);
				}
				if (!character.isPlayer()) {
					if (newData.timer !== oldData.timer)
						if (newData.timer === null) {
							ChatRoomSendLocal(`${character} removed the default timer of the global rules configuration`, undefined, character.MemberNumber);
						} else {
							ChatRoomSendLocal(`${character} changed the default timer of the global rules configuration to ${formatTimeInterval(newData.timer)}`, undefined, character.MemberNumber);
						}
					if (newData.timer !== null && newData.timerRemove !== oldData.timerRemove)
						ChatRoomSendLocal(`${character} changed the default timeout behavior of the global rules configuration to ${newData.timerRemove ? "removal of rules" : "disabling rules"} when time runs out`, undefined, character.MemberNumber);
					if (didTriggerChange) {
						const triggers: string[] = [];
						const r = newData.requirements;
						if (r.room) {
							triggers.push(`When ${r.room.inverted ? "not in" : "in"} ${r.room.type} room`);
						}
						if (r.roomName) {
							triggers.push(`When ${r.roomName.inverted ? "not in" : "in"} room named '${r.roomName.name}'`);
						}
						if (r.role) {
							const role = capitalizeFirstLetter(AccessLevel[r.role.role]) + (r.role.role !== AccessLevel.clubowner ? " ↑" : "");
							triggers.push(`When ${r.role.inverted ? "not in" : "in"} room with role '${role}'`);
						}
						if (r.player) {
							const name = getCharacterName(r.player.memberNumber, null);
							triggers.push(`When ${r.player.inverted ? "not in" : "in"} room with member '${r.player.memberNumber}'${name ? ` (${name})` : ""}`);
						}
						if (triggers.length > 0) {
							ChatRoomSendLocal(`${character} set the global rules configuration to trigger rules under following conditions:\n` + triggers.join("\n"), undefined, character.MemberNumber);
						} else {
							ChatRoomSendLocal(`${character} deactivated all trigger conditions for the global rules configuration. Rules set to this default configuration will now always trigger, while active`, undefined, character.MemberNumber);
						}
					}
				}
			},
			commandConditionSelectorHelp: "rule"
		});

		// Init individual rules
		initRules_bc_blocks();
		initRules_bc_alter();
		initRules_bc_relation_control();
		initRules_bc_speech_control();
		initRules_other();

		for (const rule of rules.values()) {
			if (rule.init) {
				rule.init(rule.state);
			}
		}
	}

	load() {
		if (!moduleIsEnabled(ModuleCategory.Rules)) {
			return;
		}

		for (const rule of rules.values()) {
			if (rule.load) {
				rule.load(rule.state);
			}
		}
	}

	run() {
		if (!moduleIsEnabled(ModuleCategory.Rules))
			return;

		this.resetTimer = setInterval(() => {
			this.triggerCounts.clear();
		}, RULES_ANTILOOP_RESET_INTERVAL);
	}

	unload() {
		if (this.resetTimer !== null) {
			clearInterval(this.resetTimer);
			this.resetTimer = null;
		}

		for (const rule of rules.values()) {
			if (rule.unload) {
				rule.unload();
			}
		}
	}

	reload() {
		this.unload();
		this.load();
		this.run();
	}

	ruleTick(rule: BCX_Rule, condition: ConditionsConditionData<"rules">): void {
		if (this.suspendedUntil !== null) {
			if (Date.now() >= this.suspendedUntil) {
				this.suspendedUntil = null;
				this.triggerCounts.clear();
				ChatRoomActionMessage(`All of ${Player.Name}'s temporarily suspended rules are in effect again.`);
			} else {
				return;
			}
		}

		const ruleDefinition = rules.get(rule);
		if (!ruleDefinition) {
			throw new Error(`Definition for rule ${rule} not found`);
		}

		if (ruleDefinition.tick) {
			if (ruleDefinition.tick(ruleDefinition.state)) {
				const counter = (this.triggerCounts.get(rule) ?? 0) + 1;
				this.triggerCounts.set(rule, counter);

				if (counter >= RULES_ANTILOOP_THRESHOLD) {
					ChatRoomActionMessage("Protection triggered: The effects of rules have been suspended for 10 minutes. Please refrain from triggering rules so rapidly, as it creates strain on the server and may lead to unwanted side effects! If you believe this message was triggered by a bug, please report it to BCX Discord.");
					this.suspendedUntil = Date.now() + RULES_ANTILOOP_SUSPEND_TIME;
				}
			}
		}
	}
}
