# BCX Changelog

## 0.9.0 "Utility abound"

This update includes:
 - Added a new extended mode to BCX's wardrobe import/export that allows selecting in greater detail what to import
   - This feature is available by default while importing a BCX string (hold "Shift" for the old behavior - "quick mode")
   - This feature can also be used while selecting a stored BC outfit by clicking the small config button to the left of it
   - Changed the export to also newly include the body slots. Note: Your old outfit strings may not yet support importing body slots.
   - Added a toggle on a second page of the miscellaneous module to toggle the default mode for the wardrobe (extended or quick)
 - Added support for crafted items to BCX's wardrobe import/export feature
 - Added support for crafted items to the curses module
 - Added a new BCX module "Relationships" that:
   - Enables permitted roles to set nicknames for other characters, specific to only the BCX user
   - Allows enforcing the BCX user to only use the set nickname for the character, if present in the room
   - Has multiple permissions configurable in the authority module
 - Added a new BCX module "Export-Import" that allows permitted roles to export/import the state of most BCX modules [partially by AR2000]
   - Has a permission to export the state of a module configuration in the "Export-Import" menu\
     Note: Importing requirements depend on the permissions of the module you are importing
 - Added a second page to the add curse screen for also cursing the character's body slots
 - Added hidden search keywords to rules, allowing you to find them easier when searching for them
   - If you make a search and expect a rule to appear but it doesn't, feel free to send us a suggestion for a keyword to add to the rule!
 - Added alphabetical sort toggle to add-rules screen and the commands module's command list
 - Added a filter/search field and two toggles (alphabetical sort and sort according to activation state) to the added rules/curses screens
 - Added a button to delete all currently filtered log entries over all page results at once in the behaviour log module
 - Added all hidden asylum backgrounds to the room background selection
 - Added new permission "Allow importing items using wardrobe" to the authority module, to no longer allow everyone to import outfits
 - Added four buttons on the added curses/rules screen to bulk-activate/deactivate curses/rules
 - Added an animated title to some users' BCX main menu to show that they are supporting BCX as a tier 2 Patreon supporter or BCX Developer
 - Improved the link to the BCX Discord in the BCX main menu and added a link to Patreon
 - Improved various screens to now no longer show a "Loading..." text on changes, instead showing the old data until new data is received
 - Changed the `allowactivities` command in a major way:
   - Added new permission "Allow using the allowactivities command on this player" to the authority module (default: self | friends)
   - If you or someone else (that person needs BCX, too) uses the command on you, this person can use all activities universally on you
   - This state lasts until that person uses the command again to toggle it off or until that person reloads BC
   - The command is now no longer item based but applies at once for all slots, independent of changes in items/clothings
   - The effect only applies to persons who used the command, all other persons in the same room cannot use more activities
 - Changed the curse trigger flooding detection to temporarily disable the affected curse slot and no longer the whole module
 - Changed BCX's local messages to use any set nickname from BC or BCX's relationships module
 - Changed nicknames from BC as well as BCX's relationships module to support a wider set of characters allowed to be used (compatible with BCE)
 - This update improves compatibility with BC release R83

Commands module changes:
 - Added new command `emoticon` that allows to set/change the BCX user's emoticon

Rules module changes:
 - Added new rule "Prevent changing own emoticon" that forbids the player from changing the currently showing emoticon
 - Added new rule "Control nickname" that allows directly setting the player's nickname
 - Added new rule "Allow changing the whole appearance" of the player character for defined roles, overruling the player's BC settings
 - Added new rule "Set slowed leave time" to set the time it takes to leave a room when slowed
 - Added new rule "Force-hide UI elements" that enforces hiding of certain UI elements for the BCX user over all characters in a room
 - Added new BC setting rule "Allow item tint effects"
 - Added new BC setting rule "Allow item blur effects"
 - Added a new toggle to the rule "Partial hearing" to set whether it allows to also partially understand gagged persons
 - Added a new toggle to the rule "Forbid tying up others", to only forbid tying more dominant players
 - Added a new toggle to the rule "Forbid freeing self", that still allows to remove items which have a low difficulty score
 - Improved description of the rule "Fully blind when blindfolded"

Fixes:
 - Fixed an incompatibility between the rule "Partial hearing" and the antigarble command

## 0.8.4

This update includes:
 - The `.antiblind` command now also removes tint and blur effects
 - Changed treatment of extra OOC closing brackets as OOC
 - This update improves compatibility with BC release R82

Rules module changes:
 - Changed the rule "Always leave rooms slowly" to ignore BC's roleplay difficulty setting 'Cannot be slowed down'
 - Fixed a bug with the rule "Track rule effect time", that made the settable role a maximum allowed role instead of a minimum one
 - Fixed the rule "Hearing whitelist" to correctly handle garbled whispers from rules such as "Garble whispers while gagged"
 - Improved the description of the rule "Restrict receiving beeps"

Fixes:
 - Fixed certain BCX messages appearing as "(Beep)" for users of the Chinese language [by dynilath]
 - Fixed item search triggering in the crafting details menu

## 0.8.3

This update includes:
 - Added a utility-command `.room promoteall` that gives admin to all non-admin players in the room
 - This update improves compatibility with BC release R80

Rules module changes:
 - Added new rule "Prevent using items of others" to only allow using bought items
 - Added new rule "Log money changes" to log spending money or optionally earning money
 - Added new rule "Track BCX activation" to log if the club was entered without BCX previously
 - Added new rule "Track rule effect time" to count the time the rule was in effect
 - Changed the rule "Greet new guests" to support setting emotes as greeting
 - Changed the rule "Room admin transfer" to only try giving admin to someone else once per visit

Fixes:
 - Fixed a bug with the default chat search value being used to block a room of this name when switching to room permission mode
 - Removed extra colon in the description of "Partial hearing" rule

## 0.8.2

This update includes:
 - The curses module was changed to no longer affect BC slave and club slave collars
 - Importing an outfit-string in the wardrobe on yourself now checks for items you have blacklisted and does not apply those
 - [technical] BCX's error reporter now shows timestamps for the last few messages
 - This update improves compatibility with BC release R79

Commands module changes:
- Added new command `forcetypetask` that is a variation of the `typetask` command, not aborting after a mistake
- Added new command `orgasm` that allows to directly control the BCX user's arousal meter and the way to orgasm

Rules module changes:
 - Added new rule "Prevent working as club slave" that, when enforced, will lead to the Club Mistresses not offering this task
 - Changed the rule "Restrict receiving whispers" to see both the whisper and the sent auto reply while not enforced [by Candi(ChandraHild)]
 - Changed the rule "Restrict receiving beeps" to see both the beep and the sent auto reply while not enforced [by Candi(ChandraHild)]

Fixes:
 - Fixed a bug with the rule "Ready to be summoned" that prevented summoning with the default "summon" message
 - Fixed item search opening without a group selected
 - Fixed item search closing in permission mode

## 0.8.1 "Commands update" Release

This update includes:
 - Renamed the curses clothing slot "Ears" to "Ears Accessory" so it does not conflict with the item slot "Ears"
 - Whispered commands now internally use anti-garbling to ignore any modifications to whispers
 - Changes to some of BCX's features to not run into BC's recently added message rate limit:
   - The curse all buttons
   - Some messages by the utility-command `.deck`
 - And additionally **everything from the 0.8.0 update released to every BCX user!**

Commands module changes:
 - Changed the command `keydeposit` to no longer be usable on your own character

Fixes:
 - Removed the extra `!` characters in front of the results when "Tab"-cycling in whispers to other BCX users
 - Fixed the utility-command `.wardrobe quickload` loading the wrong outfit slot

## 0.8.0 "Commands update"

This update includes:
 - New commands module - currently with 13 commands to use:
   - Each command has a name and a detailed description including the chat command
   - The commands range from changing poses, manipulating speech or even changing location
   - A limit system to limit and/or block commands that feel too intense or just not to your liking
   - Some commands are limited or blocked by default and cannot be used without explicitly unblocking them first
   - 3 new permissions in the authority module allow you to configure who can use normal and/or limited commands and change limits
   - Those permissions have default settings according to the BCX user's initially selected preset (e.g. Slave)
   - Commands cannot be used in the BCX UI, but have to be used as a chat command, e.g. ".wardrobe export"
   - You can get a convenient list of all commands you are permitted to use by whispering "!help commands" to another BCX user
   - Some of the commands can also be used by the BCX user on the own character, such as posing commands
 - Added a "Create theme room" button on the second page of the room create and administration screens (where BCX's room templates are), which ...
   - enables you to tag your room with a type, setting and several limits
   - allows you to set an automatic greeting message that only characters newly joining your room will see
   - offers you import/export of theme room configurations (similar to how BCX's wardrobe import/export works)
   NOTE: If this will see significant usage inside BC, we could later on add new filter options to the chat room search based on the theme room type/setting
 - Added BCX's wardrobe import/export buttons also to the regular wardrobe in your singleplayer private room (also when this wardrobe is used by the BCE mod)
 - Added "Tab"-key autocompletion results cycling also to commands whispered to other BCX users, if you have the same BCX version loaded
 - Added a utility-command `.garble` that converts a given message to gag talk of the defined strength for usage in roleplays or to counter antigarble
 - Added a utility-command `.room` that has 9 subcommands to configure or administrate your current chat room (e.g. a permanent ban command)
 - Added a utility-command `.wardrobe` that has 4 subcommands to export or quickload BC outfits or remove clothing when you should be able to (e.g. unbound on a bed)
 - Added a utility-command `.dice` that behaves exactly the same as /dice in the base club but does not show the results to the whole room - only to you
 - Added a utility-command `.deck` that has 4 subcommands to draw, deal or shuffle with a standard 52-card game deck
   NOTE: Please be reminded that BCX speeds up the process of typing chat commands a lot, if you wildly spam the "Tab"-key for autocompleting command parts
 - Changed the list of authority module permissions to color permissions you are allowed to change differently than those you cannot
 - Changed the 'help' chat command to no longer show a long list of all commands - those are now sorted into help categories such as "cheats" or "modules"
 - Changed a few tutorial pages, with the main addition of adding a new page explaining the new commands module
 - Changed the misc module option of hiding the BC typing indicator to also hide the BC wardrobe indicator on top, if another BCX user shows the BCX one already

Rules module changes:
 - Added several filter buttons that can be used to filter and sort the large list of rules that can be added, based on rule categories and availability
 - Added new subcommand "listall" to the modules-command `.rules` that lists all existing rules in BCX (in contrast to "list" which lists all currently added ones)
 - Added new rule "Prevent whitelisting" that can prevent the BCX user from newly adding characters with a role lower than "Mistress" to their BC whitelist
 - Added new rule "Forbid using GGTS" that can forbid using the Good Girl Training System of the base club
 - Added new rule "Partial hearing" that gives the ability to understand parts of a muffled sentence ungarbled, based on a whitelist of words and/or randomly
 - Added new rule "Forbid looking at room admin UI" that can forbid the BCX user to open the chat room admin screen while blindfolded to not see the room background
 - Added new rule "Field of vision for eyes" that blacks out part of the room view when the character's eyes are looking up or down accordingly
 - Changed the rule "Fully blind when eyes are closed" to also have the two toggles from above new rule: self-effect, hide names/icons
 - Changed the rule "Forbid saying certain words in chat" to also support adding small sentences and not just single words
 - Changed the rule "Establish mandatory words" to also support adding small sentences and not just single words
 - Changed the rule "Establish mandatory words" to accept also sound patterns of single words set (e.g. "nnnyaaaa!~~" matches the word "nya")
 - Removed the rule "Force'Show wardrobe icon' (Existing BC setting)" as this setting was removed from the base club
 - Improved the description of the rule "Limit bound admin power"
 - Improved the description of the rule "Order to greet club"
 - Fixed the rule "Ready to be summoned" not working again unless entering a different room in the meantime

Fixes:
 - Changed it so that chat messages consisting of only dots and nothing else afterwards (e.g. "...") no longer have the leading dot removed/escaped
 - Changed the chatroom status update logic to avoid leaking data to BCX clients in the same room that could be used to deduce that you are currently whispering 
 - Fixed a random text field being visible somewhere on the screen when looking at another BCX user's miscellaneous module menu
 - Fixed the BCX typing/status icons not being hidden correctly with the BC button to hide the UI stepwise
 - Fixed `.antigarble both` showing not garbled whisper messages twice under certain circumstances

## 0.7.9

This update includes:
 - Improved typing indicator compatibility with BC release R77
 - Added a toggle to hide BC typing indicator if BCX one is present (on by default)

Rule changes:
 - Fixed the rule "Order to greet room" requiring phrase while already in room when conditions become satisfied

Fixes:
 - Fixed being unable to configure other's logging if you disabled your own logging module
 - Hidden BCX icon for ghosted players
 - Updated ModSDK to version v1.0.2 including few fixes, see: https://github.com/Jomshir98/bondage-club-mod-sdk/releases/tag/v1.0.2

## 0.7.8

This update improves compatibility with BC release R77.

## 0.7.7

This update includes:
 - BCX now includes Jomshir's new Bondage Club Mod Development Kit that can handle compatibility issues between all mods using it.
   Additionally, it helps users to identify the source of a crash correctly, for reporting it to the correct mod.
   More info and how to use it in your own mod: https://github.com/Jomshir98/bondage-club-mod-sdk

Rule changes:
 - Changed the rules "Forbid using remotes on self" and "Forbid using remotes on others" to also forbid usage of the vibrating items remote
 - Changed the rule "Limit talking openly" to no longer count messages blocked by rules
 - Changed the rule "Doll talk" to treat an input of zero in the rule configuration as infinity, which enables only restricting either word or character count
 - Improved the description of the rule "Limit bound admin power"
 - Fixed a crash with the rule "Room admin transfer" that may happen if triggering while the user is not in the chat screen

## 0.7.6

This update includes:
 - Improves compatibility with BC release R76.
 - Added information on the initally selected BCX preset to the "Global" main menu module (not being able to change the preset is intended)

Rule changes:
 - Changed the rule "Order to greet room" to allow using Emotes even before saying the set greeting sentence in the chat.
 - Changed the rule "Ready to be summoned" to have a configurable summon time and to not trigger if already in the target room when the time is up
 - Improved readability of long sentences in rules with stringList elements via hover and adds the content back to the input field via clicking the entry
 - Fixed the rule "Order to greet room" always logging a rule violation, while the rule was only set to log and not to be enforced.

Fixes:
 - Fixed a bug in BC function `ServerPlayerIsInChatRoom`, which lead to incorrectly resolved trigger conditions during the standing up mini game
 - Fixed a bug with the page selector button of rules with list of strings/member numbers not working without permission to change the rule

## 0.7.5

This update includes:
 - Added two new permissions:
   - "Allow to view who added the curse originally"
   - "Allow to view who added the rule originally"
 - Added storing of the member number of the user adding a curse or rule from now on
   - This information can be viewed in the view/edit curse/rule screen at the top
   - Only characters who have the permission "Allow to view who added the [curse | rule] originally" can view it
   - All already added curses/rules will not have this information
 - Changed the `.antigarble` command to also reveal whispers that were garbled by the rule "Garble whispers while gagged"
 - Changed a few tutorial pages, with the main addition of explaining that added curses/rules can be marked as Favorite

Rule changes:
 - Added new rule "Establish mandatory words" which allows to set words of which at least one needs to be used in public chat messages
 - Added new rule "Prevent using BCX permissions" which blocks the player's self permissions for the own BCX, with some exceptions
 - Changed the rule "Limit bound admin power" to also block loading any room template while restrained
 - Changed the description of the rule "Control profile online description" to clarify that after saving changes, the original text is lost.

Fixes:
 - Fixed a bug that lead to beep notifications showing for a long time if the user's local time was not correctly set up
 - Fixed an error that occurred when trying to use the command "log list" while having no permission to view any type of logs
 - Fixed an error that could occur when using the photo shot function after opening the BCX tutorial

## 0.7.4

This update includes:
 - Added 14 new pages to the BCX tutorial in the main menu, including a one time notification for every existing BCX user
 - Added the possibility to set one of the room template slots to auto-fill the room creation screen when opening it
 - Added a new feature to the Miscellaneous module to set a text as default for the chat room search field
 - Added possibility to read the detailed descriptions of blocked rules in the "add rules" list
 - Added a new icon in the rules overview that quickly shows whether a rule has "item removal" set or not
 - Added chat commands to praise/scold
 - Updated the BCX background list to include the new backgrounds from BC version R75
 - Added a version migration framework (For better internal organization of things)

Rule changes:
 - Some improved, fixed or added rules, now totaling to 84 usable rules!
 - Added new rule "Forbid the action command" from the list of chat commands
 - Added new rule "Limit talking openly" which only allow a set number of chat messages per minute
 - Added new rule "Forbid using emotes"
 - Added new rule "Limit using emotes" which only allow a set number of emotes per minute
 - Added new rule "Forbid mainhall maid services" to get no help with restraints
 - Added new rule "Prevent usage of all activities" that blocks using the activity icons
 - Changed the rule "Order to greet room" to not accept emotes or whispers to pass the check
 - Changed the rule "Order to greet room" to make it impossible to deadlock in combination with other set speech rules
 - Changed the rule "Fully blind when blindfolded" to not be active when in VR with the according headset item
 - Changed the rule "Hearing whitelist" to not ignore messages in full sensory deprivation
 - Added a new input verification to string/stringList type text fields that forbids using certain characters that could lead to unexpected side effects

Fixes:
 - Fixed an incorrect hitbox for showing rule detailed descriptions in the rule overview

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
