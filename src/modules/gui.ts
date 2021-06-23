import { ChatroomCharacter, getChatroomCharacter } from "../characters";
import { GuiMainMenu } from "../gui/mainmenu";
import { GuiSubscreen } from "../gui/subscreen";
import { BaseModule } from "../moduleManager";
import { hookFunction, patchFunction } from "../patching";
import { icon_BCX } from "../resources";
import { changeHandlers } from "./messaging";

export class ModuleGUI extends BaseModule {
	private _currentSubscreen: GuiSubscreen | null = null;

	get currentSubscreen(): GuiSubscreen | null {
		return this._currentSubscreen;
	}

	set currentSubscreen(subscreen: GuiSubscreen | null) {
		if (this._currentSubscreen) {
			this._currentSubscreen.Unload();
		}
		this._currentSubscreen = subscreen;
		if (this._currentSubscreen) {
			this._currentSubscreen.Load();
		}
	}

	getInformationSheetCharacter(): ChatroomCharacter | null {
		const C = InformationSheetSelection;
		if (!C || typeof C.MemberNumber !== "number") return null;
		return getChatroomCharacter(C.MemberNumber);
	}

	init() {
		changeHandlers.push(source => {
			if (this._currentSubscreen) {
				this._currentSubscreen.onChange(source);
			}
		});
	}

	load() {
		patchFunction("InformationSheetRun", {
			'DrawButton(1815, 765, 90, 90,': 'DrawButton(1815, 800, 90, 90,'
		});
		patchFunction("InformationSheetClick", {
			'MouseIn(1815, 765, 90, 90)': 'MouseIn(1815, 800, 90, 90)'
		});
		hookFunction("InformationSheetRun", 10, (args, next) => {
			if (this._currentSubscreen) {
				MainCanvas.textAlign = "left";
				this._currentSubscreen.Run();
				MainCanvas.textAlign = "center";
				return;
			}

			next(args);
			const C = this.getInformationSheetCharacter();
			if (C && C.BCXVersion !== null) {
				DrawButton(1815, 685, 90, 90, "", "White", icon_BCX, "BCX");
			}
		});

		hookFunction("InformationSheetClick", 10, (args, next) => {
			if (this._currentSubscreen) {
				return this._currentSubscreen.Click();
			}

			const C = this.getInformationSheetCharacter();
			if (C && C.BCXVersion !== null && MouseIn(1815, 685, 90, 90)) {
				this.currentSubscreen = new GuiMainMenu(C);
			} else {
				return next(args);
			}
		});

		hookFunction("InformationSheetExit", 10, (args, next) => {
			if (this._currentSubscreen) {
				return this._currentSubscreen.Exit();
			}

			return next(args);
		});
	}

	unload() {
		this.currentSubscreen = null;
	}
}
