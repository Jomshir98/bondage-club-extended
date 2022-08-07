import { ChatroomCharacter } from "../characters";
import { ModuleCategory, MODULE_ICONS, TOGGLEABLE_MODULES } from "../constants";
import { GuiSubscreen } from "./subscreen";
import { GuiExportImportSelected } from "./export_import_selected";
import { showHelp } from "../utilsClub";
import { Views, HELP_TEXTS } from "../helpTexts";
import { setSubscreen } from "../modules/gui";
import { ExportImportCategories } from "../modules/export_import";
import { GuiMainMenu } from "./mainmenu";

export class GuiExportImportMain extends GuiSubscreen {

	readonly character: ChatroomCharacter;

	private showHelp: boolean = false;

	private disabledModules: readonly ModuleCategory[] = TOGGLEABLE_MODULES;

	constructor(character: ChatroomCharacter) {
		super();
		this.character = character;
	}

	Load() {
		this.character.getDisabledModules(5_000).then(data => {
			this.disabledModules = data;
		}).catch(e => {
			this.disabledModules = [];
			console.error(`BCX: error getting disabled modules`, e);
		});
	}

	onChange(source: number) {
		if (source === this.character.MemberNumber) {
			this.Load();
		}
	}

	Run() {

		DrawText(`- Export / Import of BCX module configurations on ${this.character.Name} -`, 125, 125, "Black", "Gray");
		DrawButton(1815, 75, 90, 90, "", "White", "Icons/Exit.png", "BCX main menu");
		DrawButton(1815, 190, 90, 90, "", "White", "Icons/Question.png");

		for (let i = 0; i < ExportImportCategories.length; i++) {
			const e = ExportImportCategories[i];
			const PX = Math.floor(i / 6);
			const PY = i % 6;

			const isDisabled = this.disabledModules.includes(e.module);

			DrawButton(150 + 530 * PX, 190 + 120 * PY, 500, 90, "", isDisabled ? "#ddd" : "White", MODULE_ICONS[e.module],
				isDisabled ? "Module is deactivated" : "", isDisabled);
			DrawTextFit(e.name, 250 + 530 * PX, 235 + 120 * PY, 390, "Black");
		}

		MainCanvas.textAlign = "left";
		// help text
		if (this.showHelp) {
			showHelp(HELP_TEXTS[Views.ExportImportMain]);
		}
	}

	Click() {
		if (MouseIn(1815, 75, 90, 90)) return this.Exit();

		if (MouseIn(1815, 190, 90, 90)) {
			this.showHelp = !this.showHelp;
			return;
		}

		for (let i = 0; i < ExportImportCategories.length; i++) {
			const e = ExportImportCategories[i];

			const PX = Math.floor(i / 6);
			const PY = i % 6;
			if (MouseIn(150 + 530 * PX, 190 + 120 * PY, 500, 90) && !this.disabledModules.includes(e.module)) {
				setSubscreen(new GuiExportImportSelected(this.character, e));
			}
		}
	}

	Exit() {
		setSubscreen(new GuiMainMenu(this.character));
	}
}
