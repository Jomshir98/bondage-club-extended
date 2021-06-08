/* eslint-disable no-var */
/* eslint-disable @typescript-eslint/no-shadow */

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

// Character.js
declare function CharacterRefresh(C: Character, Push?: boolean, RefreshDialog?: boolean): void;

// Element.js
declare function ElementIsScrolledToEnd(ID: string): boolean;
declare function ElementScrollToEnd(ID: string): void;
declare function ElementFocus(ID: string): void;

// Dialog.js
declare var DialogTextDefault: string;
declare var DialogFacialExpressions: any[];
declare var DialogFacialExpressionsSelected: number;
declare var DialogSelfMenuOptions: any[];
declare function DialogFindPlayer(KeyWord: string): string;
declare function DialogDrawPoseMenu(): void;
declare function DialogDrawExpressionMenu(): void;

// Drawing.js
declare const DrawRunMap: Map<string, () => void>;
declare var DrawScreen: string;
declare var MainCanvas: CanvasRenderingContext2D;
declare function DrawGetImage(Source: string): HTMLImageElement;
declare function DrawButton(Left: number, Top: number, Width: number, Height: number, Label: string, Color: string, Image?: string, HoveringText?: string, Disabled?: boolean): void;
declare function DrawText(Text: string, X: number, Y: number, Color: string, BackColor?: string): void;

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
declare function ServerPlayerIsInChatRoom(): boolean;
declare function ServerSend(Message: string, Data: any): void;
declare function ServerAppearanceBundle(Appearance: Item[]): AppearanceBundle;
declare function ServerPlayerInventorySync(): void;
declare function ServerAccountBeep(data: any): void;

// Asset.js
declare var Asset: Asset[];
declare var AssetGroup: AssetGroup[];
declare function AssetLoadDescription(Family: string): void;

// Wardrobe.js
declare function WardrobeAssetBundle(A: Item): ItemBundle;

// Inventory.js
declare function InventoryGet(C: Character, AssetGroup: string): Item;
declare function InventoryRemove(C: Character, AssetGroup: string, Refresh?: boolean): void;

// Mouse.js
declare function MouseIn(Left: number, Top: number, Width: number, Height: number): boolean;

// Login.js
declare function LoginMistressItems(): void;
declare function LoginStableItems(): void;
