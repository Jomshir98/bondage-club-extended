import { ChatRoomSendLocal } from "../utilsClub";
import { CommandAutocompleterParsed, Command_pickAutocomplete, Command_selectCharacter, Command_selectCharacterAutocomplete, registerCommandParsed } from "./commands";
import { BaseModule } from "./_BaseModule";
import isEqual from "lodash-es/isEqual";

function customIsEnabled(feature: string): boolean {
	return !!(((Player.OnlineSettings as any)?.BCX_Custom as undefined | string[])?.includes(feature));
}

export class ModuleCustom extends BaseModule {
	load() {
		const customSubcommands: Record<string, [(argv: string[]) => void, CommandAutocompleterParsed | null]> = {};

		if (customIsEnabled("c")) {
			customSubcommands.ctoggle = [() => {
				const c = InventoryGet(Player, "ItemVulva");
				const a = AssetGet(Player.AssetFamily, "ItemVulva", "DoubleEndDildo");
				if (!c && a) {
					CharacterAppearanceSetItem(Player, "ItemVulva", a, "#A7806F");
					ChatRoomCharacterUpdate(Player);
				} else if (c && c.Asset === a) {
					InventoryRemove(Player, "ItemVulva");
					ChatRoomCharacterUpdate(Player);
				}
			}, null];
			customSubcommands.ccage = [(argv) => {
				const C = Command_selectCharacter(argv[1] ?? "");
				if (typeof C === "string") {
					ChatRoomSendLocal(C, 10_000);
					return;
				}
				const c = InventoryGet(C.Character, "ItemVulva");
				const a = AssetGet(C.Character.AssetFamily, "ItemVulva", "DoubleEndDildo");
				const f = AssetGet(C.Character.AssetFamily, "ItemVulva", "FuturisticVibrator");
				if (c && c.Asset === a && c.Color === "#A7806F" && f) {
					InventoryRemove(C.Character, "ItemVulva");
					C.Character.Appearance.push({
						Asset: f,
						Difficulty: 20,
						Color: ["#A7806F", "Default", "Default"],
						Property: { Mode: "Off", Intensity: -1, Effect: ["Egged"], TriggerValues: "ø,".repeat(7) + "ø", AccessMode: "LockMember" },
					});
					CharacterRefresh(C.Character, false);
					ChatRoomCharacterUpdate(C.Character);
				} else if (c && c.Asset === f && isEqual(c.Color, ["#A7806F", "Default", "Default"]) && a) {
					CharacterAppearanceSetItem(C.Character, "ItemVulva", a, "#A7806F");
					ChatRoomCharacterUpdate(C.Character);
				}
			}, (argv) => (argv.length === 2 ? Command_selectCharacterAutocomplete(argv[1]) : [])];
		}

		if (Object.keys(customSubcommands).length > 0) {
			registerCommandParsed("hidden", "custom", "", (argv) => {
				const cmd = customSubcommands[argv[0] ?? ""];
				if (cmd) {
					cmd[0](argv);
					return true;
				}
				return false;
			}, (argv) => {
				if (argv.length === 1) {
					return Command_pickAutocomplete(argv[0], Object.keys(customSubcommands));
				}
				return customSubcommands[argv[0] ?? ""]?.[1]?.(argv) ?? [];
			});
		}
	}
}
