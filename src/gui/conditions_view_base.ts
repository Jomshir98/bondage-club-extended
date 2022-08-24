import { ChatroomCharacter } from "../characters";
import { setSubscreen } from "../modules/gui";
import { GuiMainMenu } from "./mainmenu";
import { GuiSubscreen } from "./subscreen";
import { clamp, createInputElement, formatTimeInterval, positionElement } from "../utils";
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

let alphabeticalSort: boolean = false;
let activeSort: boolean = false;

export abstract class GuiConditionView<CAT extends ConditionsCategories, ExtraData> extends GuiSubscreen {

	readonly character: ChatroomCharacter;
	readonly conditionCategory: CAT;
	readonly conditionCategorySingular: string;

	private conditionEntries: ConditionEntry<CAT, ExtraData>[] = [];
	protected conditionCategoryData: ConditionsCategoryPublicData<CAT> | null = null;
	private failed: boolean = false;
	private page: number = 0;

	protected showHelp: boolean = false;

	private filterInput = createInputElement("text", 30);

	constructor(character: ChatroomCharacter,
		conditionCategory: CAT
	) {
		super();
		this.character = character;
		this.conditionCategory = conditionCategory;
		this.conditionCategorySingular = conditionCategory.slice(0, -1);
		this.filterInput.addEventListener("input", ev => {
			this.onDataChange();
		});
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
		this.character.conditionsGetByCategory(this.conditionCategory).then(res => {
			if (!this.active)
				return;
			this.conditionCategoryData = res;
			this.failed = false;
			this.onDataChange();
		}, err => {
			console.error(`BCX: Failed to get condition info for ${this.conditionCategory} from ${this.character}`, err);
			this.conditionCategoryData = null;
			this.failed = true;
			this.onDataChange();
		});
	}

	private onDataChange() {
		if (!this.active) return;

		this.conditionEntries = [];

		if (this.conditionCategoryData === null) {
			this.filterInput.remove();
			return;
		}

		if (!this.filterInput.parentElement) {
			document.body.appendChild(this.filterInput);
		}

		const filter = this.filterInput.value.trim().toLocaleLowerCase().split(" ").filter(Boolean);

		for (const [condition, data] of Object.entries<ConditionsConditionPublicData<CAT>>(this.conditionCategoryData.conditions)) {
			const res = this.loadCondition(condition as ConditionsCategoryKeys[CAT], data);
			if (res === null)
				continue;

			const access = [this.conditionCategoryData.access_normal, this.conditionCategoryData.access_limited, false][this.conditionCategoryData.limits[condition as ConditionsCategoryKeys[CAT]] ?? ConditionsLimit.normal];

			if (filter.some(i =>
				!condition.toLocaleLowerCase().includes(i) &&
				!res[0].toLocaleLowerCase().includes(i)
			)) continue;

			this.conditionEntries.push({
				condition,
				access,
				data,
				displayName: res[0],
				extra: res[1]
			});
		}

		this.conditionEntries = this.sortEntries(this.conditionEntries);

		this.page = clamp(this.page, 0, Math.ceil(this.conditionEntries.length / PER_PAGE_COUNT));
	}

	protected sortEntries(entries: ConditionEntry<CAT, ExtraData>[]): ConditionEntry<CAT, ExtraData>[] {
		entries.sort((a, b) => (!a.data.favorite && b.data.favorite) ? 1 : ((a.data.favorite && !b.data.favorite) ? -1 : 0));
		if (alphabeticalSort) {
			entries.sort((a, b) => a.displayName.localeCompare(b.displayName));
		}
		if (activeSort) {
			entries.sort((a, b) => (
				(
					(b.data.active ? 1 : 0) -
					(a.data.active ? 1 : 0)
				)
			));
		}
		return entries;
	}

	Run(): boolean {
		MainCanvas.textAlign = "left";
		DrawText(`- ${this.headerText()} -`, 125, 125, "Black", "Gray");
		MainCanvas.textAlign = "center";
		DrawButton(1815, 75, 90, 90, "", "White", "Icons/Exit.png");
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
			if (
				(off + 1) % PER_COLUMN_COUNT === 0 ||		// smaller click area for an element at the end of a full column
					i === this.conditionEntries.length - 1 ?	// smaller click area for the last element on the list
					MouseIn(X, Y, 440, 60) : MouseIn(X, Y, 440, 90)
			) {
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
					DrawButtonHover(X + 470, Y, 60, 60, `Change this ${this.conditionCategorySingular}'s configuration`);
				});
			}
			if (MouseIn(X + 531, Y, 78, 60)) {
				DrawHoverElements.push(() => {
					DrawButtonHover(X + 531, Y, 78, 60, `Remaining duration of the ${this.conditionCategorySingular}`);
				});
			}
		}

		MainCanvas.textAlign = "center";

		// activate/deactivate buttons
		const accessFull = this.conditionCategoryData.access_normal && this.conditionCategoryData.access_limited;
		DrawButton(678, 820, 170, 50, "", accessFull ? "White" : "#ddd", "",
			accessFull ? `Switch all added ${this.conditionCategory} to active` : "You have no permission to use this", !accessFull);
		DrawTextFit(`Activate all`, 680 + 170 / 2, 820 + 25, 145, "Black", "");
		DrawButton(678, 885, 170, 46, "", accessFull ? "White" : "#ddd", "",
			accessFull ? `Activate only global config ${this.conditionCategory}` : "You have no permission to use this", !accessFull);
		DrawTextFit(`A. only`, 684 + 115 / 2, 885 + 25, 90, "Black", "");
		MainCanvas.beginPath();
		MainCanvas.ellipse(675 + 120 + 22, 885 + 23, 21, 21, 360, 0, 360);
		MainCanvas.fillStyle = "#0052A3";
		MainCanvas.fill();
		DrawImageEx("Icons/General.png", 675 + 120, 885 + 1, {
			Height: 44,
			Width: 44
		});

		DrawButton(870, 820, 170, 50, "Deactivate all", accessFull ? "White" : "#ddd", "",
			accessFull ? `Switch all added ${this.conditionCategory} to inactive` : "You have no permission to use this", !accessFull);
		DrawButton(870, 885, 170, 46, "", accessFull ? "White" : "#ddd", "",
			accessFull ? `Deactivate only global config ${this.conditionCategory}` : "You have no permission to use this", !accessFull);
		DrawTextFit(`D. only`, 876 + 115 / 2, 885 + 25, 90, "Black", "");
		MainCanvas.beginPath();
		MainCanvas.ellipse(868 + 120 + 22, 885 + 23, 21, 21, 360, 0, 360);
		MainCanvas.fillStyle = "#0052A3";
		MainCanvas.fill();
		DrawImageEx("Icons/General.png", 868 + 120, 885 + 1, {
			Height: 44,
			Width: 44
		});

		// change global config button
		DrawButton(1068, 820, 505, 90, "", this.conditionCategoryData.access_configure ? "White" : "#ddd", "",
			this.conditionCategoryData.access_configure ? `Existing ${this.conditionCategory} set to global ${this.conditionCategory} config are also changed` : "You have no permission to use this", !this.conditionCategoryData.access_configure);
		DrawTextFit(`Change global ${this.conditionCategory} config`, 1018 + 680 / 2, 865, 400, "Black", "");
		MainCanvas.beginPath();
		MainCanvas.ellipse(1068 + 10 + 35, 820 + 44, 34, 34, 360, 0, 360);
		MainCanvas.fillStyle = "#0052A3";
		MainCanvas.fill();
		DrawImageEx("Icons/General.png", 1068 + 10, 820 + 10, {
			Height: 70,
			Width: 70
		});

		// filter
		MainCanvas.textAlign = "left";
		positionElement(this.filterInput, 1200, 110, 500, 64);

		// reset button
		MainCanvas.textAlign = "center";
		if (this.filterInput.value) {
			DrawButton(1470, 82, 64, 64, "X", "White");
		}

		// sort toggle
		DrawButton(1583, 82, 64, 64, "", "White");
		DrawImageEx("Icons/Accept.png", 1583 + 3, 82 + 3, { Alpha: activeSort ? 1 : 0.2, Width: 58, Height: 58 });

		// A-Z toggle
		DrawButton(1683, 82, 64, 64, "", "White");
		DrawTextFit("A-Z", 1683 + 32, 82 + 32 + 1, 64 - 4, alphabeticalSort ? "black" : "#bbb");

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
				this.onDescriptionTextClick(e.condition as ConditionsCategoryKeys[CAT], e);
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

		// activate/deactivate buttons
		const accessFull = this.conditionCategoryData.access_normal && this.conditionCategoryData.access_limited;
		if (accessFull && MouseIn(678, 820, 170, 50)) {
			this.character.conditionUpdateMultiple(
				this.conditionCategory,
				Object.entries<ConditionsConditionPublicData<CAT>>(this.conditionCategoryData.conditions)
					.filter(([c, d]) => !d.active)
					.map(([c, d]) => c as ConditionsCategoryKeys[CAT]),
				{ active: true }
			);
			return true;
		}

		if (accessFull && MouseIn(678, 885, 170, 46)) {
			this.character.conditionUpdateMultiple(
				this.conditionCategory,
				Object.entries<ConditionsConditionPublicData<CAT>>(this.conditionCategoryData.conditions)
					.filter(([c, d]) => !d.active && d.requirements === null)
					.map(([c, d]) => c as ConditionsCategoryKeys[CAT]),
				{ active: true }
			);
			return true;
		}

		if (accessFull && MouseIn(870, 820, 170, 50)) {
			this.character.conditionUpdateMultiple(
				this.conditionCategory,
				Object.entries<ConditionsConditionPublicData<CAT>>(this.conditionCategoryData.conditions)
					.filter(([c, d]) => d.active)
					.map(([c, d]) => c as ConditionsCategoryKeys[CAT]),
				{ active: false }
			);
			return true;
		}

		if (accessFull && MouseIn(870, 885, 170, 46)) {
			this.character.conditionUpdateMultiple(
				this.conditionCategory,
				Object.entries<ConditionsConditionPublicData<CAT>>(this.conditionCategoryData.conditions)
					.filter(([c, d]) => d.active && d.requirements === null)
					.map(([c, d]) => c as ConditionsCategoryKeys[CAT]),
				{ active: false }
			);
			return true;
		}

		// change global config button
		if (this.conditionCategoryData.access_configure && MouseIn(1068, 820, 505, 90)) {
			this.openGlobalConfig();
			return true;
		}

		// reset button
		if (MouseIn(1470, 82, 64, 64)) {
			this.filterInput.value = "";
			this.onDataChange();
		}

		// sort toggle
		if (MouseIn(1583, 82, 64, 64)) {
			activeSort = !activeSort;
			this.onDataChange();
		}

		// A-Z toggle
		if (MouseIn(1683, 82, 64, 64)) {
			alphabeticalSort = !alphabeticalSort;
			this.onDataChange();
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

	Unload() {
		this.filterInput.remove();
	}

	protected abstract removeLabel: string;

	protected abstract drawCategoryImage(X: number, Y: number, data: ConditionEntry<CAT, ExtraData>): void;
	protected abstract drawEntryExtra(X: number, Y: number, data: ConditionEntry<CAT, ExtraData>): void;

	protected abstract headerText(): string;
	protected abstract loadCondition(condition: ConditionsCategoryKeys[CAT], data: ConditionsConditionPublicData<CAT>): [string, ExtraData] | null;
	protected abstract showDetailedDescriptionBackground(X: number): void;
	protected abstract showDetailedDescriptionText(X: number, condition: ConditionsCategoryKeys[CAT], data: ConditionEntry<CAT, ExtraData>): void;
	protected abstract onDescriptionTextClick(condition: ConditionsCategoryKeys[CAT], data: ConditionEntry<CAT, ExtraData>): void;
	protected abstract openEditSubscreen(condition: ConditionsCategoryKeys[CAT]): void;
	protected abstract removeCondition(condition: ConditionsCategoryKeys[CAT]): void;
	protected abstract openGlobalConfig(): void;
}
