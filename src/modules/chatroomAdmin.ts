import { isObject } from "../utils";
import { modStorage, modStorageSync } from "./storage";
import { BaseModule } from "./_BaseModule";
import { icon_BCX } from "../resources";
import { hookFunction, patchFunction } from "../patching";
import { DrawImageEx } from "../utilsClub";

const ROOM_TEMPLATES_COUNT = 4;

let onSecondPage = false;

// Second page for the chat room settings screen that is used in both the room creation and room administration variants
function ChatSettingsExtraRun() {
	DrawText("Back", 169, 110, "Black", "Gray");
	DrawButton(124, 147, 90, 90, "", "White", "Icons/West.png");

	DrawText("Templates for storing / overwriting the current room information and settings", 1000, 650, "Black", "Gray");

	for (let i = 0; i < ROOM_TEMPLATES_COUNT; i++) {
		const X = 124 + i * 455;
		const template = modStorage.roomTemplates?.[i];

		MainCanvas.beginPath();
		MainCanvas.rect(X, 700, 340, 64);
		MainCanvas.stroke();
		DrawTextFit(template ? (template.Name === "" ? "- template without room name -" : template.Name) : "- empty template slot -", X + 170, 700 + 34, 325, "Black", "");
		DrawButton(X + 340, 700, 60, 64, "X", template ? "White" : "#ddd", "", "Delete template", !template);
		DrawButton(X, 780, 230, 64, "    Load", template ? "White" : "#ddd", "", undefined, !template);
		DrawImageEx("Icons/Export.png", X + 6, 780 + 6, { Width: 56, Height: 56 });
		DrawButton(X + 250, 780, 150, 64, "    Save", "White", "");
		DrawImageEx("Icons/Save.png", X + 250 + 6, 780 + 12, { Width: 40, Height: 40 });
	}
}
// Click events for the second page of the chat room settings screen with a callback to transport data to the two patched click event functions
function ChatSettingsExtraClick(create: boolean, apply: (data: RoomTemplate) => void) {
	if (MouseIn(124, 147, 90, 90)) {
		onSecondPage = !onSecondPage;
		return;
	}
	for (let i = 0; i < ROOM_TEMPLATES_COUNT; i++) {
		const X = 124 + i * 455;

		if (MouseIn(X + 340, 700, 60, 64) && modStorage.roomTemplates) {
			modStorage.roomTemplates[i] = null;
			modStorageSync();
			return;
		}
		if (MouseIn(X, 780, 230, 64)) {
			const template = modStorage.roomTemplates?.[i];
			if (template) {
				apply(template);
				onSecondPage = !onSecondPage;
			}
			return;
		}
		if (MouseIn(X + 250, 780, 150, 64) && modStorage.roomTemplates) {
			modStorage.roomTemplates[i] = {
				Name: ElementValue("InputName") ? ElementValue("InputName")!.trim() : "",
				Description: ElementValue("InputDescription") ? ElementValue("InputDescription")!.trim() : "",
				Background: create ? ChatCreateBackgroundSelect : ChatAdminBackgroundSelect,
				Private: create ? (ChatCreatePrivate ? ChatCreatePrivate : false) : ChatAdminPrivate,
				Locked: create ? (ChatCreateLocked ? ChatCreateLocked : false) : ChatAdminLocked,
				Game: create ? ChatCreateGame : ChatAdminGame,
				Admin: ElementValue("InputAdminList") ? CommonConvertStringToArray(ElementValue("InputAdminList")!.trim()) : [],
				Limit: ElementValue("InputSize") ? ElementValue("InputSize")!.trim() : "",
				BlockCategory: create ? ChatBlockItemCategory : ChatAdminBlockCategory
			};
			modStorageSync();
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
				console.warn(`BCX: Resetting invalid room teplate slot ${i}`, modStorage.roomTemplates[i]);
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
			DrawText("More", 169, 110, "Black", "Gray");
			DrawButton(124, 147, 90, 90, "", "White", icon_BCX);
			if (MouseIn(124, 147, 90, 90)) DrawButtonHover(34, 70, 64, 64, `More room setup options`);
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
			// cick event for second page button
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
			// cick event for second page button
			if (MouseIn(124, 147, 90, 90)) {
				onSecondPage = !onSecondPage;
				ElementToggleGeneratedElements("ChatAdmin", false);
				return;
			}
			next(args);
		});
	}
}