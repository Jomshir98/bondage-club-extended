import { Command_pickAutocomplete, Command_selectCharacter, Command_selectCharacterAutocomplete, Command_selectWornItem, Command_selectWornItemAutocomplete, registerCommandParsed } from "./commands";
import { BaseModule } from "./_BaseModule";
import { ChatRoomSendLocal, updateChatroom } from "../utilsClub";
import { registerCommand } from "./commands";
import { callOriginal, hookFunction } from "../patching";
import { RulesGetRuleState } from "./rules";
import backgroundList from "../generated/backgroundList.json";
import { OverridePlayerDialog } from "./miscPatches";
import remove from "lodash-es/remove";
import { arrayUnique } from "../utils";
import { modStorage } from "./storage";

const BACKGROUNDS_BCX_NAME = "[BCX] Hidden";

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
				Hide: AssetGroup.map(A => A.Name).filter(A => A !== "ItemEars")
			}
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

export class ModuleClubUtils extends BaseModule {
	load() {
		//#region room
		registerCommandParsed(
			"utilities",
			"room",
			"- Change or administrate the current chat room. Use '.room' for more help",
			(args) => {
				const subcommand = (args[0] || "").toLowerCase();

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
				} else if (subcommand === "promote" || subcommand === "demote" || subcommand === "kick" || subcommand === "ban" || subcommand === "permaban") {
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
					const size = Number.parseInt(template.Limit, 10);
					updateChatroom({
						Name: template.Name,
						Description: template.Description,
						Background: template.Background,
						Private: template.Private,
						Locked: template.Locked,
						Game: template.Game,
						Admin: template.Admin,
						Limit: size,
						BlockCategory: template.BlockCategory
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
						`.room template <1/2/3/4> - Changes the room according to the given BCX room template slot`
					);
				}

				return true;
			},
			(argv) => {
				const subcommand = argv[0].toLowerCase();
				if (argv.length <= 1) {
					return Command_pickAutocomplete(subcommand, ["locked", "private", "size", "background", "promote", "demote", "kick", "ban", "permaban", "template"]);
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
		//#endregion
		//#region Hidden room backgrounds
		registerCommand("utilities", "background", "<name> - Changes chat room background", processBackgroundCommand, processBackgroundCommand_autocomplete);
		// Add new backgrounds to the list

		if (!BackgroundsTagList.includes(BACKGROUNDS_BCX_NAME)) {
			BackgroundsTagList.push(BACKGROUNDS_BCX_NAME);
		}

		for (const background of backgroundList) {
			if (BackgroundsList.some(i => i.Name === background))
				continue;
			BackgroundsList.push({ Name: background, Tag: [BACKGROUNDS_BCX_NAME] });
			OverridePlayerDialog(background, `[Hidden] ${background}`);
		}

		hookFunction("BackgroundSelectionRun", 0, (args, next) => {
			if (BackgroundSelectionOffset >= BackgroundSelectionView.length) BackgroundSelectionOffset = 0;
			next(args);
		});

		//#endregion
		registerCommandParsed("utilities", "colour", "<source> <item> <target> - Copies color of certain item from source character to target character",
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
		registerCommandParsed("cheats", "allowactivities", "<character> <item> - Modifies item to not block activities",
			(argv) => {
				if (argv.length !== 2) {
					ChatRoomSendLocal(`Expected two arguments: <character> <item>`);
					return false;
				}
				const char = Command_selectCharacter(argv[0]);
				if (typeof char === "string") {
					ChatRoomSendLocal(char);
					return false;
				}
				const item = Command_selectWornItem(char, argv[1]);
				if (typeof item === "string") {
					ChatRoomSendLocal(item);
					return false;
				}
				if (!item.Property) {
					item.Property = {};
				}
				item.Property.AllowActivityOn = AssetGroup.map(A => A.Name);
				CharacterRefresh(char.Character);
				ChatRoomCharacterUpdate(char.Character);
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
				}
				return [];
			}
		);
		registerCommand("utilities", "garble", "<level> <message> - Converts the given message to gag talk",
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
				const garbled = callOriginal("SpeechGarbleByGagLevel", [level, message]) as string;
				chat.value = garbled;
				return false;
			}
		);
	}

	run() {
		// Refresh current background list, if already built
		if (ChatCreateBackgroundList != null) {
			ChatCreateBackgroundList = BackgroundsGenerateList(BackgroundSelectionTagList);
		}
	}

	unload() {
		remove(BackgroundsTagList, i => i === BACKGROUNDS_BCX_NAME);
		remove(BackgroundsList, i => i.Tag.includes(BACKGROUNDS_BCX_NAME));
		// Refresh current background list, if already built
		if (ChatCreateBackgroundList != null) {
			ChatCreateBackgroundList = BackgroundsGenerateList(BackgroundSelectionTagList);
		}
	}
}
