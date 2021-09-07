import { ChatroomCharacter } from "../characters";
import { curseAllowItemCurseProperty } from "../modules/curses";
import { getVisibleGroupName } from "../utilsClub";
import { GuiConditionEdit } from "./conditions_edit_base";
import { GuiSubscreen } from "./subscreen";

import cloneDeep from "lodash-es/cloneDeep";

export class GuiConditionEditCurses extends GuiConditionEdit<"curses"> {

	private item: Asset | null = null;
	private allowSettingsCurse: boolean = false;

	constructor(character: ChatroomCharacter,
		conditionName: ConditionsCategoryKeys["curses"],
		back: GuiSubscreen
	) {
		super(character, "curses", conditionName, back);
	}

	protected override headerText(): string {
		const group = AssetGroup.find(i => i.Name === this.conditionName);
		return `View / Edit the '${group ? getVisibleGroupName(group) : "[ERROR]"}' curse`;
	}

	protected override onDataChange() {
		super.onDataChange();

		if (!this.conditionCategoryData || !this.conditionData) {
			return;
		}

		if (this.conditionData.data) {
			this.item = AssetGet(this.character.Character.AssetFamily, this.conditionName, this.conditionData.data.Name);
			this.allowSettingsCurse = this.conditionData.data.curseProperties || !this.item || curseAllowItemCurseProperty(this.item);
		} else {
			this.item = null;
			this.allowSettingsCurse = false;
		}

		if (this.changes && this.changes.data?.Name !== this.conditionData.data?.Name) {
			this.changes.data = cloneDeep(this.conditionData.data);
		}
	}

	Run(): boolean {
		if (super.Run() || this.conditionCategoryData === null || this.conditionData === null)
			return true;

		const data = this.changes ?? this.conditionData;
		const access = this.checkAccess();

		MainCanvas.textAlign = "left";

		////// right side: special curse category options
		if (this.allowSettingsCurse && data.data) {
			DrawCheckbox(1050, 175, 64, 64, "Also curse the item's configuration", data.data.curseProperties, !access);
			DrawText(`Example: which rope tie is used`, 1151, 287, "Black", "");
		}

		return false;
	}

	Click(): boolean {
		if (super.Click() || this.conditionCategoryData === null || this.conditionData === null)
			return true;

		if (!this.checkAccess())
			return false;

		const data = this.changes ?? this.conditionData;

		if (MouseIn(1050, 175, 64, 64) && this.allowSettingsCurse && data.data) {
			this.changes = this.makeChangesData();
			this.changes.data!.curseProperties = !this.changes.data!.curseProperties;
			return true;
		}

		return false;
	}
}
