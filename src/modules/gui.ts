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
import { BCXGlobalEventSystem } from "../event";

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
		BCXGlobalEventSystem.emitEvent("bcxSubscreenChange", {
			inBcxSubscreen: subscreen != null,
		});
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
		hookFunction("InformationSheetLoad", 10, async (args, next) => {
			const ret = await next(args);

			const C = this.getInformationSheetCharacter();

			if (!C) return ret;

			const playerHasAccessToCharacter = C.playerHasAccessToCharacter();

			let button: HTMLButtonElement | null = null;
			if (firstTimeInit && C.isPlayer()) {
				button = ElementButton.Create(null, () => {
					unloadInfoSheet();
					this.currentSubscreen = new GuiTutorial(C, true);
				},
				{
					image: icon_BCX,
					disabled: !playerHasAccessToCharacter,
					tooltip: "You can find BCX here ►",
				},
				{
					tooltip: {
						style: {
							visibility: "visible",
						},
					},
					button: {
						style: {
							marginTop: "auto",
						},
					},
				});
			} else if (!firstTimeInit && C.BCXVersion !== null) {
				const tooltip = playerHasAccessToCharacter ? "BCX" : "Needs BC item permission";
				button = ElementButton.Create(null, () => {
					unloadInfoSheet();
					this.currentSubscreen = new GuiMainMenu(C);
				},
				{
					image: icon_BCX,
					disabled: !playerHasAccessToCharacter,
					tooltip,
				},
				{
					button: {
						style: {
							marginTop: "auto",
						},
					},
				});
			}
			if (button) {
			// @ts-expect-error - bc-stubs need update
				const menu = ElementWrap(`${InformationSheetIDs.screen}-menu`);
				menu?.append(button);
			}
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
		});

		const unloadInfoSheet = () => {
			InformationSheetUnload();
		};

		hookFunction("InformationSheetClick", 10, (args, next) => {
			if (this._currentSubscreen) {
				return this._currentSubscreen.Click();
			}

			return next(args);
		});

		hookFunction("InformationSheetExit", 10, (args, next) => {
			if (this._currentSubscreen) {
				this._currentSubscreen.Exit();
				return;
			}

			return next(args);
		});
	}

	unload() {
		this.currentSubscreen = null;
	}
}
