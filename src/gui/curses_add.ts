import { ChatroomCharacter } from "../characters";
import { setSubscreen } from "../modules/gui";
import { getVisibleGroupName, showHelp } from "../utilsClub";
import { GuiSubscreen } from "./subscreen";
import { ConditionsLimit } from "../constants";
import { GuiConditionViewCurses } from "./conditions_view_curses";
import { Views, HELP_TEXTS } from "../helpTexts";
import { clampWrap } from "../utils";

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

	private showHelp: boolean = false;

	constructor(character: ChatroomCharacter) {
		super();
		this.character = character;
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
			DrawText(this.failed ? `Failed to get curse data from ${this.character.Name}. Maybe you have no access?` : "Loading...", 1000, 480, "Black");
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

		for (let ciOffset = 0; ciOffset < 2; ciOffset++) {
			const ci = this.page * 2 + ciOffset;
			if (ci >= CATEGORIES.length)
				break;
			const category = CATEGORIES[ci];
			const xOffset = ciOffset % 2 ? 845 : 0;

			MainCanvas.textAlign = "left";
			MainCanvas.fillStyle = "#cccccc";
			MainCanvas.fillRect(xOffset + 105, 165, 830, 64);
			DrawText(category.title, xOffset + 120, 165 + 34, "Black");
			MainCanvas.textAlign = "center";

			if (!this.permissionMode) {
				DrawButton(xOffset + 440, 173, 265, 48, "Curse occupied", "White", undefined, "Curse all occupied slots at once");
				DrawButton(xOffset + 720, 173, 200, 48, "Curse all", "White", undefined, "Curse all slots at once");
			}

			const AssetGroups = AssetGroup.filter(category.filter);
			for (let i = 0; i < AssetGroups.length; i++) {
				const row = i % 10;
				const column = Math.floor(i / 10);
				const group = AssetGroups[i];

				const currentItem = InventoryGet(this.character.Character, group.Name);

				const itemIsCursed = this.curseData.conditions[group.Name] !== undefined;
				const accessLevel = this.curseData.limits[group.Name] ?? ConditionsLimit.normal;
				const allowCurse = [this.curseData.access_normal, this.curseData.access_limited, false][accessLevel];
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

				DrawButton(xOffset + 106 + 281 * column, 240 + 69 * row, 265, 54, getVisibleGroupName(group),
					color, undefined,
					text, itemIsCursed || !allowCurse || this.permissionMode);
			}
		}

		// permission mode legend
		if (this.permissionMode) {
			MainCanvas.fillStyle = "#50ff56";
			MainCanvas.fillRect(1284, 75, 166, 64);
			MainCanvas.fillStyle = "#f6fe78";
			MainCanvas.fillRect(1284 + 1 * 166, 75, 166, 64);
			MainCanvas.fillStyle = "#ffa7a7";
			MainCanvas.fillRect(1284 + 2 * 166, 75, 165, 64);

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
		const totalPages = Math.ceil(CATEGORIES.length / 2);
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

		for (let ciOffset = 0; ciOffset < 2; ciOffset++) {
			const ci = this.page * 2 + ciOffset;
			if (ci >= CATEGORIES.length)
				break;
			const category = CATEGORIES[ci];
			const xOffset = ciOffset % 2 ? 845 : 0;

			if (MouseIn(xOffset + 440, 173, 265, 48) && !this.permissionMode) {
				this.character.curseBatch(category.batchType, false);
				return;
			}

			if (MouseIn(xOffset + 720, 173, 200, 48) && !this.permissionMode) {
				this.character.curseBatch(category.batchType, true);
				return;
			}

			const AssetGroups = AssetGroup.filter(category.filter);
			for (let i = 0; i < AssetGroups.length; i++) {
				const row = i % 10;
				const column = Math.floor(i / 10);
				const group = AssetGroups[i];

				const itemIsCursed = this.curseData.conditions[group.Name] !== undefined;
				const accessLevel = this.curseData.limits[group.Name] ?? ConditionsLimit.normal;
				const allowCurse = [this.curseData.access_normal, this.curseData.access_limited, false][accessLevel];

				if (MouseIn(xOffset + 106 + 281 * column, 240 + 69 * row, 265, 54)) {
					if (this.permissionMode) {
						this.character.conditionSetLimit("curses", group.Name, (accessLevel + 1) % 3);
					} else if (!itemIsCursed && allowCurse) {
						this.character.curseItem(group.Name, null);
					}
					return;
				}
			}
		}

		// Pagination
		const totalPages = Math.ceil(CATEGORIES.length / 2);
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
