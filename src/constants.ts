import { icon_rules } from "./resources";

export enum Preset {
	dominant = 0,
	switch = 1,
	submissive = 2,
	slave = 3,
}

export enum ModuleCategory {
	Global = 0,
	Authority = 1,
	Log = 2,
	Curses = 3,
	Rules = 4,
	Commands = 5,
	Relationships = 6,
	ExportImport = 88,
	Misc = 99,
}

export const MODULE_NAMES: Record<ModuleCategory, string> = {
	[ModuleCategory.Global]: "Global",
	[ModuleCategory.Authority]: "Authority",
	[ModuleCategory.Log]: "Behaviour Log",
	[ModuleCategory.Curses]: "Curses",
	[ModuleCategory.Rules]: "Rules",
	[ModuleCategory.Commands]: "Commands",
	[ModuleCategory.Relationships]: "Relationships",
	[ModuleCategory.ExportImport]: "Export-Import",
	[ModuleCategory.Misc]: "Miscellaneous",
};

export const MODULE_ICONS: Record<ModuleCategory, string> = {
	[ModuleCategory.Global]: "Icons/General.png",
	[ModuleCategory.Authority]: "Icons/Security.png",
	[ModuleCategory.Log]: "Icons/Title.png",
	[ModuleCategory.Curses]: "Icons/Struggle.png",
	[ModuleCategory.Rules]: icon_rules,
	[ModuleCategory.Commands]: "Icons/Use.png",
	[ModuleCategory.Relationships]: "Icons/FriendList.png",
	[ModuleCategory.ExportImport]: "Icons/Save.png",
	[ModuleCategory.Misc]: "Icons/Random.png",
};

export const TOGGLEABLE_MODULES: readonly ModuleCategory[] = [
	ModuleCategory.Log,
	ModuleCategory.Curses,
	ModuleCategory.Rules,
	ModuleCategory.Commands,
	ModuleCategory.Relationships,
];

export enum ModuleInitPhase {
	construct,
	init,
	load,
	ready,
	destroy,
}

export enum MiscCheat {
	BlockRandomEvents = 0,
	CantLoseMistress = 1,
	GiveMistressKey = 2,
	GivePandoraKey = 3,
}

export enum ConditionsLimit {
	normal = 0,
	limited = 1,
	blocked = 2,
}

export const defaultBCXEffects: Readonly<BCX_effects> = {
	Effect: [],
};
