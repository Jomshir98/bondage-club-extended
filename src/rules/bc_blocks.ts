import { ConditionsIsConditionInEffect } from "../modules/conditions";
import { registerRule } from "../modules/rules";
import { hookFunction } from "../patching";

export function initRules_bc_blocks() {
	registerRule("forbid_remoteuse_self", {
		name: "Forbid the usage of vibrator remotes on yourself",
		longDescription: "Not being allowed to trigger vibrators on yourself",
		load() {
			hookFunction("DialogMenuButtonBuild", 0, (args, next) => {
				next(args);
				const C = CharacterGetCurrent();
				if (C && C.ID === 0 && ConditionsIsConditionInEffect("rules", "forbid_remoteuse_self")) {
					const index = DialogMenuButton.indexOf("Remote");
					if (index >= 0) {
						DialogMenuButton[index] = "RemoteDisabled";
					}
				}
			});
		}
	});

	registerRule("forbid_remoteuse_others", {
		name: "Forbid the usage of vibrator remotes on others",
		longDescription: "Not being allowed to trigger vibrators on others",
		load() {
			hookFunction("DialogMenuButtonBuild", 0, (args, next) => {
				next(args);
				const C = CharacterGetCurrent();
				if (C && C.ID !== 0 && ConditionsIsConditionInEffect("rules", "forbid_remoteuse_others")) {
					const index = DialogMenuButton.indexOf("Remote");
					if (index >= 0) {
						DialogMenuButton[index] = "RemoteDisabled";
					}
				}
			});
		}
	});
}
