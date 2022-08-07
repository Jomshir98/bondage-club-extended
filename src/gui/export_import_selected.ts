import { ChatroomCharacter } from "../characters";
import { GuiSubscreen } from "./subscreen";
import { Views, HELP_TEXTS } from "../helpTexts";
import { ExportImportCategoryDefinition } from "../modules/export_import";
import { setSubscreen } from "../modules/gui";
import { GuiExportImportMain } from "./export_import_main";
import { BCX_setTimeout } from "../BCXContext";

export class GuiExportImportSelected extends GuiSubscreen {

	readonly character: ChatroomCharacter;
	readonly category: Readonly<ExportImportCategoryDefinition<any>>;

	private showHelp: boolean = false;
	private exportCompress: boolean = true;

	constructor(character: ChatroomCharacter, category: Readonly<ExportImportCategoryDefinition<any>>) {
		super();
		this.character = character;
		this.category = category;
	}

	Load() {
		let input = document.getElementById(`BCX_EI`) as HTMLTextAreaElement | undefined;
		if (!input) {
			input = document.createElement("textarea");
			input.id = `BCX_EI`;
			input.name = `BCX_EI`;
			input.value = HELP_TEXTS[Views.ExportImportSelect];
			input.readOnly = true;
			input.disabled = true;
			input.setAttribute("screen-generated", CurrentScreen);
			input.className = "HideOnPopup";
			document.body.appendChild(input);
		}
		document.addEventListener("paste", this.pasteListenredBound);
	}

	Unload() {
		document.getElementById(`BCX_EI`)?.remove();
		document.removeEventListener("paste", this.pasteListenredBound);
	}

	Run() {

		DrawText(`- Export / Import of ${this.category.name} on ${this.character.Name} -`, 125, 125, "Black", "Gray");
		DrawButton(1815, 75, 90, 90, "", "White", "Icons/Exit.png");

		MainCanvas.textAlign = "center";
		DrawButton(120, 180, 400, 90, "Export", "White", "", "Export current config");

		DrawButton(620, 180, 400, 90, "Import", "White", "", "Try to import a previously exported config");

		ElementPositionFix(`BCX_EI`, 36, 105, 380, 1790, 500);

		MainCanvas.textAlign = "left";
		DrawCheckbox(125, 290, 64, 64, "Export compressed", this.exportCompress);

	}

	Click() {
		if (MouseIn(1815, 75, 90, 90)) return this.Exit();

		const input = document.getElementById(`BCX_EI`) as HTMLTextAreaElement | undefined;

		if (MouseIn(120, 180, 400, 90) && input) {
			input.disabled = false;
			input.value = "Exporting...";
			BCX_setTimeout(async () => {
				try {
					const result = await this.character.exportImportDoExport(this.category.category, this.exportCompress);
					await navigator.clipboard.writeText(result);
					input.value = "Exported to clipboard!";
				} catch (err) {
					console.warn("Export failed:", err);
					input.value = "Export failed:\n" + String(err);
				}
			}, 0);
			return;
		}

		if (MouseIn(620, 180, 400, 90) && input) {
			BCX_setTimeout(async () => {
				if (typeof navigator.clipboard.readText !== "function") {
					input.value = "Please press Ctrl+V";
					return;
				}
				const data = await navigator.clipboard.readText();
				input.disabled = false;
				input.value = "Importing...";
				try {
					input.value = await this.character.exportImportDoImport(this.category.category, data);
				} catch (err) {
					console.warn("Import failed:", err);
					input.value = "Import failed:\n" + String(err);
				}
			}, 0);
			return;
		}

		if (MouseIn(125, 290, 64, 64)) {
			this.exportCompress = !this.exportCompress;
			return;
		}
	}

	private pasteListener(ev: ClipboardEvent) {
		const input = document.getElementById(`BCX_EI`) as HTMLTextAreaElement | undefined;

		if (input) {
			ev.preventDefault();
			ev.stopImmediatePropagation();
			const data = ((ev.clipboardData || (window as any).clipboardData) as DataTransfer).getData("text");
			BCX_setTimeout(async () => {
				input.disabled = false;
				input.value = "Importing...";
				try {
					input.value = await this.character.exportImportDoImport(this.category.category, data);
				} catch (err) {
					console.warn("Import failed:", err);
					input.value = "Import failed:\n" + String(err);
				}
			}, 0);
		}
	}

	private readonly pasteListenredBound = this.pasteListener.bind(this);

	Exit() {
		setSubscreen(new GuiExportImportMain(this.character));
	}
}
