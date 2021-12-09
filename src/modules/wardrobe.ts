import { allowMode, isNModClient, isBind, isCloth, DrawImageEx, itemColorsEquals } from "../utilsClub";
import { BaseModule } from "./_BaseModule";
import { hookFunction } from "../patching";
import { arrayUnique, clipboardAvailable } from "../utils";

import isEqual from "lodash-es/isEqual";
import cloneDeep from "lodash-es/cloneDeep";
import { RedirectGetImage } from "./miscPatches";
import { curseMakeSavedProperty } from "./curses";
import { BCX_setTimeout } from "../BCXContext";

export function j_WardrobeExportSelectionClothes(includeBinds: boolean = false): string {
	if (!CharacterAppearanceSelection) return "";
	const save = CharacterAppearanceSelection.Appearance
		.filter(a => isCloth(a, true) || (includeBinds && isBind(a)))
		.map(WardrobeAssetBundle);
	return LZString.compressToBase64(JSON.stringify(save));
}

export function j_WardrobeImportSelectionClothes(data: string | ItemBundle[], includeBinds: boolean, force: boolean = false): string {
	if (typeof data !== "string" || data.length < 1) return "Import error: No data";
	try {
		if (data[0] !== "[") {
			const decompressed = LZString.decompressFromBase64(data);
			if (!decompressed) return "Import error: Bad data";
			data = decompressed;
		}
		data = JSON.parse(data) as ItemBundle[];
		if (!Array.isArray(data)) return "Import error: Bad data";
	} catch (error) {
		console.warn(error);
		return "Import error: Bad data";
	}
	const C = CharacterAppearanceSelection;
	if (!C) {
		return "Import error: No character";
	}

	const Allow = (a: Item | Asset) => isCloth(a, CharacterAppearanceSelection!.ID === 0) || (includeBinds && isBind(a));

	if (includeBinds && !force && C.Appearance.some(a => isBind(a) && a.Property?.Effect?.includes("Lock"))) {
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
		let success = true;
		for (const testedGroup of matchedGroups) {
			const currentItem = C.Appearance.find(a => a.Asset.Group.Name === testedGroup);
			const newItem = data.find(b => b.Group === testedGroup);
			if (!currentItem) {
				if (newItem) {
					success = false;
					break;
				} else {
					continue;
				}
			}
			if (!Allow(currentItem))
				continue;
			if (
				!newItem ||
				currentItem.Asset.Name !== newItem.Name ||
				!itemColorsEquals(currentItem.Color, newItem.Color) ||
				!isEqual(currentItem.Property, newItem.Property)
			) {
				success = false;
				break;
			}
		}
		if (!success)
			return "Refusing to change locked item!";
	}

	// Check if everything (except ignored properties) matches
	let fullMatch = includeBinds;
	const matchingGroups = new Set<string>();
	if (includeBinds) {
		for (const group of arrayUnique(C.Appearance.filter(Allow).map(item => item.Asset.Group.Name).concat(data.map(item => item.Group)))) {
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
				break;
			} else {
				matchingGroups.add(group);
			}
		}
	}

	if (!fullMatch) {
		// If there is item change we only apply items, not locks
		C.Appearance = C.Appearance.filter(a => !Allow(a) || matchingGroups.has(a.Asset.Group.Name));
		for (const cloth of data) {
			if (C.Appearance.some(a => a.Asset.Group.Name === cloth.Group)) continue;
			const A = Asset.find(a => a.Group.Name === cloth.Group && a.Name === cloth.Name && Allow(a));
			if (A != null) {
				CharacterAppearanceSetItem(C, cloth.Group, A, cloth.Color, 0, undefined, false);
				const item = InventoryGet(C, cloth.Group);
				if (cloth.Property && item) {
					item.Property = cloneDeep(curseMakeSavedProperty(cloth.Property));
				}
			} else {
				console.warn(`Clothing not found: `, cloth);
			}
		}
	} else {
		// Import locks on top
		for (const cloth of data) {
			const item = InventoryGet(C, cloth.Group);
			if (cloth.Property && item) {
				item.Property = cloneDeep(cloth.Property);
			}
		}
	}
	CharacterRefresh(C);
	return (!fullMatch &&
		includeBinds &&
		data.some(i => Array.isArray(i.Property?.Effect) && i.Property?.Effect.includes("Lock"))
	) ? "Imported! Repeat to also import locks." : "Imported!";
}

let j_WardrobeIncludeBinds = false;
let j_ShowHelp = false;
// FUTURE: "Importing must not change any locked item or item blocked by locked item"
const helpText = "BCX's wardrobe export/import works by converting your current appearance into a long code word that is copied to your device's clipboard. " +
	"You can then paste it anywhere you like, for instance a text file with all your outfits. At any time, you can wear the look again by copying the outfit code word to " +
	"the clipboard and importing it with the according button. Functionality of this feature depends on the device you " +
	"are using and if the clipboard can be used on it. The button to the left of the 'Export'-button toggles whether items/restraints on your character should also " +
	"be exported/imported. Importing with items has two stages: First usage adds no locks, second one also imports locks from the exported items. " +
	"That said, importing an outfit with restraints will fail if it would change any item that is locked (or blocked by a locked item), " +
	"except collars, neck accessories and neck restraints. Those, as well as the body itself, are ignored.";

function PasteListener(ev: ClipboardEvent) {
	if (CurrentScreen === "Appearance" && CharacterAppearanceMode === "Wardrobe") {
		ev.preventDefault();
		ev.stopImmediatePropagation();
		const data = (ev.clipboardData || (window as any).clipboardData).getData("text");
		CharacterAppearanceWardrobeText = j_WardrobeImportSelectionClothes(data, j_WardrobeIncludeBinds, allowMode);
	}
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

export class ModuleWardrobe extends BaseModule {

	load() {
		const NMod = isNModClient();
		const NModWardrobe = NMod && typeof AppearanceMode !== "undefined";

		hookFunction("AppearanceRun", 0, (args, next) => {
			next(args);
			if ((CharacterAppearanceMode === "Wardrobe" || NModWardrobe && AppearanceMode === "Wardrobe") && clipboardAvailable) {
				const Y = NModWardrobe ? 265 : 125;
				DrawButton(1380, Y, 50, 50, "", "White", "", "How does it work?");
				DrawImageEx("Icons/Question.png", 1380 + 3, Y + 3, { Width: 44, Height: 44 });
				DrawButton(1457, Y, 50, 50, "", "White", "", "Include items/restraints");
				DrawImageEx("../Icons/Bondage.png", 1457 + 6, Y + 6, { Alpha: j_WardrobeIncludeBinds ? 1 : 0.2, Width: 38, Height: 38 });
				DrawButton(1534, Y, 207, 50, "Export", "White", "");
				DrawButton(1768, Y, 207, 50, "Import", "White", "");
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

		hookFunction("AppearanceClick", 0, (args, next) => {
			if ((CharacterAppearanceMode === "Wardrobe" || NModWardrobe && AppearanceMode === "Wardrobe") && clipboardAvailable) {
				const Y = NModWardrobe ? 265 : 125;
				// Help text toggle
				if (MouseIn(1380, Y, 50, 50) || (MouseIn(30, 190, 1240, 780) && j_ShowHelp)) {
					j_ShowHelp = !j_ShowHelp;
				}
				// Restraints toggle
				if (MouseIn(1457, Y, 50, 50)) {
					j_WardrobeIncludeBinds = !j_WardrobeIncludeBinds;
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
						CharacterAppearanceWardrobeText = j_WardrobeImportSelectionClothes(data, j_WardrobeIncludeBinds, allowMode);
					}, 0);
					return;
				}
			}
			next(args);
		});

		document.addEventListener("paste", PasteListener);

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
	}

	unload() {
		document.removeEventListener("paste", PasteListener);
		exitSearchMode(CharacterAppearanceSelection ?? Player);
		AppearanceMenuBuild(CharacterAppearanceSelection ?? Player);
	}
}
