import cloneDeep from "lodash-es/cloneDeep";
import isEqual from "lodash-es/isEqual";
import zod, { ZodType } from "zod";
import { ChatroomCharacter, getChatroomCharacter } from "../characters";
import { ModuleCategory, ModuleInitPhase, Preset, ConditionsLimit } from "../constants";
import { moduleInitPhase } from "../moduleManager";
import { initRules_bc_alter } from "../rules/bc_alter";
import { initRules_bc_blocks } from "../rules/bc_blocks";
import { initRules_bc_settings } from "../rules/bc_settings";
import { initRules_bc_relation_control } from "../rules/relation_control";
import { initRules_bc_speech_control } from "../rules/speech_control";
import { initRules_other } from "../rules/other";
import { capitalizeFirstLetter, clamp, clampWrap, dictionaryProcess, formatTimeInterval, isObject } from "../utils";
import { ChatRoomActionMessage, ChatRoomSendLocal, getCharacterName, DrawImageEx, InfoBeep } from "../utilsClub";
import { AccessLevel, registerPermission } from "./authority";
import { Command_fixExclamationMark, Command_pickAutocomplete, registerWhisperCommand, COMMAND_GENERIC_ERROR } from "./commands";
import { ConditionsAutocompleteSubcommand, ConditionsCheckAccess, ConditionsGetCategoryPublicData, ConditionsGetCondition, ConditionsIsConditionInEffect, ConditionsRegisterCategory, ConditionsRemoveCondition, ConditionsRunSubcommand, ConditionsSetCondition, ConditionsSubcommand, ConditionsSubcommands } from "./conditions";
import { LogEntryType, logMessage } from "./log";
import { queryHandlers } from "./messaging";
import { moduleIsEnabled } from "./presets";
import { BaseModule } from "./_BaseModule";
import { getCurrentSubscreen, setSubscreen } from "./gui";
import { GuiMemberSelect } from "../gui/member_select";
import { modStorageSync } from "./storage";
import { BCX_setInterval } from "../BCXContext";
import { icon_restrictions, icon_OwnerList } from "../resources";
import { RelationshipsGetNickname } from "./relationships";

const RULES_ANTILOOP_RESET_INTERVAL = 60_000;
const RULES_ANTILOOP_THRESHOLD = 10;
const RULES_ANTILOOP_SUSPEND_TIME = 600_000;

const STRING_LIST_MAX_LENGTH = 128;

export const enum RuleType {
	Block = 0,
	Alt = 1,
	Setting = 2,
	RC = 3,
	Speech = 4,
	Other = 99,
}

export const RULE_ICONS: Record<RuleType, string> = {
	[RuleType.Block]: icon_restrictions,
	[RuleType.Alt]: "Icons/Swap.png",
	[RuleType.Setting]: "Icons/Preference.png",
	[RuleType.RC]: icon_OwnerList,
	[RuleType.Speech]: "Icons/Chat.png",
	[RuleType.Other]: "Icons/Chest.png",
};

export function guard_BCX_Rule(name: unknown): name is BCX_Rule {
	return typeof name === "string" && rules.has(name as BCX_Rule);
}

export function guard_RuleCustomData(rule: BCX_Rule, data: unknown): boolean {
	const descriptor = rules.get(rule);
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
			const handler: RuleCustomDataHandler = ruleCustomDataHandlers[def.type];
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
	if (data.dataDefinition) {
		for (const [k, v] of Object.entries<RuleCustomDataEntryDefinition>(data.dataDefinition)) {
			const handler: RuleCustomDataHandler = ruleCustomDataHandlers[v.type];
			if (!handler) {
				throw new Error(`Unknown handler for ${name}:${k} (${v.type})`);
			}
			if (handler.validateOptions && !handler.validateOptions(v.options as any)) {
				throw new Error(`Bad options for ${name}:${k} (${v.type})`);
			}
			const defaultValue = typeof v.default === "function" ? v.default() : v.default;
			if (!handler.validate(defaultValue, v)) {
				throw new Error(`Default doesn't validate for ${name}:${k} (${v.type})`);
			}
		}
	}
	if (data.internalDataValidate) {
		if (!data.internalDataValidate(data.internalDataDefault?.())) {
			throw new Error(`Default internal data doesn't validate for rule ${name}`);
		}
	} else if (data.internalDataDefault !== undefined) {
		throw new Error(`Default internal data for rule ${name} without internal data validation`);
	}
	rules.set(name, {
		...(data as unknown as RuleDefinition<BCX_Rule>),
		state: new RuleState<BCX_Rule>(name, data),
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
		type: data.type,
		shortDescription: data.shortDescription,
		keywords: data.keywords,
		longDescription: data.longDescription,
		triggerTexts: data.triggerTexts,
		defaultLimit: data.defaultLimit,
		enforceable: data.enforceable,
		loggable: data.loggable,
		dataDefinition: data.dataDefinition,
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
	validate(value: unknown, def: RuleCustomDataEntryDefinition<type>): boolean;
	onDataChange?(data: {
		def: RuleCustomDataEntryDefinition<type>;
		active: boolean;
		key: string;
		onInput: () => void;
		value: RuleCustomDataTypesMap[type];
		access: boolean;
	}): void;
	processInput?(data: {
		def: RuleCustomDataEntryDefinition<type>;
		key: string;
		value: RuleCustomDataTypesMap[type];
	}): RuleCustomDataTypesMap[type] | undefined;
	unload?(data: {
		def: RuleCustomDataEntryDefinition<type>;
		key: string;
	}): void;
	run(data: {
		def: RuleCustomDataEntryDefinition<type>;
		value: RuleCustomDataTypesMap[type];
		Y: number;
		key: string;
		target: ChatroomCharacter;
		access: boolean;
	}): void;
	click?(data: {
		def: RuleCustomDataEntryDefinition<type>;
		value: RuleCustomDataTypesMap[type];
		Y: number;
		key: string;
		target: ChatroomCharacter;
		access: boolean;
	}): RuleCustomDataTypesMap[type] | undefined;
} & (type extends keyof RuleCustomDataTypesOptions ? {
	validateOptions(options: RuleCustomDataTypesOptions[type]): boolean;
} : {
	validateOptions?: undefined;
});

const ruleCustomDataHandlerPage: Map<string, number> = new Map();
// memberNumberList helper variable
let memberNumberListAutoFill: number | null = null;

export const ruleCustomDataHandlers: {
	[type in RuleCustomDataTypes]: RuleCustomDataHandler<type>;
} = {
	// element has Y length of 150px (description + element plus offset to the next one)
	listSelect: {
		validateOptions: options => Array.isArray(options) && options.every(i => Array.isArray(i) && i.length === 2 && i.every(j => typeof j === "string")),
		validate: (value, def) => typeof value === "string" && def.options!.map(i => i[0]).includes(value),
		run({ def, value, Y, access }) {
			DrawTextFit(def.description, 1050, Y + 0, 900, "Black");
			const index = def.options!.findIndex(i => i[0] === value);
			if (index < 0) {
				throw new Error(`Bad data during listSelect render`);
			}
			const next = clampWrap(index + 1, 0, def.options!.length - 1);
			const prev = clampWrap(index - 1, 0, def.options!.length - 1);
			MainCanvas.textAlign = "center";
			DrawBackNextButton(1050, Y + 36, 250, 60,
				def.options![index][1],
				access ? "White" : "#ddd", "",
				() => def.options![prev][1],
				() => def.options![next][1],
				!access
			);
			MainCanvas.textAlign = "left";
		},
		click({ def, value, Y, access }) {
			if (!access)
				return;
			const index = def.options!.findIndex(i => i[0] === value);
			if (MouseIn(1050, Y + 36, 125, 60)) {
				return def.options![clampWrap(index - 1, 0, def.options!.length - 1)][0];
			}
			if (MouseIn(1050 + 125, Y + 36, 125, 60)) {
				return def.options![clampWrap(index + 1, 0, def.options!.length - 1)][0];
			}
			return undefined;
		},
	},
	memberNumberList: {
		validateOptions: options => options === undefined || (Number.isInteger(options?.pageSize)),
		validate: value => Array.isArray(value) && value.every(Number.isInteger),
		onDataChange({ active, key, access }) {
			let input = document.getElementById(`BCX_RCDH_${key}`) as HTMLInputElement | undefined;
			if (!active) {
				if (input) {
					input.remove();
				}
				return;
			}
			if (!input) {
				input = ElementCreateInput(`BCX_RCDH_${key}`, "text", "", "100");
				input.inputMode = "numeric";
				input.pattern = "[0-9]+";
				if (memberNumberListAutoFill !== null) {
					input.value = `${memberNumberListAutoFill}`;
					memberNumberListAutoFill = null;
				}
			}
			input.disabled = !access;
		},
		run({ def, value, Y, key, access }) {
			Y -= 20;
			const PAGE_SIZE = def.options?.pageSize ? def.options.pageSize : 4;
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
				if (access) {
					MainCanvas.textAlign = "center";
					DrawButton(1836, Y + 26 + i * 70, 64, 64, "X", "White");
					MainCanvas.textAlign = "left";
				}
			}
			ElementPositionFix(`BCX_RCDH_${key}`, 40, 1050, Y + PAGE_SIZE * 70 + 43, 360, 60);
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
					MainCanvas.strokeStyle = "black";
					MainCanvas.strokeRect(Left, Top, 450, 65);
					DrawTextFit(getCharacterName(val, "[unknown]"), Left + 225, Top + 33, 444, "black");
				});
			}
			DrawButton(1444, Y + PAGE_SIZE * 70 + 43, 64, 64, "", access ? "White" : "#ddd", undefined, undefined, !access);
			DrawImageEx("Icons/Title.png", 1446, Y + PAGE_SIZE * 70 + 43, { Width: 60, Height: 60 });
			DrawButton(1530, Y + PAGE_SIZE * 70 + 43, 100, 64, "Add", access ? "White" : "#ddd", undefined, undefined, !access);
			DrawBackNextButton(1650, Y + PAGE_SIZE * 70 + 43, 250, 64, `Page ${page + 1}/${totalPages}`, "White", undefined, () => "", () => "");
			MainCanvas.textAlign = "left";
		},
		click({ value, Y, key, target, def, access }) {
			Y -= 20;
			const PAGE_SIZE = def.options?.pageSize ? def.options.pageSize : 4;
			const totalPages = Math.max(1, Math.ceil(value.length / PAGE_SIZE));
			const page = clamp(ruleCustomDataHandlerPage.get(key) ?? 0, 0, totalPages - 1);
			for (let i = 0; i < PAGE_SIZE; i++) {
				const e = page * PAGE_SIZE + i;
				if (e >= value.length)
					break;
				if (access && MouseIn(1836, Y + 26 + i * 70, 64, 64)) {
					value.splice(e, 1);
					return value;
				}
			}
			const input = document.getElementById(`BCX_RCDH_${key}`) as HTMLInputElement | undefined;
			const screen = getCurrentSubscreen();
			if (access && MouseIn(1444, Y + PAGE_SIZE * 70 + 43, 64, 64) && input && screen) {
				setSubscreen(new GuiMemberSelect(target, screen, result => {
					memberNumberListAutoFill = result;
				}, value.slice()));
			}
			if (access && MouseIn(1530, Y + PAGE_SIZE * 70 + 43, 100, 64) && input && input.value) {
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
		unload({ key }) {
			ElementRemove(`BCX_RCDH_${key}`);
			ruleCustomDataHandlerPage.delete(key);
		},
	},
	number: {
		validateOptions: options => options === undefined || (
			isObject(options) &&
			(options.min === undefined || Number.isInteger(options.min)) &&
			(options.max === undefined || Number.isInteger(options.max))
		),
		validate: (value, def) => (
			typeof value === "number" && Number.isInteger(value) &&
			(def.options?.min === undefined || value >= def.options.min) &&
			(def.options?.max === undefined || value <= def.options.max)
		),
		onDataChange({ active, key, onInput, value, access }) {
			let input = document.getElementById(`BCX_RCDH_${key}`) as HTMLInputElement | undefined;
			if (!active) {
				if (input) {
					input.remove();
				}
				return;
			}
			if (!input) {
				input = ElementCreateInput(`BCX_RCDH_${key}`, "text", value.toString(10), "50");
				input.inputMode = "numeric";
				input.pattern = "[0-9]+";
				input.oninput = onInput;
			} else {
				input.value = value.toString(10);
			}
			input.onblur = () => {
				if (input) {
					input.value = value.toString(10);
				}
			};
			input.disabled = !access;
		},
		processInput({ key, value, def }) {
			const input = document.getElementById(`BCX_RCDH_${key}`) as HTMLInputElement | undefined;
			if (input && input.value) {
				if (/^[0-9]+$/.test(input.value)) {
					const res = clamp(Number.parseInt(input.value, 10), def.options?.min ?? -Infinity, def.options?.max ?? Infinity);
					input.onblur = () => {
						input.value = res.toString(10);
					};
					return res;
				} else {
					input.value = value.toString(10);
				}
			}
			return undefined;
		},
		run({ def, Y, key }) {
			DrawTextFit(def.description, 1050, Y + 0, 850, "Black");
			ElementPositionFix(`BCX_RCDH_${key}`, 40, 1050, Y + 26, 425, 60);
		},
		unload({ key }) {
			ElementRemove(`BCX_RCDH_${key}`);
		},
	},
	poseSelect: {
		// TODO: stricten
		validate: value => Array.isArray(value) && value.every(i => typeof i === "string"),
		run({ def, value, Y, access }) {
			DrawTextFit(def.description, 1050, Y + 0, 900, "Black");

			const poses = PoseFemale3DCG
				.filter(P => (P.AllowMenu || P.AllowMenuTransient))
				.map(P => P.Category)
				.filter((C, I, Categories) => C && Categories.indexOf(C) === I)
				.map(Category => PoseFemale3DCG.filter(P => (P.AllowMenu || P.AllowMenuTransient) && P.Category === Category));

			for (let I = 0; I < poses.length; I++) {
				const OffsetY = Y + 60 + 140 * I;
				const PoseGroup: Pose[] = poses[I];

				for (let P = 0; P < PoseGroup.length; P++) {
					const OffsetX = 1070 + 100 * P;
					const IsDisabled = value.includes(PoseGroup[P].Name);

					DrawButton(OffsetX, OffsetY, 90, 90, "", IsDisabled ? access ? "Darkred" : "#333" : access ? "White" : "#ddd", "Icons/Poses/" + PoseGroup[P].Name + ".png", "", !access);
				}
			}
		},
		click({ value, Y, access }) {
			if (!access)
				return;

			const poses = PoseFemale3DCG
				.filter(P => (P.AllowMenu || P.AllowMenuTransient))
				.map(P => P.Category)
				.filter((C, I, Categories) => C && Categories.indexOf(C) === I)
				.map(Category => PoseFemale3DCG.filter(P => (P.AllowMenu || P.AllowMenuTransient) && P.Category === Category));

			for (let I = 0; I < poses.length; I++) {
				const OffsetY = Y + 60 + 140 * I;
				const PoseGroup: Pose[] = poses[I];

				for (let P = 0; P < PoseGroup.length; P++) {
					const OffsetX = 1070 + 100 * P;

					if (MouseIn(OffsetX, OffsetY, 90, 90)) {
						if (value.includes(PoseGroup[P].Name)) {
							value.splice(value.indexOf(PoseGroup[P].Name), 1);
						} else {
							value.push(PoseGroup[P].Name);
						}
						return value;
					}
				}
			}
			return undefined;
		},
	},
	// element has Y length of 150px (description + element plus offset to the next one)
	roleSelector: {
		validate: value => typeof value === "number" && AccessLevel[value] !== undefined,
		run({ def, value, Y, access }) {
			DrawTextFit(def.description, 1050, Y + 0, 900, "Black");
			const roleSelectionNext = value < AccessLevel.public ? value + 1 : AccessLevel.clubowner;
			const roleSelectionPrev = value > AccessLevel.clubowner ? value - 1 : AccessLevel.public;
			MainCanvas.textAlign = "center";
			DrawBackNextButton(1050, Y + 46, 250, 60,
				capitalizeFirstLetter(AccessLevel[value]) + (value !== AccessLevel.clubowner ? " ↑" : ""),
				access ? "White" : "#ddd", "",
				() => capitalizeFirstLetter(AccessLevel[roleSelectionPrev]),
				() => capitalizeFirstLetter(AccessLevel[roleSelectionNext]),
				!access
			);
			MainCanvas.textAlign = "left";
		},
		click({ value, Y, access }) {
			if (!access)
				return;
			if (MouseIn(1050, Y + 46, 125, 60)) {
				return value > AccessLevel.clubowner ? value - 1 : AccessLevel.public;
			}
			if (MouseIn(1050 + 125, Y + 46, 125, 60)) {
				return value < AccessLevel.public ? value + 1 : AccessLevel.clubowner;
			}
			return undefined;
		},
	},
	string: {
		validateOptions: options => options === undefined || options instanceof RegExp,
		validate(value, def) {
			return typeof value === "string" &&
				(!def.options || def.options.test(value));
		},
		onDataChange({ active, key, onInput, value, access, def }) {
			let input = document.getElementById(`BCX_RCDH_${key}`) as HTMLInputElement | undefined;
			if (!active) {
				if (input) {
					input.remove();
				}
				return;
			}
			if (!input) {
				let lastValue = value;
				const createdInput = ElementCreateInput(`BCX_RCDH_${key}`, "text", lastValue, "160");
				createdInput.oninput = () => {
					if (!def.options || def.options.test(createdInput.value)) {
						lastValue = createdInput.value;
						onInput();
					} else {
						createdInput.value = lastValue;
					}
				};
				input = createdInput;
			} else {
				input.value = value;
			}
			input.disabled = !access;
		},
		processInput({ key, def }) {
			const input = document.getElementById(`BCX_RCDH_${key}`) as HTMLInputElement | undefined;
			return input && (!def.options || def.options.test(input.value)) ? input.value : undefined;
		},
		run({ def, Y, key }) {
			DrawTextFit(def.description, 1050, Y + 0, 850, "Black");
			ElementPositionFix(`BCX_RCDH_${key}`, 40, 1050, Y + 26, 850, 60);
		},
		unload({ key }) {
			ElementRemove(`BCX_RCDH_${key}`);
		},
	},
	stringList: {
		validateOptions: options => options === undefined || (
			isObject(options) &&
			(options.validate === undefined || options.validate instanceof RegExp)
		),
		validate(value, def) {
			return Array.isArray(value) &&
				value.length <= STRING_LIST_MAX_LENGTH &&
				value.every(i => typeof i === "string" && (!def.options?.validate || def.options.validate.test(i)));
		},
		onDataChange({ active, key, access, def }) {
			let input = document.getElementById(`BCX_RCDH_${key}`) as HTMLInputElement | undefined;
			if (!active) {
				if (input) {
					input.remove();
				}
				return;
			}
			if (!input) {
				let last = "";
				const newInput = ElementCreateInput(`BCX_RCDH_${key}`, "text", "", "120");
				newInput.oninput = () => {
					if (def.options?.validate && !def.options.validate.test(newInput.value)) {
						if (newInput.value.length === 1 && def.options.validate.test("")) {
							last = "";
						}
						newInput.value = last;
					} else {
						last = newInput.value;
					}
				};
				input = newInput;
			}
			input.disabled = !access;
		},
		run({ def, value, Y, key, access }) {
			Y -= 20;
			const PAGE_SIZE = def.options?.pageSize ?? 4;
			const totalPages = Math.max(1, Math.ceil(value.length / PAGE_SIZE));
			const page = clamp(ruleCustomDataHandlerPage.get(key) ?? 0, 0, totalPages - 1);
			DrawTextFit(def.description, 1050, Y + 0, 900, "Black");
			for (let i = 0; i < PAGE_SIZE; i++) {
				const e = page * PAGE_SIZE + i;
				if (e >= value.length)
					break;
				const msg = value[e];
				if (MouseIn(1050, Y + 26 + i * 70, 766, 64)) {
					DrawHoverElements.push(() => {
						MainCanvas.save();
						MainCanvas.fillStyle = "rgba(255, 255, 136, 0.9)";
						MainCanvas.fillRect(1050, Y + 26, 766, 70 * PAGE_SIZE);
						MainCanvas.strokeStyle = "Black";
						MainCanvas.strokeRect(1050, Y + 26, 766, 70 * PAGE_SIZE);
						MainCanvas.textAlign = "left";
						DrawTextWrap(msg + "   -   [click to copy into the empty input text field]", 1050 - 746 / 2, Y + 30, 756, 70 * PAGE_SIZE - 10, "black", undefined, 5);
						MainCanvas.restore();
					});
				}
				MainCanvas.strokeRect(1050, Y + 26 + i * 70, 766, 64);
				DrawTextFit(msg.length > 61 ? msg.substr(0, 60) + "\u2026" : msg, 1060, Y + 26 + i * 70 + 34, 750, "Black");
				if (access) {
					MainCanvas.textAlign = "center";
					DrawButton(1836, Y + 26 + i * 70, 64, 64, "X", "White");
					MainCanvas.textAlign = "left";
				}
			}
			ElementPositionFix(`BCX_RCDH_${key}`, 40, 1050, Y + PAGE_SIZE * 70 + 43, 450, 60);
			MainCanvas.textAlign = "center";
			DrawButton(1530, Y + PAGE_SIZE * 70 + 43, 100, 64, "Add", access ? "White" : "#ddd", undefined, undefined, !access);
			DrawBackNextButton(1650, Y + PAGE_SIZE * 70 + 43, 250, 64, `Page ${page + 1}/${totalPages}`, "White", undefined, () => "", () => "");
			MainCanvas.textAlign = "left";
		},
		click({ value, Y, key, def, access }) {
			Y -= 20;
			const PAGE_SIZE = def.options?.pageSize ?? 4;
			const totalPages = Math.max(1, Math.ceil(value.length / PAGE_SIZE));
			const page = clamp(ruleCustomDataHandlerPage.get(key) ?? 0, 0, totalPages - 1);
			const input = document.getElementById(`BCX_RCDH_${key}`) as HTMLInputElement | undefined;
			for (let i = 0; i < PAGE_SIZE; i++) {
				const e = page * PAGE_SIZE + i;
				if (e >= value.length)
					break;
				if (access && MouseIn(1050, Y + 26 + i * 70, 766, 64) && input && input.value === "") {
					input.value = value[e];
				}
				if (access && MouseIn(1836, Y + 26 + i * 70, 64, 64)) {
					value.splice(e, 1);
					return value;
				}
			}
			if (access && MouseIn(1530, Y + PAGE_SIZE * 70 + 43, 100, 64) &&
				input && input.value &&
				(!def.options?.validate || def.options.validate.test(input.value)) &&
				!value.includes(input.value)
			) {
				if (value.length >= STRING_LIST_MAX_LENGTH) {
					InfoBeep("Reached the max. number of entries - please delete one first", 10_000);
					return;
				}
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
		unload({ key }) {
			ElementRemove(`BCX_RCDH_${key}`);
			ruleCustomDataHandlerPage.delete(key);
		},
	},
	textArea: {
		validate: value => typeof value === "string",
		onDataChange({ active, key, onInput, value, access }) {
			let input = document.getElementById(`BCX_RCDH_${key}`) as HTMLTextAreaElement | undefined;
			if (!active) {
				if (input) {
					input.remove();
				}
				return;
			}
			if (!input) {
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
			input.disabled = !access;
		},
		processInput({ key }) {
			const input = document.getElementById(`BCX_RCDH_${key}`) as HTMLTextAreaElement | undefined;
			return input ? input.value : undefined;
		},
		run({ def, Y, key }) {
			DrawTextFit(def.description, 1000, Y + 0, 900, "Black");
			const input = document.getElementById(`BCX_RCDH_${key}`) as HTMLTextAreaElement | undefined;
			if (input && document.activeElement === input) {
				ElementPositionFix(`BCX_RCDH_${key}`, 36, 105, 170, 1790, 750);
			} else {
				ElementPositionFix(`BCX_RCDH_${key}`, 28, 1000, Y + 26, 900, 765 - Y);
			}
		},
		unload({ key }) {
			ElementRemove(`BCX_RCDH_${key}`);
		},
	},
	toggle: {
		validate: value => typeof value === "boolean",
		run({ def, value, Y, access }) {
			DrawCheckbox(1050, Y, 64, 64, def.description, value, !access);
		},
		click({ value, Y, access }) {
			if (!access)
				return;
			if (MouseIn(1050, Y, 64, 64)) {
				return !value;
			}
			return undefined;
		},
	},
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

	const definition = rules.get(rule);
	if (!definition) {
		throw new Error(`Attempt to create unknown rule '${rule}'`);
	}

	if (!ConditionsGetCondition("rules", rule)) {
		const ruleData: ConditionsCategorySpecificData["rules"] = {};
		if (definition.dataDefinition) {
			ruleData.customData = {};
			for (const [k, v] of Object.entries<RuleCustomDataEntryDefinition>(definition.dataDefinition)) {
				ruleData.customData[k] = cloneDeep(typeof v.default === "function" ? v.default() : v.default);
			}
		}
		if (definition.internalDataDefault) {
			ruleData.internalData = definition.internalDataDefault();
			if (!definition.internalDataValidate?.(ruleData.internalData)) {
				throw new Error(`Failed to create valid internal data for rule '${rule}'`);
			}
		}
		ConditionsSetCondition("rules", rule, ruleData, character);
		if (character) {
			logMessage("rule_change", LogEntryType.plaintext, `${character} added a new rule: ${definition.name}`);
			if (!character.isPlayer()) {
				ChatRoomSendLocal(`${character.toNicknamedString()} gave you a new rule: "${definition.name}"`);
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
			ChatRoomSendLocal(`${character.toNicknamedString()} removed your rule "${display.name}"`);
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

	get internalData(): ID extends keyof RuleInternalData ? (RuleInternalData[ID] | undefined) : undefined {
		return cloneDeep(this.condition?.data.internalData);
	}

	set internalData(data: ID extends keyof RuleInternalData ? (RuleInternalData[ID] | undefined) : undefined) {
		const condition = this.condition;
		if (condition && !isEqual(condition.data.internalData, data)) {
			condition.data.internalData = data;
			modStorageSync();
		}
	}

	constructor(rule: ID, definition: RuleDisplayDefinition<ID>) {
		this.rule = rule;
		this.ruleDefinition = definition;
	}

	trigger(targetCharacter: number | null = null, dictionary: Record<string, string> = {}): void {
		const texts = this.ruleDefinition.triggerTexts;
		if (texts) {
			let targetName = CharacterNickname(Player);
			if (targetCharacter != null) {
				const targetChar = getChatroomCharacter(targetCharacter);
				targetName = targetChar ? CharacterNickname(targetChar.Character) : getCharacterName(targetCharacter, "[unknown]");
			}
			if (texts.infoBeep) {
				InfoBeep("BCX: " + dictionaryProcess(texts.infoBeep, {
					PLAYER_NAME: RelationshipsGetNickname(Player.MemberNumber) ?? CharacterNickname(Player),
					TARGET_PLAYER: RelationshipsGetNickname(targetCharacter ?? Player.MemberNumber) ?? targetName,
					...dictionary,
				}), 7_000);
			}
			if (this.isLogged) {
				const log = texts.log;
				if (log) {
					logMessage("rule_trigger", LogEntryType.ruleTrigger, [this.rule, dictionary]);
				}
				const announce = texts.announce ?? texts.log;
				if (announce) {
					ChatRoomActionMessage(`${dictionaryProcess(announce, {
						PLAYER_NAME: "SourceCharacter",
						TARGET_PLAYER: `TargetCharacterName (${targetCharacter ?? Player.MemberNumber})`,
						...dictionary,
					})}.`, null, [
						{ Tag: "SourceCharacter", MemberNumber: Player.MemberNumber, Text: CharacterNickname(Player) },
						{ Tag: "TargetCharacterName", MemberNumber: targetCharacter ?? Player.MemberNumber, Text: targetName },
					]);
				}
			}
		}
	}

	triggerAttempt(targetCharacter: number | null = null, dictionary: Record<string, string> = {}): void {
		const texts = this.ruleDefinition.triggerTexts;
		if (texts) {
			let targetName = CharacterNickname(Player);
			if (targetCharacter != null) {
				const targetChar = getChatroomCharacter(targetCharacter);
				targetName = targetChar ? CharacterNickname(targetChar.Character) : getCharacterName(targetCharacter, "[unknown]");
			}
			const infoBeep = texts.attempt_infoBeep ?? texts.infoBeep;
			if (infoBeep) {
				InfoBeep("BCX: " + dictionaryProcess(infoBeep, {
					PLAYER_NAME: RelationshipsGetNickname(Player.MemberNumber) ?? CharacterNickname(Player),
					TARGET_PLAYER: RelationshipsGetNickname(targetCharacter ?? Player.MemberNumber) ?? targetName,
					...dictionary,
				}), 7_000);
			}
			if (this.isLogged) {
				const log = texts.attempt_log;
				if (log) {
					logMessage("rule_trigger", LogEntryType.ruleTriggerAttempt, [this.rule, dictionary]);
				}
				const announce = texts.attempt_announce ?? texts.attempt_log;
				if (announce) {
					ChatRoomActionMessage(`${dictionaryProcess(announce, {
						PLAYER_NAME: "SourceCharacter",
						TARGET_PLAYER: `TargetCharacterName (${targetCharacter ?? Player.MemberNumber})`,
						...dictionary,
					})}.`, null, [
						{ Tag: "SourceCharacter", MemberNumber: Player.MemberNumber, Text: CharacterNickname(Player) },
						{ Tag: "TargetCharacterName", MemberNumber: targetCharacter ?? Player.MemberNumber, Text: targetName },
					]);
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
				[Preset.slave]: [false, AccessLevel.mistress],
			},
		});
		registerPermission("rules_limited", {
			name: "Allows controlling limited rules",
			category: ModuleCategory.Rules,
			defaults: {
				[Preset.dominant]: [true, AccessLevel.owner],
				[Preset.switch]: [true, AccessLevel.owner],
				[Preset.submissive]: [false, AccessLevel.lover],
				[Preset.slave]: [false, AccessLevel.lover],
			},
		});
		registerPermission("rules_global_configuration", {
			name: "Allows editing the global rules configuration",
			category: ModuleCategory.Rules,
			defaults: {
				[Preset.dominant]: [true, AccessLevel.owner],
				[Preset.switch]: [true, AccessLevel.owner],
				[Preset.submissive]: [false, AccessLevel.lover],
				[Preset.slave]: [false, AccessLevel.lover],
			},
		});
		registerPermission("rules_change_limits", {
			name: "Allows to limit/block specific rules",
			category: ModuleCategory.Rules,
			defaults: {
				[Preset.dominant]: [true, AccessLevel.self],
				[Preset.switch]: [true, AccessLevel.self],
				[Preset.submissive]: [true, AccessLevel.self],
				[Preset.slave]: [false, AccessLevel.owner],
			},
		});
		registerPermission("rules_view_originator", {
			name: "Allow to view who added the rule originally",
			category: ModuleCategory.Rules,
			defaults: {
				[Preset.dominant]: [true, AccessLevel.self],
				[Preset.switch]: [true, AccessLevel.self],
				[Preset.submissive]: [true, AccessLevel.mistress],
				[Preset.slave]: [true, AccessLevel.mistress],
			},
		});

		queryHandlers.ruleCreate = (sender, data) => {
			if (guard_BCX_Rule(data)) {
				return RulesCreate(data, sender);
			} else {
				return undefined;
			}
		};
		queryHandlers.ruleDelete = (sender, data) => {
			if (guard_BCX_Rule(data)) {
				return RulesDelete(data, sender);
			} else {
				return undefined;
			}
		};

		registerWhisperCommand("modules", "rules", "- Manage rules", (argv, sender, respond) => {
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
					const resultItem = `\n${data.name} | ${timerText}`;
					if (result.length + resultItem.length >= 990) {
						result += "\n...";
						respond(result);
						result = "Current rules (continued):";
					}
					result += resultItem;
				}
				respond(result);
			} else if (subcommand === "listall") {
				let result = "All existing rules:";
				for (const [k] of RulesGetList()) {
					const data = RulesGetDisplayDefinition(k);
					const resultItem = `\n${data.name}`;
					if (result.length + resultItem.length >= 990) {
						result += "\n...";
						respond(result);
						result = "All rules (continued):";
					}
					result += resultItem;
				}
				respond(result);
			} else if (subcommand === "description") {
				const result = parseRuleName(argv[1] || "");
				if (!result[0]) {
					return respond(result[1]);
				}
				const data = RulesGetDisplayDefinition(result[1]);
				respond(data.longDescription.replaceAll("PLAYER_NAME", Player.Name));
			} else if (subcommand === "remove") {
				const result = parseRuleName(argv[1] || "");
				if (!result[0]) {
					return respond(result[1]);
				}
				respond(RulesDelete(result[1], sender) ? `Ok.` : COMMAND_GENERIC_ERROR);
			} else {
				respond(Command_fixExclamationMark(sender, `!rules usage (page 1):\n` +
					`!rules list - List the currently added rules\n` +
					`!rules listall - List all existing rule names in BCX\n` +
					`!rules description <rule> - Show the rule's description\n` +
					`!rules remove <rule> - Remove a currently added rule if permitted to\n` +
					`\nNote: Adding and setting up rules is only supported via using BCX's graphical user interface yourself.`
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
				return Command_pickAutocomplete(argv[0], ["list", "listall", "description", "remove", ...ConditionsSubcommands]);
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
			permission_viewOriginator: "rules_view_originator",
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
						console.warn(`BCX: Missing custom data for rule ${rule}, fixing`);
						info.customData = {};
					}
					for (const k of Object.keys(info.customData)) {
						if (!(descriptor.dataDefinition as Record<string, any>)[k]) {
							console.warn(`BCX: Unknown custom data attribute '${k}' for rule ${rule}, cleaning up`, info.customData[k]);
							delete info.customData[k];
						}
					}
					for (const [k, def] of Object.entries<RuleCustomDataEntryDefinition>(descriptor.dataDefinition)) {
						const handler: RuleCustomDataHandler = ruleCustomDataHandlers[def.type];
						if (!handler) {
							console.error(`BCX: Custom data for rule ${rule} unknown type ${def.type}, removing it`, info);
							return false;
						}
						if (!handler.validate(info.customData[k], def)) {
							console.warn(`BCX: Bad custom data ${k} for rule ${rule}, expected type ${def.type}, replacing with default`, info.customData[k]);
							info.customData[k] = (typeof def.default === "function" ? def.default() : def.default);
						}
					}
				} else if (info.customData !== undefined) {
					console.error(`BCX: Custom data for rule ${rule} without data definition, removing it`, info);
					return false;
				}

				if (descriptor.internalDataValidate) {
					if (!descriptor.internalDataValidate(info.internalData)) {
						if (info.internalData === undefined && descriptor.internalDataDefault) {
							console.warn(`BCX: Missing internal data for rule ${rule}, fixing`);
							info.internalData = descriptor.internalDataDefault();
						} else {
							console.error(`BCX: Bad internal data for rule ${rule}, removing it`, info);
							return false;
						}
					}
				} else if (info.internalData !== undefined) {
					console.error(`BCX: Internal data for rule ${rule} without validator, removing it`, info);
					return false;
				}

				return true;
			},
			loadCategorySpecificGlobalData: () => undefined,
			stateChangeHandler: this.ruleStateChange.bind(this),
			tickHandler: this.ruleTick.bind(this),
			makePublicData: (rule, data) => ({
				enforce: data.data.enforce ?? true,
				log: data.data.log ?? true,
				customData: cloneDeep(data.data.customData),
			}),
			validateCategorySpecificGlobalData: () => true,
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
					ChatRoomSendLocal(`${character.toNicknamedString()} changed '${definition.name}' rule permission to ${ConditionsLimit[newLimit]}`, undefined, character.MemberNumber);
				}
			},
			logConditionUpdate: (rule, character, newData, oldData) => {
				const definition = RulesGetDisplayDefinition(rule);
				const visibleName = definition.name;

				const didActiveChange = newData.active !== oldData.active;
				const didTimerChange = newData.timer !== oldData.timer || newData.timerRemove !== oldData.timerRemove;
				const didTriggerChange = !isEqual(newData.requirements, oldData.requirements);
				const didEnforcementChange = newData.data.enforce !== oldData.data.enforce;
				const didLoggingChange = newData.data.log !== oldData.data.log;
				const changeEvents: string[] = [];
				if (didActiveChange)
					changeEvents.push("active state");
				if (didTimerChange)
					changeEvents.push("timer");
				if (didTriggerChange)
					changeEvents.push("trigger condition");
				if (didEnforcementChange)
					changeEvents.push("enforcement");
				if (didLoggingChange)
					changeEvents.push("logging");
				if (definition.dataDefinition) {
					for (const [k, def] of Object.entries<RuleCustomDataEntryDefinition>(definition.dataDefinition)) {
						if (!isEqual(oldData.data.customData?.[k], newData.data.customData?.[k])) {
							let descr = def.description;
							if (descr.includes(":")) {
								descr = descr.slice(0, descr.lastIndexOf(":"));
							}
							changeEvents.push(`${changeEvents.length > 0 ? "and " : ""}the value of the setting '${descr}'`);
						}
					}
				}
				if (changeEvents.length > 0) {
					logMessage("rule_change", LogEntryType.plaintext,
						`${character} changed the ${changeEvents.join(", ")} of ${Player.Name}'s '${visibleName}' rule`);
				}
				if (!character.isPlayer()) {
					if (didActiveChange) {
						ChatRoomSendLocal(`${character.toNicknamedString()} ${newData.active ? "reactivated" : "deactivated"} the '${visibleName}' rule`, undefined, character.MemberNumber);
					}
					if (newData.timer !== oldData.timer)
						if (newData.timer === null) {
							ChatRoomSendLocal(`${character.toNicknamedString()} disabled the timer of the '${visibleName}' rule`, undefined, character.MemberNumber);
						} else {
							ChatRoomSendLocal(`${character.toNicknamedString()} changed the remaining time of the timer of the '${visibleName}' rule to ${formatTimeInterval(newData.timer - Date.now())}`, undefined, character.MemberNumber);
						}
					if (newData.timer !== null && newData.timerRemove !== oldData.timerRemove)
						ChatRoomSendLocal(`${character.toNicknamedString()} changed the timer behavior of the '${visibleName}' rule to ${newData.timerRemove ? "remove" : "disable"} the rule when time runs out`, undefined, character.MemberNumber);
					if (didTriggerChange)
						if (newData.requirements === null) {
							ChatRoomSendLocal(`${character.toNicknamedString()} set the triggers of '${visibleName}' rule to the global rules configuration`, undefined, character.MemberNumber);
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
								ChatRoomSendLocal(`${character.toNicknamedString()} set the '${visibleName}' rule to trigger under following conditions:\n` + triggers.join("\n"), undefined, character.MemberNumber);
							} else {
								ChatRoomSendLocal(`${character.toNicknamedString()} deactivated all trigger conditions of the '${visibleName}' rule. The rule will now always trigger, while it is active`, undefined, character.MemberNumber);
							}
						}
					if (didEnforcementChange) {
						ChatRoomSendLocal(`${character.toNicknamedString()} ${newData.data.enforce ? "enabled enforcement" : "stopped enforcement"} of the '${visibleName}' rule`, undefined, character.MemberNumber);
					}
					if (didLoggingChange) {
						ChatRoomSendLocal(`${character.toNicknamedString()} ${newData.data.log ? "enabled logging" : "stopped logging"} of the '${visibleName}' rule`, undefined, character.MemberNumber);
					}
					if (definition.dataDefinition) {
						for (const [k, def] of Object.entries<RuleCustomDataEntryDefinition>(definition.dataDefinition)) {
							if (!isEqual(oldData.data.customData?.[k], newData.data.customData?.[k])) {
								ChatRoomSendLocal(`${character.toNicknamedString()} changed the '${visibleName}' rule's setting '${def.description}' from '${oldData.data.customData?.[k]}' to '${newData.data.customData?.[k]}'`, undefined, character.MemberNumber);
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
							ChatRoomSendLocal(`${character.toNicknamedString()} removed the default timer of the global rules configuration`, undefined, character.MemberNumber);
						} else {
							ChatRoomSendLocal(`${character.toNicknamedString()} changed the default timer of the global rules configuration to ${formatTimeInterval(newData.timer)}`, undefined, character.MemberNumber);
						}
					if (newData.timer !== null && newData.timerRemove !== oldData.timerRemove)
						ChatRoomSendLocal(`${character.toNicknamedString()} changed the default timeout behavior of the global rules configuration to ${newData.timerRemove ? "removal of rules" : "disabling rules"} when time runs out`, undefined, character.MemberNumber);
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
							ChatRoomSendLocal(`${character.toNicknamedString()} set the global rules configuration to trigger rules under following conditions:\n` + triggers.join("\n"), undefined, character.MemberNumber);
						} else {
							ChatRoomSendLocal(`${character.toNicknamedString()} deactivated all trigger conditions for the global rules configuration. Rules set to this default configuration will now always trigger, while active`, undefined, character.MemberNumber);
						}
					}
				}
			},
			getDefaultLimits: () => {
				const res: Record<string, ConditionsLimit> = {};
				for (const [k, v] of rules.entries()) {
					res[k] = v.defaultLimit;
				}
				return res;
			},
			commandConditionSelectorHelp: "rule",
			currentExportImport: {
				export(condition, data) {
					return {
						enforce: data.enforce ?? true,
						log: data.log ?? true,
						customData: cloneDeep(data.customData),
					};
				},
				import(condition, data, character) {
					const validator: ZodType<ConditionsCategorySpecificPublicData["rules"]> = zod.object({
						enforce: zod.boolean(),
						log: zod.boolean(),
						customData: zod.record(zod.any()).optional(),
					});
					const validationResult = validator.safeParse(data);
					if (!validationResult.success) {
						return [false, JSON.stringify(validationResult.error.format(), undefined, "\t")];
					}
					const validatedData = validationResult.data;
					const definition = rules.get(condition);
					if (!definition) {
						return [false, `Unknown rule '${condition}'`];
					}

					if (!guard_RuleCustomData(condition, validatedData.customData)) {
						return [false, `Invalid rule configuration`];
					}

					const current = ConditionsGetCondition("rules", condition);

					const internalData = current ? current.data.internalData :
						definition.internalDataDefault?.();

					if (definition.internalDataValidate && !definition.internalDataValidate(internalData)) {
						return [false, `Failed to validate internal data`];
					}

					return [true, {
						enforce: !validatedData.enforce && definition.enforceable ? false : undefined,
						log: !validatedData.log && definition.loggable ? false : undefined,
						customData: validatedData.customData,
						internalData,
					}];
				},
				importLog(condition, data, character) {
					const definition = rules.get(condition);
					if (!character || !definition)
						return;
					logMessage("rule_change", LogEntryType.plaintext, `${character} imported rule '${definition.name}'`);
					if (!character.isPlayer()) {
						ChatRoomSendLocal(`${character.toNicknamedString()} imported the rule '${definition.name}'`);
					}
				},
				importRemove(condition, character) {
					if (!RulesDelete(condition, character)) {
						return "Failed.";
					}
					return true;
				},
			},
		});

		// Init individual rules
		initRules_bc_blocks();
		initRules_bc_alter();
		initRules_bc_settings();
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

		this.resetTimer = BCX_setInterval(() => {
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

	ruleStateChange(rule: BCX_Rule, condition: ConditionsConditionData<"rules">, newState: boolean): void {
		const ruleDefinition = rules.get(rule);
		if (!ruleDefinition) {
			throw new Error(`Definition for rule ${rule} not found`);
		}

		ruleDefinition.stateChange?.(ruleDefinition.state, newState);
	}

	ruleTick(rule: BCX_Rule, condition: ConditionsConditionData<"rules">): void {
		if (this.suspendedUntil !== null) {
			if (Date.now() >= this.suspendedUntil) {
				this.suspendedUntil = null;
				this.triggerCounts.clear();
				ChatRoomActionMessage(`All of SourceCharacter's temporarily suspended rules are in effect again.`, null, [
					{ Tag: "SourceCharacter", MemberNumber: Player.MemberNumber, Text: CharacterNickname(Player) },
				]);
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
