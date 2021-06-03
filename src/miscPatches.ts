import { hookFunction, patchFunction } from "./patching";

export function init_miscPatches() {
	hookFunction("AsylumEntranceCanWander", 0, () => true);
	patchFunction("CheatImport", { "MainCanvas == null": "true" });
	CheatImport();

	hookFunction("ElementIsScrolledToEnd", 0, (args) => {
		const element = document.getElementById(args[0]);
		return element != null && element.scrollHeight - element.scrollTop - element.clientHeight <= 1;
	});
}
