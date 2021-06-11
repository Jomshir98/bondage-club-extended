import { registerModule } from "./moduleManager";

import { ModuleChatroom } from "./chatroom";
import { ModuleClubUtils } from "./clubUtils";
import { ModuleCommands } from "./commands";
import { ModuleConsole } from "./console";
import { ModuleMessaging } from "./messaging";
import { ModuleMiscPatches } from "./miscPatches";
import { ModuleStorage } from "./storage";
import { ModuleVersionCheck } from "./versionCheck";
import { ModuleWardrobe } from "./wardrobe";

export const module_chatroom = registerModule(new ModuleChatroom());
export const module_clubUtils = registerModule(new ModuleClubUtils());
export const module_commands = registerModule(new ModuleCommands());
export const module_console = registerModule(new ModuleConsole());
export const module_messaging = registerModule(new ModuleMessaging());
export const module_miscPatches = registerModule(new ModuleMiscPatches());
export const module_storage = registerModule(new ModuleStorage());
export const module_versionCheck = registerModule(new ModuleVersionCheck());
export const module_wardrobe = registerModule(new ModuleWardrobe());
