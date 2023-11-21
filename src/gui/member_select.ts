import { ChatroomCharacter, getAllCharactersInRoom } from "../characters";
import { GuiSubscreen } from "./subscreen";
import { getCharacterName } from "../utilsClub";
import { setSubscreen } from "../modules/gui";
import { DrawQueryErrorMessage } from "../modules/messaging";

const PER_PAGE_COUNT = 8;

type RoleListItem = {
	type: "Character" | "Player" | "Clubowner" | "Owner" | "Lover" | "Mistress" | "in same room" | "Friend";
	memberNumber: number;
	name: string;
};

export class GuiMemberSelect extends GuiSubscreen {

	readonly character: ChatroomCharacter;
	private roleData: PermissionRoleBundle | null = null;
	private roleList: RoleListItem[] = [];
	private failed: boolean = false;
	private page: number = 0;
	private ignoredCharacters: number[];

	readonly back: GuiSubscreen;
	readonly callback: (result: number) => void;

	constructor(character: ChatroomCharacter, back: GuiSubscreen, callback: (result: number) => void, ignoredCharacters: number[] = []) {
		super();
		this.character = character;
		this.back = back;
		this.callback = callback;
		this.ignoredCharacters = ignoredCharacters;
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
			this.refreshScreen();
		}, err => {
			console.error(`BCX: Failed to get role info for ${this.character}`, err);
			this.roleData = null;
			this.failed = true;
			this.refreshScreen();
		});
	}

	private refreshScreen() {
		if (!this.active) return;

		this.roleList = [];

		let nameFilter = document.getElementById("BCX_Filter") as HTMLInputElement | undefined;

		if (this.roleData === null) {
			if (nameFilter) {
				nameFilter.remove();
			}
			return;
		}

		if (!nameFilter) {
			nameFilter = ElementCreateInput("BCX_Filter", "text", "", "30");
			nameFilter.addEventListener("input", ev => {
				this.refreshScreen();
			});
		}

		const filter = nameFilter.value.trim().toLocaleLowerCase().split(" ");

		this.roleList = [
			{
				type: "Character",
				memberNumber: this.character.MemberNumber,
				name: this.character.Name,
			},
		];

		if (!this.character.isPlayer()) {
			this.roleList.push({
				type: "Player",
				memberNumber: Player.MemberNumber!,
				name: Player.Name,
			});
		}

		if (typeof this.character.Character.Ownership?.MemberNumber === "number" && !this.roleList.some(r => r.memberNumber === this.character.Character.Ownership?.MemberNumber)) {
			this.roleList.push({
				type: "Clubowner",
				memberNumber: this.character.Character.Ownership.MemberNumber,
				name: this.character.Character.Ownership.Name,
			});
		}
		for (const owner of this.roleData.owners) {
			if (!this.roleList.some(r => r.memberNumber === owner[0])) {
				this.roleList.push({
					type: "Owner",
					memberNumber: owner[0],
					name: getCharacterName(owner[0], owner[1] || "[unknown name]"),
				});
			}
		}
		if (Array.isArray(this.character.Character.Lovership)) {
			for (const L of this.character.Character.Lovership) {
				if (typeof L.MemberNumber === "number" && !this.roleList.some(r => r.memberNumber === L.MemberNumber)) {
					this.roleList.push({
						type: "Lover",
						memberNumber: L.MemberNumber,
						name: L.Name,
					});
				}
			}
		}
		for (const mistress of this.roleData.mistresses) {
			if (!this.roleList.some(r => r.memberNumber === mistress[0])) {
				this.roleList.push({
					type: "Mistress",
					memberNumber: mistress[0],
					name: getCharacterName(mistress[0], mistress[1] || "[unknown name]"),
				});
			}
		}
		// Skip if fully blinded and BlindDisableExamine is set
		if (Player.GetBlindLevel() < 3 || !Player.GameplaySettings?.BlindDisableExamine) {
			const ChatRoomCharacterList = getAllCharactersInRoom();
			// Only add adjecent characters if only those can be seen
			if (Player.GetBlindLevel() > 0 && Player.ImmersionSettings?.BlindAdjacent) {
				const playerIndex = ChatRoomCharacterList.findIndex(c => c.isPlayer());
				// Filter out the characters adjacent to the player index
				for (let i = 0; i < ChatRoomCharacterList.length; i++) {
					if (Math.abs(i - playerIndex) === 1 &&
					!this.roleList.some(r => r.memberNumber === ChatRoomCharacterList[i].MemberNumber)) {
						this.roleList.push({
							type: "in same room",
							memberNumber: ChatRoomCharacterList[i].MemberNumber,
							name: ChatRoomCharacterList[i].Name,
						});
					}
				}
			// Add the whole room
			} else {
				for (const character of ChatRoomCharacterList) {
					if (!this.roleList.some(r => r.memberNumber === character.MemberNumber)) {
						this.roleList.push({
							type: "in same room",
							memberNumber: character.MemberNumber,
							name: character.Name,
						});
					}
				}
			}
		}

		if (Player.FriendNames) {
			for (const [memberNumber, name] of Player.FriendNames.entries()) {
				if (!this.roleList.some(r => r.memberNumber === memberNumber)) {
					this.roleList.push({
						type: "Friend",
						memberNumber,
						name,
					});
				}
			}
		}

		this.roleList = this.roleList.filter(e => {
			return !this.ignoredCharacters.includes(e.memberNumber) && filter.every(f => e.name?.toLocaleLowerCase().includes(f) || e.memberNumber.toString().includes(f));
		});

		const totalPages = Math.ceil(this.roleList.length / PER_PAGE_COUNT);
		if (this.page < 0) {
			this.page = Math.max(totalPages - 1, 0);
		} else if (this.page >= totalPages) {
			this.page = 0;
		}
	}

	Run() {
		if (this.roleData !== null) {

			// filter
			DrawText("Filter name:", 703, 125, "Black");
			ElementPosition("BCX_Filter", 1203, 118, 600, 64);

			//reset button
			if ((document.getElementById("BCX_Filter") as HTMLInputElement | undefined)?.value) {
				MainCanvas.textAlign = "center";
				DrawButton(1510, 92, 64, 64, "X", "White");
			}

			for (let off = 0; off < PER_PAGE_COUNT; off++) {
				const i = this.page * PER_PAGE_COUNT + off;
				if (i >= this.roleList.length) break;
				const e = this.roleList[i];

				const Y = 290 + off * 75;

				MainCanvas.textAlign = "center";
				DrawText(`${e.name}`, 383, Y + 34, "Black");
				DrawText(`${e.memberNumber}`, 780, Y + 34, "Black");
				DrawText(`${e.type === ("Character" || "Player") ? "" : e.type}`, 1100, Y + 34, "Black");

				DrawEmptyRect(175, Y + 69, 1105, 0, "#ddd");
				DrawButton(1340, Y, 150, 64, "Select", "White", "");

			}

			// Pagination
			const totalPages = Math.max(1, Math.ceil(this.roleList.length / PER_PAGE_COUNT));
			DrawBackNextButton(1605, 800, 300, 90, `${DialogFindPlayer("Page")} ${this.page + 1} / ${totalPages}`, "White", "", () => "", () => "");
		} else if (this.failed) {
			MainCanvas.textAlign = "center";
			DrawQueryErrorMessage(`get data from ${this.character.Name}`);
		} else {
			MainCanvas.textAlign = "center";
			DrawText("Loading...", 1000, 480, "Black");
		}

		MainCanvas.textAlign = "left";
		DrawText(`Please select a member.`, 125, 125, "Black", "Gray");
		MainCanvas.textAlign = "center";
		DrawButton(1815, 75, 90, 90, "", "White", "Icons/Exit.png", "Back");

		DrawEmptyRect(125, 176, 1441, 0, "Black");

		DrawText(`Name`, 383, 222, "Black");
		DrawText(`Member number`, 780, 222, "Black");
		DrawText(`Note`, 1100, 222, "Black");

		DrawEmptyRect(125, 265, 1441, 0, "Black");
	}

	Click() {
		if (MouseIn(1815, 75, 90, 90)) return this.Exit();

		if (this.roleData !== null) {

			//reset button
			const elem = document.getElementById("BCX_Filter") as HTMLInputElement | undefined;
			if (MouseIn(1510, 92, 64, 64) && elem) {
				elem.value = "";
				this.refreshScreen();
			}

			for (let off = 0; off < PER_PAGE_COUNT; off++) {
				const i = this.page * PER_PAGE_COUNT + off;
				if (i >= this.roleList.length) break;
				const e = this.roleList[i];

				const Y = 290 + off * 75;

				if (MouseIn(1340, Y, 150, 64)) {
					this.callback(e.memberNumber);
					this.Exit();
					return;
				}
			}

			// Pagination
			const totalPages = Math.ceil(this.roleList.length / PER_PAGE_COUNT);
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
	}

	Exit() {
		setSubscreen(this.back);
	}

	Unload() {
		ElementRemove("BCX_Filter");
	}
}
