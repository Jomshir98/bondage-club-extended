import { Command_selectCharacter, Command_selectCharacterAutocomplete, Command_selectWornItem, Command_selectWornItemAutocomplete, registerCommandParsed } from "./commands";
import { BaseModule } from "../moduleManager";
import { ChatRoomSendLocal } from "../utilsClub";

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

export class ModuleClubUtils extends BaseModule {
	load() {
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
}
