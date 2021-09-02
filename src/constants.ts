export enum Preset {
	dominant = 0,
	switch = 1,
	submissive = 2,
	slave = 3
}

export enum ModuleCategory {
	Global = 0,
	Authority = 1,
	Log = 2,
	Curses = 3,
	Misc = 99
}

export const MODULE_NAMES: Record<ModuleCategory, string> = {
	[ModuleCategory.Global]: "Global",
	[ModuleCategory.Authority]: "Authority",
	[ModuleCategory.Log]: "Behaviour Log",
	[ModuleCategory.Curses]: "Curses",
	[ModuleCategory.Misc]: "Miscellaneous"
};

export const MODULE_ICONS: Record<ModuleCategory, string> = {
	[ModuleCategory.Global]: "Icons/General.png",
	[ModuleCategory.Authority]: "Icons/Security.png",
	[ModuleCategory.Log]: "Icons/Title.png",
	[ModuleCategory.Curses]: "Icons/Struggle.png",
	[ModuleCategory.Misc]: "Icons/Random.png"
};

export const TOGGLEABLE_MODULES: readonly ModuleCategory[] = [
	ModuleCategory.Log,
	ModuleCategory.Curses
];

export const enum ModuleInitPhase {
	construct,
	init,
	load,
	ready,
	destroy
}

export enum MiscCheat {
	BlockRandomEvents = 0,
	CantLoseMistress = 1,
	GiveMistressKey = 2,
	GivePandoraKey = 3
}

export enum ConditionsLimit {
	normal = 0,
	limited = 1,
	blocked = 2
}
