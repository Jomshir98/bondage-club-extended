import { isObject } from "../utils";
import { modStorage, modStorageSync } from "./storage";
import { BaseModule } from "./_BaseModule";
import { icon_BCX } from "../resources";
import { hookFunction, patchFunction } from "../patching";
import { DrawImageEx } from "../utilsClub";
import cloneDeep from "lodash-es/cloneDeep";
import { RulesGetRuleState } from "./rules";

const ROOM_TEMPLATES_COUNT = 4;

let onSecondPage = false;
let overwriteMode: number | undefined;

// Second page for the chat room settings screen that is used in both the room creation and room administration variants
function ChatSettingsExtraRun() {
	DrawText("Back", 169, 110, "Black", "Gray");
	DrawButton(124, 147, 90, 90, "", "White", "Icons/West.png");

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
	if (MouseIn(124, 147, 90, 90)) {
		overwriteMode = undefined;
		onSecondPage = !onSecondPage;
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
				BlockCategory: cloneDeep(create ? ChatBlockItemCategory : ChatAdminBlockCategory),
				AutoApply: modStorage.roomTemplates[i]?.AutoApply
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
		patchFunction("ChatCreateRun", {
			'DrawText(TextGet("RoomName"), 535, 110,': 'DrawText(TextGet("RoomName"), 675, 110,'
		});
		patchFunction("ChatCreateRun", {
			'ElementPosition("InputName", 535, 170, 820);': 'ElementPosition("InputName", 610, 170, 680);'
		});
		hookFunction("ChatCreateRun", 0, (args, next) => {
			if (onSecondPage) {
				return ChatSettingsExtraRun();
			}
			next(args);
			if (!ChatCreateShowBackgroundMode) {
				DrawText("More", 169, 110, "Black", "Gray");
				DrawButton(124, 147, 90, 90, "", "White", icon_BCX);
				if (MouseIn(124, 147, 90, 90)) DrawButtonHover(34, 70, 64, 64, `More room setup options`);
			}
		});
		hookFunction("ChatAdminExit", 0, (args, next) => {
			next(args);
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
				ChatBlockItemCategory = template.BlockCategory;
			}
			// needed to auto apply a template correctly again
			BackgroundSelectionPreviousScreen = "";
			ChatBlockItemReturnData = {};
		});
		//#endregion
		hookFunction("ChatCreateClick", 0, (args, next) => {
			if (onSecondPage) {
				return ChatSettingsExtraClick(true, (data) => {
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
		patchFunction("ChatAdminRun", {
			'DrawText(TextGet("RoomName"), 535, 110,': 'DrawText(TextGet("RoomName"), 675, 110,'
		});
		patchFunction("ChatAdminRun", {
			'ElementPosition("InputName", 535, 170, 820);': 'ElementPosition("InputName", 610, 170, 680);'
		});
		hookFunction("ChatAdminRun", 0, (args, next) => {
			if (onSecondPage) {
				return ChatSettingsExtraRun();
			}
			next(args);
			DrawText("More", 169, 110, "Black", "Gray");
			DrawButton(124, 147, 90, 90, "", "White", icon_BCX);
			if (MouseIn(124, 147, 90, 90)) DrawButtonHover(34, 70, 64, 64, `More room setup options`);
		});
		//#endregion
		hookFunction("ChatAdminClick", 0, (args, next) => {
			if (onSecondPage) {
				return ChatSettingsExtraClick(false, (data) => {
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
}