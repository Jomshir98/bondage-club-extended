import { cloneDeep, isEqual, pick, uniqBy } from "lodash-es";
import { ChatroomCharacter, getAllCharactersInRoom, getChatroomCharacter } from "../characters";
import { ModuleCategory, Preset } from "../constants";
import { hookFunction, patchFunction, removeAllHooksByModule } from "../patching";
import { escapeRegExp, isObject } from "../utils";
import { AccessLevel, checkPermissionAccess, registerPermission } from "./authority";
import { ExportImportRegisterCategory } from "./export_import";
import { notifyOfChange, queryHandlers } from "./messaging";
import { moduleIsEnabled } from "./presets";
import { modStorage, modStorageSync } from "./storage";
import { BaseModule } from "./_BaseModule";
import zod from "zod";
import { LogEntryType, logMessage } from "./log";
import { ChatRoomSendLocal, getCharacterName, getCharacterNickname } from "../utilsClub";
import { registerSpeechHook, SpeechHookAllow } from "./speech";

export interface RelationshipData {
	memberNumber: number;
	nickname: string;
	enforceNickname: boolean;
}

export const RelationshipData_schema = zod.object({
	memberNumber: zod.number(),
	nickname: zod.string().refine(isValidNickname),
	enforceNickname: zod.boolean()
});

export const NICKNAME_LENGTH_MAX = 20;
export const NICKNAME_REGEX = /^[\p{L}0-9\p{Z}'-]+$/u;

export function isValidNickname(nickname: string): boolean {
	return (
		nickname.trim() === nickname &&
		nickname.length > 0 &&
		nickname.length <= NICKNAME_LENGTH_MAX &&
		NICKNAME_REGEX.test(nickname)
	);
}

export function guard_RelationshipData(data: unknown): data is RelationshipData {
	const d = data as RelationshipData;
	return isObject(d) &&
		typeof d.memberNumber === "number" &&
		typeof d.nickname === "string" &&
		isValidNickname(d.nickname) &&
		typeof d.enforceNickname === "boolean";
}

export function RelationshipsGetNickname(target: number | ChatroomCharacter | null | undefined): string | null {
	if (target instanceof ChatroomCharacter) {
		target = target.MemberNumber;
	}
	if (target != null && moduleIsEnabled(ModuleCategory.Relationships) && modStorage.relationships) {
		const rel = modStorage.relationships.find(r => r.memberNumber === target);
		if (rel)
			return rel.nickname;
	}
	return null;
}

export class ModuleRelationhips extends BaseModule {
	override init(): void {
		registerPermission("relationships_view_all", {
			name: "Allow viewing others in relationship list",
			category: ModuleCategory.Relationships,
			defaults: {
				[Preset.dominant]: [true, AccessLevel.self],
				[Preset.switch]: [true, AccessLevel.owner],
				[Preset.submissive]: [true, AccessLevel.mistress],
				[Preset.slave]: [true, AccessLevel.mistress]
			}
		});

		registerPermission("relationships_modify_self", {
			name: "Allow changing relationship config for herself",
			category: ModuleCategory.Relationships,
			defaults: {
				[Preset.dominant]: [true, AccessLevel.self],
				[Preset.switch]: [true, AccessLevel.owner],
				[Preset.submissive]: [false, AccessLevel.mistress],
				[Preset.slave]: [false, AccessLevel.mistress]
			}
		});

		registerPermission("relationships_modify_others", {
			name: "Allow changing relationship config for others",
			category: ModuleCategory.Relationships,
			defaults: {
				[Preset.dominant]: [true, AccessLevel.self],
				[Preset.switch]: [true, AccessLevel.owner],
				[Preset.submissive]: [false, AccessLevel.mistress],
				[Preset.slave]: [false, AccessLevel.mistress]
			}
		});

		queryHandlers.relatonshipsGet = (sender) => {
			if (!moduleIsEnabled(ModuleCategory.Relationships) || !modStorage.relationships)
				return undefined;

			const viewAll = checkPermissionAccess("relationships_view_all", sender);

			return {
				relationships: viewAll ? cloneDeep(modStorage.relationships) : cloneDeep(modStorage.relationships.filter(r => r.memberNumber === sender.MemberNumber)),
				access_view_all: viewAll,
				access_modify_self: checkPermissionAccess("relationships_modify_self", sender),
				access_modify_others: viewAll && checkPermissionAccess("relationships_modify_others", sender)
			};
		};

		queryHandlers.relationshipsRemove = (sender, data) => {
			if (
				!moduleIsEnabled(ModuleCategory.Relationships) ||
				!modStorage.relationships ||
				typeof data !== "number"
			)
				return undefined;

			const index = modStorage.relationships.findIndex(i => i.memberNumber === data);
			if (index < 0)
				return true;

			if (!checkPermissionAccess(sender.MemberNumber === data ? "relationships_modify_self" : "relationships_modify_others", sender))
				return false;

			modStorage.relationships.splice(index, 1);

			logMessage("relationships_change", LogEntryType.plaintext, `${sender} removed the set custom name for ${getCharacterName(data, "[unknown name]")} (${data})`);
			if (!sender.isPlayer()) {
				ChatRoomSendLocal(`${sender.toNicknamedString()} removed the set custom name for ${getCharacterNickname(data, "[unknown name]")} (${data})`, undefined, sender.MemberNumber);
			}

			modStorageSync();
			notifyOfChange();
			return true;
		};

		queryHandlers.relationshipsSet = (sender, data) => {
			if (
				!moduleIsEnabled(ModuleCategory.Relationships) ||
				!modStorage.relationships ||
				!guard_RelationshipData(data)
			)
				return undefined;

			data = pick(data, ["memberNumber", "nickname", "enforceNickname"]);

			const index = modStorage.relationships.findIndex(i => i.memberNumber === data.memberNumber);
			if (index >= 0 && isEqual(modStorage.relationships[index], data))
				return true;

			if (!checkPermissionAccess(sender.MemberNumber === data.memberNumber ? "relationships_modify_self" : "relationships_modify_others", sender))
				return false;

			const oldData = index >= 0 ? modStorage.relationships[index] : null;

			if (index >= 0) {
				modStorage.relationships[index] = data;
			} else {
				modStorage.relationships.push(data);
			}

			if (oldData?.nickname !== data.nickname) {
				logMessage("relationships_change", LogEntryType.plaintext, `${sender} changed the custom name for ${getCharacterName(data.memberNumber, "[unknown name]")} (${data.memberNumber}) to '${data.nickname}'`);
				if (!sender.isPlayer()) {
					ChatRoomSendLocal(`${sender.toNicknamedString()} changed the custom name for character ${data.memberNumber} to '${data.nickname}'`, undefined, sender.MemberNumber);
				}
			}

			if ((oldData?.enforceNickname ?? false) !== data.enforceNickname) {
				logMessage("relationships_change", LogEntryType.plaintext, `${sender} ${data.enforceNickname ? "started" : "stopped"} custom name enforcement for ${getCharacterName(data.memberNumber, "[unknown name]")} (${data.memberNumber})`);
				if (!sender.isPlayer()) {
					ChatRoomSendLocal(`${sender.toNicknamedString()} ${data.enforceNickname ? "now requires" : "no longer requires"} you to only use ${getCharacterNickname(data.memberNumber, "[unknown name]")}'s (${data.memberNumber}) custom name.`, undefined, sender.MemberNumber);
				}
			}

			modStorageSync();
			notifyOfChange();
			return true;
		};

		registerSpeechHook({
			allowSend: (msg) => {
				if (
					moduleIsEnabled(ModuleCategory.Relationships) &&
					modStorage.relationships &&
					(msg.type === "Chat" || msg.type === "Whisper")
				) {
					// Build the dictionary of allowed and forbidden names
					const allowed = new Set<string>();
					const forbiden = new Set<string>();

					for (const char of getAllCharactersInRoom()) {
						const rel = modStorage.relationships.find(r => r.memberNumber === char.MemberNumber);
						if (rel) {
							allowed.add(rel.nickname.toLowerCase());
						}

						if (rel && rel.enforceNickname) {
							forbiden.add(char.Character.Name.toLowerCase());
							if (char.Character.Nickname && isValidNickname(char.Character.Nickname)) {
								forbiden.add(char.Character.Nickname.toLowerCase());
							}
						} else {
							allowed.add(char.Character.Name.toLowerCase());
							if (char.Character.Nickname && isValidNickname(char.Character.Nickname)) {
								allowed.add(char.Character.Nickname.toLowerCase());
							}
						}
					}

					// Find if bad name was used, but allow has higher priority than forbid
					const transgression = Array.from(forbiden).find(i =>
						(msg.noOOCMessage ?? msg.originalMessage).toLocaleLowerCase().match(
							new RegExp(`([^\\p{L}]|^)${escapeRegExp(i.trim())}([^\\p{L}]|$)`, "iu")
						) &&
						!Array.from(allowed).some(allow =>
							findMatch(i, allow) && (msg.noOOCMessage ?? msg.originalMessage).toLocaleLowerCase().match(
								new RegExp(`([^\\p{L}]|^)${escapeRegExp(allow.trim())}([^\\p{L}]|$)`, "iu")
							)
						)
					);
					if (transgression !== undefined) {
						ChatRoomSendLocal(`You are not allowed to use the name '${transgression}'! You need to use the name for her that was given to you!`, 7_000);
						return SpeechHookAllow.BLOCK;
					}

				}
				return SpeechHookAllow.ALLOW;
			}
		});

		ExportImportRegisterCategory<RelationshipData[]>({
			category: `relationships`,
			name: `Relationships`,
			module: ModuleCategory.Relationships,
			export: (character) => {
				if (character && !checkPermissionAccess("relationships_view_all", character)) {
					throw new Error("Missing the following permission required to export:\nAllow viewing others in relationship list");
				}
				return modStorage.relationships ?? [];
			},
			import: (data, character) => {
				data = uniqBy(data, r => r.memberNumber);
				modStorage.relationships = data;

				if (character) {
					logMessage("relationships_change", LogEntryType.plaintext, `${character} imported settings for relationships module`);
					if (!character.isPlayer()) {
						ChatRoomSendLocal(`${character.toNicknamedString()} settings for relationships module`, undefined, character.MemberNumber);
					}
				}

				return `Done!`;
			},
			importPermissions: ["relationships_view_all", "relationships_modify_self", "relationships_modify_others"],
			importValidator: zod.array(RelationshipData_schema)
		});
	}

	override load() {
		if (!moduleIsEnabled(ModuleCategory.Relationships)) {
			delete modStorage.relationships;
			return;
		}

		if (!Array.isArray(modStorage.relationships)) {
			modStorage.relationships = [];
		}

		const seen = new Set<number>();
		for (let i = 0; i < modStorage.relationships.length; i++) {
			const e = modStorage.relationships[i];
			if (
				!guard_RelationshipData(e) ||
				seen.has(e.memberNumber)
			) {
				modStorage.relationships.splice(i, 1);
				i--;
				continue;
			}
			seen.add(e.memberNumber);
		}

		let shouldReplaceNickname = false;

		hookFunction("CharacterNickname", 4, (args, next) => {
			const C = args[0] as Character;
			if (shouldReplaceNickname && modStorage.relationships && C) {
				const entry = modStorage.relationships.find(r => r.memberNumber === C.MemberNumber);
				if (entry) {
					return entry.nickname;
				}
			}
			return next(args);
		}, ModuleCategory.Relationships);

		hookFunction("ChatRoomRun", 0, (args, next) => {
			shouldReplaceNickname = true;
			const res = next(args);
			shouldReplaceNickname = false;
			return res;
		}, ModuleCategory.Relationships);

		hookFunction("ChatRoomMessage", 4, (args, next) => {
			const data = args[0] as IChatRoomMessage;
			const original = shouldReplaceNickname;
			if (
				isObject(data) &&
				["Action", "Chat", "Whisper", "Emote", "Activity", "ServerMessage"].includes(data.Type) &&
				modStorage.relationships
			) {
				shouldReplaceNickname = false;
				for (const entry of Array.isArray(data.Dictionary) ? data.Dictionary : []) {
					if (
						isObject(entry) &&
						typeof entry.MemberNumber === "number" &&
						typeof entry.Text === "string"
					) {
						const relationship = modStorage.relationships.find(r => r.memberNumber === entry.MemberNumber);
						const character = getChatroomCharacter(entry.MemberNumber);
						if (relationship && character) {
							const originalName = CharacterNickname(character.Character);
							entry.Text = entry.Text.replace(originalName, relationship.nickname);
						}
					}
				}
				shouldReplaceNickname = true;
			}
			const res = next(args);
			shouldReplaceNickname = original;
			return res;
		});

		hookFunction("CommandParse", 0, (args, next) => {
			const original = shouldReplaceNickname;
			if (ChatRoomTargetMemberNumber) {
				shouldReplaceNickname = true;
			}
			const res = next(args);
			shouldReplaceNickname = original;
			return res;
		});

		patchFunction("CommandParse", {
			'TextGet("WhisperTo") + " " + TargetName + ": " + msg;': 'TextGet("WhisperTo") + " " + (WhisperTarget ? CharacterNickname(WhisperTarget) : TargetName) + ": " + msg;'
		});

		patchFunction("ChatRoomTarget", {
			"TargetName = ChatRoomCharacter[C].Name;": "TargetName = CharacterNickname(ChatRoomCharacter[C]);"
		});
	}

	override reload() {
		removeAllHooksByModule(ModuleCategory.Relationships);
		this.load();
	}
}

function findMatch(name: string | readonly string[], sentence: string | readonly string[]): boolean {
	if (typeof name === "string") {
		name = name.split(" ").map(i => i.trim()).filter(Boolean);
	}
	if (typeof sentence === "string") {
		sentence = sentence.split(" ").map(i => i.trim()).filter(Boolean);
	}
	for (let j = 0; j < sentence.length; j++) {
		let matches = true;
		for (let i = 0; i < name.length; i++) {
			if (j + i >= sentence.length || name[i] !== sentence[j + i]) {
				matches = false;
				break;
			}
		}
		if (matches) {
			return true;
		}
	}
	return false;
}
