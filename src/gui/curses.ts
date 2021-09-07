import { ChatroomCharacter } from "../characters";
import { setSubscreen } from "../modules/gui";
import { GuiMainMenu } from "./mainmenu";
import { GuiSubscreen } from "./subscreen";
import { GuiCursesAdd } from "./curses_add";
import { clamp } from "../utils";
import { getVisibleGroupName, DrawImageEx } from "../utilsClub";
import { curseAllowItemCurseProperty } from "../modules/curses";
import { GuiConditionEditCurses } from "./conditions_edit_curses";
import { GuiConditionGlobalCurses } from "./conditions_global_curses";
import { ConditionsLimit } from "../constants";

const PER_COLUMN_COUNT = 7;
const PER_PAGE_COUNT = PER_COLUMN_COUNT * 2;

interface CurseEntry {
	name: string;
	group: string;
	access: boolean;
	data: ConditionsConditionPublicData<"curses">;
	type: "clothing" | "item";
	propertiesCursed?: boolean;
	propertiesCursedShow?: boolean;
}

export class GuiCurses extends GuiSubscreen {

	readonly character: ChatroomCharacter;

	private curseEntries: CurseEntry[] = [];
	private curseData: ConditionsCategoryPublicData<"curses"> | null = null;
	private failed: boolean = false;
	private page: number = 0;

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
		this.curseData = null;
		this.rebuildList();
		this.character.conditionsGetByCategory("curses").then(res => {
			this.curseData = res;
			this.rebuildList();
		}, err => {
			console.error(`BCX: Failed to get curse info for ${this.character}`, err);
			this.failed = true;
		});
	}

	private rebuildList() {
		if (!this.active) return;

		this.curseEntries = [];

		if (this.curseData === null)
			return;

		for (const [k, v] of Object.entries<ConditionsConditionPublicData<"curses">>(this.curseData.conditions)) {
			const group = AssetGroup.find(g => g.Name === k);
			if (!group) {
				console.warn(`BCX: Unknown group ${k}`);
				continue;
			}

			const access = [this.curseData.access_normal, this.curseData.access_limited, false][this.curseData.limits[k] ?? ConditionsLimit.normal];

			if (v.data === null) {
				this.curseEntries.push({
					group: k,
					name: `Blocked: ${getVisibleGroupName(group)}`,
					access,
					data: v,
					type: group.Clothing ? "clothing" : "item"
				});
			} else {
				const item = AssetGet(this.character.Character.AssetFamily, k, v.data.Name);
				this.curseEntries.push({
					group: k,
					name: `${item?.Description ?? v.data.Name} (${getVisibleGroupName(group)})`,
					access,
					data: v,
					type: group.Clothing ? "clothing" : "item",
					propertiesCursed: v.data.curseProperties,
					propertiesCursedShow: v.data.curseProperties || !item || curseAllowItemCurseProperty(item)
				});
			}
		}

		this.page = clamp(this.page, 0, Math.ceil(this.curseEntries.length / PER_PAGE_COUNT));
	}

	Run() {
		MainCanvas.textAlign = "left";
		DrawText(`- Curses: All active curses on ${this.character.Name} -`, 125, 125, "Black", "Gray");
		MainCanvas.textAlign = "center";
		DrawButton(1815, 75, 90, 90, "", "White", "Icons/Exit.png", "BCX main menu");

		// Column separator
		MainCanvas.beginPath();
		MainCanvas.moveTo(953, 160);
		MainCanvas.lineTo(953, 780);
		MainCanvas.stroke();

		if (this.curseData === null) {
			MainCanvas.textAlign = "center";
			DrawText(this.failed ? `Failed to get curse data from ${this.character.Name}. Maybe you have no access?` : "Loading...", 1000, 480, "Black");
			return;
		}

		for (let off = 0; off < PER_PAGE_COUNT; off++) {
			const i = this.page * PER_PAGE_COUNT + off;
			if (i >= this.curseEntries.length) break;
			const e = this.curseEntries[i];

			const Y = 170 + (off % PER_COLUMN_COUNT) * 90;
			const X = 120 + Math.floor(off / PER_COLUMN_COUNT) * 865;

			const useGlobalCategorySetting = !e.data.requirements;

			// curse description
			MainCanvas.textAlign = "left";
			MainCanvas.beginPath();
			MainCanvas.rect(X, Y, 440, 60);
			MainCanvas.stroke();
			DrawImageEx(e.type === "clothing" ? "Icons/Dress.png" : "Assets/Female3DCG/ItemArms/Preview/NylonRope.png", X + 6, Y + 6, {
				Height: 50,
				Width: 50
			});
			DrawTextFit(e.name, X + 65, Y + 30, 375, "Black");

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
				const seconds = Math.floor((e.data.timer - Date.now()) / 1000);
				const minutes = Math.floor(seconds / 60);
				const hours = Math.floor(minutes / 60);
				const days = Math.floor(hours / 24);
				if (days > 1) {
					timeLeftText = `${days}d`;
				} else if (hours > 1) {
					timeLeftText = `${hours}h`;
				} else if (minutes > 1) {
					timeLeftText = `${minutes}m`;
				} else if (seconds > 0) {
					timeLeftText = `${seconds}s`;
				}
			}
			DrawText(timeLeftText, X + 570, Y + 30, "Black", "");
			if (e.propertiesCursedShow) {
				DrawImageEx(e.propertiesCursed ? "Icons/Lock.png" : "Icons/Unlock.png", X + 635, Y + 10, {
					Height: 40,
					Width: 40,
					Alpha: e.propertiesCursed ? 1 : 0.2
				});
			}

			// remove curse
			if (e.access) {
				DrawButton(X + 740, Y, 60, 60, "X", "White", "", "Lift curse");
			}

			if (MouseIn(X + 470, Y, 60, 60)) DrawButtonHover(X + 470, Y, 60, 60, "Change this curse's configuration");
			if (MouseIn(X + 531, Y, 78, 60)) DrawButtonHover(X + 531, Y, 78, 60, "Remaining duration of the curse");
			if (MouseIn(X + 635, Y + 6, 44, 44) && e.propertiesCursedShow) DrawButtonHover(X + 635, Y + 6, 44, 44, e.propertiesCursed ? "Item configuration cursed" : "Item configuration not cursed");
		}

		MainCanvas.textAlign = "center";

		const access = this.curseData.access_normal || this.curseData.access_limited;
		DrawButton(120, 820, 384, 90, "Add new curse", access ? "White" : "#ddd", "",
		access ? "Place new curses on body, items or clothes" : "You have no permission to use this", !access);

		DrawButton(536, 820, 400, 90, "Lift all curses", access ? "White" : "#ddd", "",
		access ? "Remove all curses on body, items or clothes" : "You have no permission to use this", !access);

		DrawButton(968, 820, 605, 90, "", this.curseData.access_configure ? "White" : "#ddd", "",
			this.curseData.access_configure ? "Existing curses set to global curses config are also changed" : "You have no permission to use this", !this.curseData.access_configure);
		DrawText(`Change global curses config`, 968 + 680/2, 865, "Black", "");
		MainCanvas.beginPath();
		MainCanvas.ellipse(968 + 10 + 35, 820 + 44, 34, 34, 360, 0, 360);
		MainCanvas.fillStyle = "#0052A3";
		MainCanvas.fill();
		DrawImageEx("Icons/General.png", 968 + 10, 820 + 10, {
			Height: 70,
			Width: 70
		});

		// Pagination
		const totalPages = Math.ceil(this.curseEntries.length / PER_PAGE_COUNT);
		DrawBackNextButton(1605, 820, 300, 90, `Page ${this.page + 1} / ${Math.max(totalPages, 1)}`, "White", "", () => "", () => "");
	}

	Click() {
		if (MouseIn(1815, 75, 90, 90)) return this.Exit();

		if (this.curseData === null)
			return;

		for (let off = 0; off < PER_PAGE_COUNT; off++) {
			const i = this.page * PER_PAGE_COUNT + off;
			if (i >= this.curseEntries.length) break;
			const e = this.curseEntries[i];

			const Y = 170 + (off % PER_COLUMN_COUNT) * 90;
			const X = 120 + Math.floor(off / PER_COLUMN_COUNT) * 865;

			// config button info
			if (MouseIn(X + 470, Y, 240, 60)) {
				return setSubscreen(new GuiConditionEditCurses(this.character, e.group, this));
			}

			if (e.access && MouseIn(X + 740, Y, 60, 60)) {
				this.character.curseLift(e.group);
				return;
			}

		}

		const access = this.curseData.access_normal || this.curseData.access_limited;
		if (access && MouseIn(120, 820, 384, 90)) {
			return setSubscreen(new GuiCursesAdd(this.character));
		}

		if (access && MouseIn(536, 820, 400, 90)) {
			this.character.curseLiftAll();
			return;
		}

		if (this.curseData.access_configure && MouseIn(968, 820, 605, 90)) {
			return setSubscreen(new GuiConditionGlobalCurses(this.character, this));
		}

		// Pagination
		const totalPages = Math.ceil(this.curseEntries.length / PER_PAGE_COUNT);
		if (MouseIn(1605, 800, 150, 90)) {
			this.page--;
			if (this.page < 0) {
				this.page = Math.max(totalPages - 1, 0);
			}
		} else if (MouseIn(1755, 800, 150, 90)) {
			this.page++;
			if (this.page >= totalPages) {
				this.page = 0;
			}
		}

	}

	Exit() {
		setSubscreen(new GuiMainMenu(this.character));
	}
}
