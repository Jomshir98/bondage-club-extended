import { registerModule } from "./moduleManager";

import { ModuleAuthority } from "./modules/authority";
import { ModuleChatroom } from "./modules/chatroom";
import { ModuleClubUtils } from "./modules/clubUtils";
import { ModuleCommands } from "./modules/commands";
import { ModuleConsole } from "./modules/console";
import { ModuleGUI } from "./modules/gui";
import { ModuleLog } from "./modules/log";
import { ModuleMessaging } from "./modules/messaging";
import { ModuleMiscPatches } from "./modules/miscPatches";
import { ModuleStorage } from "./modules/storage";
import { ModuleVersionCheck } from "./modules/versionCheck";
import { ModuleWardrobe } from "./modules/wardrobe";

export const module_authority = registerModule(new ModuleAuthority());
export const module_chatroom = registerModule(new ModuleChatroom());
export const module_clubUtils = registerModule(new ModuleClubUtils());
export const module_commands = registerModule(new ModuleCommands());
export const module_console = registerModule(new ModuleConsole());
export const module_gui = registerModule(new ModuleGUI());
export const module_log = registerModule(new ModuleLog());
export const module_messaging = registerModule(new ModuleMessaging());
export const module_miscPatches = registerModule(new ModuleMiscPatches());
export const module_storage = registerModule(new ModuleStorage());
export const module_versionCheck = registerModule(new ModuleVersionCheck());
export const module_wardrobe = registerModule(new ModuleWardrobe());
