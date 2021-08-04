import { ChatroomCharacter } from "../characters";
import { setSubscreen } from "../modules/gui";
import { getVisibleGroupName } from "../utilsClub";
import { GuiSubscreen } from "./subscreen";
import { GuiCurses } from "./curses";

export class GuiCursesAdd extends GuiSubscreen {

	readonly character: ChatroomCharacter;

	private curseData: BCX_curseInfo | null = null;
	private failed: boolean = false;

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
		this.character.curseGetInfo().then(res => {
			this.curseData = res;
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

		if (this.curseData === null) {
			DrawText(this.failed ? `Failed to get curse data from ${this.character.Name}. Maybe you have no access?` : "Loading...", 1000, 480, "Black");
			return;
		}

		// items
		MainCanvas.textAlign = "left";
		MainCanvas.beginPath();
		MainCanvas.rect(105, 165, 830, 64);
		MainCanvas.fillStyle = "#cccccc";
		MainCanvas.fill();
		DrawText(`Items`, 120, 165 + 34, "Black");
		MainCanvas.textAlign = "center";
		// TODO: Put back in when logic is ready
		// DrawButton(440, 173, 265, 48, "Curse occupied", "White", undefined, "Curse all items on the body at once");
		// DrawButton(720, 173, 200, 48, "Curse all", "White", undefined, "Curse all item slots at once");

		const AssetGroupItems = AssetGroup.filter(g => g.Category === "Item");
		for (let i = 0; i < AssetGroupItems.length; i++) {
			const row = i % 10;
			const column = Math.floor(i / 10);
			const group = AssetGroupItems[i];

			const currentItem = InventoryGet(this.character.Character, group.Name);

			const itemIsCursed = this.curseData.curses[group.Name] !== undefined;

			DrawButton(106 + 281 * column, 240 + 69 * row, 265, 54, getVisibleGroupName(group),
				itemIsCursed ? "#ccc" : (currentItem ? "Gold" : "White"), undefined,
				itemIsCursed ? "Already cursed" : (currentItem ? currentItem.Asset.Description : "Nothing"), itemIsCursed);
		}

		// clothing
		MainCanvas.textAlign = "left";
		MainCanvas.beginPath();
		MainCanvas.rect(950, 165, 830, 64);
		MainCanvas.fillStyle = "#cccccc";
		MainCanvas.fill();
		DrawText(`Clothing`, 965, 165 + 34, "Black");
		MainCanvas.textAlign = "center";

		// TODO: Put back in when logic is ready
		// DrawButton(1285, 173, 265, 48, "Curse occupied", "White", undefined, "Curse all clothes on the body at once");
		// DrawButton(1565, 173, 200, 48, "Curse all", "White", undefined, "Curse all clothing slots at once");

		const AssetGroupClothings = AssetGroup.filter(g => g.Category === "Appearance" && g.Clothing);
		for (let i = 0; i < AssetGroupClothings.length; i++) {
			const row = i % 10;
			const column = Math.floor(i / 10);
			const group = AssetGroupClothings[i];

			const currentItem = InventoryGet(this.character.Character, group.Name);

			const clothingIsCursed = this.curseData.curses[group.Name] !== undefined;

			DrawButton(951 + 281 * column, 240 + 69 * row, 265, 54, getVisibleGroupName(group),
				clothingIsCursed ? "#ccc" : (currentItem ? "Gold" : "White"), undefined,
				clothingIsCursed ? "Already cursed" : (currentItem ? currentItem.Asset.Description : "Nothing"), clothingIsCursed);
		}

		//Body
		// TODO: Actual data

		// const bodyIsCursed = false;
		// DrawButton(1600, 750, 300, 140, "Character Body", bodyIsCursed ? "#ccc" : "White", undefined,
		//	bodyIsCursed ? "Already cursed" : "Size, skin color, eyes, etc.", bodyIsCursed);
	}

	Click() {
		if (MouseIn(1815, 75, 90, 90)) return this.Exit();

		if (this.curseData === null)
			return;

		// items

		const AssetGroupItems = AssetGroup.filter(g => g.Category === "Item");
		for (let i = 0; i < AssetGroupItems.length; i++) {
			const row = i % 10;
			const column = Math.floor(i / 10);
			const group = AssetGroupItems[i];

			const itemIsCursed = this.curseData.curses[group.Name] !== undefined;

			if (MouseIn(106 + 281 * column, 240 + 69 * row, 265, 54) && !itemIsCursed) {
				this.character.curseItem(group.Name, null);
				return;
			}
		}

		// clothing

		const AssetGroupClothings = AssetGroup.filter(g => g.Category === "Appearance" && g.Clothing);
		for (let i = 0; i < AssetGroupClothings.length; i++) {
			const row = i % 10;
			const column = Math.floor(i / 10);
			const group = AssetGroupClothings[i];

			const clothingIsCursed = this.curseData.curses[group.Name] !== undefined;

			if (MouseIn(951 + 281 * column, 240 + 69 * row, 265, 54) && !clothingIsCursed) {
				this.character.curseItem(group.Name, null);
				return;
			}
		}
	}

	Exit() {
		setSubscreen(new GuiCurses(this.character));
	}
}
