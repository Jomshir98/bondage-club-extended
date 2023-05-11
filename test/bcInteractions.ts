import type { ModSDKModAPI } from "bondage-club-mod-sdk";
import { JSHandle, Page } from "puppeteer";
import { Assert, CreateManuallyResolvedPromise, ManuallyResolvedPromise, Test_setTimeout } from "./utils";
import { ClosePage } from "./helpers";

export type InjectedFunctionsTable = {
	BCTest_FoundAwaitedButton: (result: BCTestButton | string) => void;
	BCTest_FoundDialogLine: (result: BCTestDialogLineWithPos | string) => void;
	BCTest_FoundAwaitedText: (result: BCTestText | string) => void;
};

interface BCTestButtonHandle extends BCTestButton {
	click(): Promise<void>;
}

interface BCTestDialogLineWithPos extends DialogLine {
	pos: number;
}

interface BCTestDialogLineHandle extends BCTestDialogLineWithPos {
	click(): Promise<void>;
}

export class BCInteractionManager {
	readonly page: Page;
	apiHandle: JSHandle<ModSDKModAPI> | undefined;

	constructor(page: Page) {
		this.page = page;
	}

	async close(): Promise<void> {
		await ClosePage(this.page);
	}

	async click(x: number, y: number): Promise<void> {
		const canvasSize = await this.page.evaluate(() => ({
			width: MainCanvas.canvas.clientWidth,
			height: MainCanvas.canvas.clientHeight,
		}));

		await this.page.click("#MainCanvas", {
			delay: 30,
			offset: {
				x: (x / 2000) * canvasSize.width,
				y: (y / 1000) * canvasSize.height,
			},
		});

		await this.page.mouse.move(0, 0);
	}

	private _pendingButtonQuery: ManuallyResolvedPromise<BCTestButtonHandle> | null = null;
	async waitForButton(selector: Partial<BCTestButton>, timeout: number = 5000): Promise<BCTestButtonHandle> {
		Assert(this._pendingButtonQuery == null);

		const queryPromise = this._pendingButtonQuery = CreateManuallyResolvedPromise();

		const timer = Test_setTimeout(() => {
			queryPromise.reject("Button finding failed: Timed out");
		}, timeout);

		await this.page.evaluate((sel) => {
			window.BCTest_wantedButton = sel;
		}, selector);

		return queryPromise.promise.finally(() => {
			if (this._pendingButtonQuery === queryPromise) {
				this._pendingButtonQuery = null;
			}
			clearTimeout(timer);
		});
	}

	private _onFoundAwaitedButton(result: BCTestButton | string): void {
		if (this._pendingButtonQuery) {
			if (typeof result === "string") {
				this._pendingButtonQuery.reject(result);
			} else {
				this._pendingButtonQuery.resolve({
					...result,
					click: () => {
						return this.click(
							result.Left + Math.floor(result.Width / 2),
							result.Top + Math.floor(result.Height / 2)
						);
					},
				});
			}
		}
	}

	async clickButton(selector: Partial<BCTestButton>, timeout: number = 5000): Promise<void> {
		const button = await this.waitForButton({
			Disabled: false,
			...selector,
		}, timeout);
		await button.click();
	}

	private _pendingDialogLine: ManuallyResolvedPromise<BCTestDialogLineHandle> | null = null;
	async waitForDialogLine(selector: Partial<DialogLine>, timeout: number = 5000): Promise<BCTestDialogLineHandle> {
		Assert(this._pendingDialogLine == null);

		const queryPromise = this._pendingDialogLine = CreateManuallyResolvedPromise();

		const timer = Test_setTimeout(() => {
			queryPromise.reject("Dialog line finding failed: Timed out");
		}, timeout);

		await this.page.evaluate((sel) => {
			window.BCTest_wantedDialogLine = sel;
		}, selector);

		return queryPromise.promise.finally(() => {
			if (this._pendingDialogLine === queryPromise) {
				this._pendingDialogLine = null;
			}
			clearTimeout(timer);
		});
	}

	private _onFoundDialogButton(result: BCTestDialogLineWithPos | string): void {
		if (this._pendingDialogLine) {
			if (typeof result === "string") {
				this._pendingDialogLine.reject(result);
			} else {
				this._pendingDialogLine.resolve({
					...result,
					click: () => {
						return this.click(
							1025 + Math.floor(950 / 2),
							160 + 105 * result.pos + Math.floor(90 / 2)
						);
					},
				});
			}
		}
	}

	async clickDialogLine(selector: Partial<DialogLine>, timeout: number = 5000): Promise<void> {
		const dialogLine = await this.waitForDialogLine(selector, timeout);
		await dialogLine.click();
	}

	private _pendingTextQuery: ManuallyResolvedPromise<BCTestText> | null = null;
	async waitForText(selector: Partial<BCTestText>, timeout: number = 5000): Promise<BCTestText> {
		Assert(this._pendingTextQuery == null);

		const queryPromise = this._pendingTextQuery = CreateManuallyResolvedPromise();

		const timer = Test_setTimeout(() => {
			queryPromise.reject("Text finding failed: Timed out");
		}, timeout);

		await this.page.evaluate((sel) => {
			window.BCTest_wantedText = sel;
		}, selector);

		return queryPromise.promise.finally(() => {
			if (this._pendingTextQuery === queryPromise) {
				this._pendingTextQuery = null;
			}
			clearTimeout(timer);
		});
	}

	private _onFoundAwaitedText(result: BCTestText | string): void {
		if (this._pendingTextQuery) {
			if (typeof result === "string") {
				this._pendingTextQuery.reject(result);
			} else {
				this._pendingTextQuery.resolve(result);
			}
		}
	}

	async waitForScreen(module: string, screen: string, timeout: number = 5000): Promise<void> {
		await this.page.waitForFunction((expectedModule, expectedScreen) => CurrentModule === expectedModule && CurrentScreen === expectedScreen, {
			timeout,
		}, module, screen);
	}

	public async _init() {
		this.apiHandle = await this.page.evaluateHandle(() => window.bcModSdk.registerMod({
			name: "BCTest",
			fullName: "BC Testing Library",
			version: "0.0.0",
		}));

		const InjectedFunctions: InjectedFunctionsTable = {
			BCTest_FoundAwaitedButton: this._onFoundAwaitedButton.bind(this),
			BCTest_FoundDialogLine: this._onFoundDialogButton.bind(this),
			BCTest_FoundAwaitedText: this._onFoundAwaitedText.bind(this),
		};

		for (const [k, v] of Object.entries(InjectedFunctions)) {
			await this.page.exposeFunction(k, v);
		}

		await this.apiHandle.evaluate((api) => {
			api.hookFunction("DrawButton", -10000, (args, next) => {
				if (window.BCTest_currentButtons) {
					const [Left, Top, Width, Height, Label, Color, Image, HoveringText, Disabled] = args;
					window.BCTest_currentButtons.push({
						Left,
						Top,
						Width,
						Height,
						Label,
						Color,
						Image: Image ?? "",
						HoveringText: HoveringText ?? "",
						Disabled: !!Disabled,
					});
				}
				return next(args);
			});
			api.hookFunction("DrawText", -10000, (args, next) => {
				if (window.BCTest_currentTexts) {
					const [Text, X, Y, Color, BackColor] = args;
					if (Text) {
						window.BCTest_currentTexts.push({
							Text,
							X,
							Y,
							Color,
							BackColor: BackColor ?? "",
						});
					}
				}
				return next(args);
			});
			api.hookFunction("DrawProcess", 10000, (args, next) => {
				const currentButtons: BCTestButton[] = [];
				const wantedButton = window.BCTest_wantedButton;
				if (wantedButton) {
					window.BCTest_currentButtons = currentButtons;
				}
				const currentTexts: BCTestText[] = [];
				const wantedText = window.BCTest_wantedText;
				if (wantedText) {
					window.BCTest_currentTexts = currentTexts;
				}

				const result = next(args);

				if (wantedButton) {
					const matchingButtons = currentButtons.filter((btn) => {
						for (const [k, v] of Object.entries(wantedButton)) {
							if ((btn as unknown as Record<string, unknown>)[k] !== v)
								return false;
						}
						return true;
					});

					if (matchingButtons.length > 0) {
						delete window.BCTest_wantedButton;
						// eslint-disable-next-line no-restricted-properties
						window.setTimeout(() => {
							window.BCTest_FoundAwaitedButton(matchingButtons.length === 1 ? matchingButtons[0] : "More than one button matches");
						}, 100);
					}
				}
				if (wantedText) {
					const matchingTexts = currentTexts.filter((text) => {
						for (const [k, v] of Object.entries(wantedText)) {
							if ((text as unknown as Record<string, unknown>)[k] !== v)
								return false;
						}
						return true;
					});

					if (matchingTexts.length > 0) {
						delete window.BCTest_wantedText;
						// eslint-disable-next-line no-restricted-properties
						window.setTimeout(() => {
							window.BCTest_FoundAwaitedText(matchingTexts.length === 1 ? matchingTexts[0] : "More than one text matches");
						}, 100);
					}
				}

				return result;
			});
			api.hookFunction("DialogDraw", -10000, (args, next) => {
				const result = next(args);

				const wantedLine = window.BCTest_wantedDialogLine;
				if (wantedLine && Player.FocusGroup == null && CurrentCharacter != null && CurrentCharacter.FocusGroup == null) {
					const displayedLines: DialogLine[] = [];
					for (let D = 0; D < CurrentCharacter.Dialog.length; D++) {
						// eslint-disable-next-line eqeqeq
						if ((CurrentCharacter.Dialog[D].Stage == CurrentCharacter.Stage) && (CurrentCharacter.Dialog[D].Option != null) && DialogPrerequisite(D)) {
							displayedLines.push(CurrentCharacter.Dialog[D]);
						}
					}

					const matchingLines = displayedLines.filter((line) => {
						for (const [k, v] of Object.entries(wantedLine)) {
							if ((line as unknown as Record<string, unknown>)[k] !== v)
								return false;
						}
						return true;
					});

					if (matchingLines.length > 0) {
						delete window.BCTest_wantedDialogLine;
						// eslint-disable-next-line no-restricted-properties
						window.setTimeout(() => {
							window.BCTest_FoundDialogLine(matchingLines.length === 1 ? {
								...matchingLines[0],
								pos: displayedLines.indexOf(matchingLines[0]),
							} : "More than one button matches");
						}, 100);
					}
				}

				return result;
			});
		});
	}
}

