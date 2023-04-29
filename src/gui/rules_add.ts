import { ChatroomCharacter } from "../characters";
import { setSubscreen } from "../modules/gui";
import { GuiSubscreen } from "./subscreen";
import { GuiConditionViewRules } from "./conditions_view_rules";
import { RulesGetList, RuleType, RULE_ICONS } from "../modules/rules";
import { ConditionsLimit } from "../constants";
import { DrawImageEx, showHelp } from "../utilsClub";
import { Views, HELP_TEXTS } from "../helpTexts";
import { createInputElement, dictionaryProcess, positionElement } from "../utils";
import { GuiRulesViewDescription } from "./rules_viewDescription";

type RuleListItem = {
	name: BCX_Rule;
	definition: RuleDisplayDefinition;
};

const PER_PAGE_COUNT = 6;

let alphabeticalSort: boolean = false;
let availabilitySort: boolean = false;

export class GuiRulesAdd extends GuiSubscreen {

	readonly character: ChatroomCharacter;

	private rulesData: ConditionsCategoryPublicData<"rules"> | null = null;
	private failed: boolean = false;
	private permissionMode: boolean = false;

	private ruleList: RuleListItem[] = [];
	private page: number = 0;

	private showHelp: boolean = false;

	private filterInput = createInputElement("text", 30);
	private filterRuleType: RuleType | null = null;

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
		this.character.conditionsGetByCategory("rules").then(res => {
			this.rulesData = res;
			if (!this.rulesData.access_changeLimits) {
				this.permissionMode = false;
			}
			this.failed = false;
			this.rebuildList();
		}, err => {
			console.error(`BCX: Failed to get rules info for ${this.character}`, err);
			this.rulesData = null;
			this.failed = true;
			this.rebuildList();
		});
	}

	private rebuildList() {
		if (!this.active) return;

		this.ruleList = [];
		if (this.rulesData === null) {
			this.filterInput.remove();
			return;
		}

		if (!this.filterInput.parentElement) {
			document.body.appendChild(this.filterInput);
		}

		const filter = this.filterInput.value.trim().toLocaleLowerCase().split(" ").filter(Boolean);

		for (const entry of RulesGetList()) {
			if (this.filterRuleType != null && this.filterRuleType !== entry[1].type) {
				continue;
			}
			if (filter.some(i =>
				!entry[0].toLocaleLowerCase().includes(i) &&
				!entry[1].name.toLocaleLowerCase().includes(i) &&
				!entry[1].shortDescription?.toLocaleLowerCase().includes(i) &&
				!entry[1].keywords?.some(k => k.toLocaleLowerCase().includes(i))
			)) continue;
			this.ruleList.push({
				name: entry[0],
				definition: entry[1],
			});
		}

		const data = this.rulesData;
		if (alphabeticalSort) {
			this.ruleList.sort((a, b) => a.definition.name.localeCompare(b.definition.name));
		}
		if (availabilitySort) {
			this.ruleList.sort((a, b) => (
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
		positionElement(this.filterInput, 550, 210, 600, 64);

		// reset button
		MainCanvas.textAlign = "center";
		if (this.filterInput.value) {
			DrawButton(870, 182, 64, 64, "X", "White");
		}

		// filter buttons
		DrawButton(1083, 182, 64, 64, "ALL", this.filterRuleType != null ? "White" : "#FEC5C5");

		DrawButton(1183, 82, 64, 64, "", this.filterRuleType === RuleType.Block ? "#FEC5C5" : "White");
		DrawImageEx(RULE_ICONS[RuleType.Block], 1183 + 3, 82 + 3, { Width: 58, Height: 58 });

		DrawButton(1283, 82, 64, 64, "", this.filterRuleType === RuleType.Alt ? "#FEC5C5" : "White");
		DrawImageEx(RULE_ICONS[RuleType.Alt], 1283 + 3, 82 + 3, { Width: 58, Height: 58 });

		DrawButton(1383, 82, 64, 64, "", this.filterRuleType === RuleType.Setting ? "#FEC5C5" : "White");
		DrawImageEx(RULE_ICONS[RuleType.Setting], 1383 + 3, 82 + 3, { Width: 58, Height: 58 });

		DrawButton(1183, 182, 64, 64, "", this.filterRuleType === RuleType.RC ? "#FEC5C5" : "White");
		DrawImageEx(RULE_ICONS[RuleType.RC], 1183 + 3, 182 + 3, { Width: 58, Height: 58 });

		DrawButton(1283, 182, 64, 64, "", this.filterRuleType === RuleType.Speech ? "#FEC5C5" : "White");
		DrawImageEx(RULE_ICONS[RuleType.Speech], 1283 + 3, 182 + 3, { Width: 58, Height: 58 });

		DrawButton(1383, 182, 64, 64, "", this.filterRuleType === RuleType.Other ? "#FEC5C5" : "White");
		DrawImageEx(RULE_ICONS[RuleType.Other], 1383 + 3, 182 + 3, { Width: 58, Height: 58 });

		// sort toggle
		DrawButton(1483, 132, 64, 64, "", "White", undefined, "Toggle availability-based sorting");
		DrawImageEx("Icons/LockMenu.png", 1483 + 3, 132 + 3, { Alpha: availabilitySort ? 1 : 0.2, Width: 58, Height: 58 });

		// A-Z toggle
		DrawButton(1583, 132, 64, 64, "", "white", undefined, "Toggle alphabetical sorting");
		DrawTextFit("A-Z", 1583 + 32, 132 + 32 + 1, 64 - 4, alphabeticalSort ? "black" : "#bbb");

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
			const allowAccess = this.HasAccess(e);

			DrawImageEx(RULE_ICONS[e.definition.type], 125, Y, {
				Height: 64,
				Width: 64,
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
			DrawButton(200, Y, 1350, 64, "", color, "", "", ruleIsCreated || this.permissionMode);
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

		// reset button
		if (MouseIn(870, 182, 64, 64)) {
			this.filterInput.value = "";
			this.rebuildList();
		}

		// filter buttons
		if (MouseIn(1083, 182, 64, 64)) {
			this.filterRuleType = null;
			this.rebuildList();
		}

		if (MouseIn(1183, 82, 64, 64)) {
			this.filterRuleType = RuleType.Block;
			this.rebuildList();
		}

		if (MouseIn(1283, 82, 64, 64)) {
			this.filterRuleType = RuleType.Alt;
			this.rebuildList();
		}

		if (MouseIn(1383, 82, 64, 64)) {
			this.filterRuleType = RuleType.Setting;
			this.rebuildList();
		}

		if (MouseIn(1183, 182, 64, 64)) {
			this.filterRuleType = RuleType.RC;
			this.rebuildList();
		}

		if (MouseIn(1283, 182, 64, 64)) {
			this.filterRuleType = RuleType.Speech;
			this.rebuildList();
		}

		if (MouseIn(1383, 182, 64, 64)) {
			this.filterRuleType = RuleType.Other;
			this.rebuildList();
		}

		// sort toggle
		if (MouseIn(1483, 132, 64, 64)) {
			availabilitySort = !availabilitySort;
			this.rebuildList();
		}

		// A-Z toggle
		if (MouseIn(1583, 132, 64, 64)) {
			alphabeticalSort = !alphabeticalSort;
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
				} else if (!ruleIsCreated) {
					setSubscreen(new GuiRulesViewDescription(this.character, this, ruleName, allowAccess));
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

	HasAccess(item: RuleListItem): boolean {
		if (!this.rulesData) {
			throw new Error(`BCX: Rules data was unexpectedly 'null'`);
		}
		const accessLevel = this.rulesData.limits[item.name] ?? ConditionsLimit.normal;
		return [this.rulesData.access_normal, this.rulesData.access_limited, false][accessLevel];

	}

	Exit() {
		setSubscreen(new GuiConditionViewRules(this.character));
	}

	Unload() {
		this.filterInput.remove();
	}
}
