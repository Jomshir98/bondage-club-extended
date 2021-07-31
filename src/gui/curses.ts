import { ChatroomCharacter } from "../characters";
import { setSubscreen } from "../modules/gui";
import { GuiMainMenu } from "./mainmenu";
import { GuiSubscreen } from "./subscreen";
import { GuiCursesAdd } from "./curses_add";
import { clamp } from "../utils";
import { getVisibleGroupName } from "../utilsClub";

const PER_COLUMN_COUNT = 7;
const PER_PAGE_COUNT = PER_COLUMN_COUNT * 2;

interface CurseEntry {
	name: string;
	group: string;
	empty: boolean;
	propertiesCursed?: boolean;
}

export class GuiCurses extends GuiSubscreen {

	readonly character: ChatroomCharacter;

	private curseEntries: CurseEntry[] = [];
	private curseData: BCX_curseInfo | null = null;
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
		this.character.curseGetInfo().then(res => {
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

		for (const [k, v] of Object.entries(this.curseData.curses)) {
			const group = AssetGroup.find(g => g.Name === k);
			if (!group) {
				console.warn(`BCX: Unknown group ${k}`);
				continue;
			}

			if (v === null) {
				this.curseEntries.push({
					group: k,
					// TODO: Name of curse for empty group
					name: `Empty: ${getVisibleGroupName(group)}`,
					empty: true
				});
			} else {
				const item = AssetGet(this.character.Character.AssetFamily, k, v.Name);
				this.curseEntries.push({
					group: k,
					// TODO: Name of curse for cursed item
					name: `${item?.Description ?? v.Name} (${getVisibleGroupName(group)})`,
					empty: false,
					propertiesCursed: v.curseProperties
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
			const X = 120 + Math.floor(off / PER_COLUMN_COUNT) * 850;

			MainCanvas.textAlign = "left";
			DrawButton(X, Y, 440, 60, "", "White");
			DrawTextFit(e.name, X + 10, Y + 30, 430, "Black");
			MainCanvas.beginPath();
			MainCanvas.rect(X + 470, Y, 150, 60);
			MainCanvas.stroke();
			MainCanvas.textAlign = "center";
			DrawTextFit("∞", X + 545, Y + 30, 150, "Gray", "Black");

			if (!e.empty) {
				const allowPropertyChange = e.propertiesCursed ? this.curseData.allowLift : this.curseData.allowCurse;

				DrawButton(X + 650, Y, 60, 60, e.propertiesCursed ? "C" : "", allowPropertyChange ? "White" : "Gray", "", "Toggle cursing item config", !allowPropertyChange);
			}

			if (this.curseData.allowLift) {
				DrawButton(X + 740, Y, 60, 60, "X", "White", "", "Lift curse");
			}
		}

		// Column separator
		MainCanvas.beginPath();
		MainCanvas.moveTo(950, 160);
		MainCanvas.lineTo(950, 780);
		MainCanvas.stroke();

		MainCanvas.textAlign = "center";

		if (this.curseData.allowCurse) {
			DrawButton(120, 820, 400, 90, "Add new curse", "White", "", "Place new curse on body, items or clothes");
		}

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
			const X = 120 + Math.floor(off / PER_COLUMN_COUNT) * 800;

			const allowPropertyChange = e.propertiesCursed ? this.curseData.allowLift : this.curseData.allowCurse;

			if (!e.empty && allowPropertyChange && MouseIn(X + 650, Y, 60, 60)) {
				this.character.curseItem(e.group, !e.propertiesCursed);
				return;
			}

			if (this.curseData.allowLift && MouseIn(X + 740, Y, 60, 60)) {
				this.character.curseLift(e.group);
				return;
			}

		}

		if (this.curseData.allowCurse && MouseIn(120, 820, 400, 90)) {
			return setSubscreen(new GuiCursesAdd(this.character));
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
