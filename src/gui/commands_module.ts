import { ChatroomCharacter } from "../characters";
import { setSubscreen } from "../modules/gui";
import { GuiSubscreen } from "./subscreen";
import { ConditionsLimit } from "../constants";
import { DrawImageEx, showHelp } from "../utilsClub";
import { Views, HELP_TEXTS } from "../helpTexts";
import { createInputElement, dictionaryProcess, positionElement } from "../utils";
import { GuiMainMenu } from "./mainmenu";
import { CommandsGetList } from "../modules/commandsModule";
import { GuiCommandsModuleViewDetails } from "./commands_module_viewDetails";

type CommandListItem = {
	name: BCX_Command;
	definition: CommandDisplayDefinition;
};

const PER_PAGE_COUNT = 6;

let alphabeticalSort: boolean = false;
let availabilitySort: boolean = false;

export class GuiCommandsModule extends GuiSubscreen {

	readonly character: ChatroomCharacter;

	private commandsData: ConditionsCategoryPublicData<"commands"> | null = null;
	private failed: boolean = false;
	private permissionMode: boolean = false;

	private commandList: CommandListItem[] = [];
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
		this.character.conditionsGetByCategory("commands").then(res => {
			this.commandsData = res;
			if (!this.commandsData.access_changeLimits) {
				this.permissionMode = false;
			}
			this.failed = false;
			this.rebuildList();
		}, err => {
			console.error(`BCX: Failed to get commands info for ${this.character}`, err);
			this.commandsData = null;
			this.failed = true;
			this.rebuildList();
		});
	}

	private rebuildList() {
		if (!this.active) return;

		this.commandList = [];
		if (this.commandsData === null) {
			this.filterInput.remove();
			return;
		}

		if (!this.filterInput.parentElement) {
			document.body.appendChild(this.filterInput);
		}

		const filter = this.filterInput.value.trim().toLocaleLowerCase().split(" ").filter(Boolean);

		for (const entry of CommandsGetList()) {
			if (filter.some(i =>
				!entry[0].toLocaleLowerCase().includes(i) &&
				!entry[1].name.toLocaleLowerCase().includes(i) &&
				!entry[1].shortDescription?.toLocaleLowerCase().includes(i)
			)) continue;
			this.commandList.push({
				name: entry[0],
				definition: entry[1]
			});
		}

		const data = this.commandsData;
		if (alphabeticalSort) {
			this.commandList.sort((a, b) => a.definition.name.localeCompare(b.definition.name));
		}
		if (availabilitySort) {
			this.commandList.sort((a, b) => (
				(
					(this.HasAccess(b) ? 1 : 0) -
					(this.HasAccess(a) ? 1 : 0)
				) ||
				(
					(data.conditions[a.name] ? 1 : 0) -
					(data.conditions[b.name] ? 1 : 0)
				)
			));
		}

		const totalPages = Math.ceil(this.commandList.length / PER_PAGE_COUNT);
		if (this.page < 0) {
			this.page = Math.max(totalPages - 1, 0);
		} else if (this.page >= totalPages) {
			this.page = 0;
		}
	}

	Run() {
		MainCanvas.textAlign = "left";
		DrawText(`- Commands: List all commands for ${this.character.Name} -`, 125, 125, "Black", "Gray");
		MainCanvas.textAlign = "center";
		DrawButton(1815, 75, 90, 90, "", "White", "Icons/Exit.png", "BCX main menu");
		DrawButton(1815, 190, 90, 90, "", "White", "Icons/Question.png");

		if (this.commandsData === null) {
			DrawText(this.failed ? `Failed to get commands data from ${this.character.Name}. Maybe you have no access?` : "Loading...", 1000, 480, "Black");
			return;
		}

		DrawButton(1815, 305, 90, 90, "",
			this.commandsData.access_changeLimits ? "White" : "#ddd",
			this.permissionMode ? "Icons/Reset.png" : "Icons/Preference.png",
			this.commandsData.access_changeLimits ?
				(this.permissionMode ? "Leave permission mode" : "Edit commands permissions") :
				"You have no permission to change limits",
			!this.commandsData.access_changeLimits
		);

		// filter
		MainCanvas.textAlign = "left";
		DrawText("Filter:", 130, 215, "Black");
		positionElement(this.filterInput, 550, 210, 600, 64);

		// reset button
		MainCanvas.textAlign = "center";
		if (this.filterInput.value) {
			DrawButton(870, 182, 64, 64, "X", "White");
		}

		// sort toggle
		DrawButton(1483, 182, 64, 64, "", "White", undefined, "Toggle availability-based sorting");
		DrawImageEx("Icons/LockMenu.png", 1483 + 3, 182 + 3, { Alpha: availabilitySort ? 1 : 0.2, Width: 58, Height: 58 });

		// A-Z toggle
		DrawButton(1583, 182, 64, 64, "", "white", undefined, "Toggle alphabetical sorting");
		DrawTextFit("A-Z", 1583 + 32, 182 + 32 + 1, 64 - 4, alphabeticalSort ? "black" : "#bbb");

		// Actual commands
		MainCanvas.textAlign = "left";
		for (let off = 0; off < PER_PAGE_COUNT; off++) {
			const i = this.page * PER_PAGE_COUNT + off;
			if (i >= this.commandList.length) break;
			const e = this.commandList[i];
			if (e === null)
				continue;

			const Y = 275 + off * 100;
			const accessLevel = this.commandsData.limits[e.name] ?? ConditionsLimit.normal;
			const allowAccess = this.HasAccess(e);

			let color: string;
			let text: string;
			if (this.permissionMode) {
				color = ["#50ff56", "#f6fe78", "#ffa7a7"][accessLevel];
				text = ["Normal", "Limited", "Blocked"][accessLevel];
			} else {
				color = !allowAccess ? "#ccc" : "White";
				text = !allowAccess ? "You don't have permission to use this rule" : "";
			}
			// Command name
			DrawButton(130, Y, 1350, 64, "", color, "", "", this.permissionMode);
			let description = e.definition.name;
			if (e.definition.shortDescription) {
				description += ` (${dictionaryProcess(e.definition.shortDescription, { PLAYER_NAME: this.character.Name })})`;
			}
			DrawTextFit(description, 140, Y + 34, 1340, "Black");
			if (MouseIn(130, Y, 1350, 64)) {
				DrawHoverElements.push(() => {
					DrawButtonHover(1200, Y, 60, 60, text);
				});
			}
		}

		// Pagination
		const totalPages = Math.max(1, Math.ceil(this.commandList.length / PER_PAGE_COUNT));
		MainCanvas.textAlign = "center";
		DrawBackNextButton(1605, 800, 300, 90, `${DialogFindPlayer("Page")} ${this.page + 1} / ${totalPages}`, "White", "", () => "", () => "");

		// permission mode legend
		if (this.permissionMode) {
			MainCanvas.fillStyle = "#50ff56";
			MainCanvas.fillRect(1739, 574, 166, 64);
			MainCanvas.fillStyle = "#f6fe78";
			MainCanvas.fillRect(1739, 638, 166, 64);
			MainCanvas.fillStyle = "#ffa7a7";
			MainCanvas.fillRect(1739, 702, 166, 64);

			MainCanvas.textAlign = "center";
			DrawText(`Normal`, 1739 + 166 / 2, 574 + 34, "Black");
			DrawText(`Limited`, 1739 + 166 / 2, 638 + 34, "Black");
			DrawText(`Blocked`, 1739 + 166 / 2, 702 + 34, "Black");
		}

		// help text
		if (this.showHelp) {
			// TODO create and change to command ones
			showHelp(HELP_TEXTS[this.permissionMode ? Views.CommandsPermissionMode : Views.Commands]);
		}
	}

	Click() {
		if (MouseIn(1815, 75, 90, 90)) return this.Exit();
		if (MouseIn(1815, 190, 90, 90)) {
			this.showHelp = !this.showHelp;
			return;
		}

		if (this.commandsData === null)
			return;

		// Permission mode
		if (MouseIn(1815, 305, 90, 90)) {
			this.permissionMode = this.commandsData.access_changeLimits && !this.permissionMode;
			return;
		}

		// reset button
		if (MouseIn(870, 182, 64, 64)) {
			this.filterInput.value = "";
			this.rebuildList();
		}

		// sort toggle
		if (MouseIn(1483, 182, 64, 64)) {
			availabilitySort = !availabilitySort;
			this.rebuildList();
		}

		// A-Z toggle
		if (MouseIn(1583, 182, 64, 64)) {
			alphabeticalSort = !alphabeticalSort;
			this.rebuildList();
		}

		// Actual rules
		for (let off = 0; off < PER_PAGE_COUNT; off++) {
			const i = this.page * PER_PAGE_COUNT + off;
			if (i >= this.commandList.length) break;
			const e = this.commandList[i];
			if (e === null)
				continue;

			const Y = 275 + off * 100;
			const accessLevel = this.commandsData.limits[e.name] ?? ConditionsLimit.normal;

			// Command name
			if (MouseIn(130, Y, 1350, 64)) {
				const commandName = e.name;
				if (this.permissionMode) {
					this.character.conditionSetLimit("commands", e.name, (accessLevel + 1) % 3);
				} else {
					setSubscreen(new GuiCommandsModuleViewDetails(this.character, this, commandName));
				}
				return;
			}
		}

		// Pagination
		const totalPages = Math.ceil(this.commandList.length / PER_PAGE_COUNT);
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

	HasAccess(item: CommandListItem): boolean {
		if (!this.commandsData) {
			throw new Error(`BCX: Commands data was unexpectedly 'null'`);
		}
		const accessLevel = this.commandsData.limits[item.name] ?? ConditionsLimit.normal;
		return [this.commandsData.access_normal, this.commandsData.access_limited, false][accessLevel];

	}

	Exit() {
		setSubscreen(new GuiMainMenu(this.character));
	}

	Unload() {
		this.filterInput.remove();
	}
}
