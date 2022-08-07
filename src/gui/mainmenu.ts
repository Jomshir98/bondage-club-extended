import { ChatroomCharacter } from "../characters";
import { ModuleCategory, MODULE_ICONS, MODULE_NAMES, TOGGLEABLE_MODULES } from "../constants";
import { GuiAuthorityRoles } from "./authority_roles";
import { GuiGlobal } from "./global";
import { GuiLog } from "./log";
import { GuiMisc } from "./misc";
import { GuiExportImportMain } from "./export_import_main";
import { GuiRelationships } from "./relationships";
import { GuiSubscreen } from "./subscreen";
import { setSubscreen } from "../modules/gui";
import { VERSION } from "../config";
import { icon_discord, icon_ExternalLink, icon_heart, icon_patreon } from "../resources";
import { drawIcon, DrawImageEx } from "../utilsClub";
import { GuiConditionViewCurses } from "./conditions_view_curses";
import { GuiConditionViewRules } from "./conditions_view_rules";
import { GuiTutorial } from "./tutorial";
import { setSupporterVisible, supporterStatus, versionCheckNewAvailable } from "../modules/versionCheck";
import { modStorage, modStorageSync } from "../modules/storage";
import { GuiCommandsModule } from "./commands_module";

const MAIN_MENU_ITEMS: { module: ModuleCategory; onclick: (C: ChatroomCharacter) => void; }[] = [
	{
		module: ModuleCategory.Global,
		onclick: (C) => {
			setSubscreen(new GuiGlobal(C));
		}
	},
	{
		module: ModuleCategory.Authority,
		onclick: (C) => {
			setSubscreen(new GuiAuthorityRoles(C));
		}
	},
	{
		module: ModuleCategory.Log,
		onclick: (C) => {
			setSubscreen(new GuiLog(C));
		}
	},
	{
		module: ModuleCategory.Curses,
		onclick: (C) => {
			setSubscreen(new GuiConditionViewCurses(C));
		}
	},
	{
		module: ModuleCategory.Rules,
		onclick: (C) => {
			setSubscreen(new GuiConditionViewRules(C));
		}
	},
	{
		module: ModuleCategory.Commands,
		onclick: (C) => {
			setSubscreen(new GuiCommandsModule(C));
		}
	},
	{
		module: ModuleCategory.Relationships,
		onclick: (C) => {
			setSubscreen(new GuiRelationships(C));
		}
	},
	{
		module: ModuleCategory.ExportImport,
		onclick: (C) => {
			setSubscreen(new GuiExportImportMain(C));
		}
	},
	{
		module: ModuleCategory.Misc,
		onclick: (C) => {
			setSubscreen(new GuiMisc(C));
		}
	}
];

export class GuiMainMenu extends GuiSubscreen {

	readonly character: ChatroomCharacter;

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
		let heartSteps: [number, string][] | undefined;

		DrawText("- Bondage Club Extended -", 125, 125, "Black", "Gray");
		DrawButton(1815, 75, 90, 90, "", "White", "Icons/Exit.png");
		DrawButton(1815, 190, 90, 90, "", "White", "Icons/Question.png", "Show the BCX tutorial again");

		if (this.character.supporterStatus === "supporter") {
			DrawText("BCX Supporter", 690, 125, "#DAA520", "#FFD700");
			heartSteps = [
				[0.7, "#fff3b3"],
				[0.75, "#ffef99"],
				[0.8, "#ffeb80"],
				[0.85, "#ffe766"],
				[0.9, "#ffe34d"],
				[0.95, "#ffdf33"],
				[1, "#ffdb19"],
				[1, "#FFD700"],
				[1, "#FFD700"],
				[1, "#FFD700"],
				[1, "#FFD700"]
			];
		} else if (this.character.supporterStatus === "developer") {
			DrawText("BCX Developer", 690, 125, "#6e6eff", "Black");
			heartSteps = [
				[1, "#37377f"],
				[1, "#424299"],
				[1, "#4d4db2"],
				[1, "#5858cc"],
				[1, "#6363e5"],
				[1, "#6e6eff"],
				[1, "#6e6eff"],
				[1, "#6e6eff"],
				[1, "#6e6eff"]
			];
		}
		if (this.character.supporterStatus !== undefined && heartSteps) {
			const heartTick = Math.floor((Date.now() / 60) % (2 * heartSteps.length));
			const heartStep = heartSteps[(heartTick < heartSteps.length) ? heartTick : (2 * heartSteps.length - 1 - heartTick)];
			drawIcon(MainCanvas, icon_heart, 630, 100, 50, 50, 50, heartStep[0], 4, heartStep[1]);
		}

		if (this.character.isPlayer() && modStorage.menuShouldDisplayTutorialHelp) {
			MainCanvas.beginPath();
			MainCanvas.rect(950, 190, 850, 90);
			MainCanvas.fillStyle = "Black";
			MainCanvas.fill();
			DrawText(`New advanced tutorial pages are now available ►`, 980, 190 + 45, "White");
		}

		for (let i = 0; i < MAIN_MENU_ITEMS.length; i++) {
			const e = MAIN_MENU_ITEMS[i];
			const PX = Math.floor(i / 6);
			const PY = i % 6;

			const isDisabled = this.disabledModules.includes(e.module);

			DrawButton(150 + 430 * PX, 190 + 120 * PY, 400, 90, "", isDisabled ? "#ddd" : "White", MODULE_ICONS[e.module],
				isDisabled ? "Module is deactivated" : "", isDisabled);
			DrawTextFit(MODULE_NAMES[e.module], 250 + 430 * PX, 235 + 120 * PY, 310, "Black");
		}

		MainCanvas.textAlign = "center";
		if (this.character.isPlayer()) {
			if (supporterStatus !== undefined) {
				DrawCheckbox(1450, 380, 64, 64, "", !modStorage.supporterHidden);
				DrawTextFit("Show your BCX Supporter", 1694, 391, 330, "Black");
				DrawTextFit("Heart to all BCX users", 1669, 433, 294, "Black");
			}
			DrawText(`Your BCX version: ${VERSION.replace(/-[0-f]+$/i, "")}`, 1450 + 400 / 2, 500, "Black", "");
			DrawButton(1450, 590, 400, 90, "", "White", "", "Open changelog on GitHub");
			if (versionCheckNewAvailable === true) {
				const tick = Date.now() % 6_000;
				if (tick < 3_000) {
					DrawText(`New version available`, 1450 + 400 / 2, 555, "Red", "Black");
				} else {
					DrawText(`Login again to upgrade`, 1450 + 400 / 2, 555, "Red", "Black");
				}
			} else if (versionCheckNewAvailable === false) {
				DrawText(`This is the latest version`, 1450 + 400 / 2, 555, "Black", "");
			}
			DrawText(`View changelog`, 1450 + 350 / 2, 635, "Black", "");
			DrawImageEx(icon_ExternalLink, 1770, 620, { Width: 30, Height: 30 });
			DrawButton(1450, 700, 400, 90, "", "White", "", "For saying 'thank you' with a tip");
			MainCanvas.textAlign = "left";
			DrawText(`BCX Patreon`, 1450 + 90, 745, "Black", "");
			drawIcon(MainCanvas, icon_patreon, 1450 + 10, 693 + 17, 70, 70, 180, 1, 0, "Black", "");
			DrawImageEx(icon_ExternalLink, 1770, 730, { Width: 30, Height: 30 });
			DrawButton(1450, 810, 400, 90, "", "White", "", "Open invite to BCX Discord server");
			DrawText(`BCX Discord`, 1455 + 90, 855, "Black", "");
			drawIcon(MainCanvas, icon_discord, 1450 + 10, 810 + 17, 1, 1, 1, 1, 0, "#5865F2", "");
			DrawImageEx(icon_ExternalLink, 1770, 840, { Width: 30, Height: 30 });
			MainCanvas.textAlign = "center";
		} else {
			DrawText(`Your BCX version: ${VERSION.replace(/-[0-f]+$/i, "")}`, 1450 + 400 / 2, 765, "Black", "");
			DrawText(`${this.character.Name}'s BCX version: ${this.character.BCXVersion?.replace(/-[0-f]+$/i, "")}`, 1450 + 400 / 2, 845, "Black", "");
		}
	}

	Click() {
		if (MouseIn(1815, 75, 90, 90)) return this.Exit();

		if (MouseIn(1815, 190, 90, 90)) {
			if (modStorage.menuShouldDisplayTutorialHelp) {
				delete modStorage.menuShouldDisplayTutorialHelp;
				modStorageSync();
			}
			setSubscreen(new GuiTutorial(this.character, false));
		}

		// BCX Supporter Heart toggle
		if (MouseIn(1450, 380, 64, 64) && this.character.isPlayer()) {
			setSupporterVisible(!!modStorage.supporterHidden);
		}

		// Changelog
		if (MouseIn(1450, 590, 400, 90) && this.character.isPlayer()) {
			window.open(`https://github.com/Jomshir98/bondage-club-extended/blob/${BCX_DEVEL ? "master" : "stable"}/CHANGELOG.md`, "_blank");
		}
		// Patreon
		if (MouseIn(1450, 700, 400, 90) && this.character.isPlayer()) {
			window.open(`https://patreon.com/Jomshir98`, "_blank");
		}
		// Discord invite
		if (MouseIn(1450, 810, 400, 90) && this.character.isPlayer()) {
			window.open("https://discord.gg/SHJMjEh9VH", "_blank");
		}

		for (let i = 0; i < MAIN_MENU_ITEMS.length; i++) {
			const e = MAIN_MENU_ITEMS[i];
			const PX = Math.floor(i / 6);
			const PY = i % 6;
			if (MouseIn(150 + 430 * PX, 190 + 120 * PY, 400, 90) && !this.disabledModules.includes(e.module)) {
				return e.onclick(this.character);
			}
		}
	}
}
