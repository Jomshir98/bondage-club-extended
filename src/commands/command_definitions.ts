import { ConditionsLimit } from "../constants";
import { Command_fixExclamationMark, Command_pickAutocomplete } from "../modules/commands";
import { registerCommand } from "../modules/commandsModule";
import { dictionaryProcess } from "../utils";
import { ChatRoomSendLocal } from "../utilsClub";
import { RulesGetRuleState } from "../modules/rules";

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
		trigger: (argv, sender, respond, state) => {
			if (argv.length !== 1) {
				respond(Command_fixExclamationMark(sender,
					`!eyes usage:\n` +
					`!eyes ${state.commandDefinition.helpDescription}`
				));
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
		trigger: (argv, sender, respond, state) => {
			if (argv.length !== 1) {
				respond(Command_fixExclamationMark(sender,
					`!mouth usage:\n` +
					`!mouth ${state.commandDefinition.helpDescription}`
				));
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

	const posesArms: Record<string, string> = {
		down: "BaseUpper",
		spread: "Yoked",
		up: "OverTheHead",
		back: "BackBoxTie",
		elbows: "BackElbowTouch",
		wrists: "BackCuffs"
	};

	const posesLegs: Record<string, string> = {
		normal: "BaseLower",
		kneel: "Kneel",
		kneelspread: "KneelingSpread",
		close: "LegsClosed"
	};

	const armsTexts: Record<string, string> = {
		down: "SENDER_NAME (SENDER_NUMBER) made you relax your arms",
		spread: "SENDER_NAME (SENDER_NUMBER) made you spread your hands",
		up: "SENDER_NAME (SENDER_NUMBER) made you raise your hands",
		back: "SENDER_NAME (SENDER_NUMBER) made you put your hands behind your back",
		elbows: "SENDER_NAME (SENDER_NUMBER) made you put your elbows together behind your back",
		wrists: "SENDER_NAME (SENDER_NUMBER) made you put your wrists together behind your back"
	};

	const legsTexts: Record<string, string> = {
		normal: "SENDER_NAME (SENDER_NUMBER) made you put your legs into a relaxed standing stance",
		kneel: "SENDER_NAME (SENDER_NUMBER) made you kneel with closed legs",
		kneelspread: "SENDER_NAME (SENDER_NUMBER) made you kneel with spread legs",
		close: "SENDER_NAME (SENDER_NUMBER) made you close your legs while standing"
	};

	registerCommand("arms", {
		name: "Arms",
		helpDescription: `<${Object.keys(posesArms).join("|")}>`,
		shortDescription: "Control PLAYER_NAME's arm poses",
		longDescription:
			`This command forces PLAYER_NAME's arms into the specified pose, but they can still manually change it. Some may be unavailable, due to restricting items, etc.\n` +
			`Usage:\n` +
			`!arms HELP_DESCRIPTION`,
		defaultLimit: ConditionsLimit.normal,
		playerUsable: true,
		trigger: (argv, sender, respond, state) => {
			if (argv.length !== 1) {
				respond(Command_fixExclamationMark(sender,
					`!arms usage:\n` +
					`!arms ${state.commandDefinition.helpDescription}`
				));
				return false;
			}
			const pose = posesArms[argv[0].toLowerCase()];
			if (pose === undefined) {
				respond(`Bad value: ${argv[0].toLowerCase()} is not one of '${Object.keys(posesArms).join("', '")}'`);
				return false;
			}
			if ((typeof Player.ActivePose === "string" && Player.ActivePose === pose) || (Array.isArray(Player.ActivePose) && Player.ActivePose.includes(pose))) {
				respond(`This character is already in the chosen pose.`);
				return false;
			}
			const ruleState = RulesGetRuleState("block_restrict_allowed_poses");
			if (sender.isPlayer() && ruleState.isEnforced && ruleState.customData?.poseButtons.includes(pose)) {
				respond(`You cannot change into this pose as the rule '${ruleState.ruleDefinition.name}' forbids it.`);
				return false;
			}
			CharacterSetActivePose(Player, pose);
			ServerSend("ChatRoomCharacterPoseUpdate", { Pose: Player.ActivePose });
			if (!sender.isPlayer()) {
				const text = armsTexts[argv[0].toLowerCase()];
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
				return Command_pickAutocomplete(argv[0], Object.keys(posesArms));
			}
			return [];
		}
	});

	registerCommand("legs", {
		name: "Legs",
		helpDescription: `<${Object.keys(posesLegs).join("|")}>`,
		shortDescription: "Control PLAYER_NAME's leg poses",
		longDescription:
			`This command forces PLAYER_NAME's legs into the specified pose, but they can still manually change it. Some may be unavailable, due to restricting items, etc.\n` +
			`Usage:\n` +
			`!legs HELP_DESCRIPTION`,
		defaultLimit: ConditionsLimit.normal,
		playerUsable: true,
		trigger: (argv, sender, respond, state) => {
			if (argv.length !== 1) {
				respond(Command_fixExclamationMark(sender,
					`!legs usage:\n` +
					`!legs ${state.commandDefinition.helpDescription}`
				));
				return false;
			}
			const pose = posesLegs[argv[0].toLowerCase()];
			if (pose === undefined) {
				respond(`Bad value: ${argv[0].toLowerCase()} is not one of '${Object.keys(posesLegs).join("', '")}'`);
				return false;
			}
			if ((typeof Player.ActivePose === "string" && Player.ActivePose === pose) || (Array.isArray(Player.ActivePose) && Player.ActivePose.includes(pose))) {
				respond(`This character is already in the chosen pose.`);
				return false;
			}
			const ruleState = RulesGetRuleState("block_restrict_allowed_poses");
			if (sender.isPlayer() && ruleState.isEnforced && ruleState.customData?.poseButtons.includes(pose)) {
				respond(`You cannot change into this pose as the rule '${ruleState.ruleDefinition.name}' forbids it.`);
				return false;
			}
			CharacterSetActivePose(Player, pose);
			ServerSend("ChatRoomCharacterPoseUpdate", { Pose: Player.ActivePose });
			if (!sender.isPlayer()) {
				const text = legsTexts[argv[0].toLowerCase()];
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
				return Command_pickAutocomplete(argv[0], Object.keys(posesLegs));
			}
			return [];
		}
	});

}
