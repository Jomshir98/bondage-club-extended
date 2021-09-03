import { ChatroomCharacter, getChatroomCharacter, getPlayerCharacter } from "../characters";
import { BaseModule } from "./_BaseModule";
import { arrayUnique, isObject } from "../utils";
import { ChatRoomActionMessage, ChatRoomSendLocal, getVisibleGroupName, itemColorsEquals } from "../utilsClub";
import { AccessLevel, checkPermissionAccess, registerPermission } from "./authority";
import { notifyOfChange, queryHandlers } from "./messaging";
import { modStorageSync } from "./storage";
import { LogEntryType, logMessage } from "./log";
import { moduleIsEnabled } from "./presets";
import { ModuleCategory, Preset } from "../constants";
import { hookFunction } from "../patching";
import { Command_fixExclamationMark, COMMAND_GENERIC_ERROR, Command_pickAutocomplete, Command_selectGroup, Command_selectGroupAutocomplete, registerWhisperCommand } from "./commands";
import { ConditionsCheckAccess, ConditionsGetCategoryData, ConditionsGetCondition, ConditionsRegisterCategory, ConditionsRemoveCondition, ConditionsSetCondition } from "./conditions";

import cloneDeep from "lodash-es/cloneDeep";
import isEqual from "lodash-es/isEqual";

const CURSES_ANTILOOP_RESET_INTERVAL = 60_000;
const CURSES_ANTILOOP_THRESHOLD = 10;
const CURSES_ANTILOOP_SUSPEND_TIME = 600_000;

const CURSE_IGNORED_PROPERTIES = ValidationModifiableProperties.slice();
const CURSE_IGNORED_EFFECTS = ["Lock"];

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

		const newCurse: CursedItemInfo = {
			Name: currentItem.Asset.Name,
			curseProperty
		};
		if (currentItem.Color && currentItem.Color !== "Default") {
			newCurse.Color = cloneDeep(currentItem.Color);
		}
		if (currentItem.Difficulty) {
			newCurse.Difficulty = currentItem.Difficulty;
		}
		if (currentItem.Property && Object.keys(currentItem.Property).filter(i => !CURSE_IGNORED_PROPERTIES.includes(i)).length !== 0) {
			newCurse.Property = cloneDeep(currentItem.Property);
			if (newCurse.Property) {
				for (const key of CURSE_IGNORED_PROPERTIES) {
					delete newCurse.Property[key];
				}
			}
		}
		ConditionsSetCondition("curses", Group, {
			active: true,
			data: newCurse
		});
		if (character) {
			logMessage("curse_change", LogEntryType.plaintext, `${character} cursed ${Player.Name}'s ${currentItem.Asset.Description}`);
			if (!character.isPlayer()) {
				ChatRoomSendLocal(`${character} cursed the ${currentItem.Asset.Description} on you`);
			}
		}
	} else {
		ConditionsSetCondition("curses", Group, {
			active: true,
			data: null
		});
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

// TODO: Remove
export function curseGetInfo(character: ChatroomCharacter): BCX_curseInfo {
	const res: BCX_curseInfo = {
		allowCurse: checkPermissionAccess("curses_normal", character),
		allowLift: checkPermissionAccess("curses_normal", character),
		curses: {}
	};

	for (const [group, info] of Object.entries(ConditionsGetCategoryData("curses").conditions)) {
		res.curses[group] = info.data === null ? null : {
			Name: info.data.Name,
			curseProperties: info.data.curseProperty
		};
	}

	return res;
}

export class ModuleCurses extends BaseModule {
	private resetTimer: number | null = null;
	private triggerCounts: Map<string, number> = new Map();
	private suspendedUntil: number | null = null;

	init() {
		registerPermission("curses_normal", {
			name: "Allows handling curses of non-limited object slots",
			category: ModuleCategory.Curses,
			defaults: {
				[Preset.dominant]: [true, AccessLevel.lover],
				[Preset.switch]: [true, AccessLevel.lover],
				[Preset.submissive]: [false, AccessLevel.mistress],
				[Preset.slave]: [false, AccessLevel.mistress]
			}
		});
		registerPermission("curses_limited", {
			name: "Allows handling curses of limited object slots",
			category: ModuleCategory.Curses,
			defaults: {
				[Preset.dominant]: [true, AccessLevel.owner],
				[Preset.switch]: [true, AccessLevel.owner],
				[Preset.submissive]: [false, AccessLevel.lover],
				[Preset.slave]: [false, AccessLevel.lover]
			}
		});
		registerPermission("curses_global_configuration", {
			name: "Allows editing the global default condition configuration",
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

		queryHandlers.curseGetInfo = (sender, resolve) => {
			resolve(true, curseGetInfo(sender));
		};
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
			const cursesInfo = curseGetInfo(sender).curses;
			if (subcommand === "list") {
				let result = "Current curses:";
				for (const [k, v] of Object.entries(cursesInfo)) {
					const group = AssetGroup.find(g => g.Name === k);
					if (!group) {
						console.warn(`BCX: Unknown group ${k}`);
						continue;
					}

					result += `\n[${group.Clothing ? "Clothing" : "Item"}] `;

					if (v === null) {
						result += `Blocked: ${getVisibleGroupName(group)}`;
					} else {
						const item = AssetGet(Player.AssetFamily, k, v.Name);
						result += `${item?.Description ?? v.Name} (${getVisibleGroupName(group)})`;
					}
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
			} else if (subcommand === "settings") {
				const group = Command_selectGroup(argv[1] || "", getPlayerCharacter(), G => G.Category !== "Appearance" || G.Clothing);
				if (typeof group === "string") {
					return respond(group);
				}
				if (cursesInfo[group.Name] === undefined) {
					return respond(`This group or item is not cursed`);
				}
				const target = (argv[2] || "").toLocaleLowerCase();
				if (target !== "yes" && target !== "no") {
					return respond(`Expected yes or no`);
				}
				if (cursesInfo[group.Name] == null) {
					return respond(`Empty groups cannot have settings cursed`);
				}
				const asset = AssetGet(Player.AssetFamily, group.Name, cursesInfo[group.Name]!.Name);
				if (asset && target === "yes" && !curseAllowItemCurseProperty(asset)) {
					return respond(`This item cannot have settings cursed`);
				}
				respond(curseItem(group.Name, target === "yes", sender) ? `Ok.` : COMMAND_GENERIC_ERROR);
			} else {
				respond(Command_fixExclamationMark(sender, `!curses usage:\n` +
					`!curses list - List all active curses and related info\n` +
					`!curses listgroups <items|clothes> - Lists all possible item and/or clothing slots\n` +
					`!curses curse <group> - Places a curse on the specified item or clothing <group>\n` +
					`!curses curseworn <items|clothes> - Place a curse on all currenty worn items/clothes\n` +
					`!curses curseall <items|clothes> - Place a curse on all item/clothe slots, both used and empty\n` +
					`!curses lift <group> - Lifts (removes) the curse from the specified item or clothing <group>\n` +
					`!curses liftall - Lifts (removes) all curses\n` +
					`!curses settings <group> <yes|no> - Curses or uncurses the usage configuration of an item or clothing in <group>`
				));
			}
		}, (argv, sender) => {
			if (!moduleIsEnabled(ModuleCategory.Curses)) {
				return [];
			}
			if (argv.length <= 1) {
				return Command_pickAutocomplete(argv[0], ["list", "listgroups", "curse", "curseworn", "curseall", "lift", "liftall", "settings"]);
			}

			const subcommand = argv[0].toLocaleLowerCase();
			const cursesInfo = curseGetInfo(sender).curses;

			if (subcommand === "listgroups") {
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
			} else if (subcommand === "settings") {
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
			tickHandler: this.curseTick.bind(this),
			makePublicData: (group, data) => {
				if (data.data === null) {
					return null;
				}
				return {
					Name: data.data.Name,
					curseProperties: data.data.curseProperty
				};
			},
			validatePublicData: (group, data) =>
				data === null ||
				isObject(data) &&
				typeof data.Name === "string" &&
				typeof data.curseProperties === "boolean"
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
							console.debug("Picker curse color change trigger");
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

		this.resetTimer = setInterval(() => {
			this.triggerCounts.clear();
		}, CURSES_ANTILOOP_RESET_INTERVAL);
	}

	unload() {
		if (this.resetTimer !== null) {
			clearInterval(this.resetTimer);
			this.resetTimer = null;
		}
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

		const curse = condition.data;

		if (curse === null) {
			const current = InventoryGet(Player, group);
			if (current) {
				InventoryRemove(Player, group, false);
				CharacterRefresh(Player, true);
				ChatRoomCharacterUpdate(Player);
				ChatRoomActionMessage(`${Player.Name}'s body seems to be cursed and the ${current.Asset.Description} just falls off her body`);
				logMessage("curse_trigger", LogEntryType.plaintext, `The curse on ${Player.Name}'s body prevented a ${current.Asset.Description} from being added to it`);
				return;
			}
			return;
		}


		const asset = AssetGet("Female3DCG", group, curse.Name);
		if (!asset) {
			console.error(`BCX: Asset not found for curse ${group}:${curse.Name}`, curse);
			return;
		}

		type change = "add" | "swap" | "update" | "color";
		let changeType: "" | change  = "";
		const CHANGE_TEXTS: Record<change, string> = {
			add: `The curse on ${Player.Name}'s ${asset.Description} wakes up and the item reappears`,
			swap: `The curse on ${Player.Name}'s ${asset.Description} wakes up, not allowing the item to be replaced by another item`,
			update: `The curse on ${Player.Name}'s ${asset.Description} wakes up and undos all changes to the item`,
			color: `The curse on ${Player.Name}'s ${asset.Description} wakes up, changing the color of the item back`
		};
		const CHANGE_LOGS: Record<change, string> = {
			add: `The curse on ${Player.Name}'s ${asset.Description} made the item reappear`,
			swap: `The curse on ${Player.Name}'s ${asset.Description} prevented replacing the item`,
			update: `The curse on ${Player.Name}'s ${asset.Description} reverted all changes to the item`,
			color: `The curse on ${Player.Name}'s ${asset.Description} reverted the color of the item`
		};

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

		const itemProperty = currentItem.Property = (currentItem.Property ?? {});
		let curseProperty = curse.Property ?? {};

		if (curse.curseProperty) {
			for (const key of arrayUnique(Object.keys(curseProperty).concat(Object.keys(itemProperty)))) {
				if (key === "Effect")
					continue;

				if (CURSE_IGNORED_PROPERTIES.includes(key)) {
					if (curseProperty[key] !== undefined) {
						delete curseProperty[key];
					}
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
			const itemEffects = Array.isArray(itemProperty.Effect) ? itemProperty.Effect.filter(i => !CURSE_IGNORED_EFFECTS.includes(i)) : [];
			const curseEffects = Array.isArray(curseProperty.Effect) ? curseProperty.Effect.filter(i => !CURSE_IGNORED_EFFECTS.includes(i)) : [];
			if (!CommonArraysEqual(itemEffects, curseEffects)) {
				itemProperty.Effect = curseEffects.concat(itemIgnoredEffects);
			} else if (Array.isArray(itemProperty.Effect) && itemProperty.Effect.length > 0) {
				curseProperty.Effect = itemProperty.Effect.slice();
			} else {
				delete curseProperty.Effect;
			}
		} else {
			if (!isEqual(curseProperty, itemProperty)) {
				curseProperty = cloneDeep(itemProperty);
				for (const key of CURSE_IGNORED_PROPERTIES) {
					delete curseProperty[key];
				}
			}
		}

		if (Object.keys(curseProperty).length === 0) {
			if (curse.Property !== undefined) {
				delete curse.Property;
			}
		} else if (!isEqual(curse.Property, curseProperty)) {
			curse.Property = curseProperty;
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
			if (CHANGE_TEXTS[changeType]) {
				ChatRoomActionMessage(CHANGE_TEXTS[changeType]);
				logMessage("curse_trigger", LogEntryType.plaintext, CHANGE_LOGS[changeType]);
			} else {
				console.error(`BCX: No chat message for curse action ${changeType}`);
			}

			const counter = (this.triggerCounts.get(group) ?? 0) + 1;
			this.triggerCounts.set(group, counter);

			if (counter >= CURSES_ANTILOOP_THRESHOLD) {
				ChatRoomActionMessage("Protection triggered: Curses have been disabled for 10 minutes. Please refrain from triggering curses so rapidly, as it creates strain on the server and may lead to unwanted side effects! If you believe this message was triggered by a bug, please report it to BCX Discord.");
				this.suspendedUntil = Date.now() + CURSES_ANTILOOP_SUSPEND_TIME;
			}
		}
	}
}
