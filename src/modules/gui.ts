import { ChatroomCharacter, getChatroomCharacter } from "../characters";
import { GuiMainMenu } from "../gui/mainmenu";
import { GuiSubscreen } from "../gui/subscreen";
import { BaseModule } from "./_BaseModule";
import { hookFunction, patchFunction } from "../patching";
import { icon_BCX } from "../resources";
import { changeHandlers } from "./messaging";
import { firstTimeInit } from "./storage";
import { developmentMode } from "../utilsClub";
import { ChatroomSM } from "./chatroom";
import { GuiTutorial } from "../gui/tutorial";

export function getCurrentSubscreen(): GuiSubscreen | null {
	return ModuleGUI.instance && ModuleGUI.instance.currentSubscreen;
}

export function setSubscreen(subscreen: GuiSubscreen | null): void {
	if (!ModuleGUI.instance) {
		throw new Error("Attempt to set subscreen before init");
	}
	ModuleGUI.instance.currentSubscreen = subscreen;
}

export class ModuleGUI extends BaseModule {
	static instance: ModuleGUI | null = null;

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
		ChatroomSM.UpdateStatus();
	}

	constructor() {
		super();
		if (ModuleGUI.instance) {
			throw new Error("Duplicate initialization");
		}
		ModuleGUI.instance = this;
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
			"DrawButton(1815, 765, 90, 90,": "DrawButton(1815, 800, 90, 90,",
		});
		patchFunction("InformationSheetClick", {
			"MouseIn(1815, 765, 90, 90)": "MouseIn(1815, 800, 90, 90)",
		});
		hookFunction("InformationSheetRun", 10, (args, next) => {
			if (this._currentSubscreen) {
				MainCanvas.textAlign = "left";
				this._currentSubscreen.Run();
				MainCanvas.textAlign = "center";

				if (developmentMode) {
					if (MouseX > 0 || MouseY > 0) {
						MainCanvas.save();
						MainCanvas.lineWidth = 1;
						MainCanvas.strokeStyle = "red";
						MainCanvas.beginPath();
						MainCanvas.moveTo(0, MouseY);
						MainCanvas.lineTo(2000, MouseY);
						MainCanvas.moveTo(MouseX, 0);
						MainCanvas.lineTo(MouseX, 1000);
						MainCanvas.stroke();
						MainCanvas.fillStyle = "black";
						MainCanvas.strokeStyle = "white";
						MainCanvas.fillRect(0, 950, 250, 50);
						MainCanvas.strokeRect(0, 950, 250, 50);
						DrawText(`X: ${MouseX} Y: ${MouseY}`, 125, 975, "white");
						MainCanvas.restore();
					}
				}

				return;
			}

			next(args);
			const C = this.getInformationSheetCharacter();
			if (firstTimeInit) {
				if (C && C.isPlayer()) {
					DrawButton(1815, 685, 90, 90, "", "White", icon_BCX);
					MainCanvas.beginPath();
					MainCanvas.rect(1300, 685, 500, 90);
					MainCanvas.fillStyle = "Black";
					MainCanvas.fill();
					DrawText(`You can find BCX here ►`, 1550, 685 + 45, "White");
				}
			} else if (C && C.BCXVersion !== null) {
				const playerHasAccessToCharacter = C.playerHasAccessToCharacter();
				DrawButton(1815, 685, 90, 90, "", playerHasAccessToCharacter ? "White" : "#ddd", icon_BCX, playerHasAccessToCharacter ? "BCX" : "Needs BC item permission", !playerHasAccessToCharacter);
			}
		});

		hookFunction("InformationSheetClick", 10, (args, next) => {
			if (this._currentSubscreen) {
				return this._currentSubscreen.Click();
			}

			const C = this.getInformationSheetCharacter();
			if (MouseIn(1815, 685, 90, 90)) {
				if (firstTimeInit) {
					if (C && C.isPlayer()) {
						ServerBeep = { Message: "", Timer: 0 };
						this.currentSubscreen = new GuiTutorial(C, true);
					}
				} else if (C && C.BCXVersion !== null && C.playerHasAccessToCharacter()) {
					this.currentSubscreen = new GuiMainMenu(C);
				}
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
