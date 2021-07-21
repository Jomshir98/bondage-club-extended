import { setSubscreen } from "../modules/gui";
import { clearAllData } from "../modules/storage";
import { GuiSubscreen } from "./subscreen";

export class GuiGlobalDialogClearData extends GuiSubscreen {

	public back: GuiSubscreen;

	private allowedConfirmTime: number | null = 0;

	constructor(back: GuiSubscreen) {
		super();
		this.back = back;
	}

	Load() {
		this.allowedConfirmTime = Date.now() + 10_000;
	}

	Run() {
		MainCanvas.textAlign = "center";

		DrawText(`- Permanent deletion of ALL Bondage Club Extended data -`, 1000, 125, "Black");

		DrawText("- Warning -", 1000, 225, "Black", "Black");
		DrawText("If you confirm, all BCX data (including settings, curses, logs, ...) will be permanently deleted!", 1000, 325, "Black");

		DrawText("As part of the deletion process, the window will reload, logging you out of your account.", 1000, 500, "Gray");
		DrawText("You will be able to use BCX again, but none of your current data will be coming back!", 1000, 550, "Gray");

		DrawText("This action cannot be undone!", 1000, 625, "Red", "Black");

		if (this.allowedConfirmTime === null) {
			DrawText("Deleting...", 1000, 720, "Black");
			return;
		}

		const now = Date.now();
		if (now < this.allowedConfirmTime) {
			DrawButton(300, 720, 200, 80, `Confirm (${Math.floor((this.allowedConfirmTime - now) / 1000)})`, "Gray", undefined, undefined, true);
		} else {
			DrawButton(300, 720, 200, 80, "Confirm", "White");
		}

		DrawButton(1520, 720, 200, 80, "Cancel", "White");
	}

	Click() {
		if (this.allowedConfirmTime === null) return;

		if (MouseIn(1520, 720, 200, 80)) return this.Exit();

		if (MouseIn(300, 720, 200, 80) && Date.now() >= this.allowedConfirmTime) return this.Confirm();
	}

	Confirm() {
		this.allowedConfirmTime = null;
		clearAllData();
	}

	Exit() {
		if (this.allowedConfirmTime === null) return;
		setSubscreen(this.back);
	}
}
