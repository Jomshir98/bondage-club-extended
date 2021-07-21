import { ChatroomCharacter } from "../characters";
import { setSubscreen } from "../modules/gui";
import { modStorage } from "../modules/storage";
import { getVisibleGroupName } from "../utilsClub";
import { GuiMainMenu } from "./mainmenu";
import { GuiSubscreen } from "./subscreen";

export class GuiCurses extends GuiSubscreen {

	readonly character: ChatroomCharacter;

	constructor(character: ChatroomCharacter) {
		super();
		this.character = character;
	}

	Load() {
		// On screen load
	}

	Run() {
		// On each frame

		// items
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

			// TODO: Actual data
			const itemIsCursed = modStorage.cursedItems?.[group.Name] != null;


			DrawButton(106 + 281 * column, 240 + 69 * row, 265, 54, getVisibleGroupName(group), itemIsCursed ? "Grey" : (currentItem ? "Gold" : "White"), undefined, currentItem ? currentItem.Asset.Description : "Nothing", itemIsCursed);
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

			// TODO: Actual data
			const clothingIsCursed = modStorage.cursedItems?.[group.Name] != null;


			DrawButton(951 + 281 * column, 240 + 69 * row, 265, 54, getVisibleGroupName(group), clothingIsCursed ? "Grey" : (currentItem ? "Gold" : "White"), undefined, currentItem ? currentItem.Asset.Description : "Nothing", clothingIsCursed);
		}

		//Body
		// TODO: Actual data

		// const bodyIsCursed = false;
		// DrawButton(1600, 750, 300, 140, "Character Body", bodyIsCursed ? "Grey" : "White", undefined, "Size, skin color, eyes, etc.", bodyIsCursed);

		MainCanvas.textAlign = "left";
		DrawText(`- Curses: Place a new curse on ${this.character.Name} -`, 125, 125, "Black", "Gray");
		MainCanvas.textAlign = "center";
		DrawButton(1815, 75, 90, 90, "", "White", "Icons/Exit.png", "BCX main menu");
	}

	Click() {
		// On click

		if (MouseIn(1815, 75, 90, 90)) return this.Exit();

	}

	Exit() {
		setSubscreen(new GuiMainMenu(this.character));
	}

	Unload() {
		// On screen unload
	}
}
