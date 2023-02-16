/* eslint-disable @typescript-eslint/quotes */
/* eslint-disable @typescript-eslint/semi */
/* eslint-disable @typescript-eslint/ban-types */
/* eslint-disable @typescript-eslint/indent */

//#region Common

interface String {
	replaceAt(index: number, character: string): string;
}

declare function parseInt(s: string | number, radix?: number): number;

type MemoizedFunction<T extends Function> = T & {
	/** Clears the cache of the memoized function */
	clearCache(): void;
};

// GL shim
interface WebGL2RenderingContext {
	program?: WebGLProgram;
	programFull?: WebGLProgram;
	programHalf?: WebGLProgram;
	textureCache?: Map<string, any>;
	maskCache?: Map<string, any>;
}

interface WebGLProgram {
	u_alpha?: WebGLUniformLocation;
	u_color?: WebGLUniformLocation;
	a_position?: number;
	a_texcoord?: number;
	u_matrix?: WebGLUniformLocation;
	u_texture?: WebGLUniformLocation;
	u_alpha_texture?: WebGLUniformLocation;
	position_buffer?: WebGLBuffer;
	texcoord_buffer?: WebGLBuffer;
}

interface HTMLCanvasElement {
	GL?: WebGL2RenderingContext;
}

interface HTMLImageElement {
	errorcount?: number;
}

interface HTMLElement {
	setAttribute(qualifiedName: string, value: string | number): void;
}

interface RGBColor {
	r: number;
	g: number;
	b: number;
}

interface RGBAColor extends RGBColor {
	a: number;
}

type RectTuple = [number, number, number, number];

//#endregion

//#region Enums
type ExtendedArchetype = "modular" | "typed" | "vibrating" | "variableheight";

type TypedItemChatSetting = "toOnly" | "fromTo" | "silent";
type ModularItemChatSetting = "perModule" | "perOption";

type NotificationAudioType = 0 | 1 | 2;
type NotificationAlertType = 0 | 1 | 3 | 2;

type DialogSortOrder = | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;

type CharacterType = "online" | "npc" | "simple";

type VibratorIntensity = -1 | 0 | 1 | 2 | 3;

type VibratorModeSet = "Standard" | "Advanced";

type VibratorModeState = "Default" | "Deny" | "Orgasm" | "Rest";

type VibratorMode = "Off" | "Low" | "Medium" | "High" | "Maximum" | "Random" | "Escalate" | "Tease" | "Deny" | "Edge";

type VibratorRemoteAvailability = "Available" | "NoRemote" | "NoRemoteOwnerRuleActive" | "NoLoversRemote" | "RemotesBlocked" | "CannotInteract" | "NoAccess" | "InvalidItem";

type ItemVulvaFuturisticVibratorAccessMode = "" | "ProhibitSelf" | "LockMember";

/**
 * @property Freeze - Prevents walking and kneeling unaided. There's a few caveats with the kneeling part.
 * @property Prone - Indicates the character is prone. Looks non-functional.
 * @property Block - Indicates that the character is "blocked". Acts as a restraint.
 * @property Mounted - Indicates that the character is mounted onto something. Acts as a restraint.
 * @property KneelFreeze - Prevents walking.
 * @property ForceKneel - Prevents kneeling unaided.
 * @property BlockKneel - Prevents items that have the CanKneel prerequisite from being applied.
 *
 * @property CuffedFeet - Enable items that have the CuffedFeet prerequisite to be applied.
 * @property CuffedLegs - Enable items that have the CuffedLegs prerequisite to be applied.
 * @property CuffedArms - Enable items that have the CuffedArms prerequisite to be applied.
 * @property IsChained - Prevents items that have the NotChained prerequisite from being applied.
 * @property FixedHead - Locks the character's head in-place. Prevents nodding and shaking activities on it.
 * @property MergedFingers - Indicates the character can't use their fingers normally. Limits activities.
 *
 * @property Shackled - Prevents items that have the NotShackled prerequisite from being applied.
 * @property Tethered - Prevents leashing items from working.
 * @property Enclose - Indicates the character cannot be interacted with and can't interact back.
 * @property OneWayEnclose - Indicates the character can be interacted with but can't interact back.
 * @property OnBed - Enable items that have the OnBed prerequisite to be applied.
 * @property Lifted - Prevents items that have the NotLifted prerequisite to be applied.
 *
 * @property Slow - Indicates the character is slowed. Used when exiting chatrooms.
 * @property FillVulva - Marks the item as filling the character's vulva.
 *   Used when checking activities' prerequisites and the auto-stimulation events.
 * @property IsPlugged - Marks the item as filling the character's butt.
 *   Used when checking activities' prerequisites and the auto-stimulation events.
 *
 * @property Egged - Marks the item as being a "vibrator" kind-of item.
 *   Make the item's Vibrator-related properties be taken into account for arousal,
 *   as well as the stuttering effect.
 * @property Vibrating - Indicates an "Egged" item as being vibrating.
 *   Normally handled automatically by VibrationMode. Makes the item preview wobble
 *   in the inventory, as well as cause auto-stimulation events.
 *
 * @property Edged - Marks the item as causing the character to be edged.
 *   Normally handled automatically by VibrationMode. Causes the character's arousal
 *   to be capped, and ruins its orgasms.
 * @property DenialMode - Marks the item as causing the character to be denied.
 *   Causes the character's arousal to be capped (higher that Edged).
 * @property RuinOrgasms - Marks the item as ruining orgasms.
 *   Requires DenialMode. Makes the character unable to fully orgasm.
 *
 * @property Remote - Marks the item as a remote. Looks non-functional.
 * @property UseRemote - Marks the item as needing a remote to be changed.
 * @property BlockRemotes - Marks the item as preventing remotes from being used
 *   on the character.
 *
 * @property Lock - Marks the item as being some kind of lock.
 * @property NotSelfPickable - Disables the item from being lock-picked.
 *
 * @property Chaste - Marks the item as applying chastity.
 *   Prevents items that have the NotChaste prerequisite from being applied.
 *   Allows the item to be taken off at the club management.
 * @property BreastChaste - Marks the item as applying breast chastity.
 *   Allows the item to be taken off at the club management.
 *
 * @property Leash - Marks the item as being usable as a leash.
 * @property CrotchRope - Marks the item as being a crotchrope-style item.
 *   Used for the auto-stimulation events.
 *
 * @property ReceiveShock - Marks the item as being a shock-dispensing item.
 * @property TriggerShock - Marks the item as being a trigger for shock-dispensing items.
 *
 * @property OpenPermission - Marks the item as requiring collar-permissions (Futuristic).
 * @property OpenPermissionArm - Marks the item as requiring arm-permissions (Futuristic).
 * @property OpenPermissionLeg - Marks the item as requiring arm-permissions (Futuristic).
 * @property OpenPermissionChastity - Marks the item as requiring chastity-permissions (Futuristic).
 *
 * @property BlockMouth - Marks the item as blocking the character's mouth.
 *   Prevents items that have the NotLifted prerequisite to be applied.
 *   Also used when checking activities' prerequisites.
 * @property OpenMouth - Marks the item as opening the character's mouth.
 *   Used when checking activities' prerequisites.
 *
 * @property ProtrudingMouth - Indicates that the item bulges out from the character's mouth.
 *   Prevents items that wrap the head to be applied.
 *
 * @property Wiggling - Indicates that the item hangs from the character and can wiggle from it,
 *   triggering arousal. Used as part of the stimulation event system.
 */
type EffectName =
	"Freeze" | "Prone" | "Block" | "Mounted" | "KneelFreeze" | "ForceKneel" | "BlockKneel" |

	"CuffedFeet" | "CuffedLegs" | "CuffedArms" | "IsChained" | "FixedHead" | "MergedFingers" |

	"Shackled" | "Tethered" | "Enclose" | "OneWayEnclose" | "OnBed" | "Lifted" | "Suspended" |

	"Slow" | "FillVulva" | "IsPlugged" |

	"Egged" | "Vibrating" |

	"Edged" | "DenialMode" | "RuinOrgasms" |

	"Remote" | "UseRemote" | "BlockRemotes" |

	"Lock" | "NotSelfPickable" |

	"Chaste" | "BreastChaste" | "ButtChaste" |

	"Leash" | "CrotchRope" |

	"ReceiveShock" | "TriggerShock" |

	"OpenPermission" | "OpenPermissionArm" | "OpenPermissionLeg" | "OpenPermissionChastity" |

	"BlockMouth" | "OpenMouth" |

	"GagVeryLight" | "GagEasy" | "GagLight" | "GagNormal" | "GagMedium" | "GagHeavy" | "GagVeryHeavy" | "GagTotal" | "GagTotal2" |

	"BlindLight" | "BlindNormal" | "BlindHeavy" | "BlindTotal" |
	"BlurLight" | "BlurNormal" | "BlurHeavy" | "BlurTotal" |
	"DeafLight" | "DeafNormal" | "DeafHeavy" | "DeafTotal" |

	"VR" | "VRAvatars" | "KinkyDungeonParty" |

	"LightBall" |

	"RegressedTalk" |

	"HideRestraints" |

	"Unlock-MetalPadlock" | "Unlock-OwnerPadlock" | "Unlock-OwnerTimerPadlock" |
	"Unlock-LoversPadlock" | "Unlock-LoversTimerPadlock" |
	"Unlock-MistressPadlock" | "Unlock-MistressTimerPadlock" |
	"Unlock-PandoraPadlock" | "Unlock-MetalCuffs" | "Unlock-" |

	"ProtrudingMouth" | "Wiggling" |
	""
	;

type AssetGroupItemName =
	'ItemAddon' | 'ItemArms' | 'ItemBoots' | 'ItemBreast' | 'ItemButt' |
	'ItemDevices' | 'ItemEars' | 'ItemFeet' | 'ItemHands' | 'ItemHead' |
	'ItemHood' | 'ItemLegs' | 'ItemMisc' | 'ItemMouth' | 'ItemMouth2' |
	'ItemMouth3' | 'ItemNeck' | 'ItemNeckAccessories' | 'ItemNeckRestraints' |
	'ItemNipples' | 'ItemNipplesPiercings' | 'ItemNose' | 'ItemPelvis' |
	'ItemTorso' | 'ItemTorso2' | 'ItemVulva' | 'ItemVulvaPiercings' |
	'ItemHandheld' | 'ItemScript' |

	'ItemHidden' /* TODO: investigate, not a real group */
	;

type AssetGroupBodyName =
	'Blush' | 'BodyLower' | 'BodyUpper' | 'Bra' | 'Bracelet' | 'Cloth' |
	'ClothAccessory' | 'ClothLower' | 'Corset' | 'Emoticon' | 'Eyebrows' |
	'Eyes' | 'Eyes2' | 'Fluids' | 'Garters' | 'Glasses' | 'Gloves' |
	'HairAccessory1' | 'HairAccessory2' | 'HairAccessory3' | 'HairBack' |
	'HairFront' | 'FacialHair' | 'Hands' | 'Hat' | 'Head' | 'Height' | 'LeftAnklet' | 'LeftHand' | 'Mask' |
	'Mouth' | 'Necklace' | 'Nipples' | 'Panties' | 'Pussy' | 'Pronouns' | 'RightAnklet' | 'RightHand' |
	'Shoes' | 'Socks' | 'Suit' | 'SuitLower' | 'TailStraps' | 'Wings'
	;

type AssetGroupName = AssetGroupBodyName | AssetGroupItemName;

type AssetPoseName =
	'AllFours' | 'BackBoxTie' | 'BackCuffs' | 'BackElbowTouch' | 'BaseLower' |
	'BaseUpper' | 'Hogtied' | 'Horse' | 'Kneel' | 'KneelingSpread' | 'LegsClosed' |
	'LegsOpen' | 'OverTheHead' | 'Spread' | 'Suspension' | 'SuspensionHogtied' |
	'TapedHands' | 'Yoked' |

	/* FIXME: Those are pose categories */
	'BodyUpper' | 'BodyLower'
	;

type AssetLockType =
	"CombinationPadlock" | "ExclusivePadlock" | "HighSecurityPadlock" |
	"IntricatePadlock" | "LoversPadlock" | "LoversTimerPadlock" |
	"MetalPadlock" | "MistressPadlock" | "MistressTimerPadlock" |
	"OwnerPadlock" | "OwnerTimerPadlock" | "PandoraPadlock" |
	"PasswordPadlock" | "SafewordPadlock" | "TimerPadlock" |
	"TimerPasswordPadlock"
	;

type CraftingPropertyType =
	"Normal" | "Large" | "Small" | "Thick" | "Thin" | "Secure" | "Loose" | "Decoy" |
	"Malleable" | "Rigid" | "Simple" | "Puzzling" | "Painful" | "Comfy" | "Strong" |
	"Flexible" | "Nimble" | "Arousing" | "Dull"
	;

type AssetAttribute =
	"Skirt" |
	"ShortHair" |
	"CanAttachMittens"
	;

type CraftingStatusType = 0 | 1 | 2;

type ItemColorMode = "Default" | "ColorPicker";

//#endregion

//#region index.html

/**
 * Main game running state, runs the drawing
 * @param {number} Timestamp
 */
declare function MainRun(Timestamp: number): void;

/**
 * When the user presses a key, we send the KeyDown event to the current screen if it can accept it
 * @param {KeyboardEvent} event
 */
declare function KeyDown(event: KeyboardEvent): void;

/**
 * Handler for document-wide keydown event
 * @param {KeyboardEvent} event
 */
declare function DocumentKeyDown(event: KeyboardEvent): void;

/**
 * When the user clicks, we fire the click event for other screens
 * @param {MouseEvent} event
 */
declare function Click(event: MouseEvent): void;

/**
 * When the user touches the screen (mobile only), we fire the click event for other screens
 * @param {TouchEvent} event
 */
declare function TouchStart(event: TouchEvent): void;

/**
 * When touch moves, we keep it's position for other scripts
 * @param {Touch} touch
 */
declare function TouchMove(touch: Touch): void;

/**
 * When mouse move, we keep the mouse position for other scripts
 * @param {MouseEvent} event
 */
declare function MouseMove(event: MouseEvent): void;

/**
 * When the mouse is away from the control, we stop keeping the coordinates,
 * we also check for false positives with "relatedTarget"
 * @param {MouseEvent} event
 */
declare function LoseFocus(event: MouseEvent): void;

//#endregion

//#region Server Messages

interface IChatRoomGameResponse {
	Data: {
		KinkyDungeon: any;
		OnlineBounty: any;
		/* LARP */
		GameProgress?: "Start" | "Stop" | "Next" | "Skip" | "Action";
		Action?: undefined;
		Target?: number;
		Item?: string;

		/* MagicBattle */
		Spell?: string;
		Time?: number; /* ms */
	}
	Sender: number;
	RNG: number
}

//#endregion

//#region Chat

interface ChatRoom {
	Name: string;
	Description: string;
	Admin: number[];
	Ban: number[];
	Limit: number;
	Game: string;
	Background: string;
	Private: boolean;
	Locked: boolean;
	BlockCategory: string[];
	Language: string;
	Character?: any[]; /* From server, not really a Character object */
}

type StimulationAction = "Kneel" | "Walk" | "Struggle" | "StruggleFail" | "Talk";

interface StimulationEvent {
	/** The chance that this event will trigger at 0 arousal */
	Chance: number;
	/** Scaling factor for chance, depending on the arousal */
	ArousalScaling?: number;
	/** Scaling factor for chance, depending on the vibe intensity */
	VibeScaling?: number;
	/** Scaling factor for chance, depending on the inflation amount */
	InflationScaling?: number;
	/** The chance that this event will trigger when talking */
	TalkChance?: number;
}

type MessageActionType = "Action" | "Chat" | "Whisper" | "Emote" | "Activity" | "Hidden" |
	"LocalMessage" | "ServerMessage" | "Status";

type MessageContentType = string;

type CharacterReferenceTag =
	| "SourceCharacter"
	| "DestinationCharacter"
	| "DestinationCharacterName"
	| "TargetCharacter"
	| "TargetCharacterName"

type CommonChatTags =
	| CharacterReferenceTag
	| "AssetName";

/**
 * A dictionary entry containing a replacement tag to be replaced by some value. The replacement strategy depends on
 * the type of dictionary entry.
 */
interface TaggedDictionaryEntry {
	/** The tag that will be replaced in the message */
	Tag: string;
}

/**
 * A dictionary entry used to reference a character. The character reference tag will be replaced with the provided
 * character's name or pronoun. The display format will depend on the tag chosen.
 * Example substitutions for each tag (assuming the character name is Ben987):
 * * SourceCharacter: "Ben987"
 * * DestinationCharacter: "Ben987's" (if character is not self), "her"/"him" (if character is self)
 * * DestinationCharacterName: "Ben987's"
 * * TargetCharacter: "Ben987" (if character is not self), "herself"/"himself" (if character is self)
 * * TargetCharacterName: "Ben987"
 * @deprecated Use {@link SourceCharacterDictionaryEntry} and {@link TargetCharacterDictionaryEntry} instead.
 */
interface CharacterReferenceDictionaryEntry extends TaggedDictionaryEntry {
	/** The member number of the referenced character */
	MemberNumber: number;
	/** The character reference tag, determining how the character's name or pronoun will be interpreted */
	Tag: CharacterReferenceTag;
	/**
	 * The nickname of the referenced character
	 * @deprecated Redundant information
	 */
	Text?: string;
}

/**
 * A dictionary entry used to indicate the source character of a chat message or action (i.e. the character initiating
 * the message or action).
 */
interface SourceCharacterDictionaryEntry {
	SourceCharacter: number;
}

/**
 * A dictionary entry used to indicate the target character of a chat message or action (i.e. the character that is
 * being acted upon as part of the message or action).
 */
interface TargetCharacterDictionaryEntry {
	TargetCharacter: number;
}

/**
 * A dictionary entry which indicates the focused group. This represents the group that was focused or interacted with
 * when sending a chat message. For example, if the message was caused by performing an activity or modifying an item
 * on the `ItemArms` group, then it would be appropriate to send this dictionary entry with `ItemArms` as the focus
 * group name.
 */
interface FocusGroupDictionaryEntry {
	/**
	 * The tag to be replaced - this is always FocusAssetGroup.
	 * @deprecated Redundant information.
	 */
	Tag?: "FocusAssetGroup";
	/** The group name representing focused group for the purposes of the sent message */
	FocusGroupName: AssetGroupName;
}

/**
 * A direct text substitution dictionary entry. Any occurrences of the given {@link Tag} string in the associated
 * message will be directly replaced with the {@link Text} from this dictionary entry (no text lookup will be done).
 * For example, given the message:
 * ```
 * Life is like a box of ConfectionaryName.
 * ```
 * and the {@link TextDictionaryEntry}:
 * ```js
 * {Tag: "ConfectionaryName", Text: "chocolates"}
 * ```
 * The resulting message would be:
 * ```
 * Life is like a box of chocolates.
 * ```
 */
interface TextDictionaryEntry extends TaggedDictionaryEntry {
	/** The text that will be substituted for the tag */
	Text: string;
}

/**
 * A text substitution dictionary entry with text lookup functionality. Any occurrences of the given {@link Tag} string
 * in the associated message will be replaced with the {@link Text} from the dictionary entry, but only after a text
 * lookup has been done on the {@link Text}, meaning that if the text has localisations, the localised version will be
 * used. The text will be looked up against `Dialog_Player.csv`.
 * For example, given the message:
 * ```
 * Hello, {GreetingObjectName}!
 * ```
 * And the {@link TextLookupDictionaryEntry}:
 * ```js
 * {Tag: "GreetingObjectName", TextToLookup: "WorldObject"}
 * ```
 * And the following in `Dialog_Player.csv`:
 * ```
 * WorldObject,,,World,,
 * ```
 * The text to lookup (`"WorldObject"`) would be looked up against `Dialog_Player.csv`, resolving to `"World"`. This
 * would then be used to replace the tag `"GreetingObjectName"` in the message, resulting in:
 * ```
 * Hello, World!
 * ```
 */
interface TextLookupDictionaryEntry extends TaggedDictionaryEntry {
	/** The text whose lookup will be substituted for the tag */
	TextToLookUp: string;
}

/**
 * A dictionary entry that references an asset group. Note that this is different from
 * {@link FocusGroupDictionaryEntry}, which denotes the group being acted on. A dictionary should only ever contain
 * one {@link FocusGroupDictionaryEntry}, whereas it may contain many {@link GroupReferenceDictionaryEntry}s. This
 * represents any group that might be referenced in the message, but is not necessarily the focused group.
 * For example, given the message:
 * ```
 * Use your BodyPart!
 * ```
 * And the {@link GroupReferenceDictionaryEntry}:
 * ```
 * {Tag: "BodyPart", GroupName: "ItemHands"}
 * ```
 * The name of the `"ItemHands"` group would be looked up, and this would be used to replace the `"BodyPart"` tag. The
 * resulting message would be:
 * ```
 * Use your Hands!
 * ```
 */
interface GroupReferenceDictionaryEntry extends TaggedDictionaryEntry {
	/** The name of the asset group to reference */
	GroupName: AssetGroupName;
}

/**
 * A dictionary entry that references an asset. Note that a dictionary may contain multiple of these entries, one for
 * each asset mentioned or referenced in the message. For example, a message when swapping two restraints might contain
 * two of these entries, one for the restraint being removed, and one for the restraint being added.
 */
interface AssetReferenceDictionaryEntry extends GroupReferenceDictionaryEntry {
	/** The name of the asset being referenced */
	AssetName: string;
}

/**
 * A special instance of an {@link AssetReferenceDictionaryEntry} which indicates that this asset was used to carry
 * out an activity.
 */
interface ActivityAssetReferenceDictionaryEntry extends AssetReferenceDictionaryEntry {
	Tag: "ActivityAsset";
}

/**
 * A metadata dictionary entry sent with a shock event message including a shock intensity representing the strength
 * of the shock. This is used to determine the severity of any visual or gameplay effects the shock may have.
 */
interface ShockEventDictionaryEntry {
	/** The intensity of the shock - must be a non-negative number */
	ShockIntensity: number;
}

/**
 * A metadata dictionary entry indicating that the message has been generated due to an automated event. Can be used
 * to filter out what might otherwise be spammy chat messages (these include things like automatic vibrator intensity
 * changes and events & messages triggered by some futuristic items).
 */
interface AutomaticEventDictionaryEntry {
	/** Indicates that this message was triggered by an automatic event */
	Automatic: true;
}

/**
 * A metadata dictionary entry carrying a numeric counter for an associated event or activity. Currently only used by
 * the Anal Beads XL to indicate how many beads were inserted.
 */
interface ActivityCounterDictionaryEntry {
	/** Counter metadata to be sent with a message */
	ActivityCounter: number;
}

/**
 * A dictionary entry for group lookup & replacement. Used ambiguously for both {@link FocusGroupDictionaryEntry} and
 * {@link GroupReferenceDictionaryEntry}. This dictionary entry type is deprecated, and one of the aforementioned entry
 * types should be used instead.
 * @deprecated Use {@link FocusGroupDictionaryEntry}/{@link GroupReferenceDictionaryEntry}
 */
interface AssetGroupNameDictionaryEntry {
	Tag?: "FocusAssetGroup";
	AssetGroupName: AssetGroupName;
}

/**
 * A dictionary entry indicating the name of an activity. Sent with chat messages to indicate that an activity was
 * carried out as part of the message.
 */
interface ActivityNameDictionaryEntry {
	/** The name of the activity carried out */
	ActivityName: string;
}

type ChatMessageDictionaryEntry =
	| CharacterReferenceDictionaryEntry
	| SourceCharacterDictionaryEntry
	| TargetCharacterDictionaryEntry
	| FocusGroupDictionaryEntry
	| TextDictionaryEntry
	| TextLookupDictionaryEntry
	| GroupReferenceDictionaryEntry
	| AssetReferenceDictionaryEntry
	| ActivityAssetReferenceDictionaryEntry
	| ShockEventDictionaryEntry
	| AutomaticEventDictionaryEntry
	| ActivityCounterDictionaryEntry
	| AssetGroupNameDictionaryEntry
	| ActivityNameDictionaryEntry;

type ChatMessageDictionary = ChatMessageDictionaryEntry[];

interface IChatRoomMessageBasic {
	Content: MessageContentType;
	Sender: number;
	// SourceMemberNumber: number;
}

interface IChatRoomMessage extends IChatRoomMessageBasic {
	Type: MessageActionType;
	Dictionary?: ChatMessageDictionary;
	Timeout?: number;
}

interface IChatRoomSyncBasic {
	SourceMemberNumber: number
}

interface IChatRoomSyncMessage extends IChatRoomSyncBasic, ChatRoom { }

interface IChatRoomMessageMetadata {
	/** The name of the sender character, appropriately garbled if deafened */
	senderName?: string;
	/** The character targetted by the message */
	TargetCharacter?: Character;
	/** The character sending the message */
	SourceCharacter?: Character;
	/** The member number of the target */
	TargetMemberNumber?: number;
	/** Whether the message is considered game-initiated. Used for automatic vibe changes for example. */
	Automatic?: boolean;
	/** The group that has been interacted with to trigger the message */
	FocusGroup?: AssetGroup;
	/** The name of the group that has been interacted with to trigger the message */
	GroupName?: AssetGroupName;
	/** The assets referenced in the message */
	Assets?: Record<string, Asset>;
	/** The groups referenced in the message */
	Groups?: Record<string, AssetGroup>;
	/** How intense the shock should be */
	ShockIntensity?: number;
	ActivityCounter?: number;
	/** The triggered activity */
	ActivityName?: string;
	/** The name of the asset used for the activity */
	ActivityAsset?: Asset;
	/** The name of the chatroom, appropriately garbled */
	ChatRoomName?: string;
}

/**
 * A metadata extractor for a given message.
 *
 * @param data - The chat message to extract from.
 * @param sender - The character that sent the message.
 * @return An object with the following keys:
 *  - `metadata`: an object for the extracted metadata (key/value)
 *  - `substitutions`: an array of [tag, substitutions] to perform on the message.
 * @return null if the extraction has nothing to report.
 */
type ChatRoomMessageExtractor =
	(data: IChatRoomMessage, sender: Character) => { metadata: IChatRoomMessageMetadata, substitutions: string[][] } | null;

/**
 * A chat message handler.
 *
 * This is used in ChatRoomMessage to perform filtering and actions on
 * the recieved message. You can register one of those with
 * ChatRoomRegisterMessageHandler if you need to peek at incoming messages.
 *
 * Message processing is done in three phases:
 * - all pre-handlers are called
 * - metadata extraction & tag substitutions are collected
 *   from the message's dictionary, then latter are applied to
 *   the message's contents.
 * - finally, post-handlers are called.
 *
 * The handler's priority determines when the handler will get executed:
 * - Negative values make the handler run before metadata extraction
 * - Positive values make it run afterward.
 * In both cases, lower values mean higher priority, so -100 handler will
 * run before a -1, and a 1 handler will run before a 100.
 *
 * The return from the callback determines what will happen: if it's true,
 * message processing will stop, making the filter act like a handler.
 * If it's false, then it will continue. You can also return an object with
 * a `msg` property if the handler is a transformation and wishes to update
 * the message's contents inflight and/or a `skip` property if you'd like
 * to cause a subsequent handler to not be called.
 *
 * @warning Note that the in-flight message is only escaped when it gets
 * sent to the chat log via ChatRoomMessageDisplay. If you're manipulating
 * that by any other means, make sure to call ChatRoomEscapeEntities on its
 * content to close any injection attacks.
 *
 * A few notable priority values are:
 *
 * -200: ghosted player cutoff
 * -1: default Hidden message processing (and cutoff)
 * 0: emotes reformatting
 * 100: sensory-deprivation processing
 * 200: automatic actions on others' cutoff
 * 300: sensory-deprivation cutoff.
 * 500: usually output handlers. That's when audio, notifications and the
 *      message being added to the chat happens.
 *
 * Hidden messages never make it to post-processing.
 *
 */
interface ChatRoomMessageHandler {
	/** A short description of what the handler does. For debugging purposes */
	Description?: string;

	/**
	 * This handler's priority, used to determine when the code should run.
	 */
	Priority: number;

	/**
	 * Actual action to perform.
	 * @param data - The chat message to handle.
	 * @param sender - The character that sent the message.
	 * @param msg - The formatted string extracted from the message.
	 *              If the handler is in "post" mode, all substitutions have been performed.
	 * @param metadata - The collected metadata from the message's dictionary, only available in "post" mode.
	 * @returns {boolean} true if the message was handled and the processing should stop, false otherwise.
	 */
	Callback: (data: IChatRoomMessage, sender: Character, msg: string, metadata?: IChatRoomMessageMetadata) => boolean | { msg?: string; skip?: (handler: ChatRoomMessageHandler) => boolean };
}

//#endregion

//#region FriendList

interface IFriendListBeepLogMessage {
	MemberNumber?: number; /* undefined for NPCs */
	MemberName: string;
	ChatRoomName?: string;
	Private: boolean;
	ChatRoomSpace?: string;
	Sent: boolean;
	Time: Date;
	Message?: string;
}

//#endregion

//#region Assets

type IAssetFamily = "Female3DCG";

interface AssetGroup {
	Family: IAssetFamily;
	Name: AssetGroupName;
	Description: string;
	Asset: Asset[];
	ParentGroupName: string;
	Category: 'Appearance' | 'Item' | 'Script';
	IsDefault: boolean;
	IsRestraint: boolean;
	AllowNone: boolean;
	AllowColorize: boolean;
	AllowCustomize: boolean;
	Random?: boolean;
	ColorSchema: string[];
	ParentSize: string;
	ParentColor: string;
	Clothing: boolean;
	Underwear: boolean;
	BodyCosplay: boolean;
	Hide?: string[];
	Block?: AssetGroupItemName[];
	Zone?: [number, number, number, number][];
	SetPose?: string[];
	AllowPose: string[];
	AllowExpression?: string[];
	Effect?: EffectName[];
	MirrorGroup: string;
	RemoveItemOnRemove: { Group: string; Name: string; Type?: string }[];
	DrawingPriority: number;
	DrawingLeft: number;
	DrawingTop: number;
	DrawingFullAlpha: boolean;
	DrawingBlink: boolean;
	InheritColor?: string;
	FreezeActivePose: string[];
	PreviewZone?: RectTuple;
	DynamicGroupName: AssetGroupName;
	MirrorActivitiesFrom: string | null;

	/** A dict mapping colors to custom filename suffices.
	The "HEX_COLOR" key is special-cased to apply to all color hex codes. */
	ColorSuffix?: Record<string, string>;
	ExpressionPrerequisite?: string[];
}

/** An object defining a drawable layer of an asset */
interface AssetLayer {
	/** The name of the layer - may be null if the asset only contains a single default layer */
	Name: string | null;
	/** whether or not this layer can be colored */
	AllowColorize: boolean;
	/** if not null, specifies that this layer should always copy the color of the named layer */
	CopyLayerColor: string | null;
	/** specifies the name of a color group that this layer belongs to. Any layers within the same color group can be colored together via the item color UI */
	ColorGroup?: string;
	/** whether or not this layer can be colored in the coloring UI */
	HideColoring: boolean;
	/** A list of allowed extended item types that this layer permits - the layer will only be drawn if
	the item type matches one of these types. If null, the layer is considered to permit all extended types. */
	AllowTypes: string[] | null;
	/** whether or not the layer has separate assets per type. If not, the extended type will not be included in
	the URL when fetching the layer's image */
	HasType: boolean;
	/** The name of the parent group for this layer. If null, the layer has no parent group. If
	undefined, the layer inherits its parent group from it's asset/group. */
	ParentGroupName?: string | null;
	/** An array of poses that this layer permits. If set, it will override the poses permitted
	by the parent asset/group. */
	AllowPose: string[] | null;
	/** An array of poses that this layer should be hidden for. */
	HideForPose: string[];
	/** An array of objects mapping poses to other poses to determine their draw folder */
	PoseMapping?: { [index: string]: string };
	/** The drawing priority of this layer. Inherited from the parent asset/group if not specified in the layer
	definition. */
	Priority: number;
	InheritColor?: string;
	Alpha: AlphaDefinition[];
	/** The asset that this layer belongs to */
	Asset: Asset;
	DrawingLeft?: number;
	DrawingTop?: number;
	HideAs?: { Group: string; Asset?: string };
	/** That layer is drawing at a fixed Y position */
	FixedPosition?: boolean;
	HasImage: boolean;
	Opacity: number;
	MinOpacity: number;
	MaxOpacity: number;
	LockLayer: boolean;
	MirrorExpression?: string;
	AllowModuleTypes?: string[];
	/** The coloring index for this layer */
	ColorIndex: number;
	/** Any group-specific alpha masks that should be applied when drawing the layer. Only available on layers that have
	been created prior to drawing */
	GroupAlpha?: AlphaDefinition[];
	/** A module for which the layer can have types. */
	ModuleType: string[] | null;
	/* Specifies that this layer should not be drawn if the character is wearing any item with the given attributes */
	HideForAttribute: AssetAttribute[] | null;
	/* Specifies that this layer should not be drawn unless the character is wearing an item with one of the given attributes */
	ShowForAttribute: AssetAttribute[] | null;
}

/** An object defining a group of alpha masks to be applied when drawing an asset layer */
interface AlphaDefinition {
	/** A list of the group names that the given alpha masks should be applied to. If empty or not present, the
alpha masks will be applied to every layer underneath the present one. */
	Group?: string[];
	/** A list of the poses that the given alpha masks should be applied to. If empty or not present, the alpha
masks will be applied regardless of character pose. */
	Pose?: string[];
	/** A list of the extended types that the given alpha masks should be applied to. If empty or not present, the alpha
masks will be applied regardless of the extended type. */
	Type?: string[];
	/** A list of alpha mask definitions. A definition is a 4-tuple of numbers defining the top left coordinate of
a rectangle and the rectangle's width and height - e.g. [left, top, width, height] */
	Masks: RectTuple[];
}

interface TintDefinition {
	Color: number | string;
	Strength: number;
	DefaultColor?: string;
}

interface ResolvedTintDefinition extends TintDefinition {
	Item: Item;
}

interface ExpressionTrigger {
	Group: string;
	Name: string;
	Timer: number;
}

/**
 * The internal Asset definition of an asset.
 *
 * See AssetDefinition in Female3DCG.d.ts for documentation.
 */
interface Asset {
	Name: string;
	Description: string;
	Group: AssetGroup;
	ParentItem?: string;
	ParentGroupName?: string | null;
	Enable: boolean;
	Visible: boolean;
	Wear: boolean;
	Activity: string | null;
	AllowActivity?: string[];
	ActivityAudio?: string[];
	ActivityExpression: Record<string, ExpressionTrigger[]>;
	AllowActivityOn?: AssetGroupName[];
	BuyGroup?: string;
	PrerequisiteBuyGroups?: string[];
	Effect?: EffectName[];
	Bonus?: AssetBonusName;
	Block?: AssetGroupItemName[];
	Expose: string[];
	Hide?: string[];
	HideItem?: string[];
	HideItemExclude: string[];
	HideItemAttribute: AssetAttribute[];
	Require: string[];
	SetPose?: string[];
	AllowPose: string[] | null;
	HideForPose: string[];
	PoseMapping?: { [index: string]: string };
	AllowActivePose?: string[];
	WhitelistActivePose?: string[];
	Value: number;
	Difficulty: number;
	SelfBondage: number;
	SelfUnlock: boolean;
	ExclusiveUnlock: boolean;
	Random: boolean;
	RemoveAtLogin: boolean;
	WearTime: number;
	RemoveTime: number;
	RemoveTimer: number;
	MaxTimer: number;
	DrawingPriority?: number;
	DrawingLeft?: number;
	DrawingTop?: number;
	HeightModifier: number;
	ZoomModifier: number;
	Alpha?: AlphaDefinition[];
	Prerequisite: string[];
	Extended: boolean;
	AlwaysExtend: boolean;
	AlwaysInteract: boolean;
	AllowLock: boolean;
	LayerVisibility: boolean;
	IsLock: boolean;
	PickDifficulty: number;
	OwnerOnly: boolean;
	LoverOnly: boolean;
	ExpressionTrigger?: ExpressionTrigger[];
	RemoveItemOnRemove: { Name: string; Group: string; Type?: string; }[];
	AllowEffect?: EffectName[];
	AllowBlock?: AssetGroupItemName[];
	AllowHide?: AssetGroupItemName[];
	AllowHideItem?: string[];
	AllowType?: string[];
	DefaultColor?: ItemColor;
	Opacity: number;
	MinOpacity: number;
	MaxOpacity: number;
	Audio?: string;
	Category?: string[];
	Fetish?: string[];
	CustomBlindBackground?: string;
	ArousalZone: string;
	IsRestraint: boolean;
	BodyCosplay: boolean;
	OverrideBlinking: boolean;
	DialogSortOverride?: DialogSortOrder;
	DynamicDescription: (C: Character) => string;
	DynamicPreviewImage: (C: Character) => string;
	DynamicAllowInventoryAdd: (C: Character) => boolean;
	DynamicName: (C: Character) => string;
	DynamicGroupName: AssetGroupName;
	DynamicActivity: (C: Character) => string | null | undefined;
	DynamicAudio: ((C: Character) => string) | null;
	CharacterRestricted: boolean;
	AllowRemoveExclusive: boolean;
	InheritColor?: string;
	DynamicBeforeDraw: boolean;
	DynamicAfterDraw: boolean;
	DynamicScriptDraw: boolean;
	HasType: boolean;
	AllowLockType?: string[];
	AllowColorizeAll: boolean;
	AvailableLocations: string[];
	OverrideHeight?: AssetOverrideHeight;
	FreezeActivePose: string[];
	DrawLocks: boolean;
	AllowExpression?: string[];
	MirrorExpression?: string;
	FixedPosition: boolean;
	Layer: AssetLayer[];
	ColorableLayerCount: number;
	Archetype?: string;
	Attribute: AssetAttribute[];
	PreviewIcons: InventoryIcon[];
	Tint: TintDefinition[];
	AllowTint: boolean;
	DefaultTint?: string;
	Gender?: 'F' | 'M';
	CraftGroup: string;
	ColorSuffix: Record<string, string>;
	ExpressionPrerequisite?: string[];
	TextMaxLength: null | Partial<Record<PropertyTextNames, number>>;
	TextFont: null | string;
}

//#endregion

/** An ItemBundle is a minified version of the normal Item */
interface ItemBundle {
	Group: string;
	Name: string;
	Difficulty?: number;
	Color?: ItemColor;
	Property?: ItemProperties;
	Craft?: CraftingItem;
}

/** An AppearanceBundle is whole minified appearance of a character */
type AppearanceBundle = ItemBundle[];

interface Pose {
	Name: string;
	Category?: 'BodyUpper' | 'BodyLower' | 'BodyFull';
	AllowMenu?: true;
	/** Only show in menu if an asset supports it */
	AllowMenuTransient?: true;
	OverrideHeight?: AssetOverrideHeight;
	Hide?: string[];
	MovePosition?: { Group: string; X: number; Y: number; }[];
}

interface Activity {
	Name: string;
	MaxProgress: number;
	MaxProgressSelf?: number;
	Prerequisite: string[];
	Target: AssetGroupItemName[];
	TargetSelf?: AssetGroupItemName[] | true;
	/** Whether to reverse the prerequisite checks for that one */
	Reverse?: true;
	/** used for setting {@link ExtendedItemAutoPunishHandled} */
	MakeSound?: boolean;
	/** An action that trigger when that activity is used */
	StimulationAction?: StimulationAction;
	/** The default expression for that activity. Can be overriden using ActivityExpression on the asset */
	ActivityExpression?: ExpressionTrigger[];
}

type ItemActivityRestriction = "blocked" | "limited" | "unavail";

interface ItemActivity {
	/** The activity performed */
	Activity: Activity;
	/** An optional item used for the activity. Null if the player is used their hand, for example. */
	Item?: Item;
	/** Whether the item is blocked or limited on the target character, or unavailable because the player is blocked. Undefined means no restriction. */
	Blocked?: ItemActivityRestriction;
}

interface LogRecord {
	Name: string;
	Group: string;
	Value: number;
}

type ItemColor = string | string[];

/** An item is a pair of asset and its dynamic properties that define a worn asset. */
interface Item {
	Asset: Asset;
	Color?: ItemColor;
	Difficulty?: number;
	Craft?: CraftingItem;
	Property?: ItemProperties;
}

type FavoriteIcon = "Favorite" | "FavoriteBoth" | "FavoritePlayer";

type InventoryIcon = FavoriteIcon | "AllowedLimited" | "Handheld" | "Locked" | "LoverOnly" | "OwnerOnly" | "Unlocked";

interface DialogInventoryItem extends Item {
	Worn: boolean;
	Icons: InventoryIcon[];
	SortOrder: string;
	Hidden: boolean;
	Vibrating: boolean;
}

interface InventoryItem {
	Group: string;
	Name: string;
	Asset: Asset;
}

interface FavoriteState {
	TargetFavorite: boolean;
	PlayerFavorite: boolean;
	Icon: FavoriteIcon;
	UsableOrder: DialogSortOrder;
	UnusableOrder: DialogSortOrder;
}

interface Skill {
	Type: string;
	Level: number;
	Progress: number;
	Ratio?: number;
}

interface Reputation {
	Type: string;
	Value: number;
}

interface Ownership {
	Name: string;
	MemberNumber: number;
	Stage: number;
	Start: number;
}

interface Lovership {
	Name: string;
	MemberNumber?: number;
	Stage?: number;
	Start?: number;
	// Bad data sometimes received from server
	BeginDatingOfferedByMemberNumber?: unknown;
	BeginEngagementOfferedByMemberNumber?: unknown;
	BeginWeddingOfferedByMemberNumber?: unknown;
}

interface ScreenFunctions {
	// Required
	/**
	 * Called each frame
	 * @param {number} time - The current time for frame
	 */
	Run(time: number): void;
	/**
	 * Called when user clicks on the canvas
	 * @param {MouseEvent | TouchEvent} event - The event that triggered this
	 */
	Click(event: MouseEvent | TouchEvent): void;

	// Optional
	/** Called when screen is loaded using `CommonSetScreen` */
	Load?(): void;
	/** Called when this screen is being replaced */
	Unload?(): void;
	/**
	 * Called when screen size or position changes or after screen load
	 * @param {boolean} load - If the reason for call was load (`true`) or window resize (`false`)
	 */
	Resize?(load: boolean): void;
	/**
	 * Called when user presses any key
	 * @param {KeyboardEvent} event - The event that triggered this
	 */
	KeyDown?(event: KeyboardEvent): void;
	/** Called when user presses Esc */
	Exit?(): void;
}

//#region Characters

/** A struct for representing an item with special permissions (limited, favorited, etc). */
interface ItemPermissions {
	/** The {@link Asset.Name} of the item */
	Name: string;
	/** The {@link AssetGroup.Name} of the item */
	Group: AssetGroupName;
	/**
	 * Either the item's {@link ItemProperties.Type} or, in the case of modular items,
	 * a substring thereof denoting the type of a single module
	 */
	Type?: string | null;
}

interface ScriptPermission {
	permission: number;
}

type ScriptPermissionProperty = "Hide" | "Block";

type ScriptPermissionLevel = "Self" | "Owner" | "Lovers" | "Friends" | "Whitelist" | "Public";

type ScriptPermissions = Record<ScriptPermissionProperty, ScriptPermission>;

interface Character {
	ID: number;
	/** Only on `Player` */
	OnlineID?: string;
	Type: CharacterType;
	Name: string;
	Nickname?: string;
	AssetFamily: IAssetFamily | string;
	AccountName: string;
	Owner: string;
	Lover: string;
	Money: number;
	Inventory: InventoryItem[];
	Appearance: Item[];
	Stage: string;
	CurrentDialog: string;
	Dialog: any[];
	Reputation: Reputation[];
	Skill: Skill[];
	Pose: string[];
	Effect: string[];
	Tints: ResolvedTintDefinition[];
	Attribute: AssetAttribute[];
	FocusGroup: AssetGroup | null;
	Canvas: HTMLCanvasElement | null;
	CanvasBlink: HTMLCanvasElement | null;
	MustDraw: boolean;
	BlinkFactor: number;
	AllowItem: boolean;
	BlockItems: ItemPermissions[];
	FavoriteItems: ItemPermissions[];
	LimitedItems: ItemPermissions[];
	WhiteList: number[];
	HeightModifier: number;
	MemberNumber?: number;
	ItemPermission?: number;
	Ownership?: Ownership;
	Lovership?: Lovership[];
	CanTalk: () => boolean;
	CanWalk: () => boolean;
	CanKneel: () => boolean;
	CanInteract: () => boolean;

	/**
	 * Check whether a character can change its own outfit.
	 *
	 * @warning Only usable on Player
	 * @returns {boolean} - TRUE if changing is possible, FALSE otherwise.
	 */
	CanChangeOwnClothes: () => boolean;

	/**
	 * Check whether a character can change another one's outfit.
	 *
	 * @param {Character} C - The character to check against.
	 * @returns {boolean} - TRUE if changing is possible, FALSE otherwise.
	 */
	CanChangeClothesOn: (C: Character) => boolean;
	IsProne: () => boolean;
	IsRestrained: () => boolean;
	IsBlind: () => boolean;
	IsEnclose: () => boolean;
	IsChaste: () => boolean;
	IsVulvaChaste: () => boolean;
	IsBreastChaste: () => boolean;
	IsButtChaste: () => boolean;
	IsEgged: () => boolean;
	IsOwned: () => boolean;
	IsOwnedByPlayer: () => boolean;
	IsOwner: () => boolean;
	IsKneeling: () => boolean;
	IsNaked: () => boolean;
	IsDeaf: () => boolean;
	IsGagged: () => boolean;
	HasNoItem: () => boolean;
	IsLoverOfPlayer: () => boolean;
	GetLoversNumbers: (MembersOnly?: boolean) => (number | string)[];
	AllowedActivePose: string[];
	HiddenItems: ItemPermissions[];
	HeightRatio: number;
	HasHiddenItems: boolean;
	SavedColors: HSVColor[];
	GetBlindLevel: (eyesOnly?: boolean) => number;
	GetBlurLevel: () => number;
	IsLocked: () => boolean;
	IsMounted: () => boolean;
	IsPlugged: () => boolean;
	IsShackled: () => boolean;
	IsSlow: () => boolean;
	IsMouthBlocked: () => boolean;
	IsMouthOpen: () => boolean;
	IsVulvaFull: () => boolean;
	IsAssFull: () => boolean;
	IsFixedHead: () => boolean;
	IsOwnedByMemberNumber: (memberNumber: number) => boolean;
	IsLover: (C: Character) => boolean;
	IsLoverOfMemberNumber: (memberNumber: number) => boolean;
	GetDeafLevel: () => number;
	IsLoverPrivate: () => boolean;
	IsEdged: () => boolean;
	IsPlayer: () => this is PlayerCharacter;
	IsBirthday: () => boolean;
	IsOnline: () => boolean;
	IsNpc: () => boolean;
	IsSimple: () => boolean;
	GetDifficulty: () => number;
	IsSuspended: () => boolean;
	IsInverted: () => boolean;
	CanChangeToPose: (Pose: string) => boolean;
	GetClumsiness: () => number;
	HasEffect: (Effect: string) => boolean;
	HasTints: () => boolean;
	GetTints: () => RGBAColor[];
	HasAttribute: (attribute: AssetAttribute) => boolean;
	DrawPose?: string[];
	DrawAppearance?: Item[];
	AppearanceLayers?: AssetLayer[];
	Hooks: Map<string, Map<string, any>> | null;
	RegisterHook: (hookName: string, hookInstance: string, callback: any) => boolean | any;
	UnregisterHook: (hookName: string, hookInstance: string) => boolean;
	HeightRatioProportion?: number;
	GetGenders: () => string[];
	HasPenis: () => boolean;
	HasVagina: () => boolean;
	IsFlatChested: () => boolean;
	// Properties created in other places
	ArousalSettings?: {
		Active: string;
		Visible: string;
		ShowOtherMeter: boolean;
		AffectExpression: boolean;
		AffectStutter: string;
		VFX: string;
		VFXVibrator: string;
		VFXFilter: string;
		Progress: number;
		ProgressTimer: number;
		VibratorLevel: number;
		ChangeTime: number;
		Activity: any[];
		Zone: any[];
		Fetish: any[];
		OrgasmTimer?: number;
		OrgasmStage?: number;
		OrgasmCount?: number;
		DisableAdvancedVibes: boolean;
	};
	AppearanceFull?: Item[];
	// Online character properties
	Title?: string;
	ActivePose?: any;
	LabelColor?: any;
	Creation?: any;
	Description?: any;
	OnlineSharedSettings?: {
		AllowFullWardrobeAccess: boolean;
		BlockBodyCosplay: boolean;
		AllowPlayerLeashing: boolean;
		DisablePickingLocksOnSelf: boolean;
		GameVersion: string;
		ItemsAffectExpressions: boolean;
		ScriptPermissions: ScriptPermissions;
		WheelFortune: string;
	};
	Game?: {
		LARP?: GameLARPParameters,
		MagicBattle?: GameMagicBattleParameters,
		GGTS?: GameGGTSParameters,
	};
	BlackList: number[];
	RunScripts?: boolean;
	HasScriptedAssets?: boolean;
	Cage?: true | null;
	Difficulty?: {
		Level: number;
		LastChange?: number;
	};
	ArousalZoom?: boolean;
	FixedImage?: string;
	Rule?: LogRecord[];
	Status?: string | null;
	StatusTimer?: number;
	Crafting?: CraftingItem[];
}

type NPCArchetype =
	/* Pandora NPCs */
	"MemberNew" | "MemberOld" | "Cosplay" | "Mistress" | "Slave" | "Maid" | "Guard" |
	/* Pandora Special */
	"Victim" | "Target" | "Chest";

/** NPC Character extension */
// FIXME: That one should find its way down to NPCCharacter, but
// there's too many accesses to those properties from Character
// to do so.
interface Character {
	/** NPC type: Slave, Maid, etc. */
	Archetype?: NPCArchetype;
	Love?: number; /** The NPC's love value */
	WillRelease?(): boolean; /** Shop NPC-only: will it release the player when asked */
}

/** NPC-only */
interface NPCCharacter extends Character {
	Archetype?: NPCArchetype;
	Trait?: NPCTrait[];
	Event?: NPCTrait[];
	Love?: number;
}

/** College */
interface NPCCharacter {
	GoneAway?: boolean;
}

/** Asylum */
interface NPCCharacter {
	RunAway?: boolean;
}

/** Sarah */
interface Character {
	OrgasmMeter?: number;
	OrgasmDone?: boolean;
}

/** Private Room & Private Bed */
interface Character {
	PrivateBed?: boolean;
	PrivateBedActivityTimer?: number;
	PrivateBedLeft?: number;
	PrivateBedTop?: number;
	PrivateBedMoveTimer?: number;
	PrivateBedAppearance?: string;
}

interface KidnapCard {
	Move: number;
	Value?: number;
}

/** Kidnap minigame */
interface Character {
	KidnapWillpower?: number;
	KidnapMaxWillpower?: number;
	KidnapCard?: KidnapCard[];
	KidnapStat?: [number, number, number, number];
}

/** Pandora NPCs */
interface Character {
	Recruit?: number;
	RecruitOdds?: number;
	RandomOdds?: number;
	QuizLog?: number[];
	QuizFail?: number;
	AllowMove?: boolean;
	DrinkValue?: number;
	TriggerIntro?: boolean;
	FromPandora?: boolean;
}

/** Magic School */
interface Character {
	House?: string;
}

/** MovieStudio */
interface Character {
	Friendship?: string;
	InterviewCleanCount?: number;
}

/** Slave market */
interface Character {
	ExpectedTraining?: number;
	CurrentTraining?: number;
	TrainingIntensity?: number;
	TrainingCount?: number;
	TrainingCountLow?: number;
	TrainingCountHigh?: number;
	TrainingCountPerfect?: number;
}

interface PlayerCharacter extends Character {
	// PreferenceInitPlayer() must be updated with defaults, when adding a new setting
	ChatSettings?: {
		ColorActions: boolean;
		ColorActivities: boolean;
		ColorEmotes: boolean;
		ColorNames: boolean;
		ColorTheme: string;
		DisplayTimestamps: boolean;
		EnterLeave: string;
		FontSize: string;
		MemberNumbers: string;
		MuStylePoses: boolean;
		ShowActivities: boolean;
		ShowAutomaticMessages: boolean;
		ShowBeepChat: boolean;
		ShowChatHelp: boolean;
		ShrinkNonDialogue: boolean;
		WhiteSpace: string;
		/** @deprecated */
		AutoBanBlackList?: any;
		/** @deprecated */
		AutoBanGhostList?: any;
		/** @deprecated */
		SearchFriendsFirst?: any;
		/** @deprecated */
		DisableAnimations?: any;
		/** @deprecated */
		SearchShowsFullRooms?: any;
		CensoredWordsList: string;
		CensoredWordsLevel: number;
	};
	VisualSettings?: {
		ForceFullHeight?: boolean;
		UseCharacterInPreviews?: boolean;
		MainHallBackground?: string;
		PrivateRoomBackground?: string;
	};
	AudioSettings?: {
		Volume: number;
		PlayBeeps: boolean;
		/** Play items sounds in chatrooms */
		PlayItem: boolean;
		/** Play sounds only if the player is involved */
		PlayItemPlayerOnly: boolean;
		Notifications: boolean;
	};
	ControllerSettings?: {
		ControllerSensitivity: number;
		ControllerDeadZone: number;
		ControllerA: number;
		ControllerB: number;
		ControllerX: number;
		ControllerY: number;
		ControllerStickUpDown: number;
		ControllerStickLeftRight: number;
		ControllerStickRight: number;
		ControllerStickDown: number;
		ControllerDPadUp: number;
		ControllerDPadDown: number;
		ControllerDPadLeft: number;
		ControllerDPadRight: number;
		ControllerActive: boolean;
	};
	GameplaySettings?: {
		SensDepChatLog: string;
		BlindDisableExamine: boolean;
		DisableAutoRemoveLogin: boolean;
		ImmersionLockSetting: boolean;
		EnableSafeword: boolean;
		DisableAutoMaid: boolean;
		OfflineLockedRestrained: boolean;
	};
	ImmersionSettings?: {
		BlockGaggedOOC: boolean;
		StimulationEvents: boolean;
		ReturnToChatRoom: boolean;
		ReturnToChatRoomAdmin: boolean;
		SenseDepMessages: boolean;
		ChatRoomMuffle: boolean;
		BlindAdjacent: boolean;
		AllowTints: boolean;
	};
	LastChatRoom?: string;
	LastChatRoomBG?: string;
	LastChatRoomPrivate?: boolean;
	LastChatRoomSize?: number;
	LastChatRoomLanguage?: string;
	LastChatRoomDesc?: string;
	LastChatRoomAdmin?: any[];
	LastChatRoomBan?: any[];
	LastChatRoomBlockCategory?: string[];
	LastChatRoomTimer?: any;
	LastChatRoomSpace?: ChatRoomSpaceType;
	RestrictionSettings?: {
		BypassStruggle: boolean;
		SlowImmunity: boolean;
		BypassNPCPunishments: boolean;
	};
	OnlineSettings?: {
		AutoBanBlackList: boolean;
		AutoBanGhostList: boolean;
		DisableAnimations: boolean;
		SearchShowsFullRooms: boolean;
		SearchFriendsFirst: boolean;
		SendStatus?: boolean;
		ShowStatus?: boolean;
		EnableAfkTimer: boolean;
	};
	GraphicsSettings?: {
		Font: string;
		InvertRoom: boolean;
		StimulationFlashes: boolean;
		DoBlindFlash: boolean;
		AnimationQuality: number;
		StimulationFlash: boolean;
		SmoothZoom: boolean;
		CenterChatrooms: boolean;
		AllowBlur: boolean;
	}
	NotificationSettings?: {
		/** @deprecated */
		Audio?: boolean;
		Beeps: NotificationSetting;
		/** @deprecated */
		Chat?: any;
		ChatMessage: NotificationSetting & {
			/** @deprecated */
			IncludeActions?: any;
			Mention?: boolean;
			Normal?: boolean;
			Whisper?: boolean;
			Activity?: boolean;
		};
		/** @deprecated */
		ChatActions?: any;
		ChatJoin: NotificationSetting & {
			/** @deprecated */
			Enabled?: any;
			Owner?: boolean;
			Lovers?: boolean;
			Friendlist?: boolean;
			Subs?: boolean;
		};
		Disconnect: NotificationSetting;
		Larp: NotificationSetting;
		Test: NotificationSetting;
	};
	GhostList?: number[];
	Wardrobe?: any[][];
	WardrobeCharacterNames?: string[];
	SavedExpressions?: ({ Group: string, CurrentExpression?: string }[] | null)[];
	SavedColors: HSVColor[];
	FriendList?: number[];
	FriendNames?: Map<number, string>;
	SubmissivesList?: Set<number>;
	ChatSearchFilterTerms?: string;
	GenderSettings: {
		HideShopItems: GenderSetting;
		AutoJoinSearch: GenderSetting;
	};
}

/** Pandora Player extension */
interface PlayerCharacter {
	Infiltration?: {
		Punishment?: {
			Minutes: number;
			Timer?: number;
			Background: string;
			Difficulty: number;
			FightDone?: boolean;
		}
		Perks?: string;
	}
}

/** Kinky Dungeon Player extension */
interface PlayerCharacter {
	KinkyDungeonKeybindings?: any;
	KinkyDungeonExploredLore?: any[];
}

interface NPCTrait {
	Name: string;
	Value: number;
}

//#endregion

//#region Extended items

/** A struct-type that maps archetypes to their respective extended item data.  */
interface ExtendedDataLookupStruct {
	[ExtendedArchetype.TYPED]: TypedItemData;
	[ExtendedArchetype.MODULAR]: ModularItemData;
	[ExtendedArchetype.VIBRATING]: VibratingItemData;
	[ExtendedArchetype.VARIABLEHEIGHT]: VariableHeightData;
}

interface AssetOverrideHeight {
	Height: number;
	Priority: number;
	HeightRatioProportion?: number;
}

/**
 * Base properties of extended items derived from their respective {@link Asset} definition.
 *
 * Those are the properties the main game code enforces.
 */
interface AssetDefinitionProperties {
	/**
	 * The difficulty of the item
	 * @see {@link Asset.Difficulty}
	 */
	Difficulty?: number;
	/**
	 * ???
	 * @see {@link Asset.Attribute}
	 */
	Attribute?: AssetAttribute[];

	/**
	 * Override the height of the item
	 * @see {@link Asset.OverrideHeight}
	 */
	OverrideHeight?: AssetOverrideHeight;
	/**
	 * How much the character should be moved up
	 * @see {@link Asset.HeightModifier}
	 */
	HeightModifier?: number;
	/**
	 * The drawing priority of the item
	 * @see {@link Asset.OverridePriority}
	 */
	OverridePriority?: number;
	/**
	 * The default color of the item
	 * @see {@link Asset.DefaultColor}
	 */
	DefaultColor?: ItemColor;

	/**
	 * A list of allowed activities
	 * @see {@link Asset.AllowActivity}
	 */
	AllowActivity?: string[];
	/**
	 * A list of groups allowed activities
	 * @see {@link Asset.AllowActivityOn}
	 */
	AllowActivityOn?: AssetGroupName[];

	/**
	 * Items that should be hidden by this item
	 * @see {@link Asset.HideItem}
	 */
	HideItem?: string[];
	/**
	 * Items that should not be hidden by this item
	 * @see {@link Asset.HideItemExclude}
	 */
	HideItemExclude?: string[];
	/**
	 * Items groups that should be hidden by this item
	 * @see {@link Asset.Hide}
	 */
	Hide?: AssetGroupName[];

	/**
	 * The groups that this item blocks
	 * @see {@link Asset.Block}
	 */
	Block?: AssetGroupItemName[];

	/**
	 * Effects that are applied by this item
	 * @see {@link Asset.Effect}
	 */
	Effect?: EffectName[];

	/**
	 * A list of custom tints
	 * @see {@link Asset.Tint}
	 */
	Tint?: TintDefinition[];

	// Pose-related properties

	/**
	 * A list of poses that should forcefully be set
	 * @see {@link Asset.SetPose}
	 */
	SetPose?: AssetPoseName[];
	/**
	 * A list of poses
	 * @see {@link Asset.AllowActivePose}
	 */
	AllowActivePose?: AssetPoseName[];
	/**
	 * A list of allowed poses
	 * @see {@link Asset.AllowPose}
	 */
	AllowPose?: AssetPoseName[];
	/**
	 * A list of poses
	 * @see {@link Asset.WhitelistActivePose}
	 */
	WhitelistActivePose?: AssetPoseName[];
	/**
	 * A list of poses that should be frozen
	 * @see {@link Asset.FreezeActivePose}
	 */
	FreezeActivePose?: AssetPoseName[];

	/**
	 * Whether an item can be unlocked by the player even if they're restrained
	 * @see {@link Asset.SelfUnlock}
	 */
	SelfUnlock?: boolean;

	/**
	 * The timer for after how long until a lock should be removed
	 * @see {@link Asset.RemoveTimer}
	 */
	RemoveTimer?: number;

	/**
	 * The asset's draw opacity
	 * @see {@link Asset.Opacity}
	 */
	Opacity?: number;

	/**
	 * A custom background for this option that overrides the default
	 * @see {@link Asset.CustomBlindBackground}
	 */
	CustomBlindBackground?: string;
}

/**
 * Base properties for extended items
 *
 * Those are the properties the main game code enforces.
 */
interface ItemPropertiesBase {
	/** A string (or `null`) denoting the state of an extended item. How the type-string translate to concrete properties depends on the Archetype in question. */
	Type?: string | null;

	/** A facial expression */
	Expression?: string;

	/** Whether the asset affects should be overriden rather than extended */
	OverrideAssetEffect?: boolean;

	// Vibratory-related properties

	/** The vibrator mode */
	Mode?: VibratorMode;
	/** The vibrator intensity */
	Intensity?: VibratorIntensity;
	/** The vibrator's state; only relevant for advanced vibrator modes */
	State?: VibratorModeState;
}

/**
 * Custom properties for extended items
 *
 * Those are properties that are asset-specific, so the handling might be done
 * per-item.
 */
interface ItemPropertiesCustom {
	/** The member number of the player adding the item */
	ItemMemberNumber?: number;

	/** The member number of the player adding the item */
	MemberNumber?: number;

	//#region Lock properties

	/** Asset name of the lock */
	LockedBy?: AssetLockType;
	/** The member number of the person that applied the lock */
	LockMemberNumber?: number | string;
	/** `/^[A-Z]{1,8}$/`, Used by `PasswordPadlock`, `SafewordPadlock` and `TimerPasswordPadlock` lock */
	Password?: string;
	/** Comma separated numbers */
	LockPickSeed?: string;
	/** `/^[0-9]{4}$/`, Used by `CombinationPadlock` lock */
	CombinationNumber?: string;
	/** Comma separated numbers; used by `HighSecurityPadlock` */
	MemberNumberListKeys?: string;
	/** Used by `PasswordPadlock`, `SafewordPadlock` and `TimerPasswordPadlock` locks */
	Hint?: string;
	/** Used by `PasswordPadlock`, `SafewordPadlock` and `TimerPasswordPadlock` locks; if the lock has been set with password */
	LockSet?: boolean;
	/** Whether to remove item on timer lock unlock; used by `LoversTimerPadlock`, `MistressTimerPadlock`, `OwnerTimerPadlock`, `TimerPadlock`, `TimerPasswordPadlock` */
	RemoveItem?: boolean;
	/** Only for `PasswordPadlock` */
	RemoveOnUnlock?: boolean;
	/** Whether time is shown or "Unknown time left"; used by `LoversTimerPadlock`, `MistressTimerPadlock`, `OwnerTimerPadlock`, `TimerPasswordPadlock` */
	ShowTimer?: boolean;
	/** Enable input; used by `LoversTimerPadlock`, `MistressTimerPadlock`, `OwnerTimerPadlock`, `TimerPasswordPadlock` */
	EnableRandomInput?: boolean;
	/** List of people who publicly modified time on lock; used by `LoversTimerPadlock`, `MistressTimerPadlock`, `OwnerTimerPadlock`, `TimerPasswordPadlock` */
	MemberNumberList?: number[];

	//#endregion

	/** The inflation level of inflatable items */
	InflateLevel?: 0 | 1 | 2 | 3 | 4;

	/** The suction level of items with a suction effect */
	SuctionLevel?: 0 | 1 | 2 | 3 | 4;

	/** 1st line of text for user-entered text data */
	Text?: string;
	/** 2nd line of text for user-entered text data */
	Text2?: string;
	/** 3rd line of text for user-entered text data */
	Text3?: string;

	/** Whether the item blocks access to the butt */
	LockButt?: boolean;

	// #region Futuristic Set open permissions

	/** Whether all players can use futuristic head devices */
	OpenPermission?: boolean;
	/** Whether all players can use futuristic arm devices */
	OpenPermissionArm?: boolean;
	/** Whether all players can use futuristic leg devices */
	OpenPermissionLeg?: boolean;
	/** Whether all players can use futuristic chastity devices */
	OpenPermissionChastity?: boolean;
	/** Whether the usage of remotes is blocked */
	BlockRemotes?: boolean;

	// #endregion

	/** The futuristic bra's heart rate value */
	HeartRate?: number;
	/** Is the futuristic bra's heart icon shown */
	HeartIcon?: boolean;

	// #region Futuristic gag & panel gag settings */

	/** The item's auto-punishment sensitivity */
	AutoPunish?: 0 | 1 | 2 | 3;
	/** The remaining time for the gag's auto-inflation */
	AutoPunishUndoTime?: number;
	/** The default time for the gag's auto-inflation */
	AutoPunishUndoTimeSetting?: 120000 | 300000 | 900000 | 3600000 | 72000000;
	/** The gag module-index prior to triggering auto-inflation */
	OriginalSetting?: 0 | 1 | 2 | 3;
	/** Whether gag's blinking light is on or off */
	BlinkState?: boolean;
	/**
	 * An extended item option
	 * @todo Investigate whether this property still actually exists
	 */
	Option?: ExtendedItemOption;

	// #endregion

	// #region Futuristic chastity settings

	/** Whether attempting to remove the belt should result in punishment */
	PunishStruggle?: boolean;
	/** Whether attempting to remove an item in general should result in punishment */
	PunishStruggleOther?: boolean;
	/** Whether orgasms should result in punishment */
	PunishOrgasm?: boolean;
	/** Whether standing up should result in punishment */
	PunishStandup?: boolean;
	/** The punishment for talking; represents an index of {@link FuturisticTrainingBeltSpeechPunishments} */
	PunishSpeech?: 0 | 1 | 2 | 3;
	/** The punishment for not speaking a required word; represents an index of {@link FuturisticTrainingBeltSpeechPunishments} */
	PunishRequiredSpeech?: 0 | 1 | 2 | 3;
	/** A string with comma-separated required words */
	PunishRequiredSpeechWord?: string;
	/** The punishment for speaking a prohibited word; represents an index of {@link FuturisticTrainingBeltSpeechPunishments} */
	PunishProhibitedSpeech?: 0 | 1 | 2 | 3;
	/** A string with comma-separated prohibited words */
	PunishProhibitedSpeechWords?: string;
	/** Internal cooldown timer for automatic shocks */
	NextShockTime?: number;
	/** The mode of the belts vibrator; represents an index of {@link FuturisticTrainingBeltModes} */
	PublicModeCurrent?: 0 | 1 | 2 | 3 | 4 | 5 | 6;
	/** An integer denoting who can access the belt; represents an index of {@link FuturisticTrainingBeltPermissions} */
	PublicModePermission?: 0 | 1 | 2;

	// #endregion

	/** A comma-seperated string with the futuristic vibrator's trigger words */
	TriggerValues?: string;
	/** A string denoting who has permission to use the vibrator's trigger words */
	AccessMode?: ItemVulvaFuturisticVibratorAccessMode;

	/** How intense the shock should be */
	ShockLevel?: 0 | 1 | 2;

	/** The number of inserted beads */
	InsertedBeads?: 1 | 2 | 3 | 4 | 5;

	/** Whether the item displays a chat message to all other people in the room */
	ShowText?: boolean;

	/** Number of times the item was triggered; often used by shock collars */
	TriggerCount?: number;

	/** Number of times the suitcase got cracked */
	Iterations?: number;

	/** Allows reverting back to these properties on exiting an extended menu */
	Revert?: boolean;

	/** Whether the kennel door is open */
	Door?: boolean;
	/** Whether the kennel has padding */
	Padding?: boolean;

	/** Only available as overrides on the script item */
	UnHide?: AssetGroupName[];

	/** Lucky Wheel: the section labels */
	Texts?: string[];

	/** Lucky Wheel: the angle the wheel should spin to */
	TargetAngle?: number;

}

interface ItemProperties extends ItemPropertiesBase, AssetDefinitionProperties, ItemPropertiesCustom { }

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
	CopyConfig?: { GroupName?: string, AssetName: string };
}

/**
 * Valid extended item configuration types
 */
type AssetArchetypeConfig = TypedItemAssetConfig | ModularItemAssetConfig | VibratingItemAssetConfig | VariableHeightAssetConfig;

/**
 * An object containing extended item definitions for a group.
 * Maps asset names within the group to their extended item configuration
 * @see {@link ExtendedItemAssetConfig}
 */
type ExtendedItemGroupConfig = Record<string, AssetArchetypeConfig>;

/**
 * An object containing extended item configurations keyed by group name.
 * @see {@link ExtendedItemAssetConfig}
 */
type ExtendedItemConfig = Record<string, ExtendedItemGroupConfig>;

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
	 * To-be initialized properties independant of the selected item module(s).
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
	Block?: string[];
	/** A list of groups that this option hides - defaults to [] */
	Hide?: string[];
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
	Effect?: string[];
	/** Whether the option forces a given pose */
	SetPose?: string;
	/** If set, the option changes the asset's default priority */
	OverridePriority?: number;
	/** A list of activities enabled by that module */
	AllowActivity?: string[];
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

/** A struct with drawing data for a given module. */
interface ModularItemDrawData {
	/** The number of pages */
	pageCount: number,
	/** Whether pagination is required; i.e. if the number of buttons is larger than {@link ModularItemDrawData.itemsPerPage} */
	paginate: boolean,
	/** An array with two-tuples of X and Y coordinates for the buttons */
	positions: [number, number][],
	/** Whether each button should be accompanied by a preview image */
	drawImages: boolean,
	/** The number of buttons to be drawn per page */
	itemsPerPage: number
}

/** An object containing modular item configuration for an asset. Contains all of the necessary information for the
 * item's load, draw & click handlers.
 */
interface ModularItemData {
	/** A reference to the asset that this configuration is tied to */
	asset: Asset;
	/** The item's chatroom message setting. Determines the level of
	 * granularity for chatroom messages when the item's module values change.
	 */
	chatSetting: ModularItemChatSetting;
	/**
	 * An array of the chat message tags that should be included in the item's
	 * chatroom messages. Defaults to [{@link CommonChatTags.SOURCE_CHAR}, {@link CommonChatTags.DEST_CHAR}]
	 */
	chatTags: CommonChatTags[];
	/** The identifying key for the asset, in the format "<GroupName><AssetName>" */
	key: string;
	/** The total number of types permitted by the item */
	typeCount: number;
	/** The prefix for generated functions */
	functionPrefix: string;
	/** The dialogue prefix for the player prompt that is displayed on each module's menu screen */
	dialogSelectPrefix: string;
	/** The dialogue prefix for the name of each module */
	dialogModulePrefix: string;
	/** The dialogue prefix for the name of each option */
	dialogOptionPrefix: string;
	/** The dialogue prefix that will be used for each of the item's chatroom messages */
	chatMessagePrefix: string | ExtendedItemChatCallback<ModularItemOption>;
	/** The module definitions for the modular item */
	modules: ModularItemModule[];
	/** Name of currently active module */
	currentModule: string;
	/** A lookup for the current page in the extended item menu for each of the item's modules */
	pages: Record<string, number>;
	/** A lookup for the draw data for each of the item's modules */
	drawData: Record<string, ModularItemDrawData>;
	/** A lookup for the draw functions for each of the item's modules */
	drawFunctions: Record<string, () => void>;
	/** A lookup for the click functions for each of the item's modules */
	clickFunctions: Record<string, () => void>;
	/**
	 * A boolean indicating whether or not the item's type can be changed while the
	 * item is locked (if set to `false`, the player must be able to unlock the item to change its type). Defaults to `true`
	 */
	changeWhenLocked: boolean;
	/**
	 * A recond containing functions that are run on load, click, draw, exit, and validate, with the original archetype function
	 * and parameters passed on to them. If undefined, these are ignored.
	 * Note that scripthook functions must be loaded before `Female3DCGExtended.js` in `index.html`.
	 */
	scriptHooks?: {
		load?: (next: () => void) => void,
		click?: (next: () => void) => void,
		draw?: (next: () => void) => void,
		exit?: () => void,
		validate?: ExtendedItemValidateScriptHookCallback<ModularItemOption>,
	};
	/**
	 * To-be initialized properties independant of the selected item module(s).
	 * Relevant if there are properties that are (near) exclusively managed by {@link ModularItemData.scriptHooks} functions.
	 */
	BaselineProperty: ItemProperties | null;
	/**
	 * A boolean indicating whether or not images should be drawn for the module selection screen.
	 * Automatically generated based on {@link ModularItemModule.DrawImages} if not explicitly specified.
	 */
	drawImages: boolean;
}

/** A 3-tuple containing data for drawing a button in a modular item screen. A button definition takes the
 * format:
 * ```
 * [moduleOrOption, currentOption, prefix]
 * ```
 * The moduleOrOption is the to be drawn item module or option.
 * The currentOption is currently active option within the relevant module.
 * The prefix is the dialog prefix for the buttons text.
 */
type ModularItemButtonDefinition = [ModularItemOption | ModularItemModule, ModularItemOption, string]

//#endregion

//#region Typed items

/** An object containing the extended item definition for a modular asset. */
type TypedItemAssetConfig = ExtendedItemAssetConfig<"typed", TypedItemConfig>;

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
	 * To-be initialized properties independant of the selected item module(s).
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
 * An object containing typed item configuration for an asset. Contains all of the necessary information for the item's
 * load, draw & click handlers.
 */
interface TypedItemData {
	/** The asset reference */
	asset: Asset;
	/** The list of extended item options available for the item */
	options: ExtendedItemOption[];
	/** A key uniquely identifying the asset */
	key: string;
	/** The common prefix used for all extended item functions associated with the asset */
	functionPrefix: string;
	/** A record containing various dialog keys used by the extended item screen */
	dialog: {
		/** The dialog key for the item's load text (usually a prompt to select the type) */
		load: string;
		/** The prefix used for dialog keys representing the display names of the item's types */
		typePrefix: string;
		/** The prefix used for dialog keys representing the item's chatroom messages when its type is changed */
		chatPrefix: string | ExtendedItemChatCallback<ExtendedItemOption>;
		/** The prefix used for dialog keys representing an NPC's reactions to item type changes */
		npcPrefix: string | ExtendedItemNPCCallback<ExtendedItemOption>;
	};
	/**
	 * An array of the chat message tags that should be included in the item's
	 * chatroom messages. Defaults to [{@link CommonChatTags.SOURCE_CHAR}, {@link CommonChatTags.DEST_CHAR}]
	 */
	chatTags: CommonChatTags[];
	/**
	 * Contains custom dictionary entries in the event that the base ones do not suffice.
	 */
	dictionary?: TypedItemDictionaryCallback[];
	/**
	 * The chat message setting for the item. This can be provided to allow
	 * finer-grained chatroom message keys for the item. Defaults to {@link TypedItemChatSetting.TO_ONLY}
	 */
	chatSetting?: TypedItemChatSetting;
	/** A boolean indicating whether or not images should be drawn in this item's extended item menu. Defaults to `true` */
	drawImages?: boolean;
	/**
	 * A boolean indicating whether or not the item's type can be changed while the
	 * item is locked (if set to false, the player must be able to unlock the item to change its type). Defaults to `true`
	 */
	changeWhenLocked?: boolean;
	/**
	 * A recond containing functions that are run on load, click, draw, exit, validate and publishaction,
	 * with the original archetype function and parameters passed on to them. If undefined, these are ignored.
	 * Note that scripthook functions must be loaded before `Female3DCGExtended.js` in `index.html`.
	 */
	scriptHooks?: {
		load?: (next: () => void) => void,
		click?: (next: () => void) => void,
		draw?: (next: () => void) => void,
		exit?: () => void,
		validate?: ExtendedItemValidateScriptHookCallback<ExtendedItemOption>,
		publishAction?: ExtendedItemPublishActionCallback<ExtendedItemOption>,
	};
	/**
	 * To-be initialized properties independant of the selected item module(s).
	 * Relevant if there are properties that are (near) exclusively managed by {@link TypedItemData.scriptHooks} functions.
	 */
	BaselineProperty: ItemProperties | null;
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

/**
 * A parameter object containing information used to validate and sanitize character appearance update diffs. An
 * appearance update has a source character (the player that sent the update) and a target character (the character
 * being updated). What is allowed in an update varies depending on the status of the target character in relation to
 * the source character (i.e. whether they are the target's lover/owner, or the target themselves, and also whether or
 * not they have been whitelisted by the target).
 */
interface AppearanceUpdateParameters {
	/** The character whose appearance is being updated */
	C: Character;
	/** Whether or not the source player is the same as the target player */
	fromSelf: boolean;
	/**
	 * Whether or not the source player has permissions to use owner-only items (i.e. they are either the target
	 * themselves, or the target's owner)
	 */
	fromOwner: boolean;
	/**
	 * Whether or not the source player has permissions to use lover-only items (i.e. they are the target themselves,
	 * one of the target's lovers, or the target's owner, provided the target's lover rules permit their owner using
	 * lover-only items)
	 */
	fromLover: boolean;
	/** The script permission levels that the source player has with respect to the receiver */
	permissions: ScriptPermissionLevel[];
	/** The member number of the source player */
	sourceMemberNumber: number;
}

/**
 * A wrapper object containing the results of a diff resolution. This includes the final item that the diff resolved to
 * (or null if the diff resulted in no item, for example in the case of item removal), along with a valid flag which
 * indicates whether or not the diff was fully valid or not.
 */
interface ItemDiffResolution {
	/**
	 * The resulting item after resolution of the item diff, or null if the diff resulted in no item being equipped in
	 * the given group
	 */
	item: Item | null;
	/**
	 * Whether or not the diff was fully valid. In most cases, an invalid diff will result in the whole appearance
	 * update being rolled back, but in some cases the change will be accepted, but some properties may be modified to
	 * keep the resulting item valid - in both situations, the valid flag will be returned as false, indicating that a
	 * remedial appearance update should be made by the target player.
	 */
	valid: boolean;
}

/**
 * A wrapper object containing the results of an appearance validation. Contains a sanitized appearance array and a
 * valid flag which indicates whether or not the appearance was fully valid or not.
 */
interface AppearanceValidationWrapper {
	/** The resulting appearance after validation */
	appearance: Item[];
	/**
	 * Whether or not the appearance was valid. A value of false indicates that the appearance has been modified, and a
	 * remedial appearance update should be made by the target player.
	 */
	valid: boolean;
}

/**
 * Callback for custom functions used for setting the `DialogFocusItem.Type` attribute.
 * Relevant for typed items that lack an archetype.
 */
type TypedItemSetTypeCallback = (NewType: string) => void;

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

interface VibratingItemData {
	/** A key uniquely identifying the asset */
	key: string;
	/** The asset reference */
	asset: Asset;
	/** The list of extended item options available for the item */
	options: VibratorModeSet[];
	/** The common prefix used for all extended item screen functions associated with the asset */
	functionPrefix: string;
	/** The common prefix used for all dynamic asset hook functions for the asset */
	dynamicAssetsFunctionPrefix: string;
	/**
	 * A record containing functions that are run on load, click, draw, exit, and validate, with the original archetype function
	 * and parameters passed on to them. If undefined, these are ignored.
	 * Note that scripthook functions must be loaded before `Female3DCGExtended.js` in `index.html`.
	 */
	scriptHooks: {
		load?: (next: () => void) => void;
		click?: (next: () => void) => void;
		draw?: (next: () => void) => void;
		exit?: () => void;
	};
}

/**
 * A wrapper object defining a vibrator state and intensity
 */
interface StateAndIntensity {
	/** The vibrator state */
	State: VibratorModeState;
	/** The vibrator intensity */
	Intensity: VibratorIntensity;
}

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

/**
 * An object containing typed item configuration for an asset. Contains all of the necessary information for the item's
 * load, draw & click handlers.
 */
interface VariableHeightData {
	/** The asset reference */
	asset: Asset;
	/** A key uniquely identifying the asset */
	key: string;
	/** The common prefix used for all extended item functions associated with the asset */
	functionPrefix: string;
	/** The highest Y co-ordinate that can be set  */
	maxHeight: number;
	/** The lowest Y co-ordinate that can be set  */
	minHeight: number;
	/** Settings for the range input element the user can use to change the height */
	slider: VariableHeightSliderConfig;
	/** The initial property to apply */
	defaultProperty: ItemProperties;
	/** A record containing various dialog keys used by the extended item screen */
	dialog: {
		/** The prefix used for dialog keys representing the item's chatroom messages when its type is changed */
		chatPrefix: string | ExtendedItemChatCallback<ExtendedItemOption>;
		/** The prefix used for dialog keys representing an NPC's reactions to item type changes */
		npcPrefix: string | ExtendedItemNPCCallback<ExtendedItemOption>;
	};
	/**
	 * An array of the chat message tags that should be included in the item's
	 * chatroom messages. Defaults to [{@link CommonChatTags.SOURCE_CHAR}, {@link CommonChatTags.DEST_CHAR}]
	 */
	chatTags: CommonChatTags[];
	/** The function that handles finding the current variable height setting */
	getHeight: Function;
	/** The function that handles applying the height setting to the character */
	setHeight: Function;
	/** The list of extended item options the current option was selected from, if applicable */
	parentOptions: ExtendedItemOption[];
}

//#endregion

type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

interface ICommand {
	Tag: string;
	Description?: string;
	Reference?: string;
	Action?: (this: Optional<ICommand, 'Tag'>, args: string, msg: string, parsed: string[]) => void
	Prerequisite?: (this: Optional<ICommand, 'Tag'>) => boolean;
	AutoComplete?: (this: Optional<ICommand, 'Tag'>, parsed: string[], low: string, msg: string) => void;
	Clear?: false;
}

type PokerPlayerType = "None" | "Set" | "Character";
type PokerPlayerFamily = "None" | "Player";

interface PokerPlayer {
	Type: PokerPlayerType;
	Family: PokerPlayerFamily;
	Name: string;
	Chip: number;

	/* Runtime values */
	Difficulty?: number;
	Hand?: any[];
	HandValue?: number;
	Cloth?: Item;
	ClothLower?: Item;
	ClothAccessory?: Item;
	Panties?: Item;
	Bra?: Item;
	Character?: Character;
	Data?: {
		cache: Record<any, any>;
	};
	Image?: void;
	TextColor?: string;
	TextSingle?: string;
	TextMultiple?: string;
	WebLink?: string;
	Alternate?: void;
}

// #region Online Games

/**
 * Online game status values.
 *
 * @property "" - The game is in the setup phase.
 * @property "Running" - The game is currently running.
 *
 * @fix FIXME: "" should really be renamed Setup
 */
type OnlineGameStatus = "" | "Running";

interface GameLARPParameters {
	Status: OnlineGameStatus;
	Class: string;
	Team: string;
	TimerDelay: number;
	Level: {
		Name: string;
		Level: number;
		Progress: number;
	}[];
}

interface GameLARPOption {
	Name: string;
	Odds: number;
}

interface GameMagicBattleParameters {
	Status: OnlineGameStatus;
	House: string;
	TeamType: "FreeForAll" | "House";
}

interface GameGGTSParameters {
	Level: number;
	Time: number;
	Strike: number;
	Rule: string[];
}

// #endregion

// #region Audio

type AudioSoundEffect = [string, number];

interface AudioEffect {
	/** The sound effect name */
	Name: string;

	/** The sound file, or files to choose from randomly */
	File: string | string[];
}

/**
 * Sound effect detector for chat messages.
 */
interface AudioChatAction {
	/** Is that action applicable for that chat message? */
	IsAction: (data: IChatRoomMessage) => boolean;

	/** Extracts the actual sound effect from the chat message */
	GetSoundEffect: (data: IChatRoomMessage, metadata: any) => (AudioSoundEffect | string | null);
}

// #endregion

// #region Character drawing

/**
 * A callback function used for clearing a rectangular area of a canvas
 * @param {number} x - The x coordinate of the left of the rectangle to clear
 * @param {number} y - The y coordinate of the top of the rectangle to clear
 * @param {number} w - The width of the rectangle to clear
 * @param {number} h - The height of the rectangle to clear
 */
type ClearRectCallback = (x: number, y: number, w: number, h: number) => void;

/**
 * A callback function used to draw a canvas on a canvas
 * @param {HTMLImageElement | HTMLCanvasElement} Img - The canvas to draw
 * @param {number} x - The x coordinate to draw the canvas at
 * @param {number} y - The y coordinate to draw the canvas at
 */
type DrawCanvasCallback = (
	img: HTMLImageElement | HTMLCanvasElement,
	x: number,
	y: number,
	alphaMasks?: RectTuple[],
) => void;

/**
 * A callback function used to draw an image to a canvas
 * @param {string} src - The URL of the image to draw
 * @param {number} x - The x coordinate to draw the image at
 * @param {number} y - The y coordinate to draw the image at
 * @param {RectTuple[]} [alphaMasks] - A list of alpha masks to apply to the image when drawing
 * @param {number} [opacity=1] - The opacity at which to draw the image with
 * @param {boolean} [rotate=false] - If the image should be rotated by 180 degrees
 */
type DrawImageCallback = (
	src: string,
	x: number,
	y: number,
	alphasMasks: RectTuple[],
	opacity?: number,
	rotate?: boolean,
) => void;

/**
 * A callback function used to draw a colorized image to a canvas
 * @callback drawImageColorize
 * @param {string} src - The URL of the image to draw
 * @param {number} x - The x coordinate to draw the image at
 * @param {number} y - The y coordinate to draw the image at
 * @param {string} color - The color to apply to the image
 * @param {boolean} fullAlpha - Whether or not to apply color to the entire image
 * @param {RectTuple[]} [alphaMasks] - A list of alpha masks to apply to the image when drawing
 * @param {number} [opacity=1] - The opacity at which to draw the image with
 * @param {boolean} [rotate=false] - If the image should be rotated by 180 degrees
 */
type DrawImageColorizeCallback = (
	src: string,
	x: number,
	y: number,
	color: string,
	fullAlpha: boolean,
	alphaMasks?: RectTuple[],
	opacity?: number,
	rotate?: boolean,
) => void;

interface CommonDrawCallbacks {
	/**
	 * A callback to clear an area of the main character canvas
	 */
	clearRect: ClearRectCallback;
	/**
	 * A callback to clear an area of the blink character canvas
	 */
	clearRectBlink: ClearRectCallback;
	/**
	 * Function used to draw a canvas on top of the normal canvas
	 */
	drawCanvas: DrawCanvasCallback;
	/**
	 * Function used to draw a canvas on top of the blink canvas
	 */
	drawCanvasBlink: DrawCanvasCallback;
	/**
	 * A callback to draw an image to the main character canvas
	 */
	drawImage: DrawImageCallback;
	/**
	 * A callback to draw an image to the blink character canvas
	 */
	drawImageBlink: DrawImageCallback;
	/**
	 * A callback to draw a colorized image to the main character canvas
	 */
	drawImageColorize: DrawImageColorizeCallback;
	/**
	 * A callback to draw a colorized image to the blink character canvas
	 */
	drawImageColorizeBlink: DrawImageColorizeCallback;
}

interface DynamicDrawingData {
	C: Character;
	X: number;
	Y: number;
	CA: Item;
	GroupName: AssetGroupName;
	Color: string;
	Opacity: number;
	Property: ItemProperties;
	A: Asset;
	G: string;
	AG: AssetGroup;
	L: string;
	Pose: string;
	LayerType: string;
	BlinkExpression: string;
	drawCanvas: DrawCanvasCallback;
	drawCanvasBlink: DrawCanvasCallback;
	AlphaMasks: RectTuple[];
	PersistentData: <T>() => T;
}

/**
 * Drawing overrides that can be returned by a dynamic BeforeDraw function
 */
interface DynamicBeforeDrawOverrides {
	Property?: ItemProperties;
	CA?: Item;
	GroupName?: AssetGroupName;
	Color?: ItemColor;
	Opacity?: number;
	X?: number;
	Y?: number;
	LayerType?: string;
	L?: string;
	AlphaMasks?: RectTuple[];
}

/**
 * A dynamic BeforeDraw callback
 */
type DynamicBeforeDrawCallback = (data: DynamicDrawingData) => DynamicBeforeDrawOverrides;

/**
 * A dynamic AfterDraw callback
 */
type DynamicAfterDrawCallback = (data: DynamicDrawingData) => void;

/**
 * A dynamic ScriptDraw callback
 */
type DynamicScriptDrawCallback = (data: { C: Character, Item: Item, PersistentData: <T>() => T }) => void;

// #endregion

//#region Infiltration/Pandora

type InfiltrationTargetType = "NPC" | "USBKey" | "BDSMPainting" | "GoldCollar" | "GeneralLedger" | "SilverVibrator" | "DiamondRing" | "SignedPhoto" | "PandoraPadlockKeys";

interface InfiltrationMissionTarget {
	Type: InfiltrationTargetType;
	Found: boolean;
	Fail: boolean;
	Name: string;
	PrivateRoom: boolean;
}

type PandoraDirection = "North" | "South" | "East" | "West";
type PandoraFloorDirection = "StairsUp" | "StairsDown" | PandoraDirection;
type PandoraFloors = "Ground" | "Second" | "Underground";

interface PandoraSpecialRoom {
	Floor: "Exit" | "Search" | "Rest" | "Paint";
}

interface PandoraBaseRoom {
	Floor: PandoraFloors;
	Background: string;
	Character: NPCCharacter[];
	Path: (PandoraBaseRoom | PandoraSpecialRoom)[];
	PathMap: PandoraBaseRoom[];
	Direction: string[];
	DirectionMap: string[];

	/* SearchRoom */
	SearchSquare?: {
		X: number;
		Y: number;
		W: number;
		H: number;
	}[];
	ItemX?: number;
	ItemY?: number;

	/* PaintRoom */
	Graffiti?: number;
}

//#endregion

//#region Crafting items

type CraftingMode = "Slot" | "Item" | "Property" | "Lock" | "Name" | "Color";

/**
 * A struct with an items crafting-related information.
 * @see {@link Item.Craft}
 */
interface CraftingItem {
	/** The name of the crafted item. */
	Name: string;
	/** The name of the crafter. */
	MemberName?: string;
	/** The member ID of the crafter. */
	MemberNumber?: number;
	/** The custom item description. */
	Description: string;
	/** The crafted item propery. */
	Property: CraftingPropertyType;
	/** The comma-separated color(s) of the item. */
	Color: string;
	/** The name of the lock or, if absent, an empty string. */
	Lock: "" | AssetLockType;
	/** The name of the item; see {@link Asset.Name}. */
	Item: string;
	/** Whether the crafted item should be private or not. */
	Private: boolean;
	/**
	 * The type of the crafted item; only relevant for extended items and should be an empty string otherwise.
	 * @see {@link ItemProperties.Type}
	 */
	Type: string | null;
	/** An integer representing the item layering priority; see {@link ItemProperties.OverridePriority} */
	OverridePriority: number | null;
}

/**
 * A currently selected struct with an items crafting-related information.
 * @see {@link Item.Craft}
 */
interface CraftingItemSelected {
	/** The name of the crafted item. */
	Name: string;
	/** The custom item description. */
	Description: string;
	/** The comma-separated color(s) of the item. */
	Color: string;
	/** The name of the crafted item. */
	Asset: Asset | null;
	/** The crafted item propery. */
	Property: CraftingPropertyType;
	/** The lock as equiped on the item or, if absent, `null`. */
	Lock: Asset | null;
	/** Whether the crafted item should be private or not. */
	Private: boolean;
	/**
	 * The type of the crafted item; only relevant for extended items and should be an empty string otherwise.
	 * Note that `null` values, which are legal for Typed extended items, *must* be converted to empty strings.
	 * @see {@link ItemProperties.Type}
	 */
	Type: string;
	/** An integer representing the item layering priority; see {@link ItemProperties.OverridePriority} */
	OverridePriority: number | null;
}

/**
 * A struct with tools for validating {@link CraftingItem} properties.
 * @property {function} Validate - The validation function
 * @property {function} GetDefault - A function that creates default values for when the validation fails
 * @property {CraftingStatusType} - The {@link CraftingStatusType} code for when the validation fails
 */
interface CratingValidationStruct {
	Validate: (Craft: CraftingItem, Asset: Asset | null) => boolean;
	GetDefault: (Craft: CraftingItem, Asset: Asset | null) => any;
	StatusCode: CraftingStatusType;
}

//#endregion

//#region Color

/** An object defining a group of layers which can be colored together */
interface ColorGroup {
	/** The name of the color group */
	name: string;
	/** The layers contained within the color group */
	layers: AssetLayer[];
	/** The color index for the color group - this is the lowest color index of any of the layers within the color group */
	colorIndex: number;
}

/**
 * A callback function that is called when the item color UI exits
 * @param c - The character being colored
 * @param item - The item being colored
 * @param save - Whether the item's appearance changes should be saved
 */
type itemColorExitListener = (
	c: Character,
	item: Item,
	save: boolean,
) => void;

interface ItemColorStateType {
	colorGroups: ColorGroup[];
	colors: string[];
	simpleMode: boolean;
	paginationButtonX: number;
	cancelButtonX: number;
	saveButtonX: number;
	colorPickerButtonX: number;
	colorDisplayButtonX: number;
	contentY: number;
	groupButtonWidth: number;
	pageSize: number;
	pageCount: number;
	colorInputWidth: number;
	colorInputX: number;
	colorInputY: number;
	exportButtonX: number;
	importButtonX: number;
	resetButtonX: number;
	drawImport: () => Promise<string>;
	drawExport: (data: string) => Promise<void>;
}

//#end region

// #region property

// NOTE: Use the intersection operator to enforce that the it remains a `keyof ItemProperties` subtype
/** Property keys of {@link ItemProperties} with text input fields */
type PropertyTextNames = keyof ItemProperties & (
	"Text" | "Text2" | "Text3"
);

/**
 * A callback signature for handling (throttled) text changes.
 * @param {Character} C - The character being modified
 * @param {Item} item - The item being modified
 * @param {PropertyTextNames} PropName - The property wherein the updated text should be stored
 * @param {string} Text - The new text to be assigned to the item
 * @returns {void} Nothing
 */
type PropertyTextEventListener = (
	C: Character,
	Item: Item,
	PropName: PropertyTextNames,
	Text: string,
) => void;

/** A record type with custom event listeners for one or more text input fields. */
type PropertyTextEventListenerRecord = Partial<Record<PropertyTextNames, PropertyTextEventListener>>;

// #end region
