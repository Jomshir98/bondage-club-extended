interface BCXVersion {
	major: number;
	minor: number;
	patch: number;
	extra?: string;
	dev?: boolean;
}

//#region Rules
interface BCX_RuleStateAPI_Generic {
	/** The name of the rule */
	readonly rule: string;
	/** Definition of the rule */
	readonly ruleDefinition: any;

	/** Current condition data of the rule */
	readonly condition: any | undefined;

	/** If the rule is in effect (active and all conditions valid) */
	readonly inEffect: boolean;
	/** If the rule is enforced (inEffect and enforce enabled) */
	readonly isEnforced: boolean;
	/** If the rule is logged (inEffect and logging enabled) */
	readonly isLogged: boolean;

	/** Rule setttings */
	readonly customData: any;
	/** Rule internal data */
	readonly internalData: any;

	/**
	 * Triggers and logs that Player violated this rule
	 * @param targetCharacter - If the rule is against specific target different than player (e.g. sending message/beep), this adds it to log
	 * @param dictionary - Dictionary of rule-specific text replacements in logs and notifications; see implementation of individual rules
	 */
	trigger(targetCharacter?: number | null, dictionary?: Record<string, string>): void;

	/**
	 * Triggers and logs that Player attempted to violate this rule, but the attempt was blocked (for enforced rules)
	 * @param targetCharacter - If the rule is against specific target different than player (e.g. sending message/beep), this adds it to log
	 * @param dictionary - Dictionary of rule-specific text replacements in logs and notifications; see implementation of individual rules
	 */
	triggerAttempt(targetCharacter?: number | null, dictionary?: Record<string, string>): void;
}

// If using full BCX declarations (remove if not)
interface BCX_RuleStateAPI<ID extends BCX_Rule> extends BCX_RuleStateAPI_Generic {
	readonly rule: ID;
	readonly ruleDefinition: RuleDisplayDefinition<ID>;

	readonly condition: ConditionsConditionData<"rules"> | undefined;

	readonly customData: ID extends keyof RuleCustomData ? (RuleCustomData[ID] | undefined) : undefined;
	readonly internalData: ID extends keyof RuleInternalData ? (RuleInternalData[ID] | undefined) : undefined;
}

// If not using full BCX declarations (uncomment if not)
// type BCX_Rule = string;
// type BCX_RuleStateAPI<ID extends BCX_Rule> = BCX_RuleStateAPI_Generic;

//#endregion

interface BCX_ModAPI {
	/** Name of the mod this API was requested for */
	readonly modName: string;

	/** Returns state handler for a rule or `null` for unknown rule */
	getRuleState<ID extends BCX_Rule>(rule: ID): BCX_RuleStateAPI<ID> | null;
}

interface BCX_ConsoleInterface {
	/** Version of loaded BCX */
	readonly version: string;

	/** Version parsed to components */
	readonly versionParsed: Readonly<BCXVersion>;

	/**
	 * Gets BCX version of another character in room
	 * @param target - The membernumber of character to get; undefined = Player
	 */
	getCharacterVersion(target?: number): string | null;

	/** Gets if BCX runs in development mode */
	readonly isDevel: boolean;

	/**
	 * Get access to BCX Mod API.
	 * @param mod - Same identifier of your mod as used for ModSDK
	 */
	getModApi(mod: string): BCX_ModAPI;
}

interface Window {
	bcx?: BCX_ConsoleInterface;
}
