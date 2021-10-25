import { ChatroomCharacter } from "../characters";
import { setSubscreen } from "../modules/gui";
import { GuiMainMenu } from "./mainmenu";
import { GuiSubscreen } from "./subscreen";
import { clamp, formatTimeInterval } from "../utils";
import { DrawImageEx } from "../utilsClub";
import { ConditionsLimit } from "../constants";

const PER_COLUMN_COUNT = 7;
const PER_PAGE_COUNT = PER_COLUMN_COUNT * 2;

export interface ConditionEntry<CAT extends ConditionsCategories, ExtraData> {
	displayName: string;
	condition: string;
	access: boolean;
	data: ConditionsConditionPublicData<CAT>;
	extra: ExtraData
}

export abstract class GuiConditionView<CAT extends ConditionsCategories, ExtraData> extends GuiSubscreen {

	readonly character: ChatroomCharacter;
	readonly conditionCategory: CAT;
	readonly conditionCategorySingluar: string;

	private conditionEntries: ConditionEntry<CAT, ExtraData>[] = [];
	protected conditionCategoryData: ConditionsCategoryPublicData<CAT> | null = null;
	private failed: boolean = false;
	private page: number = 0;

	protected showHelp: boolean = false;

	constructor(character: ChatroomCharacter,
		conditionCategory: CAT
	) {
		super();
		this.character = character;
		this.conditionCategory = conditionCategory;
		this.conditionCategorySingluar = conditionCategory.slice(0, -1);
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
		this.conditionCategoryData = null;
		this.failed = false;
		this.onDataChange();
		this.character.conditionsGetByCategory(this.conditionCategory).then(res => {
			if (!this.active)
				return;
			this.conditionCategoryData = res;
			this.onDataChange();
		}, err => {
			console.error(`BCX: Failed to get condition info for ${this.conditionCategory} from ${this.character}`, err);
			this.failed = true;
		});
	}

	private onDataChange() {
		if (!this.active) return;

		this.conditionEntries = [];

		if (this.conditionCategoryData === null)
			return;

		for (const [condition, data] of Object.entries<ConditionsConditionPublicData<CAT>>(this.conditionCategoryData.conditions)) {
			const res = this.loadCondition(condition as ConditionsCategoryKeys[CAT], data);
			if (res === null)
				continue;

			const access = [this.conditionCategoryData.access_normal, this.conditionCategoryData.access_limited, false][this.conditionCategoryData.limits[condition as ConditionsCategoryKeys[CAT]] ?? ConditionsLimit.normal];

			this.conditionEntries.push({
				condition,
				access,
				data,
				displayName: res[0],
				extra: res[1]
			});
		}

		this.page = clamp(this.page, 0, Math.ceil(this.conditionEntries.length / PER_PAGE_COUNT));
	}

	Run(): boolean {
		MainCanvas.textAlign = "left";
		DrawText(`- ${this.headerText()} -`, 125, 125, "Black", "Gray");
		MainCanvas.textAlign = "center";
		DrawButton(1815, 75, 90, 90, "", "White", "Icons/Exit.png", "BCX main menu");
		DrawButton(1815, 190, 90, 90, "", "White", "Icons/Question.png");

		if (this.conditionCategoryData === null) {
			MainCanvas.textAlign = "center";
			DrawText(this.failed ? `Failed to get data from ${this.character.Name}. Maybe you have no access?` : "Loading...", 1000, 480, "Black");
			return true;
		}

		// Column separator
		MainCanvas.beginPath();
		MainCanvas.moveTo(953, 160);
		MainCanvas.lineTo(953, 780);
		MainCanvas.stroke();

		for (let off = 0; off < PER_PAGE_COUNT; off++) {
			const i = this.page * PER_PAGE_COUNT + off;
			if (i >= this.conditionEntries.length) break;
			const e = this.conditionEntries[i];

			const Y = 170 + (off % PER_COLUMN_COUNT) * 90;
			const X = 120 + Math.floor(off / PER_COLUMN_COUNT) * 865;

			const useGlobalCategorySetting = !e.data.requirements;

			// description detailed hover text
			if (MouseIn(X, Y, 440, 90)) {
				DrawHoverElements.push(() => {
					this.showDetailedDescriptionBackground(off < PER_COLUMN_COUNT ? 985 : 120);
					if (MouseIn(X, Y, 440, 60)) {
						this.showDetailedDescriptionText(off < PER_COLUMN_COUNT ? 985 : 120, e.condition as ConditionsCategoryKeys[CAT], e);
					}
				});
			}

			// description
			MainCanvas.textAlign = "left";
			DrawButton(X, Y, 440, 60, "", "White");
			this.drawCategoryImage(X, Y, e);
			DrawTextFit(e.displayName, X + 65, Y + 30, 365, "Black");

			// config button info
			MainCanvas.textAlign = "center";
			DrawButton(X + 470, Y, 240, 60, "", e.data.active ? "#d8fed7" : "White");
			if (useGlobalCategorySetting) {
				MainCanvas.beginPath();
				MainCanvas.ellipse(X + 470 + 33, Y + 30, 22, 22, 360, 0, 360);
				MainCanvas.fillStyle = "#0052A3";
				MainCanvas.fill();
			}
			DrawImageEx("Icons/General.png", X + 480, Y + 7, {
				Height: 46,
				Width: 46
			});
			// shows time left (XXd -> XXh -> XXm -> XXs) or ∞
			let timeLeftText: string = "n/a";
			if (e.data.timer === null) {
				timeLeftText = "∞";
			} else {
				timeLeftText = formatTimeInterval(e.data.timer - Date.now(), "short");
			}
			DrawText(timeLeftText, X + 570, Y + 30, "Black", "");
			this.drawEntryExtra(X, Y, e);

			// remove curse
			if (e.access) {
				DrawButton(X + 740, Y, 60, 60, "X", "White", "", this.removeLabel);
			}

			if (MouseIn(X + 470, Y, 60, 60)) {
				DrawHoverElements.push(() => {
					DrawButtonHover(X + 470, Y, 60, 60, `Change this ${this.conditionCategorySingluar}'s configuration`);
				});
			}
			if (MouseIn(X + 531, Y, 78, 60)) {
				DrawHoverElements.push(() => {
					DrawButtonHover(X + 531, Y, 78, 60, `Remaining duration of the ${this.conditionCategorySingluar}`);
				});
			}
		}

		MainCanvas.textAlign = "center";

		DrawButton(968, 820, 605, 90, "", this.conditionCategoryData.access_configure ? "White" : "#ddd", "",
			this.conditionCategoryData.access_configure ? `Existing ${this.conditionCategory} set to global ${this.conditionCategory} config are also changed` : "You have no permission to use this", !this.conditionCategoryData.access_configure);
		DrawText(`Change global ${this.conditionCategory} config`, 968 + 680 / 2, 865, "Black", "");
		MainCanvas.beginPath();
		MainCanvas.ellipse(968 + 10 + 35, 820 + 44, 34, 34, 360, 0, 360);
		MainCanvas.fillStyle = "#0052A3";
		MainCanvas.fill();
		DrawImageEx("Icons/General.png", 968 + 10, 820 + 10, {
			Height: 70,
			Width: 70
		});

		// Pagination
		const totalPages = Math.ceil(this.conditionEntries.length / PER_PAGE_COUNT);
		DrawBackNextButton(1605, 820, 300, 90, `Page ${this.page + 1} / ${Math.max(totalPages, 1)}`, "White", "", () => "", () => "");

		return false;
	}

	Click(): boolean {
		if (MouseIn(1815, 75, 90, 90)) {
			this.Exit();
			return true;
		}

		// help text
		if (MouseIn(1815, 190, 90, 90)) {
			this.showHelp = !this.showHelp;
			return true;
		}

		if (this.conditionCategoryData === null)
			return true;

		for (let off = 0; off < PER_PAGE_COUNT; off++) {
			const i = this.page * PER_PAGE_COUNT + off;
			if (i >= this.conditionEntries.length) break;
			const e = this.conditionEntries[i];

			const Y = 170 + (off % PER_COLUMN_COUNT) * 90;
			const X = 120 + Math.floor(off / PER_COLUMN_COUNT) * 865;

			// description
			if (MouseIn(X, Y, 440, 60)) {
				this.onDecriptionTextClick(e.condition as ConditionsCategoryKeys[CAT], e);
			}

			// config button info
			if (MouseIn(X + 470, Y, 240, 60)) {
				this.openEditSubscreen(e.condition as ConditionsCategoryKeys[CAT]);
				return true;
			}

			if (e.access && MouseIn(X + 740, Y, 60, 60)) {
				this.removeCondition(e.condition as ConditionsCategoryKeys[CAT]);
				return true;
			}

		}

		if (this.conditionCategoryData.access_configure && MouseIn(968, 820, 605, 90)) {
			this.openGlobalConfig();
			return true;
		}

		// Pagination
		const totalPages = Math.ceil(this.conditionEntries.length / PER_PAGE_COUNT);
		if (MouseIn(1605, 800, 150, 90)) {
			this.page--;
			if (this.page < 0) {
				this.page = Math.max(totalPages - 1, 0);
			}
			return true;
		} else if (MouseIn(1755, 800, 150, 90)) {
			this.page++;
			if (this.page >= totalPages) {
				this.page = 0;
			}
			return true;
		}
		return false;
	}

	Exit() {
		setSubscreen(new GuiMainMenu(this.character));
	}

	protected abstract removeLabel: string;

	protected abstract drawCategoryImage(X: number, Y: number, data: ConditionEntry<CAT, ExtraData>): void;
	protected abstract drawEntryExtra(X: number, Y: number, data: ConditionEntry<CAT, ExtraData>): void;

	protected abstract headerText(): string;
	protected abstract loadCondition(condition: ConditionsCategoryKeys[CAT], data: ConditionsConditionPublicData<CAT>): [string, ExtraData] | null;
	protected abstract showDetailedDescriptionBackground(X: number): void;
	protected abstract showDetailedDescriptionText(X: number, condition: ConditionsCategoryKeys[CAT], data: ConditionEntry<CAT, ExtraData>): void;
	protected abstract onDecriptionTextClick(condition: ConditionsCategoryKeys[CAT], data: ConditionEntry<CAT, ExtraData>): void;
	protected abstract openEditSubscreen(condition: ConditionsCategoryKeys[CAT]): void;
	protected abstract removeCondition(condition: ConditionsCategoryKeys[CAT]): void;
	protected abstract openGlobalConfig(): void;
}
