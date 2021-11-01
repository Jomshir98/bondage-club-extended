import { allowMode, detectOtherMods, isBind, isCloth, DrawImageEx, itemColorsEquals } from "../utilsClub";
import { BaseModule } from "./_BaseModule";
import { hookFunction } from "../patching";
import { clipboardAvailable } from "../utils";

import isEqual from "lodash-es/isEqual";

export function j_WardrobeExportSelectionClothes(includeBinds: boolean = false): string {
	if (!CharacterAppearanceSelection) return "";
	const save = CharacterAppearanceSelection.Appearance
		.filter(a => isCloth(a, true) || (includeBinds && isBind(a)))
		.map(WardrobeAssetBundle);
	return LZString.compressToBase64(JSON.stringify(save));
}

export function j_WardrobeImportSelectionClothes(data: string | ItemBundle[], includeBinds: boolean, force: boolean = false): string | true {
	if (typeof data !== "string" || data.length < 1) return "No data";
	try {
		if (data[0] !== "[") {
			const decompressed = LZString.decompressFromBase64(data);
			if (!decompressed) return "Bad data";
			data = decompressed;
		}
		data = JSON.parse(data) as ItemBundle[];
		if (!Array.isArray(data)) return "Bad data";
	} catch (error) {
		console.warn(error);
		return "Bad data";
	}
	const C = CharacterAppearanceSelection;
	if (!C) {
		return "No character";
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
			return "Character is bound";
	}

	C.Appearance = C.Appearance.filter(a => !Allow(a));
	for (const cloth of data) {
		if (C.Appearance.some(a => a.Asset.Group.Name === cloth.Group)) continue;
		const A = Asset.find(a => a.Group.Name === cloth.Group && a.Name === cloth.Name && Allow(a));
		if (A != null) {
			CharacterAppearanceSetItem(C, cloth.Group, A, cloth.Color, 0, undefined, false);
			const item = InventoryGet(C, cloth.Group);
			if (cloth.Property && item) {
				if (item.Property == null) item.Property = {};
				Object.assign(item.Property, cloth.Property);
			}
		} else {
			console.warn(`Clothing not found: `, cloth);
		}
	}
	CharacterRefresh(C);
	return true;
}

let j_WardrobeIncludeBinds = false;
let j_ShowHelp = false;
// FUTURE: "Importing must not change any locked item or item blocked by locked item"
const helpText = "BCX's wardrobe export/import works by converting your current appearance into a long code word that is copied to your device's clipboard. " +
	"You can then paste it anywhere you like, for instance a text file with all your outfits. At any time, you can wear the look again by copying the outfit code word to " +
	"the clipboard and importing it with the according button. Functionality of this feature depends on the device you " +
	"are using and if the clipboard can be used on it. The button to the left of the 'Export'-button toggles whether items/restraints on your character should also " +
	"be exported/imported. That said, importing an outfit with restraints will fail if it would change any item that is locked (or blocked by a locked item), " +
	"except collars, neck accessories and neck restraints. Those, as well as the body itself, are ignored.";

function PasteListener(ev: ClipboardEvent) {
	if (CurrentScreen === "Appearance" && CharacterAppearanceMode === "Wardrobe") {
		ev.preventDefault();
		ev.stopImmediatePropagation();
		const data = (ev.clipboardData || (window as any).clipboardData).getData("text");
		const res = j_WardrobeImportSelectionClothes(data, j_WardrobeIncludeBinds, allowMode);
		CharacterAppearanceWardrobeText = res !== true ? `Import error: ${res}` : "Imported!";
	}
}

export class ModuleWardrobe extends BaseModule {

	load() {
		const { NMod } = detectOtherMods();
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
				MainCanvas.fillRect(170, 190, 1100, 780);
				MainCanvas.strokeStyle = "Black";
				MainCanvas.strokeRect(170, 190, 1100, 780);
				MainCanvas.textAlign = "left";
				DrawTextWrap(helpText, 170 - 1010 / 2, 210, 1060, 740, "black");
				MainCanvas.textAlign = "center";
			}
		});

		hookFunction("AppearanceClick", 0, (args, next) => {
			if ((CharacterAppearanceMode === "Wardrobe" || NModWardrobe && AppearanceMode === "Wardrobe") && clipboardAvailable) {
				const Y = NModWardrobe ? 265 : 125;
				// Help text toggle
				if (MouseIn(1380, Y, 50, 50) || (MouseIn(170, 190, 1100, 780) && j_ShowHelp)) {
					j_ShowHelp = !j_ShowHelp;
				}
				// Restraints toggle
				if (MouseIn(1457, Y, 50, 50)) {
					j_WardrobeIncludeBinds = !j_WardrobeIncludeBinds;
				}
				// Export
				if (MouseIn(1534, Y, 207, 50)) {
					setTimeout(async () => {
						await navigator.clipboard.writeText(j_WardrobeExportSelectionClothes(j_WardrobeIncludeBinds));
						CharacterAppearanceWardrobeText = "Copied to clipboard!";
					}, 0);
					return;
				}
				// Import
				if (MouseIn(1768, Y, 207, 50)) {
					setTimeout(async () => {
						if (typeof navigator.clipboard.readText !== "function") {
							CharacterAppearanceWardrobeText = "Please press Ctrl+V";
							return;
						}
						const data = await navigator.clipboard.readText();
						const res = j_WardrobeImportSelectionClothes(data, j_WardrobeIncludeBinds, allowMode);
						CharacterAppearanceWardrobeText = res !== true ? `Import error: ${res}` : "Imported!";
					}, 0);
					return;
				}
			}
			next(args);
		});

		document.addEventListener("paste", PasteListener);
	}

	unload() {
		document.removeEventListener("paste", PasteListener);
	}
}
