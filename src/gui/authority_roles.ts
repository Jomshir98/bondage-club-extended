import { ChatroomCharacter } from "../characters";
import { module_gui } from "../modules";
import { GuiSubscreen } from "./subscreen";
import { AccessLevel } from "../modules/authority";
import { capitalizeFirstLetter } from "../utils";
import { GuiMainMenu } from "./mainmenu";
import { GuiAuthorityPermissions } from "./authority_permissions";



export class GuiAuthorityRoles extends GuiSubscreen {

	readonly character: ChatroomCharacter;

	constructor(character: ChatroomCharacter) {
		super();
		this.character = character;
	}

	Run() {

		DrawText("Hierarchy of roles:", 1436, 95, "Black");

		// hierarchy background
		MainCanvas.beginPath();
		MainCanvas.moveTo(1550, 134);
		MainCanvas.lineTo(1550 + 150, 134);
		MainCanvas.lineTo(1550 + 80, 740);
		MainCanvas.lineTo(1550 + 70, 740);
		MainCanvas.lineTo(1550, 134);
		MainCanvas.fillStyle = "Black";
		MainCanvas.fill();

		// hierarchy roles
		DrawButton(1520, 130, 208, 54, "", "White");
		for (let i = 1; i < 8; i++) {
			DrawButton(1530, 130 + 80 * i, 188, 54, "", "White");
		}
		MainCanvas.textAlign = "center";
		DrawTextFit(`${this.character.Name}`, 1534 + 88, 130 + 28, 198, "Black");
		for (let i = 1; i < 8; i++) {
			DrawText(capitalizeFirstLetter(AccessLevel[i]), 1534 + 88, 130 + 28 + 80 * i, "Black");
		}
		MainCanvas.textAlign = "left";



		// Pagination
		MainCanvas.textAlign = "center";
		DrawBackNextButton(1605, 800, 300, 90, `Page 1 / 1`, "White", "", () => "", () => "");
		MainCanvas.textAlign = "left";

		DrawText(`- Authority: Role Settings for ${this.character.Name} -`, 125, 125, "Black", "Gray");
		DrawButton(1815, 75, 90, 90, "", "White", "Icons/Exit.png");
		DrawButton(1815, 190, 90, 90, "", "White", "Icons/West.png");

	}

	Click() {
		if (MouseIn(1815, 75, 90, 90)) return this.Exit();
		if (MouseIn(1815, 190, 90, 90)) return this.Back();

	}

	Exit() {
		module_gui.currentSubscreen = new GuiMainMenu(this.character);
	}

	Back() {
		module_gui.currentSubscreen = new GuiAuthorityPermissions(this.character);
	}
}
