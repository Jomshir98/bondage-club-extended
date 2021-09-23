import { ChatroomCharacter } from "../characters";
import { curseAllowItemCurseProperty } from "../modules/curses";
import { setSubscreen } from "../modules/gui";
import { DrawImageEx, getVisibleGroupName, showHelp } from "../utilsClub";
import { GuiConditionEditCurses } from "./conditions_edit_curses";
import { GuiConditionGlobalCurses } from "./conditions_global_curses";
import { ConditionEntry, GuiConditionView } from "./conditions_view_base";
import { GuiCursesAdd } from "./curses_add";
import { Views, HELP_TEXTS } from "../helpTexts";

interface CurseEntry {
	type: "clothing" | "item";
	propertiesCursed?: boolean;
	propertiesCursedShow?: boolean;
}

type dataEntry = ConditionEntry<"curses", CurseEntry>;

export class GuiConditionViewCurses extends GuiConditionView<"curses", CurseEntry> {

	constructor(character: ChatroomCharacter) {
		super(character, "curses");
	}

	override Run(): boolean {
		if (super.Run() || this.conditionCategoryData === null)
			return true;

		const access = this.conditionCategoryData.access_normal || this.conditionCategoryData.access_limited;
		DrawButton(120, 820, 384, 90, "Add new curse", access ? "White" : "#ddd", "",
			access ? "Place new curses on body, items or clothes" : "You have no permission to use this", !access);

		DrawButton(536, 820, 400, 90, "Lift all curses", access ? "White" : "#ddd", "",
			access ? "Remove all curses on body, items or clothes" : "You have no permission to use this", !access);

		// help text
		if (this.showHelp) {
			showHelp(HELP_TEXTS[Views.ConditionsViewCurses]);
		}
		return false;
	}

	override Click(): boolean {
		if (super.Click() || this.conditionCategoryData === null)
			return true;

		const access = this.conditionCategoryData.access_normal || this.conditionCategoryData.access_limited;
		if (access && MouseIn(120, 820, 384, 90)) {
			setSubscreen(new GuiCursesAdd(this.character));
			return true;
		}

		if (access && MouseIn(536, 820, 400, 90)) {
			this.character.curseLiftAll();
			return true;
		}

		return false;
	}

	protected removeLabel: string = "Lift curse";

	protected drawCategoryImage(X: number, Y: number, data: dataEntry): void {
		DrawImageEx(data.extra.type === "clothing" ? "Icons/Dress.png" : "Assets/Female3DCG/ItemArms/Preview/NylonRope.png", X + 6, Y + 6, {
			Height: 50,
			Width: 50
		});
	}

	protected drawEntryExtra(X: number, Y: number, data: dataEntry): void {
		if (data.extra.propertiesCursedShow) {
			DrawImageEx(data.extra.propertiesCursed ? "Icons/Lock.png" : "Icons/Unlock.png", X + 635, Y + 10, {
				Height: 40,
				Width: 40,
				Alpha: data.extra.propertiesCursed ? 1 : 0.2
			});
			if (MouseIn(X + 635, Y + 6, 44, 44)) {
				DrawHoverElements.push(() => {
					DrawButtonHover(X + 635, Y + 6, 44, 44, data.extra.propertiesCursed ? "Item configuration cursed" : "Item configuration not cursed");
				});
			}
		}

	}

	protected headerText(): string {
		return `Curses: All active curses on ${this.character.Name}`;
	}

	protected loadCondition(condition: ConditionsCategoryKeys["curses"], data: ConditionsConditionPublicData<"curses">): [string, CurseEntry] | null {
		const group = AssetGroup.find(g => g.Name === condition);
		if (!group) {
			console.warn(`BCX: Unknown group ${condition}`);
			return null;
		}
		if (data.data === null) {
			return [`Blocked: ${getVisibleGroupName(group)}`, {
				type: group.Clothing ? "clothing" : "item"
			}];
		} else {
			const item = AssetGet(this.character.Character.AssetFamily, condition, data.data.Name);
			return [`${item?.Description ?? data.data.Name} (${getVisibleGroupName(group)})`, {
				type: group.Clothing ? "clothing" : "item",
				propertiesCursed: data.data.curseProperties,
				propertiesCursedShow: data.data.curseProperties || !item || curseAllowItemCurseProperty(item)
			}];
		}
	}

	protected openEditSubscreen(condition: ConditionsCategoryKeys["curses"]): void {
		setSubscreen(new GuiConditionEditCurses(this.character, condition, this));
	}

	protected removeCondition(condition: ConditionsCategoryKeys["curses"]): void {
		this.character.curseLift(condition);
	}

	protected openGlobalConfig(): void {
		setSubscreen(new GuiConditionGlobalCurses(this.character, this));
	}
}