import { ChatroomCharacter } from "../characters";
import { setSubscreen } from "../modules/gui";
import { GuiMainMenu } from "./mainmenu";
import { GuiSubscreen } from "./subscreen";
import { drawIcon, DrawImageBCX, drawTypingIndicatorSpeechBubble } from "../utilsClub";
import { icon_heart } from "../resources";
import { clampWrap } from "../utils";
import { GuiWelcomeSelection } from "./welcome";

interface TutorialPage {
	name: string;
	image?: string;
	afterDraw?: () => void;
}

const TUTORIAL_PAGES: TutorialPage[] = [
	{
		name: "Welcome",
		image: "welcome.png",
		afterDraw() {
			DrawButton(1815, 190, 90, 90, "", "White", "Icons/Question.png", "", true);
			MainCanvas.save();
			MainCanvas.font = '28px "Arial", sans-serif';
			MainCanvas.textAlign = "left";
			DrawText(`Dear ${Player.Name},`, 285, 510, "Black");
			DrawTextWrap(
				`we are happy you are interested in our extension for the Bondage Club (BC) in which we invest a lot of our free time and love. If you have any questions, suggestions, or encounter any bugs, please feel free to get in touch with us on Discord. A button linking to it is in the main menu.`
				, 285 - 940 / 2, 544, 940, 160, "black");
			MainCanvas.restore();
		}
	},
	{
		name: "Quick overview",
		image: "quick_overview.png"
	},
	{
		name: "New chat room icons",
		image: "status_icons.png",
		afterDraw() {
			DrawCharacter(Player, 130, 100, 0.82, true, MainCanvas);
			drawIcon(MainCanvas, icon_heart, 450, 70, 50, 50, 50, 1, 4, "#6e6eff");
			const tick = Date.now() % 10_000;
			if (tick < 4_000 || tick > 6_000 && tick < 9_000) {
				drawTypingIndicatorSpeechBubble(MainCanvas, 450, 128, 50, 48, 1);
			}
		}
	},
	{
		name: "Introduction to roles and permissions",
		image: "basic_roles_permissions.png"
	},
	{
		name: "End of introduction",
		image: "basic_end.png",
		afterDraw() {
			DrawCharacter(Player, 240, 160, 0.78, true, MainCanvas);
		}
	}
	// Dive into log - it exists and has levels that are configurable (normal, limited, not logged), mention of notes/good/bad girl points.
	// Dive into curses - you can curse items, clothes and empty slots, which also curses color. You can also freeze item state (curse config) (no mention of item autoremoval)
	// Dive into rules - lots of rules, when you click on any it will give detailed explanation of the rule, so please read more on each individual rule
	// Limits system - Both curses and rules follow normal/limited/blocked. Rules also might start as limited/blocked and there is button to configure it
	// Conditions trigger system and timer - ...
	// Permissions 1 - There are roles, can be configured and how it is determined what applies for which role
	// Permissions 2 - Self access and min access - difference
	// Permissions 3 - Example how to use it and configure it
	// Recap on chat commands since the interactive tutorial cannot be retriggered
	// Afterword and thanks, mention that the best way to learn more is to ask
];

const TUTORIAL_BASIC_END = TUTORIAL_PAGES.findIndex(i => i.name === "End of introduction");

export class GuiTutorial extends GuiSubscreen {

	readonly character: ChatroomCharacter;

	private page = 0;
	public firstRun: boolean;

	constructor(character: ChatroomCharacter, firstRun: boolean) {
		super();
		this.character = character;
		this.firstRun = firstRun;
	}

	Load() {
		this.page = 0;
	}

	Run() {
		const currentPage = TUTORIAL_PAGES[this.page];

		MainCanvas.textAlign = "center";
		DrawText(`BCX TUTORIAL: ${currentPage.name}`, 1000, 125, "Black", "Gray");
		DrawButton(1500, 830, 300, 90, (this.firstRun && this.page < TUTORIAL_BASIC_END) ? "Skip tutorial" : "Close tutorial", "White");

		if (currentPage.image) {
			if (!DrawImageBCX("tutorial/" + currentPage.image, 200, 180)) {
				DrawText("Loading...", 1000, 500, "Black");
			}
		}
		if (currentPage.afterDraw) {
			currentPage.afterDraw();
		}

		DrawBackNextButton(850, 830, 300, 90, `Page ${this.page + 1}/${TUTORIAL_PAGES.length}`, "White", undefined, () => "", () => "");
	}

	Click() {
		if (MouseIn(1500, 830, 300, 90)) return this.Exit();

		if (MouseIn(850, 830, 150, 90)) {
			this.page = clampWrap(this.page - 1, 0, TUTORIAL_PAGES.length - 1);
		}
		if (MouseIn(1000, 830, 150, 90)) {
			this.page = clampWrap(this.page + 1, 0, TUTORIAL_PAGES.length - 1);
		}
	}

	Exit() {
		setSubscreen(this.firstRun ? new GuiWelcomeSelection(this.character) : new GuiMainMenu(this.character));
	}
}
