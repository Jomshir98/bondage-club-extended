import { ChatroomCharacter, getChatroomCharacter } from "../characters";
import { BaseModule, ModuleCategory } from "../moduleManager";
import { arrayUnique, isObject } from "../utils";
import { ChatRoomActionMessage } from "../utilsClub";
import { AccessLevel, checkPermissionAccess, registerPermission } from "./authority";
import { queryHandlers } from "./messaging";
import { modStorage, modStorageSync } from "./storage";

const CURSES_CHECK_INTERVAL = 2000;

const CURSE_IGNORED_PROPERTIES = ValidationModifiableProperties.slice();

export function curseItem(Group: string, curseProperty: boolean, character: ChatroomCharacter | null): boolean {
	if (!AssetGroup.some(g => g.Name === Group) || typeof curseProperty !== "boolean" || !modStorage.cursedItems) {
		console.error(`BCX: Attempt to curse with invalid data`, Group, curseProperty);
		return false;
	}

	if (character) {
		const existingCurse = modStorage.cursedItems[Group];
		if (existingCurse) {
			if (!checkPermissionAccess(curseProperty ? "curses_curse" : "curses_lift", character)) {
				return false;
			}
		} else if (!checkPermissionAccess("curses_curse", character)) {
			return false;
		}
	}

	const currentItem = InventoryGet(Player, Group);

	if (currentItem) {
		const newCurse: CursedItemInfo = modStorage.cursedItems[Group] = {
			Name: currentItem.Asset.Name,
			curseProperty
		};
		if (currentItem.Color && currentItem.Color !== "Default") {
			newCurse.Color = JSON.parse(JSON.stringify(currentItem.Color));
		}
		if (currentItem.Difficulty) {
			newCurse.Difficulty = currentItem.Difficulty;
		}
		if (currentItem.Property && Object.keys(currentItem.Property).filter(i => !CURSE_IGNORED_PROPERTIES.includes(i)).length !== 0) {
			newCurse.Property = JSON.parse(JSON.stringify(currentItem.Property));
			if (newCurse.Property) {
				for (const key of CURSE_IGNORED_PROPERTIES) {
					delete newCurse.Property[key];
				}
			}
		}
	} else {
		modStorage.cursedItems[Group] = null;
	}

	modStorageSync();
	return true;
}

export function curseLift(Group: string, character: ChatroomCharacter | null): boolean {
	if (character && !checkPermissionAccess("curses_lift", character))
		return false;

	if (modStorage.cursedItems && modStorage.cursedItems[Group] !== undefined) {
		delete modStorage.cursedItems[Group];
		modStorageSync();
		return true;
	}
	return false;
}

export function curseGetInfo(character: ChatroomCharacter): BCX_curseInfo {
	const res: BCX_curseInfo = {
		allowCurse: checkPermissionAccess("curses_curse", character),
		allowLift: checkPermissionAccess("curses_lift", character),
		curses: {}
	};

	for (const [group, info] of Object.entries(modStorage.cursedItems ?? {})) {
		res.curses[group] = info === null ? null : {
			Name: info.Name,
			curseProperties: info.curseProperty
		};
	}

	return res;
}

export class ModuleCurses extends BaseModule {
	private timer: number | null = null;

	init() {
		registerPermission("curses_curse", {
			name: "Allow cursing objects or the body",
			category: ModuleCategory.Curses,
			self: false,
			min: AccessLevel.mistress
		});
		registerPermission("curses_lift", {
			name: "Allow lifting curses",
			category: ModuleCategory.Curses,
			self: false,
			min: AccessLevel.mistress
		});
		registerPermission("curses_color", {
			name: "Allow changing colors of cursed objects",
			category: ModuleCategory.Curses,
			self: true,
			min: AccessLevel.mistress
		});

		queryHandlers.curseGetInfo = (sender, resolve) => {
			const character = getChatroomCharacter(sender);
			if (character) {
				resolve(true, curseGetInfo(character));
			} else {
				resolve(false);
			}
		};
		queryHandlers.curseItem = (sender, resolve, data) => {
			const character = getChatroomCharacter(sender);
			if (character && isObject(data) && typeof data.Group === "string" && typeof data.curseProperties === "boolean") {
				resolve(true, curseItem(data.Group, data.curseProperties, character));
			} else {
				resolve(false);
			}
		};
		queryHandlers.curseLift = (sender, resolve, data) => {
			const character = getChatroomCharacter(sender);
			if (character && typeof data === "string") {
				resolve(true, curseLift(data, character));
			} else {
				resolve(false);
			}
		};
	}

	load() {
		if (!isObject(modStorage.cursedItems)) {
			modStorage.cursedItems = {};
		} else {
			for (const [group, info] of Object.entries(modStorage.cursedItems)) {
				if (!AssetGroup.some(g => g.Name === group)) {
					console.warn(`BCX: Unknown cursed group ${group}, removing it`, info);
					delete modStorage.cursedItems[group];
					continue;
				}

				if (info === null)
					continue;

				if (!isObject(info) ||
					typeof info.Name !== "string" ||
					typeof info.curseProperty !== "boolean"
				) {
					console.error(`BCX: Bad data for cursed item in group ${group}, removing it`, info);
					delete modStorage.cursedItems[group];
					continue;
				}

				if (AssetGet("Female3DCG", group, info.Name) == null) {
					console.warn(`BCX: Unknown cursed item ${group}:${info.Name}, removing it`, info);
					delete modStorage.cursedItems[group];
					continue;
				}
			}
		}
	}

	run() {
		this.timer = setInterval(() => this.cursesTick(), CURSES_CHECK_INTERVAL);
	}

	unload() {
		if (this.timer !== null) {
			clearInterval(this.timer);
			this.timer = null;
		}
	}

	private cursesTick() {
		if (!ServerIsConnected || !modStorage.cursedItems)
			return;

		const lastState = JSON.stringify(modStorage.cursedItems);

		for (const [group, curse] of Object.entries(modStorage.cursedItems)) {

			if (curse === null) {
				const current = InventoryGet(Player, group);
				if (current) {
					InventoryRemove(Player, group, false);
					CharacterRefresh(Player, true);
					ChatRoomCharacterUpdate(Player);
					ChatRoomActionMessage(`${Player.Name}'s body seems to be cursed and the item turns into dust`);
					break;
				}
				continue;
			}


			const asset = AssetGet("Female3DCG", group, curse.Name);
			if (!asset) {
				console.error(`BCX: Asset not found for curse ${group}:${curse.Name}`, curse);
				continue;
			}

			let changeType: "" | "add" | "swap" | "update" | "color" = "";
			const CHANGE_TEXTS: Record<string, string> = {
				add: `The curse on ${Player.Name}'s ${asset.Description} wakes up and the item reappears`,
				swap: `The curse on ${Player.Name}'s ${asset.Description} wakes up, not allowing the item to be replaced by another item`,
				update: `The curse on ${Player.Name}'s ${asset.Description} wakes up and undos all changes to the item`,
				color: `The curse on ${Player.Name}'s ${asset.Description} wakes up, changing the color of the item back`
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
					Color: curse.Color != null ? JSON.parse(JSON.stringify(curse.Color)) : "Default",
					Property: curse.Property != null ? JSON.parse(JSON.stringify(curse.Property)) : {},
					Difficulty: curse.Difficulty != null ? curse.Difficulty : 0
				};
				Player.Appearance.push(currentItem);
				if (!changeType) changeType = "add";
			}

			const itemProperty = currentItem.Property = (currentItem.Property ?? {});
			let curseProperty = curse.Property ?? {};

			if (curse.curseProperty) {
				for (const key of arrayUnique(Object.keys(curseProperty).concat(Object.keys(itemProperty)))) {
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
						JSON.stringify(curseProperty[key]) !== JSON.stringify(itemProperty[key])
					) {
						itemProperty[key] = JSON.parse(JSON.stringify(curseProperty[key]));
						if (!changeType) changeType = "update";
					}
				}
			} else {
				curseProperty = JSON.parse(JSON.stringify(itemProperty));
			}

			if (Object.keys(curseProperty).length === 0) {
				delete curse.Property;
			} else {
				curse.Property = curseProperty;
			}

			if (JSON.stringify(currentItem.Color ?? "Default") !== JSON.stringify(curse.Color ?? "Default")) {
				if (curse.Color === undefined || curse.Color === "Default") {
					delete currentItem.Color;
				} else {
					currentItem.Color = JSON.parse(JSON.stringify(curse.Color));
				}
				if (!changeType) changeType = "color";
			}

			if (changeType) {
				CharacterRefresh(Player, true);
				ChatRoomCharacterUpdate(Player);
				if (CHANGE_TEXTS[changeType]) {
					ChatRoomActionMessage(CHANGE_TEXTS[changeType]);
				} else {
					console.error(`BCX: No chat message for curse action ${changeType}`);
				}
				break;
			}
		}

		if (JSON.stringify(modStorage.cursedItems) !== lastState) {
			modStorageSync();
		}
	}

	// TODO: dev functions
	public curseGroup(Group: string, curseProperty: boolean, character: ChatroomCharacter | null): boolean {
		return curseItem(Group, curseProperty, character);
	}

	public uncurseGroup(Group: string, character: ChatroomCharacter | null): boolean {
		return curseLift(Group, character);
	}
}
