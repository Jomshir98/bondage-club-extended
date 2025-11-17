import { ChatroomCharacter } from "../characters";
import { setSubscreen } from "../modules/gui";
import { getVisibleGroupName, showHelp } from "../utilsClub";
import { GuiSubscreen } from "./subscreen";
import { ConditionsLimit } from "../constants";
import { GuiConditionViewCurses } from "./conditions_view_curses";
import { Views, HELP_TEXTS } from "../helpTexts";
import { clampWrap } from "../utils";
import { DrawQueryErrorMessage } from "../modules/messaging";

const CATEGORIES: {
	title: string;
	filter: (group: AssetGroup) => boolean;
	batchType: "items" | "clothes" | "body";
}[] =
	[
		{
			title: "Items",
			filter: g => g.Category === "Item",
			batchType: "items",
		},
		{
			title: "Clothing",
			filter: g => g.Category === "Appearance" && g.Clothing,
			batchType: "clothes",
		},
		{
			title: "Body",
			filter: g => g.Category === "Appearance" && !g.Clothing && g.AllowCustomize,
			batchType: "body",
		},
	];

export class GuiCursesAdd extends GuiSubscreen {

	readonly character: ChatroomCharacter;

	private curseData: ConditionsCategoryPublicData<"curses"> | null = null;
	private failed: boolean = false;
	private permissionMode: boolean = false;
	private page: number = 0;

	private grid: CommonGenerateGridParameters = {
		x: 106,
		y: 240,
		width: 2000 - 106 - 220,
		height: 1000 - 240 - 120,
		itemWidth: 265,
		itemHeight: 54,
		itemMarginX: 16,
		itemMarginY: 15,
		direction: "vertical",
	};

	private curseOccupiedBtn: RectTuple = [1272, 173, 265, 48];
	private curseAllBtn: RectTuple = [this.curseOccupiedBtn[0] + 280, 173, 200, 48];

	private showHelp: boolean = false;

	constructor(character: ChatroomCharacter) {
		super();
		this.character = character;

		// @ts-expect-error shut up
		if (!window.bcGrid) window.bcGrid = this.grid;
	}

	Load() {
		this.requestData();
	}

	onChange(sender: number) {
		if (sender === this.character.MemberNumber) {
			this.requestData();
		}
	}

	private requestData() {
		this.character.conditionsGetByCategory("curses").then(res => {
			this.curseData = res;
			if (!this.curseData.access_changeLimits) {
				this.permissionMode = false;
			}
			this.failed = false;
		}, err => {
			console.error(`BCX: Failed to get permission info for ${this.character}`, err);
			this.curseData = null;
			this.failed = true;
		});
	}

	Run() {
		MainCanvas.textAlign = "left";
		DrawText(`- Curses: Place new curses on ${this.character.Name} -`, 125, 125, "Black", "Gray");
		MainCanvas.textAlign = "center";
		DrawButton(1815, 75, 90, 90, "", "White", "Icons/Exit.png", "Back");
		DrawButton(1815, 190, 90, 90, "", "White", "Icons/Question.png");

		if (this.curseData === null) {
			if (this.failed) {
				DrawQueryErrorMessage(`get curse data from ${this.character.Name}`);
			} else {
				DrawText("Loading...", 1000, 480, "Black");
			}
			return;
		}

		DrawButton(1815, 305, 90, 90, "",
			this.curseData.access_changeLimits ? "White" : "#ddd",
			this.permissionMode ? "Icons/Reset.png" : "Icons/Preference.png",
			this.curseData.access_changeLimits ?
				(this.permissionMode ? "Leave permission mode" : "Edit curse slot permissions") :
				"You have no permission to change limits",
			!this.curseData.access_changeLimits
		);

		const category = CATEGORIES[this.page];
		const xOffset = 0;

		MainCanvas.textAlign = "left";
		DrawRect(xOffset + 105, 165, 1672, 64, "#cccccc");
		DrawText(category.title, xOffset + 120, 165 + 34, "Black");
		MainCanvas.textAlign = "center";

		if (!this.permissionMode) {
			DrawButton(...this.curseOccupiedBtn, "Curse occupied", "White", undefined, "Curse all occupied slots at once");
			DrawButton(...this.curseAllBtn, "Curse all", "White", undefined, "Curse all slots at once");
		}

		const AssetGroups = AssetGroup.filter(category.filter);
		const curseData = this.curseData;
		CommonGenerateGrid(AssetGroups, 0, this.grid, (group, x, y, width, height) => {
			const currentItem = InventoryGet(this.character.Character, group.Name);

			const itemIsCursed = curseData.conditions[group.Name] !== undefined;
			const accessLevel = curseData.limits[group.Name] ?? ConditionsLimit.normal;
			const allowCurse = [curseData.access_normal, curseData.access_limited, false][accessLevel];
			let color: string;
			let text: string;
			if (this.permissionMode) {
				color = ["#50ff56", "#f6fe78", "#ffa7a7"][accessLevel];
				text = ["Normal", "Limited", "Blocked"][accessLevel];
			} else {
				color = itemIsCursed ? "#88c" :
					!allowCurse ? "#ccc" :
						(currentItem ? "Gold" : "White");
				text = itemIsCursed ? "Already cursed" :
					!allowCurse ? "You have no permission to curse this" :
						(currentItem ? currentItem.Asset.Description : "Nothing");
			}

			// DrawButton(xOffset + 106 + 281 * column, 240 + 69 * row, 265, 54, getVisibleGroupName(group),
			DrawButton(x, y, width, height, getVisibleGroupName(group),
				color, undefined,
				text, itemIsCursed || !allowCurse || this.permissionMode);
			return false;
		});

		// permission mode legend
		if (this.permissionMode) {
			DrawRect(1284, 75, 166, 64, "#50ff56");
			DrawRect(1284 + 1 * 166, 75, 166, 64, "#f6fe78");
			DrawRect(1284 + 2 * 166, 75, 165, 64, "#ffa7a7");

			MainCanvas.textAlign = "center";
			DrawText(`Normal`, 1284 + 166 / 2, 75 + 34, "Black");
			DrawText(`Limited`, 1284 + 1 * 166 + 166 / 2, 75 + 34, "Black");
			DrawText(`Blocked`, 1284 + 2 * 166 + 166 / 2, 75 + 34, "Black");
		}

		// help text
		if (this.showHelp) {
			showHelp(HELP_TEXTS[this.permissionMode ? Views.CursesAddPermissionMode : Views.CursesAdd]);
		}

		// Pagination
		const totalPages = Math.ceil(CATEGORIES.length);
		DrawBackNextButton(1605, 865, 300, 90, `Page ${this.page + 1} / ${Math.max(totalPages, 1)}`, "White", "", () => "", () => "");
	}

	Click() {
		if (MouseIn(1815, 75, 90, 90)) return this.Exit();
		if (MouseIn(1815, 190, 90, 90)) {
			this.showHelp = !this.showHelp;
			return;
		}

		if (this.curseData === null)
			return;

		// Permission mode
		if (MouseIn(1815, 305, 90, 90)) {
			this.permissionMode = this.curseData.access_changeLimits && !this.permissionMode;
			return;
		}

		const category = CATEGORIES[this.page];

		if (MouseIn(...this.curseOccupiedBtn) && !this.permissionMode) {
			this.character.curseBatch(category.batchType, false);
			return;
		}

		if (MouseIn(...this.curseAllBtn) && !this.permissionMode) {
			this.character.curseBatch(category.batchType, true);
			return;
		}

		const AssetGroups = AssetGroup.filter(category.filter);
		const curseData = this.curseData;
		CommonGenerateGrid(AssetGroups, 0, this.grid, (group, x, y, width, height) => {

			const itemIsCursed = curseData.conditions[group.Name] !== undefined;
			const accessLevel = curseData.limits[group.Name] ?? ConditionsLimit.normal;
			const allowCurse = [curseData.access_normal, curseData.access_limited, false][accessLevel];

			if (MouseIn(x, y, width, height)) {
				if (this.permissionMode) {
					this.character.conditionSetLimit("curses", group.Name, (accessLevel + 1) % 3);
				} else if (!itemIsCursed && allowCurse) {
					this.character.curseItem(group.Name, null);
				}
				return true;
			}
			return false;
		});

		// Pagination
		const totalPages = CATEGORIES.length;
		if (MouseIn(1605, 865, 150, 90)) {
			this.page = clampWrap(this.page - 1, 0, totalPages - 1);
			return true;
		} else if (MouseIn(1755, 865, 150, 90)) {
			this.page = clampWrap(this.page + 1, 0, totalPages - 1);
			return true;
		}
	}

	Exit() {
		setSubscreen(new GuiConditionViewCurses(this.character));
	}
}
