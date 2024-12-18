import { ModuleCategory, Preset } from "./constants";
import { firstTimeInit, modStorage } from "./modules/storage";
import { BCXVersionCompare, BCXVersionToString } from "./utils";

export function runMigration(originalVersion: BCXVersion, currentVersion: BCXVersion): boolean {
	if (BCXVersionCompare(originalVersion, currentVersion) === 0 || firstTimeInit)
		return true;

	if (BCXVersionCompare(originalVersion, currentVersion) > 0) {
		if (!confirm("You are attempting to load older BCX version than you did previously. " +
			"This might result in loss of some data.\nAre you sure you want to continue?")
		) {
			return false;
		}
	}

	console.log("BCX: Version migration from", BCXVersionToString(originalVersion), "to", BCXVersionToString(currentVersion));

	if (BCXVersionCompare(originalVersion, { major: 0, minor: 7, patch: 4 }) < 0) {
		modStorage.menuShouldDisplayTutorialHelp = true;
	}

	if (BCXVersionCompare(originalVersion, { major: 0, minor: 8, patch: 0 }) < 0) {
		if (
			modStorage.preset === Preset.dominant &&
			Array.isArray(modStorage.disabledModules) &&
			!modStorage.disabledModules.includes(ModuleCategory.Commands)
		) {
			modStorage.disabledModules.push(ModuleCategory.Commands);
		}
	}

	if (BCXVersionCompare(originalVersion, { major: 1, minor: 0, patch: 3 }) < 0) {
		modStorage.roomTemplates?.filter(t => t && !t.Whitelist).forEach(t => t!.Whitelist = []);
	}

	return true;
}
