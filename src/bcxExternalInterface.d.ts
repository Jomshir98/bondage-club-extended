// Uncomment this if you are not using rest of BCX declaration files (declarations.d.ts, messages.d.ts)
/*
type BCX_Rule = string;
type RuleDisplayDefinition<ID extends BCX_Rule> = any;
type ConditionsConditionData<category extends string = string> = any;
type RuleCustomData = Record<BCX_Rule, any>;
type RuleInternalData = Record<BCX_Rule, any>;
type BCX_queries = Record<string, [any, any]>;

/* End of area to uncomment */

interface BCXVersion {
	major: number;
	minor: number;
	patch: number;
	extra?: string;
	dev?: boolean;
	strict?: boolean;
}

//#region Rules
interface BCX_RuleStateAPI_Generic {
	/** The name of the rule */
	readonly rule: string;
	/** Definition of the rule */
	readonly ruleDefinition: any;

	/** Current condition data of the rule */
	readonly condition: any;

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

interface BCX_RuleStateAPI<ID extends BCX_Rule> extends BCX_RuleStateAPI_Generic {
	readonly rule: ID;
	readonly ruleDefinition: RuleDisplayDefinition<ID>;

	readonly condition: ConditionsConditionData<"rules"> | undefined;

	readonly customData: ID extends keyof RuleCustomData ? (RuleCustomData[ID] | undefined) : undefined;
	readonly internalData: ID extends keyof RuleInternalData ? (RuleInternalData[ID] | undefined) : undefined;
}

//#endregion

//#region Curses

interface BCX_CurseInfo {
	/** Whether the curse is active or disabled */
	readonly active: boolean;

	/** The group this info is for */
	readonly group: AssetGroupName;
	/** BC asset the curse keeps, or `null` if the group is cursed to be empty */
	readonly asset: Asset | null;

	/** What color the item is cursed with */
	readonly color?: ItemColor;
	/** Whether properties are cursed (if set, `Property` is enforced, otherwise only applied on item re-apply) */
	readonly curseProperty: boolean;
	/** The properties that are enforced */
	readonly property?: ItemProperties;
	/** Crafting data, always cursed */
	readonly craft?: CraftingItem;
}

//#endregion

interface BCX_Events {
	curseTrigger: {
		/** Which action the curses did to the item */
		action: "remove" | "add" | "swap" | "update" | "color" | "autoremove";
		/** Name of asset group that was changed */
		group: string;
	};
	/**
	 * Triggers whenever a rule triggers (either by BCX or by external API)
	 * @note If you need extra data about rule's configuration, use `BCX_ModAPI.getRuleState`
	 */
	ruleTrigger: {
		/** The rule that was triggered */
		rule: BCX_Rule;
		/**
		 * Type of trigger that happened:
		 * - `trigger` - The action this rule dected did happen (e.g. because the rule was not enforced)
		 * - `triggerAttempt` - The action was caught by the rule and did not happen
		 */
		triggerType: "trigger" | "triggerAttempt";
		/**
		 * Character that was being targetted (e.g. for whisper/beep rules, possibly few others).
		 * Most rules do not use this.
		 */
		targetCharacter: number | null;
	};
	/**
	 * Triggers whenever player changes subscreen in BCX.
	 * Note, that some changes might not be observable by outside mod (e.g. when user simply switches to different subscreen).
	 * This can trigger even outside of `InformationSheet` screen.
	 */
	bcxSubscreenChange: {
		/**
		 * Whether BCX is currently showing one of custom screens, overriding the default BC screen.
		 *
		 * At the time of emitting, this value is the same as the one returned by `bcx.inBcxSubscreen()`.
		 */
		inBcxSubscreen: boolean;
	};
	/**
	 * Triggers whenever BCX sends a "local" message to the chat.
	 */
	bcxLocalMessage: {
		/** The actual message that is to be displayed */
		message: string | Node;
		/** Timeout of the message - if set, the message auto-hides after {timeout} milliseconds */
		timeout?: number;
		/** Sender metadata (used for displaying a membernumber on some messages) */
		sender?: number;
	};
	/**
	 * This is a generic event sent out by anyone in the room (including Player) when _something_ in BCX configuration changes,
	 * which might warrant requesting updated data from the user, if you hold onto any such data in your logic.
	 */
	somethingChanged: {
		/** MemberNumber of the sender. `Player.MemberNumber` will be used when triggered by this BCX instance. */
		sender: number;
	};
}

interface BCX_ModAPI extends BCXEventEmitter<BCX_Events> {
	/** Name of the mod this API was requested for */
	readonly modName: string;

	/** Returns state handler for a rule or `null` for unknown rule */
	getRuleState<ID extends BCX_Rule>(rule: ID): BCX_RuleStateAPI<ID> | null;

	/** Returns info about how a slot is cursed */
	getCurseInfo(group: AssetGroupName): BCX_CurseInfo | null;

	/**
	 * Sends a BCX query to another character in the same room, or to Player.
	 * This allows same level of access to BCX data as BCX itself has for others, which includes almost all actions possible through UI (but there are exceptions).
	 * Requests done to "Player" will have the same limitations user has when interacting with the UI.
	 *
	 * This is a very low-level API and properly forming and interpretting the requests requires care.
	 * Also note, that this method sends requests to other characters, which might respond in an arbitrary way or not at all.
	 * Also consider that using this with different target than "Player" sends a message through BC's server and is subject to rate limiting.
	 * @param type - The type of query to send
	 * @param data - Data for the query
	 * @param target - MemberNumber to target; "Player" is alias for `Player.MemberNumber`
	 * @param timeout - Timeout after which the query fails, in milliseconds; defaults to 10 seconds
	 * @returns Promise that resolves to the query answer or rejects if the request failed
	 * @see BCX_queries in messages.d.ts for list of possible queries, their expected data and answers
	 */
	sendQuery<T extends keyof BCX_queries>(
		type: T,
		data: BCX_queries[T][0],
		target: number | "Player",
		timeout?: number,
	): Promise<BCX_queries[T][1]>;
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

	/** Whether BCX is currently showing one of custom screens, overriding the default BC screen. */
	inBcxSubscreen(): boolean;
}

interface Window {
	bcx?: BCX_ConsoleInterface;
}

type BCXEvent = Record<never, unknown>;
type BCXAnyEvent<T extends BCXEvent> = {
	[key in keyof T]: {
		event: key;
		data: T[key];
	};
}[keyof T];

interface BCXEventEmitter<T extends BCXEvent> {
	on<K extends keyof T>(s: K, listener: (v: T[K]) => void): () => void;
	onAny(listener: (value: BCXAnyEvent<T>) => void): () => void;
}
