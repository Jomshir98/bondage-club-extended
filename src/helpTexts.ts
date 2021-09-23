
export enum Views {
	AuthorityRoles = 10,
	AuthorityPermissions = 11,
	Log = 20,
	LogConfig = 21,
	ConditionsViewCurses = 30,
	ConditionsEditCurses = 31,
	ConditionsGlobalCurses = 32,
	CursesAdd = 33,
	CursesAddPermissionMode = 34,
	ConditionsViewRules = 40,
	ConditionsEditRules = 41,
	ConditionsGlobalRules = 42,
	RulesAdd = 43,
	RulesAddPermissionMode = 44,
	Misc = 100
}

// TODO
export const HELP_TEXTS: Record<Views, string> = {
	[Views.AuthorityRoles]: "On this screen, you can (depending on your permissions) view, add, or remove the BCX-only roles 'Owner' " +
	"and 'Mistress', which expand the classic roles of BC such as Bondage Club's Owner and the up to five Lovers. The hiararchy of all " +
	"roles that can be used to set various things in BCX can be seen on the right. The higher up a role is, the more authority it has. " +
	"If something applies or is permitted for a Mistress, it also always does for an Owner, for instance.",
	[Views.AuthorityPermissions]: "The heart of BCX: Allows to configure the permissions to set up and use most of " +
	"BCX. Initial access settings depend on the preset selected for this BCX. " +
	"Self access is the checkbox next to every permission and the lowest access role is to its right. " +
	"Example: If 'allow forbidding self access', 'allow granting self access', 'allow lowest access modification' have the checkbox removed " +
	"and lowest role is 'Owner', then current and newly added BCX owners and the BC owner can get full control over " +
	"any permissions they have access to. So careful with those three permissions!",
	[Views.Log]: "This screen shows logs of important events. What is logged depends on the logging configuration, which can be viewed/edited " +
	"via the button to the right. Access is determined by the according permission settings. The log can document the BCX's user's conduct, " +
	"any rule violations, important changes made to BCX settings, curses or rules, and notes from other people.",
	[Views.LogConfig]: "n/a",
	[Views.ConditionsViewCurses]: "n/a c",
	[Views.ConditionsEditCurses]: "n/a c",
	[Views.ConditionsGlobalCurses]: "n/a c",
	[Views.CursesAdd]: "n/a c",
	[Views.CursesAddPermissionMode]: "n/a c",
	[Views.ConditionsViewRules]: "n/a r",
	[Views.ConditionsEditRules]: "n/a r",
	[Views.ConditionsGlobalRules]: "n/a r",
	[Views.RulesAdd]: "n/a r",
	[Views.RulesAddPermissionMode]: "n/a r",
	[Views.Misc]: "n/a"
};