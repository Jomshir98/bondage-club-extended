import { ChatroomCharacter } from "../characters";
import { ModuleCategory, ModuleInitPhase, Preset, ConditionsLimit } from "../constants";
import { moduleInitPhase } from "../moduleManager";
import { ChatRoomActionMessage, ChatRoomSendLocal } from "../utilsClub";
import { AccessLevel, registerPermission } from "./authority";
import { Command_fixExclamationMark, COMMAND_GENERIC_ERROR, Command_pickAutocomplete, registerWhisperCommand } from "./commands";
import { ConditionsAutocompleteSubcommand, ConditionsCheckAccess, ConditionsRegisterCategory, ConditionsRunSubcommand, ConditionsSubcommand } from "./conditions";
import { LogEntryType, logMessage } from "./log";
import { queryHandlers } from "./messaging";
import { moduleIsEnabled } from "./presets";
import { BaseModule } from "./_BaseModule";
import { BCX_setInterval } from "../BCXContext";
import { dictionaryProcess } from "../utils";
import { initCommands_definitions } from "../commands/command_definitions";
import { initCommands_speech } from "../commands/speech_commands";

const COMMANDS_ANTILOOP_RESET_INTERVAL = 60_000;
const COMMANDS_ANTILOOP_THRESHOLD = 10;
const COMMANDS_ANTILOOP_SUSPEND_TIME = 600_000;

export function guard_BCX_Command(name: unknown): name is BCX_Command {
	return typeof name === "string" && commands.has(name as BCX_Command);
}

export function guard_CommandCustomData(command: BCX_Command, data: unknown): boolean {
	return false;
}

interface CommandEntry<ID extends BCX_Command> extends CommandDefinition<ID> {
	state: CommandState<ID>;
}

const commands: Map<BCX_Command, CommandEntry<BCX_Command>> = new Map();
const commandsList: BCX_Command[] = [];

export function registerCommand<ID extends BCX_Command>(name: ID, data: CommandDefinition<ID>) {
	if (moduleInitPhase !== ModuleInitPhase.init) {
		throw new Error("Commands can be registered only during init");
	}
	if (commands.has(name)) {
		throw new Error(`Command "${name}" already defined!`);
	}
	commands.set(name, {
		...(data as CommandDefinition<BCX_Command>),
		state: new CommandState<BCX_Command>(name, data),
	});
	commandsList.push(name);
}

export function CommandsGetDisplayDefinition(command: BCX_Command): CommandDisplayDefinition {
	const data = commands.get(command);
	if (!data) {
		throw new Error(`Attempt to get display definition for unknown command '${command}'`);
	}
	return {
		name: data.name,
		shortDescription: data.shortDescription,
		longDescription: data.longDescription,
		helpDescription: data.helpDescription,
		playerUsable: data.playerUsable,
		defaultLimit: data.defaultLimit,
	};
}

export function CommandsGetCommandState<ID extends BCX_Command>(command: ID): CommandState<ID> {
	const data = commands.get(command);
	if (!data) {
		throw new Error(`Attempt to get state for unknown command '${command}'`);
	}
	return data.state as CommandState<ID>;
}

function parseCommandName(selector: string, filter?: (commandName: BCX_Command) => boolean): [true, BCX_Command] | [false, string] {
	selector = selector.toLocaleLowerCase();
	const command = Array.from(commands.entries())
		.filter(c => !filter || filter(c[0]))
		.find(([commandName, data]) => commandName.toLocaleLowerCase() === selector || data.name.toLocaleLowerCase() === selector);
	return command ? [true, command[0]] : [false, `Unknown command "${selector}".`];
}

function autocompleteCommandName(selector: string, filter?: (commandName: BCX_Command) => boolean): string[] {
	selector = selector.toLocaleLowerCase();

	let options: string[] = Array.from(commands.entries())
		.filter(c => c[1].name.toLocaleLowerCase().startsWith(selector) && (!filter || filter(c[0])))
		.map(c => c[1].name);

	if (options.length === 0) {
		options = Array.from(commands.entries())
			.filter(c => c[0].toLocaleLowerCase().startsWith(selector) && (!filter || filter(c[0])))
			.map(c => c[0]);
	}

	return options;
}

export function CommandsGetList(): [BCX_Command, CommandDisplayDefinition][] {
	return commandsList.map(command => [command, CommandsGetDisplayDefinition(command)]);
}

export function CommandsTrigger(command: BCX_Command, argv: string[], character: ChatroomCharacter, respond: (msg: string) => void): boolean {
	if (!moduleIsEnabled(ModuleCategory.Commands))
		return false;

	if (character && !ConditionsCheckAccess("commands", command, character))
		return false;

	const definition = commands.get(command);
	if (!definition) {
		throw new Error(`Attempt to trigger unknown command '${command}'`);
	}

	return definition.trigger(argv, character, respond, definition.state);
}

export class CommandState<ID extends BCX_Command> {
	readonly command: ID;
	readonly commandDefinition: CommandDisplayDefinition;

	constructor(command: ID, definition: CommandDisplayDefinition) {
		this.command = command;
		this.commandDefinition = definition;
	}
}

export class ModuleCommandsModule extends BaseModule {
	private resetTimer: number | null = null;
	private triggerCounts: Map<BCX_Command, number> = new Map();
	private suspendedUntil: number | null = null;

	init() {
		registerPermission("commands_normal", {
			name: "Allows controlling non-limited commands",
			category: ModuleCategory.Commands,
			defaults: {
				[Preset.dominant]: [true, AccessLevel.lover],
				[Preset.switch]: [true, AccessLevel.lover],
				[Preset.submissive]: [false, AccessLevel.mistress],
				[Preset.slave]: [false, AccessLevel.mistress],
			},
		});
		registerPermission("commands_limited", {
			name: "Allows controlling limited commands",
			category: ModuleCategory.Commands,
			defaults: {
				[Preset.dominant]: [true, AccessLevel.owner],
				[Preset.switch]: [true, AccessLevel.owner],
				[Preset.submissive]: [false, AccessLevel.lover],
				[Preset.slave]: [false, AccessLevel.lover],
			},
		});
		registerPermission("commands_change_limits", {
			name: "Allows to limit/block specific commands",
			category: ModuleCategory.Commands,
			defaults: {
				[Preset.dominant]: [true, AccessLevel.self],
				[Preset.switch]: [true, AccessLevel.self],
				[Preset.submissive]: [true, AccessLevel.self],
				[Preset.slave]: [false, AccessLevel.owner],
			},
		});

		queryHandlers.commandTrigger = (sender, data) => {
			if (!Array.isArray(data) || !data.every(i => typeof i === "string") || data.length < 1) {
				return undefined;
			}
			const command = data.shift();
			if (guard_BCX_Command(command)) {
				return CommandsTrigger(command, data, sender, () => { /* NOOP */ });
			} else {
				return undefined;
			}
		};

		registerWhisperCommand("modules", "commands", "- Manage the commands module", (argv, sender, respond) => {
			if (!moduleIsEnabled(ModuleCategory.Commands)) {
				return respond(`Commands module is disabled.`);
			}
			const subcommand = (argv[0] || "").toLocaleLowerCase();
			if ((subcommand as ConditionsSubcommand) === "setlimit") {
				return ConditionsRunSubcommand("commands", argv, sender, respond);
			} else if (subcommand === "listall") {
				let result = "List of commands:";
				for (const [command] of CommandsGetList()) {
					const resultItem = `\n${command}`;
					if (result.length + resultItem.length >= 990) {
						result += "\n...";
						respond(result);
						result = "List of commands (continued):";
					}
					result += resultItem;
				}
				respond(result);
			} else if (subcommand === "description") {
				const result = parseCommandName(argv[1] || "");
				if (!result[0]) {
					return respond(result[1]);
				}
				const data = CommandsGetDisplayDefinition(result[1]);
				respond(
					dictionaryProcess(
						data.longDescription,
						{
							PLAYER_NAME: Player.Name,
							HELP_DESCRIPTION: data.helpDescription,
						}
					)
				);
			} else {
				respond(Command_fixExclamationMark(sender, `!commands usage:\n` +
					`!commands listall - List all commands\n` +
					`!commands description <command> - Show the command's description\n` +
					`!commands setlimit <command> <normal/limited/blocked> - Set a limit on certain <command>\n` +
					`\nNote: The commands can also be listed with '.help commands'. To use them on other BCX users, whisper the command with a leading '!' instead of '.'`
				));
			}
		}, (argv, sender) => {
			if (!moduleIsEnabled(ModuleCategory.Commands)) {
				return [];
			}
			if (argv.length <= 1) {
				return Command_pickAutocomplete(argv[0], ["listall", "description", "setlimit"]);
			}

			const subcommand = argv[0].toLocaleLowerCase();

			if ((subcommand as ConditionsSubcommand) === "setlimit") {
				return ConditionsAutocompleteSubcommand("commands", argv, sender);
			}

			return [];
		});

		ConditionsRegisterCategory("commands", {
			category: ModuleCategory.Commands,
			permission_normal: "commands_normal",
			permission_limited: "commands_limited",
			permission_changeLimits: "commands_change_limits",
			loadValidateConditionKey: command => guard_BCX_Command(command),
			loadValidateCondition: (command) => {
				console.error(`BCX: Removing unexpected command condition ${command}`);
				return false;
			},
			loadCategorySpecificGlobalData: () => undefined,
			stateChangeHandler: () => { /* NOOP */ },
			tickHandler: this.commandTick.bind(this),
			makePublicData: () => undefined,
			validateCategorySpecificGlobalData: () => true,
			validatePublicData: () => true,
			updateCondition: () => false,
			parseConditionName: (selector, onlyExisting) => {
				return parseCommandName(selector, onlyExisting ? (command => onlyExisting.includes(command)) : undefined);
			},
			autocompleteConditionName: (selector, onlyExisting) => {
				return autocompleteCommandName(selector, onlyExisting ? (command => onlyExisting.includes(command)) : undefined);
			},
			logLimitChange: (command, character, newLimit) => {
				const definition = CommandsGetDisplayDefinition(command);
				logMessage("command_change", LogEntryType.plaintext,
					`${character} changed ${Player.Name}'s '${definition.name}' command permission to ${ConditionsLimit[newLimit]}`);
				if (!character.isPlayer()) {
					ChatRoomSendLocal(`${character.toNicknamedString()} changed '${definition.name}' command permission to ${ConditionsLimit[newLimit]}`, undefined, character.MemberNumber);
				}
			},
			logConditionUpdate: () => { /* NOOP */ },
			logCategoryUpdate: () => { /* NOOP */ },
			getDefaultLimits: () => {
				const res: Record<string, ConditionsLimit> = {};
				for (const [k, v] of commands.entries()) {
					res[k] = v.defaultLimit;
				}
				return res;
			},
			commandConditionSelectorHelp: "command",
		});

		// Init individual commands
		initCommands_definitions();
		initCommands_speech();

		for (const [command, data] of commands.entries()) {
			if (data.init) {
				data.init(data.state);
			}
			const autoCompleter = data.autoCompleter;
			registerWhisperCommand(
				"commands",
				command,
				data.shortDescription != null ? `${data.helpDescription} - ${dictionaryProcess(data.shortDescription, {})}` : data.helpDescription,
				(argv, sender, respond) => {
					if (!sender.isPlayer() || !data.playerUsable) {
						if (
							!moduleIsEnabled(ModuleCategory.Commands) ||
							!ConditionsCheckAccess("commands", command, sender)
						) {
							respond(COMMAND_GENERIC_ERROR);
							return;
						}
					}

					data.trigger(argv, sender, respond, data.state);
				},
				autoCompleter ? (argv, sender) => {
					if (!sender.isPlayer() || !data.playerUsable) {
						if (
							!moduleIsEnabled(ModuleCategory.Commands) ||
							!ConditionsCheckAccess("commands", command, sender)
						) {
							return [];
						}
					}

					return autoCompleter(argv, sender);
				} : undefined,
				!!data.playerUsable
			);
		}
	}

	load() {
		if (!moduleIsEnabled(ModuleCategory.Commands)) {
			return;
		}

		for (const command of commands.values()) {
			if (command.load) {
				command.load(command.state);
			}
		}
	}

	run() {
		if (!moduleIsEnabled(ModuleCategory.Commands))
			return;

		this.resetTimer = BCX_setInterval(() => {
			this.triggerCounts.clear();
		}, COMMANDS_ANTILOOP_RESET_INTERVAL);
	}

	unload() {
		if (this.resetTimer !== null) {
			clearInterval(this.resetTimer);
			this.resetTimer = null;
		}

		for (const command of commands.values()) {
			if (command.unload) {
				command.unload();
			}
		}
	}

	reload() {
		this.unload();
		this.load();
		this.run();
	}

	commandTick(command: BCX_Command, condition: ConditionsConditionData<"commands">): void {
		if (this.suspendedUntil !== null) {
			if (Date.now() >= this.suspendedUntil) {
				this.suspendedUntil = null;
				this.triggerCounts.clear();
				ChatRoomActionMessage(`All of SourceCharacter's temporarily blocked commands can be used again.`, null, [
					{ Tag: "SourceCharacter", MemberNumber: Player.MemberNumber, Text: CharacterNickname(Player) },
				]);
			} else {
				return;
			}
		}

		const commandDefinition = commands.get(command);
		if (!commandDefinition) {
			throw new Error(`Definition for command ${command} not found`);
		}

		if (commandDefinition.tick) {
			if (commandDefinition.tick(commandDefinition.state)) {
				const counter = (this.triggerCounts.get(command) ?? 0) + 1;
				this.triggerCounts.set(command, counter);

				if (counter >= COMMANDS_ANTILOOP_THRESHOLD) {
					ChatRoomActionMessage("Protection triggered: Commands have been blocked for 10 minutes. Please refrain from using commands so rapidly, as it creates strain on the server and may lead to unwanted side effects! If you believe this message was triggered by a bug, please report it to BCX Discord.");
					this.suspendedUntil = Date.now() + COMMANDS_ANTILOOP_SUSPEND_TIME;
				}
			}
		}
	}
}
