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
		(DialogMenuMode === "items" || DialogMenuMode === "permissions");
}

function enterSearchMode(C: Character, input?: string) {
	if (!searchBar) {
		searchBar = ElementCreateInput("BCXSearch", "text", "", "40");
		searchBar.oninput = () => {
			if (searchBar) {
				if (searchBarAutoClose && !searchBar.value) {
					exitSearchMode(C);
					MainCanvas.canvas.focus();
				} else {
					DialogInventoryBuild(C);
					DialogMenuButtonBuild(C);
				}
			}
		};
		searchBar.focus();
		searchBar.setAttribute("value", input ?? "");
		const insPoint = input?.length ?? 0;
		searchBar.setSelectionRange(insPoint, insPoint);
		DialogInventoryBuild(C);
		DialogMenuButtonBuild(C);
	}
}

function exitSearchMode(C: Character) {
	if (searchBar) {
		searchBar.remove();
		searchBar = null;
		searchBarAutoClose = false;
		DialogInventoryBuild(C);
		DialogMenuButtonBuild(C);
	}
}

export function GetDialogMenuButtonArray(): BCX_DialogMenuButton[] {
	return DialogMenuButton;
}

export function SetDialogMenuButtonArray(newValue: BCX_DialogMenuButton[]): void {
	DialogMenuButton = newValue as DialogMenuButton[];
}

export class ModuleDialog extends BaseModule {
	load() {
		OverridePlayerDialog("DialogMenuBCX_Search", "Filter items");
		OverridePlayerDialog("DialogMenuBCX_SearchExit", "");
		RedirectGetImage("Icons/BCX_Search.png", "Icons/Search.png");
		RedirectGetImage("Icons/BCX_SearchExit.png", "Icons/Remove.png");
		hookFunction("DialogMenuButtonBuild", 5, (args, next) => {
			next(args);
			if (!allowSearchMode()) {
				exitSearchMode(args[0]);
			} else if (searchBar) {
				SetDialogMenuButtonArray(["Exit", "BCX_SearchExit"]);
				if (DialogInventory.length > 12) {
					GetDialogMenuButtonArray().push("Next");
				}
			} else {
				GetDialogMenuButtonArray().splice(1, 0, "BCX_Search");
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

		hookFunction("DialogKeyDown", 5, (args, next) => {
			const ev = args[0];
			const sb = searchBar;
			if (!sb &&
				CurrentCharacter &&
				allowSearchMode() &&
				ev.key.length === 1 &&
				document.activeElement === MainCanvas.canvas &&
				!ev.altKey && !ev.ctrlKey && !ev.metaKey &&
				(struggleCooldown <= Date.now() || !["a", "s"].includes(ev.key.toLowerCase()))
			) {
				enterSearchMode(CurrentCharacter, ev.key);
				searchBarAutoClose = true;
				return true;
			}
			return next(args);
		});

		hookFunction("StruggleStrengthDraw", 0, (args, next) => {
			next(args);
			// Prevent A/S spamming from writing into search right after struggle finishes
			struggleCooldown = Date.now() + STRUGGLE_COOLDOWN_TIME;
		});
		hookFunction("StableGenericDrawProgress", 0, (args, next) => {
			next(args);
			// Prevent A/S spamming from writing into search right after struggle finishes
			struggleCooldown = Date.now() + STRUGGLE_COOLDOWN_TIME;
		});

		hookFunction("DialogInventoryAdd", 5, (args, next) => {
			if (searchBar) {
				const item = args[1];
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

		hookFunction("DialogChangeFocusToGroup", 0, (args, next) => {
			exitSearchMode(CharacterGetCurrent() ?? Player);
			return next(args);
		});

		hookFunction("DialogItemClick", 0, (args, next) => {
			next(args);
			if (DialogMenuMode !== "permissions") {
				exitSearchMode(CharacterGetCurrent() ?? Player);
			}
		});

		// Remove some buttons, if there are too many
		hookFunction("DialogMenuButtonBuild", 10, (args, next) => {
			next(args);
			const ICON_REMOVAL_CANDIDATES: BCX_DialogMenuButton[] = [
				"Prev",
				"BCX_Search",
			];
			for (const toRemove of ICON_REMOVAL_CANDIDATES) {
				if (GetDialogMenuButtonArray().length <= 9)
					break;
				const index = GetDialogMenuButtonArray().indexOf(toRemove);
				if (index >= 0) {
					GetDialogMenuButtonArray().splice(index, 1);
				}
			}
		});
	}

	run() {
		const C = CharacterGetCurrent();
		if (C) {
			DialogInventoryBuild(C);
			DialogMenuButtonBuild(C);
		}
	}

	unload() {
		exitSearchMode(CharacterGetCurrent() ?? Player);
		DialogInventoryBuild(CharacterGetCurrent() ?? Player);
		DialogMenuButtonBuild(CharacterGetCurrent() ?? Player);
	}
}
