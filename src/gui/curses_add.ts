import { ChatroomCharacter } from "../characters";
import { setSubscreen } from "../modules/gui";
import { getVisibleGroupName, showHelp } from "../utilsClub";
import { GuiSubscreen } from "./subscreen";
import { ConditionsLimit } from "../constants";
import { GuiConditionViewCurses } from "./conditions_view_curses";
import { Views, HELP_TEXTS } from "../helpTexts";

export class GuiCursesAdd extends GuiSubscreen {

	readonly character: ChatroomCharacter;

	private curseData: ConditionsCategoryPublicData<"curses"> | null = null;
	private failed: boolean = false;
	private permissionMode: boolean = false;

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
		this.curseData = null;
		this.character.conditionsGetByCategory("curses").then(res => {
			this.curseData = res;
			if (!this.curseData.access_changeLimits) {
				this.permissionMode = false;
			}
		}, err => {
			console.error(`BCX: Failed to get permission info for ${this.character}`, err);
			this.failed = true;
		});
	}

	Run() {
		MainCanvas.textAlign = "left";
		DrawText(`- Curses: Place new curses on ${this.character.Name} -`, 125, 125, "Black", "Gray");
		MainCanvas.textAlign = "center";
		DrawButton(1815, 75, 90, 90, "", "White", "Icons/Exit.png", "Back");
		DrawButton(1815, 190, 90, 90, "", "White", "Icons/Question.png");

		if (this.curseData === null) {
			DrawText(this.failed ? `Failed to get curse data from ${this.character.Name}. Maybe you have no access?` : "Loading...", 1000, 480, "Black");
			return;
		}

		DrawButton(1815, 305, 90, 90, "",
			this.curseData.access_changeLimits ? "White" : "#ddd",
			this.permissionMode ? "Icons/Reset.png" : "Icons/Preference.png",
			this.curseData.access_changeLimits ?
				(this.permissionMode ? "Leave permission mode" : "Edit curse slot permissions") :
				"You have no permission to change limits",
			!this.curseData.access_changeLimits
		);

		// items
		MainCanvas.textAlign = "left";
		MainCanvas.beginPath();
		MainCanvas.rect(105, 165, 830, 64);
		MainCanvas.fillStyle = "#cccccc";
		MainCanvas.fill();
		DrawText(`Items`, 120, 165 + 34, "Black");
		MainCanvas.textAlign = "center";

		if (!this.permissionMode) {
			DrawButton(440, 173, 265, 48, "Curse occupied", "White", undefined, "Curse all items on the body at once");
			DrawButton(720, 173, 200, 48, "Curse all", "White", undefined, "Curse all item slots at once");
		}

		const AssetGroupItems = AssetGroup.filter(g => g.Category === "Item");
		for (let i = 0; i < AssetGroupItems.length; i++) {
			const row = i % 10;
			const column = Math.floor(i / 10);
			const group = AssetGroupItems[i];

			const currentItem = InventoryGet(this.character.Character, group.Name);

			const itemIsCursed = this.curseData.conditions[group.Name] !== undefined;
			const accessLevel = this.curseData.limits[group.Name] ?? ConditionsLimit.normal;
			const allowCurse = [this.curseData.access_normal, this.curseData.access_limited, false][accessLevel];
			let color: string;
			let text: string;
			if (this.permissionMode) {
				color = ["#ccfece", "#fefc53", "red"][accessLevel];
				text = ["Normal", "Limited", "Blocked"][accessLevel];
			} else {
				color = itemIsCursed ? "#88c" :
					!allowCurse ? "#ccc" :
						(currentItem ? "Gold" : "White");
				text = itemIsCursed ? "Already cursed" :
					!allowCurse ? "You have no permission to curse this" :
						(currentItem ? currentItem.Asset.Description : "Nothing");
			}

			DrawButton(106 + 281 * column, 240 + 69 * row, 265, 54, getVisibleGroupName(group),
				color, undefined,
				text, itemIsCursed || !allowCurse || this.permissionMode);
		}

		// clothing
		MainCanvas.textAlign = "left";
		MainCanvas.beginPath();
		MainCanvas.rect(950, 165, 830, 64);
		MainCanvas.fillStyle = "#cccccc";
		MainCanvas.fill();
		DrawText(`Clothing`, 965, 165 + 34, "Black");
		MainCanvas.textAlign = "center";

		if (!this.permissionMode) {
			DrawButton(1285, 173, 265, 48, "Curse occupied", "White", undefined, "Curse all clothes on the body at once");
			DrawButton(1565, 173, 200, 48, "Curse all", "White", undefined, "Curse all clothing slots at once");
		}

		const AssetGroupClothings = AssetGroup.filter(g => g.Category === "Appearance" && g.Clothing);
		for (let i = 0; i < AssetGroupClothings.length; i++) {
			const row = i % 10;
			const column = Math.floor(i / 10);
			const group = AssetGroupClothings[i];

			const currentItem = InventoryGet(this.character.Character, group.Name);

			const clothingIsCursed = this.curseData.conditions[group.Name] !== undefined;
			const accessLevel = this.curseData.limits[group.Name] ?? ConditionsLimit.normal;
			const allowCurse = [this.curseData.access_normal, this.curseData.access_limited, false][accessLevel];
			let color: string;
			let text: string;
			if (this.permissionMode) {
				color = ["#ccfece", "#fefc53", "red"][accessLevel];
				text = ["Normal", "Limited", "Blocked"][accessLevel];
			} else {
				color = clothingIsCursed ? "#88c" :
					!allowCurse ? "#ccc" :
						(currentItem ? "Gold" : "White");
				text = clothingIsCursed ? "Already cursed" :
					!allowCurse ? "You have no permission to curse this" :
						(currentItem ? currentItem.Asset.Description : "Nothing");
			}
			DrawButton(951 + 281 * column, 240 + 69 * row, 265, 54, getVisibleGroupName(group),
				color, undefined,
				text, clothingIsCursed || !allowCurse || this.permissionMode);
		}

		//Body
		// TODO: Actual data

		// const bodyIsCursed = false;
		// DrawButton(1600, 750, 300, 140, "Character Body", bodyIsCursed ? "#ccc" : "White", undefined,
		//	bodyIsCursed ? "Already cursed" : "Size, skin color, eyes, etc.", bodyIsCursed);

		// permission mode legend
		if (this.permissionMode) {
			MainCanvas.fillStyle = "#ccfece";
			MainCanvas.fillRect(1284, 75, 166, 64);
			MainCanvas.fillStyle = "#fefc53";
			MainCanvas.fillRect(1284 + 1 * 166, 75, 166, 64);
			MainCanvas.fillStyle = "red";
			MainCanvas.fillRect(1284 + 2 * 166, 75, 165, 64);

			MainCanvas.textAlign = "center";
			DrawText(`Normal`, 1284 + 166 / 2, 75 + 34, "Black");
			DrawText(`Limited`, 1284 + 1 * 166 + 166 / 2, 75 + 34, "Black");
			DrawText(`Blocked`, 1284 + 2 * 166 + 166 / 2, 75 + 34, "Black");
		}

		// help text
		if (this.showHelp) {
			showHelp(HELP_TEXTS[this.permissionMode ? Views.CursesAddPermissionMode : Views.CursesAdd]);
		}
	}

	Click() {
		if (MouseIn(1815, 75, 90, 90)) return this.Exit();
		if (MouseIn(1815, 190, 90, 90)) {
			this.showHelp = !this.showHelp;
			return;
		}

		if (this.curseData === null)
			return;

		// Permission mode
		if (MouseIn(1815, 305, 90, 90)) {
			this.permissionMode = this.curseData.access_changeLimits && !this.permissionMode;
			return;
		}

		// items

		const AssetGroupItems = AssetGroup.filter(g => g.Category === "Item");
		for (let i = 0; i < AssetGroupItems.length; i++) {
			const row = i % 10;
			const column = Math.floor(i / 10);
			const group = AssetGroupItems[i];

			const itemIsCursed = this.curseData.conditions[group.Name] !== undefined;

			if (MouseIn(106 + 281 * column, 240 + 69 * row, 265, 54)) {
				if (this.permissionMode) {
					const accessLevel = this.curseData.limits[group.Name] ?? ConditionsLimit.normal;
					this.character.conditionSetLimit("curses", group.Name, (accessLevel + 1) % 3);
				} else if (!itemIsCursed) {
					this.character.curseItem(group.Name, null);
				}
				return;
			}
		}

		if (MouseIn(440, 173, 265, 48) && !this.permissionMode) {
			this.character.curseBatch("items", false);
			return;
		}

		if (MouseIn(720, 173, 200, 48) && !this.permissionMode) {
			this.character.curseBatch("items", true);
			return;
		}

		// clothing

		const AssetGroupClothings = AssetGroup.filter(g => g.Category === "Appearance" && g.Clothing);
		for (let i = 0; i < AssetGroupClothings.length; i++) {
			const row = i % 10;
			const column = Math.floor(i / 10);
			const group = AssetGroupClothings[i];

			const clothingIsCursed = this.curseData.conditions[group.Name] !== undefined;

			if (MouseIn(951 + 281 * column, 240 + 69 * row, 265, 54)) {
				if (this.permissionMode) {
					const accessLevel = this.curseData.limits[group.Name] ?? ConditionsLimit.normal;
					this.character.conditionSetLimit("curses", group.Name, (accessLevel + 1) % 3);
				} else if (!clothingIsCursed) {
					this.character.curseItem(group.Name, null);
				}
				return;
			}
		}

		if (MouseIn(1285, 173, 265, 48) && !this.permissionMode) {
			this.character.curseBatch("clothes", false);
			return;
		}

		if (MouseIn(1565, 173, 200, 48) && !this.permissionMode) {
			this.character.curseBatch("clothes", true);
			return;
		}
	}

	Exit() {
		setSubscreen(new GuiConditionViewCurses(this.character));
	}
}
