import { ChatroomCharacter } from "../characters";
import { ModuleCategory, MODULE_ICONS, MODULE_NAMES, TOGGLEABLE_MODULES } from "../constants";
import { GuiAuthorityRoles } from "./authority_roles";
import { GuiGlobal } from "./global";
import { GuiLog } from "./log";
import { GuiMisc } from "./misc";
import { GuiSubscreen } from "./subscreen";
import { setSubscreen } from "../modules/gui";
import { VERSION } from "../config";
import { icon_ExternalLink } from "../resources";
import { DrawImageEx } from "../utilsClub";
import { GuiConditionViewCurses } from "./conditions_view_curses";
import { GuiConditionViewRules } from "./conditions_view_rules";
import { GuiTutorial } from "./tutorial";
import { versionCheckNewAvailable } from "../modules/versionCheck";
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
		DrawText("- Bondage Club Extended -", 125, 125, "Black", "Gray");
		DrawButton(1815, 75, 90, 90, "", "White", "Icons/Exit.png");
		DrawButton(1815, 190, 90, 90, "", "White", "Icons/Question.png", "Show the BCX tutorial again");

		if (this.character.isPlayer() && modStorage.menuShouldDisplayTutorialHelp) {
			MainCanvas.beginPath();
			MainCanvas.rect(950, 190, 850, 90);
			MainCanvas.fillStyle = "Black";
			MainCanvas.fill();
			DrawText(`New advanced tutorial pages are now available ►`, 980, 190 + 45, "White");
		}

		for (let i = 0; i < MAIN_MENU_ITEMS.length; i++) {
			const e = MAIN_MENU_ITEMS[i];
			const PX = Math.floor(i / 7);
			const PY = i % 7;

			const isDisabled = this.disabledModules.includes(e.module);

			DrawButton(150 + 420 * PX, 160 + 110 * PY, 400, 90, "", isDisabled ? "#ddd" : "White", MODULE_ICONS[e.module],
				isDisabled ? "Module is deactivated" : "", isDisabled);
			DrawTextFit(MODULE_NAMES[e.module], 250 + 420 * PX, 205 + 110 * PY, 310, "Black");
		}

		MainCanvas.textAlign = "center";
		if (this.character.isPlayer()) {
			DrawText(`Your BCX version: ${VERSION.replace(/-[0-f]+$/i, "")}`, 1450 + 400 / 2, 610, "Black", "");
			DrawButton(1450, 700, 400, 90, "", "White", "", "Open changelog on GitHub");
			if (versionCheckNewAvailable === true) {
				const tick = Date.now() % 6_000;
				if (tick < 3_000) {
					DrawText(`New version available`, 1450 + 400 / 2, 665, "Red", "Black");
				} else {
					DrawText(`Login again to upgrade`, 1450 + 400 / 2, 665, "Red", "Black");
				}
			} else if (versionCheckNewAvailable === false) {
				DrawText(`This is the latest version`, 1450 + 400 / 2, 665, "Black", "");
			}
			DrawText(`View changelog`, 1450 + 350 / 2, 745, "Black", "");
			DrawImageEx(icon_ExternalLink, 1770, 730, { Width: 30, Height: 30 });
			DrawButton(1450, 810, 400, 90, "", "White", "", "Open invite to BCX Discord server");
			DrawText(`BCX Discord`, 1450 + 350 / 2, 855, "Black", "");
			DrawImageEx(icon_ExternalLink, 1770, 840, { Width: 30, Height: 30 });
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

		// Changelog
		if (MouseIn(1450, 700, 400, 90) && this.character.isPlayer()) {
			window.open(`https://github.com/Jomshir98/bondage-club-extended/blob/${BCX_DEVEL ? 'master' : 'stable'}/CHANGELOG.md`, "_blank");
		}
		// Discord invite
		if (MouseIn(1450, 810, 400, 90) && this.character.isPlayer()) {
			window.open("https://discord.gg/SHJMjEh9VH", "_blank");
		}

		for (let i = 0; i < MAIN_MENU_ITEMS.length; i++) {
			const e = MAIN_MENU_ITEMS[i];
			const PX = Math.floor(i / 7);
			const PY = i % 7;
			if (MouseIn(150 + 420 * PX, 160 + 110 * PY, 400, 90) && !this.disabledModules.includes(e.module)) {
				return e.onclick(this.character);
			}
		}
	}
}
