import { allowMode, isBind, isCloth, itemColorsEquals, ChatRoomSendLocal, isCosplay, isBody, smartGetAssetGroup } from "../utilsClub";
import { BaseModule } from "./_BaseModule";
import { hookFunction } from "../patching";
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

export function j_WardrobeExportSelectionClothes(character: Character, includeBinds: boolean = false): string {
	if (!character) return "";
	const save = character.Appearance
		.filter(WardrobeImportMakeFilterFunction({
			cloth: true,
			cosplay: true,
			body: true, // TODO: Toggle
			binds: includeBinds,
			collar: includeBinds,
			piercings: includeBinds,
		}))
		.map((i) => ({
			...WardrobeAssetBundle(i),
			Craft: ValidationVerifyCraftData(i.Craft, i.Asset).result,
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
	lockAssignMemberNumber,
}: {
	includeNoncursableProperties?: boolean;
	lockAssignMemberNumber?: number;
} = {}): Partial<ItemProperties> {

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
		if (!includeNoncursableProperties && CURSE_IGNORED_PROPERTIES.has(key))
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

	return itemProperty;
}

export function WardrobeImportCheckChangesLockedItem(C: Character, data: ItemBundle[], allowReplace: (a: Item | Asset) => boolean): boolean {
	if (C.Appearance.some(a => isBind(a) && a.Property?.Effect?.includes("Lock"))) {
		// Looks for all locked items and items blocked by locked items and checks, that none of those change by the import
		// First find which groups should match
		const matchedGroups: Set<AssetGroupName> = new Set();
		const test = (item: Item) => {
			if (isBind(item)) {
				// For each blocked group
				for (const block of (item.Asset.Block || []).concat(Array.isArray(item.Property?.Block) ? item.Property.Block : [])) {
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
			const newAsset = newItem ? AssetGet("Female3DCG", testedGroup, newItem.Name) : null;
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
                !newAsset ||
				currentItem.Asset.Name !== newItem.Name ||
				!itemColorsEquals(currentItem.Color, newItem.Color, currentItem.Asset, newAsset) ||
				!isEqual(currentItem.Property ?? {}, itemMergeProperties(currentItem.Property, newItem.Property, {
					includeNoncursableProperties: true,
					lockAssignMemberNumber: Player.MemberNumber,
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
	collar,
	piercings,
}: {
	cloth: boolean;
	cosplay: boolean;
	body: boolean;
	binds: boolean;
	collar: boolean;
	piercings: boolean;
}): (a: Item | Asset) => boolean {
	return (a: Item | Asset) => (
		(cloth && isCloth(a, false)) ||
		(cosplay && isCosplay(a)) ||
		(body && isBody(a)) ||
		(binds && isBind(a, ["ItemNeck", "ItemNeckAccessories", "ItemNeckRestraints", "ItemNipplesPiercings", "ItemVulvaPiercings"])) ||
		(collar && isBind(a, []) && ["ItemNeck", "ItemNeckAccessories", "ItemNeckRestraints"].includes(smartGetAssetGroup(a).Name)) ||
		(piercings && isBind(a, []) && ["ItemNipplesPiercings", "ItemVulvaPiercings"].includes(smartGetAssetGroup(a).Name))
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

export function ValidationVerifyCraftData(Craft: unknown, Asset: Asset | null): {
	result: CraftingItem | undefined;
	messages: string[];
} {
	if (Craft === undefined) {
		return {
			result: undefined,
			messages: [],
		};
	}
	if (!isObject(Craft)) {
		return {
			result: undefined,
			messages: [`Expected object, got ${typeof Craft}`],
		};
	}
	const saved = console.warn;
	try {
		const messages: string[] = [];
		console.warn = (m: unknown) => {
			if (typeof m === "string") {
				messages.push(m);
			}
		};
		const result = CraftingValidate(Craft as CraftingItem, Asset, true);
		return {
			result: result > CraftingStatusType.CRITICAL_ERROR ? Craft as CraftingItem : undefined,
			messages,
		};
	} catch (error) {
		saved("BCX: Failed crafted data validation because of crash:", error);
		return {
			result: undefined,
			messages: [`Validation failed: ${error}`],
		};
	} finally {
		console.warn = saved;
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
			// TODO: It would be nice to check new TypeRecord here
			!ValidationCanAccessCheck(C, cloth.Group, cloth.Name, undefined)
		) {
			continue;
		}
		const A = AssetGet(C.AssetFamily, cloth.Group, cloth.Name);
		if (A != null) {
			if (filter(A)) {
				CharacterAppearanceSetItem(C, cloth.Group, A, cloth.Color);
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
							lockAssignMemberNumber: Player.MemberNumber,
						});
					}
					const craftValidation = ValidationVerifyCraftData(cloth.Craft, A);
					if (craftValidation.messages.length > 0) {
						console.warn(`BCX: Crafted item validation failed:\n${craftValidation.messages.join("\n")}`);
					}
					item.Craft = craftValidation.result;
				}
			}
		} else {
			console.warn(`Clothing not found: `, cloth);
		}
	}

	CharacterRefresh(C, false);
}

export function j_WardrobeImportSelectionClothes(character: Character, data: string | ItemBundle[], includeBinds: boolean, force: boolean = false): string {
	if (!Array.isArray(data)) {
		data = parseWardrobeImportData(data);
		if (typeof data === "string")
			return data;
	}
	if (!character) {
		return "Import error: No character";
	}
	if (character.MemberNumber !== j_WardrobeBindsAllowedCharacter && includeBinds) {
		return "Import error: Not allowed to import items";
	}

	const Allow = WardrobeImportMakeFilterFunction({
		cloth: true,
		cosplay: character.OnlineSharedSettings?.BlockBodyCosplay !== true || character.IsPlayer(),
		body: false,
		binds: includeBinds,
		collar: false,
		piercings: includeBinds,
	});

	if (includeBinds && !force && WardrobeImportCheckChangesLockedItem(character, data, Allow))
		return "Refusing to change locked item!";

	// Check if everything (except ignored properties) matches
	let fullMatch = includeBinds;
	if (includeBinds) {
		for (const group of arrayUnique(character.Appearance.filter(Allow).map<AssetGroupName>(item => item.Asset.Group.Name).concat(data.map(item => item.Group)))) {
			const wornItem = character.Appearance.find(item => item.Asset.Group.Name === group);
			const bundleItem = data.find(item => item.Group === group);
			const bundleAsset = bundleItem ? AssetGet("Female3DCG", group, bundleItem.Name) : null;
			if (
				!wornItem ||
				!bundleItem ||
                !bundleAsset ||
				wornItem.Asset.Name !== bundleItem.Name ||
				!itemColorsEquals(wornItem.Color, bundleItem.Color, wornItem.Asset, bundleAsset) ||
				!isEqual(curseMakeSavedProperty(wornItem.Property), curseMakeSavedProperty(bundleItem.Property))
			) {
				fullMatch = false;
			}
		}
	}

	WardrobeDoImport(character, data, Allow, fullMatch);

	return (!fullMatch &&
		includeBinds &&
		data.some(i => Array.isArray(i.Property?.Effect) && i.Property?.Effect.includes("Lock"))
	) ? "Imported! Repeat to also import locks." : "Imported!";
}

let j_WardrobeIncludeBinds = false;
let j_WardrobeBindsAllowedCharacter = -1;
// eslint-disable-next-line @typescript-eslint/no-unused-vars, prefer-const
let j_ShowHelp = false;
let holdingShift = false;

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const helpText = "BCX's wardrobe export/import works by converting your appearance into a long code word that is copied to your device's clipboard. " +
	"You can then paste it anywhere you like, for instance a text file. You can wear the look again by copying the code word to " +
	"the clipboard and importing it with the according button. Functionality of this feature depends on the device you " +
	"are using and if the clipboard can be used on it. Importing has two modes: quick and extended. The default behavior when importing is the extended mode, " +
	"but you can use the quick one when you hold the 'Shift' button while importing. This behavior can be switched around in the misc module settings. " +
	"The button to the left of the 'Export'-button toggles whether items/restraints on your character should also " +
	"be exported or imported while using quick mode. Using quick mode, importing with items has two stages: First usage adds no locks, second one also " +
	"imports locks from the exported items. Importing an outfit with restraints will fail if it would change any item that is locked (or blocked by a locked item), " +
	"except collars, neck accessories/restraints, and piercings. Those, as well as the body itself, are ignored.";

function PasteListener(ev: ClipboardEvent) {
	if (CurrentScreen === "Wardrobe") {
		ev.preventDefault();
		ev.stopImmediatePropagation();
		const data = ((ev.clipboardData || (window as any).clipboardData) as DataTransfer).getData("text");
		const C = Wardrobe.selectedCharacter;
		const res = useExtendedImport() ? openExtendedImport(C, data) : j_WardrobeImportSelectionClothes(C, data, j_WardrobeIncludeBinds, allowMode);
		if (res) {
			ToastManager.info(res);
		}
	}
}

function KeyChangeListener(ev: KeyboardEvent) {
	holdingShift = ev.shiftKey;
}

let searchBar: HTMLInputElement | null = null;
let searchBarAutoClose = false;

function allowSearchMode(): boolean {
	return CurrentScreen === "Appearance" &&
		CharacterAppearanceSelection != null &&
		CharacterAppearanceMode === "Cloth" &&
		DialogFocusItem == null;
}

function enterSearchMode(C: Character, input?: string) {
	if (!searchBar) {
		searchBar = ElementCreateInput("BCXSearch", "text", "", "40");
		searchBar.oninput = () => {
			if (searchBar) {
				if (searchBarAutoClose && !searchBar.value) {
					exitSearchMode(C);
					MainCanvas.canvas.focus();
				} else if (CharacterAppearanceSelectedGroup) {
					DialogInventoryBuild(C, CharacterAppearanceSelectedGroup);
					AppearancePreviewBuild(C, CharacterAppearanceSelectedGroup, true);
					AppearanceMenuBuild(C, CharacterAppearanceSelectedGroup);
				}
			}
		};
		searchBar.focus();
		searchBar.setAttribute("value", input ?? "");
		const insPoint = input?.length ?? 0;
		searchBar.setSelectionRange(insPoint, insPoint);
		if (CharacterAppearanceSelectedGroup) {
			DialogInventoryBuild(C, CharacterAppearanceSelectedGroup);
			AppearancePreviewBuild(C, CharacterAppearanceSelectedGroup, true);
			AppearanceMenuBuild(C, CharacterAppearanceSelectedGroup);
		}
	}
}

function exitSearchMode(C: Character) {
	if (searchBar) {
		searchBar.remove();
		searchBar = null;
		searchBarAutoClose = false;
		if (CharacterAppearanceSelectedGroup) {
			DialogInventoryBuild(C, CharacterAppearanceSelectedGroup);
			AppearancePreviewBuild(C, CharacterAppearanceSelectedGroup, true);
			AppearanceMenuBuild(C, CharacterAppearanceSelectedGroup);
		}
	}
}

let appearanceOverrideScreen: GuiWardrobeExtended | null = null;
function useExtendedImport(): boolean {
	return (modStorage.wardrobeDefaultExtended ?? false) !== holdingShift;
}

function openExtendedImport(character: Character, data: string | ItemBundle[], clothesOnly: boolean = false): string | null {
	const parsedData = Array.isArray(data) ? data : parseWardrobeImportData(data);
	if (typeof parsedData === "string")
		return parsedData;

	if (!character) {
		return "Import error: No character";
	}
	const allowBinds = character.MemberNumber === j_WardrobeBindsAllowedCharacter;

	setAppearanceOverrideScreen(new GuiWardrobeExtended(
		setAppearanceOverrideScreen,
		character,
		allowBinds,
		parsedData,
		clothesOnly
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
				[Preset.slave]: [true, AccessLevel.friend],
			},
		});

		ExtendedWardrobeInit();
	}

	load() {

		if (typeof modStorage.wardrobeDefaultExtended !== "boolean") {
			modStorage.wardrobeDefaultExtended = true;
		}

		hookFunction("CharacterAppearanceLoadCharacter", 0, (args, next) => {
			const C = args[0];
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

		hookFunction("AppearanceRun", 7, (args, next) => {
			if (appearanceOverrideScreen) {
				return appearanceOverrideScreen.Run();
			}

			return next(args);
		});

		hookFunction("WardrobeLoad", 2, (args, next) => {
			const res = next(args);

			return res;
		});

		function BCXDoImport(char: Character) {
			BCX_setTimeout(async () => {
				if (typeof navigator.clipboard.readText !== "function") {
					ToastManager.info("Please press Ctrl+V");
					return;
				}
				const data = await navigator.clipboard.readText();
				const res = useExtendedImport() ? openExtendedImport(char, data) : j_WardrobeImportSelectionClothes(char, data, j_WardrobeIncludeBinds, allowMode);
				if (res) {
					ToastManager.info(res);
				}
			}, 0);
		}

		function BCXDoExport(char: Character) {
			BCX_setTimeout(async () => {
				await navigator.clipboard.writeText(j_WardrobeExportSelectionClothes(char, j_WardrobeIncludeBinds));
				ToastManager.info("Copied to clipboard!");
			}, 0);
		}

		hookFunction("WardrobeTogglePreviewOverlay", 2, (args, next) => {
			const ret = next(args);
			const [slot] = args;
			if (slot !== -1) {
				// A copy of BC's wardrobe.css .outfit-controls
				const cssStyle = {
					"display": "flex",
					"flex-direction": "row",
					"gap": "var(--gap)",
					"min-height": "1.5em",
					"width": "100%",
				};

				ElementCreate({
					tag: "div",
					classList: ["wardrobe-bcx"],
					style: cssStyle,
					children: [
						// ElementButton.Create("wardrobe-bcx-help", () => j_ShowHelp = !j_ShowHelp),
						ElementCheckbox.CreateLabelled("wardrobe-bcx-restraints-checkbox",
							"Include restraints",
							function () {
								j_WardrobeIncludeBinds = !j_WardrobeIncludeBinds;
							}
						),
						ElementButton.Create("wardrobe-bcx-import",
							() => {
								const offset = typeof WardrobeOffset === "number" ? WardrobeOffset : 0;
								const char = WardrobeEnsureSlotCharacter(offset + slot);
								if (!char) {
									ToastManager.error(`No character in slot ${slot}`);
									return;
								}
								BCXDoImport(char);
							},
							{ label: "Import" }
						),
						ElementButton.Create("wardrobe-bcx-advanced-import",
							() => {
								const offset = typeof WardrobeOffset === "number" ? WardrobeOffset : 0;
								const char = WardrobeEnsureSlotCharacter(offset + slot);
								if (!char) {
									ToastManager.error(`No character in slot ${slot}`);
									return;
								}
								const result = openExtendedImport(Wardrobe.selectedCharacter, ServerAppearanceBundle(char.Appearance), true);
								if (result) {
									ToastManager.error(result);
								} else {
									CharacterRefresh(Wardrobe.selectedCharacter);
									WardrobeInvalidateCanvasCache();
								}
							},
							{ label: "Advanced Import" }
						),
						ElementButton.Create("wardrobe-bcx-export",
							() => {
								const offset = typeof WardrobeOffset === "number" ? WardrobeOffset : 0;
								const char = WardrobeEnsureSlotCharacter(offset + slot);
								if (!char) {
									ToastManager.error(`No character in slot ${slot}`);
									return;
								}
								BCXDoExport(char);
							},
							{ label: "Export" }
						),
					],
					parent: ElementWrap(WardrobeID.screen)?.querySelector(".wardrobe-preview-overlay-content"),
				});
				ElementWrap(WardrobeID.screen)?.querySelectorAll(".wardrobe-preview-overlay-content button").forEach(button => {
					(button as HTMLButtonElement).style = "flex: 1";
				});
			}
			return ret;
		});

		hookFunction("AppearanceClick", 7, (args, next) => {
			if (appearanceOverrideScreen) {
				return appearanceOverrideScreen.Click();
			}

			return next(args);
		});

		hookFunction("WardrobeCreateOutfitSlots", 2, (args, next) => {
			const res = next(args);
			const showPreviews = WardrobeShowsCharacters();
			const slotsPerPage = WardrobeGetSlotsPerPage();

			const buttonStyle = {
				"position": "absolute",
				"top": "28px",
				"right": "calc(var(--slot-load-size) + var(--half-gap, 8px))",
				"z-index": "2",
				"width": "var(--slot-load-size)",
				"height": "var(--slot-load-size)",
				"box-shadow": "0 0 var(--half-gap) rgb(0 0 0 / 40%)",
				"--slot-load-icon": "70%",
				"box-sizing": "border-box",
				"flex": "0 0 auto",
				"overflow": "visible",
			};

			for (let slot = 0; slot < slotsPerPage; slot++) {
				const cell = ElementWrap(WardrobeID.slotCell(slot));
				if (!cell) continue;
				ElementButton.Create(
					`wardrobe-bcx-import-${slot}`, () => {
						const offset = typeof WardrobeOffset === "number" ? WardrobeOffset : 0;
						const char = WardrobeEnsureSlotCharacter(offset + slot);
						if (!char) return;
						const result = openExtendedImport(Wardrobe.selectedCharacter, ServerAppearanceBundle(char.Appearance), true);
						if (result) {
							ToastManager.error(result);
						} else {
							CharacterRefresh(Wardrobe.selectedCharacter);
							WardrobeInvalidateCanvasCache();
						}
					},
					{
						image: "Icons/DialogPermissionMode.png",
						...(showPreviews ? {} : {
							tooltip: "Import",
							tooltipPosition: "left",
						}),
					},
					{
						button: {
							parent: cell,
							classList: ["wardrobe-slot-bcx-import"],
							attributes: {
								// hidden: true,
								...(showPreviews ? { "aria-label": "Import" } : {}),
							},
							style: buttonStyle,
						},
					}
				);
			}
			return res;
		});

		hookFunction("WardrobeUpdateElements", 2, (args, next) => {
			const ret = next(args);
			// XXX: need to maybe update `wardrobe-bcx-import-${slot}` button here
			return ret;
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

		hookFunction("WardrobeClick", 7, (args, next) => {
			if (appearanceOverrideScreen) {
				return appearanceOverrideScreen.Click();
			}

			return next(args);
		});

		document.addEventListener("paste", PasteListener);
		document.addEventListener("keydown", KeyChangeListener, { capture: true, passive: true });
		document.addEventListener("keyup", KeyChangeListener, { capture: true, passive: true });

		//#region Search bar

		RedirectGetImage("Icons/BCX_Search.png", "Icons/Search.png");
		RedirectGetImage("Icons/BCX_SearchExit.png", "Icons/Remove.png");
		RedirectGetImage("Icons/BCX_Import.png", "Icons/Import.png");
		RedirectGetImage("Icons/BCX_Export.png", "Icons/Export.png");

		hookFunction("TextGet", 0, (args, next) => {
			const [tag] = args;
			if (tag === "BCX_Search") {
				return "Filter items";
			} else if (tag === "BCX_SearchExit") {
				return "";
			} else if (tag === "BCX_Import") {
				return "Import (BCX)";
			} else if (tag === "BCX_Export") {
				return "Export (BCX)";
			}
			return next(args);
		});

		hookFunction("AppearanceMenuBuild", 5, (args, next) => {
			next(args);
			const C = args[0];
			const menu = (AppearanceMenu as BCX_AppearanceMenuButtons[]);
			if (!allowSearchMode()) {
				exitSearchMode(C);
			} else if (searchBar) {
				AppearanceMenu = [];
				if (DialogInventory.length > 9)
					menu.push("Next");
				menu.push("BCX_SearchExit");
				if (DialogMenuMode !== "permissions")
					menu.push("Cancel");
				AppearanceMenu.push("Accept");
			} else {
				menu.splice(menu.length - (menu.includes("Cancel") ? 2 : 1), 0, "BCX_Search");
			}
			if (CharacterAppearanceMode === "") {
				const pasteIdx = menu.findIndex(btn => btn === "Paste");
				menu.splice(pasteIdx + 1, 0, "BCX_Import", "BCX_Export");
			}
		});

		hookFunction("AppearanceMenuClick", 4, (args, next) => {
			const menu = (AppearanceMenu as BCX_AppearanceMenuButtons[]);
			const X = 2000 - menu.length * 117;
			const C = args[0];
			for (let B = 0; B < menu.length; B++) {
				if (MouseXIn(X + 117 * B, 90)) {
					const Button = menu[B];
					if (Button === "BCX_Search") {
						enterSearchMode(C);
						return;
					} else if (Button === "BCX_SearchExit") {
						exitSearchMode(C);
						return;
					} else if (Button === "BCX_Import") {
						BCXDoImport(CharacterAppearanceSelection);
					} else if (Button === "BCX_Export") {
						BCXDoExport(CharacterAppearanceSelection);
					}
				}
			}
			next(args);
		});

		hookFunction("AppearanceKeyDown", 5, (args, next) => {
			const ev = args[0];
			const sb = searchBar;
			if (!sb &&
				CharacterAppearanceSelection &&
				allowSearchMode() &&
				document.activeElement === MainCanvas.canvas &&
				ev.key.length === 1 &&
				!ev.altKey && !ev.ctrlKey && !ev.metaKey
			) {
				enterSearchMode(CharacterAppearanceSelection, ev.key);
				searchBarAutoClose = true;
				return true;
			}
			return next(args);
		});

		hookFunction("DialogInventoryAdd", 5, (args, next) => {
			if (searchBar) {
				const item = args[1];
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
					BCX_setTimeout(async () => {
						await navigator.clipboard.writeText(j_WardrobeExportSelectionClothes(Player, true));
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
		AppearanceMenuBuild(CharacterAppearanceSelection ?? Player, CharacterAppearanceSelectedGroup);
	}
}
