import { ChatroomCharacter } from "../characters";
import { GuiSubscreen } from "./subscreen";
import { LogAccessLevel, LogConfig, LOG_CONFIG_NAMES, LOG_LEVEL_NAMES } from "../modules/log";
import { GuiLog } from "./log";
import { setSubscreen } from "../modules/gui";
import { showHelp } from "../utilsClub";
import { Views, HELP_TEXTS } from "../helpTexts";
import { createInputElement, positionElement } from "../utils";

type ConfigListItem = (
	{
		category: BCX_LogCategory;
		access: LogAccessLevel;
		name: string;
	}
);

const PER_PAGE_COUNT = 6;

export class GuiLogConfig extends GuiSubscreen {

	readonly character: ChatroomCharacter;
	private config: LogConfig | null = null;
	private failed: boolean = false;
	private configList: ConfigListItem[] = [];
	private allowDelete: boolean = false;
	private allowConfigure: boolean = false;
	private page: number = 0;

	private showHelp: boolean = false;

	private filterInput = createInputElement("text", 30);

	constructor(character: ChatroomCharacter) {
		super();
		this.character = character;
		this.filterInput.addEventListener("input", ev => {
			this.rebuildList();
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
		Promise.all([
			this.character.getLogConfig(),
			this.character.getPermissionAccess("log_delete"),
			this.character.getPermissionAccess("log_configure")
		]).then(res => {
			this.config = res[0];
			this.allowDelete = res[1];
			this.allowConfigure = res[2];
			this.failed = false;
			this.rebuildList();
		}, err => {
			console.error(`BCX: Failed to get log config for ${this.character}`, err);
			this.config = null;
			this.allowDelete = false;
			this.allowConfigure = false;
			this.failed = true;
			this.rebuildList();
		});
	}

	private rebuildList() {
		if (!this.active) return;

		this.configList = [];
		if (this.config === null) {
			this.filterInput.remove();
			return;
		}

		if (!this.filterInput.parentElement) {
			document.body.appendChild(this.filterInput);
		}

		const filter = this.filterInput.value.trim().toLocaleLowerCase().split(" ");

		for (const [k, v] of Object.entries(this.config) as [BCX_LogCategory, LogAccessLevel][]) {
			if (LOG_CONFIG_NAMES[k] !== undefined &&
				LOG_LEVEL_NAMES[v] !== undefined &&
				filter.every(i =>
					LOG_CONFIG_NAMES[k].toLocaleLowerCase().includes(i) ||
					k.toLocaleLowerCase().includes(i)
				)
			) {
				this.configList.push({
					category: k,
					access: v,
					name: LOG_CONFIG_NAMES[k]
				});
			}
		}
		this.configList.sort((a, b) => a.name.localeCompare(b.name));

		const totalPages = Math.ceil(this.configList.length / PER_PAGE_COUNT);
		if (this.page < 0) {
			this.page = Math.max(totalPages - 1, 0);
		} else if (this.page >= totalPages) {
			this.page = 0;
		}
	}

	Run() {
		if (this.config !== null) {

			// filter
			DrawText("Filter:", 130, 215, "Black");
			positionElement(this.filterInput, 550, 210, 600, 64);

			//reset button
			if (this.filterInput.value) {
				MainCanvas.textAlign = "center";
				DrawButton(870, 182, 64, 64, "X", "White");
			}

			MainCanvas.textAlign = "left";
			for (let off = 0; off < PER_PAGE_COUNT; off++) {
				const i = this.page * PER_PAGE_COUNT + off;
				if (i >= this.configList.length) break;
				const e = this.configList[i];

				const Y = 290 + off * 100;

				// Config name
				DrawButton(130, Y, 1070, 64, "", "White");
				DrawTextFit(e.name, 140, Y + 34, 1060, "Black");
				// Config access
				MainCanvas.textAlign = "center";
				if (this.allowConfigure) {
					DrawBackNextButton(1270, Y, 170, 64, LOG_LEVEL_NAMES[e.access], "White", "",
						() => (e.access > 0 ? LOG_LEVEL_NAMES[(e.access - 1) as LogAccessLevel] : ""),
						() => (e.access < 2 ? LOG_LEVEL_NAMES[(e.access + 1) as LogAccessLevel] : "")
					);
				} else {
					DrawButton(1270, Y, 170, 64, LOG_LEVEL_NAMES[e.access], "#ccc", undefined, undefined, true);
				}
				MainCanvas.textAlign = "left";
			}

			// Pagination
			const totalPages = Math.max(1, Math.ceil(this.configList.length / PER_PAGE_COUNT));
			MainCanvas.textAlign = "center";
			DrawBackNextButton(1605, 800, 300, 90, `${DialogFindPlayer("Page")} ${this.page + 1} / ${totalPages}`, "White", "", () => "", () => "");
		} else if (this.failed) {
			MainCanvas.textAlign = "center";
			DrawText(`Failed to get log config data from ${this.character.Name}. Maybe you have no access?`, 1000, 480, "Black");
		} else {
			MainCanvas.textAlign = "center";
			DrawText("Loading...", 1000, 480, "Black");
		}

		MainCanvas.textAlign = "left";

		DrawText(`- Behaviour Log: Configuration for ${this.character.Name} -`, 125, 125, "Black", "Gray");
		MainCanvas.textAlign = "center";
		if (this.allowDelete) {
			DrawButton(1525, 690, 380, 64, "Delete all log entries", "White");
		}

		// help text
		if (this.showHelp) {
			showHelp(HELP_TEXTS[Views.LogConfig]);
		}

		DrawButton(1815, 75, 90, 90, "", "White", "Icons/Exit.png", "Back");
		DrawButton(1815, 190, 90, 90, "", "White", "Icons/Question.png");
	}

	Click() {
		if (MouseIn(1815, 75, 90, 90)) return this.Exit();
		if (MouseIn(1815, 190, 90, 90)) {
			this.showHelp = !this.showHelp;
			return;
		}

		if (this.config !== null) {

			//reset button
			if (MouseIn(870, 182, 64, 64)) {
				this.filterInput.value = "";
				this.rebuildList();
			}

			for (let off = 0; off < PER_PAGE_COUNT; off++) {
				const i = this.page * PER_PAGE_COUNT + off;
				if (i >= this.configList.length) break;
				const e = this.configList[i];

				const Y = 290 + off * 100;

				if (e.access > 0 && MouseIn(1270, Y, 85, 64) && this.allowConfigure) {
					this.character.setLogConfig(e.category, (e.access - 1) as LogAccessLevel);
					return;
				} else if (e.access < 2 && MouseIn(1355, Y, 85, 64) && this.allowConfigure) {
					this.character.setLogConfig(e.category, (e.access + 1) as LogAccessLevel);
					return;
				}

			}

			// Clear log button
			if (MouseIn(1525, 690, 380, 64) && this.allowDelete) {
				this.character.logClear().then(() => {
					setSubscreen(new GuiLog(this.character));
				});
				return;
			}

			// Pagination
			const totalPages = Math.ceil(this.configList.length / PER_PAGE_COUNT);
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
	}

	Exit() {
		setSubscreen(new GuiLog(this.character));
	}

	Unload() {
		this.filterInput.remove();
	}
}
