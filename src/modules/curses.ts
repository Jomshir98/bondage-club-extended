import { ChatroomCharacter, getChatroomCharacter, getPlayerCharacter } from "../characters";
import { BaseModule } from "./_BaseModule";
import { arrayUnique, capitalizeFirstLetter, dictionaryProcess, formatTimeInterval, isObject } from "../utils";
import { ChatRoomActionMessage, ChatRoomSendLocal, getCharacterName, getVisibleGroupName, isBind, itemColorsEquals } from "../utilsClub";
import { AccessLevel, checkPermissionAccess, registerPermission } from "./authority";
import { notifyOfChange, queryHandlers } from "./messaging";
import { modStorageSync } from "./storage";
import { LogEntryType, logMessage } from "./log";
import { moduleIsEnabled } from "./presets";
import { ModuleCategory, Preset, ConditionsLimit } from "../constants";
import { hookFunction, removeAllHooksByModule } from "../patching";
import { Command_fixExclamationMark, COMMAND_GENERIC_ERROR, Command_pickAutocomplete, Command_selectGroup, Command_selectGroupAutocomplete, registerWhisperCommand } from "./commands";
import { ConditionsAutocompleteSubcommand, ConditionsCheckAccess, ConditionsGetCategoryData, ConditionsGetCategoryPublicData, ConditionsGetCondition, ConditionsRegisterCategory, ConditionsRemoveCondition, ConditionsRunSubcommand, ConditionsSetCondition, ConditionsSubcommand, ConditionsSubcommands, ConditionsUpdate } from "./conditions";
import { cursedChange, CURSES_TRIGGER_TEXTS, CURSES_TRIGGER_TEXTS_BATCH } from "./cursesConstants";
import { BCX_setInterval } from "../BCXContext";

import cloneDeep from "lodash-es/cloneDeep";
import isEqual from "lodash-es/isEqual";

const CURSES_ANTILOOP_RESET_INTERVAL = 60_000;
const CURSES_ANTILOOP_THRESHOLD = 10;
const CURSES_ANTILOOP_SUSPEND_TIME = 600_000;

const CURSE_IGNORED_PROPERTIES = ValidationModifiableProperties.slice();
const CURSE_IGNORED_EFFECTS = ["Lock"];

export function curseMakeSavedProperty(properties: ItemProperties | undefined): ItemProperties {
	const result: ItemProperties = {};

	if (isObject(properties)) {
		for (const key of Object.keys(properties)) {
			if (key === "Effect") {
				if (Array.isArray(properties.Effect) && properties.Effect.every(i => typeof i === "string")) {
					const effect = properties.Effect.filter(i => !CURSE_IGNORED_EFFECTS.includes(i));
					if (effect.length > 0) {
						result.Effect = effect;
					}
				} else {
					console.error(`BCX: Bad effect of properties: `, properties.Effect);
				}
			} else if (!CURSE_IGNORED_PROPERTIES.includes(key) && properties[key] !== undefined) {
				result[key] = cloneDeep(properties[key]);
			}
		}
	}

	return result;
}

function curseCreateCurseItemInfo(item: Item): CursedItemInfo {
	const result: CursedItemInfo = {
		Name: item.Asset.Name,
		curseProperty: false,
		Difficulty: item.Difficulty || undefined,
		Color: (item.Color && item.Color !== "Default") ? cloneDeep(item.Color) : undefined,
		Property: curseMakeSavedProperty(item.Property)
	};

	if (Object.keys(result.Property!).length === 0) {
		delete result.Property;
	}

	return result;
}

export function curseAllowItemCurseProperty(asset: Asset): boolean {
	return !!(
		asset.Extended ||
		asset.Effect?.includes("Egged") ||
		asset.AllowEffect?.includes("Egged") ||
		asset.Effect?.includes("UseRemote") ||
		asset.AllowEffect?.includes("UseRemote")
	);
}

export function curseDefaultItemCurseProperty(asset: Asset): boolean {
	return curseAllowItemCurseProperty(asset) && asset.Extended && asset.Archetype === "typed";
}

export function curseItem(Group: string, curseProperty: boolean | null, character: ChatroomCharacter | null): boolean {
	if (!moduleIsEnabled(ModuleCategory.Curses))
		return false;

	const group = AssetGroup.find(g => g.Name === Group);

	if (!group || (typeof curseProperty !== "boolean" && curseProperty !== null)) {
		console.error(`BCX: Attempt to curse with invalid data`, Group, curseProperty);
		return false;
	}

	if (group.Category === "Appearance" && !group.Clothing) {
		console.warn(`BCX: Attempt to curse body`, Group);
		return false;
	}

	if (character && !ConditionsCheckAccess("curses", Group, character)) {
		return false;
	}

	const currentItem = InventoryGet(Player, Group);

	if (currentItem) {

		if (curseProperty === null) {
			if (ConditionsGetCondition("curses", Group))
				return true;
			curseProperty = curseDefaultItemCurseProperty(currentItem.Asset);
		}

		if (!curseAllowItemCurseProperty(currentItem.Asset) && curseProperty) {
			console.warn(`BCX: Attempt to curse properties of item ${currentItem.Asset.Group.Name}:${currentItem.Asset.Name}, while not allowed`);
			curseProperty = false;
		}

		const newCurse = curseCreateCurseItemInfo(currentItem);
		if (curseProperty) {
			newCurse.curseProperty = true;
		}
		if (ConditionsGetCategoryData("curses").data?.itemRemove) {
			newCurse.itemRemove = true;
		}
		ConditionsSetCondition("curses", Group, newCurse, character);
		if (character) {
			logMessage("curse_change", LogEntryType.plaintext, `${character} cursed ${Player.Name}'s ${currentItem.Asset.Description}`);
			if (!character.isPlayer()) {
				ChatRoomSendLocal(`${character} cursed the ${currentItem.Asset.Description} on you`);
			}
		}
	} else {
		ConditionsSetCondition("curses", Group, null, character);
		if (character) {
			logMessage("curse_change", LogEntryType.plaintext, `${character} cursed ${Player.Name}'s body part to stay exposed (${getVisibleGroupName(group)})`);
			if (!character.isPlayer()) {
				ChatRoomSendLocal(`${character} put a curse on you, forcing part of your body to stay exposed (${getVisibleGroupName(group)})`);
			}
		}
	}

	modStorageSync();
	notifyOfChange();
	return true;
}

export function curseBatch(mode: "items" | "clothes", includingEmpty: boolean, character: ChatroomCharacter | null): boolean {
	if (character && !checkPermissionAccess("curses_normal", character) && !checkPermissionAccess("curses_limited", character))
		return false;

	let assetGroups: AssetGroup[];
	if (mode === "items") {
		assetGroups = AssetGroup.filter(i => i.Category === "Item" && (includingEmpty || InventoryGet(Player, i.Name)));
	} else if (mode === "clothes") {
		assetGroups = AssetGroup.filter(i => i.Category === "Appearance" && i.Clothing && (includingEmpty || InventoryGet(Player, i.Name)));
	} else {
		console.error(`BCX: Attempt to curse in invalid mode`, mode);
		return false;
	}

	if (character) {
		logMessage("curse_change", LogEntryType.plaintext, `${character} cursed all of ${Player.Name}'s ` +
			`${includingEmpty ? "" : "occupied "}${mode === "items" ? "item" : "clothing"} slots`);
		if (!character.isPlayer()) {
			ChatRoomSendLocal(`${character} cursed all of your ${includingEmpty ? "" : "occupied "}${mode === "items" ? "item" : "clothing"} slots`);
		}
	}

	for (const group of assetGroups) {
		if (ConditionsGetCondition("curses", group.Name))
			continue;
		if (character && !ConditionsCheckAccess("curses", group.Name, character))
			continue;
		if (!curseItem(group.Name, null, null))
			return false;
	}
	return true;
}

export function curseLift(Group: string, character: ChatroomCharacter | null): boolean {
	if (!moduleIsEnabled(ModuleCategory.Curses))
		return false;

	if (character && !ConditionsCheckAccess("curses", Group, character))
		return false;

	const curse = ConditionsGetCondition("curses", Group);
	if (curse) {
		const group = AssetGroup.find(g => g.Name === Group);
		if (character && group) {
			const itemName = curse.data && AssetGet(Player.AssetFamily, Group, curse.data.Name)?.Description;
			if (itemName) {
				logMessage("curse_change", LogEntryType.plaintext, `${character} lifted the curse on ${Player.Name}'s ${itemName}`);
				if (!character.isPlayer()) {
					ChatRoomSendLocal(`${character} lifted the curse on your ${itemName}`);
				}
			} else {
				logMessage("curse_change", LogEntryType.plaintext, `${character} lifted the curse on ${Player.Name}'s body part (${getVisibleGroupName(group)})`);
				if (!character.isPlayer()) {
					ChatRoomSendLocal(`${character} lifted the curse on part of your body (${getVisibleGroupName(group)})`);
				}
			}
		}
		ConditionsRemoveCondition("curses", Group);
		return true;
	}
	return false;
}

export function curseLiftAll(character: ChatroomCharacter | null): boolean {
	if (!moduleIsEnabled(ModuleCategory.Curses))
		return false;

	if (character && (!checkPermissionAccess("curses_normal", character) || !checkPermissionAccess("curses_limited", character)))
		return false;

	if (character) {
		logMessage("curse_change", LogEntryType.plaintext, `${character} lifted all curse on ${Player.Name}`);
		if (!character.isPlayer()) {
			ChatRoomSendLocal(`${character} lifted all curses on you`);
		}
	}
	ConditionsRemoveCondition("curses", Object.keys(ConditionsGetCategoryData("curses").conditions));
	return true;
}

export class ModuleCurses extends BaseModule {
	private resetTimer: number | null = null;
	private triggerCounts: Map<string, number> = new Map();
	private suspendedUntil: number | null = null;

	private pendingMessages: Record<cursedChange | "autoremove", string[]> = {
		remove: [],
		add: [],
		swap: [],
		update: [],
		color: [],
		autoremove: []
	};

	init() {
		registerPermission("curses_normal", {
			name: "Allows handling curses on non-limited object slots",
			category: ModuleCategory.Curses,
			defaults: {
				[Preset.dominant]: [true, AccessLevel.lover],
				[Preset.switch]: [true, AccessLevel.lover],
				[Preset.submissive]: [false, AccessLevel.mistress],
				[Preset.slave]: [false, AccessLevel.mistress]
			}
		});
		registerPermission("curses_limited", {
			name: "Allows handling curses on limited object slots",
			category: ModuleCategory.Curses,
			defaults: {
				[Preset.dominant]: [true, AccessLevel.owner],
				[Preset.switch]: [true, AccessLevel.owner],
				[Preset.submissive]: [false, AccessLevel.lover],
				[Preset.slave]: [false, AccessLevel.lover]
			}
		});
		registerPermission("curses_global_configuration", {
			name: "Allows editing the global curses configuration",
			category: ModuleCategory.Curses,
			defaults: {
				[Preset.dominant]: [true, AccessLevel.owner],
				[Preset.switch]: [true, AccessLevel.owner],
				[Preset.submissive]: [false, AccessLevel.lover],
				[Preset.slave]: [false, AccessLevel.lover]
			}
		});
		registerPermission("curses_change_limits", {
			name: "Allows to limit/block individual curse object slots",
			category: ModuleCategory.Curses,
			defaults: {
				[Preset.dominant]: [true, AccessLevel.self],
				[Preset.switch]: [true, AccessLevel.self],
				[Preset.submissive]: [true, AccessLevel.self],
				[Preset.slave]: [false, AccessLevel.owner]
			}
		});
		registerPermission("curses_color", {
			name: "Allow changing colors of cursed objects",
			category: ModuleCategory.Curses,
			defaults: {
				[Preset.dominant]: [true, AccessLevel.lover],
				[Preset.switch]: [true, AccessLevel.lover],
				[Preset.submissive]: [true, AccessLevel.mistress],
				[Preset.slave]: [false, AccessLevel.mistress]
			}
		});
		registerPermission("curses_view_originator", {
			name: "Allow to view who added the curse originally",
			category: ModuleCategory.Curses,
			defaults: {
				[Preset.dominant]: [true, AccessLevel.self],
				[Preset.switch]: [true, AccessLevel.self],
				[Preset.submissive]: [true, AccessLevel.mistress],
				[Preset.slave]: [true, AccessLevel.mistress]
			}
		});

		queryHandlers.curseItem = (sender, resolve, data) => {
			if (isObject(data) && typeof data.Group === "string" && (typeof data.curseProperties === "boolean" || data.curseProperties === null)) {
				resolve(true, curseItem(data.Group, data.curseProperties, sender));
			} else {
				resolve(false);
			}
		};
		queryHandlers.curseLift = (sender, resolve, data) => {
			if (typeof data === "string") {
				resolve(true, curseLift(data, sender));
			} else {
				resolve(false);
			}
		};
		queryHandlers.curseBatch = (sender, resolve, data) => {
			if (isObject(data) && typeof data.mode === "string" && typeof data.includingEmpty === "boolean") {
				resolve(true, curseBatch(data.mode, data.includingEmpty, sender));
			} else {
				resolve(false);
			}
		};
		queryHandlers.curseLiftAll = (sender, resolve) => {
			resolve(true, curseLiftAll(sender));
		};

		registerWhisperCommand("curses", "- Manage curses", (argv, sender, respond) => {
			if (!moduleIsEnabled(ModuleCategory.Curses)) {
				return respond(`Curses module is disabled.`);
			}
			const subcommand = (argv[0] || "").toLocaleLowerCase();
			const cursesInfo = ConditionsGetCategoryPublicData("curses", sender).conditions;
			if (ConditionsSubcommands.includes(subcommand as ConditionsSubcommand)) {
				return ConditionsRunSubcommand("curses", argv, sender, respond);
			} else if (subcommand === "list") {
				let result = "Current curses:";
				for (const [k, v] of Object.entries(cursesInfo)) {
					const group = AssetGroup.find(g => g.Name === k);
					if (!group) {
						console.warn(`BCX: Unknown group ${k}`);
						continue;
					}

					let resultItem = `\n[${group.Clothing ? "Clothing" : "Item"}] `;

					if (v.data === null) {
						resultItem += `Blocked: ${getVisibleGroupName(group)}`;
					} else {
						const item = AssetGet(Player.AssetFamily, k, v.data.Name);
						const timerText = `Timer: ${v.timer ? formatTimeInterval(v.timer - Date.now(), "short") : "∞"}`;
						resultItem += `${item?.Description ?? v.data.Name} (${getVisibleGroupName(group)}) | ${timerText}` +
							`${v.data.curseProperties ? " | Item configuration also cursed" : ""}`;
					}
					if (result.length + resultItem.length >= 990) {
						result += "\n...";
						respond(result);
						result = "Current curses (continued):";
					}
					result += resultItem;
				}
				respond(result);
			} else if (subcommand === "listgroups") {
				const listgroup = (argv[1] || "").toLocaleLowerCase();
				if (listgroup === "items") {
					let result = `List of item groups:`;
					const AssetGroupItems = AssetGroup.filter(g => g.Category === "Item");
					for (const group of AssetGroupItems) {
						const currentItem = InventoryGet(Player, group.Name);
						const itemIsCursed = cursesInfo[group.Name] !== undefined;

						result += `\n${getVisibleGroupName(group)}: ${currentItem ? currentItem.Asset.Description : "[Nothing]"}`;
						if (itemIsCursed) {
							result += ` [cursed]`;
						}
					}
					respond(result);
				} else if (listgroup === "clothes") {
					let result = `List of clothes groups:`;
					const AssetGroupClothings = AssetGroup.filter(g => g.Category === "Appearance" && g.Clothing);
					for (const group of AssetGroupClothings) {
						const currentItem = InventoryGet(Player, group.Name);
						const clothingIsCursed = cursesInfo[group.Name] !== undefined;

						result += `\n${getVisibleGroupName(group)}: ${currentItem ? currentItem.Asset.Description : "[Nothing]"}`;
						if (clothingIsCursed) {
							result += ` [cursed]`;
						}
					}
					respond(result);
				} else {
					respond(Command_fixExclamationMark(sender, `Expected one of:\n` +
						`!curses listgroups items\n` +
						`!curses listgroups clothes`
					));
				}
			} else if (subcommand === "curse") {
				const group = Command_selectGroup(argv[1] || "", getPlayerCharacter(), G => G.Category !== "Appearance" || G.Clothing);
				if (typeof group === "string") {
					return respond(group);
				}
				if (cursesInfo[group.Name] !== undefined) {
					return respond(`This group or item is already cursed`);
				}
				respond(curseItem(group.Name, null, sender) ? `Ok.` : COMMAND_GENERIC_ERROR);
			} else if (subcommand === "curseworn" || subcommand === "curseall") {
				const group = (argv[1] || "").toLocaleLowerCase();
				if (group === "items" || group === "clothes") {
					return respond(curseBatch(group, subcommand === "curseall", sender) ? `Ok.` : COMMAND_GENERIC_ERROR);
				}
				respond(Command_fixExclamationMark(sender, `Expected one of:\n` +
					`!curses ${subcommand} items\n` +
					`!curses ${subcommand} clothes`
				));
			} else if (subcommand === "lift") {
				const group = Command_selectGroup(argv[1] || "", getPlayerCharacter(), G => G.Category !== "Appearance" || G.Clothing);
				if (typeof group === "string") {
					return respond(group);
				}
				if (cursesInfo[group.Name] === undefined) {
					return respond(`This group or item is not cursed`);
				}
				respond(curseLift(group.Name, sender) ? `Ok.` : COMMAND_GENERIC_ERROR);
			} else if (subcommand === "liftall") {
				respond(curseLiftAll(sender) ? `Ok.` : COMMAND_GENERIC_ERROR);
			} else if (subcommand === "configuration") {
				const group = Command_selectGroup(argv[1] || "", getPlayerCharacter(), G => G.Category !== "Appearance" || G.Clothing);
				if (typeof group === "string") {
					return respond(group);
				}
				const curse = cursesInfo[group.Name];
				if (!curse) {
					return respond(`This group or item is not cursed`);
				}
				const target = (argv[2] || "").toLocaleLowerCase();
				if (target !== "yes" && target !== "no") {
					return respond(`Expected yes or no`);
				}
				if (curse.data == null) {
					return respond(`Empty groups cannot have configuration cursed`);
				}
				const asset = AssetGet(Player.AssetFamily, group.Name, cursesInfo[group.Name].data!.Name);
				if (asset && target === "yes" && !curseAllowItemCurseProperty(asset)) {
					return respond(`This item cannot have configuration cursed`);
				}
				curse.data.curseProperties = target === "yes";
				respond(ConditionsUpdate("curses", group.Name, curse, sender) ? `Ok.` : COMMAND_GENERIC_ERROR);
			} else if (subcommand === "autoremove") {
				const group = Command_selectGroup(argv[1] || "", getPlayerCharacter(), G => G.Category !== "Appearance" || G.Clothing);
				if (typeof group === "string") {
					return respond(group);
				}
				const curse = cursesInfo[group.Name];
				if (!curse) {
					return respond(`This group or item is not cursed`);
				}
				if (!cursesInfo[group.Name].requirements) {
					return respond(`Cannot change autoremove while the curse uses the global configuration. First use:\ncurses triggers <curse> global no`);
				}
				const target = (argv[2] || "").toLocaleLowerCase();
				if (target !== "yes" && target !== "no") {
					return respond(`Expected yes or no`);
				}
				if (curse.data == null) {
					return respond(`Empty groups have no item to be automatically removed`);
				}
				curse.data.itemRemove = target === "yes";
				respond(ConditionsUpdate("curses", group.Name, curse, sender) ? `Ok.` : COMMAND_GENERIC_ERROR);
			} else {
				respond(Command_fixExclamationMark(sender, `!curses usage (page 1):\n` +
					`!curses list - List all cursed <group>s and related info (eg. cursed items)\n` +
					`!curses listgroups <items|clothes> - Lists all possible item or cloth <group> slots and worn items\n` +
					`!curses curse <group> - Places a curse on the specified item/cloth <group>\n` +
					`!curses curseworn <items|clothes> - Place a curse on all currently worn items/clothes\n` +
					`!curses curseall <items|clothes> - Place a curse on all item/cloth slots, both used and empty\n` +
					`!curses lift <group> - Lifts (removes) the curse from the specified item/cloth <group>\n` +
					`!curses liftall - Lifts (removes) all curses\n` +
					`!curses configuration <group> <yes|no> - Curses or uncurses the item configuration of an item/cloth in <group>\n` +
					`!curses autoremove <group> <yes|no> - Removes an item/cloth in <group> when the curse is no longer in effect`
				));
				respond(Command_fixExclamationMark(sender, `!curses usage (page 2):\n` +
					`!curses setactive <group> <yes/no> - Switch the curse and its conditions on and off\n` +
					`!curses triggers <group> global <yes/no> - Set the trigger condition of this curse to the global configuration\n` +
					`!curses triggers <group> help - Set the trigger configuration of a curse\n` +
					`!curses globaltriggers help - Set global trigger configuration\n` +
					`!curses timer <group> help - Set timer options of a curse\n` +
					`!curses defaulttimer help - Set default timer options used on new curses\n` +
					`!curses setlimit <group> <normal/limited/blocked> - Set a limit on certain <group>\n` +
					`\nHint: If an argument contains spaces: "put it in quotes"`
				));
			}
		}, (argv, sender) => {
			if (!moduleIsEnabled(ModuleCategory.Curses)) {
				return [];
			}
			if (argv.length <= 1) {
				return Command_pickAutocomplete(argv[0], ["list", "listgroups", "curse", "curseworn", "curseall", "lift", "liftall", "configuration", "autoremove", ...ConditionsSubcommands]);
			}

			const subcommand = argv[0].toLocaleLowerCase();
			const cursesInfo = ConditionsGetCategoryPublicData("curses", sender).conditions;

			if (ConditionsSubcommands.includes(subcommand as ConditionsSubcommand)) {
				return ConditionsAutocompleteSubcommand("curses", argv, sender);
			} else if (subcommand === "listgroups") {
				if (argv.length === 2) {
					return Command_pickAutocomplete(argv[1], ["items", "clothes"]);
				}
			} else if (subcommand === "curse") {
				if (argv.length === 2) {
					return Command_selectGroupAutocomplete(argv[1] || "", getPlayerCharacter(), G => G.Category !== "Appearance" || G.Clothing);
				}
			} else if (subcommand === "curseworn" || subcommand === "curseall") {
				if (argv.length === 2) {
					return Command_pickAutocomplete(argv[1], ["items", "clothes"]);
				}
			} else if (subcommand === "lift") {
				if (argv.length === 2) {
					return Command_selectGroupAutocomplete(argv[1] || "", getPlayerCharacter(), G => cursesInfo[G.Name] !== undefined);
				}
			} else if (subcommand === "configuration") {
				if (argv.length === 2) {
					return Command_selectGroupAutocomplete(argv[1] || "", getPlayerCharacter(), G => cursesInfo[G.Name] !== undefined);
				} else if (argv.length === 3) {
					return Command_pickAutocomplete(argv[2], ["yes", "no"]);
				}
			} else if (subcommand === "autoremove") {
				if (argv.length === 2) {
					return Command_selectGroupAutocomplete(argv[1] || "", getPlayerCharacter(), G => cursesInfo[G.Name] !== undefined);
				} else if (argv.length === 3) {
					return Command_pickAutocomplete(argv[2], ["yes", "no"]);
				}
			}

			return [];
		});

		ConditionsRegisterCategory("curses", {
			category: ModuleCategory.Curses,
			permission_normal: "curses_normal",
			permission_limited: "curses_limited",
			permission_configure: "curses_global_configuration",
			permission_changeLimits: "curses_change_limits",
			permission_viewOriginator: "curses_view_originator",
			loadValidateConditionKey: (group) => AssetGroup.some(g => g.Name === group),
			loadValidateCondition: (group, data) => {
				const info = data.data;

				if (info === null)
					return true;

				if (!isObject(info) ||
					typeof info.Name !== "string" ||
					typeof info.curseProperty !== "boolean"
				) {
					console.error(`BCX: Bad data for cursed item in group ${group}, removing it`, info);
					return false;
				}

				if (AssetGet("Female3DCG", group, info.Name) == null) {
					console.warn(`BCX: Unknown cursed item ${group}:${info.Name}, removing it`, info);
					return false;
				}
				return true;
			},
			loadCategorySpecificGlobalData: (data) => {
				if (!isObject(data)) {
					console.warn("BCX: Bad curses global data, resetting");
					data = {
						itemRemove: false
					};
				}
				if (typeof data.itemRemove !== "boolean") {
					data.itemRemove = false;
				}
				return data;
			},
			stateChangeHandler: this.curseStateChange.bind(this),
			tickHandler: this.curseTick.bind(this),
			afterTickHandler: this.afterCurseTick.bind(this),
			makePublicData: (group, data) => {
				if (data.data === null) {
					return null;
				}
				return {
					Name: data.data.Name,
					curseProperties: data.data.curseProperty,
					itemRemove: data.data.itemRemove ?? false
				};
			},
			validateCategorySpecificGlobalData: data => isObject(data) && typeof data.itemRemove === "boolean",
			validatePublicData: (group, data) =>
				data === null ||
				isObject(data) &&
				typeof data.Name === "string" &&
				typeof data.curseProperties === "boolean" &&
				typeof data.itemRemove === "boolean",
			updateCondition: (condition, data, updateData, character, rawData) => {
				// Update cannot change cursed item
				if (data.data?.Name !== updateData?.Name)
					return false;
				// Nothing to update on empty slot
				if (!data.data || !updateData)
					return true;

				const asset = AssetGet(Player.AssetFamily, condition, data.data.Name);
				if (!asset) {
					console.warn(`BCX: Curse asset ${condition}:${data.data.Name} not found during update`);
					return false;
				}

				data.data.curseProperty = updateData.curseProperties;
				if (!curseAllowItemCurseProperty(asset) && data.data.curseProperty) {
					console.warn(`BCX: Attempt to curse properties of item ${condition}:${data.data.Name}, while not allowed`);
					data.data.curseProperty = false;
				}

				if (updateData.itemRemove && rawData.requirements) {
					data.data.itemRemove = true;
				} else {
					delete data.data.itemRemove;
				}

				return true;
			},
			parseConditionName: (selector, onlyExisting) => {
				const group = Command_selectGroup(selector, getPlayerCharacter(), G => (G.Category !== "Appearance" || G.Clothing) && (!onlyExisting || onlyExisting.includes(G.Name)));
				if (typeof group === "string") {
					return [false, group];
				}
				return [true, group.Name];
			},
			autocompleteConditionName: (selector, onlyExisting) => {
				return Command_selectGroupAutocomplete(selector, getPlayerCharacter(), G => (G.Category !== "Appearance" || G.Clothing) && (!onlyExisting || onlyExisting.includes(G.Name)));
			},
			logLimitChange: (group, character, newLimit) => {
				logMessage("curse_change", LogEntryType.plaintext,
					`${character} changed ${Player.Name}'s curse slot '${group}' permission to ${ConditionsLimit[newLimit]}`);
				if (!character.isPlayer()) {
					ChatRoomSendLocal(`${character} changed curse slot '${group}' permission to ${ConditionsLimit[newLimit]}`, undefined, character.MemberNumber);
				}
			},
			logConditionUpdate: (group, character, newData, oldData) => {
				const assetGroup = AssetGroup.find(g => g.Name === group);
				const visibleName = assetGroup ? getVisibleGroupName(assetGroup) : "[ERROR]";

				const didActiveChange = newData.active !== oldData.active;
				const didTimerChange = newData.timer !== oldData.timer || newData.timerRemove !== oldData.timerRemove;
				const didTriggerChange = !isEqual(newData.requirements, oldData.requirements);
				const didItemRemoveChange = newData.requirements != null && newData.data?.itemRemove !== oldData.data?.itemRemove;
				const didItemConfigCurseChange = newData.data?.curseProperties !== oldData.data?.curseProperties;
				const changeEvents = [];
				if (didActiveChange)
					changeEvents.push("active state");
				if (didTimerChange)
					changeEvents.push("timer");
				if (didTriggerChange)
					changeEvents.push("trigger condition");
				if (didItemRemoveChange)
					changeEvents.push("autoremove option");
				if (didItemConfigCurseChange)
					changeEvents.push("item config curse");
				if (changeEvents.length > 0) {
					logMessage("curse_change", LogEntryType.plaintext,
						`${character} changed the ${changeEvents.join(", ")} of ${Player.Name}'s curse on slot '${visibleName}'`);
				}
				if (!character.isPlayer()) {
					if (didActiveChange) {
						ChatRoomSendLocal(`${character} ${newData.active ? "reactivated" : "deactivated"} the curse on slot '${visibleName}'`, undefined, character.MemberNumber);
					}
					if (newData.timer !== oldData.timer)
						if (newData.timer === null) {
							ChatRoomSendLocal(`${character} disabled the timer of the curse on slot '${visibleName}'`, undefined, character.MemberNumber);
						} else {
							ChatRoomSendLocal(`${character} changed the remaining time of the timer of the curse on slot '${visibleName}' to ${formatTimeInterval(newData.timer - Date.now())}`, undefined, character.MemberNumber);
						}
					if (newData.timer !== null && newData.timerRemove !== oldData.timerRemove)
						ChatRoomSendLocal(`${character} changed the timer behavior of the curse on slot '${visibleName}' to ${newData.timerRemove ? "remove" : "disable"} the curse when time runs out`, undefined, character.MemberNumber);
					if (didItemRemoveChange) {
						ChatRoomSendLocal(`${character} set the curse on slot '${visibleName}' to ${newData.data?.itemRemove ? "remove" : "keep"} the item when the curse is no longer in effect`, undefined, character.MemberNumber);
					}
					if (didTriggerChange)
						if (newData.requirements === null) {
							ChatRoomSendLocal(`${character} set the curse on slot '${visibleName}' to use the global curses configuration`, undefined, character.MemberNumber);
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
								ChatRoomSendLocal(`${character} set the curse on slot ${visibleName} to trigger under following conditions:\n` + triggers.join("\n"), undefined, character.MemberNumber);
							} else {
								ChatRoomSendLocal(`${character} deactivated all trigger conditions of the curse on slot ${visibleName}. The curse will now always trigger, while it is active`, undefined, character.MemberNumber);
							}
						}
					if (didItemConfigCurseChange)
						ChatRoomSendLocal(`${character} ${newData.data?.curseProperties ? "cursed" : "lifted the curse of"} the '${visibleName}' item's configuration`, undefined, character.MemberNumber);
				}
			},
			logCategoryUpdate: (character, newData, oldData) => {
				const didTimerChange = newData.timer !== oldData.timer || newData.timerRemove !== oldData.timerRemove;
				const didTriggerChange = !isEqual(newData.requirements, oldData.requirements);
				const didItemRemoveChange = newData.data?.itemRemove !== oldData.data?.itemRemove;
				const changeEvents = [];
				if (didTimerChange)
					changeEvents.push("default timer");
				if (didTriggerChange)
					changeEvents.push("trigger condition");
				if (didItemRemoveChange)
					changeEvents.push("autoremove option");
				if (changeEvents.length > 0) {
					logMessage("curse_change", LogEntryType.plaintext,
						`${character} changed the ${changeEvents.join(", ")} of ${Player.Name}'s global curses config`);
				}
				if (!character.isPlayer()) {
					if (newData.timer !== oldData.timer)
						if (newData.timer === null) {
							ChatRoomSendLocal(`${character} removed the default timer of the global curses configuration`, undefined, character.MemberNumber);
						} else {
							ChatRoomSendLocal(`${character} changed the default timer of the global curses configuration to ${formatTimeInterval(newData.timer)}`, undefined, character.MemberNumber);
						}
					if (newData.timer !== null && newData.timerRemove !== oldData.timerRemove)
						ChatRoomSendLocal(`${character} changed the default timeout behavior of the global curses configuration to ${newData.timerRemove ? "removal of curses" : "disabling curses"} when time runs out`, undefined, character.MemberNumber);
					if (didItemRemoveChange) {
						ChatRoomSendLocal(`${character} changed the default curses behaviour to ${newData.data?.itemRemove ? "remove" : "keep"} an item when the curse on it is no longer in effect`, undefined, character.MemberNumber);
					}
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
							ChatRoomSendLocal(`${character} set the global curses configuration to trigger curses under following conditions:\n` + triggers.join("\n"), undefined, character.MemberNumber);
						} else {
							ChatRoomSendLocal(`${character} deactivated all trigger conditions for the global curses configuration. Curses set to this default configuration will now always trigger, while active`, undefined, character.MemberNumber);
						}
					}
				}
			},
			getDefaultLimits: () => ({}),
			commandConditionSelectorHelp: "group"
		});
	}

	load() {
		if (!moduleIsEnabled(ModuleCategory.Curses)) {
			return;
		}

		hookFunction("ValidationResolveModifyDiff", 0, (args, next) => {
			const params = args[2] as AppearanceUpdateParameters;
			const result = next(args) as ItemDiffResolution;

			if (params.C.ID === 0 && result.item) {
				const condition = ConditionsGetCondition("curses", result.item.Asset.Group.Name);
				const curse = condition?.data;
				const character = getChatroomCharacter(params.sourceMemberNumber);
				if (curse &&
					result.item.Asset.Name === curse.Name &&
					!itemColorsEquals(curse.Color, result.item.Color) &&
					character &&
					checkPermissionAccess("curses_color", character)
				) {
					if (result.item.Color && result.item.Color !== "Default") {
						curse.Color = cloneDeep(result.item.Color);
					} else {
						delete curse.Color;
					}
					modStorageSync();
				}
			}

			return result;
		}, ModuleCategory.Curses);

		hookFunction("ColorPickerDraw", 0, (args, next) => {
			const Callback = args[5];
			if (Callback === ItemColorOnPickerChange) {
				args[5] = (color: any) => {
					if (ItemColorCharacter === Player && ItemColorItem) {
						// Original code
						const newColors = ItemColorState.colors.slice();
						ItemColorPickerIndices.forEach(i => newColors[i] = color);
						ItemColorItem.Color = newColors;
						CharacterLoadCanvas(ItemColorCharacter);
						// Curse color change code
						const condition = ConditionsGetCondition("curses", ItemColorItem.Asset.Group.Name);
						const curse = condition?.data;
						if (curse &&
							!itemColorsEquals(curse.Color, ItemColorItem.Color) &&
							checkPermissionAccess("curses_color", getPlayerCharacter())
						) {
							if (ItemColorItem.Color && ItemColorItem.Color !== "Default") {
								curse.Color = cloneDeep(ItemColorItem.Color);
							} else {
								delete curse.Color;
							}
							modStorageSync();
						}
					} else {
						Callback(color);
					}
				};
			}
			return next(args);
		});
	}

	run() {
		if (!moduleIsEnabled(ModuleCategory.Curses))
			return;

		this.resetTimer = BCX_setInterval(() => {
			this.triggerCounts.clear();
		}, CURSES_ANTILOOP_RESET_INTERVAL);
	}

	unload() {
		if (this.resetTimer !== null) {
			clearInterval(this.resetTimer);
			this.resetTimer = null;
		}
		removeAllHooksByModule(ModuleCategory.Curses);
	}

	reload() {
		this.unload();
		this.load();
		this.run();
	}

	curseTick(group: string, condition: ConditionsConditionData<"curses">): void {
		if (this.suspendedUntil !== null) {
			if (Date.now() >= this.suspendedUntil) {
				this.suspendedUntil = null;
				this.triggerCounts.clear();
				ChatRoomActionMessage(`The dormant curse on ${Player.Name}'s body wakes up again.`);
			} else {
				return;
			}
		}

		const assetGroup = AssetGroupGet(Player.AssetFamily, group);
		if (!assetGroup) {
			console.error(`BCX: AssetGroup not found for curse ${group}`, condition);
			return;
		}

		// Pause curses of clothes while in appearance menu
		if (CurrentScreen === "Appearance" && !isBind(assetGroup))
			return;

		const curse = condition.data;

		if (curse === null) {
			const current = InventoryGet(Player, group);
			if (current) {
				InventoryRemove(Player, group, false);
				CharacterRefresh(Player, true);
				ChatRoomCharacterUpdate(Player);
				this.pendingMessages.remove.push(current.Asset.Description);
				return;
			}
			return;
		}


		const asset = AssetGet("Female3DCG", group, curse.Name);
		if (!asset) {
			console.error(`BCX: Asset not found for curse ${group}:${curse.Name}`, curse);
			return;
		}

		let changeType: "" | cursedChange = "";

		let currentItem = InventoryGet(Player, group);

		if (currentItem && currentItem.Asset.Name !== curse.Name) {
			InventoryRemove(Player, group, false);
			changeType = "swap";
			currentItem = null;
		}

		if (!currentItem) {
			currentItem = {
				Asset: asset,
				Color: curse.Color != null ? cloneDeep(curse.Color) : "Default",
				Property: curse.Property != null ? cloneDeep(curse.Property) : {},
				Difficulty: curse.Difficulty != null ? curse.Difficulty : 0
			};
			Player.Appearance.push(currentItem);
			if (!changeType) changeType = "add";
		}


		if (curse.curseProperty) {
			const itemProperty = currentItem.Property = (currentItem.Property ?? {});
			const curseProperty = curse.Property ?? {};
			for (const key of arrayUnique(Object.keys(curseProperty).concat(Object.keys(itemProperty)))) {
				if (key === "Effect")
					continue;

				if (CURSE_IGNORED_PROPERTIES.includes(key)) {
					delete curseProperty[key];
					continue;
				}

				if (curseProperty[key] === undefined) {
					if (itemProperty[key] !== undefined) {
						delete itemProperty[key];
						if (!changeType) changeType = "update";
					}
				} else if (typeof curseProperty[key] !== typeof itemProperty[key] ||
					!isEqual(curseProperty[key], itemProperty[key])
				) {
					itemProperty[key] = cloneDeep(curseProperty[key]);
					if (!changeType) changeType = "update";
				}
			}
			const itemIgnoredEffects = Array.isArray(itemProperty.Effect) ? itemProperty.Effect.filter(i => CURSE_IGNORED_EFFECTS.includes(i)) : [];
			const itemEffects = Array.isArray(itemProperty.Effect) ? itemProperty.Effect.filter(i => !CURSE_IGNORED_EFFECTS.includes(i)).sort() : [];
			const curseEffects = Array.isArray(curseProperty.Effect) ? curseProperty.Effect.filter(i => !CURSE_IGNORED_EFFECTS.includes(i)).sort() : [];
			if (!CommonArraysEqual(itemEffects, curseEffects)) {
				itemProperty.Effect = curseEffects.concat(itemIgnoredEffects);
			}
			if (Object.keys(curseProperty).length === 0) {
				delete curse.Property;
			} else if (!isEqual(curse.Property, curseProperty)) {
				curse.Property = curseProperty;
			}
		} else {
			curse.Property = curseCreateCurseItemInfo(currentItem).Property;
		}

		if (!itemColorsEquals(curse.Color, currentItem.Color)) {
			if (curse.Color === undefined || curse.Color === "Default") {
				delete currentItem.Color;
			} else {
				currentItem.Color = cloneDeep(curse.Color);
			}
			if (!changeType) changeType = "color";
		}

		if (changeType) {
			CharacterRefresh(Player, true);
			ChatRoomCharacterUpdate(Player);
			this.pendingMessages[changeType].push(asset.Description);

			const counter = (this.triggerCounts.get(group) ?? 0) + 1;
			this.triggerCounts.set(group, counter);

			if (counter >= CURSES_ANTILOOP_THRESHOLD) {
				ChatRoomActionMessage("Protection triggered: Curses have been disabled for 10 minutes. Please refrain from triggering curses so rapidly, as it creates strain on the server and may lead to unwanted side effects! If you believe this message was triggered by a bug, please report it to BCX Discord.");
				this.suspendedUntil = Date.now() + CURSES_ANTILOOP_SUSPEND_TIME;
			}
		}
	}

	private afterCurseTick(): void {
		for (const changeType of Object.keys(this.pendingMessages) as (cursedChange | "autoremove")[]) {
			const list = this.pendingMessages[changeType];
			if (list.length === 0)
				continue;
			if (list.length >= 3) {
				ChatRoomActionMessage(dictionaryProcess(CURSES_TRIGGER_TEXTS_BATCH[changeType], {}));
				if (changeType !== "autoremove") {
					logMessage("curse_trigger", LogEntryType.curseTriggerBatch, changeType);
				}
			} else {
				for (const item of list) {
					ChatRoomActionMessage(dictionaryProcess(CURSES_TRIGGER_TEXTS[changeType], { ASSET_NAME: item }));
					if (changeType !== "autoremove") {
						logMessage("curse_trigger", LogEntryType.curseTrigger, [changeType, item]);
					}
				}
			}
			this.pendingMessages[changeType] = [];
		}
	}

	private curseStateChange(curse: string, data: ConditionsConditionData<"curses">, newState: boolean): void {
		if (!newState &&
			data.data &&
			(data.requirements ? data.data.itemRemove : ConditionsGetCategoryData("curses").data?.itemRemove)
		) {
			// Removal of cursed item when curse becomes inactive
			const currentItem = InventoryGet(Player, curse);
			// Only remove if it is the cursed item and it is not locked
			if (currentItem &&
				currentItem.Asset.Name === data.data.Name &&
				InventoryGetLock(currentItem) == null
			) {
				InventoryRemove(Player, curse, true);
				ChatRoomCharacterUpdate(Player);
				this.pendingMessages.autoremove.push(currentItem.Asset.Description);
			}
		}
	}
}
