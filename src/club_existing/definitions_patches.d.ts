type NotificationSetting = any;
type ExtendedArchetype = any;
type ModularItemChatSetting = any;
type CommonChatTags = any;
type TypedItemChatSetting = any;

declare enum DialogSortOrder {
	Enabled = 1,
	Equipped = 2,
	FavoriteUsable = 3,
	Usable = 4,
	FavoriteUnusable = 5,
	Unusable = 6,
	Blocked = 7
}

/**
 * A HSV color value
 */
type HSVColor = { H: number, S: number, V: number };
