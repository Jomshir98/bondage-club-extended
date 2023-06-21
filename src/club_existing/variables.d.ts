/* eslint-disable no-var */
/* eslint-disable @typescript-eslint/no-shadow */

// Female3DCG.js
declare var PoseFemale3DCG: Pose[];

// Activity.js
declare var ActivityOrgasmGameResistCount: number;
declare var ActivityOrgasmRuined: boolean;
declare function ActivitySetArousal(C: Character, Progress: number): void;
declare function ActivityOrgasmPrepare(C: Character, Bypass?: boolean): void;

// AfkTimer.js
declare var AfkTimerEventsList: string[];

// Appearance.js
declare var CharacterAppearanceSelection: Character | null;
declare var CharacterAppearanceWardrobeOffset: number;
declare var CharacterAppearanceWardrobeText: string;
declare var CharacterAppearanceMode: string;
// declare var AppearanceMenu: DialogMenuButton[];
declare var AppearanceMenu: BCX_DialogMenuButton[];
declare const CanvasUpperOverflow: number;
declare const CanvasLowerOverflow: number;
declare const CanvasDrawHeight: number;
declare function CharacterAppearanceStripLayer(C: Character): void;
declare function CharacterAppearanceYOffset(C: Character, HeightRatio: number, IgnoreUpButton?: boolean): number;
declare function AppearanceMenuBuild(C: Character): void;
declare function CharacterAppearanceSetItem(C: Character, Group: AssetGroupName, ItemAsset: Asset | null, NewColor?: string | string[], DifficultyFactor?: number, ItemMemberNumber?: number, Refresh?: boolean): null | Item;
declare function CharacterAppearanceStringify(C: Character): string;
declare function CharacterAppearanceRestore(C: Character, backup: string): void;
/** NMod ONLY! */
declare var AppearanceMode: string;

// Backgrounds.js
// declare const BackgroundsTagList: BackgroundTag[];
declare const BackgroundsTagList: BCX_BackgroundTag[];
// declare const BackgroundsList: { Name: string; Tag: BackgroundTag[]; }[];
declare const BackgroundsList: { Name: string; Tag: BCX_BackgroundTag[]; }[];
// declare function BackgroundsGenerateList(BackgroundTagList: readonly BackgroundTag[]): string[];
declare function BackgroundsGenerateList(BackgroundTagList: readonly BCX_BackgroundTag[]): string[];

// BackgroundSelection.js
declare var BackgroundSelectionTagList: BackgroundTag[];
declare var BackgroundSelectionOffset: number;
declare var BackgroundSelectionPreviousScreen: string;
declare var BackgroundSelectionAll: { Name: string; Description: string; Low: string; }[];
declare var BackgroundSelectionView: { Name: string; Description: string; Low: string; }[];
declare function BackgroundSelectionMake(List: string[], Idx: number, Callback: (selection: string) => void): void;

// Timer.js
declare var CurrentTime: number;

// Common.js
declare var Player: PlayerCharacter;
declare var CurrentModule: ModuleType;
declare var KeyPress: number | string;
declare var CurrentScreen: string;
declare var CurrentScreenFunctions: ScreenFunctions;
declare var CurrentCharacter: Character | NPCCharacter | null;
declare function CommonSetScreen(NewModule: ModuleType, NewScreen: string): void;
declare function CommonTime(): number;
declare function CommonConvertStringToArray(s: string): number[];
declare function CommonColorsEqual(C1: string | readonly string[], C2: string | readonly string[]): boolean;
declare function CommonArraysEqual(a1: readonly any[], a2: readonly any[], ignoreOrder?: boolean): boolean;
declare const CommonGetFont: MemoizedFunction<(size: number) => string>;
declare const CommonGetFontName: MemoizedFunction<() => string>;

// FriendList.js
declare var FriendListBeepLog: IFriendListBeepLogMessage[];
declare let FriendListBeepTarget: number | null;

// Character.js
declare function CharacterDeleteAllOnline(): void;
declare function CharacterLoadCanvas(C: Character): void;
declare function CharacterSetCurrent(C: Character): void;
declare function CharacterRefresh(C: Character, Push?: boolean, RefreshDialog?: boolean): void;
declare function CharacterSetActivePose(C: Character, NewPose: null | AssetPoseName, ForceChange?: boolean): void;
declare function CharacterSetFacialExpression(C: Character, AssetGroup: AssetGroupBodyName | "Eyes1", Expression: ExpressionName, Timer?: number, Color?: string | string[]): void;
declare function CharacterGetCurrent(): Character | null;
declare function CharacterAppearsInverted(C: Character): boolean;
declare function CharacterNickname(C: Character): string;

// Crafting.js
declare const CraftingStatusType: {
	OK: 2;
	ERROR: 1;
	CRITICAL_ERROR: 0;
};
declare function CraftingValidate(Craft: CraftingItem, Asset?: Asset | null, Warn?: boolean): CraftingStatusType;

// Element.js
declare function ElementValue(ID: string, Value?: string): string;
declare function ElementContent(ID: string, Content?: string): string;
declare function ElementCreateInput(ID: string, Type: string, Value: string, MaxLength?: string | number): HTMLInputElement;
declare function ElementRemove(ID: string): void;
declare function ElementPosition(ElementID: string, X: number, Y: number, W: number, H?: number): void;
declare function ElementPositionFix(ElementID: string, Font: number, X: number, Y: number, W: number, H: number): void;
declare function ElementScrollToEnd(ID: string): void;
declare function ElementIsScrolledToEnd(ID: string): boolean;
declare function ElementFocus(ID: string): void;
declare function ElementToggleGeneratedElements(Screen: string, ShouldDisplay: boolean): void;

// Dialog.js
declare var DialogTextDefault: string;
declare var DialogInventory: DialogInventoryItem[];
declare var DialogFocusItem: Item | null;
// declare var DialogMenuButton: DialogMenuButton[];
declare var DialogMenuButton: BCX_DialogMenuButton[];
declare var DialogMenuMode: DialogMenuMode;
declare var DialogFacialExpressions: ExpressionItem[];
declare var DialogFacialExpressionsSelected: number;
declare var DialogFacialExpressionsSelectedBlindnessLevel: number;
declare var DialogLentLockpicks: boolean;
declare var DialogSelfMenuOptions: readonly DialogSelfMenuOptionType[];
declare function DialogPrerequisite(D: number): boolean;
declare function DialogIntro(): string;
declare function DialogLeave(): void;
declare function DialogMenuButtonBuild(C: Character): void;
declare function DialogInventoryBuild(C: Character, resetOffset?: number, locks?: boolean): void;
declare function DialogFindPlayer(KeyWord: string): string;

// Drawing.js
declare let MainCanvas: CanvasRenderingContext2D;
declare let CharacterCanvas: CanvasRenderingContext2D;
declare var DrawHoverElements: (() => void)[];
declare function DrawGetImage(Source: string): HTMLImageElement;
declare function DrawCharacter(C: Character, X: number, Y: number, Zoom: number, IsHeightResizeAllowed?: boolean, DrawCanvas?: CanvasRenderingContext2D): void;
declare function DrawTextWrap(Text: string, X: number, Y: number, Width: number, Height: number, ForeColor: string, BackColor?: string, MaxLine?: number, LineSpacing?: number): void;
declare function DrawTextFit(Text: string, X: number, Y: number, Width: number, Color: string, BackColor?: string): void;
declare function DrawText(Text: string, X: number, Y: number, Color: string, BackColor?: string): void;
declare function DrawButton(Left: number, Top: number, Width: number, Height: number, Label: string, Color: string, Image?: string, HoveringText?: string, Disabled?: boolean): void;
declare function DrawCheckbox(Left: number, Top: number, Width: number, Height: number, Text: string, IsChecked: boolean, Disabled?: boolean, TextColor?: string, CheckImage?: string): void;
declare function DrawBackNextButton(Left: number, Top: number, Width: number, Height: number, Label: string, Color: string, Image?: string, BackText?: () => string, NextText?: () => string, Disabled?: boolean, ArrowWidth?: number): void;
declare function DrawButtonHover(Left: number, Top: number, Width: number, Height: number, HoveringText: string): void;
declare function DrawEmptyRect(Left: number, Top: number, Width: number, Height: number, Color: string, Thickness?: number): void;
declare function DrawRect(Left: number, Top: number, Width: number, Height: number, Color: string): void;

// Cheat.js
declare function CheatImport(): void;

// Chatroom.js
declare let ChatRoomData: null | ChatRoom;
declare var ChatRoomCharacter: Character[];
declare var ChatRoomLastMessage: string[];
declare var ChatRoomLastMessageIndex: number;
declare var ChatRoomTargetMemberNumber: number | null;
declare var ChatRoomPlayerCanJoin: boolean;
declare var ChatRoomGame: ChatRoomGame;
declare var ChatRoomSlowtimer: number;
declare var ChatRoomCharacterCount: number;
declare var ChatRoomCharacterDrawlist: Character[];
declare var ChatRoomSenseDepBypass: boolean;
declare var ChatRoomLeashPlayer: number | null;
declare var ChatRoomHideIconState: number;
declare var ChatRoomMenuButtons: string[];
declare function ChatRoomPlayerIsAdmin(): boolean;
declare function ChatRoomClearAllElements(): void;
// declare function ChatRoomStart(Space: ChatRoomSpaceType, Game: ChatRoomGame, LeaveRoom: null | string, LeaveSpace: null | ModuleType, Background: string, BackgroundTagList: BackgroundTag[]): void;
declare function ChatRoomStart(Space: ChatRoomSpaceType, Game: ChatRoomGame, LeaveRoom: null | string, LeaveSpace: null | ModuleType, Background: string, BackgroundTagList: BCX_BackgroundTag[]): void;
declare function ChatRoomSetLastChatRoom(room: string): void;
declare function ChatRoomCharacterUpdate(C: Character): void;
declare var ChatRoomMessageExtractors: ChatRoomMessageExtractor[];
declare function ChatRoomMessageDefaultMetadataExtractor(data: IChatRoomMessage, SenderCharacter: Character): {
	metadata: IChatRoomMessageMetadata;
	substitutions: CommonSubtituteSubstitution[];
};
declare function ChatRoomMessage(data: IChatRoomMessage): void;
declare function ChatRoomCurrentTime(): string;
declare function ChatRoomListUpdate(list: number[], adding: boolean, memberNumber: number): void;
declare function ChatRoomShouldBlockGaggedOOCMessage(Message: string, WhisperTarget: Character | undefined): boolean;

// ChatAdmin.js
declare var ChatAdminBackgroundIndex: number;
declare var ChatAdminBackgroundSelect: string;
declare var ChatAdminPrivate: boolean;
declare var ChatAdminLocked: boolean;
declare var ChatAdminGame: ChatRoomGame;
declare var ChatAdminBlockCategory: ChatRoomBlockCategory[];
declare var ChatAdminLanguage: ChatRoomLanguage;

// ChatCreate.js
declare var ChatCreateBackgroundList: null | string[];
declare var ChatCreateShowBackgroundMode: boolean;

// ChatBlockItem.js
declare var ChatBlockItemCategory: ChatRoomBlockCategory[];
declare var ChatBlockItemEditable: boolean;
declare var ChatBlockItemReturnData: { Screen?: string; };

// ChatSelect.js
declare function ChatSelectGendersAllowed(space: string, genders: string[]): boolean;

// Server.js
declare var ServerSocket: SocketIO.Socket;
declare var ServerURL: string;
declare var ServerBeep: {
	Message: string;
	Timer: number;
	ChatRoomName?: string | null;
	IsMail?: boolean;
};
declare var ServerIsConnected: boolean;
declare var ServerCharacterNicknameRegex: RegExp;
declare function ServerInit(): void;
declare var ServerAccountUpdate: {
	SyncToServer(): void;
	QueueData(Data: object, Force?: true): void;
};
declare function ServerPlayerIsInChatRoom(): boolean;
declare function ServerSend(Message: string, Data: any): void;
declare function ServerPlayerInventorySync(): void;
declare function ServerPlayerBlockItemsSync(): void;
declare function ServerAppearanceBundle(Appearance: readonly Item[]): AppearanceBundle;
declare function ServerAccountBeep(data: object): void;
declare function ServerChatRoomGetAllowItem(Source: Character, Target: Character): boolean;

// Asset.js
declare var Asset: Asset[];
declare var AssetGroup: AssetGroup[];
declare function AssetLoadDescription(Family: IAssetFamily): void;
declare function AssetGet(Family: IAssetFamily, Group: AssetGroupName, Name: string): Asset | null;
declare function AssetGroupGet(Family: IAssetFamily, Group: AssetGroupName): AssetGroup | null;

// Wardrobe.js
declare function WardrobeAssetBundle(A: Item): ItemBundle; // 190
declare function WardrobeFastLoad(C: Character, W: number, Update?: boolean): void; // 207
/** NMod ONLY! */
declare function WardrobeExtractBundle(B: any[]): {
	Name: string;
	Group: string;
	Color?: string | string[];
	Property?: any;
};

// Inventory.js
declare function InventoryAdd(C: Character, NewItemName: string, NewItemGroup: AssetGroupName, Push?: boolean): void;
declare function InventoryDelete(C: Character, DelItemName: string, DelItemGroup: AssetGroupName, Push?: boolean): void;
declare function InventoryGet(C: Character, AssetGroup: AssetGroupName): Item | null;
declare function InventoryRemove(C: Character, AssetGroup: AssetGroupName, Refresh?: boolean): void;
declare function InventoryItemHasEffect(Item: Item, Effect?: EffectName, CheckProperties?: boolean): boolean;
declare function InventoryGetLock(Item: Item): Item | null;
declare function InventoryIsPermissionBlocked(C: Character, AssetName: string, AssetGroup: AssetGroupName, AssetType?: string): boolean;

// Game.js
declare var GameVersion: string;
declare function GameKeyDown(event: KeyboardEvent): void;

// GameLog.js
declare function LogAdd<T extends keyof LogNameType>(NewLogName: LogNameType[T], NewLogGroup: T, NewLogValue?: number, Push?: boolean): void;
declare function LogDelete<T extends keyof LogNameType>(DelLogName: LogNameType[T], DelLogGroup: T, Push?: boolean): void;
declare function LogQuery<T extends keyof LogNameType>(QueryLogName: LogNameType[T], QueryLogGroup: T): boolean;
declare function LogValue<T extends keyof LogNameType>(QueryLogName: LogNameType[T], QueryLogGroup: T): number | null;

// GLDraw.js
declare var GLVersion: "webgl2" | "webgl" | "No WebGL";

// Mouse.js
declare var MouseX: number;
declare var MouseY: number;
declare function MouseIn(Left: number, Top: number, Width: number, Height: number): boolean;
declare function MouseXIn(Left: number, Width: number): boolean;
declare function MouseYIn(Top: number, Height: number): boolean;

// Preference.js
declare var PreferenceDifficultyLevel: null | number;
declare var PreferenceDifficultyAccept: boolean;

// Login.js
declare function LoginMistressItems(): void;
declare function LoginStableItems(): void;

// Validation.js
declare const ValidationModifiableProperties: string[];
declare function ValidationCreateDiffParams(C: Character, sourceMemberNumber: number): AppearanceUpdateParameters;
declare function ValidationCanAddItem(newItem: Item, params: AppearanceUpdateParameters): boolean;
declare function ValidationIsItemBlockedOrLimited(C: Character, sourceMemberNumber: number, groupName: AssetGroupName, assetName: string, type?: string | null): boolean;
declare function ValidationCanRemoveItem(previousItem: Item, params: AppearanceUpdateParameters, isSwap: boolean): boolean;

// Text.js
declare function TextGet(TextTag: string): string;

// Struggle.js
declare var StruggleLockPickOrder: null | number[];
declare var StruggleProgress: number;

// Screens/Room/KidnapLeague/KidnapLeague.js
declare function KidnapLeagueCanStartOnlineBounty(): boolean;
declare function KidnapLeagueOnlineBountyStart(): void;

// Screens/Character/InformationSheet/InformationSheet.js
declare var InformationSheetSelection: Character | null;

// Screens/Room/MainHall/MainHall.js
declare var MainHallRandomEventOdds: number;

// Screens/Room/MaidQuarters/MaidQuarters.js
declare var MaidQuartersMaid: null | NPCCharacter;
declare var MaidQuartersOnlineDrinkFromOwner: boolean;

// Screens/Character/ItemColor/ItemColor.js
declare let ItemColorCharacter: Character | null | undefined;
declare let ItemColorItem: Item | null | undefined;
declare let ItemColorState: ItemColorStateType | undefined;
declare let ItemColorPickerIndices: number[];
declare const ItemColorOnPickerChange: (color: any) => void;

// ChatSearch.js
declare var ChatSearchResult: {
	Name: string;
	CreatorMemberNumber: number;
	MemberLimit: number;
	MemberCount: number;
	DisplayName: string;
	BlockCategory: ChatRoomBlockCategory[];
	Game: ChatRoomGame;
	Friends: {
		MemberName: string;
		MemberNumber: number;
		Type: string;
	}[];
	Description: string;
	Creator: string;
	Order: number;
}[];
declare var ChatSearchResultOffset: number;
declare var ChatSearchMode: "" | "Filter";
declare function ChatSearchMuffle(Text: string): string;

// Reputation.js
declare function ReputationGet(RepType: string): number;
declare function ReputationCharacterGet(C: Character, RepType: ReputationType): number;

// ChatCreate.js
declare var ChatCreatePrivate: boolean | null;
declare var ChatCreateLocked: boolean | null;
declare var ChatCreateGame: ChatRoomGame;
declare var ChatCreateBackgroundSelect: string;
declare var ChatCreateLanguage: ChatRoomLanguage;

// Cell.js
declare function CellLock(LockTime: number): void;
