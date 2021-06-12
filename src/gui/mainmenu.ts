import { GuiSubscreen } from "./subscreen";

export class GuiMainMenu extends GuiSubscreen {
	Run() {
		DrawText("- Bondage Club Extended -", 125, 125, "Black", "Gray");
		DrawButton(1815, 75, 90, 90, "", "White", "Icons/Exit.png");
	}

	Click() {
		if (MouseIn(1815, 75, 90, 90)) this.Exit();
	}
}
