import { hookFunction } from "../patching";
import { HookDialogMenuButtonClick, OverridePlayerDialog, RedirectGetImage } from "./miscPatches";
import { BaseModule } from "./_BaseModule";

let searchBar: HTMLInputElement | null = null;
let searchBarAutoClose = false;
let struggleCooldown: number = 0;
const STRUGGLE_COOLDOWN_TIME = 2_000;

function allowSearchMode(): boolean {
	return CurrentCharacter != null &&
		(
			Player.FocusGroup != null ||
			(
				CurrentCharacter != null &&
				CurrentCharacter.FocusGroup != null &&
				CurrentCharacter.AllowItem
			)
		) &&
		DialogIntro() !== "" &&
		DialogFocusItem == null &&
		!DialogActivityMode &&
		!DialogCraftingMenu &&
		DialogColor == null &&
		StruggleProgress < 0 &&
		!StruggleLockPickOrder &&
		DialogItemToLock == null;
}

function enterSearchMode(C: Character) {
	if (!searchBar) {
		searchBar = ElementCreateInput("BCXSearch", "text", "", "40");
		searchBar.oninput = () => {
			if (searchBar) {
				if (searchBarAutoClose && !searchBar.value) {
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
		searchBarAutoClose = false;
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
			if (!sb &&
				CurrentCharacter &&
				allowSearchMode() &&
				ev.key.length === 1 &&
				!ev.altKey && !ev.ctrlKey && !ev.metaKey &&
				(struggleCooldown <= Date.now() || !["a", "s"].includes(ev.key.toLowerCase()))
			) {
				enterSearchMode(CurrentCharacter);
				searchBarAutoClose = true;
				return;
			}
			next(args);
		});

		hookFunction("StruggleDrawStrengthProgress", 0, (args, next) => {
			next(args);
			// Prevent A/S spamming from writing into search right after struggle finishes
			struggleCooldown = Date.now() + STRUGGLE_COOLDOWN_TIME;
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
			if (!DialogItemPermissionMode) {
				exitSearchMode(CharacterGetCurrent() ?? Player);
			}
		});

		// Remove some buttons, if there are too many
		hookFunction("DialogMenuButtonBuild", 10, (args, next) => {
			next(args);
			for (const toRemove of ["ChangeLayersMouth", "Prev"]) {
				if (DialogMenuButton.length <= 9)
					break;
				const index = DialogMenuButton.indexOf(toRemove);
				if (index >= 0) {
					DialogMenuButton.splice(index, 1);
				}
			}
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
