import { ChatRoomActionMessage, ChatRoomSendLocal } from "./clubUtils";
import { hookFunction } from "./patching";
import { consoleInterface } from "./console";
import { longestCommonPrefix } from "./utils";

interface ICommandInfo {
	description: string | null;
}

type CommandHandlerRaw = (args: string) => boolean;
type CommandHandlerParsed = (argv: string[]) => boolean;
type CommandAutocompleterRaw = (args: string) => string[];
type CommandAutocompleterParsed = (argv: string[]) => string[];

interface ICommandRaw extends ICommandInfo {
	parse: false;
	callback: CommandHandlerRaw;
	autocomplete: CommandAutocompleterRaw | null;
}

interface ICommandParsed extends ICommandInfo {
	parse: true;
	callback: CommandHandlerParsed;
	autocomplete: CommandAutocompleterParsed | null;
}

const commands: Map<string, ICommandRaw | ICommandParsed> = new Map();

export function registerCommand(name: string, description: string | null, callback: CommandHandlerRaw, autocomplete: CommandAutocompleterRaw | null = null) {
	name = name.toLocaleLowerCase();
	if (commands.has(name)) {
		throw new Error(`Command "${name}" already registered!`);
	}
	commands.set(name, {
		parse: false,
		callback,
		autocomplete,
		description
	});
}

export function registerCommandParsed(name: string, description: string | null, callback: CommandHandlerParsed, autocomplete: CommandAutocompleterParsed | null = null) {
	name = name.toLocaleLowerCase();
	if (commands.has(name)) {
		throw new Error(`Command "${name}" already registered!`);
	}
	commands.set(name, {
		parse: true,
		callback,
		autocomplete,
		description
	});
}

function CommandParse(msg: string): [string, string] {
	msg = msg.trimStart();
	const commandMatch = /^(\S+)(?:\s|$)(.*)$/.exec(msg);
	if (!commandMatch) {
		return ["", ""];
	}
	return [(commandMatch[1] || "").toLocaleLowerCase(), commandMatch[2]];
}

function CommandParseArguments(args: string): string[] {
	return [...args.matchAll(/".*?(?:"|$)|'.*?(?:'|$)|[^ ]+/g)]
		.map(a => a[0])
		.map(a => a[0] === '"' || a[0] === "'" ? a.substring(1, a[a.length - 1] === a[0] ? a.length - 1 : a.length) : a);
}

function CommandHasEmptyArgument(args: string): boolean {
	const argv = CommandParseArguments(args);
	return argv.length === 0 || !args.endsWith(argv[argv.length - 1]);
}

function CommandQuoteArgument(arg: string): string {
	if (arg.startsWith(`"`)) {
		return `'${arg}'`;
	} else if (arg.startsWith(`'`)) {
		return `"${arg}"`;
	} else if (arg.includes(" ")) {
		return arg.includes('"') ? `'${arg}'` : `"${arg}"`;
	}
	return arg;
}

function RunCommand(msg: string): boolean {
	const [command, args] = CommandParse(msg);

	const commandInfo = commands.get(command);
	if (!commandInfo) {
		// Command not found
		ChatRoomSendLocal(
			`Unknown command "${command}"\n` +
			`To see list of valid commands whisper '!help'`,
			15000
		);
		return false;
	}
	if (commandInfo.parse) {
		return commandInfo.callback(CommandParseArguments(args));
	} else {
		return commandInfo.callback(args);
	}
}

function CommandAutocomplete(msg: string): string {
	msg = msg.trimStart();
	const [command, args] = CommandParse(msg);

	if (msg.length === command.length) {
		const prefixes = Array.from(commands.entries()).filter(c => c[1].description !== null && c[0].startsWith(command)).map(c => c[0] + " ");
		if (prefixes.length === 0)
			return msg;
		const best = longestCommonPrefix(prefixes);
		if (best === msg) {
			ChatRoomSendLocal(prefixes.slice().sort().join("\n"), 10_000);
		}
		return best;
	}

	const commandInfo = commands.get(command);
	if (commandInfo && commandInfo.autocomplete) {
		if (commandInfo.parse) {
			const argv = CommandParseArguments(args);
			if (CommandHasEmptyArgument(args)) {
				argv.push("");
			}
			const lastOptions = commandInfo.autocomplete(argv);
			if (lastOptions.length > 0) {
				const best = longestCommonPrefix(lastOptions);
				if (best === argv[argv.length - 1]) {
					ChatRoomSendLocal(lastOptions.slice().sort().join("\n"), 10_000);
				}
				argv[argv.length - 1] = best;
			}
			return `${command} ` +
				argv.map(CommandQuoteArgument).join(" ") +
				(lastOptions.length === 1 ? " " : "");
		} else {
			const possibleArgs = commandInfo.autocomplete(args);
			if (possibleArgs.length === 0) {
				return msg;
			}
			const best = longestCommonPrefix(possibleArgs);
			if (best === args) {
				ChatRoomSendLocal(possibleArgs.slice().sort().join("\n"), 10_000);
			}
			return `${command} ${best}`;
		}
	}

	return "";
}

export function init_commands() {
	hookFunction("ChatRoomSendChat", 10, (args, next) => {
		const chat = document.getElementById("InputChat") as HTMLTextAreaElement | null;
		if (chat) {
			const msg = chat.value.trim();
			if (msg.startsWith("..")) {
				chat.value = msg.substr(1);
			} else if (msg.startsWith(".")) {
				if (RunCommand(msg.substr(1))) {
					chat.value = "";
				}
				return;
			}
		}
		return next(args);
	});

	hookFunction("ChatRoomKeyDown", 10, (args, next) => {
		const chat = document.getElementById("InputChat") as HTMLTextAreaElement | null;
		// Tab for command completion
		if (KeyPress === 9 && chat && chat.value.startsWith(".") && !chat.value.startsWith("..")) {
			event?.preventDefault();

			chat.value = "." + CommandAutocomplete(chat.value.substr(1));
		} else {
			return next(args);
		}
	});

	const command_help: CommandHandlerRaw = () => {
		ChatRoomSendLocal(
			`Available commands:\n` +
			Array.from(commands.entries())
				.filter(c => c[1].description !== null)
				.map(c => `.${c[0]}` + (c[1].description ? ` ${c[1].description}` : ""))
				.sort()
				.join("\n")
		);
		return true;
	};
	registerCommand("help", "- display this help [alias: . ]", command_help);
	registerCommand("", null, command_help);

	const command_action: CommandHandlerRaw = (msg) => {
		ChatRoomActionMessage(msg);
		return true;
	};
	registerCommand("action", "- send custom (action) [alias: .a ]", command_action);
	registerCommand("a", null, command_action);

	const ANTIGARBLE_LEVELS: Record<string, number> = {
		"0": 0,
		"1": 1,
		"2": 2,
		"normal": 0,
		"both": 1,
		"ungarbled": 2
	};

	const ANTIGARBLE_LEVEL_NAMES: string[] = Object.keys(ANTIGARBLE_LEVELS).filter(k => k.length > 1);

	registerCommand("antigarble", "<level> - set garble prevention to show [normal|both|ungarbled] messages (only affects received messages!)", value => {
		const val = ANTIGARBLE_LEVELS[value || ""];
		if (val !== undefined) {
			consoleInterface.antigarble = val;
			ChatRoomSendLocal(`Antigarble set to ${ANTIGARBLE_LEVEL_NAMES[val]}`);
			return true;
		} else {
			ChatRoomSendLocal(`Invalid antigarble level; use ${ANTIGARBLE_LEVEL_NAMES.join("/")}`);
			return false;
		}
	}, value => {
		return ANTIGARBLE_LEVEL_NAMES.filter(k => k.length > 1 && k.startsWith(value));
	});
}
