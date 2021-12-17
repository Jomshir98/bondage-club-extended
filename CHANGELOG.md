# BCX Changelog

## 0.7.3

This update improves compatibility with BC release R75.

Fixes:
 - Fix rule "Prevent blacklisting" affected by new release

## 0.7.2

This update includes:
 - New tutorial screen! New BCX users will see it automatically, but it can also be opened at any time through the main menu.
 - Added notification about a new BCX version being available
 - Improved the description of the "Ready to be summoned" rule
 - Further improvements to the crash handler

Fixes:
 - Fixed curses triggering right after being removed by a timer
 - Fixed curses not working for first-time users

## 0.7.1 "Quality of life" Release

This update includes:
 - Added a new "Star" button to set applied rules/curses as favorites, which lists them first in the active overview
 - Added a new option to curses, which removes a cursed item/clothing from the player if the curse becomes inactive, removed or no longer triggered
 - Added new chat room status indicators when the player is in menus such as wardrobe, profile, BCX (can be disabled in the BCX Miscellaneous module)
 - Added removing of rules and showing the description of any rule to the `.rules` chat commands
 - Added an error message in the GUI when adding a rule fails
 - Changed the behaviour log list to cut off long log entries; Pressing on the entry opens a bigger view now
 - Changed the room template save buttons to require two clicks to prevent accidental overwriting of that slot
 - Changed curse trigger messages to get bundled together into a single message, if more than two curses trigger in a short time
 - Saved around 12 KB on script size by switching some images to SVG drawings
 - Improved the crash handler and the data it shows
 - And additionally **everything from the 0.7.0 update released to every BCX user!**

Rule changes:
 - Some improved, fixed or added rules, now totaling to 78 usable rules!
 - Added a new rule "Restrict allowed body poses" that can block certain poses which makes the player unable to get into those by herself
 - Added a new rule "Greet new guests" that forces the player to greet people newly joining the room with a set sentence
 - Improved the rule "Ready to be summoned" trigger message detection (made it case insensitive and only detect at the beginning of the beep)
 - Fixed the rule "Restrict receiving beeps" to no longer send the room name with the auto-reply

Fixes:
 - Changed the curses/rules list chat command to split overly long return values into several chat messages
 - Changed the filter on the log, log config, adding rules and permission views to not lose its input when the screen refreshes
 - Fixed the item filtering via just typing to trigger on screens where it should not
 - Fixed a bug which prevented block categories of rooms from being correctly stored in the room template under specific conditions
 - Several smaller fixes and improvements

## 0.7.0 "Quality of life"

This update includes:
 - Added a filter button to the item and clothing selection views to search for specific things (item selection also allows you to just start typing)
 - Added a second page in the room create and administration screens which currently offers four slots to store and load chat room templates
 - Added all existing BC backgrounds (e.g. from Pandora or Magic School) to the room background selection screen (changed room background can be seen without BCX)
 - Added a feature to 'chat command autocomplete' that cycles through the shown options with repeated presses of the "Tab" key when there are several possible matches
 - Added a command `.background` that switches the current chat room background to the specified one ("Tab"-key helps a lot here)
 - Added a command `.antiblind` that toggles blind effect prevention to always see despite items plus an according rule to block this command
 - Added a toggle to the curses/rules trigger conditions to switch between previous 'AND' and new 'OR' logic when checking triggers
 - Added a second type of timer that activates the according curse/rule when time runs out. It works by enabling the timer while a curse/rule is currently not active
 - Changed the wardrobe import/export feature to first ignore locks when importing a hash with items -> "Imported! Repeat to also import locks"
 - Added a toggle next to the refresh button in the Friendlist that will automatically refresh the list every 10 seconds if set
 - Updated some of the contextual help texts and preset selection descriptions
 - The page with installation instructions has been updated, now including list of tested browsers
 - Added crash handler that can display fatal errors, once per session, to help find and fix bugs more quickly and easily (both BC and BCX ones)

Rule changes:
 - Changed the rule "Listen to my voice" to allow setting multiple sentences that will be used at random as well as highlighting those in the chat more
 - Changed the rule "Doll talk" to not count some special characters for the word length limit
 - Changed the rule "Seeing whitelist" to also allow interacting with locks on whitelisted characters
 - Changed the rule "Garble whispers while gagged" to allow non-OOC whispers despite the BC immersion setting to prevent whispers and OOC while gagged
 - Added 29 new rules!
   - Lots of rules to control various settings that already are part of BC
   - Added rule "Prevent leaving the room" to prevent leaving room when defined roles are inside it, too
   - Added rule "Secret orgasm progress" to hide the player's own arousal meter, while the meter continues to function normally
   - Added rule "Prevent blacklisting" to prevent the player from actively blacklisting defined roles (existing blacklists are not affected)
   - Added rule "Ready to be summoned" that allows specified characters to leash the player into their room using a beep message
   - Added rule "Restrict being leashed by others" that prevents the player from being leashed by others up to the set role
   - Added rule "Order to greet club" that sends a beep to the specified online characters when the player comes online 
   - Added rule "Forbid changing difficulty" that prevents changing BC's multiplayer difficulty preference
   - Added rule "Order to greet room" to command the player to say a phrase upon entering a new room
   - Added rule "Hide online friends if blind" that hides names and member numbers on the friendlist when the player is fully blind

Fixes:
 - Changed it so you can see yourself being a BCX mistress or owner of someone even if you do not have permission to see the whole list
 - Changed it so authority roles add/remove buttons are available to you (with the according permissions) independent of having permission to see the list itself
 - Changed it so that the BCX button in another user's profile is grayed out without bondage club "item permission" for this user
 - Changed the member select buttons to not list members in the same room while blinded and having certain BC immersion settings
 - Fixed the member select screen to no longer display characters from the last room after leaving it
 - Fixed being able to interact with custom rule configuration elements (e.g. toggles, text fields) without being permitted as player
 - Fixed a bug in the rule "Room admin transfer" which unexpectedly changed the room background during transfer

## 0.6.2

This update includes:
 - Changed the rule "Control ability to orgasm" to use more general orgasm messages, not mentioning vibrators specifically.
 - Changed the rule "Forbid using keys on others" to have two new toggles for still allowing to unlock owner and lover items or locks.
 - Changed the rules "Restrict sending beep messages" and "Restrict receiving beeps" to have the option to only be in effect while hands cannot be used.
 - Improved the BCX commands tutorial text to make the behavior more clear.
 - Added a chatroom message that notifies other users when they have been added as someone's BCX owner/mistress.

Fixes:
 - Fix: Added missing local chat messages and log entries when changing a rule's active state, enforcement state or logging state.
 - Fixed an incompatibility between different BCX versions when rules were changed between the versions.

## 0.6.1 "Rules update" Release

This update includes:
 - **Everything from 0.6.0 update!**
 - Some improved, fixed or added rules, now totaling to 47 usable rules!
   - Added a new rule "Hearing whitelist" that allows to set a list of members whose voice can always be understood by the player, even while hearing impaired
   - Added a new rule "Seeing whitelist" that allows to set a list of members who can always be seen normally by the player, even while sight impaired
   - Added a new rule "Restrict receiving whispers" that prevents the player from receiving any whispers, except from the defined roles; an auto-reply can be set
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
 - Compatibility fixes with "Bondage Club Tools" extension
 - Player presence checkbox now properly detects when it can be used

## 0.5.2

Fixes:
 - Crash when curses module has been disabled
 - Erroneous logging behaviour connected to the fix above

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
