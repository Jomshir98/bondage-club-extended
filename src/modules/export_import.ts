import { ZodType } from "zod";
import { ChatroomCharacter } from "../characters";
import { ModuleCategory, ModuleInitPhase, Preset } from "../constants";
import { moduleInitPhase } from "../moduleManager";
import { isObject } from "../utils";
import { AccessLevel, checkPermissionAccess, getPlayerPermissionSettings, registerPermission } from "./authority";
import { queryHandlers } from "./messaging";
import { BaseModule } from "./_BaseModule";

const EXPORT_IMPORT_FORMAT_VERSION = 1;

export interface ExportImportCategoryDefinition<T> {
	category: string;
	name: string;
	module: ModuleCategory;
	importPermissions: BCX_Permissions[];
	export(character: ChatroomCharacter | null): T;
	importValidator: ZodType<T>;
	import(value: T, character: ChatroomCharacter | null): string;
}

const exportImportCategories: ExportImportCategoryDefinition<any>[] = [];
export const ExportImportCategories: readonly Readonly<ExportImportCategoryDefinition<any>>[] = exportImportCategories;

export function ExportImportRegisterCategory<T>(definition: ExportImportCategoryDefinition<T>): void {
	if (moduleInitPhase !== ModuleInitPhase.init) {
		throw new Error("Export/Import categories can be registered only during init");
	}
	if (exportImportCategories.some(c => c.category === definition.category)) {
		throw new Error(`Export/Import category "${definition.category}" already defined!`);
	}
	exportImportCategories.push(definition);
}

export function ExportImportDoExport(category: string, compress: boolean, character: ChatroomCharacter | null): string {
	const definition = exportImportCategories.find(c => c.category === category);
	if (!definition) {
		throw new Error(`Unknown export category "${category}"`);
	}

	if (character && !checkPermissionAccess("exportimport_export", character)) {
		throw new Error("Missing the following permission required to export:\nAllow exporting BCX module configurations");
	}

	let result = JSON.stringify({
		__bcxExport: EXPORT_IMPORT_FORMAT_VERSION,
		[category]: definition.export(character)
	});
	if (compress) {
		result = LZString.compressToBase64(result);
	}
	return result;
}

export function ExportImportDoImport(category: string, data: string, character: ChatroomCharacter | null): string {
	const definition = exportImportCategories.find(c => c.category === category);
	if (!definition) {
		throw new Error(`Unknown import category "${category}"`);
	}

	data = data.trim();

	let parsedData: unknown;

	try {
		if (data && !data.startsWith("{")) {
			data = LZString.decompressFromBase64(data) || "";
			if (!data || typeof data !== "string" || !data.startsWith("{")) {
				return "Invalid input: decompression failed";
			}
			data = data.trim();
		}

		parsedData = JSON.parse(data);
	} catch (err) {
		return `Invalid input: parse error: ${err}`;
	}

	if (!isObject(parsedData) || typeof parsedData.__bcxExport !== "number") {
		return "Invalid input: Input is not data exported from BCX";
	}

	if (parsedData.__bcxExport !== EXPORT_IMPORT_FORMAT_VERSION) {
		return `Unable to load version ${parsedData.__bcxExport} of export, maximum compatible version: ${EXPORT_IMPORT_FORMAT_VERSION}`;
	}

	if (parsedData[category] === undefined) {
		return `Input doesn't include data for category "${definition.name}"\n` +
			`Input has data for following known categories:\n` +
			(Object.keys(parsedData).map((key) => {
				const knownCategory = exportImportCategories.find(c => c.category === key);
				return knownCategory ? ` - ${knownCategory.name}\n` : "";
			}).join("") || "[NONE]\n");
	}

	const zodResult = definition.importValidator.safeParse(parsedData[category]);
	if (!zodResult.success) {
		return `Invalid input:\n${JSON.stringify(zodResult.error.format(), undefined, "\t")}`;
	}

	if (character) {
		const missingPermissions = definition.importPermissions.filter(p => !checkPermissionAccess(p, character));
		if (missingPermissions.length > 0) {
			return "Missing the following permissions required to import:\n" +
				missingPermissions
					.map(p => getPlayerPermissionSettings()[p]?.name ?? p)
					.join("\n");
		}
	}

	return definition.import(zodResult.data, character);
}

export class ModuleExportImport extends BaseModule {
	init(): void {
		registerPermission("exportimport_export", {
			name: "Allow exporting BCX module configurations",
			category: ModuleCategory.ExportImport,
			defaults: {
				[Preset.dominant]: [true, AccessLevel.self],
				[Preset.switch]: [true, AccessLevel.owner],
				[Preset.submissive]: [true, AccessLevel.mistress],
				[Preset.slave]: [true, AccessLevel.mistress]
			}
		});
	}

	load() {
		exportImportCategories.sort((a, b) => a.module - b.module);

		queryHandlers.export_import_do_export = (sender, data) => {
			if (isObject(data) &&
				typeof data.category === "string" &&
				exportImportCategories.some(c => c.category === data.category) &&
				typeof data.compress === "boolean"
			) {
				return ExportImportDoExport(data.category, data.compress, sender);
			} else {
				return undefined;
			}
		};

		queryHandlers.export_import_do_import = (sender, data) => {
			if (isObject(data) &&
				typeof data.category === "string" &&
				exportImportCategories.some(c => c.category === data.category) &&
				typeof data.data === "string"
			) {
				return ExportImportDoImport(data.category, data.data, sender);
			} else {
				return undefined;
			}
		};
	}
}
