/* eslint-disable @typescript-eslint/quotes */
/* eslint-disable @typescript-eslint/semi */
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
	ExpressionPrerequisite?: string[];
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
	Prerequisite?: string | string[];
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
	Category?: string[];

	Fetish?: string[];
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
	FuturisticRecolor?: boolean;
	FuturisticRecolorDisplay?: boolean;

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
	ExpressionPrerequisite?: string[];

	/** A record with the maximum length for each text-based properties with an input field. */
	TextMaxLength?: null | Partial<Record<PropertyTextNames, number>>;

	/**
	 * The font used for dynamically drawing text.
	 * Requires {@link AssetDefinition.DynamicAfterDraw} to be set.
	 */
	TextFont?: null | string;
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

type ExtendedArchetype = "modular" | "typed" | "vibrating" | "variableheight";

/**
 * An object containing extended item configurations keyed by group name.
 * @see {@link ExtendedItemAssetConfig}
 */
type ExtendedItemConfig = Record<string, ExtendedItemGroupConfig>;

/**
 * An object containing extended item definitions for a group.
 * Maps asset names within the group to their extended item configuration
 * @see {@link ExtendedItemAssetConfig}
 */
type ExtendedItemGroupConfig = Record<string, AssetArchetypeConfig>;

/**
 * Valid extended item configuration types
 */
type AssetArchetypeConfig = TypedItemAssetConfig | ModularItemAssetConfig | VibratingItemAssetConfig | VariableHeightAssetConfig;

/**
 * An object containing the extended item definition for an asset.
 * @template Archetype, Config
 */
interface ExtendedItemAssetConfig<Archetype extends ExtendedArchetype, Config> {
	/** The extended item archetype that this asset uses. */
	Archetype: Archetype;
	/** The specific configuration for the item (type will vary based on the item's archetype) */
	Config?: Config;
	/** The group name and asset name of a configuration to copy - useful if multiple items share the same config */
	CopyConfig?: { GroupName?: AssetGroupName, AssetName: string };
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
	Prerequisite?: string | string[];
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
	/** Whether or not this option can be selected randomly */
	Random?: boolean;
	/** Whether or not this option can be selected by the wearer */
	AllowSelfSelect?: boolean;
	/** If the option has a subscreen, this can set a particular archetype to use */
	Archetype?: ExtendedArchetype;
	/** If the option has an archetype, sets the config to use */
	ArchetypeConfig?: TypedItemConfig | ModularItemConfig | VibratingItemConfig | VariableHeightConfig;
	/** A buy group to check for that option to be available */
	PrerequisiteBuyGroup?: string;
	/**
	 * A unique (automatically assigned) identifier of the struct type
	 * @todo consider making an {@link ExtendedItemOption} struct type wherein this field is mandatory once
	 * more extended items have been assigned an arhcetype
	 */
	OptionType?: "ExtendedItemOption";
}

/**
 * An object containing data about the type change that triggered the chat message
 * @param {Character} C - A reference to the character wearing the item
 * @param {OptionType} previousOption - The previously selected type option
 * @param {OptionType} newOption - The newly selected type option
 * @param {number} previousIndex - The index of the previously selected type option in the item's options
 * config
 * @param {number} newIndex - The index of the newly selected type option in the item's options config
 * @template OptionType
 */
interface ExtendedItemChatData<OptionType> {
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
type ExtendedItemChatCallback<OptionType> = (
	chatData: ExtendedItemChatData<OptionType>,
) => string;

/**
 * @param {Character} C - The selected NPC
 * @param {OptionType} Option - The currently selected extended item option
 * @param {OptionType} PreviousOption - The previously selected extended item option
 * @returns {string} - The chat prefix that should be used for this type change
 * @template OptionType
 */
type ExtendedItemNPCCallback<OptionType> = (
	C: Character,
	Option: OptionType,
	PreviousOption: OptionType,
) => string;

/**
 * @param {Character} C - A reference to the character wearing the item
 * @param {Item} Item - The equipped item
 * @param {OptionType} Option - The newly selected option
 * @param {OptionType} CurrentOption - The currently selected option
 * @returns {string} - Returns a non-empty message string if the item failed validation, or an empty string otherwise
 * @template OptionType
 */
type ExtendedItemValidateCallback<OptionType> = (
	C: Character,
	Item: Item,
	Option: OptionType,
	CurrentOption: OptionType,
) => string;

/**
 * @param {ExtendedItemValidateCallback<OptionType>} - The hooked validate function
 * @param {Character} C - A reference to the character wearing the item
 * @param {Item} Item - The equipped item
 * @param {OptionType} Option - The newly selected option
 * @param {OptionType} CurrentOption - The currently selected option
 * @returns {string} - Returns a non-empty message string if the item failed validation, or an empty string otherwise
 * @template OptionType
 */
type ExtendedItemValidateScriptHookCallback<OptionType> = (
	next: ExtendedItemValidateCallback<OptionType>,
	C: Character,
	Item: Item,
	Option: OptionType,
	CurrentOption: OptionType,
) => string;

/**
 * @param {Character} C - The character wearing the item
 * @param {OptionType} Option - The newly selected option
 * @param {OptionType} CurrentOption - The currently selected option
 * @return {void} - Nothing
 * @template OptionType
 */
type ExtendedItemPublishActionCallback<OptionType> = (
	C: Character,
	CurrentOption: OptionType,
	PreviousOption: OptionType,
) => void;

/**
 * Callback for extended item `Init` functions
 * @param Item The item in question
 * @param C The character that has the item equiped
 * @param Refresh Whether the character and relevant item should be refreshed and pushed to the server
 */
type ExtendedItemInitCallback = (
	Item: Item,
	C: Character,
	Refresh?: boolean,
) => void;

//#endregion

//#region Typed items

/** An object containing the extended item definition for a modular asset. */
type TypedItemAssetConfig = ExtendedItemAssetConfig<"typed", TypedItemConfig>;

type TypedItemChatSetting = "toOnly" | "fromTo" | "silent";

/** An object defining all of the required configuration for registering a typed item */
interface TypedItemConfig {
	/** The list of extended item options available for the item */
	Options?: ExtendedItemOption[];
	/** The optional text configuration for the item. Custom text keys can be configured within this object */
	Dialog?: TypedItemDialogConfig;
	/**
	 * An optional array of chat tags that should be included in the dictionary of
	 * the chatroom message when the item's type is changed.
	 * Defaults to {@link CommonChatTags.SOURCE_CHAR} and {@link CommonChatTags.DEST_CHAR}
	 */
	ChatTags?: CommonChatTags[];
	/**
	 * The chat message setting for the item. This can be provided to allow
	 * finer-grained chatroom message keys for the item. Defaults to {@link TypedItemChatSetting.TO_ONLY}
	 */
	ChatSetting?: TypedItemChatSetting;
	/** A boolean indicating whether or not images should be drawn in this item's extended item menu. Defaults to `true` */
	DrawImages?: boolean;
	/**
	 * A boolean indicating whether or not the item's type can be changed while the
	 * item is locked (if set to `false`, the player must be able to unlock the item to change its type). Defaults to `true`
	 */
	ChangeWhenLocked?: boolean;
	/**
	 * Contains custom dictionary entries in the event that the base ones do not suffice.
	 */
	Dictionary?: TypedItemDictionaryCallback[];
	/**
	 * A recond containing functions that are run on load, click, draw, exit, validate and publishaction,
	 * with the original archetype function and parameters passed on to them. If undefined, these are ignored.
	 * Note that scripthook functions must be loaded before `Female3DCGExtended.js` in `index.html`.
	 */
	ScriptHooks?: {
		Load?: (next: () => void) => void,
		Click?: (next: () => void) => void,
		Draw?: (next: () => void) => void,
		Exit?: () => void,
		Validate?: ExtendedItemValidateScriptHookCallback<ExtendedItemOption>,
		PublishAction?: ExtendedItemPublishActionCallback<ExtendedItemOption>,
	};
	/**
	 * To-be initialized properties independent of the selected item module(s).
	 * Relevant if there are properties that are (near) exclusively managed by {@link TypedItemConfig.ScriptHooks} functions.
	 */
	BaselineProperty?: ItemProperties;
}

interface TypedItemDialogConfig {
	/**
	 * The key for the text that will be displayed at the top of the extended item screen
	 * (usually a prompt for the player to select a type). Defaults to `"<groupName><assetName>Select"`
	 */
	Load?: string;
	/**
	 * A prefix for text keys for the display names of the item's individual types. This
	 * will be suffixed with the option name to get the final key (i.e. `"<typePrefix><optionName>"`). Defaults to
	 * `"<groupName><assetName>"`
	 */
	TypePrefix?: string;
	/**
	 * A prefix for text keys for chat messages triggered by the item. Chat message keys
	 * will include the name of the new option, and depending on the chat setting, the name of the previous option:
	 * - For chat setting `FROM_TO`: `<chatPrefix><oldOptionName>To<newOptionName>`
	 * - For chat setting `TO_ONLY`: `<chatPrefix><newOptionName>`
	 * Defaults to `"<GroupName><AssetName>Set"`
	 */
	ChatPrefix?: string | ExtendedItemChatCallback<ExtendedItemOption>;
	/**
	 * A prefix for text keys for NPC dialog. This will be suffixed with the option name
	 * to get the final NPC dialogue key (i.e. `"<npcPrefix><optionName>"`. Defaults to `"<groupName><assetName>"`
	 */
	NpcPrefix?: string | ExtendedItemNPCCallback<ExtendedItemOption>;
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
type TypedItemDictionaryCallback = (
	chatData: ExtendedItemChatData<ExtendedItemOption>
) => ChatMessageDictionaryEntry;

//#endregion

//#region Modular items

/** An object containing the extended item definition for a modular asset. */
type ModularItemAssetConfig = ExtendedItemAssetConfig<"modular", ModularItemConfig>;

/** An object defining all of the required configuration for registering a modular item */
interface ModularItemConfig {
	/** The module definitions for the item */
	Modules?: ModularItemModuleBase[];
	/**
	 * The item's chatroom message setting. Determines the level of
	 * granularity for chatroom messages when the item's module values change.
	 */
	ChatSetting?: ModularItemChatSetting;
	/**
	 * An optional array of chat tags that should be included in the dictionary of
	 * the chatroom message when the item's type is changed.
	 * Defaults to {@link CommonChatTags.SOURCE_CHAR} and {@link CommonChatTags.DEST_CHAR}
	 */
	ChatTags?: CommonChatTags[];
	/**
	 * A boolean indicating whether or not the item's type can be changed while the
	 * item is locked (if set to false, the player must be able to unlock the item to change its type). Defaults to `true`
	 */
	ChangeWhenLocked?: boolean;
	/** The optional text configuration for the item. Custom text keys can be configured within this object */
	Dialog?: ModularItemDialogConfig;
	/**
	 * A recond containing functions that are run on load, click, draw, exit, and validate, with the original archetype function
	 * and parameters passed on to them. If undefined, these are ignored.
	 * Note that scripthook functions must be loaded before `Female3DCGExtended.js` in `index.html`.
	 */
	ScriptHooks?: {
		Load?: (next: () => void) => void;
		Click?: (next: () => void) => void;
		Draw?: (next: () => void) => void;
		Exit?: () => void;
		Validate?: ExtendedItemValidateScriptHookCallback<ModularItemOption>;
	};
	/**
	 * To-be initialized properties independent of the selected item module(s).
	 * Relevant if there are properties that are (near) exclusively managed by {@link ModularItemConfig.ScriptHooks} functions.
	 */
	BaselineProperty?: ItemProperties;
	/** A boolean indicating whether or not images should be drawn for the module selection screen. */
	DrawImages?: boolean;
}

interface ModularItemDialogConfig {
	/**
	 * The key for the text that will be displayed on the base modular item screen (usually a prompt for the player to
	 * configure modules). Defaults to `"<groupName><assetName>Select"`
	 */
	Select?: string;
	/**
	 * A prefix for text keys for the display names of the item's modules. This will be suffixed with the module name to
	 * get the final key (i.e. `"<modulePrefix><moduleName>"`). Defaults to `"<groupName><assetName>Module"`.
	 */
	ModulePrefix?: string;
	/**
	 * A prefix for text keys for the display names of the item's options. This will be suffixed with the option key
	 * (i.e. `"<optionPrefix><optionKey>"`. The option key is the module key followed by the option's index within its
	 * parent module (e.g. `"a3"`). Defaults to `"<groupName><assetName>Option"`.
	 */
	OptionPrefix?: string;
	/**
	 * A prefix for text keys for chat messages triggered
	 */
	ChatPrefix?: string | ExtendedItemChatCallback<ModularItemOption>;
}

type ModularItemChatSetting = "perModule" | "perOption";

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
}

/** An object describing a single module for a modular item. */
interface ModularItemModule extends ModularItemModuleBase {
	/** A unique (automatically assigned) identifier of the struct type */
	OptionType: "ModularItemModule";
	/** The list of option definitions that can be chosen within this module. */
	Options: ModularItemOption[];
	/** A boolean indicating whether or not images should be drawn within this particular module. */
	DrawImages: boolean;
}

/** A (partially parsed) object describing a single option within a module for a modular item. */
interface ModularItemOptionBase {
	/** The additional difficulty associated with this option - defaults to 0 */
	Difficulty?: number;
	/** The required bondage skill level for this option */
	BondageLevel?: number;
	/** The required self-bondage skill level for this option when using it on oneself */
	SelfBondageLevel?: number;
	/** The required prerequisites that must be met before this option can be selected */
	Prerequisite?: string | string[];
	/** A custom background for this option that overrides the default */
	CustomBlindBackground?: string;
	/** A list of groups that this option blocks - defaults to [] */
	Block?: AssetGroupItemName[];
	/** A list of groups that this option hides - defaults to [] */
	Hide?: AssetGroupName[];
	/** A list of items that this option hides */
	HideItem?: string[];
	/** The Property object to be applied when this option is used */
	Property?: ItemProperties;
	/** Whether the option permits locking - if not set, defaults to the AllowLock property of the parent asset */
	AllowLock?: boolean;
	/**
	 * Whether or not it should be possible to change from this option to another
	 * option while the item is locked (if set to `false`, the player must be able to unlock the item to change its type) -
	 * defaults to `true`
	 */
	ChangeWhenLocked?: boolean;
	/** Whether or not the option should open a subscreen in the extended item menu */
	HasSubscreen?: boolean;
	/** Override height, uses the highest priority of all modules*/
	OverrideHeight?: AssetOverrideHeight;
	/** Whether or not this option can be selected by the wearer */
	AllowSelfSelect?: boolean;
	/** Whether that option moves the character up */
	HeightModifier?: number;
	/** Whether that option applies effects */
	Effect?: EffectName[];
	/** Whether the option forces a given pose */
	SetPose?: AssetPoseName;
	/** A list of activities enabled by that module */
	AllowActivity?: ActivityName[];
	/** A buy group to check for that module to be available */
	PrerequisiteBuyGroup?: string;
	/** The name of the option; automatically set to {@link ModularItemModule.Key} + the option's index */
	Name?: string;
	/** A unique (automatically assigned) identifier of the struct type */
	OptionType?: "ModularItemOption";
	/** Trigger this expression when changing to this option */
	Expression?: ExpressionTrigger[];
}

/** An object describing a single option within a module for a modular item. */
interface ModularItemOption extends ModularItemOptionBase {
	/** The name of the option; automatically set to {@link ModularItemModule.Key} + the option's index */
	Name: string;
	/** A unique (automatically assigned) identifier of the struct type */
	OptionType: "ModularItemOption";
}

//#endregion

//#region Vibrating Items

/** An object containing the extended item definition for a vibrating asset. */
type VibratingItemAssetConfig = ExtendedItemAssetConfig<"vibrating", VibratingItemConfig>;

/** An object defining all of the required configuration for registering a vibrator item */
interface VibratingItemConfig {
	/** The list of vibrator mode sets that are available on this item */
	Options?: VibratorModeSet[];
	/**
	 * A record containing functions that are run on load, click, draw, exit, and validate, with the original archetype function
	 * and parameters passed on to them. If undefined, these are ignored.
	 * Note that scripthook functions must be loaded before `Female3DCGExtended.js` in `index.html`.
	 */
	ScriptHooks?: {
		Load?: (next: () => void) => void;
		Click?: (next: () => void) => void;
		Draw?: (next: () => void) => void;
		Exit?: () => void;
	};
}

type VibratorModeSet = "Standard" | "Advanced";

//#endregion

//#region Variable Height items

/** An object containing the extended item definition for a variable height asset. */
type VariableHeightAssetConfig = ExtendedItemAssetConfig<"variableheight", VariableHeightConfig>;

interface VariableHeightConfig {
	/** The highest Y co-ordinate that can be set  */
	MaxHeight: number;
	/** The lowest Y co-ordinate that can be set  */
	MinHeight: number;
	/** Settings for the range input element the user can use to change the height */
	Slider: VariableHeightSliderConfig;
	/** A record containing various dialog keys used by the extended item screen */
	Dialog: VariableHeightDialogConfig;
	/**
	 * An array of the chat message tags that should be included in the item's
	 * chatroom messages. Defaults to [{@link CommonChatTags.SOURCE_CHAR}, {@link CommonChatTags.DEST_CHAR}]
	 */
	ChatTags?: CommonChatTags[];
	/** The function that handles finding the current variable height setting */
	GetHeightFunction?: Function;
	/** The function that handles applying the height setting to the character */
	SetHeightFunction?: Function;
	/** The default properties for the item, if not provided from an extended item option */
	Property?: ItemProperties;
}

interface VariableHeightSliderConfig {
	/** The name of a supported thumbnail image in \CSS\Styles.css that will show the current position on the slider */
	Icon: string;
	/** The Y co-ordinate of the topmost point of the slider */
	Top: number;
	/** The height in pixels of the slider */
	Height: number;
}

interface VariableHeightDialogConfig {
	/**
	 * A prefix for text keys for chat messages triggered by the item. Chat message keys
	 * will include the name of the new option, and depending on the chat setting, the name of the previous option:
	 * - For chat setting `FROM_TO`: `<chatPrefix><oldOptionName>To<newOptionName>`
	 * - For chat setting `TO_ONLY`: `<chatPrefix><newOptionName>`
	 * Defaults to `"<GroupName><AssetName>Set"`
	 */
	ChatPrefix?: string | ExtendedItemChatCallback<ExtendedItemOption>;
	/**
	 * A prefix for text keys for NPC dialog. This will be suffixed with the option name
	 * to get the final NPC dialogue key (i.e. `"<npcPrefix><optionName>"`. Defaults to `"<groupName><assetName>"`
	 */
	NpcPrefix?: string | ExtendedItemNPCCallback<ExtendedItemOption>;
}

//#endregion

// #region Testing

/** An interface representing missing data for a given (simplified) asset */
interface TestingMissingStruct {
	/** The asset's group */
	readonly Group: AssetGroupName;
	/** The asset's name */
	readonly Name: string;
	/** The name of the asset's missing data */
	readonly Missing: string;
}

// #endregion
