# BCX Changelog

## 0.5.1

This update includes:
 - Improvements to the curse commands to make them a bit more intuitive, also adding:
   - A new command to limit or block curse item and clothing groups
   - The list command now also shows the remaining time of a curse and whether a cursed item's configuration is also cursed
 - Authority Module GUI: The permissions and roles views have been swapped so that the main menu first leads to the role one
 - Authority Module Permissions GUI: Permissions from different modules now start on a new page, making it look more clean
 - Added chat messages just for the BCX user when getting praised or scolded with or without an attached note
 - When looking on someone else's BCX main menu, their BCX version is displayed, too

## 0.5.0

**Breaking change:**
Code behind curses changed significantly. Current curses will be migrated to new version, but current curse-related permissions won't!  
If you edited permissions that are setting who can curse things, you may need to do so again.

This update includes:
 - Complete rewrite of code behind curses, adding new features:
   - Trigger conditions, determining if a curse should be in effect or not
   - Ability to mark curse slots as normal/limited/blocked
   - Timer to automatically deactivate or remove a curse
   - Ability to manually disable a curse without removing it
   - Global trigger conditions configuration that applies to all curses
   - Global timer configuration that applies to new curses
   - Accompanying new permissions, log and chat messages as well as chat commands
 - Chat commands are now saved in chat entry history

Fixes:
 - Curses now properly ignore things like locks, even if properties aren't cursed

## 0.4.1

This update includes:
 - Two new toggleable cheats for giving the user pandora or mistress padlocks and keys
 - Added chat commands for batch cursing and lifting of curses
 - Added BCX version information and external link to the changelog in the BCX main menu

Fixes:
 - Reduced transparency of the BCX icon over the in-game characters for better visibility on various room backgrounds
 - Fixed how the command trigger was displayed in the chat commands help for the user

## 0.4.0

This update includes:
 - A whole new chat command system to interact with BCX users, even if you don't have BCX!
   The new commands can be seen by whispering `!help` to any BCX user.
   You can use most of the commands on yourself too. To see those, use `.help` in chat.
 - Added tutorial message for chat commands. This will not display for current users, so to give you the contents:
> BCX also provides helpful chat commands.
> All commands start with a dot ( . )
> The commands also support auto-completion: While writing a command, press 'Tab' to try automatically completing the currently typed word.
> Other club members can also use commands of your BCX, without needing BCX themselves. They will get a list of all commands they have permission using by whispering '!help' ( ! instead of . ) to you.
> Note: Messages colored like this text can only be seen by you and no one else.
> 
> To dismiss this message, write '.he' and press 'Tab' to complete it to '.help', which will show you list of available commands.
 - Non-extended items now hide option to curse their properties, as it has no effect anyway
 - Added new buttons to curse all currently worn clothes or restraints as well as buttons to curse all item or clothing slots
 - Added new button to remove all active curses at once
 - Added new permission to set who is allowed to see BCX owners/mistresses (e.g. public)
Fixes:
 - Update to BC version R71, including bugfix causing autocomplete to trigger twice
 - Fixed curses not allowing you to color your own items, even if you had permission to do so

## 0.3.1

This update includes:
- Log messages for when an Owner/Mistress is added or removed
- Expansion of random kidnappings cheat to prevent all mainhall events

## 0.3.0

This update includes:
- Presets: The first time you load BCX you will be asked to select preset for your experience~ If you have used BCX before and want to use this feature, please use "Reset all BCX data" option in "Global" menu
- Curses: Ability to curse items and clothing, including their colour and configuration. You can curse slots to stay empty too.
- Convenience cheats in Misc menu: Prevent loosing Mistress status, prevent random kidnappings

**_No changelog is available for earlier versions_**
