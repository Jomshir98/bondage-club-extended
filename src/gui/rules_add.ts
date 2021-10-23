import { ChatroomCharacter } from "../characters";
import { setSubscreen } from "../modules/gui";
import { GuiSubscreen } from "./subscreen";
import { GuiConditionViewRules } from "./conditions_view_rules";
import { RulesGetList } from "../modules/rules";
import { ConditionsLimit } from "../constants";
import { DrawImageEx, showHelp } from "../utilsClub";
import { Views, HELP_TEXTS } from "../helpTexts";
import { dictionaryProcess } from "../utils";
import { GuiRulesViewDescription } from "./rules_viewDescription";

type RuleListItem = {
	name: BCX_Rule;
	definition: RuleDisplayDefinition;
};

const PER_PAGE_COUNT = 6;

export class GuiRulesAdd extends GuiSubscreen {

	readonly character: ChatroomCharacter;

	private rulesData: ConditionsCategoryPublicData<"rules"> | null = null;
	private failed: boolean = false;
	private permissionMode: boolean = false;

	private ruleList: RuleListItem[] = [];
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
		this.rulesData = null;
		this.rebuildList();
		this.character.conditionsGetByCategory("rules").then(res => {
			this.rulesData = res;
			if (!this.rulesData.access_changeLimits) {
				this.permissionMode = false;
			}
			this.rebuildList();
		}, err => {
			console.error(`BCX: Failed to get rules info for ${this.character}`, err);
			this.failed = true;
		});
	}

	private rebuildList() {
		if (!this.active) return;

		this.ruleList = [];
		let Input = document.getElementById("BCX_RulesFilter") as HTMLInputElement | undefined;
		if (this.rulesData === null) {
			if (Input) {
				Input.remove();
			}
			return;
		}

		if (!Input) {
			Input = ElementCreateInput("BCX_RulesFilter", "text", "", "30");
			Input.addEventListener("input", ev => {
				this.rebuildList();
			});
		}

		const filter = Input.value.trim().toLocaleLowerCase().split(" ").filter(Boolean);

		for (const entry of RulesGetList()) {
			if (filter.some(i =>
				!entry[0].toLocaleLowerCase().includes(i) &&
				!entry[1].name.toLocaleLowerCase().includes(i) &&
				!entry[1].shortDescription?.toLocaleLowerCase().includes(i)
			)) continue;
			this.ruleList.push({
				name: entry[0],
				definition: entry[1]
			});
		}

		const totalPages = Math.ceil(this.ruleList.length / PER_PAGE_COUNT);
		if (this.page < 0) {
			this.page = Math.max(totalPages - 1, 0);
		} else if (this.page >= totalPages) {
			this.page = 0;
		}
	}

	Run() {
		MainCanvas.textAlign = "left";
		DrawText(`- Rules: Create new rules for ${this.character.Name} -`, 125, 125, "Black", "Gray");
		MainCanvas.textAlign = "center";
		DrawButton(1815, 75, 90, 90, "", "White", "Icons/Exit.png", "Back");
		DrawButton(1815, 190, 90, 90, "", "White", "Icons/Question.png");

		if (this.rulesData === null) {
			DrawText(this.failed ? `Failed to get rules data from ${this.character.Name}. Maybe you have no access?` : "Loading...", 1000, 480, "Black");
			return;
		}

		DrawButton(1815, 305, 90, 90, "",
			this.rulesData.access_changeLimits ? "White" : "#ddd",
			this.permissionMode ? "Icons/Reset.png" : "Icons/Preference.png",
			this.rulesData.access_changeLimits ?
				(this.permissionMode ? "Leave permission mode" : "Edit rules permissions") :
				"You have no permission to change limits",
			!this.rulesData.access_changeLimits
		);

		// filter
		MainCanvas.textAlign = "left";
		DrawText("Filter:", 130, 215, "Black");
		ElementPosition("BCX_RulesFilter", 550, 210, 600, 64);

		//reset button
		if ((document.getElementById("BCX_RulesFilter") as HTMLInputElement | undefined)?.value) {
			MainCanvas.textAlign = "center";
			DrawButton(870, 182, 64, 64, "X", "White");
		}

		// Actual rules
		MainCanvas.textAlign = "left";
		for (let off = 0; off < PER_PAGE_COUNT; off++) {
			const i = this.page * PER_PAGE_COUNT + off;
			if (i >= this.ruleList.length) break;
			const e = this.ruleList[i];
			if (e === null)
				continue;

			const Y = 275 + off * 100;
			const ruleIsCreated = this.rulesData.conditions[e.name] !== undefined;
			const accessLevel = this.rulesData.limits[e.name] ?? ConditionsLimit.normal;
			const allowAccess = [this.rulesData.access_normal, this.rulesData.access_limited, false][accessLevel];

			DrawImageEx(e.definition.icon, 125, Y, {
				Height: 64,
				Width: 64
			});

			let color: string;
			let text: string;
			if (this.permissionMode) {
				color = ["#50ff56", "#f6fe78", "#ffa7a7"][accessLevel];
				text = ["Normal", "Limited", "Blocked"][accessLevel];
			} else {
				color = ruleIsCreated ? "#88c" :
					!allowAccess ? "#ccc" : "White";
				text = ruleIsCreated ? "Already applied" :
					!allowAccess ? "You don't have permission to use this rule" : "";
			}
			// Rule name
			DrawButton(200, Y, 1350, 64, "", color, "", "", ruleIsCreated || !allowAccess || this.permissionMode);
			let description = e.definition.name;
			if (e.definition.shortDescription) {
				description += ` (${dictionaryProcess(e.definition.shortDescription, { PLAYER_NAME: this.character.Name })})`;
			}
			DrawTextFit(description, 210, Y + 34, 1340, "Black");
			if (MouseIn(200, Y, 1350, 64)) {
				DrawHoverElements.push(() => {
					DrawButtonHover(1200, Y, 60, 60, text);
				});
			}
		}

		// Pagination
		const totalPages = Math.max(1, Math.ceil(this.ruleList.length / PER_PAGE_COUNT));
		MainCanvas.textAlign = "center";
		DrawBackNextButton(1605, 800, 300, 90, `${DialogFindPlayer("Page")} ${this.page + 1} / ${totalPages}`, "White", "", () => "", () => "");

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
			showHelp(HELP_TEXTS[this.permissionMode ? Views.RulesAddPermissionMode : Views.RulesAdd]);
		}
	}

	Click() {
		if (MouseIn(1815, 75, 90, 90)) return this.Exit();
		if (MouseIn(1815, 190, 90, 90)) {
			this.showHelp = !this.showHelp;
			return;
		}

		if (this.rulesData === null)
			return;

		// Permission mode
		if (MouseIn(1815, 305, 90, 90)) {
			this.permissionMode = this.rulesData.access_changeLimits && !this.permissionMode;
			return;
		}

		//reset button
		const elem = document.getElementById("BCX_RulesFilter") as HTMLInputElement | undefined;
		if (MouseIn(870, 182, 64, 64) && elem) {
			elem.value = "";
			this.rebuildList();
		}

		// Actual rules
		for (let off = 0; off < PER_PAGE_COUNT; off++) {
			const i = this.page * PER_PAGE_COUNT + off;
			if (i >= this.ruleList.length) break;
			const e = this.ruleList[i];
			if (e === null)
				continue;

			const Y = 275 + off * 100;
			const ruleIsCreated = this.rulesData.conditions[e.name] !== undefined;
			const accessLevel = this.rulesData.limits[e.name] ?? ConditionsLimit.normal;
			const allowAccess = [this.rulesData.access_normal, this.rulesData.access_limited, false][accessLevel];

			// Rule name
			if (MouseIn(200, Y, 1350, 64)) {
				const ruleName = e.name;
				if (this.permissionMode) {
					this.character.conditionSetLimit("rules", e.name, (accessLevel + 1) % 3);
				} else if (!ruleIsCreated && allowAccess) {
					setSubscreen(new GuiRulesViewDescription(this.character, this, ruleName, true));
				}
				return;
			}
		}

		// Pagination
		const totalPages = Math.ceil(this.ruleList.length / PER_PAGE_COUNT);
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
		setSubscreen(new GuiConditionViewRules(this.character));
	}

	Unload() {
		ElementRemove("BCX_RulesFilter");
	}
}
