import { detectOtherMods, isBind, isCloth } from "./clubUtils";
import { allowMode } from "./console";
import { hookFunction } from "./patching";
import { clipboardAvailable } from "./utils";

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

	if (includeBinds && !force && C.Appearance.some(a => isBind(a) && a.Property?.Effect?.includes("Lock"))) {
		return "Character is bound";
	}

	const Allow = (a: Item | Asset) => isCloth(a, CharacterAppearanceSelection!.ID === 0) || (includeBinds && isBind(a));

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

export function init_wardrobe() {

	const { NMod } = detectOtherMods();

	hookFunction("AppearanceRun", 0, (args, next) => {
		next(args);
		if ((CharacterAppearanceMode === "Wardrobe" || NMod && AppearanceMode === "Wardrobe") && clipboardAvailable) {
			const Y = NMod ? 265 : 125;
			DrawButton(1457, Y, 50, 50, "", "White", j_WardrobeIncludeBinds ? "Icons/Checked.png" : "", "Include restraints");
			DrawButton(1534, Y, 207, 50, "Export", "White", "");
			DrawButton(1768, Y, 207, 50, "Import", "White", "");
		}
	});

	hookFunction("AppearanceClick", 0, (args, next) => {
		if ((CharacterAppearanceMode === "Wardrobe" || NMod && AppearanceMode === "Wardrobe") && clipboardAvailable) {
			const Y = NMod ? 265 : 125;
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

	document.addEventListener("paste", ev => {
		if (CurrentScreen === "Appearance" && CharacterAppearanceMode === "Wardrobe") {
			ev.preventDefault();
			ev.stopImmediatePropagation();
			const data = (ev.clipboardData || (window as any).clipboardData).getData("text");
			const res = j_WardrobeImportSelectionClothes(data, j_WardrobeIncludeBinds, allowMode);
			CharacterAppearanceWardrobeText = res !== true ? `Import error: ${res}` : "Imported!";
		}
	});
}
