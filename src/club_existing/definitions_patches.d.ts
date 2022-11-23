type NotificationSetting = any;

/**
 * A HSV color value
 */
type HSVColor = { H: number, S: number, V: number };

type VibratorMode = "Off" | "Low" | "Medium" | "High" | "Maximum" | "Random" | "Escalate" | "Tease" | "Deny" | "Edge";

type AssetBonusName = "KidnapDomination" | "KidnapSneakiness" | "KidnapBruteForce";

/**
 * An object defining which genders a setting is active for
 * @typedef {object} GenderSetting
 * @property {boolean} Female - Whether the setting is active for female cases
 * @property {boolean} Male - Whether the setting is active for male cases
 */
interface GenderSetting {
	Female: boolean;
	Male: boolean;
}

type ChatRoomSpaceType = string;
