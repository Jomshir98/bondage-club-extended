import { ModuleCategory, ModuleInitPhase } from "../constants";
import { moduleInitPhase } from "../moduleManager";
import { isObject } from "../utils";
import { notifyOfChange, queryHandlers } from "./messaging";
import { moduleIsEnabled } from "./presets";
import { modStorage, modStorageSync } from "./storage";
import { BaseModule } from "./_BaseModule";

import cloneDeep from "lodash-es/cloneDeep";
import isEqual from "lodash-es/isEqual";
import { getChatroomCharacter } from "../characters";

const CONDITIONS_CHECK_INTERVAL = 2_000;

export interface ConditionsHandler<C extends ConditionsCategories> {
	category: ModuleCategory;
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

export function ConditionsGetCategoryPublicData<C extends ConditionsCategories>(category: C): ConditionsCategoryPublicData<C> {
	const res: ConditionsCategoryPublicData<ConditionsCategories> = {
		conditions: {}
	};
	const handler = conditionHandlers.get(category);
	if (!handler) {
		throw new Error(`No handler for conditions category ${category}`);
	}
	const data = ConditionsGetCategoryData<ConditionsCategories>(category);
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
	const handler = conditionHandlers.get(category);
	if (!handler) {
		throw new Error(`Attempt to get unknown conditions category data ${category}`);
	}
	if (!moduleIsEnabled(handler.category))
		return;
	const categoryData = ConditionsGetCategoryData(category);
	categoryData.conditions[condition] = data;
	modStorageSync();
	notifyOfChange();
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

export function ConditionsSetActive<C extends ConditionsCategories>(category: C, condition: ConditionsCategoryKeys[C], active: boolean): boolean {
	const categoryData = ConditionsGetCategoryData(category);
	const conditionData = categoryData.conditions[condition];
	if (conditionData) {
		// TODO: Check permissions
		if (conditionData.active !== active) {
			conditionData.active = active;
			modStorageSync();
		}
		return true;
	}
	return false;
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
				conditions: {}
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

			for (const [condition, conditiondata] of Object.entries(data.conditions)) {
				if (!handler.loadValidateCondition(condition, conditiondata)) {
					delete data.conditions[condition];
				}
			}
		}

		for (const [key, handler] of conditionHandlers.entries()) {
			if (moduleIsEnabled(handler.category) && !isObject(modStorage.conditions[key])) {
				console.debug(`BCX: Adding missing conditions category ${key}`);
				modStorage.conditions[key] = {
					conditions: {}
				};
			}
		}

		queryHandlers.conditionsGet = (sender, resolve, data) => {
			if (typeof data === "string" && conditionHandlers.has(data)) {
				resolve(true, ConditionsGetCategoryPublicData(data));
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
				resolve(true, ConditionsSetActive(data.category, data.condition, data.active));
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
