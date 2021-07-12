import { ChatroomCharacter } from "../characters";
import { module_gui } from "../modules";
import { GuiSubscreen } from "./subscreen";
import { PermissionInfo } from "../modules/authority";

export class GuiAuthorityDialogSelf extends GuiSubscreen {

	readonly character: ChatroomCharacter;
	readonly permission: BCX_Permissions;
	private permissionData: PermissionInfo;

	public back: GuiSubscreen;

	constructor(character: ChatroomCharacter, permission: BCX_Permissions, data: PermissionInfo, back: GuiSubscreen) {
		super();
		this.character = character;
		this.permission = permission;
		this.permissionData = data;
		this.back = back;
	}

	Run() {

		DrawTextFit(`- Authority: Removing self access to permission "${this.permissionData.name}" -`, 125, 125, 1850, "Black", "Gray");
		MainCanvas.textAlign = "center";

		DrawText("- Warning -", 1000, 375, "Black", "Black");
		DrawText("If you confirm, you won't be able to change your access to this permission back yourself.", 1000, 525, "Black");

		DrawButton(700, 720, 200, 80, "Confirm", "White");

		DrawButton(1120, 720, 200, 80, "Cancel", "White");
	}

	Click() {
		if (MouseIn(700, 720, 200, 80)) return this.Confirm();
		if (MouseIn(1120, 720, 200, 80)) return this.Exit();

	}

	Confirm() {
		this.character.setPermission(this.permission, "self", false);
	}

	Exit() {
		module_gui.currentSubscreen = this.back;
	}

	onChange() {
		// When something changes, we bail from change dialog, because it might no longer be valid
		this.Exit();
	}
}
