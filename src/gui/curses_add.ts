import { ChatroomCharacter } from "../characters";
import { setSubscreen } from "../modules/gui";
import { modStorage } from "../modules/storage";
import { GuiMainMenu } from "./mainmenu";
import { GuiSubscreen } from "./subscreen";

const GROUP_NAME_OVERRIDES: Record<string, string> = {
	"ItemNeckAccessories": "Collar Addon",
	"ItemNeckRestraints": "Collar Restraint",
	"ItemNipplesPiercings": "Nipple Piercing",
	"ItemHood": "Hood",
	"ItemMisc": "Miscellaneous",
	"ItemDevices": "Devices",
	"ItemHoodAddon": "Hood Addon",
	"ItemAddon": "General Addon",
	"ItemFeet": "Upper Leg",
	"ItemLegs": "Lower Leg",
	"ItemBoots": "Feet",
	"ItemMouth": "Mouth (1)",
	"ItemMouth2": "Mouth (2)",
	"ItemMouth3": "Mouth (3)"
};

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
		MainCanvas.fillStyle = "#eeeeee";
		MainCanvas.fill();
		DrawText(`Items`, 120, 165 + 34, "Black");

		const AssetGroupItems = AssetGroup.filter(g => g.Category === "Item");
		MainCanvas.textAlign = "center";
		for (let i = 0; i < AssetGroupItems.length; i++) {
			const row = i % 10;
			const column = Math.floor(i / 10);
			const group = AssetGroupItems[i];

			const currentItem = InventoryGet(this.character.Character, group.Name);

			const groupDescription = developmentMode ? group.Name : (GROUP_NAME_OVERRIDES[group.Name] ?? group.Description);

			// TODO: Actual data
			const itemIsCursed = modStorage.cursedItems?.[group.Name] != null;


			DrawButton(106 + 281 * column, 240 + 69 * row, 265, 54, groupDescription, itemIsCursed ? "Grey" : (currentItem ? "Gold" : "White"), undefined, currentItem ? currentItem.Asset.Description : "Nothing", itemIsCursed);
		}

		// clothing
		MainCanvas.textAlign = "left";
		MainCanvas.beginPath();
		MainCanvas.rect(950, 165, 830, 64);
		MainCanvas.fillStyle = "#eeeeee";
		MainCanvas.fill();
		DrawText(`Clothing`, 965, 165 + 34, "Black");

		const AssetGroupClothings = AssetGroup.filter(g => g.Category === "Appearance" && g.Clothing);
		MainCanvas.textAlign = "center";
		for (let i = 0; i < AssetGroupClothings.length; i++) {
			const row = i % 10;
			const column = Math.floor(i / 10);
			const group = AssetGroupClothings[i];

			const currentItem = InventoryGet(this.character.Character, group.Name);

			const groupDescription = developmentMode ? group.Name : (GROUP_NAME_OVERRIDES[group.Name] ?? group.Description);

			// TODO: Actual data
			const clothingIsCursed = modStorage.cursedItems?.[group.Name] != null;


			DrawButton(951 + 281 * column, 240 + 69 * row, 265, 54, groupDescription, clothingIsCursed ? "Grey" : (currentItem ? "Gold" : "White"), undefined, currentItem ? currentItem.Asset.Description : "Nothing", clothingIsCursed);
		}

		//Body
		// TODO: Actual data
		const bodyIsCursed = false;
		DrawButton(1600, 750, 300, 140, "Character Body", bodyIsCursed ? "Grey" : "White", undefined, "Size, skin color, eyes, etc.", bodyIsCursed);

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
