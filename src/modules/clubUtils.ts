import { Command_pickAutocomplete, Command_selectCharacter, Command_selectCharacterAutocomplete, Command_selectWornItem, Command_selectWornItemAutocomplete, registerCommandParsed } from "./commands";
import { BaseModule } from "./_BaseModule";
import { ChatRoomActionMessage, ChatRoomSendLocal, getCharacterName, updateChatroom } from "../utilsClub";
import { registerCommand } from "./commands";
import { callOriginal, hookFunction } from "../patching";
import { RulesGetRuleState } from "./rules";
import backgroundList from "../generated/backgroundList.json";
import remove from "lodash-es/remove";
import { arrayUnique, shuffleArray } from "../utils";
import { modStorage } from "./storage";
import { BCX_setTimeout } from "../BCXContext";
import { getAllCharactersInRoom } from "../characters";
import { AccessLevel, registerPermission } from "./authority";
import { ModuleCategory, Preset } from "../constants";

const BACKGROUNDS_BCX_NAME: BCX_BackgroundTag = "[BCX] Hidden";

export function InvisibilityEarbuds() {
	if (InventoryGet(Player, "ItemEars")?.Asset.Name === "BluetoothEarbuds") {
		InventoryRemove(Player, "ItemEars");
	} else {
		const asset = Asset.find(A => A.Name === "BluetoothEarbuds");
		if (!asset) return;
		Player.Appearance = Player.Appearance.filter(A => A.Asset.Group.Name !== "ItemEars");
		Player.Appearance.push({
			Asset: asset,
			Color: "Default",
			Difficulty: -100,
			Property: {
				Type: "Light",
				Effect: [],
				Hide: AssetGroup.map(A => A.Name).filter(A => A !== "ItemEars"),
			},
		});
		CharacterRefresh(Player);
	}
	ChatRoomCharacterUpdate(Player);
}

//#region Hidden room backgrounds
function processBackgroundCommand(input: string): boolean {
	if (input.trim() === "") {
		ChatRoomSendLocal(`Try pressing the "tab"-key to show autocomplete options`);
		return false;
	}
	const Background = backgroundList.find(i => i.toLocaleLowerCase() === input.toLocaleLowerCase());
	if (!Background) {
		ChatRoomSendLocal(`Invalid/unknown background`);
		return false;
	}
	if (!updateChatroom({ Background })) {
		ChatRoomSendLocal(`Failed to update room. Are you admin?`);
	}
	return true;
}
function processBackgroundCommand_autocomplete(input: string): string[] {
	return Command_pickAutocomplete(input, backgroundList);
}
//#endregion

//#region Antiblind
let antiblind: boolean = false;

function toggleAntiblind(): boolean {
	if (!antiblind) {
		const blockRule = RulesGetRuleState("block_antiblind");
		if (blockRule.isEnforced) {
			blockRule.triggerAttempt();
			return false;
		} else if (blockRule.inEffect) {
			blockRule.trigger();
		}
	}
	antiblind = !antiblind;
	return true;
}
//#endregion

//#region card deck
let cardDeck: string[] = [];
let dealersLog: string[] = [];

function shuffleDeck() {
	cardDeck = [];
	dealersLog = [];
	const cardSuits = ["♥", "♦", "♠", "♣"];
	const cardRanks = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];

	cardSuits.forEach(suit => {
		cardRanks.forEach(rank => {
			cardDeck.push(rank + suit);
		});
	});
	shuffleArray(cardDeck);
	ChatRoomActionMessage(`The dealer took the remaining ${cardDeck.length} cards from the deck and shuffled all cards for a new deck.`);
}

function drawCard(target: number | null) {
	if (cardDeck.length === 0) shuffleDeck();
	const card = cardDeck.pop();
	if (target) {
		ChatRoomActionMessage(`The dealer dealt you this card face down: ${card}`, target);
	} else {
		ChatRoomActionMessage(`The dealer openly drew this card face up: ${card}`, target);
	}
	dealersLog.push(`${card} ${target === null ? "was drawn face up" : `was dealt to ${getCharacterName(target, "[unknown name]")} (${target})`}`);
}

function drawCards(numberOfCards: number, membernumbers?: number[]) {
	for (const target of membernumbers ?? [null]) {
		for (let i = 0; i < numberOfCards; i++) {
			drawCard(target);
		}
	}
}

function showDealersLog() {
	// to circumevent BC's rate limit of 50 messages per second
	const middleIndex = Math.ceil(dealersLog.length / 2);
	const firstHalf = dealersLog.slice().splice(0, middleIndex);
	const secondHalf = dealersLog.slice().splice(-middleIndex);
	firstHalf.forEach(entry => ChatRoomActionMessage(entry));
	secondHalf.forEach(entry => {
		BCX_setTimeout(() => {
			ChatRoomActionMessage(entry);
		}, 1100);
	});
}
//#endregion

function rollDice(sides: number, rolls: number) {
	const result: number[] = [];
	for (let i = 0; i < rolls; i++) {
		result.push(Math.floor(Math.random() * sides) + 1);
	}
	ChatRoomSendLocal(`You secretly roll a ${rolls}D${sides}. The result is: ${result.length === 1 ? result : result.join(",") + " = " + result.reduce((a, b) => a + b, 0).toString()}.`);
}

export function GetBackgroundTagListArray(): BCX_BackgroundTag[] {
	return BackgroundsTagList;
}

const activitiesAllowed = new Set<number>();

export class ModuleClubUtils extends BaseModule {
	init() {
		registerPermission("misc_cheat_allowactivities", {
			name: "Allow using the allowactivities command on this player",
			category: ModuleCategory.Misc,
			defaults: {
				[Preset.dominant]: [true, AccessLevel.whitelist],
				[Preset.switch]: [true, AccessLevel.friend],
				[Preset.submissive]: [true, AccessLevel.friend],
				[Preset.slave]: [true, AccessLevel.friend],
			},
		});
	}

	load() {
		registerCommandParsed("utility", "dice", "[dice sides | <rolls>d<dice sides>] - Shows only you the result of rolling a dice the given number of times",
			(args) => {
				let sides: number = 6;
				let rolls: number = 1;
				// no argument
				if (args.length < 1) {
					rollDice(6, 1);
					// at least one argument
				} else {
					// check first argument
					if (/^[0-9]+$/.test(args[0])) {
						sides = Number.parseInt(args[0], 10);
						if ((sides < 2) || (sides > 100)) {
							ChatRoomSendLocal(`The <dice sides> need to be between 2 and 100`);
							return false;
						}
						rollDice(sides, 1);
					} else if (/^[0-9]+d[0-9]+$/i.test(args[0])) {
						const split = args[0].split("d");
						sides = Number.parseInt(split[1], 10);
						rolls = Number.parseInt(split[0], 10);
						if ((sides < 2) || (sides > 100)) {
							ChatRoomSendLocal(`The <dice sides> in <rolls>d<dice sides> need to be between 2 and 100`);
							return false;
						}
						if ((rolls < 1) || (rolls > 100)) {
							ChatRoomSendLocal(`The <rolls> in <rolls>d<dice sides> need to be between 1 and 100`);
							return false;
						}
						rollDice(sides, rolls);
					} else {
						ChatRoomSendLocal(`Usage: .dice [dice sides | <rolls>d<dice sides>] - for instance '.dice 4d6' - all parameters are optional`);
						return false;
					}
				}
				return true;
			}
		);
		//#region card deck
		registerCommandParsed(
			"utility",
			"deck",
			"- Draw, deal or shuffle with a 52-card deck. Use '.deck' for more help",
			(args) => {
				const subcommand = (args[0] || "").toLowerCase();

				if (subcommand === "shuffle") {
					shuffleDeck();
				} else if (subcommand === "showlog") {
					showDealersLog();
				} else if (subcommand === "draw" || subcommand === "deal") {
					let count = 1;
					if (args.length >= 2) {
						if (/^[0-9]+$/.test(args[1])) {
							count = Number.parseInt(args[1], 10);
						} else {
							if (subcommand === "draw") {
								ChatRoomSendLocal(`Usage: .deck draw <number of cards>`);
							} else {
								ChatRoomSendLocal(`Usage: .deck deal <number of cards> <...targets>`);
							}
							return false;
						}

						if (count > 26 || count < 1) {
							ChatRoomSendLocal(`You can ${subcommand} at most 26 cards (half the deck) in one go`);
							return false;
						}
					}

					if (args.length > 2 && subcommand === "draw") {
						ChatRoomSendLocal(`Cards are "drawn" openly. Did you mean to deal instead?`);
						return false;
					}
					if (args.length <= 2 && subcommand === "deal") {
						ChatRoomSendLocal(`Cards are "dealt" to someone. Did you mean to draw instead?`);
						return false;
					}

					let targets: number[] | undefined;

					if (args.length > 2) {
						targets = [];
						for (const target of args.slice(2)) {
							const character = Command_selectCharacter(target);
							if (typeof character === "string") {
								ChatRoomSendLocal(character);
								return false;
							}
							targets.push(character.MemberNumber);
						}
					}

					drawCards(count, targets);
				} else {
					ChatRoomSendLocal(
						`Usage:\n` +
						`.deck shuffle - Shuffles all remaining and drawn cards into a new deck\n` +
						`.deck draw <number of cards> - Draws the < number of cards > from the card deck and reveals them to all players\n` +
						`.deck deal <number of cards> <...targets> - Deals the < number of cards > to each of the specified player names or member numbers in a hidden way\n` +
						`.deck showlog - Lists who got each card drawn from the current deck openly in the chat (if proof is needed)\n` +
						`The deck is a standard 52-card deck. If the deck is empty, it shuffles automatically.`
					);
				}

				return true;
			},
			(argv) => {
				const subcommand = argv[0].toLowerCase();
				if (argv.length <= 1) {
					return Command_pickAutocomplete(subcommand, ["shuffle", "draw", "deal", "showlog"]);
				}
				if (subcommand === "deal" && argv.length >= 3) {
					return Command_selectCharacterAutocomplete(argv[argv.length - 1]);
				}
				return [];
			}
		);
		//#endregion
		//#region room
		registerCommandParsed(
			"utility",
			"room",
			"- Change or administrate the current chat room. Use '.room' for more help",
			(args) => {
				const subcommand = (args[0] || "").toLowerCase();
				// Shouldn't be usable outside of room anyway
				if (!ChatRoomData)
					return false;

				if (!ChatRoomPlayerIsAdmin()) {
					ChatRoomSendLocal("You need to be admin in this room to use a .room command");
					return false;
				} else if (subcommand === "locked" || subcommand === "private") {
					if (args.length === 1 || (args[1] !== "yes" && args[1] !== "no")) {
						ChatRoomSendLocal(`Add 'yes' or 'no' behind '.room locked' or '.room private'`);
						return false;
					}
					if (subcommand === "locked") {
						const Locked = args[1] === "yes" ? true : false;
						updateChatroom({ Locked });
					} else {
						const Private = args[1] === "yes" ? true : false;
						updateChatroom({ Private });
					}
				} else if (subcommand === "size" || subcommand === "limit" || subcommand === "slots") {
					const size = args.length === 2 && /^[0-9]+$/.test(args[1]) && Number.parseInt(args[1], 10);
					if (!size || size < 2 || size > 10) {
						ChatRoomSendLocal(`Needs a number between 2 and 10 as <number> in '.room size <number>'`);
						return false;
					}
					const Limit = size;
					updateChatroom({ Limit });
				} else if (subcommand === "background") {
					if (args.length !== 2) {
						ChatRoomSendLocal(`Needs the name of a background (for example: 'MainHall') behind '.room ${subcommand}'`);
						return false;
					}
					return processBackgroundCommand(args[1]);
				} else if (subcommand === "promoteall") {
					for (const character of getAllCharactersInRoom()) {
						if (!character.isPlayer() && !ChatRoomData?.Admin?.includes(character.MemberNumber)) {
							ServerSend("ChatRoomAdmin", { MemberNumber: character.MemberNumber, Action: "Promote" });
						}
					}
				} else if (subcommand === "promote" || subcommand === "demote" || subcommand === "whitelist" || subcommand === "unwhitelist" || subcommand === "kick" || subcommand === "ban" || subcommand === "permaban") {
					if (args.length === 1) {
						ChatRoomSendLocal(`Needs at least one character name oder member number as <target> in '.room ${subcommand} <target1> <target2> <targetN>'`);
						return false;
					}
					const targets: number[] = [];

					for (const target of args.slice(1)) {
						const character = Command_selectCharacter(target);
						if (typeof character === "string") {
							ChatRoomSendLocal(character);
							return false;
						}
						targets.push(character.MemberNumber);
					}
					if (subcommand === "promote") {
						const Admin = arrayUnique(ChatRoomData.Admin.concat(targets));
						updateChatroom({ Admin });
					} else if (subcommand === "demote") {
						const targetsToDemote = new Set(targets);
						const Admin = ChatRoomData.Admin.filter((target) => {
							return !targetsToDemote.has(target);
						});
						updateChatroom({ Admin });
					} else if (subcommand === "whitelist") {
						const Whitelist = arrayUnique(ChatRoomData.Whitelist.concat(targets));
						updateChatroom({ Whitelist });
					} else if (subcommand === "unwhitelist") {
						const targetsToUnwhitelist = new Set(targets);
						const Whitelist = ChatRoomData.Whitelist.filter((target) => {
							return !targetsToUnwhitelist.has(target);
						});
						updateChatroom({ Whitelist });
					} else if (subcommand === "kick") {
						for (const target of targets) {
							ServerSend("ChatRoomAdmin", { MemberNumber: target, Action: "Kick", Publish: false });
						}
					} else if (subcommand === "ban") {
						for (const target of targets) {
							ServerSend("ChatRoomAdmin", { MemberNumber: target, Action: "Ban", Publish: false });
						}
					} else if (subcommand === "permaban") {
						for (const target of targets) {
							ServerSend("ChatRoomAdmin", { MemberNumber: target, Action: "Ban", Publish: false });
							ChatRoomListUpdate(Player.BlackList, true, target);
						}
					}
				} else if (subcommand === "template") {
					const slot = args.length === 2 && /^[0-9]+$/.test(args[1]) && Number.parseInt(args[1], 10);
					if (!slot || slot < 1 || slot > 4) {
						ChatRoomSendLocal(`Needs a template slot number between 1 and 4 behind '.room template'`);
						return false;
					}
					const template = modStorage && modStorage.roomTemplates && modStorage.roomTemplates[slot - 1];
					if (!template) {
						ChatRoomSendLocal(`Unable to find a valid room template in slot ${slot}. You likely need to set one in the chat room creation screen.`);
						return false;
					}
					const size = typeof template.Limit === "number" ? template.Limit : Number.parseInt(template.Limit as unknown as string, 10);
					updateChatroom({
						Name: template.Name,
						Description: template.Description,
						Background: template.Background,
						Private: template.Private,
						Locked: template.Locked,
						Game: template.Game,
						Admin: template.Admin,
						Whitelist: template.Whitelist,
						Limit: size,
						BlockCategory: template.BlockCategory,
						Custom: template.Custom,
					});
				} else {
					ChatRoomSendLocal(
						`Usage:\n` +
						`.room locked <yes/no> - Locks or unlocks the room\n` +
						`.room private <yes/no> - Sets the room to be private or public\n` +
						`.room size <number> - Sets the number of open character slots in the room\n` +
						`.room background <name> - Changes room background (same as .background)\n` +
						`.room kick <...targets> - Kicks all space-seperated player names or member numbers\n` +
						`.room ban <...targets> - Bans all space-seperated player names or member numbers\n` +
						`.room permaban <...targets> - Bans and blacklists all specified player names or numbers\n` +
						`.room <promote/demote> <...targets> - Adds or removes admin on all specified player names or numbers\n` +
						`.room promoteall - Gives admin to all non-admin players in the room\n` +
						`.room <whitelist/unwhitelist> <...targets> - Whitelists or unwhitelists all specified player names or numbers in the room\n` +
						`.room template <1/2/3/4> - Changes the room according to the given BCX room template slot`
					);
				}

				return true;
			},
			(argv) => {
				const subcommand = argv[0].toLowerCase();
				if (argv.length <= 1) {
					return Command_pickAutocomplete(subcommand, ["locked", "private", "size", "background", "promoteall", "promote", "demote", "kick", "ban", "permaban", "template"]);
				}
				if ((subcommand === "locked" || subcommand === "private") && argv.length >= 2) {
					return Command_pickAutocomplete(argv[1], ["yes", "no"]);
				}
				if (
					(subcommand === "promote" || subcommand === "demote" || subcommand === "kick" || subcommand === "ban" || subcommand === "permaban") &&
					argv.length >= 2
				) {
					return Command_selectCharacterAutocomplete(argv[argv.length - 1]);
				}
				if (subcommand === "background" && argv.length === 2) {
					return processBackgroundCommand_autocomplete(argv[1]);
				}
				return [];
			}
		);
		//#endregion
		//#region Antiblind
		registerCommand("cheats", "antiblind", "- Toggles ability to always see despite items", () => {
			if (toggleAntiblind()) {
				ChatRoomSendLocal(`Antiblind switched ${antiblind ? "on" : "off"}`);
				return true;
			}
			return false;
		});
		hookFunction("Player.GetBlindLevel", 9, (args, next) => {
			if (antiblind) return 0;
			return next(args);
		});
		hookFunction("Player.GetBlurLevel", 9, (args, next) => {
			if (antiblind) return 0;
			return next(args);
		});
		hookFunction("Player.HasTints", 9, (args, next) => {
			if (antiblind) return false;
			return next(args);
		});
		//#endregion
		//#region Hidden room backgrounds
		registerCommand("utility", "background", "<name> - Changes chat room background", processBackgroundCommand, processBackgroundCommand_autocomplete);

		// Add missing tags to tag list
		const availableTags = new Set<BCX_BackgroundTag>();
		for (const background of BackgroundsList) {
			background.Tag.forEach(t => availableTags.add(t));
		}
		for (const tag of availableTags) {
			if (!GetBackgroundTagListArray().includes(tag)) {
				GetBackgroundTagListArray().push(tag);
			}
		}

		// Add new backgrounds to the list
		if (!GetBackgroundTagListArray().includes(BACKGROUNDS_BCX_NAME)) {
			GetBackgroundTagListArray().push(BACKGROUNDS_BCX_NAME);
		}

		for (const background of backgroundList) {
			if (BackgroundsList.some(i => i.Name === background))
				continue;
			BackgroundsList.push({ Name: background, Tag: [BACKGROUNDS_BCX_NAME as BackgroundTag] });
		}

		hookFunction("BackgroundsTextGet", 0, (args, next) => {
			const name = next(args);
			if (name.startsWith("MISSING")) {
				const background = backgroundList.find(bg => bg === args[0]);
				return `[Hidden] ${background ?? args[0]}`;
			}
			return name;
		});

		hookFunction("BackgroundSelectionRun", 0, (args, next) => {
			if (BackgroundSelectionOffset >= BackgroundSelectionView.length) BackgroundSelectionOffset = 0;
			next(args);
		});

		//#endregion
		registerCommandParsed("utility", "colour", "<source> <item> <target> - Copies color of certain item from source character to target character",
			(argv) => {
				if (argv.length !== 3) {
					ChatRoomSendLocal(`Expected three arguments: <source> <item> <target>`);
					return false;
				}
				const source = Command_selectCharacter(argv[0]);
				if (typeof source === "string") {
					ChatRoomSendLocal(source);
					return false;
				}
				const target = Command_selectCharacter(argv[2]);
				if (typeof target === "string") {
					ChatRoomSendLocal(target);
					return false;
				}
				const item = Command_selectWornItem(source, argv[1]);
				if (typeof item === "string") {
					ChatRoomSendLocal(item);
					return false;
				}
				const targetItem = target.Character.Appearance.find(A => A.Asset === item.Asset);
				if (!targetItem) {
					ChatRoomSendLocal(`Target must be wearing the same item`);
					return false;
				}
				targetItem.Color = Array.isArray(item.Color) ? item.Color.slice() : item.Color;
				CharacterRefresh(target.Character);
				ChatRoomCharacterUpdate(target.Character);
				return true;
			},
			(argv) => {
				if (argv.length === 1) {
					return Command_selectCharacterAutocomplete(argv[0]);
				} else if (argv.length === 2) {
					const source = Command_selectCharacter(argv[0]);
					if (typeof source !== "string") {
						return Command_selectWornItemAutocomplete(source, argv[1]);
					}
				} else if (argv.length === 3) {
					return Command_selectCharacterAutocomplete(argv[2]);
				}
				return [];
			}
		);
		registerCommandParsed("cheats", "allowactivities", "<character> - Allows you to use all activities on target",
			(argv) => {
				if (argv.length !== 1) {
					ChatRoomSendLocal(`Expected one argument: <character>`);
					return false;
				}
				const char = Command_selectCharacter(argv[0]);
				if (typeof char === "string") {
					ChatRoomSendLocal(char);
					return false;
				}
				if (activitiesAllowed.has(char.MemberNumber)) {
					activitiesAllowed.delete(char.MemberNumber);
					ChatRoomSendLocal(`You can no longer use all activities on ${char.toNicknamedString()}`);
				} else if (!char.BCXVersion) {
					ChatRoomSendLocal(`This cheat can only be used on characters that are using BCX too.`);
				} else {
					char.getPermissionAccess("misc_cheat_allowactivities")
						.then((res) => {
							if (res) {
								activitiesAllowed.add(char.MemberNumber);
								ChatRoomSendLocal(`You can now use any activities on ${char.toNicknamedString()}, independent of items or clothes she is wearing`);
							} else {
								ChatRoomSendLocal(`You are missing the permission 'Allow using the allowactivities command on this player' for ${char.toNicknamedString()}.`);
							}
						}, (error) => {
							console.warn("Error getting permission for allowactivities", error);
							ChatRoomSendLocal(`Error getting permission to use all activities on ${char.toNicknamedString()}:\n${error}`);
						});
				}
				return true;
			},
			(argv) => {
				if (argv.length === 1) {
					return Command_selectCharacterAutocomplete(argv[0]);
				}
				return [];
			}
		);
		hookFunction("ActivityCheckPrerequisite", 6, (args, next) => {
			const prereq = args[0] as string;
			const acted = args[2] as Character;
			if (!prereq.startsWith("Has") && !prereq.startsWith("TargetHas") && acted.MemberNumber != null && activitiesAllowed.has(acted.MemberNumber))
				return true;
			return next(args);
		}, null);

		registerCommand("utility", "garble", "<level> <message> - Converts the given message to gag talk",
			(arg) => {
				const chat = document.getElementById("InputChat") as HTMLTextAreaElement | null;
				if (!chat)
					return false;
				const parsed = /^\s*([0-9]+) (.+)$/.exec(arg);
				if (!parsed) {
					ChatRoomSendLocal(`Expected two arguments: <level> <message>`);
					return false;
				}
				const level = Number.parseInt(parsed[1], 10);
				const message = parsed[2].trim();
				const garbled = callOriginal("SpeechGarbleByGagLevel", [level, message]);
				chat.value = garbled;
				return false;
			}
		);
	}

	run() {
		// Refresh current background list, if already built
		if (ChatAdminBackgroundList != null) {
			ChatAdminBackgroundList = BackgroundsGenerateList(BackgroundSelectionTagList);
		}
	}

	unload() {
		remove(GetBackgroundTagListArray(), i => i === BACKGROUNDS_BCX_NAME);
		remove(BackgroundsList, i => (i.Tag as BCX_BackgroundTag[]).includes(BACKGROUNDS_BCX_NAME));
		// Refresh current background list, if already built
		if (ChatAdminBackgroundList != null) {
			ChatAdminBackgroundList = BackgroundsGenerateList(BackgroundSelectionTagList);
		}
	}
}
