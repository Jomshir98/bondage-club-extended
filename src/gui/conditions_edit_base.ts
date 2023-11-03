import { ChatroomCharacter, getAllCharactersInRoom } from "../characters";
import { setSubscreen } from "../modules/gui";
import { GuiSubscreen } from "./subscreen";
import { DrawImageEx, getCharacterName, drawIcon } from "../utilsClub";
import { AccessLevel } from "../modules/authority";
import { ConditionsLimit } from "../constants";
import { capitalizeFirstLetter, formatTimeInterval } from "../utils";
import { GuiMemberSelect } from "./member_select";
import { ConditionsEvaluateRequirements } from "../modules/conditions";
import { icon_star } from "../resources";
import { DrawQueryErrorMessage } from "../modules/messaging";

import cloneDeep from "lodash-es/cloneDeep";

export abstract class GuiConditionEdit<CAT extends ConditionsCategories> extends GuiSubscreen {

	readonly character: ChatroomCharacter;
	readonly conditionCategory: CAT;
	readonly conditionName: ConditionsCategoryKeys[CAT];
	readonly back: GuiSubscreen;

	protected conditionCategoryData: ConditionsCategoryPublicData<CAT> | null = null;
	protected conditionData: ConditionsConditionPublicData<CAT> | null = null;

	protected failed: boolean = false;

	protected changes: ConditionsConditionPublicData<CAT> | null = null;

	protected showHelp: boolean = false;

	constructor(character: ChatroomCharacter,
		conditionCategory: CAT,
		conditionName: ConditionsCategoryKeys[CAT],
		back: GuiSubscreen
	) {
		super();
		this.character = character;
		this.conditionCategory = conditionCategory;
		this.conditionName = conditionName;
		this.back = back;
	}

	protected makeChangesData(): ConditionsConditionPublicData<CAT> {
		if (!this.conditionData) {
			throw new Error("Data required");
		}
		return this.changes ?? cloneDeep(this.conditionData);
	}

	Load() {
		this.requestData();
	}

	onChange(sender: number) {
		if (sender === this.character.MemberNumber) {
			this.requestData();
		}
	}

	private requestData() {
		this.character.conditionsGetByCategory(this.conditionCategory).then(res => {
			if (!this.active)
				return;
			const condition: ConditionsConditionPublicData<CAT> | undefined = res.conditions[this.conditionName];
			if (condition) {
				this.conditionCategoryData = res;
				this.conditionData = condition;
				if (!this.checkAccess()) {
					this.changes = null;
				}
				this.failed = false;
				this.onDataChange();
			} else {
				console.warn(`BCX: Condition ${this.conditionCategory}:${this.conditionName} not found in list from ${this.character}`);
				this.conditionCategoryData = null;
				this.conditionData = null;
				this.failed = true;
				this.onDataChange();
				this.Exit();
			}
		}, err => {
			console.error(`BCX: Failed to get condition info for ${this.conditionCategory}:${this.conditionName} from ${this.character}`, err);
			this.failed = true;
		});
	}

	protected setUseGlobal(useGlobal: boolean) {
		if (!this.changes || !this.conditionData || !this.conditionCategoryData)
			return;
		this.changes.requirements = useGlobal ? null : cloneDeep(this.conditionData.requirements ?? this.conditionCategoryData.requirements);
	}

	protected onDataChange() {

		let inputRoomName = document.getElementById("BCX_ConditionRoomName") as HTMLInputElement | undefined;
		let inputMemberNumber = document.getElementById("BCX_ConditionMemberNumber") as HTMLInputElement | undefined;

		if (!this.conditionCategoryData || !this.conditionData) {
			if (inputRoomName) {
				inputRoomName.remove();
			}
			if (inputMemberNumber) {
				inputMemberNumber.remove();
			}
			return;
		}

		const data = this.changes ?? this.conditionData;
		const requirements = data.requirements ?? this.conditionCategoryData.requirements;
		const useGlobalCategorySetting = !data.requirements;
		const access = this.checkAccess();
		const disabled = !access || useGlobalCategorySetting;

		if (!inputRoomName) {
			inputRoomName = ElementCreateInput("BCX_ConditionRoomName", "text", requirements.roomName?.name ?? "", "30");
			inputRoomName.oninput = () => {
				this.changes = this.makeChangesData();
				this.processInputs();
			};
		}
		if (!inputMemberNumber) {
			inputMemberNumber = ElementCreateInput("BCX_ConditionMemberNumber", "text", requirements.player?.memberNumber?.toString() ?? "0", "6");
			inputMemberNumber.inputMode = "numeric";
			inputMemberNumber.pattern = "[0-9]+";
			inputMemberNumber.oninput = () => {
				this.changes = this.makeChangesData();
				this.processInputs();
			};
		}
		inputRoomName.disabled = disabled || !requirements.roomName;
		inputMemberNumber.disabled = disabled || !requirements.player;
		if (!this.changes || disabled || !requirements.roomName) {
			inputRoomName.value = requirements.roomName?.name ?? "";
		}
		if (!this.changes || disabled || !requirements.player) {
			inputMemberNumber.value = requirements.player?.memberNumber?.toString() ?? "0";
		}
	}

	protected processInputs() {
		const inputRoomName = document.getElementById("BCX_ConditionRoomName") as HTMLInputElement | undefined;
		const inputMemberNumber = document.getElementById("BCX_ConditionMemberNumber") as HTMLInputElement | undefined;
		if (this.changes && inputRoomName && inputMemberNumber) {
			if (this.changes.requirements?.roomName) {
				this.changes.requirements.roomName.name = inputRoomName.value;
			}
			if (this.changes.requirements?.player) {
				const memberNumber = inputMemberNumber.value;
				if (!memberNumber)
					return;
				if (/^[0-9]+$/.test(memberNumber)) {
					this.changes.requirements.player.memberNumber = Number.parseInt(memberNumber, 10);
				} else {
					inputMemberNumber.value = (this.changes.requirements?.player?.memberNumber ?? 0).toString();
				}
			}
		}
	}

	protected checkAccess(): boolean {
		if (!this.conditionCategoryData)
			return false;
		const limit = this.conditionCategoryData.limits[this.conditionName] ?? ConditionsLimit.normal;
		return [this.conditionCategoryData.access_normal, this.conditionCategoryData.access_limited, false][limit];
	}

	protected abstract headerText(): string;

	Run(): boolean {
		MainCanvas.textAlign = "left";
		const addedBy = this.conditionData?.addedBy;
		DrawText(`- ${this.headerText()} -`, 180, 108, "Black", "Gray");
		if (addedBy !== undefined) {
			MainCanvas.save();
			MainCanvas.font = CommonGetFont(26);
			DrawText(`Added by: ${getCharacterName(addedBy, "[unknown name]")} (${addedBy})`, 205, 143, "#444");
			MainCanvas.restore();
		}
		MainCanvas.textAlign = "center";

		if (this.changes) {
			DrawButton(1815, 75, 90, 90, "", "White", "Icons/Accept.png", "Save all changes and go back");
			DrawButton(1815, 190, 90, 90, "", "White", "Icons/Cancel.png", "Go back without saving");
		} else {
			DrawButton(1815, 75, 90, 90, "", "White", "Icons/Exit.png", "Back");
			DrawButton(1815, 190, 90, 90, "", "White", "Icons/Question.png");
		}

		if (this.conditionCategoryData === null || this.conditionData === null) {
			MainCanvas.textAlign = "center";
			if (this.failed) {
				DrawQueryErrorMessage(`get data from ${this.character.Name}`);
			} else {
				DrawText("Loading...", 1000, 480, "Black");
			}
			return true;
		}

		if (this.changes && this.changes.timer !== null) {
			if (this.changes.timer < Date.now()) {
				this.changes.timer = null;
				this.changes.timerRemove = false;
				this.changes.active = !this.changes.active;
			} else if (!this.changes.active) {
				this.changes.timerRemove = false;
			}
		}

		const data = this.changes ?? this.conditionData;
		const requirements = data.requirements ?? this.conditionCategoryData.requirements;
		const useGlobalCategorySetting = !data.requirements;
		const access = this.checkAccess();
		const disabled = !access || useGlobalCategorySetting;

		// favorite toggle
		const color = !access ? "#ddd" : data.favorite ? "Yellow" : "White";
		drawIcon(MainCanvas, icon_star, 105, 91, 60, 60, 24, 1, 1.5, color, access && MouseIn(93, 80, 85, 80) ? "Cyan" : "black");

		// Spacer
		MainCanvas.beginPath();
		MainCanvas.moveTo(98, 272);
		MainCanvas.lineTo(960, 272);
		MainCanvas.strokeStyle = "Gray";
		MainCanvas.stroke();
		MainCanvas.beginPath();
		MainCanvas.moveTo(98, 540);
		MainCanvas.lineTo(960, 540);
		MainCanvas.stroke();

		// on-off toggle
		MainCanvas.textAlign = "left";
		DrawCheckbox(125, 180, 64, 64, `This ${this.conditionCategory.slice(0, -1)} is active and can trigger`, data.active, !access);

		// global-category-configuration-is-active highlighting
		if (useGlobalCategorySetting) {
			MainCanvas.fillStyle = "#0052A3";
			MainCanvas.fillRect(526, 546, 418, 68);
			MainCanvas.fillRect(120, 615, 74, 74);
			MainCanvas.fillRect(120, 695, 74, 74);
			MainCanvas.fillRect(120, 775, 74, 74);
			MainCanvas.fillRect(120, 855, 74, 74);
		}

		////// status and timer area
		MainCanvas.textAlign = "center";
		let statusText: string;
		if (data.timer === null) {
			statusText = "Timer disabled";
		} else {
			statusText = `${data.active ? "Deactivates" : "Activates"} in: ${formatTimeInterval(data.timer - Date.now())}`;
		}
		DrawText(statusText, 530, 311, data.active || !data.timer ? "Black" : "#060");

		if (data.timer === null) {
			DrawButton(120, 360, 820, 160, "Enable timer", "White");
			MainCanvas.textAlign = "left";
		} else {
			DrawButton(120, 360, 85, 60, "-1d", !access ? "#ddd" : "White", "", "Remove 1 day from the timer", !access);
			DrawButton(120 + 125, 360, 85, 60, "-1h", !access ? "#ddd" : "White", "", "Remove 1 hour from the timer", !access);
			DrawButton(120 + 2 * (125), 360, 85, 60, "-5m", !access ? "#ddd" : "White", "", "Remove 5 minutes from the timer", !access);
			DrawButton(120 + 3 * (125), 360, 70, 60, "∞", !access ? "#ddd" : "White", "", "Disable the timer", !access);
			DrawButton(105 + 4 * (125), 360, 85, 60, "+5m", !access ? "#ddd" : "White", "", "Add 5 minutes to the timer", !access);
			DrawButton(105 + 5 * (125), 360, 85, 60, "+1h", !access ? "#ddd" : "White", "", "Add 1 hour to the timer", !access);
			DrawButton(105 + 6 * (125), 360, 85, 60, "+1d", !access ? "#ddd" : "White", "", "Add 1 day to the timer", !access);

			MainCanvas.textAlign = "left";
			if (data.active) {
				DrawCheckbox(125, 450, 64, 64, `Delete the ${this.conditionCategory.slice(0, -1)} when timer runs out`, data.timerRemove, !access);
			}
		}

		////// condition factors area
		DrawText(`${capitalizeFirstLetter(this.conditionCategory.slice(0, -1))} trigger conditions:`, 130, 580, "Black", "");
		MainCanvas.textAlign = "center";
		const hasAnyRequirement = !!(requirements.room || requirements.roomName || requirements.role || requirements.player);
		DrawButton(530, 550, 410, 60, hasAnyRequirement ? (requirements.orLogic ? "Any selected below" : "All selected below") : "Always in effect", disabled || !hasAnyRequirement ? "#ddd" : "White", "", "", disabled || !hasAnyRequirement);
		MainCanvas.textAlign = "left";

		MainCanvas.fillStyle = ConditionsEvaluateRequirements(requirements, this.conditionCategoryData.highestRoleInRoom) ? "#00FF22" : "#AA0000";
		MainCanvas.fillRect(80, 620, 15, 304);

		// In room
		DrawCheckbox(125, 620, 64, 64, "when", !!requirements.room, disabled);
		MainCanvas.textAlign = "center";
		DrawButton(324, 622, 115, 60, requirements.room?.inverted ? "not in" : "in", disabled || !requirements.room ? "#ddd" : "White", "", "", disabled || !requirements.room);
		DrawButton(324 + 115 + 14, 622, 130, 60, requirements.room?.type === "private" ? "private" : "public", disabled || !requirements.room ? "#ddd" : "White", "", "", disabled || !requirements.room);
		MainCanvas.textAlign = "left";
		DrawText(`room`, 324 + 115 + 14 + 130 + 14, 620 + 32, "Black", "Gray");
		if (requirements.room) {
			const inChatroom = ServerPlayerIsInChatRoom();
			const chatroomPrivate = inChatroom && ChatRoomData && ChatRoomData.Private;
			const res = inChatroom &&
				(requirements.room.type === "public" ? !chatroomPrivate : chatroomPrivate);
			MainCanvas.fillStyle = (requirements.room.inverted ? !res : res) ? "#00FF22" : "#AA0000";
			MainCanvas.fillRect(95, 620, 15, 64);
		}

		// In room named
		DrawCheckbox(125, 700, 64, 64, "when", !!requirements.roomName, disabled);
		MainCanvas.textAlign = "center";
		DrawButton(324, 702, 115, 60, requirements.roomName?.inverted ? "not in" : "in", disabled || !requirements.roomName ? "#ddd" : "White", "", "", disabled || !requirements.roomName);
		MainCanvas.textAlign = "left";
		DrawText(`room named`, 324 + 115 + 14, 700 + 32, "Black", "Gray");
		ElementPosition("BCX_ConditionRoomName", 324 + 115 + 14 + 360, 700 + 26, 285, 60);
		if (requirements.roomName) {
			const inChatroom = ServerPlayerIsInChatRoom();
			const res = inChatroom &&
				ChatRoomData &&
				typeof ChatRoomData.Name === "string" &&
				ChatRoomData.Name.toLocaleLowerCase() === requirements.roomName.name.toLocaleLowerCase();
			MainCanvas.fillStyle = (requirements.roomName.inverted ? !res : res) ? "#00FF22" : "#AA0000";
			MainCanvas.fillRect(95, 700, 15, 64);
		}

		// In presence of role
		DrawCheckbox(125, 780, 64, 64, "when", !!requirements.role, disabled);
		MainCanvas.textAlign = "center";
		DrawButton(324, 782, 115, 60, requirements.role?.inverted ? "not in" : "in", disabled || !requirements.role ? "#ddd" : "White", "", "", disabled || !requirements.role);
		const roleSelection = requirements.role?.role ?? AccessLevel.mistress;
		const roleSelectionNext = roleSelection < AccessLevel.public ? roleSelection + 1 : AccessLevel.clubowner;
		const roleSelectionPrev = roleSelection > AccessLevel.clubowner ? roleSelection - 1 : AccessLevel.public;
		DrawBackNextButton(324 + 115 + 14 + 242, 782, 244, 60,
			capitalizeFirstLetter(AccessLevel[roleSelection]) + (roleSelection !== AccessLevel.clubowner ? " ↑" : ""),
			disabled || !requirements.role ? "#ddd" : "White", "",
			() => capitalizeFirstLetter(AccessLevel[roleSelectionPrev]),
			() => capitalizeFirstLetter(AccessLevel[roleSelectionNext]),
			disabled || !requirements.role
		);
		MainCanvas.textAlign = "left";
		DrawText(`room with role`, 324 + 115 + 14, 780 + 32, "Black", "Gray");
		if (requirements.role) {
			const res = this.conditionCategoryData.highestRoleInRoom != null && this.conditionCategoryData.highestRoleInRoom <= requirements.role.role;
			MainCanvas.fillStyle = (requirements.role.inverted ? !res : res) ? "#00FF22" : "#AA0000";
			MainCanvas.fillRect(95, 780, 15, 64);
		}

		// In presence of player
		DrawCheckbox(125, 860, 64, 64, "when", !!requirements.player, disabled);
		MainCanvas.textAlign = "center";
		DrawButton(324, 862, 115, 60, requirements.player?.inverted ? "not in" : "in", disabled || !requirements.player ? "#ddd" : "White", "", "", disabled || !requirements.player);
		MainCanvas.textAlign = "left";
		DrawText(`room with member`, 324 + 115 + 14, 860 + 32, "Black", "Gray");
		ElementPositionFix("BCX_ConditionMemberNumber", 40, 768, 860, 162, 60);
		DrawButton(950, 862, 64, 64, "", disabled || !requirements.player ? "#ddd" : "White", undefined, undefined, disabled || !requirements.player);
		DrawImageEx("Icons/Title.png", 952, 864, { Width: 60, Height: 60 });
		if (requirements.player) {
			const inChatroom = ServerPlayerIsInChatRoom();
			const res = inChatroom &&
				getAllCharactersInRoom().some(c => c.MemberNumber === requirements.player!.memberNumber);
			MainCanvas.fillStyle = (requirements.player.inverted ? !res : res) ? "#00FF22" : "#AA0000";
			MainCanvas.fillRect(95, 860, 15, 64);
			const input = document.getElementById("BCX_ConditionMemberNumber") as HTMLInputElement | undefined;
			if (input && document.activeElement === input) {
				DrawHoverElements.push(() => {
					if (!requirements.player)
						return;
					const Left = 957;
					const Top = 858;
					MainCanvas.fillStyle = "#FFFF88";
					MainCanvas.fillRect(Left, Top, 450, 65);
					MainCanvas.lineWidth = 2;
					MainCanvas.strokeStyle = "black";
					MainCanvas.strokeRect(Left, Top, 450, 65);
					DrawTextFit(getCharacterName(requirements.player.memberNumber, "[unknown]"), Left + 225, Top + 33, 444, "black");
				});
			}
		}

		////// global category configuration toggle
		MainCanvas.beginPath();
		MainCanvas.rect(1190, 830, 720, 104);
		MainCanvas.strokeStyle = "#0052A3";
		MainCanvas.stroke();
		DrawCheckbox(1210, 850, 64, 64, `Set to global ${this.conditionCategory} configuration`, useGlobalCategorySetting, !access);
		MainCanvas.beginPath();
		MainCanvas.ellipse(1877 + 33, 800 + 30, 22, 22, 360, 0, 360);
		MainCanvas.fillStyle = "#0052A3";
		MainCanvas.fill();
		DrawImageEx("Icons/General.png", 1877 + 10, 800 + 7, {
			Height: 46,
			Width: 46,
		});

		// hover text for timer behavior toggle
		MainCanvas.textAlign = "center";
		if (data.timer !== null && MouseIn(125, 450, 80, 64)) DrawButtonHover(125, 450, 64, 64, `Removes ${this.conditionCategory.slice(0, -1)} instead of only deactivating it `);

		// hover text for global configuration category toggle
		if (MouseIn(1190, 830, 100, 104)) DrawButtonHover(1786, 854, 64, 64, `Overwrites current trigger conditions`);

		// hover text for member selector
		if (MouseIn(950, 862, 64, 64)) DrawButtonHover(950, 782, 4, 64, `Select member number from list`);

		// hover text for favorite toggle
		if (MouseIn(93, 80, 85, 80)) DrawButtonHover(93, 80, 80, 80, `Favorite: Listed first in overview`);

		return false;
	}

	Click(): boolean {
		if (MouseIn(1815, 75, 90, 90)) {
			if (this.changes) {
				this.processInputs();
				this.character.conditionUpdate(this.conditionCategory, this.conditionName, this.changes);
			}
			this.Exit();
			return true;
		}

		// Cancel
		if (this.changes && MouseIn(1815, 190, 90, 90)) {
			this.Exit();
			return true;
		}

		// help text
		if (MouseIn(1815, 190, 90, 90)) {
			this.showHelp = !this.showHelp;
			return true;
		}

		if (this.conditionCategoryData === null || this.conditionData === null)
			return true;

		if (!this.checkAccess())
			return false;

		const data = this.changes ?? this.conditionData;

		// on-off toggle
		if (MouseIn(125, 180, 64, 64)) {
			this.changes = this.makeChangesData();
			this.changes.active = !this.changes.active;
			this.changes.timer = null;
			this.changes.timerRemove = false;
			return true;
		}

		// favorite toggle
		if (MouseIn(93, 80, 85, 80)) {
			this.changes = this.makeChangesData();
			this.changes.favorite = !this.changes.favorite;
			return true;
		}

		////// status and timer area
		if (data.timer === null) {
			// Enable timer
			if (MouseIn(120, 360, 820, 160)) {
				this.changes = this.makeChangesData();
				this.changes.timer = Date.now() + 5 * 60 * 1000;
				return true;
			}
		} else {
			// -1d
			if (MouseIn(120, 360, 85, 60)) {
				this.changes = this.makeChangesData();
				this.changes.timer! -= 1 * 24 * 60 * 60 * 1000;
				return true;
			}
			// -1h
			if (MouseIn(120 + 125, 360, 85, 60)) {
				this.changes = this.makeChangesData();
				this.changes.timer! -= 1 * 60 * 60 * 1000;
				return true;
			}
			// -5m
			if (MouseIn(120 + 2 * (125), 360, 85, 60)) {
				this.changes = this.makeChangesData();
				this.changes.timer! -= 5 * 60 * 1000;
				return true;
			}
			// Disable timer
			if (MouseIn(120 + 3 * (125), 360, 70, 60)) {
				this.changes = this.makeChangesData();
				this.changes.timer = null;
				this.changes.timerRemove = false;
				return true;
			}
			// +5m
			if (MouseIn(105 + 4 * (125), 360, 85, 60)) {
				this.changes = this.makeChangesData();
				this.changes.timer! += 5 * 60 * 1000;
				return true;
			}
			// +1h
			if (MouseIn(105 + 5 * (125), 360, 85, 60)) {
				this.changes = this.makeChangesData();
				this.changes.timer! += 1 * 60 * 60 * 1000;
				return true;
			}
			// +1d
			if (MouseIn(105 + 6 * (125), 360, 85, 60)) {
				this.changes = this.makeChangesData();
				this.changes.timer! += 1 * 24 * 60 * 60 * 1000;
				return true;
			}

			// Timer remove toggle
			if (MouseIn(125, 450, 64, 64) && data.active) {
				this.changes = this.makeChangesData();
				this.changes.timerRemove = !this.changes.timerRemove;
				return true;
			}
		}

		////// condition factors area
		const useGlobalCategorySetting = !(this.changes ? this.changes.requirements : this.conditionData.requirements);
		const requirements = (this.changes ? this.changes.requirements : this.conditionData.requirements) ?? this.conditionCategoryData.requirements;

		if (MouseIn(530, 550, 410, 60) && !useGlobalCategorySetting) {
			this.changes = this.makeChangesData();
			this.changes.requirements!.orLogic = this.changes.requirements!.orLogic ? undefined : true;
			return true;
		}

		// In room
		if (MouseIn(125, 620, 64, 64) && !useGlobalCategorySetting) {
			this.changes = this.makeChangesData();
			this.changes.requirements!.room = this.changes.requirements!.room ? undefined : { type: "public" };
			return true;
		}
		if (MouseIn(324, 622, 115, 60) && !useGlobalCategorySetting && requirements.room) {
			this.changes = this.makeChangesData();
			this.changes.requirements!.room!.inverted = this.changes.requirements!.room!.inverted ? undefined : true;
			return true;
		}
		if (MouseIn(324 + 115 + 14, 622, 130, 60) && !useGlobalCategorySetting && requirements.room) {
			this.changes = this.makeChangesData();
			this.changes.requirements!.room!.type = this.changes.requirements!.room!.type === "public" ? "private" : "public";
			return true;
		}

		// In room named
		if (MouseIn(125, 700, 64, 64) && !useGlobalCategorySetting) {
			this.changes = this.makeChangesData();
			this.changes.requirements!.roomName = this.changes.requirements!.roomName ? undefined : { name: "" };
			this.onDataChange();
			return true;
		}
		if (MouseIn(324, 702, 115, 60) && !useGlobalCategorySetting && requirements.roomName) {
			this.changes = this.makeChangesData();
			this.changes.requirements!.roomName!.inverted = this.changes.requirements!.roomName!.inverted ? undefined : true;
			return true;
		}

		// In presence of role
		if (MouseIn(125, 780, 64, 64) && !useGlobalCategorySetting) {
			this.changes = this.makeChangesData();
			this.changes.requirements!.role = this.changes.requirements!.role ? undefined : { role: AccessLevel.mistress };
			return true;
		}
		if (MouseIn(324, 782, 115, 60) && !useGlobalCategorySetting && requirements.role) {
			this.changes = this.makeChangesData();
			this.changes.requirements!.role!.inverted = this.changes.requirements!.role!.inverted ? undefined : true;
			return true;
		}
		const roleSelection = requirements.role?.role ?? AccessLevel.mistress;
		if (MouseIn(324 + 115 + 14 + 274, 782, 106, 60) && !useGlobalCategorySetting && requirements.role) {
			this.changes = this.makeChangesData();
			this.changes.requirements!.role!.role = roleSelection > AccessLevel.clubowner ? roleSelection - 1 : AccessLevel.public;
			return true;
		}
		if (MouseIn(324 + 115 + 14 + 274 + 106, 782, 106, 60) && !useGlobalCategorySetting && requirements.role) {
			this.changes = this.makeChangesData();
			this.changes.requirements!.role!.role = roleSelection < AccessLevel.public ? roleSelection + 1 : AccessLevel.clubowner;
			return true;
		}

		// In presence of player
		if (MouseIn(125, 860, 64, 64) && !useGlobalCategorySetting) {
			this.changes = this.makeChangesData();
			this.changes.requirements!.player = this.changes.requirements!.player ? undefined : { memberNumber: 0 };
			this.onDataChange();
			return true;
		}
		if (MouseIn(324, 862, 115, 60) && !useGlobalCategorySetting && requirements.player) {
			this.changes = this.makeChangesData();
			this.changes.requirements!.player!.inverted = this.changes.requirements!.player!.inverted ? undefined : true;
			return true;
		}
		if (MouseIn(950, 862, 64, 64) && !useGlobalCategorySetting && requirements.player) {
			setSubscreen(new GuiMemberSelect(this.character, this, result => {
				this.changes = this.makeChangesData();
				this.changes.requirements!.player!.memberNumber = result;
			}));
			return true;
		}

		////// global category configuration toggle
		if (MouseIn(1210, 850, 64, 64)) {
			this.changes = this.makeChangesData();
			this.setUseGlobal(!!this.changes.requirements);
			this.onDataChange();
			return true;
		}

		return false;
	}

	Exit() {
		setSubscreen(this.back);
	}

	Unload() {
		ElementRemove("BCX_ConditionRoomName");
		ElementRemove("BCX_ConditionMemberNumber");
	}
}
