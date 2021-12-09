import { Command_pickAutocomplete, Command_selectCharacter, Command_selectCharacterAutocomplete, Command_selectWornItem, Command_selectWornItemAutocomplete, registerCommandParsed } from "./commands";
import { BaseModule } from "./_BaseModule";
import { ChatRoomSendLocal, updateChatroom } from "../utilsClub";
import { registerCommand } from "./commands";
import { hookFunction } from "../patching";
import { RulesGetRuleState } from "./rules";
import backgroundList from "../generated/backgroundList.json";
import { OverridePlayerDialog } from "./miscPatches";
import remove from "lodash-es/remove";

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
		//#region Antiblind
		registerCommand("antiblind", "- Toggles ability to always see despite items", () => {
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
		registerCommand("background", "<name> - Changes chat room background", (arg) => {
			if (arg.trim() === "") {
				ChatRoomSendLocal(`Try pressing the "tab"-key to show autocomplete options`);
				return false;
			}
			const Background = backgroundList.find(i => i.toLocaleLowerCase() === arg.toLocaleLowerCase());
			if (!Background) {
				ChatRoomSendLocal(`Invalid/unknown background`);
				return false;
			}
			if (!updateChatroom({ Background })) {
				ChatRoomSendLocal(`Failed to update room. Are you admin?`);
			}
			return true;
		}, (arg) => Command_pickAutocomplete(arg, backgroundList));
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
		registerCommandParsed("colour", "<source> <item> <target> - Copies color of certain item from source character to target character",
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
		registerCommandParsed("allowactivities", "<character> <item> - Modifies item to not block activities",
			(argv) => {
				if (argv.length !== 2) {
					ChatRoomSendLocal(`Expected two arguments: <charcater> <item>`);
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
