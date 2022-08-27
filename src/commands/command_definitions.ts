import { ConditionsLimit } from "../constants";
import { Command_fixExclamationMark, Command_parseTime, Command_pickAutocomplete } from "../modules/commands";
import { registerCommand } from "../modules/commandsModule";
import { dictionaryProcess, formatTimeInterval } from "../utils";
import { ChatRoomActionMessage, ChatRoomSendLocal, InfoBeep } from "../utilsClub";
import backgroundList from "../generated/backgroundList.json";
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
		helpDescription: `<${Object.keys(eyesExpressions).join(" | ")}>`,
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
						SENDER_NAME: sender.Nickname,
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
		helpDescription: `<${Object.keys(mouthExpressions).join(" | ")}>`,
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
						SENDER_NAME: sender.Nickname,
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
		helpDescription: `<${Object.keys(posesArms).join(" | ")}>`,
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
						SENDER_NAME: sender.Nickname,
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
		helpDescription: `<${Object.keys(posesLegs).join(" | ")}>`,
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
						SENDER_NAME: sender.Nickname,
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

	registerCommand("goandwait", {
		name: "Go and wait",
		helpDescription: `<public|private> <background name> <room name>`,
		shortDescription: "Makes PLAYER_NAME leave and wait in another chat room.",
		longDescription:
			`This command forces PLAYER_NAME to leave the current room and join an existing chat room or otherwise create a new public or private one with the given background name and room name. PLAYER_NAME is not prevented from leaving that room, if she is able to. Tip: If you want to make PLAYER_NAME wait in a certain way, the pose command could for instance be used before this one.\n` +
			`Usage:\n` +
			`!goandwait HELP_DESCRIPTION`,
		defaultLimit: ConditionsLimit.blocked,
		playerUsable: false,
		trigger: (argv, sender, respond, state) => {
			if (argv.length < 1 || (argv[0] !== "public" && argv[0] !== "private")) {
				respond(Command_fixExclamationMark(sender,
					`!goandwait usage:\n` +
					`!goandwait ${state.commandDefinition.helpDescription}`
				));
				return false;
			}
			if (argv.length < 2) {
				respond(`The second argument needs to be the name of a background (for example: 'BDSMRoomRed' or 'BondageBedChamber')`);
				return false;
			}
			const Background = backgroundList.find(i => i.toLocaleLowerCase() === argv[1].toLocaleLowerCase());
			if (!Background) {
				respond(`Invalid/unknown background. Example of correct ones: 'BDSMRoomRed' or 'BondageBedChamber'`);
				return false;
			}
			if (argv.length < 3) {
				respond(`Please add a room name behind the room background name.`);
				return false;
			}
			const Name = argv.slice(2).join(" ");
			const Private = argv[0] === "private";
			const playerNumber = Player.MemberNumber;
			const Admin = [playerNumber, sender.MemberNumber];

			if (!playerNumber) {
				console.error("Player member number was unexpectedly undefined.");
				return false;
			}
			if (!/^[A-Za-z0-9\s]*$/.test(Name)) {
				respond(`The room name part of the command contains characters that are not A-Z, numbers or whitespaces.`);
				return false;
			} else if (Name.length > 20) {
				respond(`The room name part of the command cannot be longer than 20 characters.`);
				return false;
			}

			// leave
			InfoBeep(`You got ordered by ${sender} to wait in another room.`, 8_000);
			ChatRoomActionMessage(`TargetCharacterName received an order by SourceCharacter (${sender.MemberNumber}) to wait in another room.`, null, [
				{ Tag: "TargetCharacterName", MemberNumber: Player.MemberNumber, Text: CharacterNickname(Player) },
				{ Tag: "SourceCharacter", MemberNumber: sender.MemberNumber, Text: CharacterNickname(sender.Character) }
			]);
			DialogLentLockpicks = false;
			ChatRoomClearAllElements();
			ServerSend("ChatRoomLeave", "");
			ChatRoomSetLastChatRoom("");
			ChatRoomLeashPlayer = null;
			CommonSetScreen("Online", "ChatSearch");
			CharacterDeleteAllOnline();

			// join
			ChatRoomPlayerCanJoin = true;
			ServerSend("ChatRoomCreate", {
				Name,
				Description: "",
				Background,
				Private,
				Locked: false,
				Space: "",
				Game: "",
				Admin,
				Ban: [],
				Limit: 10,
				BlockCategory: []
			});
			ServerSend("ChatRoomJoin", { Name });
			return true;
		},
		autoCompleter: (argv) => {
			if (argv.length === 1) {
				return Command_pickAutocomplete(argv[0], ["public", "private"]);
			}
			if (argv.length === 2) {
				return Command_pickAutocomplete(argv[1], backgroundList);
			}
			return [];
		}
	});

	registerCommand("cell", {
		name: "Send to cell",
		helpDescription: `<time>`,
		shortDescription: "Lock PLAYER_NAME in a singleplayer isolation cell",
		longDescription:
			`This command sends PLAYER_NAME to the timer cell for up to 60 minutes. There is no way for you to get her out before the time is up.\n` +
			`IMPORTANT: The effects of this command is not going away if BCX is turned off or not activated after reloading. This is because this command uses a function present in the base game.\n` +
			`Usage:\n` +
			`!cell HELP_DESCRIPTION`,
		defaultLimit: ConditionsLimit.blocked,
		playerUsable: false,
		trigger: (argv, sender, respond, state) => {
			if (argv.length < 1) {
				respond(Command_fixExclamationMark(sender,
					`!cell usage:\n` +
					`!cell ${state.commandDefinition.helpDescription}`
				));
				return false;
			}
			let time = 0;
			for (const v of argv) {
				const i = Command_parseTime(v);
				if (typeof i === "string") {
					respond(i);
					return false;
				}
				time += i;
			}
			const minutes = time / 60_000;
			if (minutes < 1 || minutes > 60) {
				respond(`Time needs to be between 1 minute and 1 hour`);
				return false;
			}
			InfoBeep(`Two maids locked you into a timer cell, following ${sender}'s command.`, 8_000);
			ChatRoomActionMessage(`TargetCharacterName gets grabbed by two maids and locked in a timer cell, following SourceCharacter's (${sender.MemberNumber}) command.`, null, [
				{ Tag: "TargetCharacterName", MemberNumber: Player.MemberNumber, Text: CharacterNickname(Player) },
				{ Tag: "SourceCharacter", MemberNumber: sender.MemberNumber, Text: CharacterNickname(sender.Character) }
			]);
			DialogLentLockpicks = false;
			ChatRoomClearAllElements();
			ServerSend("ChatRoomLeave", "");
			CharacterDeleteAllOnline();
			CellLock(minutes);
			return true;
		}
	});

	registerCommand("asylum", {
		name: "Send to asylum",
		helpDescription: `<time> | cancel`,
		shortDescription: "Lock PLAYER_NAME into the aslyum",
		longDescription:
			`This command sends and locks PLAYER_NAME into the asylum for up to 1 week, where she can freely walk around, but cannot leave the area. You can free PLAYER_NAME early by visiting her in the aslyum and using '.asylum cancel'.\n` +
			`IMPORTANT: The effects of this command is not going away if BCX is turned off or not activated after reloading. This is because this command uses a function present in the base game.\n` +
			`Usage:\n` +
			`!asylum HELP_DESCRIPTION`,
		defaultLimit: ConditionsLimit.blocked,
		playerUsable: false,
		trigger: (argv, sender, respond, state) => {
			if (argv.length < 1) {
				respond(Command_fixExclamationMark(sender,
					`!asylum usage:\n` +
					`!asylum ${state.commandDefinition.helpDescription}`
				));
				return false;
			}
			if (argv[0] === "cancel") {
				LogDelete("Committed", "Asylum", true);
				respond(`You freed ${Player.Name}. She can now leave the Asylum again.`);
				ChatRoomSendLocal(`${sender.toNicknamedString()} freed you. You are now able to leave the Asylum again.`);
				return true;
			}
			let time = 0;
			for (const v of argv) {
				const i = Command_parseTime(v);
				if (typeof i === "string") {
					respond(i);
					return false;
				}
				time += i;
			}
			if (time < 60 * 1000 || time > 7 * 24 * 60 * 60 * 1000) {
				respond(`Time needs to be between 1 minute and 1 week`);
				return false;
			}
			InfoBeep(`Two nurses locked you in the Asylum, following ${sender}'s command.`, 8_000);
			ChatRoomActionMessage(`TargetCharacterName gets grabbed by two nurses and locked in the Asylum, following SourceCharacter's (${sender.MemberNumber}) command.`, null, [
				{ Tag: "TargetCharacterName", MemberNumber: Player.MemberNumber, Text: CharacterNickname(Player) },
				{ Tag: "SourceCharacter", MemberNumber: sender.MemberNumber, Text: CharacterNickname(sender.Character) }
			]);
			DialogLentLockpicks = false;
			ChatRoomClearAllElements();
			ServerSend("ChatRoomLeave", "");
			CharacterDeleteAllOnline();
			LogAdd("Committed", "Asylum", CurrentTime + time, true);
			CommonSetScreen("Room", "AsylumEntrance");
			return true;
		},
		autoCompleter: (argv) => {
			if (argv.length === 1) {
				return Command_pickAutocomplete(argv[0], ["cancel"]);
			}
			return [];
		}
	});

	registerCommand("keydeposit", {
		name: "Deposit all keys",
		helpDescription: `<time> | cancel`,
		shortDescription: "Store away PLAYER_NAME's keys",
		longDescription:
			`This command removes all of PLAYER_NAME's keys for up to 1 week. You can give them back to her early by using '.keydeposit cancel'.\n` +
			`IMPORTANT: The effects of this command is not going away if BCX is turned off or not activated after reloading. This is because this command uses a function present in the base game.\n` +
			`Usage:\n` +
			`!keydeposit HELP_DESCRIPTION`,
		defaultLimit: ConditionsLimit.limited,
		playerUsable: false,
		trigger: (argv, sender, respond, state) => {
			if (argv.length < 1) {
				respond(Command_fixExclamationMark(sender,
					`!keydeposit usage:\n` +
					`!keydeposit ${state.commandDefinition.helpDescription}`
				));
				return false;
			}
			if (argv[0] === "cancel") {
				LogDelete("KeyDeposit", "Cell", true);
				respond(`You let ${Player.Name} have her keys back.`);
				ChatRoomSendLocal(`${sender.toNicknamedString()} let you have your keys back.`);
				return true;
			}
			let time = 0;
			for (const v of argv) {
				const i = Command_parseTime(v);
				if (typeof i === "string") {
					respond(i);
					return false;
				}
				time += i;
			}
			if (time < 60 * 1000 || time > 7 * 24 * 60 * 60 * 1000) {
				respond(`Time needs to be between 1 minute and 1 week`);
				return false;
			}
			ChatRoomActionMessage(`A nurse took all keys from TargetCharacterName, following SourceCharacter's (${sender.MemberNumber}) command. The keys will be deposited for ${formatTimeInterval(time)}.`, null, [
				{ Tag: "TargetCharacterName", MemberNumber: Player.MemberNumber, Text: CharacterNickname(Player) },
				{ Tag: "SourceCharacter", MemberNumber: sender.MemberNumber, Text: CharacterNickname(sender.Character) }
			]);
			LogAdd("KeyDeposit", "Cell", CurrentTime + time, true);
			return true;
		},
		autoCompleter: (argv) => {
			if (argv.length === 1) {
				return Command_pickAutocomplete(argv[0], ["cancel"]);
			}
			return [];
		}
	});

	registerCommand("timeleft", {
		name: "Show remaining time",
		helpDescription: `asylum | ggts | keydeposit`,
		shortDescription: "Remaining time of keyhold, asylum stay, or GGTS training",
		longDescription:
			`This command shows the remaining time of either having all of PLAYER_NAME's keys deposited, her being locked in the asylum, or having to do GGTS training sessions in the asylum.\n` +
			`Usage:\n` +
			`!timeleft HELP_DESCRIPTION`,
		defaultLimit: ConditionsLimit.normal,
		playerUsable: true,
		trigger: (argv, sender, respond, state) => {
			if (argv.length !== 1 || (argv[0] !== "asylum" && argv[0] !== "keydeposit" && argv[0] !== "ggts")) {
				respond(Command_fixExclamationMark(sender,
					`!timeleft usage:\n` +
					`!timeleft ${state.commandDefinition.helpDescription}`
				));
				return false;
			}
			let time: number | undefined | null;
			let response: string;
			if (argv[0] === "asylum") {
				time = LogValue("Committed", "Asylum");
				response = `${Player.Name} can leave the asylum in`;
			} else if (argv[0] === "ggts") {
				time = LogValue("ForceGGTS", "Asylum");
				response = `${Player.Name} still has to undergo this amount of GGTS training time:`;
			} else {
				time = LogValue("KeyDeposit", "Cell");
				response = `${Player.Name} will get her keys back in`;
			}
			if (time && time > 0 && argv[0] === "ggts") {
				respond(`${response} ${formatTimeInterval(time)}.`);
			} else if (time && CurrentTime < time) {
				respond(`${response} ${formatTimeInterval(time - CurrentTime)}.`);
			} else {
				respond(`${Player.Name} is not under the effect of the '${argv[0]}'-command currently.`);
				return false;
			}
			return true;
		},
		autoCompleter: (argv) => {
			if (argv.length === 1) {
				return Command_pickAutocomplete(argv[0], ["asylum", "ggts", "keydeposit"]);
			}
			return [];
		}
	});

	registerCommand("servedrinks", {
		name: "Send to serve drinks",
		helpDescription: "",
		shortDescription: "Force PLAYER_NAME to do bound maid work",
		longDescription:
			`This command sends PLAYER_NAME to sell 5 drinks as a maid in multiplayer chat rooms. She must be a maid recognized by the maid sorority and be able to walk and talk, to be taken in by the maid.\n` +
			`Usage:\n` +
			`!servedrinks`,
		defaultLimit: ConditionsLimit.blocked,
		playerUsable: false,
		trigger: (argv, sender, respond) => {
			if (ReputationCharacterGet(Player, "Maid") < 1) {
				respond(`${Player.Name} must be a maid recognized by the maid sorority to be taken in for the job.`);
				return false;
			}
			if (!Player.CanWalk() || !Player.CanTalk()) {
				respond(`${Player.Name} must be able to walk and talk or the maids will not take her in for the job.`);
				return false;
			}
			CharacterSetActivePose(Player, null);
			const D = `(Two maids grab you and escort you to their quarters.  Another maid addresses you.)  ${sender.Name} sent you here to work.`;
			ChatRoomActionMessage(`TargetCharacterName gets grabbed by two maids and escorted to the maid quarters to serve drinks, following SourceCharacter's (${sender.MemberNumber}) command.`, null, [
				{ Tag: "TargetCharacterName", MemberNumber: Player.MemberNumber, Text: CharacterNickname(Player) },
				{ Tag: "SourceCharacter", MemberNumber: sender.MemberNumber, Text: CharacterNickname(sender.Character) }
			]);
			ChatRoomClearAllElements();
			ServerSend("ChatRoomLeave", "");
			CommonSetScreen("Room", "MaidQuarters");
			CharacterSetCurrent(MaidQuartersMaid);
			MaidQuartersMaid.CurrentDialog = D;
			MaidQuartersMaid.Stage = "205";
			MaidQuartersOnlineDrinkFromOwner = true;
			return true;
		}
	});

	registerCommand("orgasm", {
		name: "Manipulate the arousal meter",
		helpDescription: "<number from 1 to 100> | forced | ruined | stop",
		shortDescription: "Controls PLAYER_NAME's orgasms directly",
		longDescription:
			`This command controls PLAYER_NAME's arousal meter directly, allowing four things:\n1. Setting the bar directly to a number from 1 to 100, whereas 100 triggers a normal orgasm.\n2. Triggering a forced orgasm that cannot be resisted.\n3. Triggering an orgasm that gets ruined.\n4. Stopping an orgasm already triggered (e.g. by a toy).\n` +
			`Usage:\n` +
			`!orgasm HELP_DESCRIPTION`,
		defaultLimit: ConditionsLimit.limited,
		playerUsable: false,
		trigger: (argv, sender, respond, state) => {
			if (argv.length < 1) {
				respond(Command_fixExclamationMark(sender,
					`!orgasm usage:\n` +
					`!orgasm ${state.commandDefinition.helpDescription}`
				));
				return false;
			}
			if (argv[0] === "stop") {
				if (!Player.ArousalSettings || !Player.ArousalSettings.OrgasmTimer) {
					respond("There is no orgasm to stop currently.");
					return false;
				}
				ActivityOrgasmRuined = true;
				return true;
			}
			if (Player.ArousalSettings && Player.ArousalSettings.OrgasmTimer) {
				respond("This is not possible right now.");
				return false;
			}
			if (argv[0] === "forced") {
				ActivitySetArousal(Player, 99);
				ActivityOrgasmGameResistCount = 496.5;
				ActivityOrgasmPrepare(Player);
				return true;
			}
			if (argv[0] === "ruined") {
				ActivitySetArousal(Player, 99);
				const backup = Player.Effect;
				Player.Effect = backup.concat("DenialMode", "RuinOrgasms");
				ActivityOrgasmPrepare(Player, true);
				Player.Effect = backup;
				return true;
			}
			const progress = /^[0-9]+$/.test(argv[0]) && Number.parseInt(argv[0], 10);
			if (!progress || progress < 0 || progress > 100) {
				respond(Command_fixExclamationMark(sender,
					`!orgasm usage:\n` +
					`!orgasm ${state.commandDefinition.helpDescription}`
				));
				return false;
			}
			ActivitySetArousal(Player, progress);
			if (progress > 99) {
				ActivityOrgasmPrepare(Player);
			}
			return true;
		},
		autoCompleter: (argv) => {
			if (argv.length === 1) {
				return Command_pickAutocomplete(argv[0], ["forced", "ruined", "stop"]);
			}
			return [];
		}
	});

	const emoticonExpressions: Record<string, string | null> = {
		none: null,
		afk: "Afk",
		whisper: "Whisper",
		sleep: "Sleep",
		hearts: "Hearts",
		sweatdrop: "Tear",
		ear: "Hearing",
		question: "Confusion",
		exclamation: "Exclamation",
		angry: "Annoyed",
		book: "Read",
		hand: "RaisedHand",
		eye: "Spectator",
		thumbsdown: "ThumbsDown",
		thumbsup: "ThumbsUp",
		rope: "LoveRope",
		gag: "LoveGag",
		lock: "LoveLock",
		wardrobe: "Wardrobe",
		game: "Gaming"
	};

	registerCommand("emoticon", {
		name: "Emoticon",
		helpDescription: `<${Object.keys(emoticonExpressions).join(" | ")}>`,
		shortDescription: "Control PLAYER_NAME's emoticon",
		longDescription:
			`This command changes PLAYER_NAME's emoticon into the specified state, but the player can still manually change it.\n` +
			`Usage:\n` +
			`!emoticon HELP_DESCRIPTION`,
		defaultLimit: ConditionsLimit.normal,
		playerUsable: true,
		trigger: (argv, sender, respond, state) => {
			if (argv.length !== 1) {
				respond(Command_fixExclamationMark(sender,
					`!emoticon usage:\n` +
					`!emoticon ${state.commandDefinition.helpDescription}`
				));
				return false;
			}

			// tied to rule "Prevent changing own emoticon"
			const blockRule = RulesGetRuleState("block_changing_emoticon");
			if (blockRule.isEnforced && sender.isPlayer()) {
				blockRule.triggerAttempt();
				return false;
			} else if (blockRule.inEffect && sender.isPlayer()) {
				blockRule.trigger();
			}

			const expression = emoticonExpressions[argv[0].toLowerCase()];
			if (expression === undefined) {
				respond(`Bad value: ${argv[0].toLowerCase()} is not one of '${Object.keys(emoticonExpressions).join("', '")}'`);
				return false;
			}
			CharacterSetFacialExpression(Player, "Emoticon", expression);
			if (!sender.isPlayer()) {
				const text = "SENDER_NAME (SENDER_NUMBER) changed your emoticon.";
				ChatRoomSendLocal(dictionaryProcess(text, {
					SENDER_NAME: sender.Nickname,
					SENDER_NUMBER: `${sender.MemberNumber}`
				}), undefined, sender.MemberNumber);
			}
			return true;
		},
		autoCompleter: (argv) => {
			if (argv.length === 1) {
				return Command_pickAutocomplete(argv[0], Object.keys(emoticonExpressions));
			}
			return [];
		}
	});
}
