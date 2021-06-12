import { detectOtherMods } from "../utilsClub";
import { allowMode } from "./console";
import { BaseModule } from "../moduleManager";
import { hookFunction, patchFunction } from "../patching";

export class ModuleMiscPatches extends BaseModule {
	private o_Player_CanChange: (typeof Player.CanChange) | null = null;

	load() {
		hookFunction("AsylumEntranceCanWander", 0, () => true);
		patchFunction("CheatImport", { "MainCanvas == null": "true" });

		hookFunction("ElementIsScrolledToEnd", 0, (args) => {
			const element = document.getElementById(args[0]);
			return element != null && element.scrollHeight - element.scrollTop - element.clientHeight <= 1;
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
		CheatImport();
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
