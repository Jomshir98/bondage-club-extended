import { ConditionsLimit, ModuleCategory, ModuleInitPhase } from "../constants";
import { moduleInitPhase } from "../moduleManager";
import { isObject } from "../utils";
import { notifyOfChange, queryHandlers } from "./messaging";
import { moduleIsEnabled } from "./presets";
import { modStorage, modStorageSync } from "./storage";
import { BaseModule } from "./_BaseModule";

import cloneDeep from "lodash-es/cloneDeep";
import isEqual from "lodash-es/isEqual";
import { ChatroomCharacter, getChatroomCharacter } from "../characters";
import { checkPermissionAccess } from "./authority";

const CONDITIONS_CHECK_INTERVAL = 2_000;

export interface ConditionsHandler<C extends ConditionsCategories> {
	category: ModuleCategory;
	permission_normal: BCX_Permissions;
	permission_limited: BCX_Permissions;
	permission_configure: BCX_Permissions;
	permission_changeLimits: BCX_Permissions;
	loadValidateConditionKey(key: string): boolean;
	loadValidateCondition(key: string, data: ConditionsConditionData<C>): boolean;
	tickHandler(condition: ConditionsCategoryKeys[C], data: ConditionsConditionData<C>): void;
	makePublicData(condition: ConditionsCategoryKeys[C], data: ConditionsConditionData<C>): ConditionsCategorySpecificPublicData[C];
	validatePublicData(condition: ConditionsCategoryKeys[C], data: ConditionsCategorySpecificPublicData[C]): boolean;
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
}

export function ConditionsGetCategoryHandler<C extends ConditionsCategories>(category: C): ConditionsHandler<C> {
	const handler = conditionHandlers.get(category);
	if (!handler) {
		throw new Error(`No handler for conditions category ${category}`);
	}
	return handler as ConditionsHandler<C>;
}

export function ConditionsGetCategoryData<C extends ConditionsCategories>(category: C): ConditionsCategoryData<C> {
	if (!conditionHandlers.has(category)) {
		throw new Error(`Attempt to get unknown conditions category data ${category}`);
	}
	const data = modStorage.conditions?.[category];
	if (!data) {
		throw new Error(`Attempt to get data for uninitialized category ${category}`);
	}
	return data as ConditionsCategoryData<C>;
}

export function ConditionsGetCategoryPublicData<C extends ConditionsCategories>(category: C, requester: ChatroomCharacter): ConditionsCategoryPublicData<C> {
	const handler = ConditionsGetCategoryHandler<ConditionsCategories>(category);
	const data = ConditionsGetCategoryData<ConditionsCategories>(category);
	const res: ConditionsCategoryPublicData<ConditionsCategories> = {
		access_normal: checkPermissionAccess(handler.permission_normal, requester),
		access_limited: checkPermissionAccess(handler.permission_limited, requester),
		access_configure: checkPermissionAccess(handler.permission_configure, requester),
		access_changeLimits: checkPermissionAccess(handler.permission_changeLimits, requester),
		conditions: {},
		limits: cloneDeep(data.limits)
	};
	for (const [condition, conditionData] of Object.entries(data.conditions)) {
		res.conditions[condition] = {
			active: conditionData.active,
			data: handler.makePublicData(condition, conditionData)
		};
	}
	return res as ConditionsCategoryPublicData<C>;
}

export function ConditionsValidatePublicData<C extends ConditionsCategories>(category: C, condition: string, data: ConditionsConditionPublicData): boolean {
	const handler = conditionHandlers.get(category);
	if (!handler)
		return false;
	return isObject(data) &&
		typeof data.active === "boolean" &&
		handler.validatePublicData(condition, data.data);
}

export function ConditionsGetCondition<C extends ConditionsCategories>(category: C, condition: ConditionsCategoryKeys[C]): ConditionsConditionData<C> | undefined {
	return ConditionsGetCategoryData(category).conditions[condition];
}

export function ConditionsSetCondition<C extends ConditionsCategories>(category: C, condition: ConditionsCategoryKeys[C], data: ConditionsConditionData<C>) {
	const handler = ConditionsGetCategoryHandler(category);
	if (!moduleIsEnabled(handler.category))
		return;
	const categoryData = ConditionsGetCategoryData(category);
	categoryData.conditions[condition] = data;
	modStorageSync();
	notifyOfChange();
}

export function ConditionsGetConditionLimit<C extends ConditionsCategories>(category: C, condition: ConditionsCategoryKeys[C]): ConditionsLimit {
	const handler = ConditionsGetCategoryHandler(category);
	if (!moduleIsEnabled(handler.category))
		return ConditionsLimit.blocked;
	const data = ConditionsGetCategoryData(category);
	return data.limits[condition] ?? ConditionsLimit.normal;
}

export function ConditionsCheckAccess<C extends ConditionsCategories>(category: C, condition: ConditionsCategoryKeys[C], character: ChatroomCharacter): boolean {
	const limit = ConditionsGetConditionLimit(category, condition);
	if (limit === ConditionsLimit.blocked)
		return false;
	const handler = ConditionsGetCategoryHandler(category);
	return checkPermissionAccess(limit === ConditionsLimit.limited ? handler.permission_limited : handler.permission_normal, character);
}

export function ConditionsRemoveCondition<C extends ConditionsCategories>(category: C, conditions: ConditionsCategoryKeys[C] | ConditionsCategoryKeys[C][]): boolean {
	if (!Array.isArray(conditions)) {
		conditions = [conditions];
	}
	const categoryData = ConditionsGetCategoryData(category);
	let changed = false;
	for (const condition of conditions) {
		if (categoryData.conditions[condition]) {
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

export function ConditionsSetActive<C extends ConditionsCategories>(category: C, condition: ConditionsCategoryKeys[C], active: boolean, character: ChatroomCharacter | null): boolean {
	const categoryData = ConditionsGetCategoryData(category);
	const conditionData = categoryData.conditions[condition];
	if (conditionData) {
		if (character && !ConditionsCheckAccess(category, condition, character))
			return false;
		if (conditionData.active !== active) {
			conditionData.active = active;
			if (character) {
				// TODO: log
			}
			notifyOfChange();
			modStorageSync();
		}
		return true;
	}
	return false;
}

export function ConditionsSetLimit<C extends ConditionsCategories>(category: C, condition: ConditionsCategoryKeys[C], limit: ConditionsLimit, character: ChatroomCharacter | null): boolean {
	const handler = conditionHandlers.get(category);
	if (!handler) {
		throw new Error(`Attempt to set limit for unknown conditions category ${category}`);
	}
	if (!moduleIsEnabled(handler.category))
		return false;
	if (!handler.loadValidateConditionKey(condition)) {
		console.warn(`Attempt to set invalid condition limit ${category}:${condition}`);
		return false;
	}
	const data = ConditionsGetCategoryData(category);
	if (character && !checkPermissionAccess(handler.permission_changeLimits, character)) {
		return false;
	}
	if (data.conditions[condition] !== undefined)
		return false;
	if ((data.limits[condition] ?? ConditionsLimit.normal) === limit)
		return true;
	if (limit === ConditionsLimit.normal) {
		delete data.limits[condition];
	} else {
		data.limits[condition] = limit;
	}
	if (character) {
		// TODO: log
	}
	notifyOfChange();
	modStorageSync();
	return true;
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
				limits: {}
			};
			for (const [group, data] of Object.entries(modStorage.cursedItems)) {
				curses.conditions[group] = {
					active: true,
					data
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
			const data = modStorage.conditions[key];
			if (!isObject(data) || !isObject(data.conditions)) {
				console.warn(`BCX: Removing category ${key} with invalid data`);
				delete modStorage.conditions[key];
				continue;
			}

			if (!isObject(data.limits)) {
				console.warn(`BCX: Resetting category ${key} limits with invalid data`);
				data.limits = {};
			}
			for (const [condition, limitValue] of Object.entries(data.limits)) {
				if (!handler.loadValidateConditionKey(condition)) {
					console.warn(`BCX: Unknown condition ${key}:${condition} limit, removing it`);
					delete data.limits[condition];
				} else if (typeof limitValue !== "number" ||
					limitValue === ConditionsLimit.normal ||
					ConditionsLimit[limitValue] === undefined
				) {
					console.warn(`BCX: Unknown condition ${key}:${condition} limit value, removing it`, limitValue);
					delete data.limits[condition];
				}
			}

			for (const [condition, conditiondata] of Object.entries(data.conditions)) {
				if (!handler.loadValidateConditionKey(condition)) {
					console.warn(`BCX: Unknown condition ${key}:${condition}, removing it`);
					delete data.conditions[condition];
				} else if (!handler.loadValidateCondition(condition, conditiondata)) {
					delete data.conditions[condition];
				}
			}
		}

		for (const [key, handler] of conditionHandlers.entries()) {
			if (moduleIsEnabled(handler.category) && !isObject(modStorage.conditions[key])) {
				console.debug(`BCX: Adding missing conditions category ${key}`);
				modStorage.conditions[key] = {
					conditions: {},
					limits: {}
				};
			}
		}

		queryHandlers.conditionsGet = (sender, resolve, data) => {
			const character = getChatroomCharacter(sender);
			if (character && typeof data === "string" && conditionHandlers.has(data)) {
				resolve(true, ConditionsGetCategoryPublicData(data, character));
			} else {
				resolve(false);
			}
		};

		queryHandlers.conditionSetActive = (sender, resolve, data) => {
			const character = getChatroomCharacter(sender);
			if (character &&
				isObject(data) &&
				typeof data.category === "string" &&
				conditionHandlers.has(data.category) &&
				typeof data.condition === "string" &&
				typeof data.active === "boolean"
			) {
				resolve(true, ConditionsSetActive(data.category, data.condition, data.active, character));
			} else {
				resolve(false);
			}
		};

		queryHandlers.conditionSetLimit = (sender, resolve, data) => {
			const character = getChatroomCharacter(sender);
			if (character &&
				isObject(data) &&
				typeof data.category === "string" &&
				conditionHandlers.has(data.category) &&
				typeof data.condition === "string" &&
				typeof data.limit === "number" &&
				ConditionsLimit[data.limit] !== undefined
			) {
				resolve(true, ConditionsSetLimit(data.category, data.condition, data.limit, character));
			} else {
				resolve(false);
			}
		};
	}

	run() {
		this.timer = setInterval(() => this.conditionsTick(), CONDITIONS_CHECK_INTERVAL);
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

		for (const [category, handler] of conditionHandlers.entries()) {
			const categoryData = modStorage.conditions[category];

			if (!moduleIsEnabled(handler.category) || !categoryData)
				continue;

			for (const [conditionName, conditionData] of Object.entries(categoryData)) {
				if (!conditionData.active)
					continue;

				const copy = cloneDeep(conditionData);

				handler.tickHandler(conditionName, conditionData);

				if (!isEqual(copy, conditionData)) {
					dataChanged = true;
				}
			}
		}

		if (dataChanged) {
			modStorageSync();
		}
	}
}
