
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
	[Views.AuthorityRoles]: "If you are permitted, this screen enables you to view, add, or remove the BCX-only roles 'Owner' " +
	"and 'Mistress', which expand the classic roles of BC such as Bondage Club's Owner and the Lovers. The hierarchy of all " +
	"roles that can be used to set various things in BCX can be seen on the right. The higher up a role is, the more authority it has. " +
	"For instance, if something applies or is permitted for a Mistress, it also always is for an Owner. Any number of " +
	"Owners and Mistresses can be set. Check their current power over BCX with the button on the right.",
	[Views.AuthorityPermissions]: "The heart of BCX: Allows to configure the permissions to set up and use most of " +
	"BCX. Initial access settings depend on the preset selected for this BCX. " +
	"Self access is the checkbox next to every permission and the lowest access role is to its right. " +
	"Example: If 'allow forbidding self access', 'allow granting self access', 'allow lowest access modification' have the checkbox removed " +
	"and lowest role is 'Owner', then current and newly added BCX owners and the BC owner can get full control over " +
	"any permissions they have access to. So careful with those three permissions!",
	[Views.Log]: "This screen shows logs of important events. What is logged depends on the logging configuration, which can be viewed/edited " +
	"via the button to the right. Log entries can have normal or protected visibility. Access to those as well as removing entries or the " +
	"configuration is determined by the according authority module permission settings. The log can document the BCX's user's conduct, " +
	"any rule violations, important changes made to BCX settings, curses or rules, and notes from other people.",
	[Views.LogConfig]: "This screen determines what is logged in the behaviour log and what the visibility of each type of log messages is. " +
	"'Yes' means this log type " +
	"has normal visibility, while 'protected' means only roles who have permission to view protected entries can view them. 'No' means that " +
	"this log type is not logged at all. In the permission settings view of the authority module, the permissions of this log module can be configured.",
	[Views.ConditionsViewCurses]: "This screen shows all active curses on the player, including many information, such as duration, if it is " +
	"a cursed item or a blocked item or clothing slot that forces to stay unrestrained or naked there. Clicking on the button with the cog icon " +
	"in the middle of each row moves you to a new screen that allows to configure the curse (if you have permission). When the cog icon has a blue " +
	"aura, then that means that the curse's conditions are the same as the global config. If permitted, you can remove single curses with the 'X' button.",
	[Views.ConditionsEditCurses]: "Here you can configure if the curse is in effect, if it wears off after a while or not, what happens then and " +
	"most importantly when the curse is active, such as either always or based on where the player is and with whom. The green/red bars next to the " +
	"checkboxes indicate whether a triggering condition is true at present or not. On the right side, you can curse the usage/" +
	"alteration of an item such as fixing cuffs overhead or behind the back. Lastly, in the bottom right you can set the four trigger conditions " +
	"of this curse to the global curses config.",
	[Views.ConditionsGlobalCurses]: "The settings on this page are the global/default settings for all newly added curses. Changes to the four trigger " +
	"conditions are also applied to existing curses that are (still) set to global curses configuration, though. Exception is if a timer is set here. " +
	"Such a timer only applies to newly created curses.",
	[Views.CursesAdd]: "On this screen you can add a curse to any empty slot (white) which will keep it empty or on any worn item (gold) " +
	"that then will be hard to remove. You add the curse by simply clicking the slot which then becomes purple to indicate that " +
	"it is now cursed. You can switch the curse's configuration from the default globale configuration on the previous screen. Grey slots indicate " +
	"that you have no access to them, due to it being blocked or due to your permission settings. Slots can be limited/blocked via the settings button " +
	"on the very right.",
	[Views.CursesAddPermissionMode]: "Here you can cycle item and clothing slots between being not limited, limited and blocked. Blocked means " +
	"no one can add a curse to it, while limited means only roles that have the permission to curse limited slots can curse them. There " +
	"is no need to save changes as they are instantly in effect.",
	[Views.ConditionsViewRules]: "This screen shows all active rules for the player, including many information, such as duration, the " +
	"rule type and little status icons that show if the rule is enforced and/or transgressions are logged. Clicking on the button with the cog icon " +
	"in the middle of each row moves you to a new screen that allows to configure the rule (if you have permission). When the cog icon has a blue " +
	"aura, then that means that the rule's conditions are the same as the global config. If permitted, you can remove single rules with the 'X' button.",
	[Views.ConditionsEditRules]: "Here you can configure if the rule is in effect, if it is only valid for some time, what happens then and " +
	"most importantly when the rule applies, such as either always or based on where the player is and with whom. The green/red bars next to the " +
	"checkboxes indicate whether a triggering condition is true at present or not. Lastly, in the bottom right you can set the four trigger conditions " +
	"of this rule to the global rules config.",
	[Views.ConditionsGlobalRules]: "The settings on this page are the global/default settings for all newly added rules. Changes to the four trigger " +
	"conditions are also applied to existing rules that are (still) set to global rules configuration, though. Exception is if a timer is set here. " +
	"Such a timer only applies to newly established rules.",
	[Views.RulesAdd]: "On this screen you can establish new rules for the player by simply clicking any rule template. " +
	"After clicking on it, you can edit the rule's configuration. Purple rule templates indicate, that they are already in use; greyed out " +
	"ones, that you have no access to them due to being blocked or due to your permission settings. Rule templates can be limited/blocked " +
	"via the settings button on the very right.",
	[Views.RulesAddPermissionMode]: "Here you can cycle rule templates between being not limited, limited and blocked. Blocked means " +
	"no one can add/use this rule, while limited means only roles that have the permission to establish limited rules can add them. There " +
	"is no need to save changes as they are instantly in effect.",
	[Views.Misc]: "This screen offers various settings to configure your Bondage Club experience in general, such as enabling/disabling the " +
	"typing indicator that shows other BCX users an icon when you are currently typing something to public chat or whispering something to " +
	"only them. The cheats are only temporarily active as long as they are set; items that were only given via a cheat are then also gone again."
};