import { ChatRoomActionMessage, ChatRoomSendLocal, getVisibleGroupName, isBind } from "../utilsClub";
import { ChatroomCharacter, getAllCharactersInRoom, getChatroomCharacter, getPlayerCharacter } from "../characters";
import { hookFunction } from "../patching";
import { arrayUnique, longestCommonPrefix } from "../utils";
import { BaseModule } from "./_BaseModule";
import { firstTimeInit, modStorage, modStorageSync } from "./storage";
import { queryHandlers, sendQuery } from "./messaging";

interface ICommandInfo {
	description: string | null;
}

export type CommandHandlerRaw = (args: string) => boolean;
export type CommandHandlerParsed = (argv: string[]) => boolean;
export type CommandAutocompleterRaw = (args: string) => string[];
export type CommandAutocompleterParsed = (argv: string[]) => string[];

type WhisperCommandHandler = (argv: string[], sender: ChatroomCharacter, respond: (msg: string) => void) => void;
type WhisperCommandAutocompleter = (argv: string[], sender: ChatroomCharacter) => string[];

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

interface IWhisperCommand extends ICommandInfo {
	callback: WhisperCommandHandler;
	autocomplete: WhisperCommandAutocompleter | null;
}

export const COMMAND_GENERIC_ERROR = `The command failed to execute, likely because you are lacking the permission to give it.`;

const commands: Map<string, ICommandRaw | ICommandParsed> = new Map();
const whisperCommands: Map<string, IWhisperCommand> = new Map();

let firstTimeHelp: HTMLDivElement | null = null;

export function CommandsShowFirstTimeHelp() {
	if (!firstTimeHelp && modStorage.chatShouldDisplayFirstTimeHelp) {
		firstTimeHelp = ChatRoomSendLocal(
			`[ BCX commands tutorial ]\n` +
			`BCX also provides helpful chat commands.\n` +
			`All commands start with a dot ( . )\n` +
			`The commands also support auto-completion: While writing a command, press 'Tab' to try automatically completing the currently typed word.\n` +
			`Other club members can also use commands of your BCX, without needing BCX themselves. They will get a list of all commands they have permission using by whispering '!help' ( ! instead of . ) to you.\n` +
			`Note: Messages colored like this text can only be seen by you and no one else.\n` +
			`\n` +
			`To complete this tutorial, use '.help' command by writing '.he' and pressing 'Tab' to complete it to '.help', it will show you list of available BCX commands.`
		);
	}
}

function CommandsCompleteFirstTimeHelp() {
	if (modStorage.chatShouldDisplayFirstTimeHelp !== undefined) {
		delete modStorage.chatShouldDisplayFirstTimeHelp;
		modStorageSync();
	}
	if (firstTimeHelp) {
		firstTimeHelp.remove();
		firstTimeHelp = null;
	}
}

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

export function aliasCommand(originalName: string, alias: string): void {
	originalName = originalName.toLocaleLowerCase();
	alias = alias.toLocaleLowerCase();
	const original = commands.get(originalName);
	if (!original) {
		throw new Error(`Command "${originalName}" to alias not found`);
	}
	if (original.parse) {
		commands.set(alias, {
			parse: true,
			description: null,
			callback: original.callback,
			autocomplete: original.autocomplete
		});
	} else {
		commands.set(alias, {
			parse: false,
			description: null,
			callback: original.callback,
			autocomplete: original.autocomplete
		});
	}
}

export function registerCommandParsed(
	name: string,
	description: string | null,
	callback: CommandHandlerParsed,
	autocomplete: CommandAutocompleterParsed | null = null
) {
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

export function registerWhisperCommand(
	name: string,
	description: string | null,
	callback: WhisperCommandHandler,
	autocomplete: WhisperCommandAutocompleter | null = null,
	registerNormal: boolean = true
) {
	name = name.toLocaleLowerCase();
	if (registerNormal) {
		registerCommandParsed(
			name,
			description,
			(argv) => { callback(argv, getPlayerCharacter(), (msg) => ChatRoomSendLocal(msg)); return true; },
			autocomplete ? (argv) => autocomplete(argv, getPlayerCharacter()) : null
		);
	}
	if (whisperCommands.has(name)) {
		throw new Error(`Command "${name}" already registered!`);
	}
	whisperCommands.set(name, {
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
		.map(a => a[0] === '"' || a[0] === "'" ? a.substring(1, a.length > 1 && a[a.length - 1] === a[0] ? a.length - 1 : a.length) : a);
}

function CommandHasEmptyArgument(args: string): boolean {
	const argv = CommandParseArguments(args);
	return argv.length === 0 || !args.endsWith(argv[argv.length - 1]);
}

function CommandArgumentNeedsQuotes(arg: string): boolean {
	return arg.includes(" ") || arg.includes('"') || arg.startsWith(`'`);
}

function CommandQuoteArgument(arg: string, force: boolean = false): string {
	if (arg.startsWith(`"`)) {
		return `'${arg}'`;
	} else if (arg.startsWith(`'`)) {
		return `"${arg}"`;
	} else if (arg.includes(" ") || force) {
		return arg.includes('"') ? `'${arg}'` : `"${arg}"`;
	}
	return arg;
}

let autocompleteMessage: null | HTMLDivElement = null;
let autocompleteLastQuery: string | null = null;
let autocompleteLastResult: [string, string][] = [];
let autocompleteNextIndex = 0;

function autocompleteClear() {
	if (autocompleteMessage) {
		autocompleteMessage.remove();
		autocompleteMessage = null;
	}
	autocompleteLastQuery = null;
}

function autocompleteShow(header: string, options: string[], highlight?: number) {
	autocompleteClear();
	if (options.length > 0) {
		const res = document.createElement("div");
		res.innerText += `[${header}]\n`;
		for (let i = 0; i < options.length; i++) {
			const option = document.createElement("div");
			option.innerText = options[i];
			if (i === highlight) {
				option.style.background = `#7e7eff54`;
			}
			res.appendChild(option);
		}
		autocompleteMessage = ChatRoomSendLocal(res, 10_000);
	}
}

function RunCommand(msg: string): boolean {
	autocompleteClear();

	const [command, args] = CommandParse(msg);

	const commandInfo = commands.get(command);
	if (!commandInfo) {
		// Command not found
		ChatRoomSendLocal(
			`Unknown command "${command}"\n` +
			`To see list of valid commands use '.help'`,
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

function RunWhisperCommand(msg: string, sender: ChatroomCharacter, respond: (msg: string) => void): void {
	const [command, args] = CommandParse(msg);

	const commandInfo = whisperCommands.get(command);
	if (!commandInfo) {
		// Command not found
		respond(
			`Unknown command "${command}"\n` +
			`To see list of valid commands whisper '!help'`
		);
		return;
	}
	return commandInfo.callback(CommandParseArguments(args), sender, respond);
}

function CommandAutocomplete(msg: string): [string, string][] {
	msg = msg.trimStart();
	const [command, args] = CommandParse(msg);

	if (msg.length === command.length) {
		const prefixes = Array.from(commands.entries()).filter(c => c[1].description !== null && c[0].startsWith(command)).map(c => c[0] + " ");
		if (prefixes.length === 0)
			return [];
		return prefixes.map(i => [i, i]);
	}

	const commandInfo = commands.get(command);
	if (commandInfo && commandInfo.autocomplete) {
		if (commandInfo.parse) {
			const argv = CommandParseArguments(args);
			if (CommandHasEmptyArgument(args)) {
				argv.push("");
			}
			let lastOptions = commandInfo.autocomplete(argv);
			const fin = lastOptions.length === 1;
			if (lastOptions.length === 0) {
				lastOptions = [argv[argv.length - 1]];
			}
			argv.pop();
			const needsQuotes = lastOptions.some(CommandArgumentNeedsQuotes);
			return lastOptions.map(
				i => [
					`${command} ` +
					argv
						.map(a => CommandQuoteArgument(a))
						.concat(needsQuotes ? CommandQuoteArgument(i, true) : i)
						.join(" ") +
					(fin ? " " : ""),
					i
				]
			);
		} else {
			const possibleArgs = commandInfo.autocomplete(args);
			if (possibleArgs.length === 0) {
				return [];
			}
			return possibleArgs.map(arg => [`${command} ${arg}`, arg]);
		}
	}

	return [];
}

function CommandAutocompleteCycle(msg: string): string {
	if (autocompleteLastQuery === msg && autocompleteNextIndex < autocompleteLastResult.length) {
		autocompleteShow("autocomplete hint", autocompleteLastResult.map(i => i[1]), autocompleteNextIndex);
		const res = autocompleteLastResult[autocompleteNextIndex][0].trim();
		autocompleteNextIndex = (autocompleteNextIndex + 1) % autocompleteLastResult.length;
		autocompleteLastQuery = res;
		return res;
	}
	autocompleteClear();
	autocompleteLastResult = CommandAutocomplete(msg).sort((a, b) => a[1].localeCompare(b[1]));
	if (autocompleteLastResult.length === 0) {
		return msg;
	} else if (autocompleteLastResult.length === 1) {
		return autocompleteLastResult[0][0];
	}
	const best = longestCommonPrefix(autocompleteLastResult.map(i => i[0]));
	autocompleteShow("autocomplete hint", autocompleteLastResult.map(i => i[1]));
	autocompleteLastQuery = best;
	autocompleteNextIndex = 0;
	return best;
}

function WhisperCommandAutocomplete(msg: string, sender: ChatroomCharacter): [string, string[] | null] {
	msg = msg.trimStart();
	const [command, args] = CommandParse(msg);

	if (msg.length === command.length) {
		const prefixes = Array.from(whisperCommands.entries()).filter(c => c[1].description !== null && c[0].startsWith(command)).map(c => c[0] + " ");
		if (prefixes.length === 0)
			return [msg, null];
		const best = longestCommonPrefix(prefixes);
		return [best, best === msg ? prefixes.slice().sort() : null];
	}

	const commandInfo = whisperCommands.get(command);
	if (commandInfo && commandInfo.autocomplete) {
		const argv = CommandParseArguments(args);
		if (CommandHasEmptyArgument(args)) {
			argv.push("");
		}
		const lastOptions = commandInfo.autocomplete(argv, sender);
		let opts: string[] | null = null;
		if (lastOptions.length > 0) {
			const best = longestCommonPrefix(lastOptions);
			if (lastOptions.length > 1 && best === argv[argv.length - 1]) {
				opts = lastOptions.slice().sort();
			}
			argv[argv.length - 1] = best;
		}
		return [`${command} ` +
			argv.map(i => CommandQuoteArgument(i)).join(" ") +
			(lastOptions.length === 1 ? " " : ""), opts];
	}

	return [msg, null];
}

export function Command_fixExclamationMark(sender: ChatroomCharacter, text: string): string {
	return sender.isPlayer() ? text.replace(/^!/gm, ".") : text;
}

export function Command_pickAutocomplete(selector: string, options: string[]): string[] {
	selector = selector.toLocaleLowerCase();
	return options.filter(o => o.toLocaleLowerCase().startsWith(selector));
}

export function Command_selectCharacter(selector: string): ChatroomCharacter | string {
	const characters = getAllCharactersInRoom();
	if (/^[0-9]+$/.test(selector)) {
		const MemberNumber = Number.parseInt(selector, 10);
		const target = characters.find(c => c.MemberNumber === MemberNumber);
		if (!target) {
			return `Player #${MemberNumber} not found in the room.`;
		}
		return target;
	}
	let targets = characters.filter(c => c.Name === selector);
	if (targets.length === 0)
		targets = characters.filter(c => c.Name.toLocaleLowerCase() === selector.toLocaleLowerCase());

	if (targets.length === 1) {
		return targets[0];
	} else if (targets.length === 0) {
		return `Player "${selector}" not found in the room.`;
	} else {
		return `Multiple players match "${selector}". Please use Member Number instead.`;
	}
}

export function Command_selectCharacterMemberNumber(selector: string, allowNotPresent: boolean = true): number | string {
	const character = Command_selectCharacter(selector);
	if (typeof character === "string" && allowNotPresent && /^[0-9]+$/.test(selector)) {
		return Number.parseInt(selector, 10);
	}
	return typeof character === "string" ? character : character.MemberNumber;
}

export function Command_selectCharacterAutocomplete(selector: string): string[] {
	const characters = getAllCharactersInRoom();
	if (/^[0-9]+$/.test(selector)) {
		return characters.map(c => c.MemberNumber?.toString(10)).filter(n => n != null && n.startsWith(selector)) as string[];
	}
	return characters.map(c => c.Name).filter(n => n.toLocaleLowerCase().startsWith(selector.toLocaleLowerCase()));
}

export function Command_selectWornItem(character: ChatroomCharacter, selector: string, filter: (item: Item) => boolean = isBind): Item | string {
	const items = character.Character.Appearance.filter(filter);
	let targets = items.filter(A => A.Asset.Group.Name.toLocaleLowerCase() === selector.toLocaleLowerCase());
	if (targets.length === 0)
		targets = items.filter(A => getVisibleGroupName(A.Asset.Group).toLocaleLowerCase() === selector.toLocaleLowerCase());
	if (targets.length === 0)
		targets = items.filter(A => A.Asset.Name.toLocaleLowerCase() === selector.toLocaleLowerCase());
	if (targets.length === 0)
		targets = items.filter(A => A.Asset.Description.toLocaleLowerCase() === selector.toLocaleLowerCase());

	if (targets.length === 1) {
		return targets[0];
	} else if (targets.length === 0) {
		return `Item "${selector}" not found on character ${character}. If your item(group) consists of more than one word, please put it in quotes, such as "lower leg".`;
	} else {
		return `Multiple items match, please use group name instead. (eg. arms)`;
	}
}

export function Command_selectWornItemAutocomplete(character: ChatroomCharacter, selector: string, filter: (item: Item) => boolean = isBind): string[] {
	const items = character.Character.Appearance.filter(filter);

	let possible = arrayUnique(
		items.map(A => getVisibleGroupName(A.Asset.Group))
			.concat(items.map(A => A.Asset.Description))
	).filter(i => i.toLocaleLowerCase().startsWith(selector.toLocaleLowerCase()));

	if (possible.length === 0) {
		possible = arrayUnique(
			items.map(A => A.Asset.Group.Name)
				.concat(items.map(A => A.Asset.Name))
		).filter(i => i.toLocaleLowerCase().startsWith(selector.toLocaleLowerCase()));
	}

	return possible;
}

export function Command_selectGroup(selector: string, character: ChatroomCharacter | null, filter?: (group: AssetGroup) => boolean): AssetGroup | string {
	let targets = AssetGroup.filter(G => G.Name.toLocaleLowerCase() === selector.toLocaleLowerCase() && (!filter || filter(G)));
	if (targets.length === 0)
		targets = AssetGroup.filter(G => getVisibleGroupName(G).toLocaleLowerCase() === selector.toLocaleLowerCase() && (!filter || filter(G)));

	if (targets.length > 1) {
		return `Multiple groups match "${selector}", please report this as a bug.`;
	} else if (targets.length === 1) {
		return targets[0];
	} else if (character) {
		const item = Command_selectWornItem(character, selector, i => (!filter || filter(i.Asset.Group)));
		return typeof item === "string" ? item : item.Asset.Group;
	} else {
		return `Unknown group "${selector}".`;
	}
}

export function Command_selectGroupAutocomplete(selector: string, character: ChatroomCharacter | null, filter?: (group: AssetGroup) => boolean): string[] {
	const items = character ? character.Character.Appearance : [];

	let possible = arrayUnique(
		AssetGroup
			.filter(G => !filter || filter(G))
			.map(G => getVisibleGroupName(G))
			.concat(
				items
					.filter(A => !filter || filter(A.Asset.Group))
					.map(A => A.Asset.Description)
			)
	).filter(i => i.toLocaleLowerCase().startsWith(selector.toLocaleLowerCase()));

	if (possible.length === 0) {
		possible = arrayUnique(
			AssetGroup
				.filter(G => !filter || filter(G))
				.map(G => G.Name)
				.concat(
					items
						.filter(A => !filter || filter(A.Asset.Group))
						.map(A => A.Asset.Name)
				)
		).filter(i => i.toLocaleLowerCase().startsWith(selector.toLocaleLowerCase()));
	}

	return possible;
}

export function Command_parseTime(selector: string): string | number {
	const match = /^([0-9]+)([a-z]+)$/.exec(selector.toLocaleLowerCase());
	if (!match) {
		return `Unknown time format "${selector}", please use format 'number+unit' (e.g. 23h 30m)`;
	}
	const num = Number.parseInt(match[1], 10);
	const unit = match[2];
	if (["d", "day", "days"].includes(unit)) {
		return num * 24 * 60 * 60 * 1000;
	} else if (["h", "hour", "hours"].includes(unit)) {
		return num * 60 * 60 * 1000;
	} else if (["m", "min", "minute", "minutes"].includes(unit)) {
		return num * 60 * 1000;
	} else if (["s", "sec", "second", "seconds"].includes(unit)) {
		return num * 1000;
	}
	return `Unknown time unit "${unit}", please use one of:\n` +
		`d (day), h (hour), m (minute), s (second)`;
}

export class ModuleCommands extends BaseModule {
	load() {
		hookFunction("ChatRoomFirstTimeHelp", 0, (args, next) => {
			next(args);
			CommandsShowFirstTimeHelp();
		});

		hookFunction("ChatRoomClearAllElements", 1, (args, next) => {
			firstTimeHelp = null;
			return next(args);
		});

		hookFunction("ChatRoomSendChat", 10, (args, next) => {
			const chat = document.getElementById("InputChat") as HTMLTextAreaElement | null;
			if (chat && !firstTimeInit) {
				const msg = chat.value.trim();
				if (msg.startsWith("..")) {
					chat.value = msg.substr(1);
				} else if (msg.startsWith(".")) {
					if (RunCommand(msg.substr(1))) {
						// Keeps the chat log in memory so it can be accessed with pageup/pagedown
						ChatRoomLastMessage.push(msg);
						ChatRoomLastMessageIndex = ChatRoomLastMessage.length;
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
			if (
				KeyPress === 9 &&
				chat &&
				chat.value.startsWith(".") &&
				!chat.value.startsWith("..") &&
				!firstTimeInit
			) {
				const e = args[0] as KeyboardEvent ?? event;
				e?.preventDefault();
				e?.stopImmediatePropagation();

				chat.value = "." + CommandAutocompleteCycle(chat.value.substr(1));
			} else if (
				KeyPress === 9 &&
				ChatRoomTargetMemberNumber != null &&
				chat &&
				chat.value.startsWith("!") &&
				!chat.value.startsWith("!!") &&
				!firstTimeInit
			) {
				const currentValue = chat.value;
				const currentTarget = ChatRoomTargetMemberNumber;
				const e = args[0] as KeyboardEvent ?? event;
				e?.preventDefault();
				e?.stopImmediatePropagation();

				sendQuery("commandHint", currentValue, currentTarget).then(result => {
					if (chat.value !== currentValue || ChatRoomTargetMemberNumber !== currentTarget)
						return;
					if (!Array.isArray(result) ||
						result.length !== 2 ||
						typeof result[0] !== "string" ||
						(
							result[1] !== null &&
							(
								!Array.isArray(result[1]) ||
								result[1].some(i => typeof i !== "string")
							)
						)
					) {
						throw new Error("Bad data");
					}
					chat.value = result[0];
					if (result[1]) {
						ChatRoomSendLocal(`[remote autocomplete hint]\n` + result[1].join('\n'), 10_000, currentTarget);
					}
				}, () => { /* NOOP */ });
			} else {
				return next(args);
			}
		});

		hookFunction("ChatRoomMessage", 9, (args, next) => {
			const data = args[0];

			const sender = typeof data.Sender === "number" && getChatroomCharacter(data.Sender);
			if (data?.Type === "Whisper" &&
				typeof data.Content === "string" &&
				data.Content.startsWith("!") &&
				!data.Content.startsWith("!!") &&
				sender &&
				sender.hasAccessToPlayer()
			) {
				if (data.Sender === Player.MemberNumber || firstTimeInit)
					return next(args);
				console.debug(`BCX: Console command from ${sender}: ${data.Content}`);
				RunWhisperCommand(data.Content.substr(1), sender, (msg) => {
					ServerSend("ChatRoomChat", {
						Content: `[BCX]\n${msg}`,
						Type: "Whisper",
						Target: sender.MemberNumber
					});
				});
				return;
			}

			return next(args);
		});

		queryHandlers.commandHint = (sender, resolve, data) => {
			if (typeof data !== "string" || !data.startsWith("!") || data.startsWith("!!")) {
				return resolve(false);
			}

			const result = WhisperCommandAutocomplete(data.substr(1), sender);
			result[0] = '!' + result[0];
			resolve(true, result);
		};

		registerCommand("help", "- display this help [alias: . ]", () => {
			CommandsCompleteFirstTimeHelp();
			ChatRoomSendLocal(
				`Available commands:\n` +
				Array.from(commands.entries())
					.filter(c => c[1].description !== null)
					.map(c => `.${c[0]}` + (c[1].description ? ` ${c[1].description}` : ""))
					.sort()
					.join("\n")
			);
			return true;
		});
		aliasCommand("help", "");

		registerCommand("action", "- send custom (action) [alias: .a ]", (msg) => {
			ChatRoomActionMessage(msg);
			return true;
		});
		aliasCommand("action", "a");

		registerWhisperCommand("help", "- display this help", (argv, sender, respond) => {
			respond(
				`Available commands:\n` +
				Array.from(whisperCommands.entries())
					.filter(c => c[1].description !== null)
					.map(c => `!${c[0]}` + (c[1].description ? ` ${c[1].description}` : ""))
					.sort()
					.join("\n")
			);
			return true;
		}, null, false);
	}

	unload() {
		commands.clear();
	}
}
