import { ChatroomCharacter } from "../characters";
import { setSubscreen } from "../modules/gui";
import { GuiSubscreen } from "./subscreen";
import { dictionaryProcess } from "../utils";
import { CommandsGetDisplayDefinition } from "../modules/commandsModule";
import { BCXDrawTextWrap } from "../utilsClub";

export class GuiCommandsModuleViewDetails extends GuiSubscreen {

	readonly character: ChatroomCharacter;
	readonly back: GuiSubscreen;

	readonly command: BCX_Command;
	readonly commandDefinition: CommandDisplayDefinition;

	constructor(character: ChatroomCharacter, back: GuiSubscreen, command: BCX_Command) {
		super();
		this.character = character;
		this.back = back;
		this.command = command;
		this.commandDefinition = CommandsGetDisplayDefinition(command);
	}

	onChange(sender: number) {
		if (sender === this.character.MemberNumber) {
			this.Exit();
		}
	}

	Run() {
		MainCanvas.textAlign = "left";
		DrawText(`- Commands: Description of the command: "${this.commandDefinition.name}" -`, 125, 125, "Black", "Gray");

		BCXDrawTextWrap(
			dictionaryProcess(
				this.commandDefinition.longDescription,
				{
					PLAYER_NAME: this.character.Name,
					HELP_DESCRIPTION: this.commandDefinition.helpDescription
				}
			),
			125, 220,
			1750, 500,
			"Black"
		);

		MainCanvas.textAlign = "center";
		DrawButton(900, 800, 200, 80, "Back", "White");
	}

	Click() {
		if (MouseIn(900, 800, 200, 80)) {
			this.Exit();
		}
	}

	Exit() {
		setSubscreen(this.back);
	}
}
