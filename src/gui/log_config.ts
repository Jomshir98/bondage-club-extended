import { ChatroomCharacter } from "../characters";
import { module_gui } from "../modules";
import { GuiMainMenu } from "./mainmenu";
import { GuiSubscreen } from "./subscreen";
import { LogAccessLevel, LogConfig } from "../modules/log";
import { GuiLog } from "./log";

type ConfigListItem = (
	{
		category: BCX_LogCategory;
		access: LogAccessLevel;
		name: string;
	}
);

const PER_PAGE_COUNT = 6;

const CONFIG_NAMES: Record<BCX_LogCategory, string> = {
	logConfigChange: "Log changes in logging configuration",
	logDeleted: "Log deleted log entries"
};

const LEVEL_NAMES: Record<LogAccessLevel, string> = {
	[LogAccessLevel.everyone]: "[ERROR]",
	[LogAccessLevel.none]: "No",
	[LogAccessLevel.protected]: "Protected",
	[LogAccessLevel.normal]: "Yes"
};

export class GuiLogConfig extends GuiSubscreen {

	readonly character: ChatroomCharacter;
	private config: LogConfig | null = null;
	private failed: boolean = false;
	private configList: ConfigListItem[] = [];
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
		this.config = null;
		this.rebuildList();
		Promise.all([this.character.getLogConfig()]).then(res => {
			this.config = res[0];
			this.rebuildList();
		}, err => {
			console.error(`BCX: Failed to get log config for ${this.character}`, err);
			this.failed = true;
		});
	}

	private rebuildList() {
		this.configList = [];
		let Input = document.getElementById("BCX_LogConfigFilter") as HTMLInputElement | undefined;
		if (this.config === null) {
			if (Input) {
				Input.remove();
			}
			return;
		}

		if (!Input) {
			Input = ElementCreateInput("BCX_LogConfigFilter", "text", "", "30");
			Input.addEventListener("input", ev => {
				this.rebuildList();
			});
		}

		const filter = Input.value.trim().toLocaleLowerCase().split(" ");

		for (const [k, v] of Object.entries(this.config) as [BCX_LogCategory, LogAccessLevel][]) {
			if (CONFIG_NAMES[k] !== undefined &&
				LEVEL_NAMES[v] !== undefined &&
				filter.every(i =>
					CONFIG_NAMES[k].toLocaleLowerCase().includes(i) ||
					k.toLocaleLowerCase().includes(i)
				)
			) {
				this.configList.push({
					category: k,
					access: v,
					name: CONFIG_NAMES[k]
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
			ElementPosition("BCX_LogConfigFilter", 550, 210, 600, 64);

			//reset button
			if ((document.getElementById("BCX_LogConfigFilter") as HTMLInputElement | undefined)?.value) {
				DrawButton(870, 182, 64, 64, "", "White");
				DrawText("X", 890, 217, "Black");
			}

			for (let off = 0; off < PER_PAGE_COUNT; off++) {
				const i = this.page * PER_PAGE_COUNT + off;
				if (i >= this.configList.length) break;
				const e = this.configList[i];

				const Y = 275 + off * 100;

				// Config name
				DrawButton(200, Y, 1000, 64, "", "White");
				DrawTextFit(e.name, 210, Y + 34, 990, "Black");
				// Config access
				MainCanvas.textAlign = "center";
				DrawBackNextButton(1370, Y, 170, 64, LEVEL_NAMES[e.access], "White", "",
					() => (e.access > 0 ? LEVEL_NAMES[(e.access-1) as LogAccessLevel] : ""),
					() => (e.access < 2 ? LEVEL_NAMES[(e.access+1) as LogAccessLevel] : "")
				);
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
		DrawButton(1815, 75, 90, 90, "", "White", "Icons/Exit.png");
		DrawButton(1815, 190, 90, 90, "", "White", "Icons/West.png");
	}

	Click() {
		if (MouseIn(1815, 75, 90, 90)) return this.Exit();

		if (MouseIn(1815, 190, 90, 90)) return module_gui.currentSubscreen = new GuiLog(this.character);

		if (this.config !== null) {

			//reset button
			const elem = document.getElementById("BCX_LogConfigFilter") as HTMLInputElement | undefined;
			if (MouseIn(870, 182, 64, 64) && elem) {
				elem.value = "";
				this.rebuildList();
			}

			for (let off = 0; off < PER_PAGE_COUNT; off++) {
				const i = this.page * PER_PAGE_COUNT + off;
				if (i >= this.configList.length) break;
				const e = this.configList[i];

				const Y = 275 + off * 100;

				if (e.access > 0 && MouseIn(1370, Y, 85, 64)) {
					this.character.setLogConfig(e.category, (e.access-1) as LogAccessLevel);
					return;
				} else if (e.access < 2 && MouseIn(1455, Y, 85, 64)) {
					this.character.setLogConfig(e.category, (e.access+1) as LogAccessLevel);
					return;
				}

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
		module_gui.currentSubscreen = new GuiMainMenu(this.character);
	}

	Unload() {
		ElementRemove("BCX_LogConfigFilter");
	}
}
