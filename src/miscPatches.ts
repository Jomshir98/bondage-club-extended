import { detectOtherMods } from "./clubUtils";
import { allowMode } from "./console";
import { hookFunction, patchFunction } from "./patching";

export function init_miscPatches() {
	hookFunction("AsylumEntranceCanWander", 0, () => true);
	patchFunction("CheatImport", { "MainCanvas == null": "true" });
	CheatImport();

	hookFunction("ElementIsScrolledToEnd", 0, (args) => {
		const element = document.getElementById(args[0]);
		return element != null && element.scrollHeight - element.scrollTop - element.clientHeight <= 1;
	});

	const { NMod } = detectOtherMods();

	if (!NMod) {
		patchFunction("LoginMistressItems", { 'LogQuery("ClubMistress", "Management")': "true" });
		patchFunction("LoginStableItems", { 'LogQuery("JoinedStable", "PonyExam") || LogQuery("JoinedStable", "TrainerExam")': "true" });
	}

	if (Player.Inventory.length > 0) {
		LoginMistressItems();
		LoginStableItems();
		ServerPlayerInventorySync();
	}

	// Cheats

	const o_Player_CanChange = Player.CanChange;
	Player.CanChange = () => allowMode || o_Player_CanChange.call(Player);

	hookFunction("ChatRoomCanLeave", 0, (args, next) => allowMode || next(args));
}
