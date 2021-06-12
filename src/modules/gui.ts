import { ChatroomCharacter, getChatroomCharacter } from "./chatroom";
import { GuiMainMenu } from "../gui/mainmenu";
import { GuiSubscreen } from "../gui/subscreen";
import { BaseModule } from "../moduleManager";
import { hookFunction } from "../patching";
import { icon_BCX } from "../resources";

export class ModuleGUI extends BaseModule {
	currentSubscreen: GuiSubscreen | null = null;

	getInformationSheetCharacter(): ChatroomCharacter | null {
		const C = InformationSheetSelection;
		if (!C || typeof C.MemberNumber !== "number") return null;
		return getChatroomCharacter(C.MemberNumber);
	}

	load() {
		hookFunction("InformationSheetRun", 10, (args, next) => {
			if (this.currentSubscreen !== null) {
				MainCanvas.textAlign = "left";
				this.currentSubscreen.Run();
				MainCanvas.textAlign = "center";
				return;
			}

			next(args);
			const C = this.getInformationSheetCharacter();
			if (C) {
				DrawButton(1815, 650, 90, 90, "", "White", icon_BCX, "BCX");
			}
		});

		hookFunction("InformationSheetClick", 10, (args, next) => {
			if (this.currentSubscreen !== null) {
				return this.currentSubscreen.Click();
			}

			const C = this.getInformationSheetCharacter();
			if (C && MouseIn(1815, 650, 90, 90)) {
				this.currentSubscreen = new GuiMainMenu();
			} else {
				return next(args);
			}
		});

		hookFunction("InformationSheetExit", 10, (args, next) => {
			if (this.currentSubscreen !== null) {
				return this.currentSubscreen.Exit();
			}

			return next(args);
		});
	}
}
