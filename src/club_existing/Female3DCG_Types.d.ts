/* eslint-disable @typescript-eslint/quotes */
/* eslint-disable @typescript-eslint/semi */
/* eslint-disable @typescript-eslint/member-delimiter-style */
/* eslint-disable @typescript-eslint/ban-types */
/* eslint-disable @typescript-eslint/indent */

interface AssetGroupDefinition {
	Asset: (AssetDefinition | string)[];
	Group: AssetGroupName;
	ParentGroup?: AssetGroupName;
	Category?: 'Appearance' | 'Item' | 'Script';
	/** Whether the group should have an asset selected at random at character creation. */
	Default?: boolean;
	IsRestraint?: boolean;
	/** Whether the group is allowed to have no asset. Used for body-related characteristics. */
	AllowNone?: boolean;
	AllowColorize?: boolean;
	AllowCustomize?: boolean;
	/** @see {AssetDefinition.Random} */
	Random?: boolean;
	Color?: string[];
	ParentSize?: AssetGroupName;
	ParentColor?: AssetGroupName;
	Clothing?: boolean;
	Underwear?: boolean;
	BodyCosplay?: boolean;
	Hide?: AssetGroupName[];
	Block?: AssetGroupItemName[];
	Zone?: [number, number, number, number][];
	SetPose?: AssetPoseName[];
	AllowPose?: AssetPoseName[];
	AllowExpression?: ExpressionName[];
	Effect?: EffectName[];
	MirrorGroup?: AssetGroupName;
	RemoveItemOnRemove?: { Group: AssetGroupItemName, Name: string, Type?: string }[];
	Priority?: number;
	Left?: number;
	Top?: number;
	FullAlpha?: boolean;
	Blink?: boolean;
	InheritColor?: AssetGroupName;
	FreezeActivePose?: AssetPoseCategory[];
	PreviewZone?: [number, number, number, number];
	DynamicGroupName?: AssetGroupName;
	MirrorActivitiesFrom?: AssetGroupItemName;
	ColorSuffix?: Record<string, string>;
	ExpressionPrerequisite?: AssetPrerequisite[];
	HasPreviewImages?: boolean;
}

type AssetBonusName = "KidnapDomination" | "KidnapSneakiness" | "KidnapBruteForce";

interface AssetDefinition {
	/** The asset's internal name. */
	Name: string,

	/**
	 * Link an asset to another.
	 *
	 * Used for the random appearance generator, to ensure combined assets match.
	 * Eyes, as well as the student tops and bottoms make use of it.
	 */
	ParentItem?: string;

	/** The group the asset belongs to. Mainly useful to inherit the body size. */
	ParentGroup?: AssetGroupName | null;

	/**
	 * Whether the asset is enabled or not. Defaults to true.
	 *
	 * A disabled asset cannot be used on a character.
	 * They will also never be used as part of a random appearance.
	 */
	Enable?: boolean;

	/** Whether the asset appears visually. Defaults to true. */
	Visible?: boolean;

	/** A list of screens where current asset won't be shown. */
	NotVisibleOnScreen?: string[];

	/** Whether the asset can be worn. Defaults to true. An unwearable asset will not actually end up in the group it's used on. */
	Wear?: boolean;

	/** Applying that asset triggers the following activity */
	Activity?: ActivityName;

	/** Activities that wearing this asset enables. */
	AllowActivity?: ActivityName[];

	/** Array of sound effects for each one of the item's allowed activities */
	ActivityAudio?: string[];

	/** The expression on the targeted character */
	ActivityExpression?: Partial<Record<ActivityName, ExpressionTrigger[]>>;

	/** A list of groups that should still be allowed to be acted on even though they should be blocked by the asset. */
	AllowActivityOn?: AssetGroupItemName[];

	/** Identifies a set of assets that's part of the same group for shopping purposes. Buying one will give access to all of them. */
	BuyGroup?: string;

	/** Identifies a BuyGroup that, we bought one item of, will cause that asset to also be owned, without showing it in the shopping list. Only used by the SpankingToys */
	PrerequisiteBuyGroups?: string[];

	/** The list of effects wearing the asset causes on the character */
	Effect?: EffectName[];

	/** Whether wearing the asset gives a bonus in the Kidnap minigame. */
	Bonus?: AssetBonusName;

	/** A list of group names the asset blocks access to. */
	Block?: AssetGroupItemName[];

	/**
	 * A list of group names the asset restores access to.
	 *
	 * Mostly used for clothes, and might be considered a duplicate of AllowActivityOn.
	 */
	Expose?: AssetGroupItemName[];

	/** A list of group names that get hidden when the asset is worn. */
	Hide?: AssetGroupName[];

	/** A list of asset names that get hidden when the asset is worn. */
	HideItem?: string[];

	/** A list of asset names that get shown when the asset is worn. Only useful when combined with Hide */
	HideItemExclude?: string[];

	/**
	 * A list of body group that becomes required when this asset is worn.
	 *
	 * Used by the random appearance generator to know that it should also pick a random asset
	 * from the required group when that asset is used.
	 */
	Require?: AssetGroupBodyName[];

	/** A pose that the character should change to when wearing the asset. */
	SetPose?: AssetPoseName[];

	/**
	 * The poses actually that the asset supports.
	 *
	 * Used when building the file paths for the asset's layers.
	 */
	AllowPose?: AssetPoseName[];

	/** A list of poses that hide the asset when they get set. */
	HideForPose?: AssetPoseName[];

	/**
	 * A mapping of poses for the purpose of fallbacks.
	 *
	 * If the current pose appears in the mapping, it will result in the mapped pose name
	 * being used when generating the file paths for the asset's layers.
	 *
	 * Works like DynamicGroupName, but for poses.
	 */
	PoseMapping?: AssetPoseMapping;

	/** A list of poses that wearing the asset also enables. */
	AllowActivePose?: AssetPoseName[];

	WhitelistActivePose?: AssetPoseName[];

	/**
	 * The cost of the asset in the shop. Defaults to 0.
	 *
	 * A value of -1 makes the asset unavailable, a value of 0 makes it always available.
	 */
	Value?: number;

	/** A measure of how hard it is to remove the asset. Defaults to 0. */
	Difficulty?: number;

	SelfBondage?: number;
	SelfUnlock?: boolean;
	ExclusiveUnlock?: boolean;

	/** Whether the asset can be selected for a random appearance. Defaults to true. */
	Random?: boolean;

	/** Whether the asset gets removed automatically when the character log in. Defaults to false. */
	RemoveAtLogin?: boolean;

	Time?: number;
	/** Enables advanced layer visibility on the asset. See {@link AssetLayerDefinition.Visibility} for more information. */
	LayerVisibility?: boolean;
	RemoveTime?: number;
	RemoveTimer?: number;
	MaxTimer?: number;

	/** The drawing priority of the asset. Defaults to the asset's group priority. */
	Priority?: number;
	Left?: number;
	Top?: number;
	Height?: number;
	Zoom?: number;
	Alpha?: AlphaDefinition[];
	Prerequisite?: AssetPrerequisite | AssetPrerequisite[];
	Extended?: boolean;
	AlwaysExtend?: boolean;
	AlwaysInteract?: boolean;
	AllowLock?: boolean;
	IsLock?: boolean;
	PickDifficulty?: number | null;

	/** Whether the asset is only available to owners. */
	OwnerOnly?: boolean;

	/** Whether the asset is only available to lovers. */
	LoverOnly?: boolean;

	/** Whether the asset is only available to the family. */
	FamilyOnly?: boolean;

	/** A list of facial expression using the asset causes to the character */
	ExpressionTrigger?: ExpressionTrigger[];

	/** A list of assets to also remove when the asset is taken off. */
	RemoveItemOnRemove?: { Name: string, Group: AssetGroupItemName, Type?: string }[];

	AllowEffect?: EffectName[];
	AllowBlock?: AssetGroupItemName[];
	AllowHide?: AssetGroupItemName[];
	AllowHideItem?: string[];
	AllowType?: string[];
	AllowTighten?: boolean;
	DefaultColor?: ItemColor;
	Opacity?: number;
	MinOpacity?: number;
	MaxOpacity?: number;
	Audio?: string;

	/** A list of categories. Used to prevent the asset to be used, per chatroom settings */
	Category?: AssetCategory[];

	Fetish?: FetishName[];
	ArousalZone?: AssetGroupItemName;
	IsRestraint?: boolean;
	BodyCosplay?: boolean;
	OverrideBlinking?: boolean;
	DialogSortOverride?: DialogSortOrder;
	DynamicDescription?: (C: Character) => string;
	DynamicPreviewImage?: (C: Character) => string;
	DynamicAllowInventoryAdd?: (C: Character) => boolean;
	DynamicName?: (C: Character) => string;

	/** The real group name used when building the file paths for the asset's layers */
	DynamicGroupName?: AssetGroupName;

	DynamicActivity?: (C: Character) => ActivityName | null | undefined;
	DynamicAudio?: (C: Character) => string;

	/**
	 * Whether the asset is restricted to a given character.
	 *
	 * When the asset is added to a character, the member number of the character using the
	 * asset will be stored along in its properties, and all subsequent modifications will
	 * only be possible for that character.
	 */
	CharacterRestricted?: boolean;
	AllowRemoveExclusive?: boolean;

	/** The group the asset should inherit its color from. */
	InheritColor?: AssetGroupName;

	DynamicBeforeDraw?: boolean;
	DynamicAfterDraw?: boolean;
	DynamicScriptDraw?: boolean;
	HasType?: boolean;
	AllowLockType?: AssetLockType[];

	/** Whether that asset is drawn colorized, or uses the color name in its file asset */
	AllowColorize?: boolean;

	/** Whether the color picker shows a "Whole Item" layer. Defaults to true. */
	AllowColorizeAll?: boolean;

	/** A list of online spaces (eg. Asylum) where the asset is automatically available */
	AvailableLocations?: string[];

	OverrideHeight?: AssetOverrideHeight;
	FreezeActivePose?: AssetPoseCategory[];

	/** Whether the game should auto-add a Lock layer to the asset. */
	DrawLocks?: boolean;

	AllowExpression?: ExpressionName[];
	MirrorExpression?: AssetGroupName;

	/** Whether the asset is drawn at an absolute position. */
	FixedPosition?: boolean;

	CustomBlindBackground?: string;

	/** The list of layers for the asset. */
	Layer?: AssetLayerDefinition[];

	Archetype?: ExtendedArchetype;

	/** A list of attributes the asset has */
	Attribute?: AssetAttribute[];

	/** A list of attributes that causes this one to become hidden. */
	HideItemAttribute?: AssetAttribute[];

	/**
	 * A list of icons the asset preview should show.
	 * Only used by the handheld items, as the game handles the other icons automatically.
	 */
	PreviewIcons?: InventoryIcon[];

	Tint?: TintDefinition[];
	DefaultTint?: string;
	Gender?: "F" | "M";

	/**
	 * An identifier that marks the asset as being the same for the purpose of crafting.
	 *
	 * Do note that this expects all the assets in the craft group to have compatible layers, color-wise and type-wise.
	 */
	CraftGroup?: string;

	/** A list of prerequisite checks that must pass for the group's expressions to be selectable */
	ExpressionPrerequisite?: AssetPrerequisite[];
}

interface AssetLayerDefinition {
	/** The layer's name */
	Name: string;

	/** Whether that layer is drawn colorized, or uses the color as part of its image file name */
	AllowColorize?: boolean;

	/** Uses the color of the named layer. */
	CopyLayerColor?: string;

	/** The color group that layer is part of. Layers part of the same color group get a selector in the Color Picker UI */
	ColorGroup?: string;

	/** Whether the layer is hidden in the Color Picker UI. Defaults to false. */
	HideColoring?: boolean;
	AllowTypes?: string[];
	HasType?: boolean;

	/**
	 * This can be used to make a layer invisible depending on certain conditions, provided the {@link AssetDefinition.LayerVisibility} is set correctly.
	 *
	 * Here's what each option means:
	 * - Player: Invisible to the player.
	 * - AllExceptPlayerDialog: Invisible to the player when in a dialog.
	 * - Others: Invisible to others.
	 * - OthersExceptDialog: Invisible to others in a dialog.
	 * - Owner: Invisible to your owner.
	 * - Lovers: Invisible to your lovers.
	 * - Mistresses: Invisible to club mistresses.
	 */
	Visibility?: "Player" | "AllExceptPlayerDialog" | "Others" | "OthersExceptDialog" | "Owner" | "Lovers" | "Mistresses";

	/** The group the layer belongs to. Mainly useful to inherit the body's size. */
	ParentGroup?: AssetGroupName | null,

	/** A list of poses that layer supports. */
	AllowPose?: AssetPoseName[];

	/** The drawing priority for that layer. Defaults to the asset's priority. */
	Priority?: number;

	/** The name of the group to inherit the color from. */
	InheritColor?: AssetGroupName;

	Alpha?: AlphaDefinition[],
	Left?: number;
	Top?: number;
	HideAs?: { Group: AssetGroupName, Asset?: string };

	/** Whether the layer will be drawn at a fixed position. */
	FixedPosition?: boolean;

	/** Whether the layer uses an image. Defaults to true. */
	HasImage?: boolean;

	Opacity?: number;
	MinOpacity?: number;
	MaxOpacity?: number;

	/** Set canvas globalCompositeOperation for current layer.
	 *  Use "destination-in" if you want to use layer as an alpha mask.
	 *  Note that game uses WebGL when available, so you might need to implement
	 *  similar blending mode if it's not done already (currently in GLDrawImage() in GLDraw.js).
	 */
	BlendingMode?: GlobalCompositeOperation;

	/** Specify that this is (one of) the asset's lock layer. See DrawsLock at the asset level. */
	LockLayer?: boolean;

	MirrorExpression?: AssetGroupName;
	HideForPose?: (AssetPoseName | "")[];
	PoseMapping?: AssetPoseMapping;
	AllowModuleTypes?: string[];
	ModuleType?: string[];
	/* Specifies that this layer should not be drawn if the character is wearing any item with the given attributes */
	HideForAttribute?: AssetAttribute[];
	/* Specifies that this layer should not be drawn unless the character is wearing an item with one of the given attributes */
	ShowForAttribute?: AssetAttribute[];
}

type ExtendedArchetype = "modular" | "typed" | "vibrating" | "variableheight" | "text";

/**
 * An object containing extended item configurations keyed by group name.
 */
type ExtendedItemMainConfig = Partial<Record<AssetGroupName, ExtendedItemGroupConfig>>;

/**
 * An object containing extended item definitions for a group.
 * Maps asset names within the group to their extended item configuration
 */
type ExtendedItemGroupConfig = Record<string, AssetArchetypeConfig>;

/** A union of all (non-abstract) extended item configs */
type AssetArchetypeConfig = TypedItemConfig | ModularItemConfig | VibratingItemConfig | VariableHeightConfig | TextItemConfig;

interface ExtendedItemConfig<OptionType extends ExtendedItemOption> {
	/** The archetype of the extended item config */
	Archetype: ExtendedArchetype;
	/**
	 * The chat message setting for the item. This can be provided to allow
	 * finer-grained chatroom message keys for the item.
	 */
	ChatSetting?: ExtendedItemChatSetting;
	/** A record containing various dialog keys used by the extended item screen */
	DialogPrefix?: ExtendedItemCapsDialog<OptionType>;
	/**
	 * A recond containing functions that are run on load, click, draw, exit, and validate, with the original archetype function
	 * and parameters passed on to them. If undefined, these are ignored.
	 * Note that scripthook functions must be loaded before `Female3DCGExtended.js` in `index.html`.
	 */
	ScriptHooks?: ExtendedItemCapsScriptHooksStruct<any, OptionType>;
	/** An array of the chat message tags that should be included in the item's chatroom messages. */
	ChatTags?: CommonChatTags[];
	/** Contains custom dictionary entries in the event that the base ones do not suffice. */
	Dictionary?: ExtendedItemDictionaryCallback<OptionType>[];
	/**
	 * To-be initialized properties independent of the selected item module(s).
	 * Relevant if there are properties that are (near) exclusively managed by {@link ExtendedItemConfig.ScriptHooks} functions.
	 */
	BaselineProperty?: ItemPropertiesNoArray;
	/** A boolean indicating whether or not images should be drawn for the option and/or module selection screen. */
	DrawImages?: boolean;
	/** The group name and asset name of a configuration to copy - useful if multiple items share the same config */
	CopyConfig?: { GroupName?: AssetGroupName, AssetName: string };
	/** An interface with element-specific drawing data for a given screen. */
	DrawData?: ExtendedItemConfigDrawData<{}>;
}

/** Defines a single extended item option */
interface ExtendedItemOption {
	/** The name of the type - used for the preview icon and the translation key in the CSV */
	Name: string;
	/** The required bondage skill level for this option */
	BondageLevel?: number;
	/** The required self-bondage skill level for this option when using it on oneself */
	SelfBondageLevel?: number;
	/** The required prerequisites that must be met before this option can be selected */
	Prerequisite?: AssetPrerequisite | AssetPrerequisite[];
	/** A custom background for this option that overrides the default */
	CustomBlindBackground?: string;
	/** Whether the option permits locking - if not set, defaults to the AllowLock property of the parent asset */
	AllowLock?: boolean;
	/**
	 * Whether or not it should be possible to change from this option to another
	 * option while the item is locked (if set to `false`, the player must be able to unlock the item to change its type) -
	 * defaults to `true`
	 */
	ChangeWhenLocked?: boolean;
	/** The Property object to be applied when this option is used */
	Property?: ItemProperties;
	/**
	 * Trigger this expression when changing to this option
	 *
	 * FIXME: **Currently broken!**
	 */
	Expression?: ExpressionTrigger[];
	/** Whether or not the option should open a subscreen in the extended item menu */
	HasSubscreen?: boolean;
	/** Whether or not this option can be selected by the wearer */
	AllowSelfSelect?: boolean;
	/** A buy group to check for that option to be available */
	PrerequisiteBuyGroup?: string;
	/**
	 * A unique identifier of the struct type.
	 * Its value must be automatically assigned if it's an archetypical extended item option.
	 * If it's not, *e.g.* for a custom script hook button that does not alter the item's state,
	 * then its value must be set `"ExtendedItemOption"`.
	 */
	OptionType: "ExtendedItemOption" | "TypedItemOption" | "VariableHeightOption" | "ModularItemOption" | "VibratingItemOption" | "TextItemOption";
}

/** Extended item option subtype for typed items */
interface TypedItemOptionBase extends Omit<ExtendedItemOption, "OptionType"> {
	Property?: Omit<ItemProperties, "Type">;
	/** If the option has an archetype, sets the config to use */
	ArchetypeConfig?: VibratingItemConfig | VariableHeightConfig | TextItemConfig;
	/** Whether or not this option can be selected randomly */
	Random?: boolean;
	NPCDefault?: boolean;
}

/** Extended item option subtype for typed items */
interface TypedItemOption extends Omit<TypedItemOptionBase, "ArchetypeConfig"> {
	OptionType: "TypedItemOption";
	/** If the option has an archetype, sets the data to use */
	ArchetypeData?: VibratingItemData | VariableHeightData | TextItemData;
	Property: ItemProperties & Pick<Required<ItemProperties>, "Type">;
}

/** Extended item option subtype for vibrating items */
interface VibratingItemOption extends ExtendedItemOption {
	OptionType: "VibratingItemOption";
	Name: VibratorMode;
	Property: ItemProperties & Pick<Required<ItemProperties>, "Mode" | "Intensity" | "Effect">;
	/** If the option has a subscreen, this can set a particular archetype to use */
	Archetype?: ExtendedArchetype;
	/** If the option has an archetype, sets the config to use */
	ArchetypeConfig?: ExtendedItemConfig<any>;
}

/** Extended item option subtype for vibrating items */
interface VariableHeightOption extends ExtendedItemOption {
	OptionType: "VariableHeightOption";
	Property: Pick<Required<ItemProperties>, "OverrideHeight">;
	Name: "newOption" | "previousOption";
}

/**
 * An object containing data about the type change that triggered the chat message
 * @param {Character} C - A reference to the character wearing the item
 * @param {OptionType} previousOption - The previously selected type option
 * @param {OptionType} newOption - The newly selected type option
 * @param {number} previousIndex - The index of the previously selected type option in the item's options
 * config or, depending on the archetype, -1 no such item option config exists.
 * @param {number} newIndex - The index of the newly selected type option in the item's options config or,
 * depending on the archetype, -1 no such item option config exists.
 * @template OptionType
 */
interface ExtendedItemChatData<OptionType extends ExtendedItemOption> {
	C: Character;
	previousOption: OptionType;
	newOption: OptionType;
	previousIndex: number;
	newIndex: number;
}

/**
 * @param {OptionType} chatData - An object containing data about the type change that triggered the chat message
 * @returns {string} - The chat prefix that should be used for this type change
 * @template OptionType
 */
type ExtendedItemChatCallback<OptionType extends ExtendedItemOption> = (
	chatData: ExtendedItemChatData<OptionType>,
) => string;

/**
 * @param {Character} C - The selected NPC
 * @param {OptionType} Option - The currently selected extended item option
 * @param {OptionType} PreviousOption - The previously selected extended item option
 * @returns {string} - The chat prefix that should be used for this type change
 * @template OptionType
 */
type ExtendedItemNPCCallback<OptionType extends ExtendedItemOption> = (
	C: Character,
	Option: OptionType,
	PreviousOption: OptionType,
) => string;

//#endregion

//#region Typed items

type TypedItemChatSetting = "default" | "fromTo" | "silent";

/** An object defining all of the required configuration for registering a typed item */
interface TypedItemConfig extends ExtendedItemConfig<TypedItemOption> {
	Archetype: "typed";
	/** The list of extended item options available for the item */
	Options?: TypedItemOptionBase[];
	/** The optional text configuration for the item. Custom text keys can be configured within this object */
	DialogPrefix?: {
		/** The dialogue prefix for the player prompt that is displayed on each module's menu screen */
		Header?: string;
		/** The dialogue prefix for the name of each option */
		Option?: string;
		/** The dialogue prefix that will be used for each of the item's chatroom messages */
		Chat?: string | ExtendedItemChatCallback<TypedItemOption>;
		/** The prefix used for dialog keys representing an NPC's reactions to item type changes */
		Npc?: string | ExtendedItemNPCCallback<TypedItemOption>;
	};
	/**
	 * The chat message setting for the item. This can be provided to allow
	 * finer-grained chatroom message keys for the item. Defaults to {@link TypedItemChatSetting.TO_ONLY}
	 */
	ChatSetting?: TypedItemChatSetting;
	/**
	 * A boolean indicating whether or not the item's type can be changed while the
	 * item is locked (if set to `false`, the player must be able to unlock the item to change its type). Defaults to `true`
	 */
	ChangeWhenLocked?: boolean;
	/**
	 * A recond containing functions that are run on load, click, draw, exit, validate and publishaction,
	 * with the original archetype function and parameters passed on to them. If undefined, these are ignored.
	 * Note that scripthook functions must be loaded before `Female3DCGExtended.js` in `index.html`.
	 */
	ScriptHooks?: ExtendedItemCapsScriptHooksStruct<TypedItemData, TypedItemOption>;
	DrawData?: ExtendedItemConfigDrawData<Partial<ElementMetaData.Typed>>;
}

/**
 * @param {object} chatData - An object containing data about the type change that triggered the chat message
 * @param {Character} chatData.C - A reference to the character wearing the item
 * @param {ExtendedItemOption} chatData.previousOption - The previously selected type option
 * @param {ExtendedItemOption} chatData.newOption - The newly selected type option
 * @param {number} chatData.previousIndex - The index of the previously selected type option in the item's options
 * config
 * @param {number} chatData.newIndex - The index of the newly selected type option in the item's options config
 * @returns {[{ Tag: string, Text: string }]} - The dictionary entry to append to the dictionary.
 */
type ExtendedItemDictionaryCallback<OptionType extends ExtendedItemOption> = (
	dictionary: DictionaryBuilder,
	chatData: ExtendedItemChatData<OptionType>
) => void;

//#endregion

//#region Modular items

/** An object defining all of the required configuration for registering a modular item */
interface ModularItemConfig extends ExtendedItemConfig<ModularItemOption> {
	Archetype: "modular";
	/** The module definitions for the item */
	Modules?: ModularItemModuleBase[];
	/**
	 * The item's chatroom message setting. Determines the level of
	 * granularity for chatroom messages when the item's module values change.
	 */
	ChatSetting?: ModularItemChatSetting;
	/**
	 * A boolean indicating whether or not the item's type can be changed while the
	 * item is locked (if set to false, the player must be able to unlock the item to change its type). Defaults to `true`.
	 * Note that {@link ModularItemOption.ChangeWhenLocked} takes priority over this value if specified.
	 */
	ChangeWhenLocked?: boolean;
	/** The optional text configuration for the item. Custom text keys can be configured within this object */
	DialogPrefix?: {
		/** The dialogue prefix for the player prompt that is displayed on each module's menu screen */
		Header?: string;
		/** The dialogue prefix for the name of each module */
		Module?: string;
		/** The dialogue prefix for the name of each option */
		Option?: string;
		/** The dialogue prefix that will be used for each of the item's chatroom messages */
		Chat?: string | ExtendedItemChatCallback<ModularItemOption>;
	};
	/**
	 * A recond containing functions that are run on load, click, draw, exit, and validate, with the original archetype function
	 * and parameters passed on to them. If undefined, these are ignored.
	 * Note that scripthook functions must be loaded before `Female3DCGExtended.js` in `index.html`.
	 */
	ScriptHooks?: ExtendedItemCapsScriptHooksStruct<ModularItemData, ModularItemOption>;
	DrawData?: ExtendedItemConfigDrawData<Partial<ElementMetaData.Modular>>;
}

type ModularItemChatSetting = "default" | "perModule";

/** A (partially parsed) object describing a single module for a modular item. */
interface ModularItemModuleBase {
	/** The name of this module - this is usually a human-readable string describing what the
	 * module represents (e.g. Straps). It is used for display text keys, and should be unique across all of the modules
	 * for the item.
	 */
	Name: string;
	/** The unique key for this module - this is used as a prefix to designate option names. Each
	 * options in the module will be named with the module's key, followed by the index of the option within the module's
	 * Options array. Keys should be alphabetical only (a-z, A-Z)
	 */
	Key: string;
	/** The list of option definitions that can be chosen within this module. */
	Options: ModularItemOptionBase[];
	/** Whether or not this module can be selected by the wearer */
	AllowSelfSelect?: boolean;
	/** A unique (automatically assigned) identifier of the struct type */
	OptionType?: "ModularItemModule";
	/** A boolean indicating whether or not images should be drawn within this particular module. */
	DrawImages?: boolean;
	DrawData?: ExtendedItemConfigDrawData<Partial<ElementMetaData.Modular>>;
}

/** An object describing a single module for a modular item. */
interface ModularItemModule extends Omit<ModularItemModuleBase, "DrawData"> {
	/** A unique (automatically assigned) identifier of the struct type */
	OptionType: "ModularItemModule";
	/** The list of option definitions that can be chosen within this module. */
	Options: ModularItemOption[];
	/** A boolean indicating whether or not images should be drawn within this particular module. */
	DrawImages: boolean;
	drawData: ExtendedItemDrawData<ElementMetaData.Typed>;
}

/** A (partially parsed) object describing a single option within a module for a modular item. */
interface ModularItemOptionBase extends Omit<ExtendedItemOption, "OptionType" | "Name"> {
	/** The additional difficulty associated with this option - defaults to 0 */
	Difficulty?: number;
	/** A list of groups that this option blocks - defaults to [] */
	Block?: AssetGroupItemName[];
	/** A list of groups that this option hides - defaults to [] */
	Hide?: AssetGroupName[];
	/** A list of items that this option hides */
	HideItem?: string[];
	/** Override height, uses the highest priority of all modules*/
	OverrideHeight?: AssetOverrideHeight;
	/** Whether that option moves the character up */
	HeightModifier?: number;
	/** Whether that option applies effects */
	Effect?: EffectName[];
	/** Whether the option forces a given pose */
	SetPose?: AssetPoseName;
	/** A list of activities enabled by that module */
	AllowActivity?: ActivityName[];
	/** If the option has an archetype, sets the config to use */
	ArchetypeConfig?: VibratingItemConfig | VariableHeightConfig | TextItemConfig;
	Property?: Omit<ItemProperties, "Type">;
}

/** An object describing a single option within a module for a modular item. */
interface ModularItemOption extends Omit<ModularItemOptionBase, "ArchetypeConfig"> {
	/** The name of the option; automatically set to {@link ModularItemModule.Key} + the option's index */
	Name: string;
	/** A unique (automatically assigned) identifier of the struct type */
	OptionType: "ModularItemOption";
	/** The option's (automatically assigned) parent module name */
	ModuleName: string;
	/** The option's (automatically assigned) index within the parent module */
	Index: number;
	/** If the option has an archetype, sets the data to use */
	ArchetypeData?: VibratingItemData | VariableHeightData | TextItemData;
}

//#endregion

//#region Vibrating Items

/** An object defining all of the required configuration for registering a vibrator item */
interface VibratingItemConfig extends ExtendedItemConfig<VibratingItemOption> {
	Archetype: "vibrating";
	/** The list of vibrator mode sets that are available on this item */
	Options?: VibratorModeSet[];
	/**
	 * A record containing functions that are run on load, click, draw, exit, and validate, with the original archetype function
	 * and parameters passed on to them. If undefined, these are ignored.
	 * Note that scripthook functions must be loaded before `Female3DCGExtended.js` in `index.html`.
	 */
	ScriptHooks?: ExtendedItemCapsScriptHooksStruct<VibratingItemData, VibratingItemOption>;
	/** The optional text configuration for the item. Custom text keys can be configured within this object */
	DialogPrefix?: {
		/** The dialogue prefix for the player prompt that is displayed on each module's menu screen */
		Header?: string;
		/** The dialogue prefix for the name of each option */
		Option?: string;
		/** The dialogue prefix that will be used for each of the item's chatroom messages */
		Chat?: string | ExtendedItemChatCallback<VibratingItemOption>;
	};
	DrawImages?: false;
	ChatSetting?: "default";
	DrawData?: ExtendedItemConfigDrawData<Partial<ElementMetaData.Vibrating>>;
}

type VibratorModeSet = "Standard" | "Advanced";

//#endregion

//#region Variable Height items

interface VariableHeightConfig extends ExtendedItemConfig<VariableHeightOption> {
	Archetype: "variableheight";
	/** The highest Y co-ordinate that can be set  */
	MaxHeight: number;
	/** The lowest Y co-ordinate that can be set  */
	MinHeight: number;
	/** A record containing various dialog keys used by the extended item screen */
	DialogPrefix: {
		/** The dialogue prefix for the player prompt that is displayed on each module's menu screen */
		Header?: string;
		/** The dialogue prefix that will be used for each of the item's chatroom messages */
		Chat?: string | ExtendedItemChatCallback<VariableHeightOption>;
		/** The dialogue prefix for the name of each option */
		Option?: string;
	};
	/** The function that handles finding the current variable height setting */
	GetHeightFunction?: (property: ItemProperties) => number | null;
	/** The function that handles applying the height setting to the character */
	SetHeightFunction?: (property: ItemProperties, height: number, maxHeight: number, minHeight: number) => void;
	DrawImages?: false;
	ChatSetting?: "default";
	ScriptHooks?: ExtendedItemCapsScriptHooksStruct<VariableHeightData, VariableHeightOption>;
	DrawData: VariableHeightConfigDrawData;
}

//#endregion

//#region text items

interface TextItemConfig extends ExtendedItemConfig<TextItemOption> {
	Archetype: "text";
	/** A record with the maximum length for each text-based properties with an input field. */
	MaxLength: TextItemRecord<number>;
	/** A record containing various dialog keys used by the extended item screen */
	DialogPrefix?: {
		/** The dialogue prefix for the player prompt that is displayed on each module's menu screen */
		Header?: string;
		/** The dialogue prefix that will be used for each of the item's chatroom messages */
		Chat?: string | ExtendedItemChatCallback<TextItemOption>;
	};
	DrawImages?: false;
	ChatSetting?: "default";
	ScriptHooks?: ExtendedItemCapsScriptHooksStruct<TextItemData, TextItemOption>;
	EventListeners?: TextItemRecord<TextItemEventListener>;
	DrawData?: ExtendedItemConfigDrawData<Partial<ElementMetaData.Text>>;
	PushOnPublish?: boolean;
	/**
	 * The font used for dynamically drawing text.
	 * Requires {@link AssetDefinition.DynamicAfterDraw} to be set.
	 */
	Font?: null | string;
}

/** Extended item option subtype for vibrating items */
interface TextItemOption extends ExtendedItemOption {
	OptionType: "TextItemOption";
	Property: TextItemRecord<string>;
	Name: "newOption" | "previousOption";
}

//#endregion

// #region Testing

/** An interface representing missing or invalid data for a given (simplified) asset */
interface TestingStruct<T> {
	/** The asset's group */
	readonly Group: AssetGroupName;
	/** The asset's name */
	readonly Name: string;
	/** A representation of the asset's missing or invalid data */
	readonly Invalid: T;
}

// #endregion
