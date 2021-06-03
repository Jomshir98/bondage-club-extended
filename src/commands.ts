import { ChatRoomActionMessage, ChatRoomSendLocal } from "./clubUtils";
import { hookFunction } from "./patching";
import { consoleInterface } from "./console";

interface ICommandInfo {
	description: string | null;
}

type CommandHandlerRaw = (args: string) => boolean;
type CommandHandlerParsed = (argv: string[]) => boolean;

interface ICommandRaw extends ICommandInfo {
	parse: false;
	callback: CommandHandlerRaw;
}

interface ICommandParsed extends ICommandInfo {
	parse: true;
	callback: CommandHandlerParsed;
}

const commands: Map<string, ICommandRaw | ICommandParsed> = new Map();

export function registerCommand(name: string, callback: CommandHandlerRaw, description: string | null = "") {
	name = name.toLocaleLowerCase();
	if (commands.has(name)) {
		throw new Error(`Command "${name}" already registered!`);
	}
	commands.set(name, {
		parse: false,
		callback,
		description
	});
}

export function registerCommandParsed(name: string, callback: CommandHandlerParsed, description: string | null = "") {
	name = name.toLocaleLowerCase();
	if (commands.has(name)) {
		throw new Error(`Command "${name}" already registered!`);
	}
	commands.set(name, {
		parse: true,
		callback,
		description
	});
}

function RunCommand(msg: string): boolean {
	const commandMatch = /^\s*(\S+)(?:\s|$)(.*)$/.exec(msg);
	if (msg && !commandMatch) {
		ChatRoomSendLocal("There was an error during parsing of your command");
		return false;
	}

	const command = msg ? commandMatch![1].toLocaleLowerCase() : "";
	const args = msg ? commandMatch![2] : "";
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
		const argv = [...args.matchAll(/".+?(?:"|$)|'.+?(?:'|$)|[^ ]+/g)]
			.map(a => a[0])
			.map(a => a[0] === '"' || a[0] === "'" ? a.substring(1, a[a.length - 1] === a[0] ? a.length - 1 : a.length) : a);
		return commandInfo.callback(argv);
	} else {
		return commandInfo.callback(args);
	}
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

	const command_help: CommandHandlerRaw = () => {
		ChatRoomSendLocal(
			`Available commands:\n` +
			Array.from(commands.entries())
				.filter(c => c[1].description !== null)
				.map(c => `.${c[0]}` + (c[1].description ? ` - ${c[1].description}` : ""))
				.sort()
				.join("\n")
		);
		return true;
	};
	registerCommand("help", command_help, "display this help [alias: . ]");
	registerCommand("", command_help, null);

	const command_action: CommandHandlerRaw = (msg) => {
		ChatRoomActionMessage(msg);
		return true;
	};
	registerCommand("action", command_action, "send custom (action) [alias: .a ]");
	registerCommand("a", command_action, null);

	registerCommand("antigarble", (value) => {
		if (["0", "1", "2"].includes(value)) {
			consoleInterface.antigarble = Number.parseInt(value, 10);
			ChatRoomSendLocal(`Antigarble set to ${value}`);
			return true;
		} else {
			ChatRoomSendLocal(`Invalid antigarble level; use 0 1 or 2`);
			return false;
		}
	}, "set garble prevention to show [garbled|both|ungarbled] messages (only affects received messages!)");
}
