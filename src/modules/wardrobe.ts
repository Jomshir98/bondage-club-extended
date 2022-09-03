import { allowMode, isNModClient, isBind, isCloth, DrawImageEx, itemColorsEquals, ChatRoomSendLocal, InfoBeep, isCosplay, isBody, smartGetAssetGroup } from "../utilsClub";
import { BaseModule } from "./_BaseModule";
import { hookFunction, patchFunction } from "../patching";
import { arrayUnique, clipboardAvailable, isObject } from "../utils";

import isEqual from "lodash-es/isEqual";
import cloneDeep from "lodash-es/cloneDeep";
import { RedirectGetImage } from "./miscPatches";
import { curseMakeSavedProperty, CURSE_IGNORED_EFFECTS, CURSE_IGNORED_PROPERTIES } from "./curses";
import { BCX_setTimeout } from "../BCXContext";
import { Command_pickAutocomplete, Command_selectWornItem, Command_selectWornItemAutocomplete, registerCommandParsed } from "./commands";
import { getChatroomCharacter, getPlayerCharacter } from "../characters";
import { AccessLevel, registerPermission } from "./authority";
import { ModuleCategory, Preset } from "../constants";
import { ExtendedWardrobeInit, GuiWardrobeExtended } from "../gui/wardrobe_extended";
import { modStorage } from "./storage";
import zod, { ZodType } from "zod";

export function j_WardrobeExportSelectionClothes(includeBinds: boolean = false): string {
	if (!CharacterAppearanceSelection) return "";
	const save = CharacterAppearanceSelection.Appearance
		.filter(WardrobeImportMakeFilterFunction({
			cloth: true,
			cosplay: true,
			body: true, // TODO: Toggle
			binds: includeBinds,
			collar: includeBinds
		}))
		.map((i) => ({
			...WardrobeAssetBundle(i),
			Craft: ValidationVerifyCraftData(i.Craft)
		}));
	return LZString.compressToBase64(JSON.stringify(save));
}

export function parseWardrobeImportData(data: string): string | ItemBundle[] {
	if (typeof data !== "string" || !data.trim()) return "Import error: No data";
	try {
		if (data[0] !== "[") {
			const decompressed = LZString.decompressFromBase64(data);
			if (!decompressed) return "Import error: Bad data";
			data = decompressed;
		}
		const parsedData = JSON.parse(data) as ItemBundle[];
		if (!Array.isArray(parsedData)) return "Import error: Bad data";
		return parsedData;
	} catch (error) {
		console.warn(error);
		return "Import error: Bad data";
	}
}

export function itemMergeProperties(sourceProperty: Partial<ItemProperties> | undefined, targetProperty: Partial<ItemProperties> | undefined, {
	includeNoncursableProperties = false,
	lockAssignMemberNumber
}: {
	includeNoncursableProperties?: boolean;
	lockAssignMemberNumber?: number;
} = {}): Partial<ItemProperties> | undefined {

	const itemProperty = cloneDeep(sourceProperty ?? {});
	targetProperty = cloneDeep(targetProperty ?? {});

	// Lock assignment MemberNumber can be overridden if locks are being applied
	if (lockAssignMemberNumber != null) {
		if (targetProperty.LockedBy) {
			if (itemProperty.LockedBy === targetProperty.LockedBy && typeof itemProperty.LockMemberNumber === "number") {
				targetProperty.LockMemberNumber = itemProperty.LockMemberNumber;
			} else {
				targetProperty.LockMemberNumber = lockAssignMemberNumber;
			}
		} else {
			delete targetProperty.LockMemberNumber;
		}
	}

	for (const key of arrayUnique(Object.keys(targetProperty).concat(Object.keys(itemProperty))) as (keyof ItemProperties)[]) {
		// Effects are handled separately
		if (key === "Effect")
			continue;

		// Curses skip some properties
		if (!includeNoncursableProperties && CURSE_IGNORED_PROPERTIES.includes(key))
			continue;

		// Update base properties
		if (targetProperty[key] === undefined) {
			if (itemProperty[key] !== undefined) {
				delete itemProperty[key];
			}
		} else if (typeof targetProperty[key] !== typeof itemProperty[key] ||
			!isEqual(targetProperty[key], itemProperty[key])
		) {
			itemProperty[key] = cloneDeep(targetProperty[key]) as any;
		}
	}

	// Update effects
	const itemIgnoredEffects = !Array.isArray(itemProperty.Effect) ? [] :
		itemProperty.Effect.filter(i => !includeNoncursableProperties && CURSE_IGNORED_EFFECTS.includes(i));

	const itemEffects = !Array.isArray(itemProperty.Effect) ? [] :
		itemProperty.Effect.filter(i => includeNoncursableProperties || !CURSE_IGNORED_EFFECTS.includes(i)).sort();

	const curseEffects = !Array.isArray(targetProperty.Effect) ? [] :
		targetProperty.Effect.filter(i => includeNoncursableProperties || !CURSE_IGNORED_EFFECTS.includes(i)).sort();

	if (!isEqual(new Set(itemEffects), new Set(curseEffects))) {
		itemProperty.Effect = curseEffects.concat(itemIgnoredEffects);
	}

	if (Object.keys(targetProperty).length === 0) {
		return undefined;
	}
	return itemProperty;
}

export function WardrobeImportCheckChangesLockedItem(C: Character, data: ItemBundle[], allowReplace: (a: Item | Asset) => boolean): boolean {
	if (C.Appearance.some(a => isBind(a) && a.Property?.Effect?.includes("Lock"))) {
		// Looks for all locked items and items blocked by locked items and checks, that none of those change by the import
		// First find which groups should match
		const matchedGroups: Set<string> = new Set();
		const test = (item: Item) => {
			if (isBind(item)) {
				// For each blocked group
				for (const block of (item.Asset.Block || []).concat(Array.isArray(item.Property?.Block) ? item.Property!.Block : [])) {
					if (matchedGroups.has(block) || !AssetGroup.some(g => g.Name === block))
						continue;
					matchedGroups.add(block);
					const item2 = C.Appearance.find(a => a.Asset.Group.Name === block);
					if (item2) {
						test(item2);
					}
				}
			}
		};
		for (const a of C.Appearance) {
			if (a.Property?.Effect?.includes("Lock") && !matchedGroups.has(a.Asset.Group.Name)) {
				matchedGroups.add(a.Asset.Group.Name);
				test(a);
			}
		}
		// Then test all required groups to match
		for (const testedGroup of matchedGroups) {
			const currentItem = C.Appearance.find(a => a.Asset.Group.Name === testedGroup);
			const newItem = data.find(b => b.Group === testedGroup);
			if (!currentItem) {
				if (newItem) {
					return true;
				} else {
					continue;
				}
			}
			if (!allowReplace(currentItem))
				continue;
			if (
				!newItem ||
				currentItem.Asset.Name !== newItem.Name ||
				!itemColorsEquals(currentItem.Color, newItem.Color) ||
				!isEqual(currentItem.Property ?? {}, itemMergeProperties(currentItem.Property, newItem.Property, {
					includeNoncursableProperties: true,
					lockAssignMemberNumber: Player.MemberNumber
				}) ?? {})
			) {
				return true;
			}
		}
	}
	return false;
}

export function WardrobeImportMakeFilterFunction({
	cloth,
	cosplay,
	body,
	binds,
	collar
}: {
	cloth: boolean;
	cosplay: boolean;
	body: boolean;
	binds: boolean;
	collar: boolean;
}): (a: Item | Asset) => boolean {
	return (a: Item | Asset) => (
		(cloth && isCloth(a, false)) ||
		(cosplay && isCosplay(a)) ||
		(body && isBody(a)) ||
		(binds && isBind(a, ["ItemNeck", "ItemNeckAccessories", "ItemNeckRestraints"])) ||
		(collar && isBind(a, []) && ["ItemNeck", "ItemNeckAccessories", "ItemNeckRestraints"].includes(smartGetAssetGroup(a).Name))
	);
}

export function ValidationCanAccessCheck(character: Character, group: AssetGroupName, item: string, type: string | undefined | null): boolean {
	const playerNumber = getPlayerCharacter().MemberNumber;
	return (
		(type == null || ValidationCanAccessCheck(character, group, item, undefined)) &&
		!ValidationIsItemBlockedOrLimited(character, playerNumber, group, item) &&
		(!character.IsPlayer() || !InventoryIsPermissionBlocked(character, item, group))
	);
}

export const CraftedItemProperties_schema: ZodType<CraftedItemProperties> = zod.object({
	Name: zod.string(),
	MemberName: zod.string().optional(),
	MemberNumber: zod.number().int().optional(),
	Description: zod.string(),
	Property: zod.string()
});
export function ValidationVerifyCraftData(Craft: unknown): CraftedItemProperties | undefined {
	try {
		return CraftedItemProperties_schema.parse(Craft);
	} catch (_) {
		return undefined;
	}
}

export function WardrobeDoImport(C: Character, data: ItemBundle[], filter: (a: Item | Asset) => boolean, includeLocks: boolean | ReadonlySet<string>): void {
	const playerNumber = getPlayerCharacter().MemberNumber;
	const validationParams = ValidationCreateDiffParams(C, playerNumber);

	const dataGroups = new Set<string>();
	data.forEach(a => dataGroups.add(a.Group));
	C.Appearance = C.Appearance.filter(a => !ValidationCanRemoveItem(a, validationParams, dataGroups.has(a.Asset.Group.Name)) || !filter(a));
	for (const cloth of data) {
		if (
			C.Appearance.some(a => a.Asset.Group.Name === cloth.Group) ||
			!ValidationCanAccessCheck(C, cloth.Group as AssetGroupName, cloth.Name, cloth.Property?.Type)
		) {
			continue;
		}
		const A = AssetGet(C.AssetFamily, cloth.Group, cloth.Name);
		if (A != null) {
			if (filter(A)) {
				CharacterAppearanceSetItem(C, cloth.Group, A, cloth.Color, 0, undefined, false);
				const item = InventoryGet(C, cloth.Group);
				if (cloth.Property && item) {
					if (!isObject(cloth.Property)) {
						item.Property = cloneDeep(cloth.Property);
					} else {
						item.Property = itemMergeProperties(item.Property, cloth.Property, {
							includeNoncursableProperties: (
								typeof cloth.Property.LockedBy === "string" &&
								ValidationCanAccessCheck(C, "ItemMisc", cloth.Property.LockedBy, undefined) &&
								(!C.IsPlayer() || !InventoryIsPermissionBlocked(C, cloth.Property.LockedBy, "ItemMisc")) &&
								(includeLocks === true || (typeof includeLocks !== "boolean" && includeLocks.has(cloth.Property.LockedBy)))
							),
							lockAssignMemberNumber: Player.MemberNumber
						});
					}
					item.Craft = ValidationVerifyCraftData(cloth.Craft);
				}
			}
		} else {
			console.warn(`Clothing not found: `, cloth);
		}
	}

	CharacterRefresh(C, true);
}

export function j_WardrobeImportSelectionClothes(data: string | ItemBundle[], includeBinds: boolean, force: boolean = false): string {
	if (!Array.isArray(data)) {
		data = parseWardrobeImportData(data);
		if (typeof data === "string")
			return data;
	}
	const C = CharacterAppearanceSelection;
	if (!C) {
		return "Import error: No character";
	}
	if (C.MemberNumber !== j_WardrobeBindsAllowedCharacter && includeBinds) {
		return "Import error: Not allowed to import items";
	}

	const Allow = WardrobeImportMakeFilterFunction({
		cloth: true,
		cosplay: C.OnlineSharedSettings?.BlockBodyCosplay !== true || C.IsPlayer(),
		body: false,
		binds: includeBinds,
		collar: false
	});

	if (includeBinds && !force && WardrobeImportCheckChangesLockedItem(C, data, Allow))
		return "Refusing to change locked item!";

	// Check if everything (except ignored properties) matches
	let fullMatch = includeBinds;
	if (includeBinds) {
		for (const group of arrayUnique(C.Appearance.filter(Allow).map<string>(item => item.Asset.Group.Name).concat(data.map(item => item.Group)))) {
			const wornItem = C.Appearance.find(item => item.Asset.Group.Name === group);
			const bundleItem = data.find(item => item.Group === group);
			if (
				!wornItem ||
				!bundleItem ||
				wornItem.Asset.Name !== bundleItem.Name ||
				!itemColorsEquals(wornItem.Color, bundleItem.Color) ||
				!isEqual(curseMakeSavedProperty(wornItem.Property), curseMakeSavedProperty(bundleItem.Property))
			) {
				fullMatch = false;
			}
		}
	}

	WardrobeDoImport(C, data, Allow, fullMatch);

	return (!fullMatch &&
		includeBinds &&
		data.some(i => Array.isArray(i.Property?.Effect) && i.Property?.Effect.includes("Lock"))
	) ? "Imported! Repeat to also import locks." : "Imported!";
}

let j_WardrobeIncludeBinds = false;
let j_WardrobeBindsAllowedCharacter = -1;
let j_ShowHelp = false;
let holdingShift = false;

const helpText = "BCX's wardrobe export/import works by converting your appearance into a long code word that is copied to your device's clipboard. " +
	"You can then paste it anywhere you like, for instance a text file. You can wear the look again by copying the code word to " +
	"the clipboard and importing it with the according button. Functionality of this feature depends on the device you " +
	"are using and if the clipboard can be used on it. Importing has two modes: quick and extended. The default behavior when importing is the extended mode, " +
	"but you can use the quick one when you hold the 'Shift' button while importing. This behavior can be switched around in the misc module settings. " +
	"The button to the left of the 'Export'-button toggles whether items/restraints on your character should also " +
	"be exported or imported while using quick mode. Using quick mode, importing with items has two stages: First usage adds no locks, second one also " +
	"imports locks from the exported items. Importing an outfit with restraints will fail if it would change any item that is locked (or blocked by a locked item), " +
	"except collars, neck accessories/restraints. Those, as well as the body itself, are ignored.";

function PasteListener(ev: ClipboardEvent) {
	if (CurrentScreen === "Appearance" && CharacterAppearanceMode === "Wardrobe" || CurrentScreen === "Wardrobe") {
		ev.preventDefault();
		ev.stopImmediatePropagation();
		const data = ((ev.clipboardData || (window as any).clipboardData) as DataTransfer).getData("text");
		const res = useExtendedImport() ? openExtendedImport(data) : j_WardrobeImportSelectionClothes(data, j_WardrobeIncludeBinds, allowMode);
		if (res) {
			CharacterAppearanceWardrobeText = res;
		}
	}
}

function KeyChangeListener(ev: KeyboardEvent) {
	holdingShift = ev.shiftKey;
}

let searchBar: HTMLInputElement | null = null;

function enterSearchMode(C: Character) {
	if (!searchBar) {
		searchBar = ElementCreateInput("BCXSearch", "text", "", "40");
		searchBar.oninput = () => {
			DialogInventoryBuild(C);
			AppearanceMenuBuild(C);
		};
		searchBar.focus();
		DialogInventoryBuild(C);
		AppearanceMenuBuild(C);
	}
}

function exitSearchMode(C: Character) {
	if (searchBar) {
		searchBar.remove();
		searchBar = null;
		DialogInventoryBuild(C);
		AppearanceMenuBuild(C);
	}
}

let appearanceOverrideScreen: GuiWardrobeExtended | null = null;
function useExtendedImport(): boolean {
	return (modStorage.wardrobeDefaultExtended ?? false) !== holdingShift;
}

function openExtendedImport(data: string | ItemBundle[], baseAllowBinds: boolean = true): string | null {
	const parsedData = Array.isArray(data) ? data : parseWardrobeImportData(data);
	if (typeof parsedData === "string")
		return parsedData;

	const C = CharacterAppearanceSelection;
	if (!C) {
		return "Import error: No character";
	}
	const allowBinds = baseAllowBinds && C.MemberNumber === j_WardrobeBindsAllowedCharacter;

	setAppearanceOverrideScreen(new GuiWardrobeExtended(
		setAppearanceOverrideScreen,
		C,
		allowBinds,
		parsedData
	));
	return null;
}

function setAppearanceOverrideScreen(newScreen: GuiWardrobeExtended | null): void {
	if (appearanceOverrideScreen) {
		appearanceOverrideScreen.Unload();
		appearanceOverrideScreen = null;
	}
	appearanceOverrideScreen = newScreen;
	if (newScreen) {
		newScreen.Load();
	}
}

export class ModuleWardrobe extends BaseModule {

	override init(): void {
		registerPermission("misc_wardrobe_item_import", {
			name: "Allow importing items using wardrobe",
			category: ModuleCategory.Misc,
			defaults: {
				[Preset.dominant]: [true, AccessLevel.whitelist],
				[Preset.switch]: [true, AccessLevel.friend],
				[Preset.submissive]: [true, AccessLevel.friend],
				[Preset.slave]: [true, AccessLevel.friend]
			}
		});

		ExtendedWardrobeInit();
	}

	load() {

		if (typeof modStorage.wardrobeDefaultExtended !== "boolean") {
			modStorage.wardrobeDefaultExtended = true;
		}

		const NMod = isNModClient();
		const NModWardrobe = NMod && typeof AppearanceMode !== "undefined";

		hookFunction("CharacterAppearanceLoadCharacter", 0, (args, next) => {
			const C = args[0] as Character;
			const char = C.MemberNumber && getChatroomCharacter(C.MemberNumber);
			if (char && char.BCXVersion != null) {
				char.getPermissionAccess("misc_wardrobe_item_import")
					.then(res => {
						if (res) {
							j_WardrobeBindsAllowedCharacter = char.MemberNumber;
						} else {
							j_WardrobeBindsAllowedCharacter = -1;
						}
					})
					.catch(err => {
						console.warn("BCX: Failed to get permission to import wardrobe restraints:", err);
						j_WardrobeBindsAllowedCharacter = -1;
					});
			} else {
				j_WardrobeBindsAllowedCharacter = -1;
			}
			return next(args);
		});

		patchFunction("AppearanceRun", {
			'DrawButton(1820, 430 + (W - CharacterAppearanceWardrobeOffset) * 95, 160, 65, "Save"': 'DrawButton(1860, 430 + (W - CharacterAppearanceWardrobeOffset) * 95, 120, 65, "Save"'
		});

		patchFunction("AppearanceRun", {
			"DrawButton(1300, 430 + (W - CharacterAppearanceWardrobeOffset) * 95, 500,": "DrawButton(1385, 430 + (W - CharacterAppearanceWardrobeOffset) * 95, 455,"
		});

		patchFunction("AppearanceRun", {
			"1550, 463 + (W - CharacterAppearanceWardrobeOffset) * 95, 496,": "1614, 463 + (W - CharacterAppearanceWardrobeOffset) * 95, 446,"
		});

		hookFunction("AppearanceRun", 7, (args, next) => {
			if (appearanceOverrideScreen) {
				return appearanceOverrideScreen.Run();
			}

			return next(args);
		});

		hookFunction("AppearanceRun", 2, (args, next) => {
			next(args);
			if (CharacterAppearanceMode === "Wardrobe" || NModWardrobe && AppearanceMode === "Wardrobe") {
				if (clipboardAvailable) {
					const Y = NModWardrobe ? 265 : 125;
					DrawButton(1380, Y, 50, 50, "", "White", "", "How does it work?");
					DrawImageEx("Icons/Question.png", 1380 + 3, Y + 3, { Width: 44, Height: 44 });
					const C = CharacterAppearanceSelection;
					const allowBinds = C != null && j_WardrobeBindsAllowedCharacter === C.MemberNumber;
					DrawButton(1457, Y, 50, 50, "", allowBinds ? "White" : j_WardrobeIncludeBinds ? "pink" : "#ddd", "", "Include items/restraints");
					DrawImageEx("../Icons/Bondage.png", 1457 + 6, Y + 6, { Alpha: j_WardrobeIncludeBinds ? 1 : 0.2, Width: 38, Height: 38 });
					DrawButton(1534, Y, 207, 50, "Export", "White", "");
					DrawButton(1768, Y, 207, 50, "Import", (!allowBinds && j_WardrobeIncludeBinds) ? "#ddd" : "White", "", undefined, !allowBinds && j_WardrobeIncludeBinds);
				}
				if (Player.Wardrobe) {
					for (let W = CharacterAppearanceWardrobeOffset; W < Player.Wardrobe.length && W < CharacterAppearanceWardrobeOffset + 6; W++) {
						DrawButton(1300, 430 + (W - CharacterAppearanceWardrobeOffset) * 95, 65, 65, "", "White", "");
						DrawImageEx("./Icons/DialogPermissionMode.png", 1300 + 6, 430 + (W - CharacterAppearanceWardrobeOffset) * 95 + 6, { Width: 53, Height: 53 });
					}
				}
			}
			if (j_ShowHelp && (CharacterAppearanceMode === "Wardrobe" || NModWardrobe && AppearanceMode === "Wardrobe")) {
				MainCanvas.fillStyle = "#ffff88";
				MainCanvas.fillRect(30, 190, 1240, 780);
				MainCanvas.strokeStyle = "Black";
				MainCanvas.strokeRect(30, 190, 1240, 780);
				MainCanvas.textAlign = "left";
				DrawTextWrap(helpText, 30 - 1160 / 2, 210, 1200, 740, "black");
				MainCanvas.textAlign = "center";
			}
		});

		patchFunction("AppearanceClick", {
			"(MouseX >= 1300) && (MouseX < 1800)": "(MouseX >= 1385) && (MouseX < 1385 + 455)"
		});

		patchFunction("AppearanceClick", {
			"(MouseX >= 1820) && (MouseX < 1975)": "(MouseX >= 1860) && (MouseX < 1980)"
		});

		hookFunction("AppearanceClick", 7, (args, next) => {
			if (appearanceOverrideScreen) {
				return appearanceOverrideScreen.Click();
			}

			return next(args);
		});

		hookFunction("AppearanceClick", 2, (args, next) => {
			if (CharacterAppearanceMode === "Wardrobe" || NModWardrobe && AppearanceMode === "Wardrobe") {
				if (clipboardAvailable) {
					const Y = NModWardrobe ? 265 : 125;
					// Help text toggle
					if (MouseIn(1380, Y, 50, 50) || (MouseIn(30, 190, 1240, 780) && j_ShowHelp)) {
						j_ShowHelp = !j_ShowHelp;
						return;
					}
					// Restraints toggle
					if (MouseIn(1457, Y, 50, 50)) {
						j_WardrobeIncludeBinds = !j_WardrobeIncludeBinds;
						return;
					}
					// Export
					if (MouseIn(1534, Y, 207, 50)) {
						BCX_setTimeout(async () => {
							await navigator.clipboard.writeText(j_WardrobeExportSelectionClothes(j_WardrobeIncludeBinds));
							CharacterAppearanceWardrobeText = "Copied to clipboard!";
						}, 0);
						return;
					}
					// Import
					if (MouseIn(1768, Y, 207, 50)) {
						BCX_setTimeout(async () => {
							if (typeof navigator.clipboard.readText !== "function") {
								CharacterAppearanceWardrobeText = "Please press Ctrl+V";
								return;
							}
							const data = await navigator.clipboard.readText();
							const res = useExtendedImport() ? openExtendedImport(data) : j_WardrobeImportSelectionClothes(data, j_WardrobeIncludeBinds, allowMode);
							if (res) {
								CharacterAppearanceWardrobeText = res;
							}
						}, 0);
						return;
					}
				}
				if (Array.isArray(Player.Wardrobe) && MouseIn(1300, 430, 65, 540)) {
					for (let W = CharacterAppearanceWardrobeOffset; W < Player.Wardrobe.length && W < CharacterAppearanceWardrobeOffset + 6; W++) {
						if (MouseYIn(430 + (W - CharacterAppearanceWardrobeOffset) * 95, 65)) {

							let slot = Player.Wardrobe[W];
							if (Array.isArray(slot)) {
								// NMod unpack
								if (slot.some(i => Array.isArray(i)) && typeof WardrobeExtractBundle === "function") {
									slot = slot.map(i => Array.isArray(i) ? WardrobeExtractBundle(i) : i);
								}
								if (slot.every(i => isObject(i)) && openExtendedImport(slot, false) === null) {
									return;
								}
							}
							return;
						}
					}
				}
			}
			next(args);
		});

		hookFunction("AppearanceExit", 7, (args, next) => {
			if (appearanceOverrideScreen) {
				return appearanceOverrideScreen.Exit();
			}

			return next(args);
		});

		hookFunction("WardrobeRun", 7, (args, next) => {
			if (appearanceOverrideScreen) {
				return appearanceOverrideScreen.Run();
			}

			return next(args);
		});

		hookFunction("WardrobeRun", 2, (args, next) => {
			next(args);
			if (clipboardAvailable) {
				const Y = 90;
				DrawButton(1000, Y, 50, 50, "", "White", "", "How does it work?");
				DrawImageEx("Icons/Question.png", 1000 + 3, Y + 3, { Width: 44, Height: 44 });
				const C = CharacterAppearanceSelection;
				const allowBinds = C != null && j_WardrobeBindsAllowedCharacter === C.MemberNumber;
				DrawButton(425, Y, 50, 50, "", allowBinds ? "White" : j_WardrobeIncludeBinds ? "pink" : "#ddd", "", "Include items/restraints");
				DrawImageEx("../Icons/Bondage.png", 425 + 6, Y + 6, { Alpha: j_WardrobeIncludeBinds ? 1 : 0.2, Width: 38, Height: 38 });
				DrawButton(750, Y, 225, 50, "Export", "White", "");
				DrawButton(500, Y, 225, 50, "Import", (!allowBinds && j_WardrobeIncludeBinds) ? "#ddd" : "White", "", undefined, !allowBinds && j_WardrobeIncludeBinds);
			}
			if (j_ShowHelp) {
				MainCanvas.fillStyle = "#ffff88";
				MainCanvas.fillRect(30, 190, 1240, 780);
				MainCanvas.strokeStyle = "Black";
				MainCanvas.strokeRect(30, 190, 1240, 780);
				MainCanvas.textAlign = "left";
				DrawTextWrap(helpText, 30 - 1160 / 2, 210, 1200, 740, "black");
				MainCanvas.textAlign = "center";
			}
		});

		hookFunction("WardrobeClick", 7, (args, next) => {
			if (appearanceOverrideScreen) {
				return appearanceOverrideScreen.Click();
			}

			return next(args);
		});

		hookFunction("WardrobeClick", 2, (args, next) => {
			if (clipboardAvailable) {
				const Y = 90;
				// Help text toggle
				if (MouseIn(1000, Y, 50, 50) || (MouseIn(30, 190, 1240, 780) && j_ShowHelp)) {
					j_ShowHelp = !j_ShowHelp;
					return;
				}
				// Restraints toggle
				if (MouseIn(425, Y, 50, 50)) {
					j_WardrobeIncludeBinds = !j_WardrobeIncludeBinds;
					return;
				}
				// Export
				if (MouseIn(750, Y, 225, 50)) {
					BCX_setTimeout(async () => {
						await navigator.clipboard.writeText(j_WardrobeExportSelectionClothes(j_WardrobeIncludeBinds));
						InfoBeep("Copied to clipboard!", 5_000);
					}, 0);
					return;
				}
				// Import
				if (MouseIn(500, Y, 225, 50)) {
					BCX_setTimeout(async () => {
						if (typeof navigator.clipboard.readText !== "function") {
							InfoBeep("Please press Ctrl+V", 5_000);
							return;
						}
						const data = await navigator.clipboard.readText();
						const res = useExtendedImport() ? openExtendedImport(data) : j_WardrobeImportSelectionClothes(data, j_WardrobeIncludeBinds, allowMode);
						if (res) {
							InfoBeep(res, 5_000);
						}
					}, 0);
					return;
				}
			}
			next(args);
		});

		document.addEventListener("paste", PasteListener);
		document.addEventListener("keydown", KeyChangeListener, { capture: true, passive: true });
		document.addEventListener("keyup", KeyChangeListener, { capture: true, passive: true });

		//#region Search bar

		RedirectGetImage("Icons/BCX_Search.png", "Icons/Search.png");
		RedirectGetImage("Icons/BCX_SearchExit.png", "Icons/Remove.png");

		hookFunction("TextGet", 0, (args, next) => {
			if (args[0] === "BCX_Search") {
				return "Filter items";
			} else if (args[0] === "BCX_SearchExit") {
				return "";
			}
			return next(args);
		});

		hookFunction("AppearanceMenuBuild", 5, (args, next) => {
			next(args);
			const C = args[0] as Character;
			if (CharacterAppearanceMode !== "Cloth") {
				exitSearchMode(C);
			} else if (searchBar) {
				AppearanceMenu = [];
				if (DialogInventory.length > 9) AppearanceMenu.push("Next");
				AppearanceMenu.push("BCX_SearchExit");
				if (!DialogItemPermissionMode) AppearanceMenu.push("Cancel");
				AppearanceMenu.push("Accept");
			} else {
				AppearanceMenu.splice(AppearanceMenu.length - (AppearanceMenu.includes("Cancel") ? 2 : 1), 0, "BCX_Search");
			}
		});

		hookFunction("AppearanceMenuClick", 4, (args, next) => {
			const X = 2000 - AppearanceMenu.length * 117;
			const C = args[0] as Character;
			for (let B = 0; B < AppearanceMenu.length; B++) {
				if (MouseXIn(X + 117 * B, 90)) {
					const Button = AppearanceMenu[B];
					if (Button === "BCX_Search") {
						enterSearchMode(C);
						return;
					} else if (Button === "BCX_SearchExit") {
						exitSearchMode(C);
						return;
					}
				}
			}
			next(args);
		});

		hookFunction("DialogInventoryAdd", 5, (args, next) => {
			if (searchBar) {
				const item = args[1] as Item;
				if (!searchBar.value
					.trim()
					.toLocaleLowerCase()
					.split(" ")
					.every(i =>
						item.Asset.Description.toLocaleLowerCase().includes(i) ||
						item.Asset.Name.toLocaleLowerCase().includes(i)
					)
				) {
					return;
				}
			}
			next(args);
		});

		hookFunction("AppearanceMenuDraw", 0, (args, next) => {
			if (searchBar) {
				ElementPositionFix("BCXSearch", 40, 900, 35, 600, 60);
			}
			next(args);
		});

		//#endregion

		registerCommandParsed(
			"utility",
			"wardrobe",
			"- Several convenience wardrobe shortcuts. Use '.wardrobe' for more help",
			(args) => {
				const subcommand = (args[0] || "").toLowerCase();

				if (subcommand === "export") {
					if (!clipboardAvailable) {
						ChatRoomSendLocal("Error: Your clipboard is not usable.");
						return false;
					}
					if (!CharacterAppearanceSelection) CharacterAppearanceSelection = Player;
					BCX_setTimeout(async () => {
						await navigator.clipboard.writeText(j_WardrobeExportSelectionClothes(true));
						ChatRoomSendLocal("Success: Exported to clipboard");
					}, 0);
				} else if (subcommand === "quickload") {
					if (!Player.CanChangeOwnClothes()) {
						ChatRoomSendLocal("You are unable to change clothes right now.");
						return false;
					}
					const slot = args.length === 2 && /^[0-9]+$/.test(args[1]) && Number.parseInt(args[1], 10);
					if (!slot || slot < 1) {
						ChatRoomSendLocal(`Needs a <number> greater 0 in '.wardrobe ${subcommand} <number>'`);
						return false;
					}
					WardrobeFastLoad(Player, slot - 1, true);
				} else if (subcommand === "strip") {
					if (!Player.CanInteract()) {
						ChatRoomSendLocal("You are too restrained to use this right now.");
						return false;
					}
					if (args.length !== 2) {
						ChatRoomSendLocal(`Needs the name of a currently worn clothing behind '.wardrobe ${subcommand}'`);
						return false;
					}
					const item = Command_selectWornItem(getPlayerCharacter(), args[1], i => isCloth(i, true));
					if (typeof item === "string") {
						ChatRoomSendLocal(item);
						return false;
					}
					InventoryRemove(Player, item.Asset.Group.Name);
					ChatRoomCharacterUpdate(Player);
				} else if (subcommand === "stripall") {
					if (!Player.CanInteract()) {
						ChatRoomSendLocal("You are too restrained to use this right now.");
						return false;
					}
					CharacterAppearanceStripLayer(Player);
					ChatRoomCharacterUpdate(Player);
				} else {
					ChatRoomSendLocal(
						`Usage:\n` +
						`.wardrobe export - Exports outfit string to the clipboard (including restraints)\n` +
						`.wardrobe quickload <number> - Changes current outfit to the according BC wardrobe slot if you can\n` +
						`.wardrobe strip <clothing> - Removes the named clothing if you can\n` +
						`.wardrobe stripall - Removes all clothes in layered steps (like the wardrobe button)\n`
					);
				}
				return true;
			},
			(argv) => {
				const subcommand = argv[0].toLowerCase();
				if (argv.length <= 1) {
					return Command_pickAutocomplete(subcommand, ["export", "quickload", "strip", "stripall"]);
				}
				if (subcommand === "strip" && argv.length === 2) {
					return Command_selectWornItemAutocomplete(getPlayerCharacter(), argv[1], i => isCloth(i, true));
				}
				return [];
			}
		);
	}

	unload() {
		document.removeEventListener("paste", PasteListener);
		document.removeEventListener("keydown", KeyChangeListener, { capture: true });
		document.removeEventListener("keyup", KeyChangeListener, { capture: true });
		exitSearchMode(CharacterAppearanceSelection ?? Player);
		setAppearanceOverrideScreen(null);
		AppearanceMenuBuild(CharacterAppearanceSelection ?? Player);
	}
}
