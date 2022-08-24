import { ChatroomCharacter, getAllCharactersInRoom } from "../characters";
import { setSubscreen } from "../modules/gui";
import { GuiSubscreen } from "./subscreen";
import { getCharacterName } from "../utilsClub";
import { AccessLevel } from "../modules/authority";
import { capitalizeFirstLetter, formatTimeInterval } from "../utils";
import { ConditionsEvaluateRequirements } from "../modules/conditions";

import cloneDeep from "lodash-es/cloneDeep";

export abstract class GuiConditionGlobal<CAT extends ConditionsCategories> extends GuiSubscreen {

	readonly character: ChatroomCharacter;
	readonly conditionCategory: CAT;
	readonly back: GuiSubscreen;

	protected conditionCategoryData: ConditionsCategoryPublicData<CAT> | null = null;

	protected failed: boolean = false;

	protected showHelp: boolean = false;

	protected changes: ConditionsCategoryConfigurableData | null = null;

	constructor(character: ChatroomCharacter,
		conditionCategory: CAT,
		back: GuiSubscreen
	) {
		super();
		this.character = character;
		this.conditionCategory = conditionCategory;
		this.back = back;
	}

	protected makeChangesData(): ConditionsCategoryConfigurableData {
		if (!this.conditionCategoryData) {
			throw new Error("Data required");
		}
		return this.changes ?? {
			requirements: cloneDeep(this.conditionCategoryData.requirements),
			timer: this.conditionCategoryData.timer,
			timerRemove: this.conditionCategoryData.timerRemove,
			data: cloneDeep(this.conditionCategoryData.data)
		};
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
			this.conditionCategoryData = res;
			if (!this.checkAccess()) {
				this.changes = null;
			}
			this.failed = false;
			this.onDataChange();
		}, err => {
			console.error(`BCX: Failed to get condition info for ${this.conditionCategory} from ${this.character}`, err);
			this.conditionCategoryData = null;
			this.failed = true;
			this.onDataChange();
		});
	}

	protected onDataChange() {

		let inputRoomName = document.getElementById("BCX_ConditionRoomName") as HTMLInputElement | undefined;
		let inputMemberNumber = document.getElementById("BCX_ConditionMemberNumber") as HTMLInputElement | undefined;

		if (!this.conditionCategoryData) {
			if (inputRoomName) {
				inputRoomName.remove();
			}
			if (inputMemberNumber) {
				inputMemberNumber.remove();
			}
			return;
		}

		const data = this.changes ?? this.conditionCategoryData;
		const requirements = data.requirements;
		const access = this.checkAccess();
		const disabled = !access;

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
		return this.conditionCategoryData.access_configure;
	}

	protected abstract headerText(): string;

	Run(): boolean {
		MainCanvas.textAlign = "left";
		DrawText(`- ${this.headerText()} -`, 125, 125, "Black", "Gray");
		MainCanvas.textAlign = "center";

		if (this.changes) {
			DrawButton(1815, 75, 90, 90, "", "White", "Icons/Accept.png", "Save all changes and go back");
			DrawButton(1815, 190, 90, 90, "", "White", "Icons/Cancel.png", "Go back without saving");
		} else {
			DrawButton(1815, 75, 90, 90, "", "White", "Icons/Exit.png", "Back");
			DrawButton(1815, 190, 90, 90, "", "White", "Icons/Question.png");
		}

		if (this.conditionCategoryData === null) {
			MainCanvas.textAlign = "center";
			DrawText(this.failed ? `Failed to get data from ${this.character.Name}. Maybe you have no access?` : "Loading...", 1000, 480, "Black");
			return true;
		}

		if (this.changes && this.changes.timer !== null && this.changes.timer <= 0) {
			this.changes.timer = null;
			this.changes.timerRemove = false;
		}

		const data = this.changes ?? this.conditionCategoryData;
		const requirements = data.requirements;
		const access = this.checkAccess();
		const disabled = !access;

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

		////// status and timer area
		MainCanvas.textAlign = "center";
		let statusText: string;
		if (data.timer === null) {
			statusText = "Timer disabled by default";
		} else {
			statusText = `Default timer: ${formatTimeInterval(data.timer)}`;
		}
		DrawText(statusText, 530, 311, "Black");

		if (data.timer === null) {
			DrawButton(120, 360, 820, 160, "Enable timer", "White");
			MainCanvas.textAlign = "left";
		} else {
			DrawButton(120, 360, 85, 60, "-1d", !access ? "#ddd" : "White", "", "Remove 1 day from the timer", !access);
			DrawButton(120 + 125, 360, 85, 60, "-1h", !access ? "#ddd" : "White", "", "Remove 1 hour from the timer", !access);
			DrawButton(120 + 2 * (125), 360, 85, 60, "-5m", !access ? "#ddd" : "White", "", "Remove 5 minutes from the timer", !access);
			DrawButton(120 + 3 * (125), 360, 70, 60, "∞", !access ? "#ddd" : "White", "", "Set lifetime to infinite", !access);
			DrawButton(105 + 4 * (125), 360, 85, 60, "+5m", !access ? "#ddd" : "White", "", "Add 5 minutes to the timer", !access);
			DrawButton(105 + 5 * (125), 360, 85, 60, "+1h", !access ? "#ddd" : "White", "", "Add 1 hour to the timer", !access);
			DrawButton(105 + 6 * (125), 360, 85, 60, "+1d", !access ? "#ddd" : "White", "", "Add 1 day to the timer", !access);

			MainCanvas.textAlign = "left";
			DrawCheckbox(125, 450, 64, 64, `Remove the ${this.conditionCategory.slice(0, -1)} when timer runs out`, data.timerRemove, !access);
		}

		////// condition factors area
		DrawText(`${capitalizeFirstLetter(this.conditionCategory.slice(0, -1))} trigger conditions:`, 130, 580, "Black", "");
		MainCanvas.textAlign = "center";
		const hasAnyRequirement = !!(requirements.room || requirements.roomName || requirements.role || requirements.player);
		DrawButton(530, 550, 410, 60, hasAnyRequirement ? (requirements.orLogic ? "Any selected below" : "All selected below") : "Always in effect", disabled || !hasAnyRequirement ? "#ddd" : "White", "", "", disabled || !hasAnyRequirement);
		MainCanvas.textAlign = "left";

		MainCanvas.fillStyle = ConditionsEvaluateRequirements(requirements, this.conditionCategoryData.highestRoleInRoom) ? "#00FF22" : "#AA0000";
		MainCanvas.fillRect(75, 620, 15, 304);

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

		// hover text for timer behavior toggle
		MainCanvas.textAlign = "center";
		if (data.timer !== null && MouseIn(125, 450, 80, 64)) DrawButtonHover(125, 450, 64, 64, `Removes ${this.conditionCategory.slice(0, -1)} instead of only deactivating it `);

		return false;
	}

	Click(): boolean {
		if (MouseIn(1815, 75, 90, 90)) {
			if (this.changes) {
				this.processInputs();
				this.character.conditionCategoryUpdate(this.conditionCategory, this.changes);
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

		if (this.conditionCategoryData === null)
			return true;

		if (!this.checkAccess())
			return false;

		const data = this.changes ?? this.conditionCategoryData;

		////// status and timer area
		if (data.timer === null) {
			// Enable timer
			if (MouseIn(120, 360, 820, 160)) {
				this.changes = this.makeChangesData();
				this.changes.timer = 5 * 60 * 1000;
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
			if (MouseIn(125, 450, 64, 64)) {
				this.changes = this.makeChangesData();
				this.changes.timerRemove = !this.changes.timerRemove;
				return true;
			}
		}

		////// condition factors area
		const requirements = data.requirements;

		if (MouseIn(530, 550, 410, 60)) {
			this.changes = this.makeChangesData();
			this.changes.requirements.orLogic = this.changes.requirements.orLogic ? undefined : true;
			return true;
		}

		// In room
		if (MouseIn(125, 620, 64, 64)) {
			this.changes = this.makeChangesData();
			this.changes.requirements.room = this.changes.requirements.room ? undefined : { type: "public" };
			return true;
		}
		if (MouseIn(324, 622, 115, 60) && requirements.room) {
			this.changes = this.makeChangesData();
			this.changes.requirements.room!.inverted = this.changes.requirements.room!.inverted ? undefined : true;
			return true;
		}
		if (MouseIn(324 + 115 + 14, 622, 130, 60) && requirements.room) {
			this.changes = this.makeChangesData();
			this.changes.requirements.room!.type = this.changes.requirements.room!.type === "public" ? "private" : "public";
			return true;
		}

		// In room named
		if (MouseIn(125, 700, 64, 64)) {
			this.changes = this.makeChangesData();
			this.changes.requirements.roomName = this.changes.requirements.roomName ? undefined : { name: "" };
			this.onDataChange();
			return true;
		}
		if (MouseIn(324, 702, 115, 60) && requirements.roomName) {
			this.changes = this.makeChangesData();
			this.changes.requirements.roomName!.inverted = this.changes.requirements.roomName!.inverted ? undefined : true;
			return true;
		}

		// In presence of role
		if (MouseIn(125, 780, 64, 64)) {
			this.changes = this.makeChangesData();
			this.changes.requirements.role = this.changes.requirements.role ? undefined : { role: AccessLevel.mistress };
			return true;
		}
		if (MouseIn(324, 782, 115, 60) && requirements.role) {
			this.changes = this.makeChangesData();
			this.changes.requirements.role!.inverted = this.changes.requirements.role!.inverted ? undefined : true;
			return true;
		}
		const roleSelection = requirements.role?.role ?? AccessLevel.mistress;
		if (MouseIn(324 + 115 + 14 + 274, 782, 106, 60) && requirements.role) {
			this.changes = this.makeChangesData();
			this.changes.requirements.role!.role = roleSelection > AccessLevel.clubowner ? roleSelection - 1 : AccessLevel.public;
			return true;
		}
		if (MouseIn(324 + 115 + 14 + 274 + 106, 782, 106, 60) && requirements.role) {
			this.changes = this.makeChangesData();
			this.changes.requirements.role!.role = roleSelection < AccessLevel.public ? roleSelection + 1 : AccessLevel.clubowner;
			return true;
		}

		// In presence of player
		if (MouseIn(125, 860, 64, 64)) {
			this.changes = this.makeChangesData();
			this.changes.requirements.player = this.changes.requirements.player ? undefined : { memberNumber: 0 };
			this.onDataChange();
			return true;
		}
		if (MouseIn(324, 862, 115, 60) && requirements.player) {
			this.changes = this.makeChangesData();
			this.changes.requirements.player!.inverted = this.changes.requirements.player!.inverted ? undefined : true;
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
