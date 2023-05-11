export type cursedChange = "remove" | "add" | "swap" | "update" | "color";

export const CURSES_TRIGGER_TEXTS: Record<cursedChange | "autoremove", string> = {
	remove: "PLAYER_NAME's body seems to be cursed and the ASSET_NAME just falls off her body.",
	add: "The curse on PLAYER_NAME's ASSET_NAME wakes up and the item reappears.",
	swap: "The curse on PLAYER_NAME's ASSET_NAME wakes up, not allowing the item to be replaced by another item.",
	update: "The curse on PLAYER_NAME's ASSET_NAME wakes up and undoes all changes to the item.",
	color: "The curse on PLAYER_NAME's ASSET_NAME wakes up, changing the color of the item back.",
	autoremove: "The curse on PLAYER_NAME's body becomes dormant and the ASSET_NAME falls off her body.",
};

export const CURSES_TRIGGER_TEXTS_BATCH: Record<cursedChange | "autoremove", string> = {
	remove: "PLAYER_NAME's body seems to be cursed and several items just fall off her body.",
	add: "The curses on PLAYER_NAME's body wake up and several items reappear.",
	swap: "The curses on PLAYER_NAME's body wake up, not allowing several items to be replaced.",
	update: "The curses on PLAYER_NAME's body wake up and undoes all changes to several items.",
	color: "The curses on PLAYER_NAME's body wake up, changing the color of several items back.",
	autoremove: "The curses on PLAYER_NAME's body become dormant and several items fall off her body.",
};

export const CURSES_TRIGGER_LOGS: Record<cursedChange, string> = {
	remove: "The curse on PLAYER_NAME's body prevented a ASSET_NAME from being added to it",
	add: "The curse on PLAYER_NAME's ASSET_NAME made the item reappear",
	swap: "The curse on PLAYER_NAME's ASSET_NAME prevented the item from being replaced",
	update: "The curse on PLAYER_NAME's ASSET_NAME reverted all changes to the item",
	color: "The curse on PLAYER_NAME's ASSET_NAME reverted the color of the item",
};

export const CURSES_TRIGGER_LOGS_BATCH: Record<cursedChange, string> = {
	remove: "The curses on PLAYER_NAME's body prevented several items from being added to it",
	add: "The curses on PLAYER_NAME's body made several items reappear",
	swap: "The curses on PLAYER_NAME's body prevented several items from being replaced",
	update: "The curses on PLAYER_NAME's body reverted all changes to several items",
	color: "The curses on PLAYER_NAME's body reverted the color of several items",
};
