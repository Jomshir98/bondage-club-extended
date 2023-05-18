type TextCache = any;

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

declare const ExtendedArchetype: {
	MODULAR: "modular";
	TYPED: "typed";
	VIBRATING: "vibrating";
	VARIABLEHEIGHT: "variableheight";
	TEXT: "text";
};

declare class DictionaryBuilder {
	// Not necessary for BCX
}
