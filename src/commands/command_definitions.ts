import { ConditionsLimit } from "../constants";
import { Command_pickAutocomplete } from "../modules/commands";
import { registerCommand } from "../modules/commandsModule";
import { dictionaryProcess } from "../utils";
import { ChatRoomSendLocal } from "../utilsClub";

export function initCommands_definitions() {

	const eyesExpressions: Record<string, string | null> = {
		open: null,
		close: "Closed",
		up: "Lewd",
		down: "Shy"
	};

	const eyesTexts: Record<string, string> = {
		open: "SENDER_NAME (SENDER_NUMBER) made you open your eyes",
		close: "SENDER_NAME (SENDER_NUMBER) made you close your eyes",
		up: "SENDER_NAME (SENDER_NUMBER) made you look up",
		down: "SENDER_NAME (SENDER_NUMBER) made you look down"
	};

	registerCommand("eyes", {
		name: "Eyes",
		helpDescription: `<${Object.keys(eyesExpressions).join("|")}>`,
		shortDescription: "Control PLAYER_NAME's eyes",
		longDescription:
			`This command forces PLAYER_NAME's eyes into the specified state, but they can still manually change it.\n` +
			`Usage:\n` +
			`!eyes HELP_DESCRIPTION`,
		defaultLimit: ConditionsLimit.normal,
		playerUsable: true,
		trigger: (argv, sender, respond) => {
			if (argv.length !== 1) {
				respond(`Needs a one of the allowed options '${Object.keys(eyesExpressions).join("', '")}' behind '.eyes'`);
				return false;
			}
			const expression = eyesExpressions[argv[0].toLowerCase()];
			if (expression === undefined) {
				respond(`Bad value: ${argv[0].toLowerCase()} is not one of '${Object.keys(eyesExpressions).join("', '")}'`);
				return false;
			}
			CharacterSetFacialExpression(Player, "Eyes", expression);
			if (!sender.isPlayer()) {
				const text = eyesTexts[argv[0].toLowerCase()];
				if (text) {
					ChatRoomSendLocal(dictionaryProcess(text, {
						SENDER_NAME: sender.Name,
						SENDER_NUMBER: `${sender.MemberNumber}`
					}), undefined, sender.MemberNumber);
				}
			}
			return true;
		},
		autoCompleter: (argv) => {
			if (argv.length === 1) {
				return Command_pickAutocomplete(argv[0], Object.keys(eyesExpressions));
			}
			return [];
		}
	});

	const mouthExpressions: Record<string, string | null> = {
		close: null,
		open: "HalfOpen",
		openwide: "Moan",
		tongue: "Ahegao",
		smile: "Smirk"
	};

	const mouthTexts: Record<string, string> = {
		close: "SENDER_NAME (SENDER_NUMBER) made you close your mouth",
		open: "SENDER_NAME (SENDER_NUMBER) made you open your mouth",
		openwide: "SENDER_NAME (SENDER_NUMBER) made you open your mouth wide",
		tongue: "SENDER_NAME (SENDER_NUMBER) made you stick out your tongue",
		smile: "SENDER_NAME (SENDER_NUMBER) made you smile"
	};

	registerCommand("mouth", {
		name: "Mouth",
		helpDescription: `<${Object.keys(mouthExpressions).join("|")}>`,
		shortDescription: "Control PLAYER_NAME's mouth",
		longDescription:
			`This command forces PLAYER_NAME's mouth into the specified state, but they can still manually change it.\n` +
			`Usage:\n` +
			`!mouth HELP_DESCRIPTION`,
		defaultLimit: ConditionsLimit.normal,
		playerUsable: true,
		trigger: (argv, sender, respond) => {
			if (argv.length !== 1) {
				respond(`Needs a one of the allowed options '${Object.keys(mouthExpressions).join("', '")}' behind '.mouth'`);
				return false;
			}
			const expression = mouthExpressions[argv[0].toLowerCase()];
			if (expression === undefined) {
				respond(`Bad value: ${argv[0].toLowerCase()} is not one of '${Object.keys(mouthExpressions).join("', '")}'`);
				return false;
			}
			CharacterSetFacialExpression(Player, "Mouth", expression);
			if (!sender.isPlayer()) {
				const text = mouthTexts[argv[0].toLowerCase()];
				if (text) {
					ChatRoomSendLocal(dictionaryProcess(text, {
						SENDER_NAME: sender.Name,
						SENDER_NUMBER: `${sender.MemberNumber}`
					}), undefined, sender.MemberNumber);
				}
			}
			return true;
		},
		autoCompleter: (argv) => {
			if (argv.length === 1) {
				return Command_pickAutocomplete(argv[0], Object.keys(mouthExpressions));
			}
			return [];
		}
	});

}
