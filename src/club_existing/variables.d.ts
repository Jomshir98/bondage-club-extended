/* eslint-disable no-var */
/* eslint-disable @typescript-eslint/no-shadow */

// Activity.js
declare var ActivityOrgasmRuined: boolean;

// Appearance.js
declare var CharacterAppearanceSelection: Character | null;
declare var CharacterAppearanceMode: string;
declare var CharacterAppearanceWardrobeText: string;
/** NMod ONLY! */
declare var AppearanceMode: string;

declare function CharacterAppearanceSetItem(C: Character, Group: string, ItemAsset: Asset | null, NewColor?: string | string[], DifficultyFactor?: number, ItemMemberNumber?: number, Refresh?: boolean): void;

// BackgroundSelection.js
declare var BackgroundSelectionAll: { Name: string; Description: string; Low: string; }[];

// Timer.js
declare var CurrentTime: number;

// Common.js
declare const Player: PlayerCharacter;
declare var CurrentScreen: string;
declare var KeyPress: number | string;
declare var CurrentScreenFunctions: ScreenFunctions;
declare const CommonGetFont: MemoizedFunction<(size: number) => string>;

// Character.js
declare function CharacterRefresh(C: Character, Push?: boolean, RefreshDialog?: boolean): void;

// Element.js
declare function ElementIsScrolledToEnd(ID: string): boolean;
declare function ElementScrollToEnd(ID: string): void;
declare function ElementFocus(ID: string): void;
declare function ElementCreateInput(ID: string, Type: string, Value: string, MaxLength: string): HTMLInputElement;
declare function ElementPosition(ElementID: string, X: number, Y: number, W: number, H?: number): void;
declare function ElementRemove(ID: string): void;

// Dialog.js
declare var DialogTextDefault: string;
declare var DialogFacialExpressions: any[];
declare var DialogFacialExpressionsSelected: number;
declare var DialogSelfMenuOptions: any[];
declare function DialogFindPlayer(KeyWord: string): string;
declare function DialogDrawPoseMenu(): void;
declare function DialogDrawExpressionMenu(): void;

// Drawing.js
/** @deprecated */
declare const DrawRunMap: Map<string, () => void>;
/** @deprecated */
declare var DrawScreen: string;
declare var MainCanvas: CanvasRenderingContext2D;
declare function DrawGetImage(Source: string): HTMLImageElement;
declare function DrawButton(Left: number, Top: number, Width: number, Height: number, Label: string, Color: string, Image?: string, HoveringText?: string, Disabled?: boolean): void;
declare function DrawCheckbox(Left: number, Top: number, Width: number, Height: number, Text: string, IsChecked: boolean, Disabled?: boolean, TextColor?: string, CheckImage?: string): void;
declare function DrawText(Text: string, X: number, Y: number, Color: string, BackColor?: string): void;
declare function DrawTextFit(Text: string, X: number, Y: number, Width: number, Color: string, BackColor?: string): void;
declare function DrawTextWrap(Text: string, X: number, Y: number, Width: number, Height: number, ForeColor: string, BackColor?: string, MaxLine?: number): void;
declare function DrawBackNextButton(Left: number, Top: number, Width: number, Height: number, Label: string, Color: string, Image?: string, BackText?: () => string, NextText?: () => string, Disabled?: boolean, ArrowWidth?: number): void;
declare function DrawButtonHover(Left: number, Top: number, Width: number, Height: number, HoveringText: string): void;
declare function DrawEmptyRect(Left: number, Top: number, Width: number, Height: number, Color: string, Thickness?: number): void;
declare function DrawRect(Left: number, Top: number, Width: number, Height: number, Color: string): void;

// Cheat.js
declare function CheatImport(): void;

// Chatroom.js
declare var ChatRoomCharacter: Character[];
declare var ChatRoomTargetMemberNumber: number | null;
declare function ChatRoomCurrentTime(): string;
declare function ChatRoomCharacterUpdate(C: Character): void;
declare function ChatRoomMessage(data: any): void;

// Server.js
declare var ServerBeep: {
	Timer?: number;
	Message?: string;
};
declare var ServerSocket: import("socket.io-client").Socket;
declare var ServerIsConnected: boolean;
declare var ServerAccountUpdate: any;
declare function ServerPlayerIsInChatRoom(): boolean;
declare function ServerSend(Message: string, Data: any): void;
declare function ServerAppearanceBundle(Appearance: Item[]): AppearanceBundle;
declare function ServerPlayerInventorySync(): void;
declare function ServerAccountBeep(data: any): void;
declare function ServerChatRoomGetAllowItem(Source: Character, Target: Character): boolean;

// Asset.js
declare var Asset: Asset[];
declare var AssetGroup: AssetGroup[];
declare function AssetLoadDescription(Family: string): void;
declare function AssetGet(Family: string, Group: string, Name: string): Asset | null;

// Wardrobe.js
declare function WardrobeAssetBundle(A: Item): ItemBundle;

// Inventory.js
declare function InventoryGet(C: Character, AssetGroup: string): Item | null;
declare function InventoryRemove(C: Character, AssetGroup: string, Refresh?: boolean): void;

// Mouse.js
declare function MouseIn(Left: number, Top: number, Width: number, Height: number): boolean;

// Login.js
declare function LoginMistressItems(): void;
declare function LoginStableItems(): void;

// Validation.js
declare const ValidationModifiableProperties: string[];

// Screens/Character/InformationSheet/InformationSheet.js
declare var InformationSheetSelection: Character | null;
