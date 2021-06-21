import { ChatroomCharacter } from "../characters";
import { module_gui } from "../modules";
import { GuiSubscreen } from "./subscreen";
import { AccessLevel, PermissionInfo } from "../modules/authority";
import { capitalizeFirstLetter } from "../utils";


export class GuiAuthorityDialogMin extends GuiSubscreen {

	readonly character: ChatroomCharacter;
	readonly permission: BCX_Permissions;
	private permissionData: PermissionInfo;

	private selectedLevel: AccessLevel;

	public back: GuiSubscreen;

	constructor(character: ChatroomCharacter, permission: BCX_Permissions, data: PermissionInfo, back: GuiSubscreen) {
		super();
		this.character = character;
		this.permission = permission;
		this.permissionData = data;
		this.back = back;

		this.selectedLevel = data.min;
	}

	Run() {

		DrawTextFit(`- Authority: Changing minimum access to permission "${this.permissionData.name}" -`, 125, 125, 1850, "Black", "Gray");
		MainCanvas.textAlign = "center";


		DrawText("Please select the new lowest role that should still have this permission.", 1000, 255, "Black");
		DrawTextFit(`Info: Currently set role: ${this.permissionData.min === AccessLevel.self ?
			this.character.Name : capitalizeFirstLetter(AccessLevel[this.permissionData.min])} → ` +
			`Newly selected role: ${this.selectedLevel === AccessLevel.self ?
				this.character.Name : capitalizeFirstLetter(AccessLevel[this.selectedLevel])}`, 1000, 320, 1850, "Black");
		DrawText("All roles to the left of the selected one will also automatically get access.", 1000, 385, "Black");

		DrawButton(1000-110, 460, 220, 72, "", this.selectedLevel === AccessLevel.self ? "Cyan" : "White", undefined, undefined, this.selectedLevel === AccessLevel.self);
		DrawTextFit(`${this.character.Name}`, 1000, 460 + 36, 210, "Black");

		for (let i = 1; i < 8; i++) {
			const current = this.selectedLevel === i;
			DrawButton(-15 + 230 * i, 577, 190, 72, "", current ? "Cyan" : "White", undefined, undefined, current);
			if (i < 7)
				DrawText(">", 196 + 230 * i, 577 + 36, "Black");
			DrawText(capitalizeFirstLetter(AccessLevel[i]), 80 + 230 * i, 577 + 36, "Black");
		}

		if (this.character.isPlayer() && this.permission === "authority_revoke_self" && this.selectedLevel !== AccessLevel.self) {
			DrawText(`WARNING: If you confirm, all permitted roles can remove your access to this and all other permissions!`, 1000, 730, "Red", "Gray");
		}

		DrawButton(700, 800, 200, 80, "", "White");
		DrawText("Confirm", 800, 840, "Black");

		DrawButton(1120, 800, 200, 80, "", "White");
		DrawText("Cancel", 1220, 840, "Black");

	}

	Click() {
		if (MouseIn(700, 800, 200, 80)) return this.Confirm();
		if (MouseIn(1120, 800, 200, 80)) return this.Exit();

		if (MouseIn(1000-110, 460, 220, 72)) {
			this.selectedLevel = AccessLevel.self;
		}

		for (let i = 1; i < 8; i++) {
			const current = this.selectedLevel === i;
			if (MouseIn(-15 + 230 * i, 577, 190, 72) && !current) {
				this.selectedLevel = i;
			}
		}

	}

	Confirm() {
		// TODO
	}

	Exit() {
		module_gui.currentSubscreen = this.back;
	}

	onChange() {
		// When something changes, we bail from change dialog, because it might no longer be valid
		this.Exit();
	}
}
