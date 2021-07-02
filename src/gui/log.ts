import { ChatroomCharacter } from "../characters";
import { module_gui } from "../modules";
import { GuiMainMenu } from "./mainmenu";
import { GuiSubscreen } from "./subscreen";
import { LogEntry, logMessageRender } from "../modules/log";
import { GuiLogConfig } from "./log_config";

const PER_PAGE_COUNT = 6;

export class GuiLog extends GuiSubscreen {

	readonly character: ChatroomCharacter;
	private failed: boolean = false;
	private logEntries: LogEntry[] | null = null;
	private allowDeletion: boolean = false;
	private allowConfiguration: boolean = false;
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
		this.logEntries = null;
		this.refreshScreen();
		Promise.all([this.character.getLogEntries(), this.character.getPermissionAccess("log_delete"), this.character.getPermissionAccess("log_configure")]).then(res => {
			this.logEntries = res[0];
			this.allowDeletion = res[1];
			this.allowConfiguration = res[2];
			this.refreshScreen();
		}, err => {
			console.error(`BCX: Failed to get log data for ${this.character}`, err);
			this.failed = true;
		});
	}

	private refreshScreen() {
		if (this.logEntries !== null) {
			const totalPages = Math.ceil(this.logEntries.length / PER_PAGE_COUNT);
			if (this.page < 0) {
				this.page = Math.max(totalPages - 1, 0);
			} else if (this.page >= totalPages) {
				this.page = 0;
			}
		}
	}

	Run() {
		if (this.logEntries !== null) {

			for (let off = 0; off < PER_PAGE_COUNT; off++) {
				const i = this.page * PER_PAGE_COUNT + off;
				if (i >= this.logEntries.length) break;
				const e = this.logEntries[i];

				const Y = 275 + off * 100;

				// Log message
				DrawButton(200, Y, 1000, 64, "", "White");
				const msg = logMessageRender(e);
				DrawTextFit(msg, 210, Y + 34, 990, msg.startsWith("[") ? "Gray" : "Black");
				DrawTextFit(new Date(e[0]).toLocaleString(), 1210, Y + 34, 300, "Gray");

				if (this.allowDeletion) {
					DrawButton(1530, Y, 64, 64, "", "White");
					DrawText("X", 1550, Y + 34, "Black");
				}
			}

			// Pagination
			const totalPages = Math.max(1, Math.ceil(this.logEntries.length / PER_PAGE_COUNT));
			MainCanvas.textAlign = "center";
			DrawBackNextButton(1605, 800, 300, 90, `${DialogFindPlayer("Page")} ${this.page + 1} / ${totalPages}`, "White", "", () => "", () => "");
		} else if (this.failed) {
			MainCanvas.textAlign = "center";
			DrawText(`Failed to get log data from ${this.character.Name}. Maybe you have no access?`, 1000, 480, "Black");
		} else {
			MainCanvas.textAlign = "center";
			DrawText("Loading...", 1000, 480, "Black");
		}

		MainCanvas.textAlign = "left";

		DrawText(`- Behaviour Log for ${this.character.Name} -`, 125, 125, "Black", "Gray");
		DrawButton(1815, 75, 90, 90, "", "White", "Icons/Exit.png");
		MainCanvas.textAlign = "center";
		DrawButton(1815, 190, 90, 90, "", this.allowConfiguration ? "White" : "#eee", "Icons/Preference.png", "Configure logging", !this.allowConfiguration);
	}

	Click() {
		if (MouseIn(1815, 75, 90, 90)) return this.Exit();
		if (MouseIn(1815, 190, 90, 90) && this.allowConfiguration) return module_gui.currentSubscreen = new GuiLogConfig(this.character);

		if (this.logEntries !== null) {

			for (let off = 0; off < PER_PAGE_COUNT; off++) {
				const i = this.page * PER_PAGE_COUNT + off;
				if (i >= this.logEntries.length) break;
				const e = this.logEntries[i];

				const Y = 275 + off * 100;

				if (this.allowDeletion && MouseIn(1530, Y, 64, 64)) {
					this.character.logMessageDelete(e[0]);
					return;
				}
			}

			// Pagination
			const totalPages = Math.ceil(this.logEntries.length / PER_PAGE_COUNT);
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
}
