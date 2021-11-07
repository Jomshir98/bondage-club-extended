import { hookFunction } from "../patching";
import { HookDialogMenuButtonClick, OverridePlayerDialog, RedirectGetImage } from "./miscPatches";
import { BaseModule } from "./_BaseModule";

let searchBar: HTMLInputElement | null = null;
let searchBarAutoCloase = false;

function allowSearchMode(): boolean {
	return DialogColor == null && StruggleProgress < 0 && !StruggleLockPickOrder && !DialogActivityMode && DialogItemToLock == null;
}

function enterSearchMode(C: Character) {
	if (!searchBar) {
		searchBar = ElementCreateInput("BCXSearch", "text", "", "40");
		searchBar.oninput = () => {
			if (searchBar) {
				if (searchBarAutoCloase && !searchBar.value) {
					exitSearchMode(C);
					MainCanvas.canvas.focus();
				} else {
					DialogInventoryBuild(C);
				}
			}
		};
		searchBar.focus();
		DialogInventoryBuild(C);
	}
}

function exitSearchMode(C: Character) {
	if (searchBar) {
		searchBar.remove();
		searchBar = null;
		searchBarAutoCloase = false;
		DialogInventoryBuild(C);
	}
}

export class ModuleDialog extends BaseModule {
	load() {
		OverridePlayerDialog("BCX_Search", "Filter items");
		OverridePlayerDialog("BCX_SearchExit", "");
		RedirectGetImage("Icons/BCX_Search.png", "Icons/Search.png");
		RedirectGetImage("Icons/BCX_SearchExit.png", "Icons/Remove.png");
		hookFunction("DialogMenuButtonBuild", 5, (args, next) => {
			next(args);
			if (!allowSearchMode()) {
				exitSearchMode(args[0]);
			} else if (searchBar) {
				DialogMenuButton = ["Exit", "BCX_SearchExit"];
				if (DialogInventory.length > 12) {
					DialogMenuButton.push("Next");
				}
			} else {
				DialogMenuButton.splice(1, 0, "BCX_Search");
			}
		});

		HookDialogMenuButtonClick("BCX_Search", (C) => {
			enterSearchMode(C);
			return true;
		});

		HookDialogMenuButtonClick("BCX_SearchExit", (C) => {
			exitSearchMode(C);
			return true;
		});

		hookFunction("CommonKeyDown", 5, (args, next) => {
			const ev = args[0] as KeyboardEvent;
			const sb = searchBar;
			if (!sb && CurrentCharacter && allowSearchMode() && ev.key.length === 1) {
				enterSearchMode(CurrentCharacter);
				searchBarAutoCloase = true;
				if (searchBar) {
					searchBar.value = ev.key;
					ev.preventDefault();
				}
				return;
			}
			next(args);
		});

		hookFunction("DialogInventoryAdd", 5, (args, next) => {
			if (searchBar) {
				const item = args[1] as Item;
				if (!searchBar.value
					.trim()
					.toLocaleLowerCase()
					.split(" ")
					.every(i =>
						item.Asset.Description.toLocaleLowerCase().includes(i) ||
						item.Asset.Name.toLocaleLowerCase().includes(i)
					)
				) {
					return;
				}
			}
			next(args);
		});

		hookFunction("DialogDrawItemMenu", 0, (args, next) => {
			if (searchBar) {
				ElementPositionFix("BCXSearch", 40, 1005, 25, 625, 60);
			}
			next(args);
		});

		hookFunction("DialogLeaveItemMenu", 0, (args, next) => {
			exitSearchMode(CharacterGetCurrent() ?? Player);
			next(args);
		});

		hookFunction("DialogItemClick", 0, (args, next) => {
			next(args);
			exitSearchMode(CharacterGetCurrent() ?? Player);
		});
	}

	run() {
		const C = CharacterGetCurrent();
		if (C) {
			DialogInventoryBuild(C);
		}
	}

	unload() {
		exitSearchMode(CharacterGetCurrent() ?? Player);
		DialogInventoryBuild(CharacterGetCurrent() ?? Player);
	}
}
