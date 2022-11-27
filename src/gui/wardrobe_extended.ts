import { isEqual } from "lodash-es";
import { BCX_setTimeout } from "../BCXContext";
import { getChatroomCharacter } from "../characters";
import { sendQuery } from "../modules/messaging";
import { itemMergeProperties, parseWardrobeImportData, ValidationCanAccessCheck, WardrobeDoImport, WardrobeImportCheckChangesLockedItem, WardrobeImportMakeFilterFunction } from "../modules/wardrobe";
import { arrayUnique, clampWrap, isObject } from "../utils";
import { DrawImageEx, getVisibleGroupName, InfoBeep, isBind, isBody, isCloth, isCosplay, itemColorsEquals, smartGetAssetGroup } from "../utilsClub";
import { GuiSubscreen } from "./subscreen";

enum ScreenState {
	main = 0,
	clothSelect = 1,
	cosplaySelect = 2,
	bodySelect = 3,
	lockSelect = 4
}

const CATEGORIES_BASE =
	{
		clothes: {
			title: "clothing",
			filter: (g: AssetGroup) => isCloth(g, false)
		},
		cosplay: {
			title: "cosplay items",
			filter: (g: AssetGroup) => isCosplay(g)
		},
		body: {
			title: "body parts",
			filter: (g: AssetGroup) => isBody(g)
		},
		items: {
			title: "items",
			filter: (g: AssetGroup) => isBind(g, ["ItemNeck", "ItemNeckAccessories", "ItemNeckRestraints", "ItemNipplesPiercings", "ItemVulvaPiercings"])
		},
		piercings: {
			title: "piercings",
			filter: (g: AssetGroup) => isBind(g, []) && ["ItemNipplesPiercings", "ItemVulvaPiercings"].includes(g.Name)
		},
		collar: {
			title: "collar and accessories",
			filter: (g: AssetGroup) => isBind(g, []) && ["ItemNeck", "ItemNeckAccessories", "ItemNeckRestraints"].includes(g.Name)
		}
	} as const;

type CategoryType = keyof typeof CATEGORIES_BASE;

const CATEGORIES: Record<CategoryType, {
	title: string;
	filter: (group: AssetGroup) => boolean;
}> = CATEGORIES_BASE;

const BACKGROUND_SELECTION: (null | string)[] = [
	null,
	"Introduction",
	"BrickWall",
	"grey",
	"White"
];

let LOCK_TYPES_LIST: readonly Asset[] = [];

let backgroundIndex = 0;
const enabledSlots = new Set<AssetGroupName>();
const enabledLocks = new Set<string>();

export function ExtendedWardrobeInit() {
	for (const category of [CATEGORIES.clothes, CATEGORIES.cosplay]) {
		AssetGroup.filter(g => category.filter(g)).forEach(g => enabledSlots.add(g.Name));
	}

	const lockAssets = Asset.filter(a => a.Group.Name === "ItemMisc" && a.IsLock);
	LOCK_TYPES_LIST = arrayUnique(lockAssets);
	for (const lock of lockAssets) {
		if (!lock.OwnerOnly && !lock.LoverOnly && !InventoryIsPermissionBlocked(Player, lock.Name, lock.Group.Name)) {
			enabledLocks.add(lock.Name);
		}
	}

}

export class GuiWardrobeExtended extends GuiSubscreen {

	private screenState: ScreenState = ScreenState.main;
	private readonly hiddenElements = new Set<HTMLElement>();

	private readonly exitCallback: (newScreen: GuiWardrobeExtended | null) => void;
	private readonly character: Character;
	private readonly data: ItemBundle[];

	private originalAppearance!: string;
	private originalData!: ItemBundle[];

	private allowBindsBase: boolean;
	private allowBinds: boolean;
	private bindsBlockedByLock: boolean;
	private allowPiercings: boolean;
	private piercingsBlockedByLock: boolean;
	private allowCollar: boolean;
	private collarBlockedByLock: boolean;
	private allowCosplay: boolean;
	private allowBody: boolean;

	private allowLocks: boolean = false;

	private showHelp = false;

	private doApply = false;
	private skippedBlockedCount = 0;

	constructor(exitCallback: (newScreen: GuiWardrobeExtended | null) => void, character: Character, allowBinds: boolean, data: ItemBundle[]) {
		super();
		this.exitCallback = exitCallback;
		this.character = character;
		this.allowBindsBase = allowBinds;
		this.allowBinds = allowBinds;
		this.bindsBlockedByLock = false;
		this.allowPiercings = allowBinds;
		this.piercingsBlockedByLock = false;
		this.allowCollar = allowBinds;
		this.collarBlockedByLock = false;
		this.data = data;

		const chatroomCharacter = character.MemberNumber && getChatroomCharacter(character.MemberNumber);
		this.allowCosplay = character.IsPlayer() || character.OnlineSharedSettings?.BlockBodyCosplay === false;
		this.allowBody = character.IsPlayer() || character.OnlineSharedSettings?.AllowFullWardrobeAccess === true;
		if (chatroomCharacter && chatroomCharacter.BCXVersion && (!this.allowCosplay || !this.allowBody)) {
			sendQuery("rule_alt_allow_changing_appearance", undefined, chatroomCharacter.MemberNumber).then(res => {
				if (res) {
					this.allowCosplay = true;
					this.allowBody = true;
				}
			});
		}
	}

	Load() {
		// On screen load
		for (const el of Array.from(document.getElementsByClassName("HideOnPopup"))) {
			if (el instanceof HTMLElement && el.style.display !== "none") {
				this.hiddenElements.add(el);
				el.style.display = "none";
			}
		}

		this.originalAppearance = CharacterAppearanceStringify(this.character);
		this.originalData = this.character.Appearance.map(WardrobeAssetBundle);

		// Do fixups on imported data - add missing bodyparts and remove blocked/limited items
		this.skippedBlockedCount = 0;
		for (let i = this.data.length - 1; i >= 0; i--) {
			const item = this.data[i];
			if (!ValidationCanAccessCheck(this.character, item.Group as AssetGroupName, item.Name, item.Property?.Type)) {
				this.data.splice(i, 1);
				this.skippedBlockedCount++;
			}
		}

		for (const group of AssetGroup) {
			if (group.AllowNone)
				continue;
			if (!this.data.some(i => i.Group === group.Name)) {
				const current = this.originalData.find(i => i.Group === group.Name);
				if (current) {
					this.data.push(current);
				}
			}
		}

		if (this.allowBinds && WardrobeImportCheckChangesLockedItem(this.character, this.data, WardrobeImportMakeFilterFunction({
			cloth: false,
			cosplay: false,
			body: false,
			binds: true,
			collar: false,
			piercings: false
		}))) {
			this.allowBinds = false;
			this.bindsBlockedByLock = true;
		}
		if (this.allowPiercings && WardrobeImportCheckChangesLockedItem(this.character, this.data, WardrobeImportMakeFilterFunction({
			cloth: false,
			cosplay: false,
			body: false,
			binds: true,
			collar: false,
			piercings: true
		}))) {
			this.allowPiercings = false;
			this.piercingsBlockedByLock = true;
		}
		if (this.allowCollar && WardrobeImportCheckChangesLockedItem(this.character, this.data, WardrobeImportMakeFilterFunction({
			cloth: false,
			cosplay: false,
			body: false,
			binds: false,
			collar: true,
			piercings: false
		}))) {
			this.allowCollar = false;
			this.collarBlockedByLock = true;
		}

		this.refresh();
	}

	Unload() {
		// On screen unload
		for (const el of this.hiddenElements) {
			el.style.display = "";
		}
		this.hiddenElements.clear();

		if (!this.doApply) {
			CharacterAppearanceRestore(this.character, this.originalAppearance);
			CharacterRefresh(this.character);
		}
	}

	Run() {
		// On each frame

		// Custom background
		backgroundIndex = clampWrap(backgroundIndex, 0, BACKGROUND_SELECTION.length - 1);
		const background = BACKGROUND_SELECTION[backgroundIndex];
		if (background) {
			DrawImageEx("Backgrounds/" + background + ".jpg", 0, 0);
		}

		MainCanvas.textAlign = "center";
		DrawButton(1420, 45, 50, 50, "", "White", "", "Color help");
		DrawImageEx("Icons/Question.png", 1420 + 3, 45 + 3, { Width: 44, Height: 44 });

		DrawButton(1515, 45, 207, 50, "Import", "White", "");
		DrawButton(1766, 25, 90, 90, "", "White", "./Icons/Cancel.png");
		DrawButton(1884, 25, 90, 90, "", "White", "./Icons/Accept.png");

		DrawBackNextButton(25, 25, 340, 90, `Background ${backgroundIndex + 1} / ${Math.max(BACKGROUND_SELECTION.length, 1)}`, "White", "", () => "", () => "");

		if (this.showHelp) {
			MainCanvas.strokeStyle = "black";
			MainCanvas.fillStyle = "#ffffff88";

			MainCanvas.beginPath();
			MainCanvas.rect(25, 300, 340, 450);
			MainCanvas.fill();
			MainCanvas.stroke();

			DrawText("Color legend", 195, 340, "Black", "#ddd");

			MainCanvas.fillStyle = "#ffb";
			MainCanvas.fillRect(50, 374, 290, 64);
			MainCanvas.fillStyle = "#fff";
			MainCanvas.fillRect(50, 438, 290, 64);
			MainCanvas.fillStyle = "#88c";
			MainCanvas.fillRect(50, 502, 290, 64);
			MainCanvas.fillStyle = "#ccc";
			MainCanvas.fillRect(50, 566, 290, 64);
			MainCanvas.fillStyle = "#faa";
			MainCanvas.fillRect(50, 630, 290, 64);

			MainCanvas.textAlign = "center";
			DrawTextFit(`Items are added`, 50 + 295 / 2, 374 + 34, 276, "Black");
			DrawTextFit(`Items are removed`, 50 + 295 / 2, 438 + 34, 276, "Black");
			DrawTextFit(`No item changes`, 50 + 295 / 2, 502 + 34, 276, "Black");
			DrawTextFit(`Not available/permitted`, 50 + 295 / 2, 566 + 34, 276, "Black");
			DrawTextFit(`Blocked by locks`, 50 + 295 / 2, 630 + 34, 276, "Black");
		}

		DrawCharacter(this.character, 460, 0, 1, true, MainCanvas);

		if (this.screenState === ScreenState.main) {

			MainCanvas.strokeStyle = "black";
			MainCanvas.fillStyle = "#ffffffcc";

			MainCanvas.beginPath();
			MainCanvas.rect(1000 - 30, 250 - 30, 750 + 60, 650 + 60);
			MainCanvas.fill();
			MainCanvas.stroke();

			MainCanvas.fillStyle = "Black";

			{
				MainCanvas.textAlign = "left";
				const { checked, color, disabled } = this.getGlobalSelectorState("clothes");
				DrawButton(1000, 250, 50, 50, "", color, undefined, undefined, disabled);
				DrawTextFit("Clothes", 1100, 275, 300, "black");
				if (checked === "partial") {
					MainCanvas.fillRect(1000 + 8, 250 + 8, 34, 34);
				} else if (checked === "yes") {
					DrawImageEx("./Icons/Checked.png", 1000 + 6, 250 + 6, { Width: 38, Height: 38 });
				}
				MainCanvas.textAlign = "center";
				DrawButton(1400, 250, 350, 50, "Select individually", disabled ? "#ccc" : "White", undefined, undefined, disabled);
			}

			{
				MainCanvas.textAlign = "left";
				const { checked, color, disabled } = this.getGlobalSelectorState("cosplay");
				DrawButton(1000, 350, 50, 50, "", color, undefined, undefined, disabled);
				DrawTextFit("Cosplay items", 1100, 375, 300, "black");
				if (checked === "partial") {
					MainCanvas.fillRect(1000 + 8, 350 + 8, 34, 34);
				} else if (checked === "yes") {
					DrawImageEx("./Icons/Checked.png", 1000 + 6, 350 + 6, { Width: 38, Height: 38 });
				}
				MainCanvas.textAlign = "center";
				DrawButton(1400, 350, 350, 50, "Select individually", disabled ? "#ccc" : "White", undefined, undefined, disabled);
			}

			{
				MainCanvas.textAlign = "left";
				const { checked, color, disabled } = this.getGlobalSelectorState("body");
				DrawButton(1000, 450, 50, 50, "", color, undefined, undefined, disabled);
				DrawTextFit("Body", 1100, 475, 300, "black", "white");
				if (checked === "partial") {
					MainCanvas.fillRect(1000 + 8, 450 + 8, 34, 34);
				} else if (checked === "yes") {
					DrawImageEx("./Icons/Checked.png", 1000 + 6, 450 + 6, { Width: 38, Height: 38 });
				}
				MainCanvas.textAlign = "center";
				DrawButton(1400, 450, 350, 50, "Select individually", disabled ? "#ccc" : "White", undefined, undefined, disabled);
			}

			{
				MainCanvas.textAlign = "left";
				const { checked, color, disabled } = this.getGlobalSelectorState("items");
				DrawButton(1000, 550, 50, 50, "", color, undefined, undefined, disabled);
				DrawTextFit("Restraints/items", 1100, 575, 300, "black");
				if (checked === "partial") {
					MainCanvas.fillRect(1000 + 8, 550 + 8, 34, 34);
				} else if (checked === "yes") {
					DrawImageEx("./Icons/Checked.png", 1000 + 6, 550 + 6, { Width: 38, Height: 38 });
				}
			}

			{
				MainCanvas.textAlign = "left";
				const { checked, color, disabled } = this.getGlobalSelectorState("collar");
				DrawButton(1000, 650, 50, 50, "", color, undefined, undefined, disabled);
				DrawTextFit("Collar", 1100, 675, 300, "black");
				if (checked === "partial") {
					MainCanvas.fillRect(1000 + 8, 650 + 8, 34, 34);
				} else if (checked === "yes") {
					DrawImageEx("./Icons/Checked.png", 1000 + 6, 650 + 6, { Width: 38, Height: 38 });
				}
			}

			{
				MainCanvas.textAlign = "left";
				const { checked, color, disabled } = this.getGlobalSelectorState("piercings");
				DrawButton(1000, 750, 50, 50, "", color, undefined, undefined, disabled);
				DrawTextFit("Piercings", 1100, 775, 300, "black");
				if (checked === "partial") {
					MainCanvas.fillRect(1000 + 8, 750 + 8, 34, 34);
				} else if (checked === "yes") {
					DrawImageEx("./Icons/Checked.png", 1000 + 6, 750 + 6, { Width: 38, Height: 38 });
				}
			}

			{
				MainCanvas.textAlign = "left";
				const { checked, color, disabled } = this.getLocksState();
				DrawButton(1000, 850, 50, 50, "", color, undefined, undefined, disabled);
				DrawTextFit("Locks", 1100, 875, 300, "black");
				if (checked === "partial") {
					MainCanvas.fillRect(1000 + 8, 850 + 8, 34, 34);
				} else if (checked === "yes") {
					DrawImageEx("./Icons/Checked.png", 1000 + 6, 850 + 6, { Width: 38, Height: 38 });
				}
				MainCanvas.textAlign = "center";
				DrawButton(1400, 850, 350, 50, "Select individually", disabled ? "#ccc" : "White", undefined, undefined, disabled);
			}

			let warning: string | undefined;

			if (this.skippedBlockedCount > 0) {
				warning = `Skipped ${this.skippedBlockedCount} blocked/limited item${this.skippedBlockedCount > 1 ? "s" : ""}`;
			} else if (!this.allowBindsBase) {
				warning = `You do not have permission to import items.`;
			}

			if (warning) {
				MainCanvas.fillStyle = "Pink";
				MainCanvas.strokeStyle = "Black";
				MainCanvas.beginPath();
				MainCanvas.rect(1000 - 30, 180 - 40, 750 + 60, 70);
				MainCanvas.fill();
				MainCanvas.stroke();
				DrawTextFit(warning, 1370, 177, 800, "Black");
			}

		} else if (this.screenState === ScreenState.clothSelect) {

			this.drawSelectorArea("clothes");

		} else if (this.screenState === ScreenState.cosplaySelect) {

			this.drawSelectorArea("cosplay");

		} else if (this.screenState === ScreenState.bodySelect) {

			this.drawSelectorArea("body");

		} else if (this.screenState === ScreenState.lockSelect) {

			this.drawLocksSelector();

		}
	}

	private drawSelectorArea(selectorType: CategoryType): void {
		const category = CATEGORIES[selectorType];
		const AssetGroups = AssetGroup.filter(category.filter);

		MainCanvas.textAlign = "left";
		MainCanvas.fillStyle = "#cccccc";
		MainCanvas.fillRect(900 + 105, 165, 830, 64);
		DrawText(`Choose ${category.title}`, 900 + 390, 165 + 34, "Black");
		MainCanvas.textAlign = "center";
		DrawButton(900 + 120, 173, 200, 48, "<<< Back", "White");
		for (let i = 0; i < AssetGroups.length; i++) {
			const row = i % 10;
			const column = Math.floor(i / 10);
			const group = AssetGroups[i];

			const current = this.originalData.find(item => item.Group === group.Name);
			const currentAsset = current && AssetGet(this.character.AssetFamily, current.Group, current.Name);

			const request = this.data.find(item => item.Group === group.Name);
			const requestAsset = request && AssetGet(this.character.AssetFamily, request.Group, request.Name);

			const matches = checkImportItemNoChange(group.Name, this.data, this.originalData);
			const identicalItem = currentAsset?.Name === requestAsset?.Name;

			const color: string = matches ? "#88c" : requestAsset ? "#ffb" : "#fff";
			const text: string = matches ? (currentAsset?.Description ?? "[EMPTY]") :
				identicalItem ? `Changes to the configuration of ${currentAsset?.Description}` :
					(currentAsset?.Description ?? "[EMPTY]") + " 🠖 " + (requestAsset?.Description ?? "[EMPTY]");

			DrawButton(900 + 106 + 281 * column, 240 + 69 * row, 265, 54, getVisibleGroupName(group), color, undefined, undefined, matches);

			if (MouseIn(900 + 106 + 281 * column, 240 + 69 * row, 265, 54)) {
				const Left = 900 + 106;
				const Top = 240 + 690;
				MainCanvas.fillStyle = "#FFFF88";
				MainCanvas.lineWidth = 2;
				MainCanvas.strokeStyle = "black";
				MainCanvas.beginPath();
				MainCanvas.rect(Left, Top, 826, 65);
				MainCanvas.fill();
				MainCanvas.stroke();
				DrawTextFit(text, Left + 413, Top + 33, 820, "black");
			}

			if (!matches && enabledSlots.has(group.Name)) {
				MainCanvas.strokeStyle = "#FF69B4";
				MainCanvas.lineWidth = 4;
				MainCanvas.strokeRect(900 + 106 + 281 * column - 2, 240 + 69 * row - 2, 265 + 4, 54 + 4);
			}
		}
	}

	private clickSelectorArea(selectorType: CategoryType): void {
		const category = CATEGORIES[selectorType];
		const AssetGroups = AssetGroup.filter(category.filter);

		if (MouseIn(900 + 120, 173, 200, 48)) {
			this.screenState = ScreenState.main;
			return;
		}

		for (let i = 0; i < AssetGroups.length; i++) {
			const row = i % 10;
			const column = Math.floor(i / 10);
			const group = AssetGroups[i];

			const matches = checkImportItemNoChange(group.Name, this.data, this.originalData);

			if (MouseIn(900 + 106 + 281 * column, 240 + 69 * row, 265, 54) && !matches) {
				const selected = enabledSlots.has(group.Name);
				if (selected) {
					enabledSlots.delete(group.Name);
				} else {
					enabledSlots.add(group.Name);
				}
				this.refresh();
				return;
			}
		}
	}

	private drawLocksSelector(): void {
		const importedLockTypes = new Set(this.data
			.filter((g): g is ItemBundle & { Property: { LockedBy: AssetLockType } } => isObject(g.Property) &&
				typeof g.Property.LockedBy === "string" &&
				AssetGet(this.character.AssetFamily, "ItemMisc", g.Property.LockedBy)?.IsLock === true
			)
			.map(g => g.Property.LockedBy));

		MainCanvas.textAlign = "left";
		MainCanvas.fillStyle = "#cccccc";
		MainCanvas.fillRect(900 + 105, 165, 830, 64);
		DrawText(`Choose lock types`, 900 + 390, 165 + 34, "Black");
		MainCanvas.textAlign = "center";
		DrawButton(900 + 120, 173, 200, 48, "<<< Back", "White");
		for (let i = 0; i < LOCK_TYPES_LIST.length; i++) {
			const row = i % 10;
			const column = Math.floor(i / 10);
			const lock = LOCK_TYPES_LIST[i];

			const requested = importedLockTypes.has(lock.Name as AssetLockType);

			const color: string = requested ? "#ffb" : "#88c";

			DrawButton(900 + 106 + 281 * column, 240 + 69 * row, 265, 54, lock.Description, color, undefined, undefined, !requested);

			if (requested && enabledLocks.has(lock.Name)) {
				MainCanvas.strokeStyle = "#FF69B4";
				MainCanvas.lineWidth = 4;
				MainCanvas.strokeRect(900 + 106 + 281 * column - 2, 240 + 69 * row - 2, 265 + 4, 54 + 4);
			}
		}
	}

	private clickLocksSelector(): void {
		const importedLockTypes = new Set(this.data
			.filter((g): g is ItemBundle & { Property: { LockedBy: AssetLockType } } => isObject(g.Property) &&
				typeof g.Property.LockedBy === "string" &&
				AssetGet(this.character.AssetFamily, "ItemMisc", g.Property.LockedBy)?.IsLock === true
			)
			.map(g => g.Property.LockedBy));

		if (MouseIn(900 + 120, 173, 200, 48)) {
			this.screenState = ScreenState.main;
			return;
		}

		for (let i = 0; i < LOCK_TYPES_LIST.length; i++) {
			const row = i % 10;
			const column = Math.floor(i / 10);
			const lock = LOCK_TYPES_LIST[i];

			const requested = importedLockTypes.has(lock.Name as AssetLockType);

			if (MouseIn(900 + 106 + 281 * column, 240 + 69 * row, 265, 54) && requested) {
				const selected = enabledLocks.has(lock.Name);
				if (selected) {
					enabledLocks.delete(lock.Name);
				} else {
					enabledLocks.add(lock.Name);
				}
				this.refresh();
				return;
			}
		}
	}

	Click() {
		// On click

		if (MouseIn(1420, 45, 50, 50) || (MouseIn(25, 300, 340, 450) && this.showHelp)) {
			this.showHelp = !this.showHelp;
			return;
		}

		if (MouseIn(1515, 45, 207, 50)) {
			BCX_setTimeout(async () => {
				if (typeof navigator.clipboard.readText !== "function") {
					InfoBeep("Please press Ctrl+V", 5_000);
					return;
				}
				const data = await navigator.clipboard.readText();
				const parsedData = parseWardrobeImportData(data);
				if (typeof parsedData === "string") {
					InfoBeep(parsedData, 5_000);
					return;
				}

				this.exitCallback(new GuiWardrobeExtended(
					this.exitCallback,
					this.character,
					this.allowBindsBase,
					parsedData
				));
			}, 0);
			return;
		}
		if (MouseIn(1766, 25, 90, 90)) {
			return this.Exit();
		}
		if (MouseIn(1884, 25, 90, 90)) {
			this.doApply = true;
			return this.Exit();
		}

		if (MouseIn(25, 25, 170, 90)) {
			// back
			backgroundIndex = clampWrap(backgroundIndex - 1, 0, BACKGROUND_SELECTION.length - 1);
			return;
		} else if (MouseIn(195, 25, 170, 90)) {
			// forward
			backgroundIndex = clampWrap(backgroundIndex + 1, 0, BACKGROUND_SELECTION.length - 1);
			return;
		}

		if (this.screenState === ScreenState.main) {
			// check boxes
			if (MouseIn(1000, 250, 50, 50)) {
				const current = this.getGlobalSelectorState("clothes");
				if (!current.disabled) {
					AssetGroup
						.filter(CATEGORIES.clothes.filter)
						.forEach(g => {
							if (current.checked === "no") {
								enabledSlots.add(g.Name);
							} else {
								enabledSlots.delete(g.Name);
							}
						});
					this.refresh();
				}
				return;
			}

			if (MouseIn(1400, 250, 350, 50) && !this.getGlobalSelectorState("clothes").disabled) {
				this.screenState = ScreenState.clothSelect;
			}

			if (MouseIn(1000, 350, 50, 50)) {
				const current = this.getGlobalSelectorState("cosplay");
				if (!current.disabled) {
					AssetGroup
						.filter(CATEGORIES.cosplay.filter)
						.forEach(g => {
							if (current.checked === "no") {
								enabledSlots.add(g.Name);
							} else {
								enabledSlots.delete(g.Name);
							}
						});
					this.refresh();
				}
				return;
			}

			if (MouseIn(1400, 350, 350, 50) && !this.getGlobalSelectorState("cosplay").disabled) {
				this.screenState = ScreenState.cosplaySelect;
			}

			if (MouseIn(1000, 450, 50, 50)) {
				const current = this.getGlobalSelectorState("body");
				if (!current.disabled) {
					AssetGroup
						.filter(CATEGORIES.body.filter)
						.forEach(g => {
							if (current.checked === "no") {
								enabledSlots.add(g.Name);
							} else {
								enabledSlots.delete(g.Name);
							}
						});
					this.refresh();
				}
				return;
			}

			if (MouseIn(1400, 450, 350, 50) && !this.getGlobalSelectorState("body").disabled) {
				this.screenState = ScreenState.bodySelect;
			}

			if (MouseIn(1000, 550, 50, 50)) {
				const current = this.getGlobalSelectorState("items");
				if (!current.disabled) {
					AssetGroup
						.filter(CATEGORIES.items.filter)
						.forEach(g => {
							if (current.checked === "no") {
								enabledSlots.add(g.Name);
							} else {
								enabledSlots.delete(g.Name);
							}
						});
					this.refresh();
				}
				return;
			}

			if (MouseIn(1000, 650, 50, 50)) {
				const current = this.getGlobalSelectorState("collar");
				if (!current.disabled) {
					AssetGroup
						.filter(CATEGORIES.collar.filter)
						.forEach(g => {
							if (current.checked === "no") {
								enabledSlots.add(g.Name);
							} else {
								enabledSlots.delete(g.Name);
							}
						});
					this.refresh();
				}
				return;
			}

			if (MouseIn(1000, 750, 50, 50)) {
				const current = this.getGlobalSelectorState("piercings");
				if (!current.disabled) {
					AssetGroup
						.filter(CATEGORIES.piercings.filter)
						.forEach(g => {
							if (current.checked === "no") {
								enabledSlots.add(g.Name);
							} else {
								enabledSlots.delete(g.Name);
							}
						});
					this.refresh();
				}
				return;
			}

			if (MouseIn(1000, 850, 50, 50)) {
				const current = this.getLocksState();
				if (!current.disabled) {
					LOCK_TYPES_LIST
						.forEach(lock => {
							if (current.checked === "no") {
								enabledLocks.add(lock.Name);
							} else {
								enabledLocks.delete(lock.Name);
							}
						});
					this.refresh();
				}
				return;
			}

			if (MouseIn(1400, 850, 350, 50) && !this.getLocksState().disabled) {
				this.screenState = ScreenState.lockSelect;
			}
		} else if (this.screenState === ScreenState.clothSelect) {

			this.clickSelectorArea("clothes");

		} else if (this.screenState === ScreenState.cosplaySelect) {

			this.clickSelectorArea("cosplay");

		} else if (this.screenState === ScreenState.bodySelect) {

			this.clickSelectorArea("body");

		} else if (this.screenState === ScreenState.lockSelect) {

			this.clickLocksSelector();

		}
	}

	Exit() {
		this.exitCallback(null);
	}

	private refresh(): void {
		const itemsState = this.getGlobalSelectorState("items");
		const collarState = this.getGlobalSelectorState("collar");
		const piercingsState = this.getGlobalSelectorState("piercings");

		this.allowLocks =
			this.data.some(a => a.Property?.Effect?.includes("Lock")) &&
			(this.allowBinds && itemsState.checked !== "no" && !itemsState.disabled ||
				this.allowPiercings && piercingsState.checked !== "no" && !piercingsState.disabled ||
				this.allowCollar && collarState.checked !== "no" && !collarState.disabled);

		CharacterAppearanceRestore(this.character, this.originalAppearance);
		WardrobeDoImport(this.character, this.data, a => this.checkAllowChange(smartGetAssetGroup(a)), this.allowLocks ? enabledLocks : false);
	}

	private checkAllowChange(group: AssetGroup): boolean {
		if (!this.allowCosplay && CATEGORIES.cosplay.filter(group))
			return false;

		if (!this.allowBody && CATEGORIES.body.filter(group))
			return false;

		if (!this.allowBinds && CATEGORIES.items.filter(group))
			return false;

		if (!this.allowPiercings && CATEGORIES.piercings.filter(group))
			return false;

		if (!this.allowCollar && CATEGORIES.collar.filter(group))
			return false;

		return enabledSlots.has(group.Name) && !checkImportItemNoChange(group.Name, this.data, this.originalData);
	}

	private getGlobalSelectorState(type: CategoryType): {
		checked: "yes" | "partial" | "no";
		color: string;
		disabled: boolean;
	} {
		const category = CATEGORIES[type];
		const AssetGroups = AssetGroup.filter(category.filter);

		// Detect if all match
		if (checkImportTypeNoChange(type, this.data, this.originalData))
			return {
				checked: "no",
				color: "#88c",
				disabled: true
			};

		const allowed =
			type === "clothes" ? true :
				type === "cosplay" ? this.allowCosplay :
					type === "body" ? this.allowBody :
						type === "items" ? this.allowBinds :
							type === "piercings" ? this.allowPiercings :
								type === "collar" ? this.allowCollar :
									false;

		const blockedByLock = !allowed && (
			type === "items" ? this.bindsBlockedByLock :
				type === "piercings" ? this.piercingsBlockedByLock :
					type === "collar" ? this.collarBlockedByLock :
						false
		);

		if (!allowed)
			return {
				checked: "no",
				color: blockedByLock ? "#faa" : "#ccc",
				disabled: true
			};

		const assetGroupsWithChange = AssetGroups.filter(g => !checkImportItemNoChange(g.Name, this.data, this.originalData));

		let checked: "yes" | "partial" | "no" = "no";
		const selectedSlots = assetGroupsWithChange.map(g => g.Name).filter(g => enabledSlots.has(g));
		if (selectedSlots.length > 0) {
			checked = selectedSlots.length === assetGroupsWithChange.length ? "yes" : "partial";
		}

		return {
			checked,
			color: this.data.some(bi => AssetGroups.some(g => g.Name === bi.Group)) ? "#ffb" : "#fff",
			disabled: false
		};
	}

	private getLocksState(): {
		checked: "yes" | "partial" | "no";
		color: string;
		disabled: boolean;
	} {
		const lockTypes = new Set(this.data
			.filter((g): g is ItemBundle & { Property: { LockedBy: AssetLockType } } => isObject(g.Property) &&
				typeof g.Property.LockedBy === "string" &&
				AssetGet(this.character.AssetFamily, "ItemMisc", g.Property.LockedBy)?.IsLock === true
			)
			.map(g => g.Property.LockedBy));

		// Detect no locks to import
		if (lockTypes.size === 0)
			return {
				checked: "no",
				color: "#88c",
				disabled: true
			};

		if (!this.allowLocks)
			return {
				checked: "no",
				color: "#ccc",
				disabled: true
			};

		let checked: "yes" | "partial" | "no" = "no";
		const selectedLocks = Array.from(lockTypes).filter(l => enabledLocks.has(l));
		if (selectedLocks.length > 0) {
			checked = selectedLocks.length === lockTypes.size ? "yes" : "partial";
		}

		return {
			checked,
			color: "#ffb",
			disabled: false
		};
	}
}

function checkImportTypeNoChange(type: CategoryType, a: ItemBundle[], b: ItemBundle[]): boolean {
	const category = CATEGORIES[type];
	return AssetGroup
		.filter(category.filter)
		.every(g => checkImportItemNoChange(g.Name, a, b));
}

function checkImportItemNoChange(group: AssetGroupName, a: ItemBundle[], b: ItemBundle[]): boolean {
	const item1 = a.find(i => i.Group === group);
	const item2 = b.find(i => i.Group === group);
	if (item1 === undefined && item2 === undefined)
		return true;
	if (item1 === undefined || item2 === undefined)
		return false;
	return (
		item1.Group === item2.Group &&
		item1.Name === item2.Name &&
		itemColorsEquals(item1.Color, item2.Color) &&
		(item1.Difficulty ?? 0) === (item2.Difficulty ?? 0) &&
		isEqual(
			item1.Property ?? {},
			itemMergeProperties(item1.Property, item2.Property, { includeNoncursableProperties: true, lockAssignMemberNumber: Player.MemberNumber }) ?? {}
		) &&
		isEqual(item1.Craft, item2.Craft)
	);
}
