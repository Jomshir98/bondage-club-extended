import { ConditionsLimit, ModuleCategory, ModuleInitPhase } from "../constants";
import { moduleInitPhase } from "../moduleManager";
import { isObject } from "../utils";
import { notifyOfChange, queryHandlers } from "./messaging";
import { moduleIsEnabled } from "./presets";
import { modStorage, modStorageSync } from "./storage";
import { BaseModule } from "./_BaseModule";

import cloneDeep from "lodash-es/cloneDeep";
import isEqual from "lodash-es/isEqual";
import { ChatroomCharacter, getAllCharactersInRoom } from "../characters";
import { AccessLevel, checkPermissionAccess, getCharacterAccessLevel } from "./authority";

const CONDITIONS_CHECK_INTERVAL = 2_000;

export function guard_ConditionsConditionRequirements(data: unknown): data is ConditionsConditionRequirements {
	return isObject(data) &&
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
	return isObject(d) &&
		typeof d.active === "boolean" &&
		(d.timer === null || typeof d.timer === "number") &&
		typeof d.timerRemove === "boolean" &&
		(d.requirements === null || guard_ConditionsConditionRequirements(d.requirements)) &&
		handler.validatePublicData(condition, d.data);
}

export function guard_ConditionsCategoryPublicData<C extends ConditionsCategories>(category: C, data: unknown): data is ConditionsCategoryPublicData<C> {
	const d = data as ConditionsCategoryPublicData;
	const handler = conditionHandlers.get(category);
	if (!handler)
		return false;
	return isObject(d) &&
		typeof d.access_normal === "boolean" &&
		typeof d.access_limited === "boolean" &&
		typeof d.access_configure === "boolean" &&
		typeof d.access_changeLimits === "boolean" &&
		typeof d.highestRoleInRoom === "number" &&
		AccessLevel[d.highestRoleInRoom] !== undefined &&
		isObject(d.conditions) &&
		Object.entries(d.conditions).every(
			([condition, conditionData]) => guard_ConditionsConditionPublicData(category, condition, conditionData)
		) &&
		(d.timer === null || typeof d.timer === "number") &&
		typeof d.timerRemove === "boolean" &&
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
	permission_configure: BCX_Permissions;
	permission_changeLimits: BCX_Permissions;
	loadValidateConditionKey(key: string): boolean;
	loadValidateCondition(key: string, data: ConditionsConditionData<C>): boolean;
	tickHandler(condition: ConditionsCategoryKeys[C], data: ConditionsConditionData<C>): void;
	makePublicData(condition: ConditionsCategoryKeys[C], data: ConditionsConditionData<C>): ConditionsCategorySpecificPublicData[C];
	validatePublicData(condition: ConditionsCategoryKeys[C], data: ConditionsCategorySpecificPublicData[C]): boolean;
	updateCondition(
		condition: ConditionsCategoryKeys[C],
		data: ConditionsConditionData<C>,
		updateData: ConditionsCategorySpecificPublicData[C],
		character: ChatroomCharacter | null
	): boolean;
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
		highestRoleInRoom: AccessLevel.public,
		conditions: {},
		timer: data.timer ?? null,
		timerRemove: data.timerRemove ?? false,
		limits: cloneDeep(data.limits),
		requirements: cloneDeep(data.requirements)
	};
	for (const char of getAllCharactersInRoom()) {
		const role = getCharacterAccessLevel(char);
		if (role !== AccessLevel.self && role < res.highestRoleInRoom) {
			res.highestRoleInRoom = role;
		}
	}
	for (const [condition, conditionData] of Object.entries(data.conditions)) {
		res.conditions[condition] = {
			active: conditionData.active,
			data: handler.makePublicData(condition, conditionData),
			timer: conditionData.timer ?? null,
			timerRemove: conditionData.timerRemove ?? false,
			requirements: conditionData.requirements ?? null
		};
	}
	return res as ConditionsCategoryPublicData<C>;
}

export function ConditionsGetCondition<C extends ConditionsCategories>(category: C, condition: ConditionsCategoryKeys[C]): ConditionsConditionData<C> | undefined {
	return ConditionsGetCategoryData(category).conditions[condition];
}

export function ConditionsSetCondition<C extends ConditionsCategories>(category: C, condition: ConditionsCategoryKeys[C], data: ConditionsCategorySpecificData[C]) {
	const handler = ConditionsGetCategoryHandler(category);
	if (!moduleIsEnabled(handler.category))
		return;
	const categoryData = ConditionsGetCategoryData(category);
	const existing = categoryData.conditions[condition];
	if (existing) {
		existing.data = data;
	} else {
		categoryData.conditions[condition] = {
			active: true,
			timer: categoryData.timer !== undefined ? Date.now() + categoryData.timer : undefined,
			timerRemove: categoryData.timerRemove,
			data
		};
	}
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

export function ConditionsUpdate<C extends ConditionsCategories>(category: C, condition: ConditionsCategoryKeys[C], data: ConditionsConditionPublicData<C>, character: ChatroomCharacter | null): boolean {
	const handler = conditionHandlers.get(category);
	if (!handler) {
		throw new Error(`Attempt to set limit for unknown conditions category ${category}`);
	}
	if (character && !ConditionsCheckAccess(category, condition, character))
		return false;
	const conditionData = ConditionsGetCondition<ConditionsCategories>(category, condition);
	if (!conditionData)
		return false;
	if (!handler.updateCondition(condition, conditionData, data.data, character))
		return false;
	conditionData.active = data.active;
	if (data.requirements) {
		conditionData.requirements = data.requirements;
	} else {
		delete conditionData.requirements;
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
	if (character) {
		// TODO: Log
	}
	notifyOfChange();
	modStorageSync();
	return true;
}

export function ConditionsCategoryUpdate<C extends ConditionsCategories>(category: C, data: ConditionsCategoryConfigurableData, character: ChatroomCharacter | null): boolean {
	const handler = conditionHandlers.get(category);
	if (!handler) {
		throw new Error(`Attempt to set limit for unknown conditions category ${category}`);
	}
	if (character && !checkPermissionAccess(handler.permission_configure, character))
		return false;
	const conditionData = ConditionsGetCategoryData<ConditionsCategories>(category);
	if (!conditionData)
		return false;
	conditionData.requirements = data.requirements;
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
	if (character) {
		// TODO: Log
	}
	notifyOfChange();
	modStorageSync();
	return true;
}

export function ConditionsEvaluateRequirements(requirements: ConditionsConditionRequirements): boolean {
	const inChatroom = ServerPlayerIsInChatRoom();
	const chatroomPrivate = inChatroom && ChatRoomData && ChatRoomData.Private;
	if (requirements.room) {
		const res = inChatroom &&
			(requirements.room.type === "public" ? !chatroomPrivate : chatroomPrivate);
		if (!(requirements.room.inverted ? !res : res))
			return false;
	}
	if (requirements.roomName) {
		const res = inChatroom &&
			ChatRoomData &&
			typeof ChatRoomData.Name === "string" &&
			ChatRoomData.Name.toLocaleLowerCase() === requirements.roomName.name.toLocaleLowerCase();
		if (!(requirements.roomName.inverted ? !res : res))
			return false;
	}
	if (requirements.role) {
		const res = inChatroom &&
			getAllCharactersInRoom().some(c => !c.isPlayer() && getCharacterAccessLevel(c) <= requirements.role!.role);
		if (!(requirements.role.inverted ? !res : res))
			return false;
	}
	if (requirements.player) {
		const res = inChatroom &&
			getAllCharactersInRoom().some(c => c.MemberNumber === requirements.player!.memberNumber);
		if (!(requirements.player.inverted ? !res : res))
			return false;
	}

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
				limits: {},
				requirements: {}
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

			if (!guard_ConditionsConditionRequirements(data.requirements)) {
				console.warn(`BCX: Resetting category ${key} requirements with invalid data`);
				data.requirements = {};
			}

			for (const [condition, conditiondata] of Object.entries<ConditionsConditionData>(data.conditions)) {
				if (!handler.loadValidateConditionKey(condition)) {
					console.warn(`BCX: Unknown condition ${key}:${condition}, removing it`);
					delete data.conditions[condition];
				} else if (!handler.loadValidateCondition(condition, conditiondata)) {
					delete data.conditions[condition];
				} else if (
					typeof conditiondata.active !== "boolean" ||
					conditiondata.requirements !== undefined && !guard_ConditionsConditionRequirements(conditiondata.requirements) ||
					conditiondata.timer !== undefined && typeof conditiondata.timer !== "number" ||
					// eslint-disable-next-line @typescript-eslint/no-unnecessary-boolean-literal-compare
					conditiondata.timerRemove !== undefined && conditiondata.timerRemove !== true
				) {
					console.warn(`BCX: Condition ${key}:${condition} has bad data, removing it`);
					delete data.conditions[condition];
				}
			}
		}

		for (const [key, handler] of conditionHandlers.entries()) {
			if (moduleIsEnabled(handler.category) && !isObject(modStorage.conditions[key])) {
				console.debug(`BCX: Adding missing conditions category ${key}`);
				modStorage.conditions[key] = {
					conditions: {},
					limits: {},
					requirements: {}
				};
			}
		}

		queryHandlers.conditionsGet = (sender, resolve, data) => {
			if (typeof data === "string" && conditionHandlers.has(data)) {
				resolve(true, ConditionsGetCategoryPublicData(data, sender));
			} else {
				resolve(false);
			}
		};

		queryHandlers.conditionSetActive = (sender, resolve, data) => {
			if (isObject(data) &&
				typeof data.category === "string" &&
				conditionHandlers.has(data.category) &&
				typeof data.condition === "string" &&
				typeof data.active === "boolean"
			) {
				resolve(true, ConditionsSetActive(data.category, data.condition, data.active, sender));
			} else {
				resolve(false);
			}
		};

		queryHandlers.conditionSetLimit = (sender, resolve, data) => {
			if (isObject(data) &&
				typeof data.category === "string" &&
				conditionHandlers.has(data.category) &&
				typeof data.condition === "string" &&
				typeof data.limit === "number" &&
				ConditionsLimit[data.limit] !== undefined
			) {
				resolve(true, ConditionsSetLimit(data.category, data.condition, data.limit, sender));
			} else {
				resolve(false);
			}
		};

		queryHandlers.conditionUpdate = (sender, resolve, data) => {
			if (isObject(data) &&
				typeof data.category === "string" &&
				conditionHandlers.has(data.category) &&
				typeof data.condition === "string" &&
				guard_ConditionsConditionPublicData(data.category, data.condition, data.data)
			) {
				resolve(true, ConditionsUpdate(data.category, data.condition, data.data, sender));
			} else {
				resolve(false);
			}
		};

		queryHandlers.conditionCategoryUpdate = (sender, resolve, data) => {
			if (isObject(data) &&
				typeof data.category === "string" &&
				conditionHandlers.has(data.category) &&
				isObject(data.data) &&
				(data.data.timer === null || typeof data.data.timer === "number") &&
				typeof data.data.timerRemove === "boolean" &&
				guard_ConditionsConditionRequirements(data.data.requirements)
			) {
				resolve(true, ConditionsCategoryUpdate(data.category, data.data, sender));
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
		const now = Date.now();

		for (const [category, handler] of conditionHandlers.entries()) {
			const categoryData = modStorage.conditions[category];

			if (!moduleIsEnabled(handler.category) || !categoryData)
				continue;

			for (const [conditionName, conditionData] of Object.entries<ConditionsConditionData>(categoryData.conditions)) {
				if (conditionData.timer !== undefined && conditionData.timer <= now) {
					if (conditionData.timerRemove) {
						ConditionsRemoveCondition(category, conditionName);
					} else {
						delete conditionData.timer;
						conditionData.active = false;
						dataChanged = true;
					}
				}

				if (!conditionData.active)
					continue;

				const requirements = conditionData.requirements ?? categoryData.requirements;
				if (!ConditionsEvaluateRequirements(requirements))
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
			notifyOfChange();
		}
	}
}
