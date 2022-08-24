import { ChatroomCharacter, getPlayerCharacter } from "../characters";
import { GuiSubscreen } from "./subscreen";
import { GuiMainMenu } from "./mainmenu";
import { setSubscreen } from "../modules/gui";
import { Views, HELP_TEXTS } from "../helpTexts";
import { DrawImageEx, getCharacterName, showHelp } from "../utilsClub";
import { clamp } from "../utils";
import { GuiMemberSelect } from "./member_select";
import { isValidNickname, NICKNAME_LENGTH_MAX } from "../modules/relationships";

const PER_PAGE_COUNT = 6;

type RelationshipsListItem = {
	memberNumber: number;
	name: string | null;
	newName: string;
	enforced: boolean;
};

export class GuiRelationships extends GuiSubscreen {

	readonly character: ChatroomCharacter;

	private relationshipsData: BCX_queries["relatonshipsGet"][1] | null = null;

	private relationshipsList: RelationshipsListItem[] = [];

	private failed: boolean = false;
	private page: number = 0;

	private memberNumberPrefill: number | null = null;

	private showHelp: boolean = false;

	constructor(character: ChatroomCharacter) {
		super();
		this.character = character;
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
		this.character.relatonshipsGet().then(res => {
			if (!this.active)
				return;
			this.relationshipsData = res;
			this.failed = false;
			this.onDataChange();
		}, err => {
			console.error(`BCX: Failed to get relationships data from ${this.character}`, err);
			this.relationshipsData = null;
			this.failed = true;
			this.onDataChange();
		});
	}

	private onDataChange() {
		if (!this.active) return;

		this.relationshipsList = [];

		let Input_NameAdd = document.getElementById("BCX_NameAdd") as HTMLInputElement | undefined;
		let Input_NewNameAdd = document.getElementById("BCX_NewNameAdd") as HTMLInputElement | undefined;

		if (this.relationshipsData == null) {
			Input_NameAdd?.remove();
			Input_NewNameAdd?.remove();
			return;
		}

		if (!Input_NameAdd) {
			Input_NameAdd = ElementCreateInput("BCX_NameAdd", "text", this.memberNumberPrefill?.toString() ?? "", "8");
			this.memberNumberPrefill = null;
		}
		if (!Input_NewNameAdd) {
			Input_NewNameAdd = ElementCreateInput("BCX_NewNameAdd", "text", "", String(NICKNAME_LENGTH_MAX));
		}

		this.relationshipsList = this.relationshipsData.relationships.map(entry => ({
			memberNumber: entry.memberNumber,
			name: getCharacterName(entry.memberNumber, null),
			newName: entry.nickname,
			enforced: entry.enforceNickname
		}));

		this.page = clamp(this.page, 0, Math.ceil(this.relationshipsList.length / PER_PAGE_COUNT));
	}

	Run() {
		MainCanvas.textAlign = "left";
		DrawText(`- Relationships: Custom names shown (only) to ${this.character.Name} -`, 125, 125, "Black", "Gray");
		MainCanvas.textAlign = "center";
		DrawButton(1815, 75, 90, 90, "", "White", "Icons/Exit.png", "BCX main menu");
		DrawButton(1815, 190, 90, 90, "", "White", "Icons/Question.png");

		// help text
		if (this.showHelp) {
			showHelp(HELP_TEXTS[Views.Relationships]);
		}

		if (this.relationshipsData == null) {
			MainCanvas.textAlign = "center";
			DrawText(this.failed ? `Failed to get role data from ${this.character.Name}. Maybe you have no access?` : "Loading...", 800, 480, "Black");
			return;
		}

		MainCanvas.textAlign = "left";
		MainCanvas.fillStyle = "#eeeeee";
		MainCanvas.fillRect(130, 200, 1484, 64);
		DrawText("Actual character name", 140, 200 + 34, "Black");
		DrawText("Enforce speaking it?", 740, 200 + 34, "Black");
		DrawText("Custom name", 1260, 200 + 34, "Black");

		for (let off = 0; off < PER_PAGE_COUNT; off++) {
			const i = this.page * PER_PAGE_COUNT + off;
			if (i >= this.relationshipsList.length) break;
			const e = this.relationshipsList[i];

			const Y = 305 + off * 95;
			const allow = e.memberNumber === Player.MemberNumber ? this.relationshipsData.access_modify_self : this.relationshipsData.access_modify_others;

			// Relationships list
			MainCanvas.strokeRect(130, Y, 700, 64);
			const name = `${e.name === null ? "[unknown name]" : e.name} (${e.memberNumber})`;
			DrawTextFit(name, 140, Y + 34, 680, "Black");

			DrawCheckbox(880, Y, 64, 64, "", e.enforced, !allow);

			MainCanvas.strokeRect(994, Y, 500, 64);
			DrawTextFit(e.newName, 1004, Y + 34, 480, "Black");

			// hover text for toggle
			MainCanvas.textAlign = "center";
			if (MouseIn(880, Y, 64, 64)) DrawButtonHover(930, Y, 4, 64, `${this.character.Name} can only say the custom name`);

			if (allow) {
				DrawButton(1550, Y, 64, 64, "X", "White", undefined, "Delete this custom name");
			}
			MainCanvas.textAlign = "left";
		}

		const Input_NameAdd = document.getElementById("BCX_NameAdd") as HTMLInputElement | undefined;
		if (Input_NameAdd) {
			DrawText("Member Number:", 130, 847, "Black");
			ElementPosition("BCX_NameAdd", 580, 842, 300, 64);
			if (!this.relationshipsData.access_modify_others) {
				Input_NameAdd.value = String(Player.MemberNumber);
			}
		}

		DrawButton(740, 815, 64, 64, "", this.relationshipsData.access_modify_others ? "White" : "#ddd", undefined, undefined, !this.relationshipsData.access_modify_others);
		DrawImageEx("Icons/Title.png", 742, 815, { Width: 60, Height: 60 });

		// hover text for member selector
		MainCanvas.textAlign = "center";
		if (MouseIn(740, 815, 64, 64)) DrawButtonHover(580, 890, 4, 64, `Select member number from list`);
		MainCanvas.textAlign = "left";

		const Input_NewNameAdd = document.getElementById("BCX_NewNameAdd") as HTMLInputElement | undefined;
		if (Input_NewNameAdd) {
			DrawText("New name:", 854, 847, "Black");
			ElementPosition("BCX_NewNameAdd", 1210, 842, 300, 64);
		}

		MainCanvas.textAlign = "center";
		const inputNumber = (Input_NameAdd && /^[0-9]+$/.test(Input_NameAdd.value)) ? Number.parseInt(Input_NameAdd.value, 10) : null;
		const allowAdd = inputNumber !== null &&
			(inputNumber === Player.MemberNumber ? this.relationshipsData.access_modify_self : this.relationshipsData.access_modify_others) &&
			Input_NewNameAdd &&
			isValidNickname(Input_NewNameAdd.value);
		DrawButton(1375, 815, 90, 64, "Add", allowAdd ? "White" : "#ddd", undefined, undefined, !allowAdd);

		// Pagination
		const totalPages = Math.max(Math.ceil(this.relationshipsList.length / PER_PAGE_COUNT), 1);
		DrawBackNextButton(1605, 800, 300, 90, `Page ${this.page + 1} / ${totalPages}`, "White", "", () => "", () => "");
	}

	Click() {
		if (MouseIn(1815, 75, 90, 90)) return this.Exit();
		if (MouseIn(1815, 190, 90, 90)) {
			this.showHelp = !this.showHelp;
			return;
		}

		if (!this.relationshipsData)
			return;

		for (let off = 0; off < PER_PAGE_COUNT; off++) {
			const i = this.page * PER_PAGE_COUNT + off;
			if (i >= this.relationshipsList.length) break;
			const e = this.relationshipsList[i];

			const Y = 305 + off * 95;
			const allow = e.memberNumber === Player.MemberNumber ? this.relationshipsData.access_modify_self : this.relationshipsData.access_modify_others;

			if (MouseIn(880, Y, 64, 64) && allow) {
				this.character.relationshipsSet({
					memberNumber: e.memberNumber,
					nickname: e.newName,
					enforceNickname: !e.enforced
				});
				return;
			}

			if (MouseIn(1550, Y, 64, 64) && allow) {
				this.character.relationshipsRemove(e.memberNumber);
				return;
			}
		}

		const Input_NameAdd = document.getElementById("BCX_NameAdd") as HTMLInputElement | undefined;
		const inputText = Input_NameAdd?.value ?? "";
		const inputNumber = /^[0-9]+$/.test(inputText) ? Number.parseInt(inputText, 10) : null;

		const Input_NewNameAdd = document.getElementById("BCX_NewNameAdd") as HTMLInputElement | undefined;
		const inputText_2 = Input_NewNameAdd?.value ?? "";

		if (
			Input_NameAdd &&
			Input_NewNameAdd &&
			inputNumber !== null &&
			isValidNickname(inputText_2) &&
			MouseIn(1375, 815, 90, 64) &&
			(inputNumber === Player.MemberNumber ? this.relationshipsData.access_modify_self : this.relationshipsData.access_modify_others)
		) {
			Input_NameAdd.value = "";
			Input_NewNameAdd.value = "";
			console.log("Send set");
			this.character.relationshipsSet({
				memberNumber: inputNumber,
				nickname: inputText_2,
				enforceNickname: this.relationshipsList.find(r => r.memberNumber === inputNumber)?.enforced ?? false
			});
			return;
		}

		// member select
		if (MouseIn(740, 815, 64, 64) && this.relationshipsData.access_modify_others) {
			setSubscreen(new GuiMemberSelect(this.character, this, result => {
				this.memberNumberPrefill = result;
			}, this.relationshipsData.access_modify_self ? undefined : [getPlayerCharacter().MemberNumber]));
			return;
		}

		// Pagination
		const totalPages = Math.ceil(this.relationshipsList.length / PER_PAGE_COUNT);
		if (MouseIn(1605, 800, 150, 90)) {
			this.page--;
			if (this.page < 0) {
				this.page = Math.max(totalPages - 1, 0);
			}
		} else if (MouseIn(1755, 800, 150, 90)) {
			this.page++;
			if (this.page >= totalPages) {
				this.page = 0;
			}
		}
	}

	Exit() {
		setSubscreen(new GuiMainMenu(this.character));
	}

	Unload() {
		ElementRemove("BCX_NameAdd");
		ElementRemove("BCX_NewNameAdd");
	}
}
