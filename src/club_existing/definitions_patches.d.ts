type TextCache = any;
type NotificationSetting = any;

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

declare const ExtendedArchetype: {
	TYPED: "modular",
	MODULAR: "typed",
	VIBRATING: "vibrating",
	VARIABLEHEIGHT: "variableheight"
};
