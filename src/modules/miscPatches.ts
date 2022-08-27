import { allowMode, isNModClient } from "../utilsClub";
import { BaseModule } from "./_BaseModule";
import { hookFunction, patchFunction } from "../patching";
import { MiscCheat } from "../constants";
import { modStorage, modStorageSync } from "./storage";
import { NICKNAME_REGEX } from "./relationships";

export const cheatChangeHooks: Partial<Record<MiscCheat, (enabled: boolean) => void>> = {};

export function cheatIsEnabled(cheat: MiscCheat): boolean {
	return Array.isArray(modStorage.cheats) && modStorage.cheats.includes(cheat);
}

export function cheatSetEnabled(cheat: MiscCheat, enabled: boolean) {
	if (!Array.isArray(modStorage.cheats)) {
		console.error(`BCX: Attempt to set cheat, while not initalized`);
		return;
	}

	if (enabled) {
		if (!modStorage.cheats.includes(cheat)) {
			modStorage.cheats.push(cheat);
		}
	} else {
		modStorage.cheats = modStorage.cheats.filter(c => c !== cheat);
	}
	if (cheatChangeHooks[cheat]) {
		cheatChangeHooks[cheat]!(enabled);
	}
	modStorageSync();
}

export function cheatToggle(cheat: MiscCheat) {
	cheatSetEnabled(cheat, !cheatIsEnabled(cheat));
}

const MISTRESS_CHEAT_ONLY_ITEMS = ["MistressPadlock", "MistressPadlockKey", "MistressTimerPadlock"];
const PANDORA_CHEAT_ONLY_ITEMS = ["PandoraPadlock", "PandoraPadlockKey"];

const PlayerDialogOverrides: Map<string, string> = new Map();

export function OverridePlayerDialog(keyword: string, value: string) {
	PlayerDialogOverrides.set(keyword, value);
}

const GetImageRedirects: Map<string, string> = new Map();

export function RedirectGetImage(original: string, redirect: string) {
	GetImageRedirects.set(original, redirect);
}

/**
 * Function to handle clicks on dialog menu buttons (the buttons on top right when you click character)
 * @returns `false` if original should still be called, `true` if it should be blocked
 */
export type DialogMenuButtonClickHook = (C: Character) => boolean;

const DialogMenuButtonClickHooks: Map<string, DialogMenuButtonClickHook[]> = new Map();

export function HookDialogMenuButtonClick(button: string, fn: DialogMenuButtonClickHook) {
	let arr = DialogMenuButtonClickHooks.get(button);
	if (!arr) {
		arr = [];
		DialogMenuButtonClickHooks.set(button, arr);
	}
	if (!arr.includes(fn)) {
		arr.push(fn);
	}
}

export class ModuleMiscPatches extends BaseModule {
	load() {
		if (!Array.isArray(modStorage.cheats)) {
			modStorage.cheats = [];
		} else {
			modStorage.cheats = modStorage.cheats.filter(c => MiscCheat[c] !== undefined);
		}

		hookFunction("DialogFindPlayer", 10, (args, next) => {
			const override = PlayerDialogOverrides.get(args[0]);
			if (override !== undefined)
				return override;
			return next(args);
		});

		hookFunction("DrawGetImage", 10, (args, next) => {
			const redirect = GetImageRedirects.get(args[0]);
			if (redirect !== undefined) {
				args[0] = redirect;
			}
			return next(args);
		});

		hookFunction("DialogMenuButtonClick", 5, (args, next) => {
			// Finds the current icon
			const C = CharacterGetCurrent();
			for (let I = 0; I < DialogMenuButton.length; I++) {
				if ((MouseX >= 1885 - I * 110) && (MouseX <= 1975 - I * 110) && C) {
					const hooks = DialogMenuButtonClickHooks.get(DialogMenuButton[I]);
					if (hooks?.some(hook => hook(C)))
						return;
				}
			}
			return next(args);
		});

		hookFunction("AsylumEntranceCanWander", 0, () => true);

		hookFunction("ElementIsScrolledToEnd", 0, (args) => {
			const element = document.getElementById(args[0]);
			return element != null && element.scrollHeight - element.scrollTop - element.clientHeight <= 1;
		});

		hookFunction("CheatFactor", 1, (args, next) => {
			const [CheatName, Factor] = args as [string, number];

			if (CheatName === "CantLoseMistress" && cheatIsEnabled(MiscCheat.CantLoseMistress)) {
				return Factor;
			} else if (CheatName === "BlockRandomKidnap" && cheatIsEnabled(MiscCheat.BlockRandomEvents)) {
				return Factor;
			}

			return next(args);
		});

		hookFunction("PrivateRansomStart", 0, (args, next) => {
			if (cheatIsEnabled(MiscCheat.BlockRandomEvents))
				return false;

			return next(args);
		});

		hookFunction("MainHallWalk", 0, (args, next) => {
			if (cheatIsEnabled(MiscCheat.BlockRandomEvents)) {
				MainHallRandomEventOdds = 0;
			}

			return next(args);
		});

		const NMod = isNModClient();

		if (!NMod) {
			patchFunction("LoginMistressItems", { 'LogQuery("ClubMistress", "Management")': "true" });
			hookFunction("LoginMistressItems", 0, (args, next) => {
				next(args);
				if (!cheatIsEnabled(MiscCheat.GiveMistressKey) && !LogQuery("ClubMistress", "Management")) {
					for (const item of MISTRESS_CHEAT_ONLY_ITEMS) {
						InventoryDelete(Player, item, "ItemMisc", false);
					}
				}
			});
			cheatChangeHooks[MiscCheat.GiveMistressKey] = () => {
				LoginMistressItems();
				ServerPlayerInventorySync();
			};

			patchFunction("LoginStableItems", { 'LogQuery("JoinedStable", "PonyExam") || LogQuery("JoinedStable", "TrainerExam")': "true" });
		}

		cheatChangeHooks[MiscCheat.GivePandoraKey] = enabled => {
			for (const item of PANDORA_CHEAT_ONLY_ITEMS) {
				if (enabled) {
					InventoryAdd(Player, item, "ItemMisc", false);
				} else {
					InventoryDelete(Player, item, "ItemMisc", false);
				}
			}
			ServerPlayerInventorySync();
		};

		hookFunction("InfiltrationStealItems", 0, (args, next) => {
			next(args);
			if (cheatIsEnabled(MiscCheat.GivePandoraKey)) {
				cheatChangeHooks[MiscCheat.GivePandoraKey]!(true);
			}
		});

		// Cheats

		hookFunction("Player.CanChangeClothesOn", 1, (args, next) => (allowMode && (args[0] as Character).IsPlayer()) || next(args));
		hookFunction("ChatRoomCanLeave", 0, (args, next) => allowMode || next(args));

		// Anti-stupid-null

		hookFunction("DrawCharacter", 100, (args, next) => {
			if (args[0] != null)
				return next(args);
		});

		patchFunction("DrawGetImage", {
			"Img.src = Source;": 'Img.crossOrigin = "Anonymous";\n\t\tImg.src = Source;'
		});

		// fixes a bug in BC
		hookFunction("ServerPlayerIsInChatRoom", 0, (args, next) => {
			return next(args) || CurrentScreen === "GetUp";
		});

		// Widen possible nicknames
		patchFunction("CharacterNickname", {
			"/^[a-zA-Z\\s]*$/": "/^[\\p{L}0-9\\p{Z}'-]+$/u"
		});
		ServerCharacterNicknameRegex = NICKNAME_REGEX;
	}

	run() {
		LoginMistressItems();
		LoginStableItems();
		if (cheatIsEnabled(MiscCheat.GivePandoraKey)) {
			cheatChangeHooks[MiscCheat.GivePandoraKey]!(true);
		}
		ServerPlayerInventorySync();
	}
}
