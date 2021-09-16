import isEqual from "lodash-es/isEqual";
import { ChatroomCharacter } from "../characters";
import { ModuleCategory, ModuleInitPhase, Preset } from "../constants";
import { moduleInitPhase } from "../moduleManager";
import { initRules_bc_blocks } from "../rules/bc_blocks";
import { capitalizeFirstLetter, formatTimeInterval, isObject } from "../utils";
import { ChatRoomSendLocal, getCharacterName } from "../utilsClub";
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

const rules: Map<BCX_Rule, RuleDefinition> = new Map();
const rulesList: BCX_Rule[] = [];

export function registerRule(name: BCX_Rule, data: RuleDefinition) {
	if (moduleInitPhase !== ModuleInitPhase.init) {
		throw new Error("Rules can be registered only during init");
	}
	if (rules.has(name)) {
		throw new Error(`Rule "${name}" already defined!`);
	}
	rules.set(name, data);
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
		longDescription: data.longDescription
	};
}

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

	if (!ConditionsGetCondition("rules", rule)) {
		ConditionsSetCondition("rules", rule, {});
		if (character) {
			// TODO
			logMessage("rule_change", LogEntryType.plaintext, `${character} rule_create: ${rule}`);
			if (!character.isPlayer()) {
				ChatRoomSendLocal(`${character} rule_create: ${rule}`);
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

	if (ConditionsRemoveCondition("rules", rule) && character) {
		// TODO
		logMessage("rule_change", LogEntryType.plaintext, `${character} rule_delete: ${rule}`);
		if (!character.isPlayer()) {
			ChatRoomSendLocal(`${character} rule_delete: ${rule}`);
		}
	}

	return true;
}

export function RuleIsEnforced(rule: BCX_Rule): boolean {
	const data = ConditionsGetCondition("rules", rule);
	if (!data || !ConditionsIsConditionInEffect("rules", rule))
		return false;
	return data.data.enforce !== false;
}

export function RuleIsLogged(rule: BCX_Rule): boolean {
	const data = ConditionsGetCondition("rules", rule);
	if (!data || !ConditionsIsConditionInEffect("rules", rule))
		return false;
	return data.data.log !== false;
}

export class ModuleRules extends BaseModule {
	private resetTimer: number | null = null;
	private triggerCounts: Map<BCX_Rule, number> = new Map();
	private suspendedUntil: number | null = null;

	init() {
		registerPermission("rules_normal", {
			// TODO
			name: "rules_normal",
			category: ModuleCategory.Rules,
			defaults: {
				[Preset.dominant]: [true, AccessLevel.lover],
				[Preset.switch]: [true, AccessLevel.lover],
				[Preset.submissive]: [false, AccessLevel.mistress],
				[Preset.slave]: [false, AccessLevel.mistress]
			}
		});
		registerPermission("rules_limited", {
			// TODO
			name: "rules_limited",
			category: ModuleCategory.Rules,
			defaults: {
				[Preset.dominant]: [true, AccessLevel.owner],
				[Preset.switch]: [true, AccessLevel.owner],
				[Preset.submissive]: [false, AccessLevel.lover],
				[Preset.slave]: [false, AccessLevel.lover]
			}
		});
		registerPermission("rules_global_configuration", {
			// TODO
			name: "rules_global_configuration",
			category: ModuleCategory.Rules,
			defaults: {
				[Preset.dominant]: [true, AccessLevel.owner],
				[Preset.switch]: [true, AccessLevel.owner],
				[Preset.submissive]: [false, AccessLevel.lover],
				[Preset.slave]: [false, AccessLevel.lover]
			}
		});
		registerPermission("rules_change_limits", {
			// TODO
			name: "rules_change_limits",
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

				if (!isObject(info) ||
					// eslint-disable-next-line @typescript-eslint/no-unnecessary-boolean-literal-compare
					(info.enforce !== undefined && info.enforce !== false) ||
					// eslint-disable-next-line @typescript-eslint/no-unnecessary-boolean-literal-compare
					(info.log !== undefined && info.log !== false)
				) {
					console.error(`BCX: Bad data for rule ${rule}, removing it`, info);
					return false;
				}

				return true;
			},
			tickHandler: this.ruleTick.bind(this),
			makePublicData: (rule, data) => ({
				enforce: data.data.enforce ?? true,
				log: data.data.log ?? true
			}),
			validatePublicData: (rule, data) =>
				isObject(data) &&
				typeof data.enforce === "boolean" &&
				typeof data.log === "boolean",
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
					`${character} changed ${Player.Name}'s '${definition.name}' rule permission to ${newLimit}`);
				if (!character.isPlayer()) {
					ChatRoomSendLocal(`${character} changed '${definition.name}' rule permission to ${newLimit}`, undefined, character.MemberNumber);
				}
			},
			logConditionUpdate: (rule, character, newData, oldData) => {
				const definition = RulesGetDisplayDefinition(rule);
				const visibleName = definition.name;

				const didTimerChange = newData.timer !== oldData.timer || newData.timerRemove !== oldData.timerRemove;
				const didTriggerChange = !isEqual(newData.requirements, oldData.requirements);
				const changeEvents = [];
				if (didTimerChange)
					changeEvents.push("timer");
				if (didTriggerChange)
					changeEvents.push("trigger condition");
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
	}

	load() {
		if (!moduleIsEnabled(ModuleCategory.Rules)) {
			return;
		}

		for (const rule of rules.values()) {
			if (rule.load) {
				rule.load();
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
				// TODO: Wake up message
			} else {
				return;
			}
		}

		const ruleDefinition = rules.get(rule);
		if (!ruleDefinition) {
			throw new Error(`Definition for rule ${rule} not found`);
		}

		if (ruleDefinition.tick) {
			if (ruleDefinition.tick()) {
				const counter = (this.triggerCounts.get(rule) ?? 0) + 1;
				this.triggerCounts.set(rule, counter);

				if (counter >= RULES_ANTILOOP_THRESHOLD) {
					// TODO: Protection trigger message
					this.suspendedUntil = Date.now() + RULES_ANTILOOP_SUSPEND_TIME;
				}
			}
		}
	}
}
