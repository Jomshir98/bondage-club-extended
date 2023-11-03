import { ChatroomCharacter } from "../characters";
import { GuiMainMenu } from "./mainmenu";
import { GuiSubscreen } from "./subscreen";
import { LogAccessLevel, LogEntry, logMessageRender } from "../modules/log";
import { GuiLogConfig } from "./log_config";
import { DrawImageEx, showHelp } from "../utilsClub";
import { setSubscreen } from "../modules/gui";
import { Views, HELP_TEXTS } from "../helpTexts";
import { createInputElement, positionElement } from "../utils";
import { DrawQueryErrorMessage } from "../modules/messaging";

const PER_PAGE_COUNT = 5;

export class GuiLog extends GuiSubscreen {

	readonly character: ChatroomCharacter;
	private failed: boolean = false;
	private logData: LogEntry[] | null = null;
	private logEntries: LogEntry[] = [];
	private allowDeletion: boolean = false;
	private allowConfiguration: boolean = false;
	private allowPraise: boolean = false;
	private allowLeaveMessage: boolean = false;
	private page: number = 0;
	private showMore: boolean[] = new Array(PER_PAGE_COUNT).fill(false);

	private showHelp: boolean = false;

	private filterInput = createInputElement("text", 30);

	constructor(character: ChatroomCharacter) {
		super();
		this.character = character;
		this.filterInput.addEventListener("input", ev => {
			this.refreshScreen();
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
			this.character.getLogEntries(),
			this.character.logGetAllowedActions(),
		]).then(res => {
			this.logData = res[0];
			this.allowDeletion = res[1].delete;
			this.allowConfiguration = res[1].configure || this.character.isPlayer();
			this.allowPraise = res[1].praise;
			this.allowLeaveMessage = res[1].leaveMessage;
			this.failed = false;
			this.refreshScreen();
		}, err => {
			console.error(`BCX: Failed to get log data for ${this.character}`, err);
			this.logData = null;
			this.failed = true;
			this.refreshScreen();
		});
	}

	private refreshScreen() {
		if (!this.active) return;

		this.logEntries = [];

		let NoteField = document.getElementById("BCX_NoteField") as HTMLInputElement | undefined;

		if (this.logData === null) {
			this.filterInput.remove();
			if (NoteField) {
				NoteField.remove();
			}
			return;
		}

		if (!this.filterInput.parentElement) {
			document.body.appendChild(this.filterInput);
		}

		if (!this.allowLeaveMessage && NoteField) {
			NoteField.remove();
		} else if (this.allowLeaveMessage && !NoteField) {
			NoteField = ElementCreateInput("BCX_NoteField", "text", "", "30");
		}

		const filter = this.filterInput.value.trim().toLocaleLowerCase().split(" ");

		this.logEntries = this.logData.filter(e => {
			const msg = logMessageRender(e, this.character).toLocaleLowerCase();
			return filter.every(f => msg.includes(f));
		});

		const totalPages = Math.ceil(this.logEntries.length / PER_PAGE_COUNT);
		if (this.page < 0) {
			this.page = Math.max(totalPages - 1, 0);
		} else if (this.page >= totalPages) {
			this.page = 0;
		}
	}

	Run() {
		if (this.logData !== null) {

			// filter
			DrawText("Filter:", 130, 215, "Black");
			positionElement(this.filterInput, 550, 210, 600, 64);

			//reset and delete all button
			if (this.filterInput.value) {
				MainCanvas.textAlign = "center";
				DrawButton(870, 182, 64, 64, "X", "White");
				if (this.allowDeletion) {
					DrawButton(1270, 182, 420, 64, "Delete all filtered log entries", "White");
				}
			}

			for (let off = 0; off < PER_PAGE_COUNT; off++) {
				const i = this.page * PER_PAGE_COUNT + off;
				if (i >= this.logEntries.length) break;
				const e = this.logEntries[i];

				const Y = 290 + off * 95;

				// Log message
				DrawImageEx(e[1] === LogAccessLevel.protected ? "Icons/Security.png" : "Icons/Public.png", 125, Y, {
					Height: 64,
					Width: 64,
				});

				MainCanvas.textAlign = "left";
				const msg = logMessageRender(e, this.character);
				if (this.showMore[off]) {
					MainCanvas.fillStyle = "#ffff88";
					MainCanvas.fillRect(200, Y - 32, 1030, 128);
					MainCanvas.strokeStyle = "Black";
					MainCanvas.strokeRect(200, Y - 32, 1030, 128);
					DrawTextWrap(msg, 200 - 970 / 2, Y - 32 + 5, 990, 128 - 10, "black", undefined, 3);
				} else {
					DrawButton(200, Y, 1030, 64, "", "White");
					let msgSmall = msg;
					if (msg.length > 95) {
						msgSmall = msgSmall.slice(0, 80) + "... >> click <<";
					}
					DrawTextFit(msgSmall, 210, Y + 34, 1020, msgSmall.startsWith("[") ? "Gray" : "Black");
				}
				MainCanvas.beginPath();
				MainCanvas.rect(1270, Y, 320, 64);
				MainCanvas.stroke();
				DrawTextFit(new Date(e[0]).toLocaleString(), 1290, Y + 34, 300, "Black", "");
				MainCanvas.textAlign = "center";

				if (this.allowDeletion) {
					DrawButton(1630, Y, 64, 64, "X", "White", "", "Delete log entry");
				}

				if (MouseIn(125, Y, 64, 64)) {
					DrawButtonHover(125, Y, 64, 64, e[1] === LogAccessLevel.protected ? "Protected visibility" : "Normal visibility");
				}
			}

			// Message field
			if (this.allowLeaveMessage) {
				MainCanvas.textAlign = "left";
				DrawText("Attach", 130, 831, "Black");
				DrawText("note:", 130, 869, "Black");
				ElementPosition("BCX_NoteField", 580, 842, 660, 64);
			}
			MainCanvas.textAlign = "center";
			// Praise button
			if (this.allowPraise) {
				DrawButton(950, 815, 150, 64, "Praise", "White");
			}
			// Leave message button
			if (this.allowLeaveMessage) {
				DrawButton(1150, 815, 200, 64, "Only note", "White");
			}
			// Scold button
			if (this.allowPraise) {
				DrawButton(1400, 815, 150, 64, "Scold", "White");
			}

			// Pagination
			const totalPages = Math.max(1, Math.ceil(this.logEntries.length / PER_PAGE_COUNT));
			DrawBackNextButton(1605, 800, 300, 90, `${DialogFindPlayer("Page")} ${this.page + 1} / ${totalPages}`, "White", "", () => "", () => "");
		} else if (this.failed) {
			MainCanvas.textAlign = "center";
			DrawQueryErrorMessage(`get log data from ${this.character.Name}`);
		} else {
			MainCanvas.textAlign = "center";
			DrawText("Loading...", 1000, 480, "Black");
		}

		// help text
		if (this.showHelp) {
			showHelp(HELP_TEXTS[Views.Log]);
		}

		MainCanvas.textAlign = "left";
		DrawText(`- Behaviour Log: About ${this.character.Name} -`, 125, 125, "Black", "Gray");
		MainCanvas.textAlign = "center";
		DrawButton(1815, 75, 90, 90, "", "White", "Icons/Exit.png", "BCX main menu");
		DrawButton(1815, 190, 90, 90, "", "White", "Icons/Question.png");
		DrawButton(1815, 305, 90, 90, "", this.allowConfiguration ? "White" : "#ddd", "Icons/Preference.png", "Configure logging", !this.allowConfiguration);
	}

	Click() {
		if (MouseIn(1815, 75, 90, 90)) return this.Exit();
		if (MouseIn(1815, 190, 90, 90)) {
			this.showHelp = !this.showHelp;
			return;
		}
		if (MouseIn(1815, 305, 90, 90) && this.allowConfiguration) return setSubscreen(new GuiLogConfig(this.character));

		if (this.logData !== null) {

			//reset button
			if (MouseIn(870, 182, 64, 64)) {
				this.filterInput.value = "";
				this.refreshScreen();
			}

			// Clear all filtered logs button
			if (MouseIn(1270, 182, 420, 64) && this.allowDeletion) {
				this.character.logMessageDelete(this.logEntries.map(e => e[0]));
				return;
			}

			for (let off = 0; off < PER_PAGE_COUNT; off++) {
				const i = this.page * PER_PAGE_COUNT + off;
				if (i >= this.logEntries.length) break;
				const e = this.logEntries[i];

				const Y = 290 + off * 95;

				if (this.allowDeletion && MouseIn(1630, Y, 64, 64)) {
					this.character.logMessageDelete(e[0]);
					return;
				}

				if (MouseIn(200, Y - 32, 1030, 128) && this.showMore[off]) {
					this.showMore[off] = !this.showMore[off];
				} else if (MouseIn(200, Y, 1030, 64)) {
					if (this.showMore.includes(true)) {
						this.showMore.fill(false);
					}
					this.showMore[off] = !this.showMore[off];
				}
			}

			const field = document.getElementById("BCX_NoteField") as HTMLInputElement | undefined;
			const msg = field?.value || null;
			let didPraise = false;

			// Praise button
			if (this.allowPraise && MouseIn(950, 815, 150, 64)) {
				this.character.logPraise(1, msg);
				didPraise = true;
			}
			// Leave message button
			if (this.allowLeaveMessage && MouseIn(1150, 815, 200, 64) && msg) {
				this.character.logPraise(0, msg);
				didPraise = true;
			}
			// Scold button
			if (this.allowPraise && MouseIn(1400, 815, 150, 64)) {
				this.character.logPraise(-1, msg);
				didPraise = true;
			}

			if (didPraise) {
				this.allowPraise = false;
				if (field) {
					field.value = "";
				}
				return;
			}

			// Pagination
			const totalPages = Math.ceil(this.logEntries.length / PER_PAGE_COUNT);
			if (MouseIn(1605, 800, 150, 90)) {
				this.showMore.fill(false);
				this.page--;
				if (this.page < 0) {
					this.page = Math.max(totalPages - 1, 0);
				}
			} else if (MouseIn(1755, 800, 150, 90)) {
				this.showMore.fill(false);
				this.page++;
				if (this.page >= totalPages) {
					this.page = 0;
				}
			}
		}
	}

	Exit() {
		setSubscreen(new GuiMainMenu(this.character));
	}

	Unload() {
		this.filterInput.remove();
		ElementRemove("BCX_NoteField");
	}
}
