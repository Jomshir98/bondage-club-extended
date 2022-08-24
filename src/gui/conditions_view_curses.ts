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
	type: "body" | "clothing" | "item";
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

		DrawButton(120, 820, 250, 90, "Add new curse", "White", "",
			"Place new curses on body, items or clothes");

		const access = this.conditionCategoryData.access_normal || this.conditionCategoryData.access_limited;
		DrawButton(400, 820, 250, 90, "Lift all curses", access ? "White" : "#ddd", "",
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

		if (MouseIn(120, 820, 250, 90)) {
			setSubscreen(new GuiCursesAdd(this.character));
			return true;
		}

		const access = this.conditionCategoryData.access_normal || this.conditionCategoryData.access_limited;
		if (access && MouseIn(400, 820, 250, 90)) {
			this.character.curseLiftAll();
			return true;
		}

		return false;
	}

	protected removeLabel: string = "Lift curse";

	protected drawCategoryImage(X: number, Y: number, data: dataEntry): void {
		DrawImageEx(data.extra.type === "body" ? "Icons/Character.png" : data.extra.type === "clothing" ? "Icons/Dress.png" : "Assets/Female3DCG/ItemArms/Preview/NylonRope.png", X + 6, Y + 6, {
			Height: 50,
			Width: 50
		});
	}

	protected drawEntryExtra(X: number, Y: number, data: dataEntry): void {
		const useGlobalCategorySetting = !data.data.requirements;
		const itemRemove = useGlobalCategorySetting ? this.conditionCategoryData?.data.itemRemove : data.data.data?.itemRemove;

		if (itemRemove !== undefined && data.data.data) {
			DrawImageEx("Icons/Remove.png", X + 610, Y + 10, {
				Height: 40,
				Width: 40,
				Alpha: itemRemove ? 1 : 0.2
			});
			if (MouseIn(X + 610, Y + 6, 44, 44)) {
				DrawHoverElements.push(() => {
					DrawButtonHover(X + 610, Y + 6, 44, 44, itemRemove ? "Remove item when curse is dormant" : "Don't remove item when curse is dormant");
				});
			}
		}
		if (data.extra.propertiesCursedShow) {
			DrawImageEx(data.extra.propertiesCursed ? "Icons/Lock.png" : "Icons/Unlock.png", X + 660, Y + 10, {
				Height: 40,
				Width: 40,
				Alpha: data.extra.propertiesCursed ? 1 : 0.2
			});
			if (MouseIn(X + 660, Y + 6, 44, 44)) {
				DrawHoverElements.push(() => {
					DrawButtonHover(X + 660, Y + 6, 44, 44, data.extra.propertiesCursed ? "Item configuration cursed" : "Item configuration not cursed");
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
				type: group.Category === "Item" ? "item" : group.Clothing ? "clothing" : "body"
			}];
		} else {
			const item = AssetGet(this.character.Character.AssetFamily, condition, data.data.Name);
			return [`${item?.Description ?? data.data.Name} (${getVisibleGroupName(group)})`, {
				type: group.Category === "Item" ? "item" : group.Clothing ? "clothing" : "body",
				propertiesCursed: data.data.curseProperties,
				propertiesCursedShow: data.data.curseProperties || !item || curseAllowItemCurseProperty(item)
			}];
		}
	}

	protected showDetailedDescriptionBackground(X: number): void {
		return;
	}

	protected showDetailedDescriptionText(X: number, condition: ConditionsCategoryKeys["curses"], data: dataEntry): void {
		return;
	}

	protected onDescriptionTextClick(condition: ConditionsCategoryKeys["curses"], data: dataEntry): void {
		return;
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
