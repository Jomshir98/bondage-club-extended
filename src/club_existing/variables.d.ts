/* eslint-disable no-var */

declare var ServerBeep: {
	Timer?: number;
	Message?: string;
};

declare var CurrentTime: number;

declare function ServerSend(Message: string, Data: any): void;

declare const DrawRunMap: Map<string, () => void>;
declare var DrawScreen: string;

declare const Player: PlayerCharacter;

declare function ChatRoomCurrentTime(): string;

declare function ElementIsScrolledToEnd(ID: string): boolean;
declare function ElementScrollToEnd(ID: string): void;
declare function ElementFocus(ID: string): void;

declare var ServerSocket: import("socket.io-client").Socket;

declare function DrawGetImage(Source: string): HTMLImageElement;
declare var MainCanvas: CanvasRenderingContext2D;

declare function CheatImport(): void;

declare var ChatRoomCharacter: Character[];

declare function ServerPlayerIsInChatRoom(): boolean;
