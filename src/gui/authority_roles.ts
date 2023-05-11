import { ChatroomCharacter } from "../characters";
import { GuiSubscreen } from "./subscreen";
import { AccessLevel } from "../modules/authority";
import { capitalizeFirstLetter } from "../utils";
import { GuiMainMenu } from "./mainmenu";
import { GuiAuthorityPermissions } from "./authority_permissions";
import { setSubscreen } from "../modules/gui";
import { getCharacterName, DrawImageEx, showHelp } from "../utilsClub";
import { Views, HELP_TEXTS } from "../helpTexts";
import { GuiMemberSelect } from "./member_select";

const PER_PAGE_COUNT = 6;

type RoleListItem = {
	type: "Owner" | "Mistress";
	memberNumber: number;
	name: string | null;
};

export class GuiAuthorityRoles extends GuiSubscreen {

	readonly character: ChatroomCharacter;

	private roleData: PermissionRoleBundle | null = null;
	private roleList: RoleListItem[] = [];
	private failed: boolean = false;
	private page: number = 0;

	private hoveringTextList: string[] = [];
	private roleAddInputAutofill: number | null = null;

	private showHelp: boolean = false;

	constructor(character: ChatroomCharacter) {
		super();
		this.character = character;

		this.hoveringTextList =
			character.isPlayer() ? [
				`You - either top or bottom of the hierarchy`,
				`Your owner, visible on your character profile`,
				`Any character, added to the list on the left as "Owner"`,
				`Any of your lovers, visible on your character profile`,
				`Any character, added to the list on the left as "Mistress"`,
				`Anyone you have white-listed`,
				`Anyone you have friend-listed`,
				`Anyone, who can use items on you`,
			] : [
				`This player - either top or bottom of the hierarchy`,
				`This player's owner, visible on their character profile`,
				`Any character, added to the list on the left as "Owner"`,
				`Any lover of this player, visible on their profile`,
				`Any character, added to the list on the left as "Mistress"`,
				`Anyone this player has white-listed`,
				`Anyone this player has friend-listed`,
				`Anyone, who can use items on this player`,
			];
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
		Promise.all([this.character.getRolesData()]).then(res => {
			this.roleData = res[0];
			this.failed = false;
			this.rebuildList();
		}, err => {
			console.error(`BCX: Failed to get role info for ${this.character}`, err);
			this.roleData = null;
			this.failed = true;
			this.rebuildList();
		});
	}

	private rebuildList() {
		if (!this.active) return;

		this.roleList = [];

		let Input = document.getElementById("BCX_RoleAdd") as HTMLInputElement | undefined;

		if (!this.roleData) {
			if (Input) {
				Input.remove();
			}
			return;
		}

		const showInput = this.roleData.allowAddMistress || this.roleData.allowAddOwner;

		if (!showInput && Input) {
			Input.remove();
		} else if (showInput && !Input) {
			Input = ElementCreateInput("BCX_RoleAdd", "text", "", "6");
			if (this.roleAddInputAutofill !== null) {
				Input.value = `${this.roleAddInputAutofill}`;
				this.roleAddInputAutofill = null;
			}
		}

		this.roleList = this.roleData.owners.map((i): RoleListItem => ({
			type: "Owner",
			memberNumber: i[0],
			name: getCharacterName(i[0], i[1] || null),
		}));
		this.roleList.push(...this.roleData.mistresses.map((i): RoleListItem => ({
			type: "Mistress",
			memberNumber: i[0],
			name: getCharacterName(i[0], i[1] || null),
		})));

		const totalPages = Math.ceil(this.roleList.length / PER_PAGE_COUNT);
		if (this.page < 0) {
			this.page = Math.max(totalPages - 1, 0);
		} else if (this.page >= totalPages) {
			this.page = 0;
		}
	}

	Run() {

		DrawText("Hierarchy of roles:", 1336, 95, "Black");

		// hierarchy background
		MainCanvas.beginPath();
		MainCanvas.moveTo(1450, 134);
		MainCanvas.lineTo(1450 + 150, 134);
		MainCanvas.lineTo(1450 + 80, 740);
		MainCanvas.lineTo(1450 + 70, 740);
		MainCanvas.lineTo(1450, 134);
		MainCanvas.fillStyle = "Black";
		MainCanvas.fill();

		if (this.roleData) {

			for (let off = 0; off < PER_PAGE_COUNT; off++) {
				const i = this.page * PER_PAGE_COUNT + off;
				if (i >= this.roleList.length) break;
				const e = this.roleList[i];

				const Y = 210 + off * 95;

				// Owner/Mistress list
				MainCanvas.beginPath();
				MainCanvas.rect(130, Y, 900, 64);
				MainCanvas.stroke();
				const msg = `${e.type} ${e.name === null ? "[unknown name]" : e.name} (${e.memberNumber})`;
				DrawTextFit(msg, 140, Y + 34, 590, "Black");

				if ((e.type === "Owner" ? this.roleData.allowRemoveOwner : this.roleData.allowRemoveMistress) || e.memberNumber === Player.MemberNumber) {
					MainCanvas.textAlign = "center";
					DrawButton(1090, Y, 64, 64, "X", "White");
					MainCanvas.textAlign = "left";
				}
			}

			const Input = document.getElementById("BCX_RoleAdd") as HTMLInputElement | undefined;
			if (Input) {
				DrawText("Member Number:", 130, 847, "Black");
				ElementPosition("BCX_RoleAdd", 580, 842, 300, 64);
			}

			MainCanvas.textAlign = "center";
			if (this.roleData.allowAddOwner) {
				DrawButton(833, 815, 210, 64, "Add as owner", "white");
			}

			if (this.roleData.allowAddMistress) {
				DrawButton(1074, 815, 210, 64, "Add as mistress", "white");
			}

			if (this.roleData.allowAddMistress || this.roleData.allowAddOwner) {
				DrawButton(740, 815, 64, 64, "", "White", undefined, `Select member number from list`);
				DrawImageEx("Icons/Title.png", 742, 815, { Width: 60, Height: 60 });
			}

			// Pagination
			const totalPages = Math.ceil(this.roleList.length / PER_PAGE_COUNT);
			DrawBackNextButton(1430, 800, 300, 90, `Page ${this.page + 1} / ${totalPages}`, "White", "", () => "", () => "");
		} else if (this.failed) {
			MainCanvas.textAlign = "center";
			DrawText(`Failed to get role data from ${this.character.Name}. Maybe you have no access?`, 800, 480, "Black");
		} else {
			MainCanvas.textAlign = "center";
			DrawText("Loading...", 800, 480, "Black");
		}

		// hierarchy roles
		MainCanvas.textAlign = "center";
		DrawButton(1420, 130, 208, 54, this.character.Name, "White", undefined, this.hoveringTextList[0]);
		for (let i = 1; i < 8; i++) {
			DrawButton(1430, 130 + 80 * i, 188, 54, capitalizeFirstLetter(AccessLevel[i]), "White", undefined, this.hoveringTextList[i]);
		}

		// help text
		if (this.showHelp) {
			showHelp(HELP_TEXTS[Views.AuthorityRoles]);
		}

		MainCanvas.textAlign = "left";
		DrawText(`- Authority: Role Management for ${this.character.Name} -`, 125, 125, "Black", "Gray");
		MainCanvas.textAlign = "center";
		DrawButton(1815, 75, 90, 90, "", "White", "Icons/Exit.png", "BCX main menu");
		DrawButton(1815, 190, 90, 90, "", "White", "Icons/Question.png");
		DrawButton(1815, 305, 90, 90, "", "White", "Icons/Preference.png", "Configure the role-based BCX permissions");

	}

	Click() {
		if (MouseIn(1815, 75, 90, 90)) return this.Exit();
		if (MouseIn(1815, 190, 90, 90)) {
			this.showHelp = !this.showHelp;
			return;
		}
		if (MouseIn(1815, 305, 90, 90)) return this.Back();

		if (this.roleData) {

			for (let off = 0; off < PER_PAGE_COUNT; off++) {
				const i = this.page * PER_PAGE_COUNT + off;
				if (i >= this.roleList.length) break;
				const e = this.roleList[i];

				const Y = 210 + off * 95;

				if (((e.type === "Owner" ? this.roleData.allowRemoveOwner : this.roleData.allowRemoveMistress) || e.memberNumber === Player.MemberNumber) && MouseIn(1090, Y, 64, 64)) {
					this.character.editRole(e.type === "Owner" ? "owner" : "mistress", "remove", e.memberNumber);
					return;
				}
			}

			const Input = document.getElementById("BCX_RoleAdd") as HTMLInputElement | undefined;
			const inputText = Input?.value ?? "";
			const inputNumber = /^[0-9]+$/.test(inputText) ? Number.parseInt(inputText, 10) : null;

			if (this.roleData.allowAddOwner && Input && inputNumber !== null && MouseIn(833, 815, 210, 64)) {
				Input.value = "";
				this.character.editRole("owner", "add", inputNumber);
				return;
			}

			if (this.roleData.allowAddMistress && Input && inputNumber !== null && MouseIn(1074, 815, 210, 64)) {
				Input.value = "";
				this.character.editRole("mistress", "add", inputNumber);
				return;
			}

			// Pagination
			const totalPages = Math.ceil(this.roleList.length / PER_PAGE_COUNT);
			if (MouseIn(1430, 800, 150, 90)) {
				this.page--;
				if (this.page < 0) {
					this.page = Math.max(totalPages - 1, 0);
				}
			} else if (MouseIn(1580, 800, 150, 90)) {
				this.page++;
				if (this.page >= totalPages) {
					this.page = 0;
				}
			}

			// member select
			if (MouseIn(740, 815, 64, 64)) {
				setSubscreen(new GuiMemberSelect(this.character, this, result => {
					this.roleAddInputAutofill = result;
				}));
				return;
			}
		}

	}

	Exit() {
		setSubscreen(new GuiMainMenu(this.character));
	}

	Back() {
		setSubscreen(new GuiAuthorityPermissions(this.character));
	}

	Unload() {
		ElementRemove("BCX_RoleAdd");
	}
}
