import { ConditionsLimit, ModuleCategory, ModuleInitPhase, MODULE_NAMES } from "../constants";
import { moduleInitPhase } from "../moduleManager";
import { capitalizeFirstLetter, isObject, typedObjectAssumedEntries, typedObjectAssumedKeys } from "../utils";
import { notifyOfChange, queryHandlers } from "./messaging";
import { moduleIsEnabled } from "./presets";
import { modStorage, modStorageSync } from "./storage";
import { BaseModule } from "./_BaseModule";

import cloneDeep from "lodash-es/cloneDeep";
import isEqual from "lodash-es/isEqual";
import pick from "lodash-es/pick";
import zod, { ZodType } from "zod";
import { ChatroomCharacter, getAllCharactersInRoom } from "../characters";
import { AccessLevel, checkPermissionAccess, getHighestRoleInRoom } from "./authority";
import { COMMAND_GENERIC_ERROR, Command_parseTime, Command_pickAutocomplete, Command_selectCharacterAutocomplete, Command_selectCharacterMemberNumber } from "./commands";
import { getCharacterName, isAssetGroupName } from "../utilsClub";
import { BCX_setInterval } from "../BCXContext";
import { ExportImportRegisterCategory } from "./export_import";

const CONDITIONS_CHECK_INTERVAL = 2_000;

export const schema_ConditionsConditionRequirements: ZodType<ConditionsConditionRequirements> = zod.lazy(() => zod.object({
	orLogic: zod.literal(true).optional(),
	room: zod.object({
		type: zod.enum(["public", "private"]),
		inverted: zod.literal(true).optional(),
	}).optional(),
	roomName: zod.object({
		name: zod.string(),
		inverted: zod.literal(true).optional(),
	}).optional(),
	role: zod.object({
		role: zod.nativeEnum(AccessLevel),
		inverted: zod.literal(true).optional(),
	}).optional(),
	player: zod.object({
		memberNumber: zod.number(),
		inverted: zod.literal(true).optional(),
	}).optional(),
}));

export function guard_ConditionsConditionRequirements(data: unknown): data is ConditionsConditionRequirements {
	return isObject(data) &&
		(
			data.orLogic === undefined ||
			data.orLogic === true
		) &&
		(
			data.room === undefined ||
			isObject(data.room) &&
			(data.room.inverted === undefined || data.room.inverted === true) &&
			(data.room.type === "public" || data.room.type === "private")
		) &&
		(
			data.roomName === undefined ||
			isObject(data.roomName) &&
			(data.roomName.inverted === undefined || data.roomName.inverted === true) &&
			typeof data.roomName.name === "string"
		) &&
		(
			data.role === undefined ||
			isObject(data.role) &&
			(data.role.inverted === undefined || data.role.inverted === true) &&
			typeof data.role.role === "number" &&
			AccessLevel[data.role.role] !== undefined
		) &&
		(
			data.player === undefined ||
			isObject(data.player) &&
			(data.player.inverted === undefined || data.player.inverted === true) &&
			typeof data.player.memberNumber === "number"
		);
}

export function guard_ConditionsConditionPublicData<C extends ConditionsCategories>(category: C, condition: string, data: unknown): data is ConditionsConditionPublicData<C> {
	const d = data as ConditionsConditionPublicData;
	const handler = conditionHandlers.get(category);
	if (!handler)
		return false;
	return handler.loadValidateConditionKey(condition) &&
		isObject(d) &&
		typeof d.active === "boolean" &&
		typeof d.favorite === "boolean" &&
		(d.timer === null || typeof d.timer === "number") &&
		typeof d.timerRemove === "boolean" &&
		(d.requirements === null || guard_ConditionsConditionRequirements(d.requirements)) &&
		(d.addedBy === undefined || Number.isInteger(d.addedBy)) &&
		handler.validatePublicData(condition, d.data);
}

export function guard_ConditionsCategoryPublicData<C extends ConditionsCategories>(category: C, data: unknown, allowInvalidConditionRemoval: boolean = false): data is ConditionsCategoryPublicData<C> {
	const d = data as ConditionsCategoryPublicData;
	const handler = conditionHandlers.get(category);
	if (!handler)
		return false;
	return isObject(d) &&
		typeof d.access_normal === "boolean" &&
		typeof d.access_limited === "boolean" &&
		typeof d.access_configure === "boolean" &&
		typeof d.access_changeLimits === "boolean" &&
		(
			d.highestRoleInRoom === null ||
			(
				typeof d.highestRoleInRoom === "number" &&
				AccessLevel[d.highestRoleInRoom] !== undefined
			)
		) &&
		isObject(d.conditions) &&
		typedObjectAssumedEntries(d.conditions).every(
			([condition, conditionData]) => {
				const res = guard_ConditionsConditionPublicData(category, condition, conditionData);
				if (!res && allowInvalidConditionRemoval) {
					console.warn(`BCX: Removing invalid ${condition}:${category} condition from public data`, conditionData);
					delete d.conditions[condition];
					return true;
				}
				return res;
			}
		) &&
		(d.timer === null || typeof d.timer === "number") &&
		typeof d.timerRemove === "boolean" &&
		handler.validateCategorySpecificGlobalData(d.data) &&
		guard_ConditionsConditionRequirements(d.requirements) &&
		isObject(d.limits) &&
		Object.entries(d.limits).every(
			([condition, limit]) => limit === undefined || typeof limit === "number" && ConditionsLimit[limit] !== undefined
		);
}

export interface ConditionsHandler<C extends ConditionsCategories> {
	category: ModuleCategory;
	permission_normal: BCX_Permissions;
	permission_limited: BCX_Permissions;
	permission_configure?: BCX_Permissions;
	permission_changeLimits: BCX_Permissions;
	permission_viewOriginator?: BCX_Permissions;
	loadValidateConditionKey(key: string): key is ConditionsCategoryKeys[C];
	loadValidateCondition(key: ConditionsCategoryKeys[C], data: ConditionsConditionData<C>): boolean;
	loadCategorySpecificGlobalData(data: ConditionsCategorySpecificGlobalData[C] | undefined): ConditionsCategorySpecificGlobalData[C];
	stateChangeHandler(condition: ConditionsCategoryKeys[C], data: ConditionsConditionData<C>, newState: boolean): void;
	tickHandler(condition: ConditionsCategoryKeys[C], data: ConditionsConditionData<C>): void;
	afterTickHandler?(): void;
	makePublicData(condition: ConditionsCategoryKeys[C], data: ConditionsConditionData<C>): ConditionsCategorySpecificPublicData[C];
	validateCategorySpecificGlobalData(data: ConditionsCategorySpecificGlobalData[C]): boolean;
	validatePublicData(condition: ConditionsCategoryKeys[C], data: ConditionsCategorySpecificPublicData[C]): boolean;
	updateCondition(
		condition: ConditionsCategoryKeys[C],
		data: ConditionsConditionData<C>,
		updateData: ConditionsCategorySpecificPublicData[C],
		character: ChatroomCharacter | null,
		rawData: ConditionsConditionPublicData<C>
	): boolean;
	logLimitChange(condition: ConditionsCategoryKeys[C], character: ChatroomCharacter, newLimit: ConditionsLimit, oldLimit: ConditionsLimit): void;
	logConditionUpdate(condition: ConditionsCategoryKeys[C], character: ChatroomCharacter, newData: ConditionsConditionPublicData<C>, oldData: ConditionsConditionPublicData<C>): void;
	logCategoryUpdate(character: ChatroomCharacter, newData: ConditionsCategoryConfigurableData, oldData: ConditionsCategoryConfigurableData): void;
	getDefaultLimits(): Record<string, ConditionsLimit>;
	parseConditionName(selector: string, onlyExisting: false | (ConditionsCategoryKeys[C])[]): [true, ConditionsCategoryKeys[C]] | [false, string];
	autocompleteConditionName(selector: string, onlyExisting: false | (ConditionsCategoryKeys[C])[]): string[];
	commandConditionSelectorHelp: string;
	currentExportImport?: {
		export(condition: ConditionsCategoryKeys[C], data: ConditionsCategorySpecificData[C]): unknown;
		importRemove(condition: ConditionsCategoryKeys[C], character: ChatroomCharacter | null): true | string;
		import(condition: ConditionsCategoryKeys[C], data: unknown, character: ChatroomCharacter | null): [true, ConditionsCategorySpecificData[C]] | [false, string];
		importLog(condition: ConditionsCategoryKeys[C], data: ConditionsCategorySpecificData[C], character: ChatroomCharacter | null): void;
	};
}

const conditionHandlers: Map<ConditionsCategories, ConditionsHandler<ConditionsCategories>> = new Map();

export function ConditionsRegisterCategory<C extends ConditionsCategories>(category: C, handler: ConditionsHandler<C>): void {
	if (moduleInitPhase !== ModuleInitPhase.init) {
		throw new Error("Conditions categories can be registered only during init");
	}
	if (conditionHandlers.has(category)) {
		throw new Error(`Conditions categories "${category}" already defined!`);
	}
	conditionHandlers.set(category, handler);

	if (handler.permission_configure != null && handler.currentExportImport) {
		const currentExportImport = handler.currentExportImport;
		ExportImportRegisterCategory<{
			categoryConfig: ConditionsCategoryConfigurableData;
			conditions: Record<string, ConditionsConditionPublicDataBase & {
				data?: unknown;
			}>;
		}>({
			category: `${category}Current`,
			name: `${MODULE_NAMES[handler.category]}`,
			module: handler.category,
			export: () => {
				const categoryConfig = ConditionsGetCategoryConfigurableData(category);

				const conditionsData = ConditionsGetCategoryData(category).conditions;
				const conditions: Record<string, ConditionsConditionPublicDataBase & {
					data?: unknown;
				}> = {};

				for (const [condition, data] of typedObjectAssumedEntries(conditionsData)) {
					if (!data)
						continue;
					const publicData = ConditionsMakeConditionPublicData(handler, condition, data, null);
					conditions[condition] = {
						...pick(publicData, "active", "timer", "timerRemove", "requirements", "favorite"),
						data: currentExportImport.export(condition, data.data),
					};
				}

				return {
					categoryConfig,
					conditions,
				};
			},
			import: (data, character) => {
				let res = "";
				if (!ConditionsCategoryUpdate(category, data.categoryConfig, character)) {
					res += `Failed to set global config!\n`;
				}
				// Remove old ones
				const conditionsData = ConditionsGetCategoryData(category).conditions;
				for (const condition of Object.keys(conditionsData)) {
					if (data.conditions[condition] == null) {
						const removeResult = currentExportImport.importRemove(condition as ConditionsCategoryKeys[C], character);
						if (removeResult !== true) {
							return res
								+ `Failed to remove ${handler.commandConditionSelectorHelp} "${condition}": ${removeResult}\n`
								+ `Failed!\n`;
						}
					}
				}
				// Import conditions
				for (const [c, conditionData] of Object.entries(data.conditions)) {
					const condition = c as ConditionsCategoryKeys[C];
					if (conditionData == null)
						continue;
					if (!handler.loadValidateConditionKey(condition)) {
						res += `Skipped unknown ${handler.commandConditionSelectorHelp}: "${condition}"\n`;
						continue;
					}
					const limit = ConditionsGetConditionLimit(category, condition);
					if (limit === ConditionsLimit.blocked) {
						res += `Skipped blocked ${handler.commandConditionSelectorHelp} "${condition}"\n`;
						continue;
					}
					const [result, resultData] = currentExportImport.import(condition, conditionData.data, character);
					if (!result) {
						res += `Failed to load ${handler.commandConditionSelectorHelp} "${condition}": ${resultData}\n`;
						continue;
					}
					let oldData = cloneDeep(ConditionsGetCondition(category, condition));
					if (!oldData || !isEqual(oldData.data, resultData)) {
						ConditionsSetCondition(category, condition, resultData, character);
						currentExportImport.importLog(condition, resultData, character);
						oldData = cloneDeep(ConditionsGetCondition(category, condition));
					}
					if (!ConditionsUpdateBase(category, condition, conditionData)) {
						res += `Failed to load ${handler.commandConditionSelectorHelp} "${condition}": Error updating base data\n`;
						continue;
					}
					const newData = ConditionsGetCondition(category, condition);
					if (oldData && newData && character) {
						handler.logConditionUpdate(
							condition,
							character,
							ConditionsMakeConditionPublicData(handler, condition, newData, null),
							ConditionsMakeConditionPublicData(handler, condition, oldData, null)
						);
					}
				}

				return res + `Done!`;
			},
			importPermissions: [handler.permission_configure, handler.permission_normal, handler.permission_limited],
			importValidator: zod.object({
				categoryConfig: zod.object({
					requirements: schema_ConditionsConditionRequirements,
					timer: zod.number().nullable(),
					timerRemove: zod.boolean(),
					data: zod.custom((data) => handler.validateCategorySpecificGlobalData(data as ConditionsCategorySpecificGlobalData[C])),
				}) as ZodType<ConditionsCategoryConfigurableData>,
				conditions: zod.record(zod.object({
					active: zod.boolean(),
					data: zod.unknown().optional(),
					timer: zod.number().nullable(),
					timerRemove: zod.boolean(),
					requirements: schema_ConditionsConditionRequirements.nullable(),
					favorite: zod.boolean(),
				})),
			}),
		});
	}

	ExportImportRegisterCategory<ConditionsCategoryData<ConditionsCategories>["limits"]>({
		category: `${category}Limits`,
		name: `${MODULE_NAMES[handler.category]} - Limits`,
		module: handler.category,
		export: () => {
			const data = ConditionsGetCategoryData<ConditionsCategories>(category);
			return data.limits;
		},
		import: (data, character) => {
			let res = "";
			for (const [k, v] of Object.entries(data)) {
				if (v == null)
					continue;
				if (!handler.loadValidateConditionKey(k)) {
					res += `Skipped unknown ${handler.commandConditionSelectorHelp}: "${k}"\n`;
					continue;
				}
				if (!ConditionsSetLimit(category, k, v, character)) {
					res += `Failed to set limit for "${k}"\n`;
				}
			}
			return res + `Done!`;
		},
		importPermissions: [handler.permission_changeLimits],
		importValidator: zod.record(zod.nativeEnum(ConditionsLimit)),
	});
}

export function ConditionsGetCategoryHandler<C extends ConditionsCategories>(category: C): ConditionsHandler<C> {
	const handler = conditionHandlers.get(category);
	if (!handler) {
		throw new Error(`No handler for conditions category ${category}`);
	}
	return handler as ConditionsHandler<C>;
}

export function ConditionsGetCategoryEnabled(category: ConditionsCategories): boolean {
	return moduleIsEnabled(ConditionsGetCategoryHandler(category).category);
}

/** Unsafe when category is disabled, check before using */
export function ConditionsGetCategoryData<C extends ConditionsCategories>(category: C): ConditionsCategoryData<C> {
	if (!conditionHandlers.has(category)) {
		throw new Error(`Attempt to get unknown conditions category data ${category}`);
	}
	const data = modStorage.conditions?.[category];
	if (!data) {
		throw new Error(`Attempt to get data for uninitialized category ${category}`);
	}
	return data;
}

function ConditionsMakeConditionPublicData<C extends ConditionsCategories>(
	handler: ConditionsHandler<C>,
	condition: ConditionsCategoryKeys[C],
	conditionData: ConditionsConditionData<C>,
	requester: ChatroomCharacter | null
): ConditionsConditionPublicData<C> {
	const res: ConditionsConditionPublicData<C> = {
		active: conditionData.active,
		data: handler.makePublicData(condition, conditionData),
		timer: conditionData.timer ?? null,
		timerRemove: conditionData.timerRemove ?? false,
		requirements: conditionData.requirements ? cloneDeep(conditionData.requirements) : null,
		favorite: conditionData.favorite ?? false,
	};
	if (requester === null || handler.permission_viewOriginator != null && checkPermissionAccess(handler.permission_viewOriginator, requester)) {
		res.addedBy = conditionData.addedBy;
	}
	return res;
}

/** Unsafe when category is disabled, check before using */
export function ConditionsGetCategoryConfigurableData<C extends ConditionsCategories>(category: C): ConditionsCategoryConfigurableData<C> {
	const data = ConditionsGetCategoryData<ConditionsCategories>(category);
	const res: ConditionsCategoryConfigurableData<ConditionsCategories> = {
		timer: data.timer ?? null,
		timerRemove: data.timerRemove ?? false,
		data: cloneDeep(data.data),
		requirements: cloneDeep(data.requirements),
	};
	return res as ConditionsCategoryConfigurableData<C>;
}

/** Unsafe when category is disabled, check before using */
export function ConditionsGetCategoryPublicData<C extends ConditionsCategories>(category: C, requester: ChatroomCharacter): ConditionsCategoryPublicData<C> {
	const handler = ConditionsGetCategoryHandler<ConditionsCategories>(category);
	const data = ConditionsGetCategoryData<ConditionsCategories>(category);
	const res: ConditionsCategoryPublicData<ConditionsCategories> = {
		access_normal: checkPermissionAccess(handler.permission_normal, requester),
		access_limited: checkPermissionAccess(handler.permission_limited, requester),
		access_configure: handler.permission_configure != null && checkPermissionAccess(handler.permission_configure, requester),
		access_changeLimits: checkPermissionAccess(handler.permission_changeLimits, requester),
		highestRoleInRoom: getHighestRoleInRoom(),
		conditions: {},
		...ConditionsGetCategoryConfigurableData(category),
		limits: {
			...handler.getDefaultLimits(),
			...data.limits,
		},
	};
	for (const [condition, conditionData] of typedObjectAssumedEntries(data.conditions)) {
		if (!conditionData)
			continue;
		res.conditions[condition] = ConditionsMakeConditionPublicData<ConditionsCategories>(handler, condition, conditionData, requester);
	}
	return res as ConditionsCategoryPublicData<C>;
}

export function ConditionsGetCondition<C extends ConditionsCategories>(category: C, condition: ConditionsCategoryKeys[C]): ConditionsConditionData<C> | undefined {
	if (!ConditionsGetCategoryEnabled(category))
		return undefined;
	return ConditionsGetCategoryData(category).conditions[condition];
}

export function ConditionsIsConditionInEffect<C extends ConditionsCategories>(category: C, condition: ConditionsCategoryKeys[C]): boolean {
	if (!ConditionsGetCategoryEnabled(category))
		return false;
	const categoryData = ConditionsGetCategoryData(category);
	const conditionData = categoryData.conditions[condition];

	if (!conditionData)
		return false;

	if (conditionData.timer !== undefined && conditionData.timer <= Date.now())
		return false;

	if (!conditionData.active)
		return false;

	const requirements = conditionData.requirements ?? categoryData.requirements;
	if (!ConditionsEvaluateRequirements(requirements))
		return false;

	return true;
}

export function ConditionsSetCondition<C extends ConditionsCategories>(
	category: C,
	condition: ConditionsCategoryKeys[C],
	data: ConditionsCategorySpecificData[C],
	source: ChatroomCharacter | null
) {
	const handler = ConditionsGetCategoryHandler(category);
	if (!moduleIsEnabled(handler.category))
		return;
	const categoryData = ConditionsGetCategoryData(category);
	const existing = categoryData.conditions[condition];
	if (existing) {
		existing.data = data;
	} else {
		const res: ConditionsConditionData<C> = {
			active: true,
			lastActive: false,
			timer: categoryData.timer !== undefined ? Date.now() + categoryData.timer : undefined,
			timerRemove: categoryData.timerRemove,
			data,
		};
		if (source) {
			res.addedBy = source.MemberNumber;
		}
		categoryData.conditions[condition] = res;
	}
	modStorageSync();
	notifyOfChange();
}

export function ConditionsGetConditionLimit<C extends ConditionsCategories>(category: C, condition: ConditionsCategoryKeys[C]): ConditionsLimit {
	const handler = ConditionsGetCategoryHandler(category);
	if (!moduleIsEnabled(handler.category))
		return ConditionsLimit.blocked;
	const data = ConditionsGetCategoryData(category);
	return data.limits[condition] ?? handler.getDefaultLimits()[condition] ?? ConditionsLimit.normal;
}

export function ConditionsCheckAccess<C extends ConditionsCategories>(category: C, condition: ConditionsCategoryKeys[C], character: ChatroomCharacter): boolean {
	const limit = ConditionsGetConditionLimit(category, condition);
	if (limit === ConditionsLimit.blocked)
		return false;
	const handler = ConditionsGetCategoryHandler(category);
	return checkPermissionAccess(limit === ConditionsLimit.limited ? handler.permission_limited : handler.permission_normal, character);
}

export function ConditionsRemoveCondition<C extends ConditionsCategories>(category: C, conditions: ConditionsCategoryKeys[C] | ConditionsCategoryKeys[C][]): boolean {
	if (!ConditionsGetCategoryEnabled(category))
		return false;
	if (!Array.isArray(conditions)) {
		conditions = [conditions];
	}
	const categoryData = ConditionsGetCategoryData(category);
	const handler = ConditionsGetCategoryHandler(category);
	let changed = false;
	for (const condition of conditions) {
		if (categoryData.conditions[condition]) {
			handler.stateChangeHandler(condition, categoryData.conditions[condition]!, false);
			delete categoryData.conditions[condition];
			changed = true;
		}
	}
	if (changed) {
		modStorageSync();
		notifyOfChange();
	}
	return changed;
}

export function ConditionsSetLimit<C extends ConditionsCategories>(category: C, condition: ConditionsCategoryKeys[C], limit: ConditionsLimit, character: ChatroomCharacter | null): boolean {
	const handler = ConditionsGetCategoryHandler<ConditionsCategories>(category);
	if (!moduleIsEnabled(handler.category))
		return false;
	if (!handler.loadValidateConditionKey(condition)) {
		console.warn(`Attempt to set invalid condition limit ${category}:${condition}`);
		return false;
	}
	const data = ConditionsGetCategoryData(category);
	// No permission is failure
	if (character && !checkPermissionAccess(handler.permission_changeLimits, character)) {
		return false;
	}

	const defaultLimit = handler.getDefaultLimits()[condition] ?? ConditionsLimit.normal;
	const oldLimit = data.limits[condition] ?? defaultLimit;
	// Exit early if no change needed
	if (oldLimit === limit)
		return true;
	// Condition must not exist to change limit
	if (data.conditions[condition] !== undefined)
		return false;
	if (limit === defaultLimit) {
		delete data.limits[condition];
	} else {
		data.limits[condition] = limit;
	}
	if (character) {
		handler.logLimitChange(condition, character, limit, oldLimit);
	}
	notifyOfChange();
	modStorageSync();
	return true;
}

function ConditionsUpdateBase<C extends ConditionsCategories>(category: C, condition: ConditionsCategoryKeys[C], data: ConditionsConditionPublicDataBase): boolean {
	const handler = ConditionsGetCategoryHandler<ConditionsCategories>(category);
	if (!moduleIsEnabled(handler.category))
		return false;
	const conditionData = ConditionsGetCondition<ConditionsCategories>(category, condition);
	if (!conditionData)
		return false;
	conditionData.active = data.active;
	if (data.favorite) {
		conditionData.favorite = true;
	} else {
		delete conditionData.favorite;
	}
	if (data.requirements) {
		conditionData.requirements = data.requirements;
		// Default back to "AND", if requirements are empty
		const requirements = conditionData.requirements;
		const hasAnyRequirement = !!(requirements.room || requirements.roomName || requirements.role || requirements.player);
		if (requirements.orLogic && !hasAnyRequirement) {
			delete requirements.orLogic;
		}
	} else {
		delete conditionData.requirements;
	}
	if (data.timer !== null) {
		conditionData.timer = data.timer;
	} else {
		delete conditionData.timer;
	}
	if (data.timerRemove && data.active) {
		conditionData.timerRemove = true;
	} else {
		delete conditionData.timerRemove;
	}
	notifyOfChange();
	modStorageSync();
	return true;
}

export function ConditionsUpdate<C extends ConditionsCategories>(category: C, condition: ConditionsCategoryKeys[C], data: ConditionsConditionPublicData<C>, character: ChatroomCharacter | null): boolean {
	const handler = ConditionsGetCategoryHandler<ConditionsCategories>(category);
	if (!moduleIsEnabled(handler.category))
		return false;
	if (character && !ConditionsCheckAccess(category, condition, character))
		return false;
	const conditionData = ConditionsGetCondition<ConditionsCategories>(category, condition);
	if (!conditionData)
		return false;
	const oldData = ConditionsMakeConditionPublicData<ConditionsCategories>(handler, condition, conditionData, character);
	if (!handler.updateCondition(condition, conditionData, data.data, character, data))
		return false;
	if (!ConditionsUpdateBase(category, condition, data))
		return false;
	if (character) {
		handler.logConditionUpdate(condition, character, data, oldData);
	}
	notifyOfChange();
	modStorageSync();
	return true;
}

export function ConditionsUpdateMultiple<C extends ConditionsCategories>(category: C, conditions: ConditionsCategoryKeys[C][], data: Partial<ConditionsConditionPublicDataBase>, character: ChatroomCharacter | null): boolean {
	const handler = ConditionsGetCategoryHandler<ConditionsCategories>(category);
	if (!moduleIsEnabled(handler.category))
		return false;
	let didChange = false;
	for (const condition of conditions) {
		const conditionData = ConditionsGetCondition<ConditionsCategories>(category, condition);
		if (!conditionData)
			continue;
		const mergedData = ConditionsMakeConditionPublicData<ConditionsCategories>(handler, condition, conditionData, character);
		let conditionHasChange = false;

		if (data.active !== undefined && data.active !== mergedData.active) {
			mergedData.active = data.active;
			conditionHasChange = true;
		}

		if (data.timer !== undefined && data.timer !== mergedData.timer) {
			mergedData.timer = data.timer;
			conditionHasChange = true;
		}

		if (data.timerRemove !== undefined && data.timerRemove !== mergedData.timerRemove) {
			mergedData.timerRemove = data.timerRemove;
			conditionHasChange = true;
		}

		if (data.requirements !== undefined && data.requirements !== mergedData.requirements) {
			mergedData.requirements = data.requirements;
			conditionHasChange = true;
		}

		if (data.favorite !== undefined && data.favorite !== mergedData.favorite) {
			mergedData.favorite = data.favorite;
			conditionHasChange = true;
		}

		if (conditionHasChange) {
			didChange = ConditionsUpdate(category, condition, mergedData, character) || didChange;
		}
	}
	return didChange;
}

export function ConditionsCategoryUpdate<C extends ConditionsCategories>(category: C, data: ConditionsCategoryConfigurableData, character: ChatroomCharacter | null): boolean {
	const handler = ConditionsGetCategoryHandler<ConditionsCategories>(category);
	if (!moduleIsEnabled(handler.category))
		return false;
	if (character && (handler.permission_configure == null || !checkPermissionAccess(handler.permission_configure, character)))
		return false;
	const conditionData = ConditionsGetCategoryData<ConditionsCategories>(category);
	if (!conditionData)
		return false;
	const oldData = character && ConditionsGetCategoryPublicData(category, character);
	conditionData.requirements = data.requirements;
	// Default back to "AND", if requirements are empty
	const requirements = conditionData.requirements;
	const hasAnyRequirement = !!(requirements.room || requirements.roomName || requirements.role || requirements.player);
	if (requirements.orLogic && !hasAnyRequirement) {
		delete requirements.orLogic;
	}
	if (data.timer !== null) {
		conditionData.timer = data.timer;
	} else {
		delete conditionData.timer;
	}
	if (data.timerRemove) {
		conditionData.timerRemove = true;
	} else {
		delete conditionData.timerRemove;
	}
	conditionData.data = cloneDeep(data.data);
	if (character && oldData) {
		handler.logCategoryUpdate(character, data, oldData);
	}
	notifyOfChange();
	modStorageSync();
	return true;
}

export function ConditionsEvaluateRequirements(requirements: ConditionsConditionRequirements, highestRoleInRoom?: AccessLevel | null): boolean {
	const inChatroom = ServerPlayerIsInChatRoom();
	const chatroomPrivate = inChatroom && ChatRoomData != null && ChatRoomData.Private;
	const results: boolean[] = [];
	if (requirements.room) {
		const res = inChatroom &&
			(requirements.room.type === "public" ? !chatroomPrivate : chatroomPrivate);
		results.push(requirements.room.inverted ? !res : res);
	}
	if (requirements.roomName) {
		const res = inChatroom &&
			ChatRoomData != null &&
			typeof ChatRoomData.Name === "string" &&
			ChatRoomData.Name.toLocaleLowerCase() === requirements.roomName.name.toLocaleLowerCase();
		results.push(requirements.roomName.inverted ? !res : res);
	}
	if (requirements.role) {
		if (highestRoleInRoom === undefined) {
			highestRoleInRoom = getHighestRoleInRoom();
		}
		const res = highestRoleInRoom != null && highestRoleInRoom <= requirements.role.role;
		results.push(requirements.role.inverted ? !res : res);
	}
	if (requirements.player) {
		const res = inChatroom &&
			getAllCharactersInRoom().some(c => c.MemberNumber === requirements.player!.memberNumber);
		results.push(requirements.player.inverted ? !res : res);
	}

	if (results.length === 0)
		return true;
	else if (requirements.orLogic)
		return results.includes(true);
	else // AND logic
		return !results.includes(false);
}

export type ConditionsSubcommand = "setactive" | "triggers" | "globaltriggers" | "timer" | "defaulttimer" | "setlimit";
export const ConditionsSubcommands: ConditionsSubcommand[] = ["setactive", "triggers", "globaltriggers", "timer", "defaulttimer", "setlimit"];

/*
!curses setactive <condition> <yes/no> - Switch the curse and its conditions on and off

!curses triggers <condition> global <yes/no> - Set the trigger condition of this curse to the global configuration
!curses triggers <condition> <[for each trigger separately]>
!curses globaltriggers <[for each trigger separately]>

!curses timer <condition> <[timer handle]>
!curses defaulttimer <[timer handle]>

!curses setlimit <condition> <normal/limited/blocked> - Set a limit on certain <condition>

timer handling:
disable - Remove the timer and set lifetime to infinite
set <time> (time in /[0-9]+d [0-9]+h [0-9]+m [0-9]+s/ format, each part optional) - Set timer to the given amount of days, hours, minutes or seconds (e.g. 23h 30m)
autoremove <yes/no> - Set if the curse is removed when the timer runs out or just disables itself

(global)triggers commands:
logic <or/and>							If the logic should be OR or AND logic; defaults to AND
room ignore 							Remove the 'room type'-based trigger condition
room <is/isnot> <public/private>		Add such a 'room type'-based trigger condition
roomname ignore							Remove the 'room name'-based trigger condition
roomname <is/isnot> <name>				Add such a 'room name'-based trigger condition
role ignore								Remove the role-based trigger condition
role <with/notwith> <role>				Add such a role-based trigger condition
player ignore							Remove the person-based trigger condition
player <with/notwith> <memberNumber>	Add such a person-based trigger condition
*/

const ConditionsCommandTriggersKeywords = ["room", "roomname", "role", "player"];
function ConditionsCommandProcessTriggers(triggers: ConditionsConditionRequirements, argv: string[], sender: ChatroomCharacter, respond: (msg: string) => void): boolean {
	const trigger = (argv[0] || "").toLocaleLowerCase();
	const keyword = (argv[1] || "").toLocaleLowerCase();
	if (keyword === "ignore" && argv.length !== 2) {
		respond(`Error:\n'${trigger} ignore' does not expect any extra arguments.`);
		return true;
	}
	if (!["is", "isnot", "with", "notwith"].includes(keyword)) {
		respond(`Error:\nUnknown setting '${keyword}'. please use one of: ${trigger === "room" || trigger === "roomname" ? "is, isnot" : "with, notwith"}`);
		return true;
	}
	if (argv.length !== 3) {
		respond(`Error:\n'${trigger} ${keyword} <value>' got too many arguments. Arguments with space need to be "quoted".`);
		return true;
	}
	const inverted = (keyword === "isnot" || keyword === "notwith") ? true : undefined;
	let value = argv[2];
	if (trigger === "room") {
		if (keyword === "ignore") {
			delete triggers.room;
			return false;
		}
		value = value.toLocaleLowerCase();
		if (value !== "public" && value !== "private") {
			respond(`Error:\nRoom can be either 'public' or 'private', got: '${value}'`);
			return true;
		}
		triggers.room = {
			type: value,
			inverted,
		};
	} else if (trigger === "roomname") {
		if (keyword === "ignore") {
			delete triggers.roomName;
			return false;
		}
		triggers.roomName = {
			name: value,
			inverted,
		};
	} else if (trigger === "role") {
		if (keyword === "ignore") {
			delete triggers.role;
			return false;
		}
		const level = (AccessLevel as any)[value.toLocaleLowerCase()] as AccessLevel;
		if (typeof level !== "number" || level === AccessLevel.self) {
			respond(`Error:\n` +
				`'role ${keyword}' expects one of: clubowner, owner, lover, mistress, whitelist, friend, public; got: '${value.toLocaleLowerCase()}'`);
			return true;
		}
		triggers.role = {
			role: level,
			inverted,
		};
	} else if (trigger === "player") {
		if (keyword === "ignore") {
			delete triggers.player;
			return false;
		}
		const target = Command_selectCharacterMemberNumber(value, true);
		if (typeof target === "string") {
			respond(target);
			return true;
		}
		triggers.player = {
			memberNumber: target,
			inverted,
		};
	}
	return false;
}
function ConditionsCommandTriggersAutocomplete(argv: string[], sender: ChatroomCharacter): string[] {
	const trigger = (argv[0] || "").toLocaleLowerCase();
	if (argv.length < 2)
		return [];
	if (trigger === "room" && argv.length === 2) {
		return Command_pickAutocomplete(argv[1], ["ignore", "is", "isnot"]);
	}
	if (trigger === "room" && argv.length === 3) {
		return Command_pickAutocomplete(argv[2], ["public", "private"]);
	}
	if (trigger === "roomname" && argv.length === 2) {
		return Command_pickAutocomplete(argv[1], ["ignore", "is", "isnot"]);
	}
	if (trigger === "role" && argv.length === 2) {
		return Command_pickAutocomplete(argv[1], ["ignore", "with", "notwith"]);
	}
	if (trigger === "role" && argv.length === 3) {
		return Command_pickAutocomplete(argv[2], ["clubowner", "owner", "lover", "mistress", "whitelist", "friend", "public"]);
	}
	if (trigger === "player" && argv.length === 2) {
		return Command_pickAutocomplete(argv[1], ["ignore", "with", "notwith"]);
	}
	if (trigger === "player" && argv.length === 3) {
		return Command_selectCharacterAutocomplete(argv[2]);
	}
	return [];
}

export function ConditionsRunSubcommand(category: ConditionsCategories, argv: string[], sender: ChatroomCharacter, respond: (msg: string) => void): void {
	const subcommand = (argv[0] || "").toLocaleLowerCase() as ConditionsSubcommand;
	if (!ConditionsSubcommands.includes(subcommand)) {
		throw new Error(`Subcomand "${subcommand}" passed to ConditionsRunSubcommand isn't valid ConditionsSubcommand`);
	}

	const handler = conditionHandlers.get(category);
	if (!handler) {
		throw new Error(`Attempt to run command for unknown conditions category ${category}`);
	}
	if (!moduleIsEnabled(handler.category)) {
		return respond(`The command failed to execute, because ${Player.Name} disabled her ${MODULE_NAMES[handler.category]} module.`);
	}
	const categoryData = ConditionsGetCategoryData(category);
	const categorySingular = category.slice(0, -1);
	const CSHelp = handler.commandConditionSelectorHelp;

	if (subcommand === "setactive") {
		const active = (argv[2] || "").toLocaleLowerCase();
		if (argv.length !== 3 || active !== "yes" && active !== "no") {
			return respond(`Usage:\nsetactive <${CSHelp}> <yes/no>`);
		}
		const [result, condition] = handler.parseConditionName(argv[1], typedObjectAssumedKeys(categoryData.conditions));
		if (!result) {
			return respond(condition);
		}
		if (!categoryData.conditions[condition]) {
			return respond(`This ${categorySingular} doesn't exist`);
		}
		const conditionData = ConditionsMakeConditionPublicData(handler, condition, categoryData.conditions[condition]!, sender);
		conditionData.active = active === "yes";
		respond(ConditionsUpdate(category, condition, conditionData, sender) ? `Ok.` : COMMAND_GENERIC_ERROR);
	} else if (subcommand === "triggers") {
		const [result, condition] = handler.parseConditionName(argv[1] || "", typedObjectAssumedKeys(categoryData.conditions));
		if (!result) {
			return respond(condition);
		}
		if (!categoryData.conditions[condition]) {
			return respond(`This ${categorySingular} doesn't exist`);
		}
		const conditionData = ConditionsMakeConditionPublicData(handler, condition, categoryData.conditions[condition]!, sender);
		const keyword = (argv[2] || "").toLocaleLowerCase();
		if (!keyword) {
			if (!conditionData.requirements) {
				return respond(`Current status:\n` +
					`Uses global ${category} trigger configuration`
				);
			} else {
				const triggers: string[] = [];
				const r = conditionData.requirements;
				triggers.push(r.orLogic ? `Logic: OR (at least one)` : `Logic: AND (all of)`);
				if (r.room) {
					triggers.push(`When ${r.room.inverted ? "not in" : "in"} ${r.room.type} room`);
				}
				if (r.roomName) {
					triggers.push(`When ${r.roomName.inverted ? "not in" : "in"} room named '${r.roomName.name}'`);
				}
				if (r.role) {
					const role = capitalizeFirstLetter(AccessLevel[r.role.role]) + (r.role.role !== AccessLevel.clubowner ? " ↑" : "");
					triggers.push(`When ${r.role.inverted ? "not in" : "in"} room with role '${role}'`);
				}
				if (r.player) {
					const name = getCharacterName(r.player.memberNumber, null);
					triggers.push(`When ${r.player.inverted ? "not in" : "in"} room with member '${r.player.memberNumber}'${name ? ` (${name})` : ""}`);
				}
				if (triggers.length > 1) {
					return respond(`Current status:\n` +
						`This ${categorySingular} will trigger under following conditions:\n` +
						triggers.join("\n")
					);
				} else {
					return respond(`Current status:\n` +
						`No triggers are set. The ${categorySingular} will now always trigger, while it is active`
					);
				}
			}
		} else if (keyword === "global") {
			const global = (argv[3] || "").toLocaleLowerCase();
			if (argv.length !== 4 || global !== "yes" && global !== "no") {
				return respond(`Usage:\ntriggers <${CSHelp}> global <yes/no>`);
			}
			if (global === "yes") {
				conditionData.requirements = null;
			} else if (!conditionData.requirements) {
				conditionData.requirements = cloneDeep(categoryData.requirements);
			}
		} else if (keyword === "logic") {
			const logic = (argv[3] || "").toLocaleLowerCase();
			if (argv.length !== 4 || logic !== "or" && logic !== "and") {
				return respond(`Usage:\ntriggers <${CSHelp}> logic <or/and>`);
			}
			if (!conditionData.requirements) {
				return respond(`Cannot configure specific trigger while using global data. First use:\ntriggers <${CSHelp}> global no`);
			}
			if (logic === "or") {
				conditionData.requirements.orLogic = true;
			} else {
				delete conditionData.requirements.orLogic;
			}
		} else if (!ConditionsCommandTriggersKeywords.includes(keyword)) {
			return respond(
				`${keyword !== "help" ? `Unknown trigger '${keyword}'. ` : ""}List of possible 'triggers <${CSHelp}> *' options:\n` +
				`global <yes/no> - Set the trigger condition of this ${categorySingular} to the global configuration\n` +
				`logic <or/and>	- Set if the logic should be OR (at least one) or AND (all of) logic; default is AND\n` +
				`room ignore - Remove the 'room type'-based trigger condition\n` +
				`room <is/isnot> <public/private> - Add such a 'room type'-based trigger condition\n` +
				`roomname ignore - Remove the 'room name'-based trigger condition\n` +
				`roomname <is/isnot> <name> - Add such a 'room name'-based trigger condition\n` +
				`role ignore - Remove the role-based trigger condition\n` +
				`role <with/notwith> <role> - Add such a role-based trigger condition\n` +
				`player ignore - Remove the person-based trigger condition\n` +
				`player <with/notwith> <memberNumber> - Add such a person-based trigger condition\n\n` +
				`To show currently set triggers, use just 'triggers <group>' without adding one of the above sub-commands.`
			);
		} else if (!conditionData.requirements) {
			return respond(`Cannot configure specific trigger while using global data. First use:\ntriggers <${CSHelp}> global no`);
		} else {
			if (ConditionsCommandProcessTriggers(conditionData.requirements, argv.slice(2), sender, respond))
				return;
		}
		respond(ConditionsUpdate(category, condition, conditionData, sender) ? `Ok.` : COMMAND_GENERIC_ERROR);
	} else if (subcommand === "globaltriggers") {
		const configData = ConditionsGetCategoryPublicData(category, sender);
		if (!argv[1]) {
			const triggers: string[] = [];
			const r = configData.requirements;
			triggers.push(r.orLogic ? `Logic: OR (at least one)` : `Logic: AND (all of)`);
			if (r.room) {
				triggers.push(`When ${r.room.inverted ? "not in" : "in"} ${r.room.type} room`);
			}
			if (r.roomName) {
				triggers.push(`When ${r.roomName.inverted ? "not in" : "in"} room named '${r.roomName.name}'`);
			}
			if (r.role) {
				const role = capitalizeFirstLetter(AccessLevel[r.role.role]) + (r.role.role !== AccessLevel.clubowner ? " ↑" : "");
				triggers.push(`When ${r.role.inverted ? "not in" : "in"} room with role '${role}'`);
			}
			if (r.player) {
				const name = getCharacterName(r.player.memberNumber, null);
				triggers.push(`When ${r.player.inverted ? "not in" : "in"} room with member '${r.player.memberNumber}'${name ? ` (${name})` : ""}`);
			}
			if (triggers.length > 1) {
				return respond(`Current status:\n` +
					`Globally ${category} are set to trigger under following conditions:\n` +
					triggers.join("\n")
				);
			} else {
				return respond(`Current status:\n` +
					`No triggers are set globally. ${capitalizeFirstLetter(category)} using global config will now always trigger, if they are active`
				);
			}
		} else if (argv[1].toLocaleLowerCase() === "logic") {
			const logic = (argv[2] || "").toLocaleLowerCase();
			if (argv.length !== 3 || logic !== "or" && logic !== "and") {
				return respond(`Usage:\nglobaltriggers logic <or/and>`);
			}
			if (logic === "or") {
				configData.requirements.orLogic = true;
			} else {
				delete configData.requirements.orLogic;
			}
		} else if (!ConditionsCommandTriggersKeywords.includes(argv[1].toLocaleLowerCase())) {
			return respond(
				`${argv[1] !== "help" ? `Unknown trigger '${argv[1].toLocaleLowerCase()}'. ` : ""}List of possible 'globaltriggers *' options:\n` +
				`logic <or/and>	- Set if the logic should be OR (at least one) or AND (all of) logic; default is AND\n` +
				`room ignore - Remove the 'room type'-based trigger condition\n` +
				`room <is/isnot> <public/private> - Add such a 'room type'-based trigger condition\n` +
				`roomname ignore - Remove the 'room name'-based trigger condition\n` +
				`roomname <is/isnot> <name> - Add such a 'room name'-based trigger condition\n` +
				`role ignore - Remove the role-based trigger condition\n` +
				`role <with/notwith> <role> - Add such a role-based trigger condition\n` +
				`player ignore - Remove the person-based trigger condition\n` +
				`player <with/notwith> <memberNumber> - Add such a person-based trigger condition\n\n` +
				`To show currently set global triggers, use just 'globaltriggers' without anything behind.`
			);
		} else {
			if (ConditionsCommandProcessTriggers(configData.requirements, argv.slice(1), sender, respond))
				return;
		}
		respond(ConditionsCategoryUpdate(category, configData, sender) ? `Ok.` : COMMAND_GENERIC_ERROR);
	} else if (subcommand === "timer") {
		const [result, condition] = handler.parseConditionName(argv[1] || "", typedObjectAssumedKeys(categoryData.conditions));
		if (!result) {
			return respond(condition);
		}
		if (!categoryData.conditions[condition]) {
			return respond(`This ${categorySingular} doesn't exist`);
		}
		const keyword = (argv[2] || "").toLocaleLowerCase();
		if (keyword !== "set" && keyword !== "disable" && keyword !== "autoremove") {
			return respond(`Usage:\n` +
				`timer <${CSHelp}> disable - Remove the timer and set lifetime to infinite\n` +
				`timer <${CSHelp}> set <time> - Set timer to the given amount of days, hours, minutes or seconds (e.g. 23h 30m)\n` +
				`timer <${CSHelp}> autoremove <yes/no> - Set if the ${categorySingular} is removed when the timer runs out or just disables itself`
			);
		}
		const conditionData = ConditionsMakeConditionPublicData(handler, condition, categoryData.conditions[condition]!, sender);
		if (keyword === "disable") {
			conditionData.timer = null;
			conditionData.timerRemove = false;
		} else if (keyword === "set") {
			let time = 0;
			for (const v of argv.slice(3)) {
				const i = Command_parseTime(v);
				if (typeof i === "string") {
					return respond(i);
				}
				time += i;
			}
			conditionData.timer = Date.now() + time;
		} else if (keyword === "autoremove") {
			const autoremove = (argv[3] || "").toLocaleLowerCase();
			if (argv.length !== 4 || autoremove !== "yes" && autoremove !== "no") {
				return respond(`Usage:\ntimer <${CSHelp}> autoremove <yes/no>`);
			} else if (!conditionData.active) {
				return respond(`Timer is counting until ${categorySingular} becomes enabled, cannot use autoremove in this mode.`);
			} else if (conditionData.timer === null) {
				return respond(`Timer is disabled on this ${categorySingular}. To use autoremove, first set timer`);
			}
			conditionData.timerRemove = autoremove === "yes";
		}
		respond(ConditionsUpdate(category, condition, conditionData, sender) ? `Ok.` : COMMAND_GENERIC_ERROR);
	} else if (subcommand === "defaulttimer") {
		const keyword = (argv[1] || "").toLocaleLowerCase();
		if (keyword !== "set" && keyword !== "disable" && keyword !== "autoremove") {
			return respond(`Usage:\n` +
				`defaulttimer disable - Remove the timer and set lifetime to infinite\n` +
				`defaulttimer set <time> - Set timer to the given amount of days, hours, minutes or seconds (e.g. 23h 30m)\n` +
				`defaulttimer autoremove <yes/no> - Set if the ${categorySingular} is removed when the timer runs out or just disables itself`
			);
		}
		const configData = ConditionsGetCategoryPublicData(category, sender);
		if (keyword === "disable") {
			configData.timer = null;
			configData.timerRemove = false;
		} else if (keyword === "set") {
			let time = 0;
			for (const v of argv.slice(2)) {
				const i = Command_parseTime(v);
				if (typeof i === "string") {
					return respond(i);
				}
				time += i;
			}
			configData.timer = time;
		} else if (keyword === "autoremove") {
			const autoremove = (argv[2] || "").toLocaleLowerCase();
			if (argv.length !== 3 || autoremove !== "yes" && autoremove !== "no") {
				return respond(`Usage:\ndefaulttimer <${CSHelp}> autoremove <yes/no>`);
			}
			if (configData.timer === null) {
				return respond(`Timer is disabled by default for ${category}. To use autoremove, first set timer`);
			}
			configData.timerRemove = autoremove === "yes";
		}
		respond(ConditionsCategoryUpdate(category, configData, sender) ? `Ok.` : COMMAND_GENERIC_ERROR);
	} else if (subcommand === "setlimit") {
		const [result, condition] = handler.parseConditionName(argv[1] || "", false);
		if (!result) {
			return respond(condition);
		}
		if (!handler.loadValidateConditionKey(condition)) {
			throw new Error("Parse name returned invalid condition key");
		}
		const keyword = (argv[2] || "").toLocaleLowerCase();
		if (keyword !== "normal" && keyword !== "limited" && keyword !== "blocked") {
			return respond(`Usage:\n` +
				`setlimit <${CSHelp}> <normal/limited/blocked> - Set a limit on certain <${CSHelp}>`
			);
		}
		respond(ConditionsSetLimit(category, condition, ConditionsLimit[keyword], sender) ? `Ok.` : COMMAND_GENERIC_ERROR);
	}
}

export function ConditionsAutocompleteSubcommand(category: ConditionsCategories, argv: string[], sender: ChatroomCharacter): string[] {
	const subcommand = (argv[0] || "").toLocaleLowerCase() as ConditionsSubcommand;
	if (!ConditionsSubcommands.includes(subcommand)) {
		throw new Error(`Subcomand "${subcommand}" passed to ConditionsAutocompleteSubcommand isn't valid ConditionsSubcommand`);
	}

	const handler = conditionHandlers.get(category);
	if (!handler) {
		throw new Error(`Attempt to autocomplete command for unknown conditions category ${category}`);
	}
	if (!moduleIsEnabled(handler.category))
		return [];
	const categoryData = ConditionsGetCategoryData(category);

	if (subcommand === "setactive") {
		if (argv.length === 2) {
			return handler.autocompleteConditionName(argv[1], typedObjectAssumedKeys(categoryData.conditions));
		} else if (argv.length === 3) {
			return Command_pickAutocomplete(argv[2], ["yes", "no"]);
		}
	} else if (subcommand === "triggers") {
		if (argv.length === 2) {
			return handler.autocompleteConditionName(argv[1], typedObjectAssumedKeys(categoryData.conditions));
		}
		const [result, condition] = handler.parseConditionName(argv[1] || "", typedObjectAssumedKeys(categoryData.conditions));
		if (!result || !categoryData.conditions[condition]) {
			return [];
		}
		if (argv.length === 3) {
			return Command_pickAutocomplete(argv[2], ["global", "logic", ...ConditionsCommandTriggersKeywords]);
		}
		if (argv[2].toLocaleLowerCase() === "global") {
			return Command_pickAutocomplete(argv[3], ["yes", "no"]);
		} else if (argv[2].toLocaleLowerCase() === "logic") {
			return Command_pickAutocomplete(argv[3], ["and", "or"]);
		} else if (categoryData.conditions[condition]!.requirements && ConditionsCommandTriggersKeywords.includes(argv[2].toLocaleLowerCase())) {
			return ConditionsCommandTriggersAutocomplete(argv.slice(2), sender);
		}
	} else if (subcommand === "globaltriggers") {
		if (argv.length === 2) {
			return Command_pickAutocomplete(argv[1], ["logic", ...ConditionsCommandTriggersKeywords]);
		} else if (argv[1].toLocaleLowerCase() === "logic") {
			return Command_pickAutocomplete(argv[2], ["and", "or"]);
		} else if (ConditionsCommandTriggersKeywords.includes(argv[2].toLocaleLowerCase())) {
			return ConditionsCommandTriggersAutocomplete(argv.slice(1), sender);
		}
	} else if (subcommand === "timer") {
		if (argv.length === 2) {
			return handler.autocompleteConditionName(argv[1], typedObjectAssumedKeys(categoryData.conditions));
		} else if (argv.length === 3) {
			return Command_pickAutocomplete(argv[2], ["set", "disable", "autoremove"]);
		} else if (argv.length === 4 && argv[2].toLocaleLowerCase() === "autoremove") {
			return Command_pickAutocomplete(argv[3], ["yes", "no"]);
		}
	} else if (subcommand === "defaulttimer") {
		if (argv.length === 2) {
			return Command_pickAutocomplete(argv[1], ["set", "disable", "autoremove"]);
		} else if (argv.length === 3 && argv[1].toLocaleLowerCase() === "autoremove") {
			return Command_pickAutocomplete(argv[2], ["yes", "no"]);
		}
	} else if (subcommand === "setlimit") {
		if (argv.length === 2) {
			return handler.autocompleteConditionName(argv[1], false);
		} else if (argv.length === 3) {
			return Command_pickAutocomplete(argv[2], ["normal", "limited", "blocked"]);
		}
	}

	return [];
}

export class ModuleConditions extends BaseModule {
	private timer: number | null = null;

	load() {
		if (!isObject(modStorage.conditions)) {
			modStorage.conditions = {};
		}

		// cursedItems migration
		if (modStorage.cursedItems) {
			const curses: ConditionsCategoryData<"curses"> = modStorage.conditions.curses = {
				conditions: {},
				limits: {},
				requirements: {},
				data: {
					itemRemove: false,
				},
			};
			for (const [group, data] of Object.entries(modStorage.cursedItems)) {
				if (!isAssetGroupName(group))
					continue;
				curses.conditions[group] = {
					active: true,
					lastActive: false,
					data,
				};
			}
			delete modStorage.cursedItems;
		}

		for (const key of Object.keys(modStorage.conditions) as ConditionsCategories[]) {
			const handler = conditionHandlers.get(key);
			if (!handler || !moduleIsEnabled(handler.category)) {
				console.debug(`BCX: Removing unknown or disabled conditions category ${key}`);
				delete modStorage.conditions[key];
				continue;
			}
			const data: ConditionsCategoryData<ConditionsCategories> | undefined = modStorage.conditions[key];
			if (!isObject(data) || !isObject(data.conditions)) {
				console.warn(`BCX: Removing category ${key} with invalid data`);
				delete modStorage.conditions[key];
				continue;
			}
			if (data.timer !== undefined && typeof data.timer !== "number") {
				console.warn(`BCX: Removing category ${key} invalid timer`, data.timer);
				delete data.timer;
			}
			// eslint-disable-next-line @typescript-eslint/no-unnecessary-boolean-literal-compare
			if (data.timerRemove !== undefined && data.timerRemove !== true) {
				console.warn(`BCX: Removing category ${key} invalid timerRemove`, data.timerRemove);
				delete data.timerRemove;
			}
			if (!isObject(data.limits)) {
				console.warn(`BCX: Resetting category ${key} limits with invalid data`);
				data.limits = {};
			}
			for (const [condition, limitValue] of typedObjectAssumedEntries(data.limits)) {
				if (!handler.loadValidateConditionKey(condition)) {
					console.warn(`BCX: Unknown condition ${key}:${condition} limit, removing it`);
					delete data.limits[condition];
				} else if (typeof limitValue !== "number" ||
					limitValue === (handler.getDefaultLimits()[condition] ?? ConditionsLimit.normal) ||
					ConditionsLimit[limitValue] === undefined
				) {
					console.warn(`BCX: Bad condition ${key}:${condition} limit value, removing it`, limitValue);
					delete data.limits[condition];
				}
			}

			if (!guard_ConditionsConditionRequirements(data.requirements)) {
				console.warn(`BCX: Resetting category ${key} requirements with invalid data`);
				data.requirements = {};
			}

			data.data = handler.loadCategorySpecificGlobalData(data.data);

			for (const [condition, conditiondata] of typedObjectAssumedEntries(data.conditions)) {
				if (!conditiondata)
					continue;
				if (!handler.loadValidateConditionKey(condition)) {
					console.warn(`BCX: Unknown condition ${key}:${condition}, removing it`);
					delete data.conditions[condition];
					continue;
				} else if (!handler.loadValidateCondition(condition, conditiondata)) {
					delete data.conditions[condition];
					continue;
				} else if (
					typeof conditiondata.active !== "boolean" ||
					conditiondata.requirements !== undefined && !guard_ConditionsConditionRequirements(conditiondata.requirements) ||
					conditiondata.timer !== undefined && typeof conditiondata.timer !== "number" ||
					// eslint-disable-next-line @typescript-eslint/no-unnecessary-boolean-literal-compare
					conditiondata.timerRemove !== undefined && conditiondata.timerRemove !== true ||
					// eslint-disable-next-line @typescript-eslint/no-unnecessary-boolean-literal-compare
					conditiondata.favorite !== undefined && conditiondata.favorite !== true
				) {
					console.warn(`BCX: Condition ${key}:${condition} has bad data, removing it`);
					delete data.conditions[condition];
					continue;
				} else if (ConditionsGetConditionLimit(key, condition) === ConditionsLimit.blocked) {
					console.warn(`BCX: Condition ${key}:${condition} became blocked while active, removing it`);
					delete data.conditions[condition];
					continue;
				}
				if (conditiondata.timerRemove && !conditiondata.active) {
					console.warn(`BCX: Condition ${key}:${condition} had timerRemove while inactive, cleaning up`);
					delete conditiondata.timerRemove;
				}
				if (typeof conditiondata.lastActive !== "boolean") {
					console.warn(`BCX: Condition ${key}:${condition} missing lastActive, adding`);
					conditiondata.lastActive = false;
				}
				if (conditiondata.addedBy !== undefined && !Number.isInteger(conditiondata.addedBy)) {
					console.warn(`BCX: Condition ${key}:${condition} bad addedBy, cleaning up`, conditiondata.addedBy);
					delete conditiondata.addedBy;
				}
			}
		}

		for (const [key, handler] of conditionHandlers.entries()) {
			if (moduleIsEnabled(handler.category) && !isObject(modStorage.conditions[key])) {
				console.debug(`BCX: Adding missing conditions category ${key}`);
				(modStorage.conditions as Record<ConditionsCategories, ConditionsCategoryData>)[key] = {
					conditions: {},
					limits: {},
					requirements: {},
					data: handler.loadCategorySpecificGlobalData(undefined),
				};
			}
		}

		queryHandlers.conditionsGet = (sender, data) => {
			if (typeof data === "string" && conditionHandlers.has(data) && ConditionsGetCategoryEnabled(data)) {
				return ConditionsGetCategoryPublicData(data, sender);
			} else {
				return undefined;
			}
		};

		queryHandlers.conditionSetLimit = (sender, data) => {
			if (isObject(data) &&
				typeof data.category === "string" &&
				conditionHandlers.has(data.category) &&
				typeof data.condition === "string" &&
				typeof data.limit === "number" &&
				ConditionsLimit[data.limit] !== undefined
			) {
				return ConditionsSetLimit(data.category, data.condition, data.limit, sender);
			} else {
				return undefined;
			}
		};

		queryHandlers.conditionUpdate = (sender, data) => {
			if (isObject(data) &&
				typeof data.category === "string" &&
				conditionHandlers.has(data.category) &&
				typeof data.condition === "string" &&
				guard_ConditionsConditionPublicData(data.category, data.condition, data.data)
			) {
				return ConditionsUpdate(data.category, data.condition, data.data, sender);
			} else {
				return undefined;
			}
		};

		queryHandlers.conditionUpdateMultiple = (sender, data) => {
			if (isObject(data) &&
				typeof data.category === "string" &&
				conditionHandlers.has(data.category) &&
				Array.isArray(data.conditions) &&
				data.conditions.every(c => typeof c === "string" && conditionHandlers.get(data.category)?.loadValidateConditionKey(c)) &&
				isObject(data.data) &&
				(data.data.active === undefined || typeof data.data.active === "boolean") &&
				(data.data.timer === undefined || data.data.timer === null || typeof data.data.timer === "number") &&
				(data.data.timerRemove === undefined || typeof data.data.timerRemove === "boolean") &&
				(data.data.requirements === undefined || data.data.requirements === null || guard_ConditionsConditionRequirements(data.data.requirements)) &&
				(data.data.favorite === undefined || typeof data.data.favorite === "boolean")
			) {
				return ConditionsUpdateMultiple(data.category, data.conditions, data.data, sender);
			} else {
				return undefined;
			}
		};

		queryHandlers.conditionCategoryUpdate = (sender, data) => {
			if (isObject(data) &&
				typeof data.category === "string" &&
				conditionHandlers.has(data.category) &&
				isObject(data.data) &&
				(data.data.timer === null || typeof data.data.timer === "number") &&
				typeof data.data.timerRemove === "boolean" &&
				guard_ConditionsConditionRequirements(data.data.requirements)
			) {
				return ConditionsCategoryUpdate(data.category, data.data, sender);
			} else {
				return undefined;
			}
		};
	}

	run() {
		this.timer = BCX_setInterval(() => this.conditionsTick(), CONDITIONS_CHECK_INTERVAL);
	}

	unload() {
		if (this.timer !== null) {
			clearInterval(this.timer);
			this.timer = null;
		}
	}

	reload() {
		this.unload();
		this.load();
		this.run();
	}

	conditionsTick() {
		if (!ServerIsConnected || !modStorage.conditions)
			return;

		let dataChanged = false;
		const now = Date.now();

		for (const [category, handler] of conditionHandlers.entries()) {
			const categoryData = modStorage.conditions[category];

			if (!moduleIsEnabled(handler.category) || !categoryData)
				continue;

			for (const [conditionName, conditionData] of typedObjectAssumedEntries<Partial<Record<ConditionsCategoryKeys[ConditionsCategories], ConditionsConditionData<ConditionsCategories>>>>(categoryData.conditions)) {
				if (!conditionData)
					continue;
				if (conditionData.timer !== undefined && conditionData.timer <= now) {
					if (conditionData.timerRemove && conditionData.active) {
						ConditionsRemoveCondition(category, conditionName);
						return;
					} else {
						delete conditionData.timer;
						delete conditionData.timerRemove;
						conditionData.active = !conditionData.active;
						dataChanged = true;
					}
				}

				const resolvedActive = conditionData.active && ConditionsEvaluateRequirements(conditionData.requirements ?? categoryData.requirements);

				if (resolvedActive !== conditionData.lastActive) {
					conditionData.lastActive = resolvedActive;
					dataChanged = true;
					const copyChange = cloneDeep(conditionData);

					handler.stateChangeHandler(conditionName, conditionData, resolvedActive);

					if (!isEqual(copyChange, conditionData)) {
						dataChanged = true;
					}
				}

				if (!resolvedActive)
					continue;

				const copy = cloneDeep(conditionData);

				handler.tickHandler(conditionName, conditionData);

				if (!isEqual(copy, conditionData)) {
					dataChanged = true;
				}
			}

			handler.afterTickHandler?.();
		}

		if (dataChanged) {
			modStorageSync();
			notifyOfChange();
		}
	}
}
