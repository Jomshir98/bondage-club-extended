import { clipboardAvailable, isObject } from "../utils";
import { modStorage, modStorageSync } from "./storage";
import { BaseModule } from "./_BaseModule";
import { icon_BCX } from "../resources";
import { hookFunction, patchFunction } from "../patching";
import { ChatRoomSendLocal, DrawImageEx } from "../utilsClub";
import cloneDeep from "lodash-es/cloneDeep";
import { RulesGetRuleState } from "./rules";
import { InfoBeep } from "../utilsClub";
import { BCX_setTimeout } from "../BCXContext";

enum ThemeRoomType {
	Afk = 0,
	Rp = 1,
	Chill = 2,
	Kidnap = 3,
	Tie = 4,
	Market = 5,
	Game = 6,
	Other = 99,
}

enum ThemeRoomSetting {
	Adventure = 0,
	Fantasy = 1,
	Historic = 2,
	Modern = 3,
	Romantic = 4,
	School = 5,
	SciFi = 6,
}

const TR_TYPE_NAMES: Record<ThemeRoomType, string> = {
	[ThemeRoomType.Afk]: "AFK/Storage",
	[ThemeRoomType.Rp]: "Roleplaying",
	[ThemeRoomType.Chill]: "Chill/Chat",
	[ThemeRoomType.Kidnap]: "Kidnap/Danger",
	[ThemeRoomType.Tie]: "Tying all up",
	[ThemeRoomType.Market]: "Market/Auction",
	[ThemeRoomType.Game]: "Game",
	[ThemeRoomType.Other]: "Undefined",
};

interface ThemeRoom {
	Type: ThemeRoomType;
	Setting: ThemeRoomSetting | undefined;
	Limits: Set<string>;
	BlockCategories: ChatRoomBlockCategory[];
	Background: string;
	IntroText: string;
}

function stringifyLimits(room: ThemeRoom): string {
	return Array.from(room.Limits.values())
		.sort((a, b) => THEME_ROOM_LIMITS.indexOf(a) - THEME_ROOM_LIMITS.indexOf(b))
		.join(", ");
}

const THEME_ROOM_LIMITS = [
	"no-anal",
	"no-animals",
	"no-fantasy",
	"no-limits",
	"no-males",
	"no-sexual",
	"no-tentacles",
];

// for 2nd page / room template feature
const ROOM_TEMPLATES_COUNT = 4;

let overwriteMode: number | undefined;
let onSecondPage: boolean = false;
let onRoomCreateScreen: boolean = false;

//#region theme rooms
const MAX_DESCRIPTION_CHARS = 80; // it is 100, but font is getting way too small
const MAX_SPACES_AND_BRACKETS = 8;
const MAX_TR_TYPE_LENGTH = Math.max(...(Object.values(TR_TYPE_NAMES).map(el => el.length)));
const MAX_TR_SETTING_LENGTH = Math.max(...(Object.keys(ThemeRoomSetting).map(el => el.length)));
const MAX_SPACE_FOR_TR_LIMITS = MAX_DESCRIPTION_CHARS - MAX_SPACES_AND_BRACKETS - MAX_TR_TYPE_LENGTH - MAX_TR_SETTING_LENGTH;

const GREET_DELAY = 600_000;
const nextGreet: Map<number, number> = new Map();

const currentThemeRoom: ThemeRoom = {
	Type: ThemeRoomType.Other,
	Setting: undefined,
	Limits: new Set(),
	BlockCategories: [],
	Background: "",
	IntroText: "",
};

let onThemeRoomSubpage: boolean = false;
let roomGreeting: string = "";
let greetingActiveNotificationGiven: boolean = false;
let input = document.getElementById(`INTRO_TEXT`) as HTMLTextAreaElement | undefined;

function serializeThemeRoom(value: ThemeRoom): string {
	return JSON.stringify({
		...value,
		Limits: Array.from(value.Limits),
	});
}

function parseThemeRoom(value: string): void {
	let parsed: Record<keyof ThemeRoom, unknown>;
	if (value.length < 1) {
		InfoBeep(`BCX: Import error: No data`, 5_000);
		return;
	}
	try {
		parsed = JSON.parse(value) as Record<keyof ThemeRoom, unknown>;
		if (!isObject(parsed)) {
			InfoBeep(`BCX: Import error: Bad data`, 5_000);
			return;
		}
	} catch (error) {
		console.warn(error);
		InfoBeep(`BCX: Import error: Bad data`, 5_000);
		return;
	}
	currentThemeRoom.Type = typeof parsed.Type === "number" && ThemeRoomType[parsed.Type] !== undefined ? parsed.Type : ThemeRoomType.Other;
	currentThemeRoom.Setting = typeof parsed.Setting === "number" && ThemeRoomSetting[parsed.Setting] !== undefined ? parsed.Setting : undefined;
	currentThemeRoom.Limits = new Set(Array.isArray(parsed.Limits) ? parsed.Limits.filter(i => THEME_ROOM_LIMITS.includes(i)) : []);
	currentThemeRoom.BlockCategories = Array.isArray(parsed.BlockCategories) ? parsed.BlockCategories.filter(i => typeof i === "string") : [];
	currentThemeRoom.Background = typeof parsed.Background === "string" ? parsed.Background : "";
	currentThemeRoom.IntroText = typeof parsed.IntroText === "string" ? parsed.IntroText : "";
}

function ThemeRoomLoad(): void {
	document.addEventListener("paste", PasteListener);

	// start cooldown for the room greeting when someone leaves
	hookFunction("ChatRoomSyncMemberLeave", 5, (args, next) => {
		next(args);
		const R = args[0] as Record<string, number>;
		if (nextGreet.has(R.SourceMemberNumber)) {
			nextGreet.set(R.SourceMemberNumber, Date.now() + GREET_DELAY);
		}
	});

	// greet a newly joining character when they did not see the room greeting for a while
	hookFunction("ChatRoomAddCharacterToChatRoom", 6, (args, next) => {
		const size = ChatRoomCharacter.length;
		next(args);
		if (roomGreeting === "" || !ChatRoomPlayerIsAdmin()) {
			return;
		}
		if (size < ChatRoomCharacter.length) {
			const C = args[0] as Character;
			if (C.MemberNumber !== undefined &&
				nextGreet.has(C.MemberNumber) &&
				nextGreet.get(C.MemberNumber)! < Date.now()
			) {
				nextGreet.delete(C.MemberNumber);
			}
			BCX_setTimeout(() => {
				if (!ChatRoomCharacter.includes(C) ||
					C.MemberNumber === undefined ||
					(
						nextGreet.has(C.MemberNumber) &&
						nextGreet.get(C.MemberNumber)! >= Date.now()
					)
				) return;
				nextGreet.set(C.MemberNumber, 0);
				ServerSend("ChatRoomChat", { Content: `*${roomGreeting}`, Type: "Emote", Target: C.MemberNumber });
			}, 5_000);
		}
	});

	// notify player that they have a room greeting set for this room
	hookFunction("ChatRoomSync", 4, (args, next) => {
		next(args);
		if (!greetingActiveNotificationGiven && roomGreeting !== "" && ChatRoomPlayerIsAdmin()) {
			greetingActiveNotificationGiven = true;
			ChatRoomSendLocal("Every person newly joining this room will be greeted with the introduction message you set during theme room creation. " +
				"You and everyone else in the room will not see the greeting. It will also only be sent while you are room admin. " +
				"Leaving this room will cancel sending it.");
		}
	});

	// delete room greeting when player leaves the room
	hookFunction("ChatRoomClearAllElements", 3, (args, next) => {
		greetingActiveNotificationGiven = false;
		roomGreeting = "";
		return next(args);
	});
}

function ChatSettingsExtraExit() {
	if (onThemeRoomSubpage) {
		ChatSettingsThemeRoomExit();
	}
}

// Sub page within the second page for the theme room creation form
function ChatSettingsThemeRoomRun() {
	MainCanvas.textAlign = "left";
	DrawText(`1. Select the room type:`, 120, 100, "Black", "Gray");
	DrawText(`2. Optionally, select one room setting:`, 745, 100, "Black", "Gray");
	DrawText(`3. Optionally, select limits for the room:`, 120, 480, "Black", "Gray");
	DrawText(`4. Optionally, write a room introduction message/greeting that everyone joining will see as emote:`, 120, 700, "Black", "Gray");
	MainCanvas.textAlign = "center";

	DrawImageEx("Backgrounds/" + currentThemeRoom.Background + ".jpg", 1480, 75, { Width: 420, Height: 245 });

	if (clipboardAvailable) {
		DrawButton(1480, 340, 193, 50, "Export", "White", "", "Export everything onscreen");
		DrawButton(1705, 340, 193, 50, "Import", "White", "", "Import everything onscreen");
	}

	// 1. room type
	DrawButton(120, 130, 260, 60, TR_TYPE_NAMES[ThemeRoomType.Afk], currentThemeRoom.Type === ThemeRoomType.Afk ? "#FEC5C5" : "White");
	DrawButton(120, 205, 260, 60, TR_TYPE_NAMES[ThemeRoomType.Chill], currentThemeRoom.Type === ThemeRoomType.Chill ? "#FEC5C5" : "white");
	DrawButton(120, 280, 260, 60, TR_TYPE_NAMES[ThemeRoomType.Tie], currentThemeRoom.Type === ThemeRoomType.Tie ? "#FEC5C5" : "white");
	DrawButton(120, 355, 260, 60, TR_TYPE_NAMES[ThemeRoomType.Game], currentThemeRoom.Type === ThemeRoomType.Game ? "#FEC5C5" : "white");
	DrawButton(395, 130, 260, 60, TR_TYPE_NAMES[ThemeRoomType.Rp], currentThemeRoom.Type === ThemeRoomType.Rp ? "#FEC5C5" : "white");
	DrawButton(395, 205, 260, 60, TR_TYPE_NAMES[ThemeRoomType.Kidnap], currentThemeRoom.Type === ThemeRoomType.Kidnap ? "#FEC5C5" : "white");
	DrawButton(395, 280, 260, 60, TR_TYPE_NAMES[ThemeRoomType.Market], currentThemeRoom.Type === ThemeRoomType.Market ? "#FEC5C5" : "white");
	DrawButton(395, 355, 260, 60, TR_TYPE_NAMES[ThemeRoomType.Other], currentThemeRoom.Type === ThemeRoomType.Other ? "#FEC5C5" : "white");

	// 2. room setting
	DrawButton(735, 130, 200, 60, ThemeRoomSetting[0], currentThemeRoom.Setting === ThemeRoomSetting.Adventure ? "#FEC5C5" : "White");
	DrawButton(735, 205, 200, 60, ThemeRoomSetting[2], currentThemeRoom.Setting === ThemeRoomSetting.Historic ? "#FEC5C5" : "white");
	DrawButton(735, 280, 200, 60, ThemeRoomSetting[4], currentThemeRoom.Setting === ThemeRoomSetting.Romantic ? "#FEC5C5" : "white");
	DrawButton(735, 355, 200, 60, ThemeRoomSetting[6], currentThemeRoom.Setting === ThemeRoomSetting.SciFi ? "#FEC5C5" : "white");
	DrawButton(950, 130, 200, 60, ThemeRoomSetting[1], currentThemeRoom.Setting === ThemeRoomSetting.Fantasy ? "#FEC5C5" : "white");
	DrawButton(950, 205, 200, 60, ThemeRoomSetting[3], currentThemeRoom.Setting === ThemeRoomSetting.Modern ? "#FEC5C5" : "white");
	DrawButton(950, 280, 200, 60, ThemeRoomSetting[5], currentThemeRoom.Setting === ThemeRoomSetting.School ? "#FEC5C5" : "white");

	// 3. limits
	for (const a of THEME_ROOM_LIMITS) {
		DrawButton(120 + THEME_ROOM_LIMITS.indexOf(a) * 245, 510, 230, 54, a, currentThemeRoom.Limits.has(a) ? "#FEC5C5" : "white");
	}
	// DrawButton(120, 580, 230, 54, "Placeholder", "white");

	// block some items
	MainCanvas.textAlign = "left";
	DrawText(`Blocked items:`, 910, 465, "Black", "Gray");
	DrawCheckbox(1170, 465 - 32, 60, 60, "ABDL", currentThemeRoom.BlockCategories.includes("ABDL"));
	DrawCheckbox(1400, 465 - 32, 60, 60, "Fantasy", currentThemeRoom.BlockCategories.includes("Fantasy"));
	DrawCheckbox(1660, 465 - 32, 60, 60, "SciFi", currentThemeRoom.BlockCategories.includes("SciFi"));
	MainCanvas.textAlign = "center";

	// 4. intro text
	if (!input) {
		input = document.createElement("textarea");
		input.id = `INTRO_TEXT`;
		input.name = `INTRO_TEXT`;
		input.value = currentThemeRoom.IntroText;
		input.maxLength = 990;
		input.setAttribute("screen-generated", CurrentScreen);
		input.className = "HideOnPopup";
		input.oninput = () => {
			if (!input)
				return;
			currentThemeRoom.IntroText = input.value;
		};
		document.body.appendChild(input);
	} else {
		input.value = currentThemeRoom.IntroText;
	}
	if (input && document.activeElement === input) {
		ElementPositionFix(`INTRO_TEXT`, 36, 120, 85, 1150, 795);
	} else {
		ElementPositionFix(`INTRO_TEXT`, 28, 120, 732, 1150, 150);
	}

	DrawButton(1450, 830, 180, 64, "OK", "white");
	DrawButton(1670, 830, 200, 64, "Cancel", "white");
}

function PasteListener(ev: ClipboardEvent) {
	if (onThemeRoomSubpage && document.activeElement !== input) {
		ev.preventDefault();
		ev.stopImmediatePropagation();
		const data = ((ev.clipboardData || (window as any).clipboardData) as DataTransfer).getData("text");
		parseThemeRoom(data);
	}
}

// Click events for the sub page within the second page for the theme room creation form
function ChatSettingsThemeRoomClick() {

	if (MouseIn(1480, 75, 420, 245)) {
		ElementToggleGeneratedElements("ChatCreate", false);
		BackgroundSelectionMake(ChatCreateBackgroundList!,
			ChatCreateBackgroundList!.indexOf(onRoomCreateScreen ? ChatCreateBackgroundSelect : ChatAdminBackgroundSelect), Name => {
				currentThemeRoom.Background = Name;
			}
		);
	}
	if (clipboardAvailable) {
		// Export button
		if (MouseIn(1480, 340, 193, 50)) {
			BCX_setTimeout(async () => {
				await navigator.clipboard.writeText(serializeThemeRoom(currentThemeRoom));
				InfoBeep(`BCX: Copied to clipboard!`, 5_000);
			}, 0);
		}
		// Import button
		if (MouseIn(1705, 340, 193, 50)) {
			BCX_setTimeout(async () => {
				if (typeof navigator.clipboard.readText !== "function") {
					InfoBeep(`BCX: Please press Ctrl+V`, 5_000);
					return;
				}
				const data = await navigator.clipboard.readText();
				console.info(data);
				parseThemeRoom(data);
			}, 0);
		}
	}

	// 1. room type
	if (MouseIn(120, 130, 260, 60)) {
		currentThemeRoom.Type = ThemeRoomType.Afk;
	}
	if (MouseIn(120, 205, 260, 60)) {
		currentThemeRoom.Type = ThemeRoomType.Chill;
	}
	if (MouseIn(120, 280, 260, 60)) {
		currentThemeRoom.Type = ThemeRoomType.Tie;
	}
	if (MouseIn(120, 355, 260, 60)) {
		currentThemeRoom.Type = ThemeRoomType.Game;
	}
	if (MouseIn(395, 130, 260, 60)) {
		currentThemeRoom.Type = ThemeRoomType.Rp;
	}
	if (MouseIn(395, 205, 260, 60)) {
		currentThemeRoom.Type = ThemeRoomType.Kidnap;
	}
	if (MouseIn(395, 280, 260, 60)) {
		currentThemeRoom.Type = ThemeRoomType.Market;
	}
	if (MouseIn(395, 355, 260, 60)) {
		currentThemeRoom.Type = ThemeRoomType.Other;
	}

	// 2. room setting
	if (MouseIn(735, 130, 200, 60)) {
		ToggleThemeRoomSetting(ThemeRoomSetting.Adventure);
	}
	if (MouseIn(735, 205, 200, 60)) {
		ToggleThemeRoomSetting(ThemeRoomSetting.Historic);
	}
	if (MouseIn(735, 280, 200, 60)) {
		ToggleThemeRoomSetting(ThemeRoomSetting.Romantic);
	}
	if (MouseIn(735, 355, 200, 60)) {
		ToggleThemeRoomSetting(ThemeRoomSetting.SciFi);
	}
	if (MouseIn(950, 130, 200, 60)) {
		ToggleThemeRoomSetting(ThemeRoomSetting.Fantasy);
	}
	if (MouseIn(950, 205, 200, 60)) {
		ToggleThemeRoomSetting(ThemeRoomSetting.Modern);
	}
	if (MouseIn(950, 280, 200, 60)) {
		ToggleThemeRoomSetting(ThemeRoomSetting.School);
	}

	// 3. limits
	for (const a of THEME_ROOM_LIMITS) {
		if (MouseIn(120 + THEME_ROOM_LIMITS.indexOf(a) * 245, 510, 230, 54)) {
			if (currentThemeRoom.Limits.has(a)) {
				// remove element if it is already selected
				currentThemeRoom.Limits.delete(a);
			} else {
				// add element otherwise
				currentThemeRoom.Limits.add(a);
				if (stringifyLimits(currentThemeRoom).length + 2 > MAX_SPACE_FOR_TR_LIMITS) {
					currentThemeRoom.Limits.delete(a);
					InfoBeep(`BCX: No more space to add this limit.`, 5_000);
				}
			}
		}
	}

	// block some items
	if (MouseIn(1170, 465 - 32, 60, 60)) {
		if (currentThemeRoom.BlockCategories.includes("ABDL")) {
			currentThemeRoom.BlockCategories.splice(currentThemeRoom.BlockCategories.indexOf("ABDL"), 1);
		} else {
			currentThemeRoom.BlockCategories.push("ABDL");
		}
	}
	if (MouseIn(1400, 465 - 32, 60, 60)) {
		if (currentThemeRoom.BlockCategories.includes("Fantasy")) {
			currentThemeRoom.BlockCategories.splice(currentThemeRoom.BlockCategories.indexOf("Fantasy"), 1);
		} else {
			currentThemeRoom.BlockCategories.push("Fantasy");
		}
	}
	if (MouseIn(1660, 465 - 32, 60, 60)) {
		if (currentThemeRoom.BlockCategories.includes("SciFi")) {
			currentThemeRoom.BlockCategories.splice(currentThemeRoom.BlockCategories.indexOf("SciFi"), 1);
		} else {
			currentThemeRoom.BlockCategories.push("SciFi");
		}
	}

	// OK button
	if (MouseIn(1450, 830, 180, 64)) {
		const inputDescription = document.getElementById("InputDescription") as HTMLInputElement | undefined;

		if (onRoomCreateScreen) {
			ChatBlockItemCategory = currentThemeRoom.BlockCategories;
			ChatCreateBackgroundSelect = currentThemeRoom.Background;
		} else {
			ChatAdminBlockCategory = currentThemeRoom.BlockCategories;
			ChatAdminBackgroundSelect = currentThemeRoom.Background;
		}
		if (inputDescription) inputDescription.value = `[${TR_TYPE_NAMES[currentThemeRoom.Type]}]` +
			`${currentThemeRoom.Setting ? " [" + ThemeRoomSetting[currentThemeRoom.Setting] + "]" : ""}` +
			`${currentThemeRoom.Limits.size === 0 ? "" : " [" + stringifyLimits(currentThemeRoom) + "]"}`;

		roomGreeting = currentThemeRoom.IntroText;
		onSecondPage = !onSecondPage;
		ChatSettingsThemeRoomExit();
		return;
	}

	if (MouseIn(1670, 830, 200, 64)) {
		ChatSettingsThemeRoomExit();
		return;
	}
}

function ToggleThemeRoomSetting(newSetting: ThemeRoomSetting) {
	if (currentThemeRoom.Setting !== newSetting) {
		currentThemeRoom.Setting = newSetting;
	} else {
		currentThemeRoom.Setting = undefined;
	}
}

function ChatSettingsThemeRoomLoad() {
	if (onRoomCreateScreen) {
		currentThemeRoom.Background = ChatCreateBackgroundSelect;
		currentThemeRoom.BlockCategories = ChatBlockItemCategory.slice();
	} else {
		currentThemeRoom.Background = ChatAdminBackgroundSelect;
		currentThemeRoom.BlockCategories = ChatAdminBlockCategory.slice();
	}
}

function ChatSettingsThemeRoomExit() {
	onThemeRoomSubpage = false;
	if (input) {
		input.remove();
		input = undefined;
	}
}
//#endregion

// Second page for the chat room settings screen that is used in both the room creation and room administration variants
function ChatSettingsExtraRun() {
	if (onThemeRoomSubpage) {
		return ChatSettingsThemeRoomRun();
	}
	DrawText("Back", 169, 110, "Black", "Gray");
	DrawButton(124, 147, 90, 90, "", "White", "Icons/West.png");

	DrawText("Standardize your room description so the room's purpose is clear and it can easily be filtered:", 1000, 300, "Black", "Gray");
	DrawButton(800, 360, 380, 80, "Create a theme room", "white");

	DrawText("Templates for storing / overwriting current room information & settings (press a name to toggle auto-apply)", 1000, 650, "Black", "Gray");

	for (let i = 0; i < ROOM_TEMPLATES_COUNT; i++) {
		const X = 124 + i * 455;
		const template = modStorage.roomTemplates?.[i];
		let templateName: string = template ? (template.Name === "" ? "- template without room name -" : template.Name) : "- empty template slot -";
		const tick = Date.now() % 6_000;
		if (template?.AutoApply && tick < 3_000) {
			templateName = "- auto-applied default -";
		}

		if (template) DrawImageEx("Backgrounds/" + template.Background + ".jpg", X, 700, { Alpha: MouseIn(X, 700, 400, 200) ? 0.3 : 1, Width: 400, Height: 200 });
		DrawButton(X, 700, 340, 64, "", template ? template.AutoApply ? "rgba(136 , 136 , 204, 0.5)" : "rgba(255, 255, 255, 0.5)" : "#ddd", "", !template ? undefined : "Use as room creation dialog default", !template);
		DrawTextFit(templateName, X + 170, 700 + 34, 325, "Black", "Gray");
		DrawButton(X + 340, 700, 60, 64, "X", template ? "rgba(255, 255, 255, 0.3)" : "#ddd", "", !template ? undefined : "Delete template", !template);
		if (overwriteMode === i) {
			DrawButton(X, 835, 150, 64, "", template ? "rgba(255, 255, 255, 0.2)" : "#ddd", "", undefined, !template);
			DrawText("Load", X + 51, 835 + 32, "Black");
			DrawButton(X + 170, 835, 230, 64, "Overwrite ?", "rgba(255, 242, 0, 0.2)", "");
		} else {
			DrawButton(X, 835, 230, 64, "", template ? "rgba(255, 255, 255, 0.2)" : "#ddd", "", undefined, !template);
			DrawText("Load", X + 51, 835 + 32, "Black");
			DrawButton(X + 250, 835, 150, 64, "    Save", "rgba(255, 255, 255, 0.2)", "");
		}
	}
}
// Click events for the second page of the chat room settings screen with a callback to transport data to the two patched click event functions
function ChatSettingsExtraClick(create: boolean, apply: (data: RoomTemplate) => void) {
	if (onThemeRoomSubpage) {
		return ChatSettingsThemeRoomClick();
	}
	if (MouseIn(124, 147, 90, 90)) {
		overwriteMode = undefined;
		onSecondPage = !onSecondPage;
		return;
	}
	if (MouseIn(800, 360, 380, 80)) {
		overwriteMode = undefined;
		onThemeRoomSubpage = !onThemeRoomSubpage;
		ChatSettingsThemeRoomLoad();
		return;
	}
	if (!modStorage.roomTemplates) {
		return;
	}
	for (let i = 0; i < ROOM_TEMPLATES_COUNT; i++) {
		const X = 124 + i * 455;
		const template = modStorage.roomTemplates[i];

		if (MouseIn(X, 700, 340, 64) && template) {
			if (template.AutoApply) {
				delete template.AutoApply;
			} else {
				for (const t of modStorage.roomTemplates) {
					if (t) {
						delete t.AutoApply;
					}
				}
				template.AutoApply = true;
			}
			modStorageSync();
			overwriteMode = undefined;
			return;
		}
		if (MouseIn(X + 340, 700, 60, 64)) {
			modStorage.roomTemplates[i] = null;
			modStorageSync();
			overwriteMode = undefined;
			return;
		}
		if ((overwriteMode === i && MouseIn(X, 835, 150, 64)) || MouseIn(X, 835, 230, 64)) {
			if (template) {
				const rule = RulesGetRuleState("alt_room_admin_limit");
				if (rule.isEnforced && ServerPlayerIsInChatRoom() && ChatRoomPlayerIsAdmin() && Player.IsRestrained()) {
					rule.triggerAttempt();
					return;
				}
				apply(template);
				overwriteMode = undefined;
				onSecondPage = !onSecondPage;
			}
			return;
		}
		if (((MouseIn(X + 250, 835, 150, 64) && !modStorage.roomTemplates[i]) || (overwriteMode === i && MouseIn(X + 170, 835, 230, 64)))) {
			modStorage.roomTemplates[i] = {
				Name: ElementValue("InputName") ? ElementValue("InputName")!.trim() : "",
				Description: ElementValue("InputDescription") ? ElementValue("InputDescription")!.trim() : "",
				Background: create ? ChatCreateBackgroundSelect : ChatAdminBackgroundSelect,
				Private: create ? (ChatCreatePrivate ? ChatCreatePrivate : false) : ChatAdminPrivate,
				Locked: create ? (ChatCreateLocked ? ChatCreateLocked : false) : ChatAdminLocked,
				Game: create ? ChatCreateGame : ChatAdminGame,
				Admin: ElementValue("InputAdminList") ? CommonConvertStringToArray(ElementValue("InputAdminList")!.trim()) : [],
				Limit: ElementValue("InputSize") ? ElementValue("InputSize")!.trim() : "",
				Language: create ? ChatCreateLanguage : ChatAdminLanguage,
				BlockCategory: cloneDeep(create ? ChatBlockItemCategory : ChatAdminBlockCategory),
				AutoApply: modStorage.roomTemplates[i]?.AutoApply,
			};
			modStorageSync();
			overwriteMode = undefined;
			return;
		} else if (MouseIn(X + 250, 835, 150, 64)) {
			overwriteMode = i;
			return;
		}
	}
}

export class ModuleChatroomAdmin extends BaseModule {
	load() {
		ThemeRoomLoad();

		if (!Array.isArray(modStorage.roomTemplates)) {
			modStorage.roomTemplates = [];
		}
		if (modStorage.roomTemplates.length > ROOM_TEMPLATES_COUNT) {
			modStorage.roomTemplates = modStorage.roomTemplates.filter(Boolean).slice(0, ROOM_TEMPLATES_COUNT - 1);
		}
		while (modStorage.roomTemplates.length < ROOM_TEMPLATES_COUNT) {
			modStorage.roomTemplates.push(null);
		}
		for (let i = 0; i < modStorage.roomTemplates.length; i++) {
			if (modStorage.roomTemplates[i] !== null && !isObject(modStorage.roomTemplates[i])) {
				console.warn(`BCX: Resetting invalid room template slot ${i}`, modStorage.roomTemplates[i]);
				modStorage.roomTemplates[i] = null;
			}
		}

		//#region Second page button (on room create screen)
		hookFunction("ChatCreateExit", 0, (args, next) => {
			next(args);
			ChatSettingsExtraExit();
		});
		if (GameVersion === "R79") {
			patchFunction("ChatCreateRun", {
				'DrawText(TextGet("RoomName"), 535, 110,': 'DrawText(TextGet("RoomName"), 675, 110,',
			});
			patchFunction("ChatCreateRun", {
				'ElementPosition("InputName", 535, 170, 820);': 'ElementPosition("InputName", 610, 170, 680);',
			});
		} else {
			patchFunction("ChatCreateRun", {
				'DrawText(TextGet("RoomName"), 250, 120,': 'DrawText(TextGet("RoomName"), 370, 120,',
			});
			patchFunction("ChatCreateRun", {
				'ElementPosition("InputName", 815, 115, 820);': 'ElementPosition("InputName", 865, 115, 720);',
			});
			patchFunction("ChatCreateRun", {
				'DrawText(TextGet("RoomLanguage"), 250, 205,': 'DrawText(TextGet("RoomLanguage"), 390, 205,',
			});
			patchFunction("ChatCreateRun", {
				"DrawButton(405, 172,": "DrawButton(505, 172,",
			});
			patchFunction("ChatCreateRun", {
				'DrawText(TextGet("RoomSize"), 850, 205,': 'DrawText(TextGet("RoomSize"), 950, 205,',
			});
			patchFunction("ChatCreateRun", {
				'ElementPosition("InputSize", 1099, 200, 250);': 'ElementPosition("InputSize", 1149, 200, 150);',
			});
			patchFunction("ChatCreateClick", {
				"if (MouseIn(405, 172,": "if (MouseIn(505, 172,",
			});
		}
		hookFunction("ChatCreateRun", 0, (args, next) => {
			onRoomCreateScreen = true;
			if (onSecondPage) {
				return ChatSettingsExtraRun();
			}
			next(args);
			if (!ChatCreateShowBackgroundMode) {
				DrawText("More", 169, 110, "Black", "Gray");
				DrawButton(124, 147, 90, 90, "", "White", icon_BCX);
				if (MouseIn(124, 147, 90, 90)) DrawButtonHover(-36, 70, 64, 64, `More options [BCX]`);
			}
		});
		hookFunction("ChatAdminExit", 0, (args, next) => {
			next(args);
			ChatSettingsExtraExit();
			// needed to auto apply a template correctly again
			ChatBlockItemReturnData = {};
		});
		hookFunction("ChatCreateLoad", 0, (args, next) => {
			next(args);
			const template = modStorage.roomTemplates?.find(t => t?.AutoApply);
			if (template &&
				BackgroundSelectionPreviousScreen !== CurrentScreen &&
				Object.keys(ChatBlockItemReturnData).length === 0
			) {
				const inputName = document.getElementById("InputName") as HTMLInputElement | undefined;
				const inputDescription = document.getElementById("InputDescription") as HTMLInputElement | undefined;
				const inputAdminList = document.getElementById("InputAdminList") as HTMLTextAreaElement | undefined;
				const inputSize = document.getElementById("InputSize") as HTMLInputElement | undefined;

				if (inputName) inputName.value = template.Name;
				if (inputDescription) inputDescription.value = template.Description;
				ChatCreateBackgroundSelect = template.Background;
				ChatCreatePrivate = template.Private;
				ChatCreateLocked = template.Locked;
				ChatCreateGame = template.Game;
				if (inputAdminList) inputAdminList.value = template.Admin.toString();
				if (inputSize) inputSize.value = template.Limit;
				if (template.Language) ChatCreateLanguage = template.Language;
				ChatBlockItemCategory = template.BlockCategory;
			}
			// needed to auto apply a template correctly again
			BackgroundSelectionPreviousScreen = "";
			ChatBlockItemReturnData = {};
		});
		//#endregion
		hookFunction("ChatCreateClick", 0, (args, next) => {
			if (onSecondPage) {
				return ChatSettingsExtraClick(onRoomCreateScreen, (data) => {
					const inputName = document.getElementById("InputName") as HTMLInputElement | undefined;
					const inputDescription = document.getElementById("InputDescription") as HTMLInputElement | undefined;
					const inputAdminList = document.getElementById("InputAdminList") as HTMLTextAreaElement | undefined;
					const inputSize = document.getElementById("InputSize") as HTMLInputElement | undefined;

					if (inputName) inputName.value = data.Name;
					if (inputDescription) inputDescription.value = data.Description;
					ChatCreateBackgroundSelect = data.Background;
					ChatCreatePrivate = data.Private;
					ChatCreateLocked = data.Locked;
					ChatCreateGame = data.Game;
					if (inputAdminList) inputAdminList.value = data.Admin.toString();
					if (inputSize) inputSize.value = data.Limit;
					if (data.Language) ChatCreateLanguage = data.Language;
					ChatBlockItemCategory = data.BlockCategory;
				});
			}
			// click event for second page button
			if (MouseIn(124, 147, 90, 90)) {
				onSecondPage = !onSecondPage;
				ElementToggleGeneratedElements("ChatCreate", false);
				return;
			}
			next(args);
		});
		//#region Second page button (on room admin screen)
		if (GameVersion === "R79") {
			patchFunction("ChatAdminRun", {
				'DrawText(TextGet("RoomName"), 535, 110,': 'DrawText(TextGet("RoomName"), 675, 110,',
			});
			patchFunction("ChatAdminRun", {
				'ElementPosition("InputName", 535, 170, 820);': 'ElementPosition("InputName", 610, 170, 680);',
			});
		} else {
			patchFunction("ChatAdminRun", {
				'DrawText(TextGet("RoomName"), 250, 120,': 'DrawText(TextGet("RoomName"), 370, 120,',
			});
			patchFunction("ChatAdminRun", {
				'ElementPosition("InputName", 815, 115, 820);': 'ElementPosition("InputName", 865, 115, 720);',
			});
			patchFunction("ChatAdminRun", {
				'DrawText(TextGet("RoomLanguage"), 250, 205,': 'DrawText(TextGet("RoomLanguage"), 390, 205,',
			});
			patchFunction("ChatAdminRun", {
				"DrawButton(405, 172,": "DrawButton(505, 172,",
			});
			patchFunction("ChatAdminRun", {
				'DrawText(TextGet("RoomSize"), 850, 205,': 'DrawText(TextGet("RoomSize"), 950, 205,',
			});
			patchFunction("ChatAdminRun", {
				'ElementPosition("InputSize", 1099, 200, 250);': 'ElementPosition("InputSize", 1149, 200, 150);',
			});
			patchFunction("ChatAdminClick", {
				"if (MouseIn(405, 172,": "if (MouseIn(505, 172,",
			});
		}
		hookFunction("ChatAdminRun", 0, (args, next) => {
			onRoomCreateScreen = false;
			if (onSecondPage) {
				return ChatSettingsExtraRun();
			}
			next(args);
			DrawText("More", 169, 110, "Black", "Gray");
			DrawButton(124, 147, 90, 90, "", "White", icon_BCX);
			if (MouseIn(124, 147, 90, 90)) DrawButtonHover(-36, 70, 64, 64, `More options [BCX]`);
		});
		//#endregion
		hookFunction("ChatAdminClick", 0, (args, next) => {
			if (onSecondPage) {
				return ChatSettingsExtraClick(onRoomCreateScreen, (data) => {
					const inputName = document.getElementById("InputName") as HTMLInputElement | undefined;
					const inputDescription = document.getElementById("InputDescription") as HTMLInputElement | undefined;
					const inputAdminList = document.getElementById("InputAdminList") as HTMLTextAreaElement | undefined;
					const inputSize = document.getElementById("InputSize") as HTMLInputElement | undefined;

					if (inputName) inputName.value = data.Name;
					if (inputDescription) inputDescription.value = data.Description;
					ChatAdminBackgroundSelect = data.Background;
					ChatAdminPrivate = data.Private;
					ChatAdminLocked = data.Locked;
					ChatAdminGame = data.Game;
					if (inputAdminList) inputAdminList.value = data.Admin.toString();
					if (inputSize) inputSize.value = data.Limit;
					if (data.Language) ChatAdminLanguage = data.Language;
					ChatAdminBlockCategory = data.BlockCategory;
				});
			}
			// click event for second page button
			if (MouseIn(124, 147, 90, 90)) {
				onSecondPage = !onSecondPage;
				ElementToggleGeneratedElements("ChatAdmin", false);
				return;
			}
			next(args);
		});
	}

	unload() {
		document.removeEventListener("paste", PasteListener);
		if (input) {
			input.remove();
			input = undefined;
		}
	}
}
