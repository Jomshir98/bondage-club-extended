// BCX: Bondage Club Extended
if (typeof window.ImportBondageCollege !== "function") {
	alert("Club not detected! Please only use this while you have Club open!");
	throw "Dependency not met";
}
if (window.BCX_Loaded !== undefined) {
	alert("BCX is already detected in current window. To reload, please refresh the window.");
	throw "Already loaded";
}
window.BCX_Loaded = false;

(function () {
    'use strict';

    function InfoBeep(msg) {
        console.log(`BCX msg: ${msg}`);
        ServerBeep = {
            Timer: Date.now() + 3000,
            Message: msg
        };
    }
    function ChatRoomActionMessage(msg) {
        if (!msg)
            return;
        ServerSend("ChatRoomChat", {
            Content: "Beep",
            Type: "Action",
            Dictionary: [
                { Tag: "Beep", Text: "msg" },
                { Tag: "Biep", Text: "msg" },
                { Tag: "Sonner", Text: "msg" },
                { Tag: "msg", Text: msg }
            ]
        });
    }
    function ChatRoomSendLocal(msg, timeout, sender) {
        var _a, _b;
        // Adds the message and scrolls down unless the user has scrolled up
        const div = document.createElement("div");
        div.setAttribute("class", "ChatMessage ChatMessageLocalMessage");
        div.setAttribute("data-time", ChatRoomCurrentTime());
        div.setAttribute('data-sender', `${(_a = sender !== null && sender !== void 0 ? sender : Player.MemberNumber) !== null && _a !== void 0 ? _a : 0}`);
        if (typeof msg === 'string')
            div.innerText = msg;
        else
            div.appendChild(msg);
        if (timeout)
            setTimeout(() => div.remove(), timeout);
        // Returns the focus on the chat box
        const Refocus = ((_b = document.activeElement) === null || _b === void 0 ? void 0 : _b.id) === "InputChat";
        const ShouldScrollDown = ElementIsScrolledToEnd("TextAreaChatLog");
        const ChatLog = document.getElementById("TextAreaChatLog");
        if (ChatLog != null) {
            ChatLog.appendChild(div);
            if (ShouldScrollDown)
                ElementScrollToEnd("TextAreaChatLog");
            if (Refocus)
                ElementFocus("InputChat");
        }
    }
    function detectOtherMods() {
        const w = window;
        return {
            NMod: typeof w.ChatRoomDrawFriendList === "function",
            BondageClubTools: ServerSocket.listeners("ChatRoomMessage").some(i => i.toString().includes("window.postMessage"))
        };
    }
    /**
     * Draws an image on canvas, applying all options
     * @param {string | HTMLImageElement | HTMLCanvasElement} Source - URL of image or image itself
     * @param {number} X - Position of the image on the X axis
     * @param {number} Y - Position of the image on the Y axis
     * @param {object} [options] - any extra options, optional
     * @param {CanvasRenderingContext2D} [options.Canvas] - Canvas on which to draw the image, defaults to `MainCanvas`
     * @param {number} [options.Alpha] - transparency between 0-1
     * @param {[number, number, number, number]} [options.SourcePos] - Area in original image to draw in format `[left, top, width, height]`
     * @param {number} [options.Width] - Width of the drawn image, defaults to width of original image
     * @param {number} [options.Height] - Height of the drawn image, defaults to height of original image
     * @param {boolean} [options.Invert=false] - If image should be flipped vertically
     * @param {boolean} [options.Mirror=false] - If image should be flipped horizontally
     * @param {number} [options.Zoom=1] - Zoom factor
     * @returns {boolean} - whether the image was complete or not
     */
    function DrawImageEx(Source, X, Y, { Canvas = MainCanvas, Alpha = 1, SourcePos, Width, Height, Invert = false, Mirror = false, Zoom = 1 }) {
        if (typeof Source === "string") {
            Source = DrawGetImage(Source);
            if (!Source.complete)
                return false;
            if (!Source.naturalWidth)
                return true;
        }
        const sizeChanged = Width != null || Height != null;
        if (Width == null) {
            Width = SourcePos ? SourcePos[2] : Source.width;
        }
        if (Height == null) {
            Height = SourcePos ? SourcePos[3] : Source.height;
        }
        Canvas.save();
        Canvas.globalCompositeOperation = "source-over";
        Canvas.globalAlpha = Alpha;
        Canvas.translate(X, Y);
        if (Zoom !== 1) {
            Canvas.scale(Zoom, Zoom);
        }
        if (Invert) {
            Canvas.transform(1, 0, 0, -1, 0, Height);
        }
        if (Mirror) {
            Canvas.transform(-1, 0, 0, 1, Width, 0);
        }
        if (SourcePos) {
            Canvas.drawImage(Source, SourcePos[0], SourcePos[1], SourcePos[2], SourcePos[3], 0, 0, Width, Height);
        }
        else if (sizeChanged) {
            Canvas.drawImage(Source, 0, 0, Width, Height);
        }
        else {
            Canvas.drawImage(Source, 0, 0);
        }
        Canvas.restore();
        return true;
    }
    function isCloth(item, allowCosplay = false) {
        const asset = item.Asset ? item.Asset : item;
        return asset.Group.Category === "Appearance" && asset.Group.AllowNone && asset.Group.Clothing && (allowCosplay || !asset.Group.BodyCosplay);
    }
    function isBind(item) {
        const asset = item.Asset ? item.Asset : item;
        if (asset.Group.Category !== "Item" || asset.Group.BodyCosplay)
            return false;
        return !["ItemNeck", "ItemNeckAccessories", "ItemNeckRestraints"].includes(asset.Group.Name);
    }

    const VERSION = "0.1.1";
    const VERSION_CHECK_BOT = 37685;
    const FUNCTION_HASHES = {
        AppearanceClick: ["CA4ED810"],
        AppearanceRun: ["904E8E84", "066E8E43"],
        AsylumEntranceCanWander: ["3F5F4041"],
        ChatRoomCanLeave: ["B964B0B0"],
        ChatRoomClearAllElements: ["D1E1F8C3", "D0FE8299"],
        ChatRoomCreateElement: ["4837C2F6", "F1D4043C"],
        ChatRoomDrawCharacterOverlay: ["1E1A1B60"],
        ChatRoomKeyDown: ["C6EEC498"],
        ChatRoomMessage: ["2C6E4EC3", "FF31370D"],
        ChatRoomSendChat: ["39B06D87", "589B50FD"],
        CheatImport: ["412422CC", "1ECB0CC4"],
        DialogDrawExpressionMenu: ["071C32ED"],
        DialogDrawItemMenu: ["E0313EBF"],
        DialogDrawPoseMenu: ["6145B7D7"],
        ElementIsScrolledToEnd: ["064E4232"],
        ExtendedItemDraw: ["486A52DF", "59BAFBC6"],
        InformationSheetClick: ["39AD580B"],
        InformationSheetExit: ["4BC15B0A"],
        InformationSheetRun: ["58B7879C", "B96EA18A"],
        LoginMistressItems: ["984A6AD9"],
        LoginResponse: ["16C2C651", "2E1916A1"],
        LoginStableItems: ["C3F50DD1"],
        ServerAccountBeep: ["0057EF1D"],
        SpeechGarble: ["1BC8E005", "CF18316C"]
    };
    const FUNCTION_HASHES_NMOD = {
        AppearanceClick: ["B895612C"],
        AppearanceRun: ["791E142F"],
        AsylumEntranceCanWander: ["3F5F4041"],
        ChatRoomCanLeave: ["7EDA9A86"],
        ChatRoomClearAllElements: ["C2131E9B"],
        ChatRoomCreateElement: ["76299AEC"],
        ChatRoomDrawFriendList: ["327DA1B8"],
        ChatRoomKeyDown: ["D41B4525"],
        ChatRoomMessage: ["4BC817B8"],
        ChatRoomSendChat: ["385B9E9C"],
        CheatImport: ["1ECB0CC4"],
        DialogDrawExpressionMenu: ["EEFB3D22"],
        DialogDrawItemMenu: ["7C83D23C"],
        DialogDrawPoseMenu: ["4B146E82"],
        ElementIsScrolledToEnd: ["D28B0638"],
        ExtendedItemDraw: ["9256549A"],
        InformationSheetClick: ["E535609B"],
        InformationSheetExit: ["75521907"],
        InformationSheetRun: ["19872251"],
        LoginMistressItems: ["984A6AD9"],
        LoginResponse: ["E77283C0"],
        LoginStableItems: ["C3F50DD1"],
        ServerAccountBeep: ["A6DFD3B9"],
        SpeechGarble: ["99C1A7BA"]
    };

    const encoder = new TextEncoder();
    /* eslint-disable no-bitwise */
    function crc32(str) {
        let crc = 0 ^ -1;
        for (const b of encoder.encode(str)) {
            let c = (crc ^ b) & 0xff;
            for (let j = 0; j < 8; j++) {
                c = (c & 1) ? (-306674912 ^ (c >>> 1)) : (c >>> 1);
            }
            crc = (crc >>> 8) ^ c;
        }
        return ((crc ^ -1) >>> 0).toString(16).padStart(8, "0").toUpperCase();
    }
    /* eslint-enable no-bitwise */
    /** Utility function to add CSS */
    function addStyle(styleString) {
        const style = document.createElement("style");
        style.textContent = styleString;
        document.head.append(style);
    }
    /**
     * Waits for set amount of time, returning promes
     * @param ms The time in ms to wait for
     */
    function wait(ms) {
        return new Promise(r => setTimeout(r, ms));
    }
    /** Checks if the `obj` is an object (not null, not array) */
    function isObject(obj) {
        return !!obj && typeof obj === "object" && !Array.isArray(obj);
    }
    function longestCommonPrefix(strings) {
        if (strings.length === 0)
            return "";
        strings = strings.slice().sort();
        let i = 0;
        while (i < strings[0].length && strings[0][i] === strings[strings.length - 1][i]) {
            i++;
        }
        return strings[0].substring(0, i);
    }
    function arrayUnique(arr) {
        const seen = new Set();
        return arr.filter(i => !seen.has(i) && seen.add(i));
    }
    function capitalizeFirstLetter(str) {
        return str.charAt(0).toLocaleUpperCase() + str.slice(1);
    }
    /* eslint-disable no-bitwise */
    function uuidv4() {
        return "10000000-1000-4000-8000-100000000000".replace(/[018]/g, (c) => (c ^ (crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (c / 4)))).toString(16));
    }
    /* eslint-enable no-bitwise */
    const clipboardAvailable = Boolean(navigator.clipboard);

    const patchedFunctions = new Map();
    let unloaded = false;
    function makePatchRouter(data) {
        return (...args) => {
            if (unloaded) {
                console.warn(`BCX: Function router called while unloaded for ${data.original.name}`);
                return data.original(...args);
            }
            const hooks = data.hooks.slice();
            let hookIndex = 0;
            const callNextHook = (nextargs) => {
                if (hookIndex < hooks.length) {
                    hookIndex++;
                    return hooks[hookIndex - 1].hook(nextargs, callNextHook);
                }
                else {
                    return data.final(...args);
                }
            };
            return callNextHook(args);
        };
    }
    function initPatchableFunction(target) {
        var _a;
        if (unloaded) {
            throw new Error("Cannot init patchable function after unload");
        }
        let result = patchedFunctions.get(target);
        if (!result) {
            const original = window[target];
            const { NMod } = detectOtherMods();
            const expectedHashes = (_a = (NMod ? FUNCTION_HASHES_NMOD : FUNCTION_HASHES)[target]) !== null && _a !== void 0 ? _a : [];
            if (typeof original !== "function") {
                throw new Error(`BCX: Function ${target} to be patched not found`);
            }
            const hash = crc32(original.toString());
            if (!expectedHashes.includes(hash)) {
                console.warn(`BCX: Patched function ${target} has unknown hash ${hash}`);
            }
            console.debug(`BCX: Initialized ${target} for patching`);
            result = {
                original,
                final: original,
                hooks: [],
                patches: {}
            };
            patchedFunctions.set(target, result);
            window[target] = makePatchRouter(result);
        }
        return result;
    }
    function applyPatches(info) {
        if (Object.keys(info.patches).length === 0) {
            info.final = info.original;
            return;
        }
        let fn_str = info.original.toString();
        const N = `BCX: Patching ${info.original.name}`;
        for (const k of Object.keys(info.patches)) {
            if (!fn_str.includes(k)) {
                console.warn(`${N}: Patch ${k} not applied`);
            }
            fn_str = fn_str.replaceAll(k, info.patches[k]);
        }
        // eslint-disable-next-line no-eval
        info.final = eval(`(${fn_str})`);
    }
    function hookFunction(target, priority, hook) {
        const data = initPatchableFunction(target);
        data.hooks.push({
            hook,
            priority
        });
        data.hooks.sort((a, b) => b.priority - a.priority);
    }
    function patchFunction(target, patches) {
        const data = initPatchableFunction(target);
        Object.assign(data.patches, patches);
        applyPatches(data);
    }
    function unload_patches() {
        unloaded = true;
        for (const [k, v] of patchedFunctions.entries()) {
            v.hooks = [];
            v.patches = {};
            v.final = v.original;
            window[k] = v.original;
        }
        patchedFunctions.clear();
    }

    class BaseModule {
        init() {
            // Empty
        }
        load() {
            // Empty
        }
        run() {
            // Empty
        }
        unload() {
            // Empty
        }
    }
    var ModuleCategory;
    (function (ModuleCategory) {
        ModuleCategory[ModuleCategory["Basic"] = 0] = "Basic";
        ModuleCategory[ModuleCategory["Authority"] = 1] = "Authority";
        ModuleCategory[ModuleCategory["Misc"] = 2] = "Misc";
    })(ModuleCategory || (ModuleCategory = {}));
    const MODULE_NAMES = {
        [ModuleCategory.Basic]: "Basic",
        [ModuleCategory.Authority]: "Authority",
        [ModuleCategory.Misc]: "Miscellaneous"
    };
    const MODULE_ICONS = {
        [ModuleCategory.Basic]: "Icons/General.png",
        [ModuleCategory.Authority]: "Icons/Security.png",
        [ModuleCategory.Misc]: "Icons/Random.png"
    };
    let moduleInitPhase = 0 /* construct */;
    const modules = [];
    function registerModule(module) {
        if (moduleInitPhase !== 0 /* construct */) {
            throw new Error("Modules can be registered only before initialization");
        }
        modules.push(module);
        console.debug(`BCX: Registered module ${module.constructor.name}`);
        return module;
    }
    function init_modules() {
        moduleInitPhase = 1 /* init */;
        for (const m of modules) {
            m.init();
        }
        moduleInitPhase = 2 /* load */;
        for (const m of modules) {
            m.load();
        }
        moduleInitPhase = 3 /* ready */;
        for (const m of modules) {
            m.run();
        }
    }
    function unload_modules() {
        moduleInitPhase = 4 /* destroy */;
        for (const m of modules) {
            m.unload();
        }
    }

    function loginInit(C) {
        if (window.BCX_Loaded)
            return;
        init();
    }
    function init() {
        // Loading into already loaded club - clear some caches
        DrawRunMap.clear();
        DrawScreen = "";
        init_modules();
        //#region Other mod compatability
        const { BondageClubTools } = detectOtherMods();
        if (BondageClubTools) {
            console.warn("BCX: Bondage Club Tools detected!");
            const ChatRoomMessageForwarder = ServerSocket.listeners("ChatRoomMessage").find(i => i.toString().includes("window.postMessage"));
            const AccountBeepForwarder = ServerSocket.listeners("AccountBeep").find(i => i.toString().includes("window.postMessage"));
            console.assert(ChatRoomMessageForwarder !== undefined && AccountBeepForwarder !== undefined);
            ServerSocket.off("ChatRoomMessage");
            ServerSocket.on("ChatRoomMessage", data => {
                if ((data === null || data === void 0 ? void 0 : data.Type) !== "Hidden" || data.Content !== "BCXMsg" || typeof data.Sender !== "number") {
                    ChatRoomMessageForwarder(data);
                }
                return ChatRoomMessage(data);
            });
            ServerSocket.off("AccountBeep");
            ServerSocket.on("AccountBeep", data => {
                if (typeof (data === null || data === void 0 ? void 0 : data.BeepType) !== "string" || !data.BeepType.startsWith("Jmod:")) {
                    AccountBeepForwarder(data);
                }
                return ServerAccountBeep(data);
            });
        }
        //#endregion
        window.BCX_Loaded = true;
        InfoBeep(`BCX loaded! Version: ${VERSION}`);
    }
    function unload() {
        const { BondageClubTools } = detectOtherMods();
        if (BondageClubTools) {
            throw new Error("BCX: Unload not supported when BondageClubTools are present");
        }
        unload_patches();
        unload_modules();
        // clear some caches
        DrawRunMap.clear();
        DrawScreen = "";
        delete window.BCX_Loaded;
        console.log("BCX: Unloaded.");
    }

    let modStorage = {};
    function modStorageSync() {
        if (!Player.OnlineSettings) {
            console.error("BCX: Player OnlineSettings not defined during storage sync!");
            return;
        }
        Player.OnlineSettings.BCX = LZString.compressToBase64(JSON.stringify(modStorage));
        if (typeof ServerAccountUpdate !== "undefined") {
            ServerAccountUpdate.QueueData({ OnlineSettings: Player.OnlineSettings });
        }
        else {
            console.debug("BCX: Old sync method");
            ServerSend("AccountUpdate", { OnlineSettings: Player.OnlineSettings });
        }
    }
    class ModuleStorage extends BaseModule {
        init() {
            var _a;
            const saved = (_a = Player.OnlineSettings) === null || _a === void 0 ? void 0 : _a.BCX;
            if (typeof saved === "string") {
                try {
                    const storage = JSON.parse(LZString.decompressFromBase64(saved));
                    if (!isObject(storage)) {
                        throw new Error("Bad data");
                    }
                    modStorage = storage;
                }
                catch (error) {
                    console.error("BCX: Error while loading saved data, full reset.", error);
                }
            }
            else {
                console.log("BCX: First time init");
            }
        }
        run() {
            modStorageSync();
        }
    }

    const hiddenMessageHandlers = new Map();
    const hiddenBeepHandlers = new Map();
    const queryHandlers = {};
    const changeHandlers = [];
    function sendHiddenMessage(type, message, Target = null) {
        if (!ServerPlayerIsInChatRoom())
            return;
        ServerSend("ChatRoomChat", {
            Content: "BCXMsg",
            Type: "Hidden",
            Target,
            Dictionary: { type, message }
        });
    }
    function sendHiddenBeep(type, message, target, asLeashBeep = false) {
        ServerSend("AccountBeep", {
            MemberNumber: target,
            BeepType: asLeashBeep ? "Leash" : "BCX",
            Message: {
                BCX: { type, message }
            }
        });
    }
    const pendingQueries = new Map();
    function sendQuery(type, data, target, timeout = 10000) {
        return new Promise((resolve, reject) => {
            const id = uuidv4();
            const info = {
                target,
                resolve,
                reject,
                timeout: setTimeout(() => {
                    console.warn("BCX: Query timed out", target, type);
                    pendingQueries.delete(id);
                    reject("Timed out");
                }, timeout)
            };
            pendingQueries.set(id, info);
            sendHiddenMessage("query", {
                id,
                query: type,
                data
            }, target);
        });
    }
    hiddenMessageHandlers.set("query", (sender, message) => {
        if (!isObject(message) ||
            typeof message.id !== "string" ||
            typeof message.query !== "string") {
            console.warn(`BCX: Invalid query`, sender, message);
            return;
        }
        const handler = queryHandlers[message.query];
        if (!handler) {
            console.warn("BCX: Query no handler", sender, message);
            return sendHiddenMessage("queryAnswer", {
                id: message.id,
                ok: false
            });
        }
        handler(sender, (ok, data) => {
            sendHiddenMessage("queryAnswer", {
                id: message.id,
                ok,
                data
            }, sender);
        }, message.data);
    });
    hiddenMessageHandlers.set("queryAnswer", (sender, message) => {
        if (!isObject(message) ||
            typeof message.id !== "string" ||
            typeof message.ok !== "boolean") {
            console.warn(`BCX: Invalid queryAnswer`, sender, message);
            return;
        }
        const info = pendingQueries.get(message.id);
        if (!info) {
            console.warn(`BCX: Response to unknown query`, sender, message);
            return;
        }
        if (info.target !== info.target) {
            console.warn(`BCX: Response to query not from target`, sender, message, info);
            return;
        }
        clearTimeout(info.timeout);
        pendingQueries.delete(message.id);
        if (message.ok) {
            info.resolve(message.data);
        }
        else {
            info.reject(message.data);
        }
    });
    hiddenMessageHandlers.set("somethingChanged", (sender) => {
        changeHandlers.forEach(h => h(sender));
    });
    function notifyOfChange() {
        sendHiddenMessage("somethingChanged", undefined);
    }
    class ModuleMessaging extends BaseModule {
        load() {
            hookFunction("ChatRoomMessage", 10, (args, next) => {
                const data = args[0];
                if ((data === null || data === void 0 ? void 0 : data.Type) === "Hidden" && data.Content === "BCXMsg" && typeof data.Sender === "number") {
                    if (data.Sender === Player.MemberNumber)
                        return;
                    if (!isObject(data.Dictionary)) {
                        console.warn("BCX: Hidden message no Dictionary", data);
                        return;
                    }
                    const { type, message } = data.Dictionary;
                    if (typeof type === "string") {
                        const handler = hiddenMessageHandlers.get(type);
                        if (handler === undefined) {
                            console.warn("BCX: Hidden message no handler", data.Sender, type, message);
                        }
                        else {
                            handler(data.Sender, message);
                        }
                    }
                    return;
                }
                return next(args);
            });
            hookFunction("ServerAccountBeep", 10, (args, next) => {
                var _a;
                const data = args[0];
                if (typeof (data === null || data === void 0 ? void 0 : data.BeepType) === "string" && ["Leash", "BCX"].includes(data.BeepType) && isObject((_a = data.Message) === null || _a === void 0 ? void 0 : _a.BCX)) {
                    const { type, message } = data.Message.BCX;
                    if (typeof type === "string") {
                        const handler = hiddenBeepHandlers.get(type);
                        if (handler === undefined) {
                            console.warn("BCX: Hidden beep no handler", data.MemberNumber, type, message);
                        }
                        else {
                            handler(data.MemberNumber, message);
                        }
                    }
                    return;
                }
                else {
                    return next(args);
                }
            });
        }
        unload() {
            hiddenBeepHandlers.clear();
            hiddenMessageHandlers.clear();
        }
    }

    var AccessLevel;
    (function (AccessLevel) {
        AccessLevel[AccessLevel["self"] = 0] = "self";
        AccessLevel[AccessLevel["clubowner"] = 1] = "clubowner";
        AccessLevel[AccessLevel["owner"] = 2] = "owner";
        AccessLevel[AccessLevel["lover"] = 3] = "lover";
        AccessLevel[AccessLevel["mistress"] = 4] = "mistress";
        AccessLevel[AccessLevel["whitelist"] = 5] = "whitelist";
        AccessLevel[AccessLevel["friend"] = 6] = "friend";
        AccessLevel[AccessLevel["public"] = 7] = "public";
    })(AccessLevel || (AccessLevel = {}));
    const permissions = new Map();
    function registerPermission(name, data) {
        if (moduleInitPhase !== 1 /* init */) {
            throw new Error("Permissions can be registered only during init");
        }
        if (permissions.has(name)) {
            throw new Error(`Permission "${name}" already defined!`);
        }
        permissions.set(name, data);
    }
    function getCharacterAccessLevel(character) {
        var _a;
        if (character.isPlayer())
            return AccessLevel.self;
        if (character.MemberNumber !== null) {
            if (Player.IsOwnedByMemberNumber(character.MemberNumber))
                return AccessLevel.clubowner;
            if (Player.IsLoverOfMemberNumber(character.MemberNumber))
                return AccessLevel.lover;
            if (Player.WhiteList.includes(character.MemberNumber))
                return AccessLevel.whitelist;
            if ((_a = Player.FriendList) === null || _a === void 0 ? void 0 : _a.includes(character.MemberNumber))
                return AccessLevel.friend;
        }
        return AccessLevel.public;
    }
    function checkPermissionAccess(permission, character) {
        const permData = permissions.get(permission);
        if (!permData) {
            console.error(new Error(`Check for unknown permission "${permission}"`));
            return false;
        }
        if (character.isPlayer()) {
            return permData.self || permData.min === AccessLevel.self;
        }
        // TODO: Check item access
        const accessLevel = getCharacterAccessLevel(character);
        return accessLevel <= permData.min;
    }
    function permissionsMakeBundle() {
        const res = {};
        for (const [k, v] of permissions.entries()) {
            res[k] = [v.self, v.min];
        }
        return res;
    }
    function getPermissionDataFromBundle(bundle) {
        const res = {};
        for (const [k, v] of permissions.entries()) {
            if (bundle[k]) {
                res[k] = {
                    category: v.category,
                    name: v.name,
                    self: bundle[k][0],
                    min: bundle[k][1]
                };
            }
        }
        return res;
    }
    function setPermissionSelfAccess(permission, self) {
        const permData = permissions.get(permission);
        if (!permData) {
            throw new Error(`Attempt to edit unknown permission "${permission}"`);
        }
        const last = permData.self;
        permData.self = self || permData.min === AccessLevel.self;
        if (permData.self !== last) {
            permissionsSync();
        }
    }
    function setPermissionMinAccess(permission, min) {
        const permData = permissions.get(permission);
        if (!permData) {
            throw new Error(`Attempt to edit unknown permission "${permission}"`);
        }
        const last = permData.min;
        permData.min = min;
        if (min === AccessLevel.self) {
            permData.self = true;
        }
        if (permData.min !== last) {
            permissionsSync();
        }
    }
    function permissionsSync() {
        modStorage.permissions = permissionsMakeBundle();
        modStorageSync();
    }
    function getPlayerPermissionSettings() {
        const res = {};
        for (const [k, v] of permissions.entries()) {
            res[k] = { ...v };
        }
        return res;
    }
    class ModuleAuthority extends BaseModule {
        init() {
            registerPermission("authority_grant_self", {
                name: "Allow granting self access",
                category: ModuleCategory.Authority,
                self: true,
                min: AccessLevel.self
            });
            registerPermission("authority_revoke_self", {
                name: "Allow forbidding self access",
                category: ModuleCategory.Authority,
                self: true,
                min: AccessLevel.self
            });
            registerPermission("authority_edit_min", {
                name: "Allow minimal access modification",
                category: ModuleCategory.Authority,
                self: true,
                min: AccessLevel.self
            });
            queryHandlers.permissions = (sender, resolve) => {
                resolve(true, permissionsMakeBundle());
            };
        }
        load() {
            if (isObject(modStorage.permissions)) {
                for (const [k, v] of Object.entries(modStorage.permissions)) {
                    const perm = permissions.get(k);
                    if (!Array.isArray(v) || typeof v[0] !== "boolean" || typeof v[1] !== "number") {
                        console.warn(`BCX: Storage: bad permission ${k}`);
                    }
                    else if (AccessLevel[v[1]] === undefined) {
                        console.warn(`BCX: Storage: bad permission ${k} level ${v[1]}`);
                    }
                    else if (perm === undefined) {
                        console.warn(`BCX: Storage: unknown permission ${k}`);
                    }
                    else {
                        perm.self = v[0];
                        perm.min = v[1];
                    }
                }
            }
            modStorage.permissions = permissionsMakeBundle();
        }
    }

    const icon_Emote = `data:image/png;base64,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`;
    const icon_Typing = `data:image/png;base64,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`;
    const icon_NewMessage = `data:image/png;base64,
iVBORw0KGgoAAAANSUhEUgAAADIAAAAyCAYAAAAeP4ixAAAABGdBTUEAALGOfPtRkwAAACBjSFJN
AAB6JQAAgIMAAPn/AACA6QAAdTAAAOpgAAA6mAAAF2+SX8VGAAADpElEQVR42uyZP0grWRTGz+gk
yhPEXYSQQmTAJoWCqJ2VqAgmYhBFtxELURHfW7ERbATTprEIJmAEWcbONBKf+KcRG7HQoGEW0ZhC
gwmmEGIiZvy2eXlkvE40muhG5oMUmTn3nvO75947d85wAOgrqIi+iDQQDUQD0UA0EA3kPeLD4TA5
nc7voihOSpL0BxHJhZIEQRDuOjs7F8fHx220sLDwg4hQyL/p6Wk7NTU1/ZvJiOO4Tw/0pRiqq6uD
HM/zN8lk8k8iIqPRSKFQSJE/q9VKExMTVFJSQvF4nMkvAOI47sV5kDqcZrJN7wsAlZaWkizL5HK5
SBRFha0gCBQMBunx8ZGIKEo8z9+kyNbW1uB0OhnikZERXF5e4qMVDocxOTnJZMRut2N/fz/92o0C
ZGdnBwCwu7sLk8mkaFxZWQmPx/NhEOvr66iqqlLEIAgCNjc3AQB+v18dZGtrSzEaY2NjTHZmZ2cR
j8fzBnB/fw+bzcb4HRwcxNXV1W+7k5MTdZDt7W2mY5fLxXTa0dEBSZJyDnF+fg6r1cr4m5+fhyzL
CtusQQDA5/PBYrEoOi8vL4fD4cDd3V1OsuB2u2EwGBQ+WltbcXBw8Gyb4+Pj7EEAIJFIwG63M6PV
39+PUCj0ZohIJIKhoSGm37m5OcRiMdV2GTOSvkbUtLGxAaPRqHBaU1OTcRDUtLe3h9raWkVfFRUV
8Hq9L7Z909R6qmAwiL6+PmYUbTZbxlF8KbsWiwWnp6eviiEnIKl5vbKywszrlpYW+Hw+1XaSJMFs
NjNZcLvdWe2GDEhxcfGbQFLy+/1obm5WBMbzPBYXFxU7jSzLEEURZWVlCtuGhgYcHh5m7ffda+Q5
3d7eYmZm5tm9//r6GtFoFKOjo8z9qakpRKPRN/nM2dR6Tl6vl3ka19fXo7GxkTklrK6uvstXXkEA
IBAIYGBgQPWk2t3d/eoF/akgAJBMJrG0tAS9Xq+AcDgceHh4yImPvKwRNR0dHcFsNqOtrU31CZ0r
ED69iP2a94psVFdXRx6PhwCQTqfL7zt7roNnHPD8x1dRCvkTgwIk39nJK8iX+dCTnoVCzgj/qwpB
REQXFxcUCAQokUgwVY+n1ZLU/6cZVbN/TeUl3Wem9jqdjs7OzpQXTSbTRaEX6AwGw2VRb2/vP4W+
Prq6urb5np6euUgk8m15efmvWCxWQkSPBRI/p9fr5fb29p/Dw8N/c9rnaQ1EA9FANBANRAPRQP5/
+m8A4sEE5SZccHcAAAAASUVORK5CYII=`.replaceAll("\n", "");
    const icon_PurpleHeart = `data:image/png;base64,
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`.replaceAll("\n", "");
    const icon_BCX = `data:image/png;base64,
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
`.replaceAll("\n", "");
    const icon_OwnerList = `data:image/png;base64,
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
xBaQJfz/AJiiFen2ESExAAAAAElFTkSuQmCC
`.replaceAll("\n", "");

    class ChatroomCharacter {
        constructor(character) {
            this.BCXVersion = null;
            this.Character = character;
            if (character.ID === 0) {
                this.BCXVersion = VERSION;
            }
            console.debug(`BCX: Loaded character ${character.Name} (${character.MemberNumber})`);
        }
        isPlayer() {
            return false;
        }
        get MemberNumber() {
            if (typeof this.Character.MemberNumber !== "number") {
                throw new Error("Character without MemberNumber");
            }
            return this.Character.MemberNumber;
        }
        get Name() {
            return this.Character.Name;
        }
        toString() {
            return `${this.Name} (${this.MemberNumber})`;
        }
        getPermissions() {
            return sendQuery("permissions", undefined, this.MemberNumber).then(data => {
                if (!isObject(data) ||
                    Object.values(data).some(v => !Array.isArray(v) ||
                        typeof v[0] !== "boolean" ||
                        typeof v[1] !== "number" ||
                        AccessLevel[v[1]] === undefined)) {
                    throw new Error("Bad data");
                }
                return getPermissionDataFromBundle(data);
            });
        }
    }
    class PlayerCharacter extends ChatroomCharacter {
        constructor() {
            super(...arguments);
            /** HACK: Otherwise TS wrongly assumes PlayerCharacter to be identical to ChatroomCharacter */
            this.playerObject = true;
        }
        isPlayer() {
            return true;
        }
        getPermissions() {
            return Promise.resolve(getPlayerPermissionSettings());
        }
    }
    const currentRoomCharacters = [];
    function cleanOldCharacters() {
        for (let i = currentRoomCharacters.length - 1; i >= 0; i--) {
            if (!currentRoomCharacters[i].isPlayer() && !ChatRoomCharacter.includes(currentRoomCharacters[i].Character)) {
                currentRoomCharacters.splice(i, 1);
            }
        }
    }
    function getChatroomCharacter(memberNumber) {
        if (typeof memberNumber !== "number")
            return null;
        cleanOldCharacters();
        let character = currentRoomCharacters.find(c => c.Character.MemberNumber === memberNumber);
        if (!character) {
            if (Player.MemberNumber === memberNumber) {
                character = new PlayerCharacter(Player);
            }
            else {
                const BCCharacter = ChatRoomCharacter.find(c => c.MemberNumber === memberNumber);
                if (!BCCharacter) {
                    return null;
                }
                character = new ChatroomCharacter(BCCharacter);
            }
            currentRoomCharacters.push(character);
        }
        return character;
    }
    function getAllCharactersInRoom() {
        return ChatRoomCharacter.map(c => getChatroomCharacter(c.MemberNumber)).filter(Boolean);
    }
    function getPlayerCharacter() {
        let character = currentRoomCharacters.find(c => c.Character === Player);
        if (!character) {
            character = new PlayerCharacter(Player);
            currentRoomCharacters.push(character);
        }
        return character;
    }

    class ChatRoomStatusManager {
        constructor() {
            this.InputTimeoutMs = 3000;
            this.StatusTypes = {
                None: "None",
                Typing: "Typing",
                Emote: "Emote",
                Whisper: "Whisper",
                // NMod
                Action: "Action",
                Afk: 'Afk'
            };
            this.InputElement = null;
            this.InputTimeout = null;
            this.Status = this.StatusTypes.None;
        }
        SetInputElement(elem) {
            if (this.InputElement !== elem) {
                this.InputElement = elem;
                if (elem !== null) {
                    elem.addEventListener("blur", this.InputEnd.bind(this));
                    elem.addEventListener("input", this.InputChange.bind(this));
                }
            }
        }
        SetStatus(type, target = null) {
            if (type !== this.Status) {
                if (target !== null && this.Status === this.StatusTypes.Whisper) {
                    this.SetStatus(this.StatusTypes.None, null);
                }
                this.Status = type;
                sendHiddenMessage("ChatRoomStatusEvent", { Type: type, Target: target }, target);
                const { NMod } = detectOtherMods();
                if (NMod)
                    ServerSend("ChatRoomStatusEvent", { Type: type, Target: target });
            }
        }
        InputChange() {
            var _a;
            const value = (_a = this.InputElement) === null || _a === void 0 ? void 0 : _a.value;
            if (typeof value === "string" && value.length > 1) {
                let type = this.StatusTypes.Typing;
                let target = null;
                if (value.startsWith("*") || value.startsWith("/me ") || value.startsWith("/emote ") || value.startsWith("/action ")) {
                    type = this.StatusTypes.Emote;
                }
                else if (value.startsWith("/") || value.startsWith(".")) {
                    return this.InputEnd();
                }
                else if (ChatRoomTargetMemberNumber !== null) {
                    type = this.StatusTypes.Whisper;
                    target = ChatRoomTargetMemberNumber;
                }
                if (this.InputTimeout !== null) {
                    clearTimeout(this.InputTimeout);
                }
                this.InputTimeout = setTimeout(this.InputEnd.bind(this), this.InputTimeoutMs);
                this.SetStatus(type, target);
            }
            else {
                this.InputEnd();
            }
        }
        InputEnd() {
            if (this.InputTimeout !== null) {
                clearTimeout(this.InputTimeout);
                this.InputTimeout = null;
            }
            this.SetStatus(this.StatusTypes.None);
        }
        unload() {
            this.InputEnd();
        }
    }
    let ChatroomSM;
    function queryAnnounce() {
        announceSelf(true);
    }
    class ModuleChatroom extends BaseModule {
        constructor() {
            super(...arguments);
            this.o_ChatRoomSM = null;
        }
        init() {
            ChatroomSM = new ChatRoomStatusManager();
        }
        load() {
            hiddenMessageHandlers.set("hello", (sender, message) => {
                const char = getChatroomCharacter(sender);
                if (!char) {
                    console.warn(`BCX: Hello from character not found in room`, sender);
                    return;
                }
                if (typeof (message === null || message === void 0 ? void 0 : message.version) !== "string") {
                    console.warn(`BCX: Invalid hello`, sender, message);
                    return;
                }
                if (char.BCXVersion !== message.version) {
                    console.log(`BCX: ${char.Character.Name} (${char.Character.MemberNumber}) uses BCX version ${message.version}`);
                }
                char.BCXVersion = message.version;
                if (message.request === true) {
                    announceSelf(false);
                }
            });
            hiddenMessageHandlers.set("goodbye", (sender) => {
                const char = getChatroomCharacter(sender);
                if (char) {
                    char.BCXVersion = null;
                }
            });
            hookFunction("ChatRoomMessage", 10, (args, next) => {
                const data = args[0];
                if ((data === null || data === void 0 ? void 0 : data.Type) === "Action" && data.Content === "ServerEnter") {
                    announceSelf(false);
                }
                return next(args);
            });
            const { NMod } = detectOtherMods();
            if (NMod) {
                hookFunction("ChatRoomDrawFriendList", 0, (args, next) => {
                    var _a;
                    const [C, Zoom, CharX, CharY] = args;
                    const Char = getChatroomCharacter(C.MemberNumber);
                    const Friend = ((_a = Player.FriendList) !== null && _a !== void 0 ? _a : []).includes(C.MemberNumber);
                    if (Char === null || Char === void 0 ? void 0 : Char.BCXVersion) {
                        DrawImageEx(icon_PurpleHeart, CharX + 375 * Zoom, CharY, {
                            Width: 50 * Zoom,
                            Height: 50 * Zoom,
                            Alpha: C.ID === 0 || Friend ? 1 : 0.5
                        });
                    }
                    else {
                        next(args);
                    }
                });
            }
            else {
                patchFunction("ChatRoomDrawCharacterOverlay", {
                    'DrawImageResize("Icons/Small/FriendList.png", CharX + 375 * Zoom, CharY, 50 * Zoom, 50 * Zoom);': ""
                });
                hookFunction("ChatRoomDrawCharacterOverlay", 0, (args, next) => {
                    var _a;
                    next(args);
                    const [C, CharX, CharY, Zoom] = args;
                    const Char = getChatroomCharacter(C.MemberNumber);
                    const Friend = ((_a = Player.FriendList) !== null && _a !== void 0 ? _a : []).includes(C.MemberNumber);
                    if (Char === null || Char === void 0 ? void 0 : Char.BCXVersion) {
                        DrawImageEx(icon_PurpleHeart, CharX + 375 * Zoom, CharY, {
                            Width: 50 * Zoom,
                            Height: 50 * Zoom,
                            Alpha: C.ID === 0 || Friend ? 1 : 0.5
                        });
                    }
                    else if (Friend) {
                        DrawImageEx("Icons/Small/FriendList.png", CharX + 375 * Zoom, CharY, {
                            Width: 50 * Zoom,
                            Height: 50 * Zoom
                        });
                    }
                    switch (C.ID === 0 ? ChatroomSM.Status : C.Status) {
                        case ChatroomSM.StatusTypes.Typing:
                            DrawImageEx(icon_Typing, CharX + 375 * Zoom, CharY + 50 * Zoom, {
                                Width: 50 * Zoom,
                                Height: 50 * Zoom
                            });
                            break;
                        case ChatroomSM.StatusTypes.Whisper:
                            DrawImageEx(icon_Typing, CharX + 375 * Zoom, CharY + 50 * Zoom, {
                                Width: 50 * Zoom,
                                Height: 50 * Zoom,
                                Alpha: 0.5
                            });
                            break;
                        case ChatroomSM.StatusTypes.Emote:
                            DrawImageEx(icon_Emote, CharX + 375 * Zoom, CharY + 50 * Zoom, {
                                Width: 50 * Zoom,
                                Height: 50 * Zoom
                            });
                            break;
                    }
                });
                hookFunction("ChatRoomCreateElement", 0, (args, next) => {
                    next(args);
                    ChatroomSM.SetInputElement(document.getElementById("InputChat"));
                });
            }
            hookFunction("ChatRoomSendChat", 0, (args, next) => {
                next(args);
                ChatroomSM.InputEnd();
            });
            hookFunction("ChatRoomClearAllElements", 0, (args, next) => {
                next(args);
                ChatroomSM.SetInputElement(null);
            });
            hiddenMessageHandlers.set("ChatRoomStatusEvent", (src, data) => {
                for (const char of ChatRoomCharacter) {
                    if (char.MemberNumber === src) {
                        char.Status = data.Target == null || data.Target === Player.MemberNumber ? data.Type : "None";
                    }
                }
            });
            if (NMod) {
                this.o_ChatRoomSM = window.ChatRoomSM;
                window.ChatRoomSM = ChatroomSM;
                ServerSocket.on("ChatRoomMessageSync", queryAnnounce);
            }
        }
        run() {
            if (document.getElementById("InputChat") != null) {
                ChatroomSM.SetInputElement(document.getElementById("InputChat"));
            }
            queryAnnounce();
        }
        unload() {
            ChatroomSM.unload();
            if (this.o_ChatRoomSM) {
                window.ChatRoomSM = this.o_ChatRoomSM;
            }
            ServerSocket.off("ChatRoomMessageSync", queryAnnounce);
            sendHiddenMessage("goodbye", undefined);
        }
    }
    function announceSelf(request = false) {
        sendHiddenMessage("hello", {
            version: VERSION,
            request
        });
    }

    function j_WardrobeExportSelectionClothes(includeBinds = false) {
        if (!CharacterAppearanceSelection)
            return "";
        const save = CharacterAppearanceSelection.Appearance
            .filter(a => isCloth(a, true) || (includeBinds && isBind(a)))
            .map(WardrobeAssetBundle);
        return LZString.compressToBase64(JSON.stringify(save));
    }
    function j_WardrobeImportSelectionClothes(data, includeBinds, force = false) {
        if (typeof data !== "string" || data.length < 1)
            return "No data";
        try {
            if (data[0] !== "[") {
                const decompressed = LZString.decompressFromBase64(data);
                if (!decompressed)
                    return "Bad data";
                data = decompressed;
            }
            data = JSON.parse(data);
            if (!Array.isArray(data))
                return "Bad data";
        }
        catch (error) {
            console.warn(error);
            return "Bad data";
        }
        const C = CharacterAppearanceSelection;
        if (!C) {
            return "No character";
        }
        if (includeBinds && !force && C.Appearance.some(a => { var _a, _b; return isBind(a) && ((_b = (_a = a.Property) === null || _a === void 0 ? void 0 : _a.Effect) === null || _b === void 0 ? void 0 : _b.includes("Lock")); })) {
            return "Character is bound";
        }
        const Allow = (a) => isCloth(a, CharacterAppearanceSelection.ID === 0) || (includeBinds && isBind(a));
        C.Appearance = C.Appearance.filter(a => !Allow(a));
        for (const cloth of data) {
            if (C.Appearance.some(a => a.Asset.Group.Name === cloth.Group))
                continue;
            const A = Asset.find(a => a.Group.Name === cloth.Group && a.Name === cloth.Name && Allow(a));
            if (A != null) {
                CharacterAppearanceSetItem(C, cloth.Group, A, cloth.Color, 0, undefined, false);
                const item = InventoryGet(C, cloth.Group);
                if (cloth.Property && item) {
                    if (item.Property == null)
                        item.Property = {};
                    Object.assign(item.Property, cloth.Property);
                }
            }
            else {
                console.warn(`Clothing not found: `, cloth);
            }
        }
        CharacterRefresh(C);
        return true;
    }
    let j_WardrobeIncludeBinds = false;
    function PasteListener(ev) {
        if (CurrentScreen === "Appearance" && CharacterAppearanceMode === "Wardrobe") {
            ev.preventDefault();
            ev.stopImmediatePropagation();
            const data = (ev.clipboardData || window.clipboardData).getData("text");
            const res = j_WardrobeImportSelectionClothes(data, j_WardrobeIncludeBinds, allowMode);
            CharacterAppearanceWardrobeText = res !== true ? `Import error: ${res}` : "Imported!";
        }
    }
    class ModuleWardrobe extends BaseModule {
        load() {
            const { NMod } = detectOtherMods();
            hookFunction("AppearanceRun", 0, (args, next) => {
                next(args);
                if ((CharacterAppearanceMode === "Wardrobe" || NMod && AppearanceMode === "Wardrobe") && clipboardAvailable) {
                    const Y = NMod ? 265 : 125;
                    DrawButton(1457, Y, 50, 50, "", "White", j_WardrobeIncludeBinds ? "Icons/Checked.png" : "", "Include restraints");
                    DrawButton(1534, Y, 207, 50, "Export", "White", "");
                    DrawButton(1768, Y, 207, 50, "Import", "White", "");
                }
            });
            hookFunction("AppearanceClick", 0, (args, next) => {
                if ((CharacterAppearanceMode === "Wardrobe" || NMod && AppearanceMode === "Wardrobe") && clipboardAvailable) {
                    const Y = NMod ? 265 : 125;
                    // Restraints toggle
                    if (MouseIn(1457, Y, 50, 50)) {
                        j_WardrobeIncludeBinds = !j_WardrobeIncludeBinds;
                    }
                    // Export
                    if (MouseIn(1534, Y, 207, 50)) {
                        setTimeout(async () => {
                            await navigator.clipboard.writeText(j_WardrobeExportSelectionClothes(j_WardrobeIncludeBinds));
                            CharacterAppearanceWardrobeText = "Copied to clipboard!";
                        }, 0);
                        return;
                    }
                    // Import
                    if (MouseIn(1768, Y, 207, 50)) {
                        setTimeout(async () => {
                            if (typeof navigator.clipboard.readText !== "function") {
                                CharacterAppearanceWardrobeText = "Please press Ctrl+V";
                                return;
                            }
                            const data = await navigator.clipboard.readText();
                            const res = j_WardrobeImportSelectionClothes(data, j_WardrobeIncludeBinds, allowMode);
                            CharacterAppearanceWardrobeText = res !== true ? `Import error: ${res}` : "Imported!";
                        }, 0);
                        return;
                    }
                }
                next(args);
            });
            document.addEventListener("paste", PasteListener);
        }
        unload() {
            document.removeEventListener("paste", PasteListener);
        }
    }

    let allowMode = false;
    let developmentMode = false;
    let antigarble = 0;
    class ConsoleInterface {
        get isAllow() {
            return allowMode;
        }
        AllowCheats(allow) {
            if (typeof allow !== "boolean" && allow !== undefined) {
                return false;
            }
            if (allowMode === allow)
                return true;
            if (allow === undefined) {
                allow = !allowMode;
            }
            allowMode = allow;
            if (allow) {
                console.warn("Cheats enabled; please be careful not to break things");
            }
            else {
                this.Devel(false);
                console.info("Cheats disabled");
            }
            return true;
        }
        get isDevel() {
            return developmentMode;
        }
        Devel(devel) {
            if (typeof devel !== "boolean" && devel !== undefined) {
                return false;
            }
            if (developmentMode === devel)
                return true;
            if (devel === undefined) {
                devel = !developmentMode;
            }
            if (devel) {
                if (!this.AllowCheats(true)) {
                    console.info("To use developer mode, cheats must be enabled first!");
                    return false;
                }
                AssetGroup.forEach(G => G.Description = G.Name);
                Asset.forEach(A => A.Description = A.Group.Name + ":" + A.Name);
                BackgroundSelectionAll.forEach(B => {
                    B.Description = B.Name;
                    B.Low = B.Description.toLowerCase();
                });
                console.warn("Developer mode enabled");
            }
            else {
                AssetLoadDescription("Female3DCG");
                BackgroundSelectionAll.forEach(B => {
                    B.Description = DialogFindPlayer(B.Name);
                    B.Low = B.Description.toLowerCase();
                });
                console.info("Developer mode disabled");
            }
            developmentMode = devel;
            return true;
        }
        get antigarble() {
            return antigarble;
        }
        set antigarble(value) {
            if (![0, 1, 2].includes(value)) {
                throw new Error("Bad antigarble value, expected 0/1/2");
            }
            antigarble = value;
        }
        j_WardrobeExportSelectionClothes(includeBinds = false) {
            return j_WardrobeExportSelectionClothes(includeBinds);
        }
        j_WardrobeImportSelectionClothes(data, includeBinds, force = false) {
            return j_WardrobeImportSelectionClothes(data, includeBinds, force);
        }
        ToggleInvisibilityEarbuds() {
            return InvisibilityEarbuds();
        }
        Unload() {
            return unload();
        }
        get storage() {
            if (!developmentMode) {
                return "Development mode required";
            }
            return modStorage;
        }
    }
    const consoleInterface = Object.freeze(new ConsoleInterface());
    class ModuleConsole extends BaseModule {
        load() {
            window.bcx = consoleInterface;
            const { NMod } = detectOtherMods();
            patchFunction("ChatRoomMessage", NMod ? {
                "A.DynamicDescription(Source).toLowerCase()": `( bcx.isDevel ? A.Description : A.DynamicDescription(Source).toLowerCase() )`,
                "G.Description.toLowerCase()": `( bcx.isDevel ? G.Description : G.Description.toLowerCase() )`
            } : {
                "Asset[A].DynamicDescription(SourceCharacter || Player).toLowerCase()": `( bcx.isDevel ? Asset[A].Description : Asset[A].DynamicDescription(SourceCharacter || Player).toLowerCase() )`,
                "AssetGroup[A].Description.toLowerCase()": `( bcx.isDevel ? AssetGroup[A].Description : AssetGroup[A].Description.toLowerCase() )`
            });
            patchFunction("ExtendedItemDraw", {
                "DialogFindPlayer(DialogPrefix + Option.Name)": `( bcx.isDevel ? JSON.stringify(Option.Property.Type) : DialogFindPlayer(DialogPrefix + Option.Name) )`
            });
            hookFunction("DialogDrawItemMenu", 0, (args, next) => {
                if (developmentMode) {
                    DialogTextDefault = args[0].FocusGroup.Description;
                }
                return next(args);
            });
            patchFunction("DialogDrawPoseMenu", {
                '"Icons/Poses/" + PoseGroup[P].Name + ".png"': `"Icons/Poses/" + PoseGroup[P].Name + ".png", ( bcx.isDevel ? PoseGroup[P].Name : undefined )`
            });
            hookFunction("DialogDrawExpressionMenu", 0, (args, next) => {
                next(args);
                if (developmentMode) {
                    for (let I = 0; I < DialogFacialExpressions.length; I++) {
                        const FE = DialogFacialExpressions[I];
                        const OffsetY = 185 + 100 * I;
                        if (MouseIn(20, OffsetY, 90, 90)) {
                            DrawText(JSON.stringify(FE.Group), 300, 950, "White");
                        }
                        if (I === DialogFacialExpressionsSelected) {
                            for (let j = 0; j < FE.ExpressionList.length; j++) {
                                const EOffsetX = 155 + 100 * (j % 3);
                                const EOffsetY = 185 + 100 * Math.floor(j / 3);
                                if (MouseIn(EOffsetX, EOffsetY, 90, 90)) {
                                    DrawText(JSON.stringify(FE.ExpressionList[j]), 300, 950, "White");
                                }
                            }
                        }
                    }
                }
            });
            DialogSelfMenuOptions.forEach(opt => {
                if (opt.Name === "Pose") {
                    opt.IsAvailable = () => true;
                    opt.Draw = function () { return DialogDrawPoseMenu(); };
                }
                else if (opt.Name === "Expression") {
                    opt.Draw = function () { return DialogDrawExpressionMenu(); };
                }
            });
            hookFunction("SpeechGarble", 0, (args, next) => {
                if (antigarble === 2)
                    return args[1];
                let res = next(args);
                if (typeof res === "string" && res !== args[1] && antigarble === 1)
                    res += ` <> ${args[1]}`;
                return res;
            });
        }
        unload() {
            delete window.bcx;
        }
    }

    const commands = new Map();
    function registerCommand(name, description, callback, autocomplete = null) {
        name = name.toLocaleLowerCase();
        if (commands.has(name)) {
            throw new Error(`Command "${name}" already registered!`);
        }
        commands.set(name, {
            parse: false,
            callback,
            autocomplete,
            description
        });
    }
    function aliasCommand(originalName, alias) {
        originalName = originalName.toLocaleLowerCase();
        alias = alias.toLocaleLowerCase();
        const original = commands.get(originalName);
        if (!original) {
            throw new Error(`Command "${originalName}" to alias not found`);
        }
        if (original.parse) {
            commands.set(alias, {
                parse: true,
                description: null,
                callback: original.callback,
                autocomplete: original.autocomplete
            });
        }
        else {
            commands.set(alias, {
                parse: false,
                description: null,
                callback: original.callback,
                autocomplete: original.autocomplete
            });
        }
    }
    function registerCommandParsed(name, description, callback, autocomplete = null) {
        name = name.toLocaleLowerCase();
        if (commands.has(name)) {
            throw new Error(`Command "${name}" already registered!`);
        }
        commands.set(name, {
            parse: true,
            callback,
            autocomplete,
            description
        });
    }
    function CommandParse(msg) {
        msg = msg.trimStart();
        const commandMatch = /^(\S+)(?:\s|$)(.*)$/.exec(msg);
        if (!commandMatch) {
            return ["", ""];
        }
        return [(commandMatch[1] || "").toLocaleLowerCase(), commandMatch[2]];
    }
    function CommandParseArguments(args) {
        return [...args.matchAll(/".*?(?:"|$)|'.*?(?:'|$)|[^ ]+/g)]
            .map(a => a[0])
            .map(a => a[0] === '"' || a[0] === "'" ? a.substring(1, a[a.length - 1] === a[0] ? a.length - 1 : a.length) : a);
    }
    function CommandHasEmptyArgument(args) {
        const argv = CommandParseArguments(args);
        return argv.length === 0 || !args.endsWith(argv[argv.length - 1]);
    }
    function CommandQuoteArgument(arg) {
        if (arg.startsWith(`"`)) {
            return `'${arg}'`;
        }
        else if (arg.startsWith(`'`)) {
            return `"${arg}"`;
        }
        else if (arg.includes(" ")) {
            return arg.includes('"') ? `'${arg}'` : `"${arg}"`;
        }
        return arg;
    }
    function RunCommand(msg) {
        const [command, args] = CommandParse(msg);
        const commandInfo = commands.get(command);
        if (!commandInfo) {
            // Command not found
            ChatRoomSendLocal(`Unknown command "${command}"\n` +
                `To see list of valid commands whisper '!help'`, 15000);
            return false;
        }
        if (commandInfo.parse) {
            return commandInfo.callback(CommandParseArguments(args));
        }
        else {
            return commandInfo.callback(args);
        }
    }
    function CommandAutocomplete(msg) {
        msg = msg.trimStart();
        const [command, args] = CommandParse(msg);
        if (msg.length === command.length) {
            const prefixes = Array.from(commands.entries()).filter(c => c[1].description !== null && c[0].startsWith(command)).map(c => c[0] + " ");
            if (prefixes.length === 0)
                return msg;
            const best = longestCommonPrefix(prefixes);
            if (best === msg) {
                ChatRoomSendLocal(prefixes.slice().sort().join("\n"), 10000);
            }
            return best;
        }
        const commandInfo = commands.get(command);
        if (commandInfo && commandInfo.autocomplete) {
            if (commandInfo.parse) {
                const argv = CommandParseArguments(args);
                if (CommandHasEmptyArgument(args)) {
                    argv.push("");
                }
                const lastOptions = commandInfo.autocomplete(argv);
                if (lastOptions.length > 0) {
                    const best = longestCommonPrefix(lastOptions);
                    if (lastOptions.length > 1 && best === argv[argv.length - 1]) {
                        ChatRoomSendLocal(lastOptions.slice().sort().join("\n"), 10000);
                    }
                    argv[argv.length - 1] = best;
                }
                return `${command} ` +
                    argv.map(CommandQuoteArgument).join(" ") +
                    (lastOptions.length === 1 ? " " : "");
            }
            else {
                const possibleArgs = commandInfo.autocomplete(args);
                if (possibleArgs.length === 0) {
                    return msg;
                }
                const best = longestCommonPrefix(possibleArgs);
                if (possibleArgs.length > 1 && best === args) {
                    ChatRoomSendLocal(possibleArgs.slice().sort().join("\n"), 10000);
                }
                return `${command} ${best}`;
            }
        }
        return "";
    }
    function Command_selectCharacter(selector) {
        const characters = getAllCharactersInRoom();
        if (/^[0-9]+$/.test(selector)) {
            const MemberNumber = Number.parseInt(selector, 10);
            const target = characters.find(c => c.MemberNumber === MemberNumber);
            if (!target) {
                return `Player #${MemberNumber} not found in the room.`;
            }
            return target;
        }
        let targets = characters.filter(c => c.Name === selector);
        if (targets.length === 0)
            targets = characters.filter(c => c.Name.toLocaleLowerCase() === selector.toLocaleLowerCase());
        if (targets.length === 1) {
            return targets[0];
        }
        else if (targets.length === 0) {
            return `Player "${selector}" not found in the room.`;
        }
        else {
            return `Multiple players match "${selector}". Please use Member Number instead.`;
        }
    }
    function Command_selectCharacterAutocomplete(selector) {
        const characters = getAllCharactersInRoom();
        if (/^[0-9]+$/.test(selector)) {
            return characters.map(c => { var _a; return (_a = c.MemberNumber) === null || _a === void 0 ? void 0 : _a.toString(10); }).filter(n => n != null && n.startsWith(selector));
        }
        return characters.map(c => c.Name).filter(n => n.toLocaleLowerCase().startsWith(selector.toLocaleLowerCase()));
    }
    function Command_selectWornItem(character, selector) {
        const items = character.Character.Appearance.filter(isBind);
        let targets = items.filter(A => A.Asset.Group.Name.toLocaleLowerCase() === selector.toLocaleLowerCase());
        if (targets.length === 0)
            targets = items.filter(A => A.Asset.Group.Description.toLocaleLowerCase() === selector.toLocaleLowerCase());
        if (targets.length === 0)
            targets = items.filter(A => A.Asset.Name.toLocaleLowerCase() === selector.toLocaleLowerCase());
        if (targets.length === 0)
            targets = items.filter(A => A.Asset.Description.toLocaleLowerCase() === selector.toLocaleLowerCase());
        if (targets.length === 1) {
            return targets[0];
        }
        else if (targets.length === 0) {
            return `Item "${selector}" not found on character ${character}.`;
        }
        else {
            return `Multiple items match, please use group name instead. (eg. arms)`;
        }
    }
    function Command_selectWornItemAutocomplete(character, selector) {
        const items = character.Character.Appearance.filter(isBind);
        let possible = arrayUnique(items.map(A => A.Asset.Group.Description)
            .concat(items.map(A => A.Asset.Description))).filter(i => i.toLocaleLowerCase().startsWith(selector.toLocaleLowerCase()));
        if (possible.length === 0) {
            possible = arrayUnique(items.map(A => A.Asset.Group.Name)
                .concat(items.map(A => A.Asset.Name))).filter(i => i.toLocaleLowerCase().startsWith(selector.toLocaleLowerCase()));
        }
        return possible;
    }
    class ModuleCommands extends BaseModule {
        load() {
            hookFunction("ChatRoomSendChat", 10, (args, next) => {
                const chat = document.getElementById("InputChat");
                if (chat) {
                    const msg = chat.value.trim();
                    if (msg.startsWith("..")) {
                        chat.value = msg.substr(1);
                    }
                    else if (msg.startsWith(".")) {
                        if (RunCommand(msg.substr(1))) {
                            chat.value = "";
                        }
                        return;
                    }
                }
                return next(args);
            });
            hookFunction("ChatRoomKeyDown", 10, (args, next) => {
                const chat = document.getElementById("InputChat");
                // Tab for command completion
                if (KeyPress === 9 && chat && chat.value.startsWith(".") && !chat.value.startsWith("..")) {
                    event === null || event === void 0 ? void 0 : event.preventDefault();
                    chat.value = "." + CommandAutocomplete(chat.value.substr(1));
                }
                else {
                    return next(args);
                }
            });
            registerCommand("help", "- display this help [alias: . ]", () => {
                ChatRoomSendLocal(`Available commands:\n` +
                    Array.from(commands.entries())
                        .filter(c => c[1].description !== null)
                        .map(c => `.${c[0]}` + (c[1].description ? ` ${c[1].description}` : ""))
                        .sort()
                        .join("\n"));
                return true;
            });
            aliasCommand("help", "");
            registerCommand("action", "- send custom (action) [alias: .a ]", (msg) => {
                ChatRoomActionMessage(msg);
                return true;
            });
            aliasCommand("action", "a");
            const ANTIGARBLE_LEVELS = {
                "0": 0,
                "1": 1,
                "2": 2,
                "normal": 0,
                "both": 1,
                "ungarbled": 2
            };
            const ANTIGARBLE_LEVEL_NAMES = Object.keys(ANTIGARBLE_LEVELS).filter(k => k.length > 1);
            registerCommand("antigarble", "<level> - set garble prevention to show [normal|both|ungarbled] messages (only affects received messages!)", value => {
                const val = ANTIGARBLE_LEVELS[value || ""];
                if (val !== undefined) {
                    consoleInterface.antigarble = val;
                    ChatRoomSendLocal(`Antigarble set to ${ANTIGARBLE_LEVEL_NAMES[val]}`);
                    return true;
                }
                else {
                    ChatRoomSendLocal(`Invalid antigarble level; use ${ANTIGARBLE_LEVEL_NAMES.join("/")}`);
                    return false;
                }
            }, value => {
                return ANTIGARBLE_LEVEL_NAMES.filter(k => k.length > 1 && k.startsWith(value));
            });
        }
        unload() {
            commands.clear();
        }
    }

    function InvisibilityEarbuds() {
        var _a;
        if (((_a = InventoryGet(Player, "ItemEars")) === null || _a === void 0 ? void 0 : _a.Asset.Name) === "BluetoothEarbuds") {
            InventoryRemove(Player, "ItemEars");
        }
        else {
            const asset = Asset.find(A => A.Name === "BluetoothEarbuds");
            if (!asset)
                return;
            Player.Appearance = Player.Appearance.filter(A => A.Asset.Group.Name !== "ItemEars");
            Player.Appearance.push({
                Asset: asset,
                Color: "Default",
                Difficulty: -100,
                Property: {
                    Type: "Light",
                    Effect: [],
                    Hide: AssetGroup.map(A => A.Name).filter(A => A !== "ItemEars")
                }
            });
            CharacterRefresh(Player);
        }
        ChatRoomCharacterUpdate(Player);
    }
    class ModuleClubUtils extends BaseModule {
        load() {
            registerCommandParsed("colour", "<source> <item> <target> - Copies color of certain item from source character to target character", (argv) => {
                if (argv.length !== 3) {
                    ChatRoomSendLocal(`Expected three arguments: <source> <item> <target>`);
                    return false;
                }
                const source = Command_selectCharacter(argv[0]);
                if (typeof source === "string") {
                    ChatRoomSendLocal(source);
                    return false;
                }
                const target = Command_selectCharacter(argv[2]);
                if (typeof target === "string") {
                    ChatRoomSendLocal(target);
                    return false;
                }
                const item = Command_selectWornItem(source, argv[1]);
                if (typeof item === "string") {
                    ChatRoomSendLocal(item);
                    return false;
                }
                const targetItem = target.Character.Appearance.find(A => A.Asset === item.Asset);
                if (!targetItem) {
                    ChatRoomSendLocal(`Target must be wearing the same item`);
                    return false;
                }
                targetItem.Color = Array.isArray(item.Color) ? item.Color.slice() : item.Color;
                CharacterRefresh(target.Character);
                ChatRoomCharacterUpdate(target.Character);
                return true;
            }, (argv) => {
                if (argv.length === 1) {
                    return Command_selectCharacterAutocomplete(argv[0]);
                }
                else if (argv.length === 2) {
                    const source = Command_selectCharacter(argv[0]);
                    if (typeof source !== "string") {
                        return Command_selectWornItemAutocomplete(source, argv[1]);
                    }
                }
                else if (argv.length === 3) {
                    return Command_selectCharacterAutocomplete(argv[2]);
                }
                return [];
            });
            registerCommandParsed("allowactivities", "<character> <item> - Modifies item to not block activities", (argv) => {
                if (argv.length !== 2) {
                    ChatRoomSendLocal(`Expected two arguments: <charcater> <item>`);
                    return false;
                }
                const char = Command_selectCharacter(argv[0]);
                if (typeof char === "string") {
                    ChatRoomSendLocal(char);
                    return false;
                }
                const item = Command_selectWornItem(char, argv[1]);
                if (typeof item === "string") {
                    ChatRoomSendLocal(item);
                    return false;
                }
                if (!item.Property) {
                    item.Property = {};
                }
                item.Property.AllowActivityOn = AssetGroup.map(A => A.Name);
                CharacterRefresh(char.Character);
                ChatRoomCharacterUpdate(char.Character);
                return true;
            }, (argv) => {
                if (argv.length === 1) {
                    return Command_selectCharacterAutocomplete(argv[0]);
                }
                else if (argv.length === 2) {
                    const source = Command_selectCharacter(argv[0]);
                    if (typeof source !== "string") {
                        return Command_selectWornItemAutocomplete(source, argv[1]);
                    }
                }
                return [];
            });
        }
    }

    class GuiSubscreen {
        Load() {
            // Empty
        }
        Run() {
            // Empty
        }
        Click() {
            // Empty
        }
        Exit() {
            module_gui.currentSubscreen = null;
        }
        Unload() {
            // Empty
        }
        onChange(source) {
            // Empty
        }
    }

    const PER_PAGE_COUNT = 6;
    class GuiAuthorityPermissions extends GuiSubscreen {
        constructor(character) {
            super();
            this.permissionData = null;
            this.failed = false;
            this.permList = [];
            this.page = 0;
            this.character = character;
        }
        Load() {
            this.permissionData = null;
            this.rebuildList();
            this.character.getPermissions().then(res => {
                this.permissionData = res;
                this.rebuildList();
            }, err => {
                console.error(`BCX: Failed to get permission info for ${this.character}`, err);
                this.failed = true;
            });
        }
        rebuildList() {
            const categories = new Map();
            this.permList = [];
            this.page = 0;
            let Input = document.getElementById("BCX_PermissionsFilter");
            if (this.permissionData === null) {
                if (Input) {
                    Input.remove();
                }
                return;
            }
            if (!Input) {
                Input = ElementCreateInput("BCX_PermissionsFilter", "text", "", "30");
                Input.addEventListener("input", ev => {
                    this.rebuildList();
                });
            }
            const filter = Input.value.trim().toLocaleLowerCase().split(" ");
            for (const [k, v] of Object.entries(this.permissionData)) {
                let permdata = categories.get(v.category);
                if (filter.some(i => !MODULE_NAMES[v.category].toLocaleLowerCase().includes(i) &&
                    !v.name.toLocaleLowerCase().includes(i) &&
                    !k.toLocaleLowerCase().includes(i)))
                    continue;
                if (!permdata) {
                    categories.set(v.category, permdata = {});
                }
                permdata[k] = v;
            }
            for (const [category, data] of Array.from(categories.entries()).sort((a, b) => a[0] - b[0])) {
                this.permList.push({
                    separator: true,
                    name: MODULE_NAMES[category]
                });
                for (const [k, v] of Object.entries(data).sort((a, b) => a[1].name.localeCompare(b[1].name))) {
                    this.permList.push({
                        separator: false,
                        permission: k,
                        permissionInfo: v
                    });
                }
            }
        }
        Run() {
            var _a;
            if (this.permissionData !== null) {
                DrawText("Self is permitted", 1041, 235, "Black");
                DrawText("Lowest permitted role", 1370, 235, "Black");
                MainCanvas.beginPath();
                MainCanvas.moveTo(1335, 230);
                MainCanvas.lineTo(1335, 230 + 610);
                MainCanvas.stroke();
                // filter
                DrawText("Filter:", 130, 215, "Black");
                ElementPosition("BCX_PermissionsFilter", 550, 210, 600, 64);
                //reset button
                if ((_a = document.getElementById("BCX_PermissionsFilter")) === null || _a === void 0 ? void 0 : _a.value) {
                    DrawButton(870, 182, 64, 64, "", "White");
                    DrawTextFit("X", 889, 217, 54, "Black");
                }
                for (let off = 0; off < PER_PAGE_COUNT; off++) {
                    const i = this.page * PER_PAGE_COUNT + off;
                    if (i >= this.permList.length)
                        break;
                    const e = this.permList[i];
                    const Y = 275 + off * 100;
                    if (e.separator) {
                        // idea to highlight the section separator
                        MainCanvas.beginPath();
                        MainCanvas.rect(125, Y, 1173, 64);
                        MainCanvas.fillStyle = "#eeeeee";
                        MainCanvas.fill();
                        DrawText(`${e.name} module permissions`, 140, Y + 34, "Black");
                    }
                    else {
                        DrawImageEx(MODULE_ICONS[e.permissionInfo.category], 125, Y, {
                            Height: 64,
                            Width: 64
                        });
                        // Permission name
                        DrawButton(200, Y, 1000, 64, "", "White");
                        DrawTextFit(e.permissionInfo.name, 210, Y + 34, 990, "Black");
                        // Self checkbox
                        DrawButton(1235, Y, 64, 64, "", "White", e.permissionInfo.self ? "Icons/Checked.png" : "");
                        // Min access
                        DrawButton(1370, Y, 170, 64, "", "White");
                        MainCanvas.textAlign = "center";
                        DrawTextFit(capitalizeFirstLetter(AccessLevel[e.permissionInfo.min]), 1453, Y + 34, 150, "Black");
                        MainCanvas.textAlign = "left";
                    }
                }
                // Pagination
                const totalPages = Math.max(1, Math.ceil(this.permList.length / PER_PAGE_COUNT));
                MainCanvas.textAlign = "center";
                DrawBackNextButton(1605, 800, 300, 90, `${DialogFindPlayer("Page")} ${this.page + 1} / ${totalPages}`, "White", "", () => "", () => "");
                MainCanvas.textAlign = "left";
            }
            DrawText(`- Authority: Permission Settings for ${this.character.Name} (${this.character.isPlayer() ? "Self" : this.character.MemberNumber}) -`, 125, 125, "Black", "Gray");
            DrawButton(1815, 75, 90, 90, "", "White", "Icons/Exit.png");
            DrawButton(1815, 190, 90, 90, "", "White", icon_OwnerList);
        }
        Click() {
            if (MouseIn(1815, 75, 90, 90))
                return this.Exit();
            // Owner list
            if (MouseIn(815, 190, 90, 90)) {
                // TODO
            }
            if (this.permissionData !== null) {
                //reset button
                const elem = document.getElementById("BCX_PermissionsFilter");
                if (MouseIn(870, 182, 64, 64) && elem) {
                    elem.value = "";
                }
                for (let off = 0; off < PER_PAGE_COUNT; off++) {
                    const i = this.page * PER_PAGE_COUNT + off;
                    if (i >= this.permList.length)
                        break;
                    const e = this.permList[i];
                    const Y = 275 + i * 100;
                    if (!e.separator) {
                        // Permission name
                        if (MouseIn(200, Y, 1000, 64)) {
                            // TODO
                        }
                        // Self checkbox
                        if (MouseIn(1235, Y, 64, 64)) {
                            // TODO
                        }
                        // Min access
                        if (MouseIn(1370, Y, 170, 64)) {
                            // TODO
                        }
                    }
                }
                // Pagination
                const totalPages = Math.ceil(this.permList.length / PER_PAGE_COUNT);
                if (MouseIn(1455, 800, 150, 90)) {
                    this.page--;
                    if (this.page < 0) {
                        this.page = Math.max(totalPages - 1, 0);
                    }
                }
                else if (MouseIn(1605, 800, 150, 90)) {
                    this.page++;
                    if (this.page >= totalPages) {
                        this.page = 0;
                    }
                }
            }
        }
        Exit() {
            module_gui.currentSubscreen = new GuiMainMenu(this.character);
        }
        Unload() {
            ElementRemove("BCX_PermissionsFilter");
        }
    }

    const MAIN_MENU_ITEMS = [
        {
            module: ModuleCategory.Basic,
            onclick: () => null
        },
        {
            module: ModuleCategory.Authority,
            onclick: (C) => {
                module_gui.currentSubscreen = new GuiAuthorityPermissions(C);
            }
        },
        {
            module: ModuleCategory.Misc,
            onclick: () => null
        }
    ];
    class GuiMainMenu extends GuiSubscreen {
        constructor(character) {
            super();
            this.character = character;
        }
        Run() {
            DrawText("- Bondage Club Extended -", 125, 125, "Black", "Gray");
            DrawButton(1815, 75, 90, 90, "", "White", "Icons/Exit.png");
            for (let i = 0; i < MAIN_MENU_ITEMS.length; i++) {
                const e = MAIN_MENU_ITEMS[i];
                const PX = Math.floor(i / 7);
                const PY = i % 7;
                DrawButton(150 + 420 * PX, 160 + 110 * PY, 400, 90, "", "White", MODULE_ICONS[e.module]);
                DrawTextFit(MODULE_NAMES[e.module], 250 + 420 * PX, 205 + 110 * PY, 310, "Black");
            }
        }
        Click() {
            if (MouseIn(1815, 75, 90, 90))
                return this.Exit();
            for (let i = 0; i < MAIN_MENU_ITEMS.length; i++) {
                const e = MAIN_MENU_ITEMS[i];
                const PX = Math.floor(i / 7);
                const PY = i % 7;
                if (MouseIn(150 + 420 * PX, 160 + 110 * PY, 400, 90)) {
                    return e.onclick(this.character);
                }
            }
        }
    }

    class ModuleGUI extends BaseModule {
        constructor() {
            super(...arguments);
            this._currentSubscreen = null;
        }
        get currentSubscreen() {
            return this._currentSubscreen;
        }
        set currentSubscreen(subscreen) {
            if (this._currentSubscreen !== null) {
                this._currentSubscreen.Unload();
            }
            this._currentSubscreen = subscreen;
            if (this._currentSubscreen !== null) {
                this._currentSubscreen.Load();
            }
        }
        getInformationSheetCharacter() {
            const C = InformationSheetSelection;
            if (!C || typeof C.MemberNumber !== "number")
                return null;
            return getChatroomCharacter(C.MemberNumber);
        }
        init() {
            changeHandlers.push(source => {
                if (this._currentSubscreen) {
                    this._currentSubscreen.onChange(source);
                }
            });
        }
        load() {
            patchFunction("InformationSheetRun", {
                'DrawButton(1815, 765, 90, 90,': 'DrawButton(1815, 800, 90, 90,'
            });
            patchFunction("InformationSheetClick", {
                'MouseIn(1815, 765, 90, 90)': 'MouseIn(1815, 800, 90, 90)'
            });
            hookFunction("InformationSheetRun", 10, (args, next) => {
                if (this._currentSubscreen !== null) {
                    MainCanvas.textAlign = "left";
                    this._currentSubscreen.Run();
                    MainCanvas.textAlign = "center";
                    return;
                }
                next(args);
                const C = this.getInformationSheetCharacter();
                if (C) {
                    DrawButton(1815, 685, 90, 90, "", "White", icon_BCX, "BCX");
                }
            });
            hookFunction("InformationSheetClick", 10, (args, next) => {
                if (this._currentSubscreen !== null) {
                    return this._currentSubscreen.Click();
                }
                const C = this.getInformationSheetCharacter();
                if (C && MouseIn(1815, 685, 90, 90)) {
                    this.currentSubscreen = new GuiMainMenu(C);
                }
                else {
                    return next(args);
                }
            });
            hookFunction("InformationSheetExit", 10, (args, next) => {
                if (this._currentSubscreen !== null) {
                    return this._currentSubscreen.Exit();
                }
                return next(args);
            });
        }
        unload() {
            this.currentSubscreen = null;
        }
    }

    class ModuleMiscPatches extends BaseModule {
        constructor() {
            super(...arguments);
            this.o_Player_CanChange = null;
        }
        load() {
            hookFunction("AsylumEntranceCanWander", 0, () => true);
            patchFunction("CheatImport", { "MainCanvas == null": "true" });
            hookFunction("ElementIsScrolledToEnd", 0, (args) => {
                const element = document.getElementById(args[0]);
                return element != null && element.scrollHeight - element.scrollTop - element.clientHeight <= 1;
            });
            const { NMod } = detectOtherMods();
            if (!NMod) {
                patchFunction("LoginMistressItems", { 'LogQuery("ClubMistress", "Management")': "true" });
                patchFunction("LoginStableItems", { 'LogQuery("JoinedStable", "PonyExam") || LogQuery("JoinedStable", "TrainerExam")': "true" });
            }
            // Cheats
            this.o_Player_CanChange = Player.CanChange;
            Player.CanChange = () => { var _a; return allowMode || !!((_a = this.o_Player_CanChange) === null || _a === void 0 ? void 0 : _a.call(Player)); };
            hookFunction("ChatRoomCanLeave", 0, (args, next) => allowMode || next(args));
        }
        run() {
            CheatImport();
            LoginMistressItems();
            LoginStableItems();
            ServerPlayerInventorySync();
        }
        unload() {
            if (this.o_Player_CanChange) {
                Player.CanChange = this.o_Player_CanChange;
            }
        }
    }

    let nextCheckTimer = null;
    function sendVersionCheckBeep() {
        if (nextCheckTimer !== null) {
            clearTimeout(nextCheckTimer);
            nextCheckTimer = null;
        }
        sendHiddenBeep("versionCheck", {
            version: VERSION,
            UA: window.navigator.userAgent
        }, VERSION_CHECK_BOT, true);
        // Set check retry timer to 5 minutes
        nextCheckTimer = setTimeout(sendVersionCheckBeep, 5 * 60000);
    }
    class ModuleVersionCheck extends BaseModule {
        load() {
            hiddenBeepHandlers.set("versionResponse", (sender, message) => {
                if (sender !== VERSION_CHECK_BOT) {
                    console.warn(`BCX: got versionResponse from unexpected sender ${sender}, ignoring`);
                    return;
                }
                if (!isObject(message) || typeof message.status !== "string") {
                    console.warn(`BCX: bad versionResponse`, message);
                    return;
                }
                // Got valid version response, reset timer to 15 minutes
                if (nextCheckTimer !== null) {
                    clearTimeout(nextCheckTimer);
                }
                nextCheckTimer = setTimeout(sendVersionCheckBeep, 15 * 60000);
                if (message.status === "current") {
                    return;
                }
                else if (message.status === "newAvailable") {
                    // TODO
                }
                else if (message.status === "deprecated") {
                    // TODO
                }
                else if (message.status === "unsupported") {
                    // TODO
                }
                else {
                    console.warn(`BCX: bad versionResponse status "${message.status}"`);
                }
            });
        }
        run() {
            sendVersionCheckBeep();
        }
        unload() {
            if (nextCheckTimer !== null) {
                clearTimeout(nextCheckTimer);
                nextCheckTimer = null;
            }
        }
    }

    const module_authority = registerModule(new ModuleAuthority());
    const module_chatroom = registerModule(new ModuleChatroom());
    const module_clubUtils = registerModule(new ModuleClubUtils());
    const module_commands = registerModule(new ModuleCommands());
    const module_console = registerModule(new ModuleConsole());
    const module_gui = registerModule(new ModuleGUI());
    const module_messaging = registerModule(new ModuleMessaging());
    const module_miscPatches = registerModule(new ModuleMiscPatches());
    const module_storage = registerModule(new ModuleStorage());
    const module_versionCheck = registerModule(new ModuleVersionCheck());
    const module_wardrobe = registerModule(new ModuleWardrobe());

    async function initWait() {
        if (CurrentScreen == null || CurrentScreen === "Login") {
            hookFunction("LoginResponse", 0, (args, next) => {
                next(args);
                loginInit(args[0]);
            });
            InfoBeep(`BCX Ready!`);
        }
        else {
            init();
        }
    }
    initWait();

}());
//# sourceMappingURL=bcx.js.map
