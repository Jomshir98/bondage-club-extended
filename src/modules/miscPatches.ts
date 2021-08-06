import { allowMode, detectOtherMods } from "../utilsClub";
import { BaseModule } from "./_BaseModule";
import { hookFunction, patchFunction } from "../patching";
import { MiscCheat } from "../constants";
import { modStorage, modStorageSync } from "./storage";

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
	modStorageSync();
}

export function cheatToggle(cheat: MiscCheat) {
	cheatSetEnabled(cheat, !cheatIsEnabled(cheat));
}

export class ModuleMiscPatches extends BaseModule {
	private o_Player_CanChange: (typeof Player.CanChange) | null = null;

	load() {
		if (!Array.isArray(modStorage.cheats)) {
			modStorage.cheats = [];
		} else {
			modStorage.cheats = modStorage.cheats.filter(c => MiscCheat[c] !== undefined);
		}

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

		const { NMod } = detectOtherMods();

		if (!NMod) {
			patchFunction("LoginMistressItems", { 'LogQuery("ClubMistress", "Management")': "true" });
			patchFunction("LoginStableItems", { 'LogQuery("JoinedStable", "PonyExam") || LogQuery("JoinedStable", "TrainerExam")': "true" });
		}

		// Cheats

		this.o_Player_CanChange = Player.CanChange;
		Player.CanChange = () => allowMode || !!(this.o_Player_CanChange?.call(Player));

		hookFunction("ChatRoomCanLeave", 0, (args, next) => allowMode || next(args));
	}

	run() {
		LoginMistressItems();
		LoginStableItems();
		ServerPlayerInventorySync();
	}

	unload() {
		if (this.o_Player_CanChange) {
			Player.CanChange = this.o_Player_CanChange;
		}
	}
}
