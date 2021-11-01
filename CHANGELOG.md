# BCX Changelog

## 0.6.1 "Rules update release"

This update includes:
 - **Everything from 0.6.0 update!**
 - Some improved, fixed or added rules, now totaling to 47 usable rules!
   - Added a new rule "Hearing whitelist" that allows to set a list of members whose voice can always be understood by the player, even while hearing impaired
   - Added a new rule "Seeing whitelist" that allows to set a list of members who can always be seen normally by the player, even while sight impaired
   - Added a new rule "Restrict recieving whispers" that prevents the player from receiving any whispers, except from the defined roles; an auto-reply can be set
   - Changed the rules "Allow specific sound only", "Doll talk" and "Forbid saying certain words in chat" to also apply to whisper messages
   - Changed the rule "Restrict entering rooms" to not be in effect while the white list is empty, as a safety measure
   - Changed the rule "Allow specific sounds only" to allow a list of sound patterns instead of a single one
 - Clothing curses no longer trigger while inside the wardrobe, allowing the player to go through outfits and even fix transgressions before leaving the wardrobe

Fixes:
 - Increased size of the wardrobe help popup to accommodate larger font sizes a bit better
 - Added missing information on what changed in the local chat messages notifying the BCX user of any rule setting changes
 - Fixed various issues with cursed items and added a warning message for items that may not work correctly when having its configuration cursed, too

## 0.6.0 "Rules update"

This update includes:
 - Rules, rules and even more rules!
   - New rules module - currently with 44 rules to use. Gotta try 'em all !~
   - Each rule has name and detailed description plus some also quite extensive configuration options
   - The rules range from rules blocking actions, interacting with speech or even altering how Bondage Club works to some degree
   - A limit system to limit and/or block rules that feel too intense or just not to your liking
   - Some rules are limited or blocked by default
   - 4 new permissions in the authority module allow you to configure who can use normal and/or limited rules, configure rules triggers and change which rules are limited/blocked.
   - Most rules can be set to add a log in the behaviour log when broken (to enable this feature see "Log every misbehaviour detected by rules" option in behaviour log configuration)
 - New contextual help buttons
   - On most views, there is now a `(?)`-Button right below the exit/back button that summarizes what the view is about
 - Member number input fields are enhanced with a button that leads to a subscreen with a filterable list of names from BC(X) relationships, friendlist and current chat room for selection, instead of having to enter the member number manually
 - Improved the green/yellow/red colors used by the limit/block curse slots and rules view towards better text readability - Note for users with color blindness: the light-dark order of the three colors was reversed; the softest color now means "blocked"
 - Improved usability of the wardrobe export/import feature by allowing to import items, while wearing locked items, if none of the locked items will be changed by import (useful if you are wearing some permanently locked item, like piercings)

Fixes:
 - Fixed a bug which deleted the saved color information of a cursed item, which made it reappear in an unexpected color when triggering the curse would reapply it
 - Compatability fixes with "Bondage Club Tools" extension
 - Player presence checkbox now properly detects when it can be used

## 0.5.2

Fixes:
 - Crash when curses module has been disabled
 - Errorneous logging behaviour connected to the fix above

## 0.5.1

This update includes:
 - Improvements to the curse commands to make them a bit more intuitive, also adding:
   - A new command to limit or block curse item and clothing groups
   - The list command now also shows the remaining time of a curse and whether a cursed item's configuration is also cursed
 - Authority Module GUI: The permissions and roles views have been swapped so that the main menu first leads to the role one
 - Authority Module Permissions GUI: Permissions from different modules now start on a new page, making it look more clean
 - Added chat messages just for the BCX user when getting praised or scolded with or without an attached note
 - When looking on someone else's BCX main menu, their BCX version is displayed, too
 - Added Discord invite to the main menu

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
