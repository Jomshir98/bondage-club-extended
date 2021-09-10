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

    const GROUP_NAME_OVERRIDES = {
        "ItemNeckAccessories": "Collar Addon",
        "ItemNeckRestraints": "Collar Restraint",
        "ItemNipplesPiercings": "Nipple Piercing",
        "ItemHood": "Hood",
        "ItemMisc": "Miscellaneous",
        "ItemDevices": "Devices",
        "ItemHoodAddon": "Hood Addon",
        "ItemAddon": "General Addon",
        "ItemFeet": "Upper Leg",
        "ItemLegs": "Lower Leg",
        "ItemBoots": "Feet",
        "ItemMouth": "Mouth (1)",
        "ItemMouth2": "Mouth (2)",
        "ItemMouth3": "Mouth (3)"
    };
    let allowMode = false;
    let developmentMode = false;
    function setAllowMode(allow) {
        if (allow) {
            console.warn("Cheats enabled; please be careful not to break things");
        }
        else {
            if (!setDevelopmentMode(false))
                return false;
            console.info("Cheats disabled");
        }
        allowMode = allow;
        return true;
    }
    function setDevelopmentMode(devel) {
        if (devel) {
            if (!setAllowMode(true)) {
                console.info("To use developer mode, cheats must be enabled first!");
                return false;
            }
            window.BCX_Devel = true;
            AssetGroup.forEach(G => G.Description = G.Name);
            Asset.forEach(A => A.Description = A.Group.Name + ":" + A.Name);
            BackgroundSelectionAll.forEach(B => {
                B.Description = B.Name;
                B.Low = B.Description.toLowerCase();
            });
            console.warn("Developer mode enabled");
        }
        else {
            delete window.BCX_Devel;
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
    function getVisibleGroupName(group) {
        var _a;
        return developmentMode ? group.Name : ((_a = GROUP_NAME_OVERRIDES[group.Name]) !== null && _a !== void 0 ? _a : group.Description);
    }
    function InfoBeep(msg, timer = 3000) {
        console.log(`BCX msg: ${msg}`);
        ServerBeep = {
            Timer: Date.now() + timer,
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
        div.style.background = "#6e6eff54";
        div.style.margin = "0.15em 0";
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
            return div;
        }
        return null;
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
    function DrawImageEx(Source, X, Y, { Canvas = MainCanvas, Alpha = 1, SourcePos, Width, Height, Invert = false, Mirror = false, Zoom = 1 } = {}) {
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
    function getCharacterName(memberNumber, defaultText = null) {
        var _a;
        const character = ChatRoomCharacter.find(c => c.MemberNumber === memberNumber);
        if (character)
            return character.Name;
        const friendName = (_a = Player.FriendNames) === null || _a === void 0 ? void 0 : _a.get(memberNumber);
        if (friendName)
            return friendName;
        return defaultText;
    }
    function itemColorsEquals(color1, color2) {
        if (color1 == null) {
            color1 = "Default";
        }
        else if (Array.isArray(color1) && color1.length === 1) {
            color1 = color1[0];
        }
        if (color2 == null) {
            color2 = "Default";
        }
        else if (Array.isArray(color2) && color2.length === 1) {
            color2 = color2[0];
        }
        return (!Array.isArray(color1) || !Array.isArray(color2)) ? color1 === color2 : CommonArraysEqual(color1, color2);
    }

    const VERSION = "0.5.0";
    const VERSION_CHECK_BOT = 37685;
    const FUNCTION_HASHES = {
        ActivityOrgasmStart: ["5C3627D7", "1F7E8FF9"],
        AppearanceClick: ["48FA3705", "BA17EA90", "F0B11F43", "CCD4AC31"],
        AppearanceRun: ["904E8E84", "45C6BA53", "6D5EFEAA", "6DDA14A1"],
        AsylumEntranceCanWander: ["3F5F4041", "609FA096"],
        ChatRoomCanLeave: ["5BEE6F9D", "77FB6CF8"],
        ChatRoomClearAllElements: ["D1E1F8C3", "D9169281", "AFB1B3ED", "C49AA2C1"],
        ChatRoomCreateElement: ["4837C2F6", "6C4CCF41", "35D54383"],
        ChatRoomDrawCharacterOverlay: ["D58A9AD3"],
        ChatRoomFirstTimeHelp: ["078BEEA9"],
        ChatRoomKeyDown: ["5FD37EC9", "111B6F0C", "33C77F12"],
        ChatRoomMessage: ["2C6E4EC3", "4340BC41", "6026A4B6", "E3EE1C77"],
        ChatRoomSendChat: ["39B06D87", "9019F7EF", "D64CCA1D", "7F540ED0"],
        ChatRoomSync: ["B67D8226"],
        CheatFactor: ["594CFC45"],
        CheatImport: ["412422CC", "26C67608"],
        ColorPickerDraw: ["D1E82FB3"],
        DialogDrawExpressionMenu: ["EEFB3D22"],
        DialogDrawItemMenu: ["7B1D71E9", "0199F25B", "D832A940"],
        DialogDrawPoseMenu: ["4B146E82"],
        ElementIsScrolledToEnd: ["D28B0638"],
        ExtendedItemDraw: ["486A52DF", "9256549A", "45432E84", "455F5FDD"],
        FriendListLoadFriendList: ["72099AC9"],
        InfiltrationStealItems: ["1F601756"],
        InformationSheetClick: ["E535609B"],
        InformationSheetExit: ["75521907"],
        InformationSheetRun: ["58B7879C", "A8A56ACA"],
        LoginMistressItems: ["B58EF410"],
        LoginResponse: ["16C2C651", "FA9EFD03", "02E9D246", "548405C8", "4FE91547"],
        LoginStableItems: ["EA93FBF7"],
        MainHallWalk: ["E52553C4"],
        PrivateRansomStart: ["0E968EDD"],
        ServerAccountBeep: ["2D918B69"],
        SpeechGarble: ["1BC8E005", "15C3B50B", "9D669F73"],
        ValidationResolveModifyDiff: ["C2FE52D3"]
    };
    const FUNCTION_HASHES_NMOD = {
        ActivityOrgasmStart: ["1F7E8FF9"],
        AppearanceClick: ["B895612C"],
        AppearanceRun: ["791E142F"],
        AsylumEntranceCanWander: ["609FA096"],
        ChatRoomCanLeave: ["7EDA9A86"],
        ChatRoomClearAllElements: ["904C924D"],
        ChatRoomCreateElement: ["76299AEC"],
        ChatRoomDrawCharacterOverlay: ["1D912EBC"],
        ChatRoomFirstTimeHelp: ["078BEEA9"],
        ChatRoomDrawFriendList: ["327DA1B8"],
        ChatRoomKeyDown: ["977EC709"],
        ChatRoomMessage: ["8186C1DB"],
        ChatRoomSendChat: ["385B9E9C"],
        ChatRoomSync: ["2590802E"],
        CheatFactor: ["594CFC45"],
        CheatImport: ["1ECB0CC4"],
        ColorPickerDraw: ["FF93AF2E"],
        DialogDrawExpressionMenu: ["EEFB3D22"],
        DialogDrawItemMenu: ["05301080"],
        DialogDrawPoseMenu: ["4B146E82"],
        ElementIsScrolledToEnd: ["D28B0638"],
        ExtendedItemDraw: ["455F5FDD"],
        FriendListLoadFriendList: ["428B288B"],
        InfiltrationStealItems: ["1F601756"],
        InformationSheetClick: ["E535609B"],
        InformationSheetExit: ["75521907"],
        InformationSheetRun: ["19872251"],
        LoginMistressItems: ["984A6AD9"],
        LoginResponse: ["0EA3347D"],
        LoginStableItems: ["C3F50DD1"],
        MainHallWalk: ["E52553C4"],
        PrivateRansomStart: ["0E968EDD"],
        ServerAccountBeep: ["A6DFD3B9"],
        SpeechGarble: ["9D669F73"],
        ValidationResolveModifyDiff: ["C2FE52D3"]
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
    function isObject$1(obj) {
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
    /** Clamp number between two values */
    function clamp(value, min, max) {
        return Math.min(Math.max(value, min), max);
    }
    /** Formats time in ms into days, hours minutes and seconds */
    function formatTimeInterval(time) {
        let res = "";
        if (time < 0) {
            res = "-";
            time *= -1;
        }
        const seconds = Math.floor(time / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);
        if (days > 0) {
            res += `${days} days, `;
        }
        if (hours > 0) {
            res += `${hours % 24} hours, `;
        }
        if (minutes > 0) {
            res += `${minutes % 60} minutes, `;
        }
        if (seconds > 0) {
            res += `${seconds % 60} seconds`;
        }
        return res;
    }

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
            const hash = crc32(original.toString().replaceAll("\r\n", "\n"));
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
    function hookFunction(target, priority, hook, module = null) {
        const data = initPatchableFunction(target);
        if (data.hooks.some(h => h.hook === hook)) {
            console.error(`BCX: Duplicate hook for "${target}"`, hook);
            return;
        }
        data.hooks.push({
            hook,
            priority,
            module
        });
        data.hooks.sort((a, b) => b.priority - a.priority);
    }
    function removeHooksByModule(target, module) {
        const data = initPatchableFunction(target);
        for (let i = data.hooks.length - 1; i >= 0; i--) {
            if (data.hooks[i].module === module) {
                data.hooks.splice(i, 1);
            }
        }
        return true;
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
        load(preset) {
            // Empty
        }
        run() {
            // Empty
        }
        unload() {
            // Empty
        }
        reload(preset) {
            // Empty
        }
        applyPreset(preset) {
            // Empty
        }
    }

    var Preset;
    (function (Preset) {
        Preset[Preset["dominant"] = 0] = "dominant";
        Preset[Preset["switch"] = 1] = "switch";
        Preset[Preset["submissive"] = 2] = "submissive";
        Preset[Preset["slave"] = 3] = "slave";
    })(Preset || (Preset = {}));
    var ModuleCategory;
    (function (ModuleCategory) {
        ModuleCategory[ModuleCategory["Global"] = 0] = "Global";
        ModuleCategory[ModuleCategory["Authority"] = 1] = "Authority";
        ModuleCategory[ModuleCategory["Log"] = 2] = "Log";
        ModuleCategory[ModuleCategory["Curses"] = 3] = "Curses";
        ModuleCategory[ModuleCategory["Misc"] = 99] = "Misc";
    })(ModuleCategory || (ModuleCategory = {}));
    const MODULE_NAMES = {
        [ModuleCategory.Global]: "Global",
        [ModuleCategory.Authority]: "Authority",
        [ModuleCategory.Log]: "Behaviour Log",
        [ModuleCategory.Curses]: "Curses",
        [ModuleCategory.Misc]: "Miscellaneous"
    };
    const MODULE_ICONS = {
        [ModuleCategory.Global]: "Icons/General.png",
        [ModuleCategory.Authority]: "Icons/Security.png",
        [ModuleCategory.Log]: "Icons/Title.png",
        [ModuleCategory.Curses]: "Icons/Struggle.png",
        [ModuleCategory.Misc]: "Icons/Random.png"
    };
    const TOGGLEABLE_MODULES = [
        ModuleCategory.Log,
        ModuleCategory.Curses
    ];
    var MiscCheat;
    (function (MiscCheat) {
        MiscCheat[MiscCheat["BlockRandomEvents"] = 0] = "BlockRandomEvents";
        MiscCheat[MiscCheat["CantLoseMistress"] = 1] = "CantLoseMistress";
        MiscCheat[MiscCheat["GiveMistressKey"] = 2] = "GiveMistressKey";
        MiscCheat[MiscCheat["GivePandoraKey"] = 3] = "GivePandoraKey";
    })(MiscCheat || (MiscCheat = {}));
    var ConditionsLimit;
    (function (ConditionsLimit) {
        ConditionsLimit[ConditionsLimit["normal"] = 0] = "normal";
        ConditionsLimit[ConditionsLimit["limited"] = 1] = "limited";
        ConditionsLimit[ConditionsLimit["blocked"] = 2] = "blocked";
    })(ConditionsLimit || (ConditionsLimit = {}));

    const icon_ExternalLink = `data:image/svg+xml;base64,
PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiPz4NCjxzdmcgeG1sbnM9Imh0dHA6
Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHZpZXdCb3g9IjAg
MCAyMCAyMCI+DQogIDx0aXRsZT4NCiAgICBleHRlcm5hbCBsaW5rDQogIDwvdGl0bGU+DQogIDxw
YXRoIGQ9Ik0xNyAxN0gzVjNoNVYxSDNhMiAyIDAgMCAwLTIgMnYxNGEyIDIgMCAwIDAgMiAyaDE0
YTIgMiAwIDAgMCAyLTJ2LTVoLTJ6Ii8+DQogIDxwYXRoIGQ9Ik0xOSAxaC04bDMuMjkgMy4yOS01
LjczIDUuNzMgMS40MiAxLjQyIDUuNzMtNS43M0wxOSA5VjF6Ii8+DQo8L3N2Zz4NCg==
`.replaceAll("\n", "");
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
    const icon_BCX_chatroom = `data:image/png;base64,
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
rkJggg==
`.replaceAll("\n", "");
    const icon_BCX = `data:image/png;base64,
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
`.replaceAll("\n", "");
    const icon_OwnerList = `data:image/png;base64,
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
xBaQJfz/AJiiFen2ESExAAAAAElFTkSuQmCC
`.replaceAll("\n", "");

    class ChatRoomStatusManager {
        constructor() {
            this.InputTimeoutMs = 3000;
            this.StatusTypes = {
                None: "None",
                Typing: "Typing",
                Emote: "Emote",
                Whisper: "Whisper",
                DMS: "DMS",
                // NMod
                Action: "Action",
                Afk: 'Afk'
            };
            this.InputElement = null;
            this.InputTimeout = null;
            this.DMS = false;
            this.Status = this.StatusTypes.None;
        }
        GetCharacterStatus(C) {
            return C.ID === 0 ? ChatroomSM.Status : C.Status;
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
            if (!modStorage.typingIndicatorEnable) {
                type = this.StatusTypes.None;
            }
            if (this.DMS) {
                type = this.StatusTypes.DMS;
            }
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
            this.DMS = false;
            this.InputEnd();
        }
    }
    function DMSKeydown(ev) {
        if (ev.altKey && ev.code === "NumpadEnter") {
            ev.preventDefault();
            ev.stopImmediatePropagation();
            if (document.activeElement instanceof HTMLElement) {
                document.activeElement.blur();
            }
            ChatroomSM.DMS = true;
            ChatroomSM.SetStatus(ChatroomSM.StatusTypes.DMS);
        }
    }
    function DMSKeyup(ev) {
        if (ChatroomSM.DMS && (ev.key === "Alt" || ev.code === "NumpadEnter")) {
            ChatroomSM.DMS = false;
            ChatroomSM.SetStatus(ChatroomSM.StatusTypes.None);
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
            if (typeof modStorage.typingIndicatorEnable !== "boolean") {
                modStorage.typingIndicatorEnable = true;
            }
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
                    const Friend = C.ID === 0 || ((_a = Player.FriendList) !== null && _a !== void 0 ? _a : []).includes(C.MemberNumber);
                    if ((Char === null || Char === void 0 ? void 0 : Char.BCXVersion) && ChatRoomHideIconState === 0) {
                        DrawImageEx(Friend ? icon_PurpleHeart : icon_BCX_chatroom, CharX + 375 * Zoom, CharY, {
                            Width: 50 * Zoom,
                            Height: 50 * Zoom,
                            Alpha: Friend ? 1 : 0.5
                        });
                    }
                    else {
                        next(args);
                    }
                });
                patchFunction("ChatRoomDrawCharacterOverlay", {
                    'switch (C.Status)': 'switch (null)'
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
                    const Friend = C.ID === 0 || ((_a = Player.FriendList) !== null && _a !== void 0 ? _a : []).includes(C.MemberNumber);
                    if ((Char === null || Char === void 0 ? void 0 : Char.BCXVersion) && ChatRoomHideIconState === 0) {
                        DrawImageEx(Friend ? icon_PurpleHeart : icon_BCX_chatroom, CharX + 375 * Zoom, CharY, {
                            Width: 50 * Zoom,
                            Height: 50 * Zoom,
                            Alpha: Friend ? 1 : 0.7
                        });
                    }
                    else if (Friend && ChatRoomHideIconState === 0) {
                        DrawImageEx("Icons/Small/FriendList.png", CharX + 375 * Zoom, CharY, {
                            Width: 50 * Zoom,
                            Height: 50 * Zoom
                        });
                    }
                });
                hookFunction("ChatRoomCreateElement", 0, (args, next) => {
                    next(args);
                    ChatroomSM.SetInputElement(document.getElementById("InputChat"));
                });
            }
            hookFunction("ChatRoomDrawCharacterOverlay", 0, (args, next) => {
                next(args);
                const [C, CharX, CharY, Zoom] = args;
                switch (ChatroomSM.GetCharacterStatus(C)) {
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
                    case ChatroomSM.StatusTypes.DMS:
                        DrawRect(CharX + 380 * Zoom, CharY + 53 * Zoom, 40 * Zoom, 40 * Zoom, "White");
                        DrawImageEx("Icons/Import.png", CharX + 375 * Zoom, CharY + 50 * Zoom, {
                            Width: 50 * Zoom,
                            Height: 50 * Zoom
                        });
                        break;
                }
            });
            window.addEventListener("keydown", DMSKeydown);
            window.addEventListener("keyup", DMSKeyup);
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
            window.removeEventListener("keydown", DMSKeydown);
            window.removeEventListener("keyup", DMSKeyup);
        }
    }
    function announceSelf(request = false) {
        sendHiddenMessage("hello", {
            version: VERSION,
            request
        });
    }

    var StorageLocations;
    (function (StorageLocations) {
        StorageLocations[StorageLocations["OnlineSettings"] = 0] = "OnlineSettings";
        StorageLocations[StorageLocations["LocalStorage"] = 1] = "LocalStorage";
    })(StorageLocations || (StorageLocations = {}));
    let modStorage = {};
    let deletionPending = false;
    let firstTimeInit = false;
    let modStorageLocation = StorageLocations.OnlineSettings;
    function finalizeFirstTimeInit() {
        if (!firstTimeInit)
            return;
        firstTimeInit = false;
        modStorage.chatShouldDisplayFirstTimeHelp = true;
        modStorageSync();
        console.log("BCX: First time init finalized");
        announceSelf(true);
    }
    function getLocalStorageName() {
        return `BCX_${Player.MemberNumber}`;
    }
    function storageClearData() {
        delete Player.OnlineSettings.BCX;
        localStorage.removeItem(getLocalStorageName());
        if (typeof ServerAccountUpdate !== "undefined") {
            ServerAccountUpdate.QueueData({ OnlineSettings: Player.OnlineSettings }, true);
        }
        else {
            console.debug("BCX: Old sync method");
            ServerSend("AccountUpdate", { OnlineSettings: Player.OnlineSettings });
        }
    }
    function switchStorageLocation(location) {
        if (location !== StorageLocations.LocalStorage && location !== StorageLocations.OnlineSettings) {
            throw new Error(`Unknown storage location`);
        }
        if (modStorageLocation === location)
            return;
        console.info(`BCX: Switching storage location to: ${StorageLocations[location]}`);
        modStorageLocation = location;
        storageClearData();
        modStorageSync();
    }
    function modStorageSync() {
        if (moduleInitPhase !== 3 /* ready */ && moduleInitPhase !== 4 /* destroy */)
            return;
        if (deletionPending || firstTimeInit)
            return;
        if (!Player.OnlineSettings) {
            console.error("BCX: Player OnlineSettings not defined during storage sync!");
            return;
        }
        const serializedData = LZString.compressToBase64(JSON.stringify(modStorage));
        if (modStorageLocation === StorageLocations.OnlineSettings) {
            Player.OnlineSettings.BCX = serializedData;
            if (typeof ServerAccountUpdate !== "undefined") {
                ServerAccountUpdate.QueueData({ OnlineSettings: Player.OnlineSettings });
            }
            else {
                console.debug("BCX: Old sync method");
                ServerSend("AccountUpdate", { OnlineSettings: Player.OnlineSettings });
            }
        }
        else if (modStorageLocation === StorageLocations.LocalStorage) {
            localStorage.setItem(getLocalStorageName(), serializedData);
        }
        else {
            throw new Error(`Unknown StorageLocation`);
        }
    }
    function clearAllData() {
        deletionPending = true;
        storageClearData();
        sendHiddenBeep("clearData", true, VERSION_CHECK_BOT, true);
        setTimeout(() => {
            window.location.reload();
        }, 2000);
    }
    class ModuleStorage extends BaseModule {
        init() {
            var _a;
            let saved = null;
            saved = localStorage.getItem(getLocalStorageName());
            if (typeof saved === "string") {
                console.info(`BCX: Detected storage location: local storage`);
                modStorageLocation = StorageLocations.LocalStorage;
            }
            if (!saved) {
                saved = (_a = Player.OnlineSettings) === null || _a === void 0 ? void 0 : _a.BCX;
                modStorageLocation = StorageLocations.OnlineSettings;
            }
            if (typeof saved === "string") {
                try {
                    const storage = JSON.parse(LZString.decompressFromBase64(saved));
                    if (!isObject$1(storage)) {
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
                firstTimeInit = true;
            }
        }
        run() {
            modStorageSync();
        }
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
            return setAllowMode(allow);
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
            return setDevelopmentMode(devel);
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
        devGetCharacter(target) {
            if (!developmentMode || (target !== undefined && typeof target !== "number"))
                return false;
            if (target === undefined) {
                return getPlayerCharacter();
            }
            return getChatroomCharacter(target);
        }
        devSendQuery(target, query, data) {
            if (!developmentMode || typeof target !== "number" || typeof query !== "string")
                return false;
            sendQuery(query, data, target).then(result => {
                console.info(`Query ${query} to ${target} resolved:`, result);
            }, error => {
                console.warn(`Query ${query} to ${target} failed:`, error);
            });
            return true;
        }
        switchStorageLocation(location) {
            if (typeof location !== "number")
                return false;
            switchStorageLocation(location);
            return true;
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
                var _a;
                if (developmentMode) {
                    DialogTextDefault = ((_a = args[0].FocusGroup) === null || _a === void 0 ? void 0 : _a.Description) || "";
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
        run() {
            if (window.BCX_Devel) {
                setDevelopmentMode(true);
            }
        }
        unload() {
            delete window.bcx;
        }
    }

    const COMMAND_GENERIC_ERROR = `The command failed to execute, likely because you are lacking the permission to give it.`;
    const commands = new Map();
    const whisperCommands = new Map();
    let firstTimeHelp = null;
    function CommandsShowFirstTimeHelp() {
        if (!firstTimeHelp && modStorage.chatShouldDisplayFirstTimeHelp) {
            firstTimeHelp = ChatRoomSendLocal(`BCX also provides helpful chat commands.\n` +
                `All commands start with a dot ( . )\n` +
                `The commands also support auto-completion: While writing a command, press 'Tab' to try automatically completing the currently typed word.\n` +
                `Other club members can also use commands of your BCX, without needing BCX themselves. They will get a list of all commands they have permission using by whispering '!help' ( ! instead of . ) to you.\n` +
                `Note: Messages colored like this text can only be seen by you and no one else.\n` +
                `\n` +
                `To dismiss this message, write '.he' and press 'Tab' to complete it to '.help', which will show you list of available commands.`);
        }
    }
    function CommandsCompleteFirstTimeHelp() {
        if (modStorage.chatShouldDisplayFirstTimeHelp !== undefined) {
            delete modStorage.chatShouldDisplayFirstTimeHelp;
            modStorageSync();
        }
        if (firstTimeHelp) {
            firstTimeHelp.remove();
            firstTimeHelp = null;
        }
    }
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
    function registerWhisperCommand(name, description, callback, autocomplete = null, registerNormal = true) {
        name = name.toLocaleLowerCase();
        if (registerNormal) {
            registerCommandParsed(name, description, (argv) => { callback(argv, getPlayerCharacter(), (msg) => ChatRoomSendLocal(msg)); return true; }, autocomplete ? (argv) => autocomplete(argv, getPlayerCharacter()) : null);
        }
        if (whisperCommands.has(name)) {
            throw new Error(`Command "${name}" already registered!`);
        }
        whisperCommands.set(name, {
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
                `To see list of valid commands use '.help'`, 15000);
            return false;
        }
        if (commandInfo.parse) {
            return commandInfo.callback(CommandParseArguments(args));
        }
        else {
            return commandInfo.callback(args);
        }
    }
    function RunWhisperCommand(msg, sender, respond) {
        const [command, args] = CommandParse(msg);
        const commandInfo = whisperCommands.get(command);
        if (!commandInfo) {
            // Command not found
            respond(`Unknown command "${command}"\n` +
                `To see list of valid commands whisper '!help'`);
            return;
        }
        return commandInfo.callback(CommandParseArguments(args), sender, respond);
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
                ChatRoomSendLocal("[autocomplete hint]\n" + prefixes.slice().sort().join("\n"), 10000);
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
                        ChatRoomSendLocal("[autocomplete hint]\n" + lastOptions.slice().sort().join("\n"), 10000);
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
                    ChatRoomSendLocal("[autocomplete hint]\n" + possibleArgs.slice().sort().join("\n"), 10000);
                }
                return `${command} ${best}`;
            }
        }
        return "";
    }
    function WhisperCommandAutocomplete(msg, sender) {
        msg = msg.trimStart();
        const [command, args] = CommandParse(msg);
        if (msg.length === command.length) {
            const prefixes = Array.from(whisperCommands.entries()).filter(c => c[1].description !== null && c[0].startsWith(command)).map(c => c[0] + " ");
            if (prefixes.length === 0)
                return [msg, null];
            const best = longestCommonPrefix(prefixes);
            return [best, best === msg ? prefixes.slice().sort() : null];
        }
        const commandInfo = whisperCommands.get(command);
        if (commandInfo && commandInfo.autocomplete) {
            const argv = CommandParseArguments(args);
            if (CommandHasEmptyArgument(args)) {
                argv.push("");
            }
            const lastOptions = commandInfo.autocomplete(argv, sender);
            let opts = null;
            if (lastOptions.length > 0) {
                const best = longestCommonPrefix(lastOptions);
                if (lastOptions.length > 1 && best === argv[argv.length - 1]) {
                    opts = lastOptions.slice().sort();
                }
                argv[argv.length - 1] = best;
            }
            return [`${command} ` +
                    argv.map(CommandQuoteArgument).join(" ") +
                    (lastOptions.length === 1 ? " " : ""), opts];
        }
        return [msg, null];
    }
    function Command_fixExclamationMark(sender, text) {
        return sender.isPlayer() ? text.replace(/^!/gm, ".") : text;
    }
    function Command_pickAutocomplete(selector, options) {
        selector = selector.toLocaleLowerCase();
        return options.filter(o => o.startsWith(selector));
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
    function Command_selectCharacterMemberNumber(selector, allowNotPresent = true) {
        const character = Command_selectCharacter(selector);
        if (typeof character === "string" && allowNotPresent && /^[0-9]+$/.test(selector)) {
            return Number.parseInt(selector, 10);
        }
        return typeof character === "string" ? character : character.MemberNumber;
    }
    function Command_selectCharacterAutocomplete(selector) {
        const characters = getAllCharactersInRoom();
        if (/^[0-9]+$/.test(selector)) {
            return characters.map(c => { var _a; return (_a = c.MemberNumber) === null || _a === void 0 ? void 0 : _a.toString(10); }).filter(n => n != null && n.startsWith(selector));
        }
        return characters.map(c => c.Name).filter(n => n.toLocaleLowerCase().startsWith(selector.toLocaleLowerCase()));
    }
    function Command_selectWornItem(character, selector, filter = isBind) {
        const items = character.Character.Appearance.filter(filter);
        let targets = items.filter(A => A.Asset.Group.Name.toLocaleLowerCase() === selector.toLocaleLowerCase());
        if (targets.length === 0)
            targets = items.filter(A => getVisibleGroupName(A.Asset.Group).toLocaleLowerCase() === selector.toLocaleLowerCase());
        if (targets.length === 0)
            targets = items.filter(A => A.Asset.Name.toLocaleLowerCase() === selector.toLocaleLowerCase());
        if (targets.length === 0)
            targets = items.filter(A => A.Asset.Description.toLocaleLowerCase() === selector.toLocaleLowerCase());
        if (targets.length === 1) {
            return targets[0];
        }
        else if (targets.length === 0) {
            return `Item "${selector}" not found on character ${character}. If your item(group) consists of more than one word, please put it in quotes, such as "lower leg".`;
        }
        else {
            return `Multiple items match, please use group name instead. (eg. arms)`;
        }
    }
    function Command_selectWornItemAutocomplete(character, selector, filter = isBind) {
        const items = character.Character.Appearance.filter(filter);
        let possible = arrayUnique(items.map(A => getVisibleGroupName(A.Asset.Group))
            .concat(items.map(A => A.Asset.Description))).filter(i => i.toLocaleLowerCase().startsWith(selector.toLocaleLowerCase()));
        if (possible.length === 0) {
            possible = arrayUnique(items.map(A => A.Asset.Group.Name)
                .concat(items.map(A => A.Asset.Name))).filter(i => i.toLocaleLowerCase().startsWith(selector.toLocaleLowerCase()));
        }
        return possible;
    }
    function Command_selectGroup(selector, character, filter) {
        let targets = AssetGroup.filter(G => G.Name.toLocaleLowerCase() === selector.toLocaleLowerCase() && (!filter || filter(G)));
        if (targets.length === 0)
            targets = AssetGroup.filter(G => getVisibleGroupName(G).toLocaleLowerCase() === selector.toLocaleLowerCase() && (!filter || filter(G)));
        if (targets.length > 1) {
            return `Multiple groups match "${selector}", please report this as a bug.`;
        }
        else if (targets.length === 1) {
            return targets[0];
        }
        else if (character) {
            const item = Command_selectWornItem(character, selector, i => (!filter || filter(i.Asset.Group)));
            return typeof item === "string" ? item : item.Asset.Group;
        }
        else {
            return `Unknown group "${selector}".`;
        }
    }
    function Command_selectGroupAutocomplete(selector, character, filter) {
        const items = character ? character.Character.Appearance : [];
        let possible = arrayUnique(AssetGroup
            .filter(G => !filter || filter(G))
            .map(G => getVisibleGroupName(G))
            .concat(items
            .filter(A => !filter || filter(A.Asset.Group))
            .map(A => A.Asset.Description))).filter(i => i.toLocaleLowerCase().startsWith(selector.toLocaleLowerCase()));
        if (possible.length === 0) {
            possible = arrayUnique(AssetGroup
                .filter(G => !filter || filter(G))
                .map(G => G.Name)
                .concat(items
                .filter(A => !filter || filter(A.Asset.Group))
                .map(A => A.Asset.Name))).filter(i => i.toLocaleLowerCase().startsWith(selector.toLocaleLowerCase()));
        }
        return possible;
    }
    function Command_parseTime(selector) {
        const match = /^([0-9]+)([a-z]+)$/.exec(selector.toLocaleLowerCase());
        if (!match) {
            return `Unknown time format "${selector}", please use format 'number+unit' (e.g. 23h 30m)`;
        }
        const num = Number.parseInt(match[1], 10);
        const unit = match[2];
        if (["d", "day", "days"].includes(unit)) {
            return num * 24 * 60 * 60 * 1000;
        }
        else if (["h", "hour", "hours"].includes(unit)) {
            return num * 60 * 60 * 1000;
        }
        else if (["m", "min", "minute", "minutes"].includes(unit)) {
            return num * 60 * 1000;
        }
        else if (["s", "sec", "second", "seconds"].includes(unit)) {
            return num * 1000;
        }
        return `Unknown time unit "${unit}", please use one of:\n` +
            `d (day), h (hour), m (minute), s (second)`;
    }
    class ModuleCommands extends BaseModule {
        load() {
            hookFunction("ChatRoomFirstTimeHelp", 0, (args, next) => {
                next(args);
                CommandsShowFirstTimeHelp();
            });
            hookFunction("ChatRoomClearAllElements", 1, (args, next) => {
                firstTimeHelp = null;
                return next(args);
            });
            hookFunction("ChatRoomSendChat", 10, (args, next) => {
                const chat = document.getElementById("InputChat");
                if (chat && !firstTimeInit) {
                    const msg = chat.value.trim();
                    if (msg.startsWith("..")) {
                        chat.value = msg.substr(1);
                    }
                    else if (msg.startsWith(".")) {
                        if (RunCommand(msg.substr(1))) {
                            // Keeps the chat log in memory so it can be accessed with pageup/pagedown
                            ChatRoomLastMessage.push(msg);
                            ChatRoomLastMessageIndex = ChatRoomLastMessage.length;
                            chat.value = "";
                        }
                        return;
                    }
                }
                return next(args);
            });
            hookFunction("ChatRoomKeyDown", 10, (args, next) => {
                var _a, _b;
                const chat = document.getElementById("InputChat");
                // Tab for command completion
                if (KeyPress === 9 &&
                    chat &&
                    chat.value.startsWith(".") &&
                    !chat.value.startsWith("..") &&
                    !firstTimeInit) {
                    const e = (_a = args[0]) !== null && _a !== void 0 ? _a : event;
                    e === null || e === void 0 ? void 0 : e.preventDefault();
                    e === null || e === void 0 ? void 0 : e.stopImmediatePropagation();
                    chat.value = "." + CommandAutocomplete(chat.value.substr(1));
                }
                else if (KeyPress === 9 &&
                    ChatRoomTargetMemberNumber != null &&
                    chat &&
                    chat.value.startsWith("!") &&
                    !chat.value.startsWith("!!") &&
                    !firstTimeInit) {
                    const currentValue = chat.value;
                    const currentTarget = ChatRoomTargetMemberNumber;
                    const e = (_b = args[0]) !== null && _b !== void 0 ? _b : event;
                    e === null || e === void 0 ? void 0 : e.preventDefault();
                    e === null || e === void 0 ? void 0 : e.stopImmediatePropagation();
                    sendQuery("commandHint", currentValue, currentTarget).then(result => {
                        if (chat.value !== currentValue || ChatRoomTargetMemberNumber !== currentTarget)
                            return;
                        if (!Array.isArray(result) ||
                            result.length !== 2 ||
                            typeof result[0] !== "string" ||
                            (result[1] !== null &&
                                (!Array.isArray(result[1]) ||
                                    result[1].some(i => typeof i !== "string")))) {
                            throw new Error("Bad data");
                        }
                        chat.value = result[0];
                        if (result[1]) {
                            ChatRoomSendLocal(`[remote autocomplete hint]\n` + result[1].join('\n'), 10000, currentTarget);
                        }
                    }, () => { });
                }
                else {
                    return next(args);
                }
            });
            hookFunction("ChatRoomMessage", 9, (args, next) => {
                const data = args[0];
                const sender = typeof data.Sender === "number" && getChatroomCharacter(data.Sender);
                if ((data === null || data === void 0 ? void 0 : data.Type) === "Whisper" &&
                    typeof data.Content === "string" &&
                    data.Content.startsWith("!") &&
                    !data.Content.startsWith("!!") &&
                    sender &&
                    sender.hasAccessToPlayer()) {
                    if (data.Sender === Player.MemberNumber || firstTimeInit)
                        return next(args);
                    console.debug(`BCX: Console command from ${sender}: ${data.Content}`);
                    RunWhisperCommand(data.Content.substr(1), sender, (msg) => {
                        ServerSend("ChatRoomChat", {
                            Content: `[BCX]\n${msg}`,
                            Type: "Whisper",
                            Target: sender.MemberNumber
                        });
                    });
                    return;
                }
                return next(args);
            });
            queryHandlers.commandHint = (sender, resolve, data) => {
                if (typeof data !== "string" || !data.startsWith("!") || data.startsWith("!!")) {
                    return resolve(false);
                }
                const result = WhisperCommandAutocomplete(data.substr(1), sender);
                result[0] = '!' + result[0];
                resolve(true, result);
            };
            registerCommand("help", "- display this help [alias: . ]", () => {
                CommandsCompleteFirstTimeHelp();
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
            registerWhisperCommand("help", "- display this help", (argv, sender, respond) => {
                respond(`Available commands:\n` +
                    Array.from(whisperCommands.entries())
                        .filter(c => c[1].description !== null)
                        .map(c => `!${c[0]}` + (c[1].description ? ` ${c[1].description}` : ""))
                        .sort()
                        .join("\n"));
                return true;
            }, null, false);
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

    const LOG_ENTRIES_LIMIT = 256;
    var LogEntryType;
    (function (LogEntryType) {
        LogEntryType[LogEntryType["plaintext"] = 0] = "plaintext";
        LogEntryType[LogEntryType["deleted"] = 1] = "deleted";
    })(LogEntryType || (LogEntryType = {}));
    var LogAccessLevel;
    (function (LogAccessLevel) {
        LogAccessLevel[LogAccessLevel["none"] = 0] = "none";
        LogAccessLevel[LogAccessLevel["protected"] = 1] = "protected";
        LogAccessLevel[LogAccessLevel["normal"] = 2] = "normal";
        LogAccessLevel[LogAccessLevel["everyone"] = 3] = "everyone";
    })(LogAccessLevel || (LogAccessLevel = {}));
    function logMessage(category, type, data) {
        var _a;
        if (!moduleIsEnabled(ModuleCategory.Log))
            return;
        const access = (_a = modStorage.logConfig) === null || _a === void 0 ? void 0 : _a[category];
        if (access === undefined) {
            throw new Error(`Attempt to log message with unknown category "${category}"`);
        }
        if (access > LogAccessLevel.none) {
            logMessageAdd(access, type, data);
        }
    }
    function logMessageAdd(access, type, data) {
        if (!moduleIsEnabled(ModuleCategory.Log))
            return;
        if (!modStorage.log) {
            throw new Error("Mod storage log not initialized");
        }
        modStorage.log.unshift([Date.now(), access, type, data]);
        // Time must me unique
        if (modStorage.log.length >= 2 && modStorage.log[0][0] <= modStorage.log[1][0]) {
            modStorage.log[0][0] = modStorage.log[1][0] + 1;
        }
        modStorage.log.splice(LOG_ENTRIES_LIMIT);
        modStorageSync();
        notifyOfChange();
    }
    function logMessageDelete(time, character) {
        var _a;
        if (!moduleIsEnabled(ModuleCategory.Log))
            return false;
        if (character && !checkPermissionAccess("log_delete", character)) {
            return false;
        }
        const access = (_a = modStorage.logConfig) === null || _a === void 0 ? void 0 : _a.log_deleted;
        if (access === undefined) {
            throw new Error("log_deleted category not found");
        }
        if (!modStorage.log) {
            throw new Error("Mod storage log not initialized");
        }
        for (let i = 0; i < modStorage.log.length; i++) {
            const e = modStorage.log[i];
            if (e[0] === time) {
                if (access === LogAccessLevel.none) {
                    modStorage.log.splice(i, 1);
                }
                else {
                    e[1] = access;
                    e[2] = LogEntryType.deleted;
                    e[3] = null;
                }
                modStorageSync();
                notifyOfChange();
                return true;
            }
        }
        return false;
    }
    function logConfigSet(category, accessLevel, character) {
        var _a;
        if (!moduleIsEnabled(ModuleCategory.Log))
            return false;
        if (character && !checkPermissionAccess("log_configure", character)) {
            return false;
        }
        if (((_a = modStorage.logConfig) === null || _a === void 0 ? void 0 : _a[category]) === undefined) {
            return false;
        }
        if (![LogAccessLevel.none, LogAccessLevel.normal, LogAccessLevel.protected].includes(accessLevel)) {
            return false;
        }
        if (character) {
            const msg = `${character} changed log configuration "${LOG_CONFIG_NAMES[category]}" ` +
                `from "${LOG_LEVEL_NAMES[modStorage.logConfig[category]]}" to "${LOG_LEVEL_NAMES[accessLevel]}"`;
            logMessage("log_config_change", LogEntryType.plaintext, msg);
            if (!character.isPlayer()) {
                ChatRoomSendLocal(msg, undefined, character.MemberNumber);
            }
        }
        modStorage.logConfig[category] = accessLevel;
        modStorageSync();
        notifyOfChange();
        return true;
    }
    function logClear(character) {
        if (!moduleIsEnabled(ModuleCategory.Log))
            return false;
        if (character && !checkPermissionAccess("log_delete", character)) {
            return false;
        }
        modStorage.log = [];
        logMessageAdd(LogAccessLevel.everyone, LogEntryType.plaintext, "The log has been cleared");
        return true;
    }
    function getVisibleLogEntries(character) {
        if (!moduleIsEnabled(ModuleCategory.Log))
            return [];
        if (!modStorage.log) {
            throw new Error("Mod storage log not initialized");
        }
        const allow = {
            [LogAccessLevel.none]: character.isPlayer(),
            [LogAccessLevel.normal]: checkPermissionAccess("log_view_normal", character),
            [LogAccessLevel.protected]: checkPermissionAccess("log_view_protected", character),
            [LogAccessLevel.everyone]: true
        };
        return modStorage.log.filter(e => allow[e[1]]);
    }
    function logMessageRender(entry) {
        if (entry[2] === LogEntryType.plaintext) {
            const e = entry;
            return e[3];
        }
        else if (entry[2] === LogEntryType.deleted) {
            return "[Log message deleted]";
        }
        return `[ERROR: Unknown entry type ${entry[2]}]`;
    }
    const alreadyPraisedBy = new Set();
    function logGetAllowedActions(character) {
        var _a;
        return {
            configure: checkPermissionAccess("log_configure", character),
            delete: checkPermissionAccess("log_delete", character),
            leaveMessage: checkPermissionAccess("log_add_note", character) && !!((_a = modStorage.logConfig) === null || _a === void 0 ? void 0 : _a.user_note),
            praise: checkPermissionAccess("log_praise", character) && !alreadyPraisedBy.has(character.MemberNumber)
        };
    }
    function logGetConfig() {
        if (!moduleIsEnabled(ModuleCategory.Log))
            return {};
        if (!modStorage.logConfig) {
            throw new Error("Mod storage log not initialized");
        }
        return { ...modStorage.logConfig };
    }
    function logPraise(value, message, character) {
        if (!moduleIsEnabled(ModuleCategory.Log))
            return false;
        if (![-1, 0, 1].includes(value)) {
            throw new Error("Invalid value");
        }
        if (value === 0 && !message)
            return false;
        const allowed = logGetAllowedActions(character);
        if (value !== 0 && !allowed.praise)
            return false;
        if (message && !allowed.leaveMessage)
            return false;
        if (value !== 0) {
            alreadyPraisedBy.add(character.MemberNumber);
        }
        if (value > 0) {
            if (message) {
                logMessage("user_note", LogEntryType.plaintext, `Praised by ${character} with note: ${message}`);
            }
            else {
                logMessage("praise", LogEntryType.plaintext, `Praised by ${character}`);
            }
        }
        else if (value < 0) {
            if (message) {
                logMessage("user_note", LogEntryType.plaintext, `Scolded by ${character} with note: ${message}`);
            }
            else {
                logMessage("praise", LogEntryType.plaintext, `Scolded by ${character}`);
            }
        }
        else if (message) {
            logMessage("user_note", LogEntryType.plaintext, `${character} attached a note: ${message}`);
        }
        return true;
    }
    const logConfigDefaults = {
        log_config_change: LogAccessLevel.protected,
        log_deleted: LogAccessLevel.normal,
        praise: LogAccessLevel.normal,
        user_note: LogAccessLevel.normal,
        entered_public_room: LogAccessLevel.none,
        entered_private_room: LogAccessLevel.none,
        had_orgasm: LogAccessLevel.none,
        permission_change: LogAccessLevel.protected,
        curse_change: LogAccessLevel.none,
        curse_trigger: LogAccessLevel.none,
        authority_roles_change: LogAccessLevel.protected
    };
    const LOG_CONFIG_NAMES = {
        log_config_change: "Log changes in logging configuration",
        log_deleted: "Log deleted log entries",
        praise: "Log praising or scolding behavior",
        user_note: "Ability to see attached notes",
        entered_public_room: "Log which public rooms are entered",
        entered_private_room: "Log which private rooms are entered",
        had_orgasm: "Log each single orgasm",
        permission_change: "Log changes in permission settings",
        curse_change: "Log each application or removal of curses",
        curse_trigger: "Log every time a triggered curse reapplies an item",
        authority_roles_change: "Log getting or losing a BCX owner/mistress"
    };
    const LOG_LEVEL_NAMES = {
        [LogAccessLevel.everyone]: "[ERROR]",
        [LogAccessLevel.none]: "No",
        [LogAccessLevel.protected]: "Protected",
        [LogAccessLevel.normal]: "Yes"
    };
    class ModuleLog extends BaseModule {
        init() {
            registerPermission("log_view_normal", {
                name: "Allow to see normal log entries",
                category: ModuleCategory.Log,
                defaults: {
                    [Preset.dominant]: [true, AccessLevel.mistress],
                    [Preset.switch]: [true, AccessLevel.mistress],
                    [Preset.submissive]: [true, AccessLevel.friend],
                    [Preset.slave]: [true, AccessLevel.public]
                }
            });
            registerPermission("log_view_protected", {
                name: "Allow to see protected log entries",
                category: ModuleCategory.Log,
                defaults: {
                    [Preset.dominant]: [true, AccessLevel.lover],
                    [Preset.switch]: [true, AccessLevel.lover],
                    [Preset.submissive]: [true, AccessLevel.mistress],
                    [Preset.slave]: [true, AccessLevel.mistress]
                }
            });
            registerPermission("log_configure", {
                name: "Allow to configure what is logged",
                category: ModuleCategory.Log,
                defaults: {
                    [Preset.dominant]: [true, AccessLevel.self],
                    [Preset.switch]: [true, AccessLevel.self],
                    [Preset.submissive]: [true, AccessLevel.owner],
                    [Preset.slave]: [false, AccessLevel.owner]
                }
            });
            registerPermission("log_delete", {
                name: "Allow deleting log entries",
                category: ModuleCategory.Log,
                defaults: {
                    [Preset.dominant]: [true, AccessLevel.self],
                    [Preset.switch]: [true, AccessLevel.self],
                    [Preset.submissive]: [true, AccessLevel.owner],
                    [Preset.slave]: [false, AccessLevel.owner]
                }
            });
            registerPermission("log_praise", {
                name: "Allow to praise or scold",
                category: ModuleCategory.Log,
                defaults: {
                    [Preset.dominant]: [false, AccessLevel.friend],
                    [Preset.switch]: [false, AccessLevel.friend],
                    [Preset.submissive]: [false, AccessLevel.public],
                    [Preset.slave]: [false, AccessLevel.public]
                }
            });
            registerPermission("log_add_note", {
                name: "Allow to attach notes to the body",
                category: ModuleCategory.Log,
                defaults: {
                    [Preset.dominant]: [false, AccessLevel.mistress],
                    [Preset.switch]: [false, AccessLevel.mistress],
                    [Preset.submissive]: [false, AccessLevel.friend],
                    [Preset.slave]: [false, AccessLevel.public]
                }
            });
            queryHandlers.logData = (sender, resolve) => {
                resolve(true, getVisibleLogEntries(sender));
            };
            queryHandlers.logDelete = (sender, resolve, data) => {
                if (typeof data === "number") {
                    resolve(true, logMessageDelete(data, sender));
                }
                else {
                    resolve(false);
                }
            };
            queryHandlers.logConfigGet = (sender, resolve) => {
                if (checkPermissionAccess("log_configure", sender)) {
                    resolve(true, logGetConfig());
                }
                else {
                    resolve(false);
                }
            };
            queryHandlers.logConfigEdit = (sender, resolve, data) => {
                if (!isObject$1(data) ||
                    typeof data.category !== "string" ||
                    typeof data.target !== "number") {
                    console.warn(`BCX: Bad logConfigEdit query from ${sender}`, data);
                    return resolve(false);
                }
                resolve(true, logConfigSet(data.category, data.target, sender));
            };
            queryHandlers.logClear = (sender, resolve) => {
                resolve(true, logClear(sender));
            };
            queryHandlers.logPraise = (sender, resolve, data) => {
                if (!isObject$1(data) ||
                    (data.message !== null && typeof data.message !== "string") ||
                    ![-1, 0, 1].includes(data.value)) {
                    console.warn(`BCX: Bad logPraise query from ${sender}`, data);
                    return resolve(false);
                }
                resolve(true, logPraise(data.value, data.message, sender));
            };
            queryHandlers.logGetAllowedActions = (sender, resolve) => {
                resolve(true, logGetAllowedActions(sender));
            };
            registerWhisperCommand("log", "- Manage the behaviour log", (argv, sender, respond) => {
                const subcommand = (argv[0] || "").toLocaleLowerCase();
                if (subcommand === "list") {
                    const logEntries = getVisibleLogEntries(sender);
                    const totalPages = Math.ceil(logEntries.length / 5);
                    const page = clamp(Number.parseInt(argv[1] || "", 10) || 1, 1, totalPages);
                    let result = `Page ${page} / ${totalPages}:`;
                    for (let i = 5 * (page - 1); i < Math.min(5 * page, logEntries.length); i++) {
                        const entry = logEntries[i];
                        const time = new Date(entry[0]);
                        result += `\n[${time.toUTCString()}] (${entry[0]})\n  ${logMessageRender(entry)}`;
                    }
                    respond(result);
                }
                else if (subcommand === "delete") {
                    if (!/^[0-9]+$/.test(argv[1] || "")) {
                        return respond(`Expected number as timestamp.`);
                    }
                    const timestamp = Number.parseInt(argv[1], 10);
                    if (!getVisibleLogEntries(sender).some(logentry => logentry[0] === timestamp)) {
                        return respond(`No such log entry found`);
                    }
                    respond(logMessageDelete(timestamp, sender) ? `Ok.` : COMMAND_GENERIC_ERROR);
                }
                else if (subcommand === "config") {
                    if (!checkPermissionAccess("log_configure", sender)) {
                        return respond(COMMAND_GENERIC_ERROR);
                    }
                    const category = argv[1] || "";
                    const config = logGetConfig();
                    if (!category) {
                        let result = "Current log config:";
                        for (const [k, v] of Object.entries(config)) {
                            if (LOG_CONFIG_NAMES[k] !== undefined &&
                                LOG_LEVEL_NAMES[v] !== undefined) {
                                result += `\n[${k}]\n  ${LOG_CONFIG_NAMES[k]}: ${LOG_LEVEL_NAMES[v]}`;
                            }
                        }
                        return respond(result);
                    }
                    else if (LOG_CONFIG_NAMES[category] === undefined) {
                        return respond(`Unknown category "${category}".`);
                    }
                    else {
                        const level = (argv[2] || "").toLocaleLowerCase();
                        if (level !== "yes" && level !== "protected" && level !== "no") {
                            return respond(`Expected level to be one of:\nno, protected, yes`);
                        }
                        return respond(logConfigSet(category, level === "yes" ? LogAccessLevel.normal : level === "protected" ? LogAccessLevel.protected : LogAccessLevel.none, sender) ? `Ok.` : COMMAND_GENERIC_ERROR);
                    }
                }
                else {
                    respond(Command_fixExclamationMark(sender, `!log usage:\n` +
                        `!log list [page] - List all visible logs\n` +
                        `!log delete <timestamp> - Deletes the log with the given <timestamp> (the number in parentheses in list)\n` +
                        `!log config - Shows the current logging settings for ${Player.Name}\n` +
                        `!log config <category> <no|protected|yes> - Sets visibility of the given config <category>`));
                }
            }, (argv, sender) => {
                if (argv.length <= 1) {
                    const c = argv[0].toLocaleLowerCase();
                    return ["list", "delete", "config"].filter(i => i.startsWith(c));
                }
                const subcommand = argv[0].toLocaleLowerCase();
                if (subcommand === "delete") {
                    if (argv.length === 2) {
                        return getVisibleLogEntries(sender).map(logentry => logentry[0].toString()).filter(i => i.startsWith(argv[1]));
                    }
                }
                else if (subcommand === "config") {
                    if (!checkPermissionAccess("log_configure", sender)) {
                        return [];
                    }
                    if (argv.length === 2) {
                        return Object.keys(logGetConfig()).concat("").filter(i => i.startsWith(argv[1].toLocaleLowerCase()));
                    }
                    else if (argv.length === 3) {
                        return ["no", "protected", "yes"].filter(i => i.startsWith(argv[2].toLocaleLowerCase()));
                    }
                }
                return [];
            });
        }
        load() {
            if (!moduleIsEnabled(ModuleCategory.Log)) {
                delete modStorage.log;
                delete modStorage.logConfig;
                removeHooksByModule("ActivityOrgasmStart", ModuleCategory.Log);
                removeHooksByModule("ChatRoomSync", ModuleCategory.Log);
                return;
            }
            if (!Array.isArray(modStorage.log)) {
                logClear(null);
            }
            else if (!modStorage.log.every(e => Array.isArray(e) &&
                e.length === 4 &&
                typeof e[0] === "number" &&
                typeof e[1] === "number" &&
                typeof e[2] === "number")) {
                console.error("BCX: Some log entries have invalid format, reseting whole log!");
                logClear(null);
            }
            if (!modStorage.logConfig) {
                modStorage.logConfig = { ...logConfigDefaults };
            }
            else {
                const transitionDictionary = {
                    permissionChange: "permission_change",
                    logConfigChange: "log_config_change",
                    logDeleted: "log_deleted",
                    userNote: "user_note",
                    curseChange: "curse_change",
                    curseTrigger: "curse_trigger",
                    hadOrgasm: "had_orgasm",
                    enteredPublicRoom: "entered_public_room",
                    enteredPrivateRoom: "entered_private_room",
                    ownershipChangesBCX: "authority_roles_change"
                };
                for (const k of Object.keys(modStorage.logConfig)) {
                    if (transitionDictionary[k] !== undefined) {
                        console.info(`BCX: Updating log config name "${k}"->"${transitionDictionary[k]}"`);
                        modStorage.logConfig[transitionDictionary[k]] = modStorage.logConfig[k];
                        delete modStorage.logConfig[k];
                        continue;
                    }
                    if (logConfigDefaults[k] === undefined) {
                        console.info(`BCX: Removing unknown log config category "${k}"`);
                        delete modStorage.logConfig[k];
                    }
                }
                for (const k of Object.keys(logConfigDefaults)) {
                    if (modStorage.logConfig[k] === undefined) {
                        console.info(`BCX: Adding missing log category "${k}"`);
                        modStorage.logConfig[k] = logConfigDefaults[k];
                    }
                }
            }
            hookFunction("ActivityOrgasmStart", 0, (args, next) => {
                const C = args[0];
                if (C.ID === 0 && (typeof ActivityOrgasmRuined === "undefined" || !ActivityOrgasmRuined)) {
                    logMessage("had_orgasm", LogEntryType.plaintext, `${Player.Name} had an orgasm`);
                }
                return next(args);
            }, ModuleCategory.Log);
            hookFunction("ChatRoomSync", 0, (args, next) => {
                const data = args[0];
                if (data.Private) {
                    logMessage("entered_private_room", LogEntryType.plaintext, `${Player.Name} entered private room "${data.Name}"`);
                }
                else {
                    logMessage("entered_public_room", LogEntryType.plaintext, `${Player.Name} entered public room "${data.Name}"`);
                }
                return next(args);
            }, ModuleCategory.Log);
        }
        reload() {
            this.load();
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
        for (const [k, v] of Object.entries(data.defaults)) {
            if (v[1] === AccessLevel.self && !v[0]) {
                console.error(`BCX: register permission "${name}": default for ${k} has invalid self value`);
            }
        }
        permissions.set(name, {
            ...data,
            self: data.defaults[Preset.switch][0],
            min: data.defaults[Preset.switch][1]
        });
    }
    function getCharacterAccessLevel(character) {
        var _a, _b, _c;
        if (character.isPlayer())
            return AccessLevel.self;
        if (character.MemberNumber !== null) {
            if (Player.IsOwnedByMemberNumber(character.MemberNumber))
                return AccessLevel.clubowner;
            if ((_a = modStorage.owners) === null || _a === void 0 ? void 0 : _a.includes(character.MemberNumber))
                return AccessLevel.owner;
            if (Player.IsLoverOfMemberNumber(character.MemberNumber))
                return AccessLevel.lover;
            if ((_b = modStorage.mistresses) === null || _b === void 0 ? void 0 : _b.includes(character.MemberNumber))
                return AccessLevel.mistress;
            if (Player.WhiteList.includes(character.MemberNumber))
                return AccessLevel.whitelist;
            if ((_c = Player.FriendList) === null || _c === void 0 ? void 0 : _c.includes(character.MemberNumber))
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
        if (!character.hasAccessToPlayer())
            return false;
        if (!moduleIsEnabled(permData.category))
            return false;
        return checkPermisionAccesData(permData, getCharacterAccessLevel(character));
    }
    function checkPermisionAccesData(permData, accessLevel) {
        if (accessLevel === AccessLevel.self) {
            return permData.self || permData.min === AccessLevel.self;
        }
        return accessLevel <= permData.min;
    }
    function permissionsMakeBundle() {
        const res = {};
        for (const [k, v] of permissions.entries()) {
            if (!moduleIsEnabled(v.category))
                continue;
            res[k] = [v.self, v.min];
        }
        return res;
    }
    function getPermissionDataFromBundle(bundle) {
        const res = {};
        for (const [k, v] of permissions.entries()) {
            if (bundle[k]) {
                res[k] = {
                    ...v,
                    self: bundle[k][0],
                    min: bundle[k][1]
                };
            }
        }
        return res;
    }
    function setPermissionSelfAccess(permission, self, characterToCheck) {
        const permData = permissions.get(permission);
        if (!permData) {
            throw new Error(`Attempt to edit unknown permission "${permission}"`);
        }
        if (!moduleIsEnabled(permData.category))
            return false;
        self = self || permData.min === AccessLevel.self;
        if (permData.self === self)
            return true;
        if (characterToCheck) {
            if (!checkPermissionAccess(self ? "authority_grant_self" : "authority_revoke_self", characterToCheck) ||
                !characterToCheck.isPlayer() && !checkPermissionAccess(permission, characterToCheck)) {
                console.warn(`BCX: Unauthorized self permission edit attempt for "${permission}" by ${characterToCheck}`);
                return false;
            }
        }
        if (characterToCheck) {
            const msg = `${characterToCheck} ` +
                (self ? `gave ${characterToCheck.isPlayer() ? "herself" : Player.Name}` : `removed ${(characterToCheck === null || characterToCheck === void 0 ? void 0 : characterToCheck.isPlayer()) ? "her" : Player.Name + "'s"}`) +
                ` control over permission "${permData.name}"`;
            logMessage("permission_change", LogEntryType.plaintext, msg);
            if (!characterToCheck.isPlayer()) {
                ChatRoomSendLocal(msg, undefined, characterToCheck.MemberNumber);
            }
        }
        permData.self = self;
        permissionsSync();
        notifyOfChange();
        return true;
    }
    function setPermissionMinAccess(permission, min, characterToCheck) {
        const permData = permissions.get(permission);
        if (!permData) {
            throw new Error(`Attempt to edit unknown permission "${permission}"`);
        }
        if (!moduleIsEnabled(permData.category))
            return false;
        if (permData.min === min)
            return true;
        if (characterToCheck) {
            const allowed = 
            // Exception: Player can always lower permissions "Self"->"Owner"
            (characterToCheck.isPlayer() && permData.min < min && min <= AccessLevel.owner) ||
                (
                // Character must have access to "allow minimal access modification"
                checkPermissionAccess("authority_edit_min", characterToCheck) &&
                    (
                    // Character must have access to target rule
                    checkPermissionAccess(permission, characterToCheck) ||
                        // Exception: Player bypasses this check when lowering "minimal access"
                        characterToCheck.isPlayer() && min >= permData.min) &&
                    (
                    // Not player must have access to target level
                    !characterToCheck.isPlayer() ||
                        getCharacterAccessLevel(characterToCheck) <= min));
            if (!allowed) {
                console.warn(`BCX: Unauthorized min permission edit attempt for "${permission}" by ${characterToCheck}`);
                return false;
            }
        }
        if (characterToCheck) {
            const msg = `${characterToCheck} changed permission "${permData.name}" from ` +
                `"${getPermissionMinDisplayText(permData.min, characterToCheck)}" to "${getPermissionMinDisplayText(min, characterToCheck)}"`;
            logMessage("permission_change", LogEntryType.plaintext, msg);
            if (!characterToCheck.isPlayer()) {
                ChatRoomSendLocal(msg, undefined, characterToCheck.MemberNumber);
            }
        }
        permData.min = min;
        if (min === AccessLevel.self) {
            permData.self = true;
        }
        permissionsSync();
        notifyOfChange();
        return true;
    }
    function permissionsSync() {
        modStorage.permissions = permissionsMakeBundle();
        modStorageSync();
    }
    function getPlayerPermissionSettings() {
        const res = {};
        for (const [k, v] of permissions.entries()) {
            if (!moduleIsEnabled(v.category))
                continue;
            res[k] = { ...v };
        }
        return res;
    }
    function getPermissionMinDisplayText(minAccess, character) {
        if (minAccess === AccessLevel.self) {
            return character ? character.Name : "Self";
        }
        return capitalizeFirstLetter(AccessLevel[minAccess]);
    }
    function getPlayerRoleData(character) {
        var _a, _b;
        const loadNames = (memberNumber) => [memberNumber, getCharacterName(memberNumber, "")];
        return {
            mistresses: ((_a = modStorage.mistresses) !== null && _a !== void 0 ? _a : []).map(loadNames),
            owners: ((_b = modStorage.owners) !== null && _b !== void 0 ? _b : []).map(loadNames),
            allowAddMistress: checkPermissionAccess("authority_mistress_add", character),
            allowRemoveMistress: checkPermissionAccess("authority_mistress_remove", character),
            allowAddOwner: checkPermissionAccess("authority_owner_add", character),
            allowRemoveOwner: checkPermissionAccess("authority_owner_remove", character)
        };
    }
    function editRole(role, action, target, character) {
        if (target === Player.MemberNumber)
            return false;
        if (!modStorage.owners || !modStorage.mistresses) {
            throw new Error("Not initialized");
        }
        if (character) {
            let permissionToCheck = "authority_mistress_add";
            if (role === "mistress" && action === "remove")
                permissionToCheck = "authority_mistress_remove";
            else if (role === "owner" && action === "add")
                permissionToCheck = "authority_owner_add";
            else if (role === "owner" && action === "remove")
                permissionToCheck = "authority_owner_remove";
            if (!checkPermissionAccess(permissionToCheck, character) && (action !== "remove" || target !== character.MemberNumber))
                return false;
            if (role === "mistress" && action === "add" && modStorage.owners.includes(target) && !checkPermissionAccess("authority_owner_remove", character)) {
                return false;
            }
        }
        if (role === "owner" && action === "remove" && !modStorage.owners.includes(target) ||
            role === "mistress" && action === "remove" && !modStorage.mistresses.includes(target)) {
            return true;
        }
        if (character) {
            const targetDescriptor = character.MemberNumber === target ? "herself" : `${getCharacterName(target, "[unknown name]")} (${target})`;
            const msg = action === "add" ?
                `${character} added ${targetDescriptor} as ${role}.` :
                `${character} removed ${targetDescriptor} from ${role} role.`;
            logMessage("authority_roles_change", LogEntryType.plaintext, msg);
            if (!character.isPlayer()) {
                ChatRoomSendLocal(msg, undefined, character.MemberNumber);
            }
        }
        const ownerIndex = modStorage.owners.indexOf(target);
        if (ownerIndex >= 0) {
            modStorage.owners.splice(ownerIndex, 1);
        }
        const mistressIndex = modStorage.mistresses.indexOf(target);
        if (mistressIndex >= 0) {
            modStorage.mistresses.splice(mistressIndex, 1);
        }
        if (action === "add") {
            if (role === "owner") {
                modStorage.owners.push(target);
            }
            else if (role === "mistress") {
                modStorage.mistresses.push(target);
            }
        }
        modStorageSync();
        notifyOfChange();
        return true;
    }
    class ModuleAuthority extends BaseModule {
        init() {
            registerPermission("authority_grant_self", {
                name: "Allow granting self access",
                category: ModuleCategory.Authority,
                defaults: {
                    [Preset.dominant]: [true, AccessLevel.self],
                    [Preset.switch]: [true, AccessLevel.self],
                    [Preset.submissive]: [false, AccessLevel.owner],
                    [Preset.slave]: [false, AccessLevel.owner]
                }
            });
            registerPermission("authority_revoke_self", {
                name: "Allow forbidding self access",
                category: ModuleCategory.Authority,
                defaults: {
                    [Preset.dominant]: [true, AccessLevel.self],
                    [Preset.switch]: [true, AccessLevel.self],
                    [Preset.submissive]: [true, AccessLevel.self],
                    [Preset.slave]: [false, AccessLevel.owner]
                }
            });
            registerPermission("authority_edit_min", {
                name: "Allow minimal access modification",
                category: ModuleCategory.Authority,
                defaults: {
                    [Preset.dominant]: [true, AccessLevel.self],
                    [Preset.switch]: [true, AccessLevel.self],
                    [Preset.submissive]: [true, AccessLevel.self],
                    [Preset.slave]: [false, AccessLevel.owner]
                }
            });
            registerPermission("authority_mistress_add", {
                name: "Allow granting Mistress status",
                category: ModuleCategory.Authority,
                defaults: {
                    [Preset.dominant]: [true, AccessLevel.self],
                    [Preset.switch]: [true, AccessLevel.self],
                    [Preset.submissive]: [true, AccessLevel.lover],
                    [Preset.slave]: [true, AccessLevel.mistress]
                }
            });
            registerPermission("authority_mistress_remove", {
                name: "Allow revoking Mistress status",
                category: ModuleCategory.Authority,
                defaults: {
                    [Preset.dominant]: [true, AccessLevel.self],
                    [Preset.switch]: [true, AccessLevel.self],
                    [Preset.submissive]: [false, AccessLevel.lover],
                    [Preset.slave]: [false, AccessLevel.lover]
                }
            });
            registerPermission("authority_owner_add", {
                name: "Allow granting Owner status",
                category: ModuleCategory.Authority,
                defaults: {
                    [Preset.dominant]: [true, AccessLevel.self],
                    [Preset.switch]: [true, AccessLevel.self],
                    [Preset.submissive]: [true, AccessLevel.clubowner],
                    [Preset.slave]: [true, AccessLevel.owner]
                }
            });
            registerPermission("authority_owner_remove", {
                name: "Allow revoking Owner status",
                category: ModuleCategory.Authority,
                defaults: {
                    [Preset.dominant]: [true, AccessLevel.self],
                    [Preset.switch]: [true, AccessLevel.self],
                    [Preset.submissive]: [false, AccessLevel.clubowner],
                    [Preset.slave]: [false, AccessLevel.clubowner]
                }
            });
            registerPermission("authority_view_roles", {
                name: "Allow viewing list of owners/mistresses",
                category: ModuleCategory.Authority,
                defaults: {
                    [Preset.dominant]: [true, AccessLevel.self],
                    [Preset.switch]: [true, AccessLevel.mistress],
                    [Preset.submissive]: [true, AccessLevel.whitelist],
                    [Preset.slave]: [true, AccessLevel.public]
                }
            });
            queryHandlers.permissions = (sender, resolve) => {
                resolve(true, permissionsMakeBundle());
            };
            queryHandlers.permissionAccess = (sender, resolve, data) => {
                if (typeof data === "string") {
                    resolve(true, checkPermissionAccess(data, sender));
                }
                else {
                    resolve(false);
                }
            };
            queryHandlers.myAccessLevel = (sender, resolve) => {
                resolve(true, getCharacterAccessLevel(sender));
            };
            queryHandlers.editPermission = (sender, resolve, data) => {
                if (!isObject$1(data) ||
                    typeof data.permission !== "string" ||
                    (data.edit !== "min" && data.edit !== "self") ||
                    (data.edit === "min" && typeof data.target !== "number") ||
                    (data.edit === "self" && typeof data.target !== "boolean")) {
                    console.warn(`BCX: Bad editPermission query from ${sender}`, data);
                    return resolve(false);
                }
                if (!permissions.has(data.permission)) {
                    console.warn(`BCX: editPermission query from ${sender}; unknown permission`, data);
                    return resolve(false);
                }
                if (data.edit === "self") {
                    if (typeof data.target !== "boolean") {
                        throw new Error("Assertion failed");
                    }
                    return resolve(true, setPermissionSelfAccess(data.permission, data.target, sender));
                }
                else {
                    if (typeof data.target !== "number") {
                        throw new Error("Assertion failed");
                    }
                    if (AccessLevel[data.target] === undefined) {
                        console.warn(`BCX: editPermission query from ${sender}; unknown access level`, data);
                        return resolve(true, false);
                    }
                    return resolve(true, setPermissionMinAccess(data.permission, data.target, sender));
                }
            };
            queryHandlers.rolesData = (sender, resolve) => {
                if (!checkPermissionAccess("authority_view_roles", sender)) {
                    return resolve(false);
                }
                resolve(true, getPlayerRoleData(sender));
            };
            queryHandlers.editRole = (sender, resolve, data) => {
                if (!isObject$1(data) ||
                    data.type !== "owner" && data.type !== "mistress" ||
                    data.action !== "add" && data.action !== "remove" ||
                    typeof data.target !== "number") {
                    console.warn(`BCX: Bad editRole query from ${sender}`, data);
                    return resolve(false);
                }
                resolve(true, editRole(data.type, data.action, data.target, sender));
            };
            registerWhisperCommand("role", "- Manage Owner & Mistress roles", (argv, sender, respond) => {
                const subcommand = (argv[0] || "").toLocaleLowerCase();
                if (subcommand === "list") {
                    if (!checkPermissionAccess("authority_view_roles", sender)) {
                        return respond(COMMAND_GENERIC_ERROR);
                    }
                    const data = getPlayerRoleData(sender);
                    let res = "Full list:";
                    for (const owner of data.owners) {
                        res += `\nOwner ${owner[1] || "[unknown name]"} (${owner[0]})`;
                    }
                    for (const mistress of data.mistresses) {
                        res += `\nMistress ${mistress[1] || "[unknown name]"} (${mistress[0]})`;
                    }
                    respond(res);
                }
                else if (subcommand === "owner" || subcommand === "mistress") {
                    const subcommand2 = (argv[1] || "").toLocaleLowerCase();
                    if (subcommand2 !== "add" && subcommand2 !== "remove") {
                        return respond(`Expected either 'add' or 'remove', got '${subcommand2}'`);
                    }
                    if (!argv[2]) {
                        return respond(`Missing required argument: target`);
                    }
                    const target = Command_selectCharacterMemberNumber(argv[2], true);
                    if (typeof target === "string") {
                        return respond(target);
                    }
                    respond(editRole(subcommand, subcommand2, target, sender) ? "Ok!" : COMMAND_GENERIC_ERROR);
                }
                else {
                    respond(Command_fixExclamationMark(sender, `!role usage:\n` +
                        `!role list - List all current owners/mistresses\n` +
                        `!role owner <add/remove> <target> - Add or remove target as owner\n` +
                        `!role mistress <add/remove> <target> - Add or remove target as mistress`));
                }
            }, (argv, sender) => {
                if (argv.length <= 1) {
                    const c = argv[0].toLocaleLowerCase();
                    return ["list", "owner", "mistress"].filter(i => i.startsWith(c));
                }
                const subcommand = argv[0].toLocaleLowerCase();
                if (subcommand === "owner" || subcommand === "mistress") {
                    if (argv.length === 2) {
                        const c = argv[1].toLocaleLowerCase();
                        return ["add", "remove"].filter(i => i.startsWith(c));
                    }
                    const subcommand2 = argv[1].toLocaleLowerCase();
                    if (subcommand2 === "add" || subcommand2 === "remove") {
                        return Command_selectCharacterAutocomplete(argv[2]);
                    }
                }
                return [];
            });
            registerWhisperCommand("permission", "- Manage permissions", (argv, sender, respond) => {
                const subcommand = (argv[0] || "").toLocaleLowerCase();
                const permissionsList = getPlayerPermissionSettings();
                if (subcommand === "list") {
                    const categories = new Map();
                    let hasAny = false;
                    const filter = argv.slice(1).map(v => v.toLocaleLowerCase());
                    for (const [k, v] of Object.entries(permissionsList)) {
                        if (filter.some(i => !MODULE_NAMES[v.category].toLocaleLowerCase().includes(i) &&
                            !v.name.toLocaleLowerCase().includes(i) &&
                            !k.toLocaleLowerCase().includes(i)))
                            continue;
                        let permdata = categories.get(v.category);
                        if (!permdata) {
                            categories.set(v.category, permdata = {});
                        }
                        hasAny = true;
                        permdata[k] = v;
                    }
                    if (!hasAny) {
                        return respond("No permission matches the filter!");
                    }
                    for (const [category, data] of Array.from(categories.entries()).sort((a, b) => a[0] - b[0])) {
                        let result = `List of ${MODULE_NAMES[category]} module permissions:`;
                        for (const [k, v] of Object.entries(data).sort((a, b) => a[1].name.localeCompare(b[1].name))) {
                            result += `\n${k}:\n  ${v.name} - ${v.self ? "self" : "not self"}, ${getPermissionMinDisplayText(v.min, getPlayerCharacter())}`;
                        }
                        respond(result);
                        result = "";
                    }
                }
                else if (permissionsList[subcommand] !== undefined) {
                    const subcommand2 = (argv[1] || "").toLocaleLowerCase();
                    let subcommand3 = (argv[2] || "").toLocaleLowerCase();
                    if (subcommand2 === "") {
                        const v = permissionsList[subcommand];
                        respond(`${subcommand}:\n  ${v.name} - ${v.self ? "self" : "not self"}, ${getPermissionMinDisplayText(v.min, getPlayerCharacter())}`);
                    }
                    else if (subcommand2 === "selfaccess") {
                        if (subcommand3 === "yes" || subcommand3 === "no") {
                            respond(setPermissionSelfAccess(subcommand, subcommand3 === "yes", sender) ? "Ok!" : COMMAND_GENERIC_ERROR);
                        }
                        else {
                            respond(`Expected 'selfaccess yes' or 'selfaccess no'`);
                        }
                    }
                    else if (subcommand2 === "lowestaccess") {
                        if (subcommand3 === Player.Name.toLocaleLowerCase()) {
                            subcommand3 = "self";
                        }
                        const level = AccessLevel[subcommand3];
                        if (typeof level === "number") {
                            respond(setPermissionMinAccess(subcommand, level, sender) ? "Ok!" : COMMAND_GENERIC_ERROR);
                        }
                        else {
                            respond(`Unknown AccessLevel '${subcommand3}';\n` +
                                `expected one of: ${Player.Name}, clubowner, owner, lover, mistress, whitelist, friend, public`);
                        }
                    }
                    else {
                        respond(`Unknown setting '${subcommand2}'; expected 'selfaccess' or 'lowestaccess'`);
                    }
                }
                else if (subcommand !== "help") {
                    respond(`Unknown permission '${subcommand}'.\n` +
                        `To get list of permissions use '${sender.isPlayer() ? "." : "!"}permission list'`);
                }
                else {
                    respond(Command_fixExclamationMark(sender, `!permission usage:\n` +
                        `!permission list [filter] - List all permissions and their current settings\n` +
                        `!permission <name> selfaccess <yes|no> - Gives or revokes ${Player.Name}'s access to permission <name>\n` +
                        `!permission <name> lowestaccess <${Player.Name}|clubowner|owner|lover|mistress|whitelist|friend|public> - Sets the lowest permitted role for the permission <name>`));
                }
            }, (argv, sender) => {
                const permissionNames = Object.keys(getPlayerPermissionSettings());
                if (argv.length <= 1) {
                    const c = argv[0].toLocaleLowerCase();
                    return ["list", ...permissionNames].filter(i => i.startsWith(c));
                }
                const subcommand = argv[0].toLocaleLowerCase();
                if (permissionNames.includes(subcommand)) {
                    const subcommand2 = argv[1].toLocaleLowerCase();
                    const subcommand3 = (argv[2] || "").toLocaleLowerCase();
                    if (argv.length === 2) {
                        return ["selfaccess", "lowestaccess"].filter(i => i.startsWith(subcommand2));
                    }
                    else if (argv.length === 3) {
                        if (subcommand2 === "selfaccess") {
                            return ["yes", "no"].filter(i => i.startsWith(subcommand3));
                        }
                        else if (subcommand2 === "lowestaccess") {
                            return [Player.Name.toLocaleLowerCase(), "self", "clubowner", "owner", "lover", "mistress", "whitelist", "friend", "public"]
                                .filter(i => i.startsWith(subcommand3));
                        }
                    }
                }
                return [];
            });
        }
        setDefultPermissionsForPreset(preset) {
            for (const permission of permissions.values()) {
                permission.self = permission.defaults[preset][0];
                permission.min = permission.defaults[preset][1];
            }
        }
        applyPreset(preset) {
            this.setDefultPermissionsForPreset(preset);
            modStorage.permissions = permissionsMakeBundle();
        }
        load(preset) {
            var _a;
            this.setDefultPermissionsForPreset(preset);
            if (isObject$1(modStorage.permissions)) {
                const transitionDictionary = {
                    log_leaveMessage: "log_add_note"
                };
                for (const [k, v] of Object.entries(modStorage.permissions)) {
                    if (transitionDictionary[k] !== undefined) {
                        console.info(`BCX: Updating permission name "${k}"->"${transitionDictionary[k]}"`);
                    }
                    const perm = permissions.get(((_a = transitionDictionary[k]) !== null && _a !== void 0 ? _a : k));
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
            const seen = new Set();
            const test = (i) => {
                if (typeof i !== "number" || i === Player.MemberNumber || seen.has(i))
                    return false;
                seen.add(i);
                return true;
            };
            if (!Array.isArray(modStorage.owners)) {
                modStorage.owners = [];
            }
            else {
                modStorage.owners = modStorage.owners.filter(test);
            }
            if (!Array.isArray(modStorage.mistresses)) {
                modStorage.mistresses = [];
            }
            else {
                modStorage.mistresses = modStorage.mistresses.filter(test);
            }
        }
        reload(preset) {
            this.load(preset);
        }
    }

    /**
     * Removes all key-value entries from the list cache.
     *
     * @private
     * @name clear
     * @memberOf ListCache
     */
    function listCacheClear() {
      this.__data__ = [];
      this.size = 0;
    }

    /**
     * Performs a
     * [`SameValueZero`](http://ecma-international.org/ecma-262/7.0/#sec-samevaluezero)
     * comparison between two values to determine if they are equivalent.
     *
     * @static
     * @memberOf _
     * @since 4.0.0
     * @category Lang
     * @param {*} value The value to compare.
     * @param {*} other The other value to compare.
     * @returns {boolean} Returns `true` if the values are equivalent, else `false`.
     * @example
     *
     * var object = { 'a': 1 };
     * var other = { 'a': 1 };
     *
     * _.eq(object, object);
     * // => true
     *
     * _.eq(object, other);
     * // => false
     *
     * _.eq('a', 'a');
     * // => true
     *
     * _.eq('a', Object('a'));
     * // => false
     *
     * _.eq(NaN, NaN);
     * // => true
     */
    function eq(value, other) {
      return value === other || (value !== value && other !== other);
    }

    /**
     * Gets the index at which the `key` is found in `array` of key-value pairs.
     *
     * @private
     * @param {Array} array The array to inspect.
     * @param {*} key The key to search for.
     * @returns {number} Returns the index of the matched value, else `-1`.
     */
    function assocIndexOf(array, key) {
      var length = array.length;
      while (length--) {
        if (eq(array[length][0], key)) {
          return length;
        }
      }
      return -1;
    }

    /** Used for built-in method references. */
    var arrayProto = Array.prototype;

    /** Built-in value references. */
    var splice = arrayProto.splice;

    /**
     * Removes `key` and its value from the list cache.
     *
     * @private
     * @name delete
     * @memberOf ListCache
     * @param {string} key The key of the value to remove.
     * @returns {boolean} Returns `true` if the entry was removed, else `false`.
     */
    function listCacheDelete(key) {
      var data = this.__data__,
          index = assocIndexOf(data, key);

      if (index < 0) {
        return false;
      }
      var lastIndex = data.length - 1;
      if (index == lastIndex) {
        data.pop();
      } else {
        splice.call(data, index, 1);
      }
      --this.size;
      return true;
    }

    /**
     * Gets the list cache value for `key`.
     *
     * @private
     * @name get
     * @memberOf ListCache
     * @param {string} key The key of the value to get.
     * @returns {*} Returns the entry value.
     */
    function listCacheGet(key) {
      var data = this.__data__,
          index = assocIndexOf(data, key);

      return index < 0 ? undefined : data[index][1];
    }

    /**
     * Checks if a list cache value for `key` exists.
     *
     * @private
     * @name has
     * @memberOf ListCache
     * @param {string} key The key of the entry to check.
     * @returns {boolean} Returns `true` if an entry for `key` exists, else `false`.
     */
    function listCacheHas(key) {
      return assocIndexOf(this.__data__, key) > -1;
    }

    /**
     * Sets the list cache `key` to `value`.
     *
     * @private
     * @name set
     * @memberOf ListCache
     * @param {string} key The key of the value to set.
     * @param {*} value The value to set.
     * @returns {Object} Returns the list cache instance.
     */
    function listCacheSet(key, value) {
      var data = this.__data__,
          index = assocIndexOf(data, key);

      if (index < 0) {
        ++this.size;
        data.push([key, value]);
      } else {
        data[index][1] = value;
      }
      return this;
    }

    /**
     * Creates an list cache object.
     *
     * @private
     * @constructor
     * @param {Array} [entries] The key-value pairs to cache.
     */
    function ListCache(entries) {
      var index = -1,
          length = entries == null ? 0 : entries.length;

      this.clear();
      while (++index < length) {
        var entry = entries[index];
        this.set(entry[0], entry[1]);
      }
    }

    // Add methods to `ListCache`.
    ListCache.prototype.clear = listCacheClear;
    ListCache.prototype['delete'] = listCacheDelete;
    ListCache.prototype.get = listCacheGet;
    ListCache.prototype.has = listCacheHas;
    ListCache.prototype.set = listCacheSet;

    /**
     * Removes all key-value entries from the stack.
     *
     * @private
     * @name clear
     * @memberOf Stack
     */
    function stackClear() {
      this.__data__ = new ListCache;
      this.size = 0;
    }

    /**
     * Removes `key` and its value from the stack.
     *
     * @private
     * @name delete
     * @memberOf Stack
     * @param {string} key The key of the value to remove.
     * @returns {boolean} Returns `true` if the entry was removed, else `false`.
     */
    function stackDelete(key) {
      var data = this.__data__,
          result = data['delete'](key);

      this.size = data.size;
      return result;
    }

    /**
     * Gets the stack value for `key`.
     *
     * @private
     * @name get
     * @memberOf Stack
     * @param {string} key The key of the value to get.
     * @returns {*} Returns the entry value.
     */
    function stackGet(key) {
      return this.__data__.get(key);
    }

    /**
     * Checks if a stack value for `key` exists.
     *
     * @private
     * @name has
     * @memberOf Stack
     * @param {string} key The key of the entry to check.
     * @returns {boolean} Returns `true` if an entry for `key` exists, else `false`.
     */
    function stackHas(key) {
      return this.__data__.has(key);
    }

    /** Detect free variable `global` from Node.js. */
    var freeGlobal = typeof global == 'object' && global && global.Object === Object && global;

    /** Detect free variable `self`. */
    var freeSelf = typeof self == 'object' && self && self.Object === Object && self;

    /** Used as a reference to the global object. */
    var root = freeGlobal || freeSelf || Function('return this')();

    /** Built-in value references. */
    var Symbol = root.Symbol;

    /** Used for built-in method references. */
    var objectProto$e = Object.prototype;

    /** Used to check objects for own properties. */
    var hasOwnProperty$b = objectProto$e.hasOwnProperty;

    /**
     * Used to resolve the
     * [`toStringTag`](http://ecma-international.org/ecma-262/7.0/#sec-object.prototype.tostring)
     * of values.
     */
    var nativeObjectToString$1 = objectProto$e.toString;

    /** Built-in value references. */
    var symToStringTag$1 = Symbol ? Symbol.toStringTag : undefined;

    /**
     * A specialized version of `baseGetTag` which ignores `Symbol.toStringTag` values.
     *
     * @private
     * @param {*} value The value to query.
     * @returns {string} Returns the raw `toStringTag`.
     */
    function getRawTag(value) {
      var isOwn = hasOwnProperty$b.call(value, symToStringTag$1),
          tag = value[symToStringTag$1];

      try {
        value[symToStringTag$1] = undefined;
        var unmasked = true;
      } catch (e) {}

      var result = nativeObjectToString$1.call(value);
      if (unmasked) {
        if (isOwn) {
          value[symToStringTag$1] = tag;
        } else {
          delete value[symToStringTag$1];
        }
      }
      return result;
    }

    /** Used for built-in method references. */
    var objectProto$d = Object.prototype;

    /**
     * Used to resolve the
     * [`toStringTag`](http://ecma-international.org/ecma-262/7.0/#sec-object.prototype.tostring)
     * of values.
     */
    var nativeObjectToString = objectProto$d.toString;

    /**
     * Converts `value` to a string using `Object.prototype.toString`.
     *
     * @private
     * @param {*} value The value to convert.
     * @returns {string} Returns the converted string.
     */
    function objectToString(value) {
      return nativeObjectToString.call(value);
    }

    /** `Object#toString` result references. */
    var nullTag = '[object Null]',
        undefinedTag = '[object Undefined]';

    /** Built-in value references. */
    var symToStringTag = Symbol ? Symbol.toStringTag : undefined;

    /**
     * The base implementation of `getTag` without fallbacks for buggy environments.
     *
     * @private
     * @param {*} value The value to query.
     * @returns {string} Returns the `toStringTag`.
     */
    function baseGetTag(value) {
      if (value == null) {
        return value === undefined ? undefinedTag : nullTag;
      }
      return (symToStringTag && symToStringTag in Object(value))
        ? getRawTag(value)
        : objectToString(value);
    }

    /**
     * Checks if `value` is the
     * [language type](http://www.ecma-international.org/ecma-262/7.0/#sec-ecmascript-language-types)
     * of `Object`. (e.g. arrays, functions, objects, regexes, `new Number(0)`, and `new String('')`)
     *
     * @static
     * @memberOf _
     * @since 0.1.0
     * @category Lang
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if `value` is an object, else `false`.
     * @example
     *
     * _.isObject({});
     * // => true
     *
     * _.isObject([1, 2, 3]);
     * // => true
     *
     * _.isObject(_.noop);
     * // => true
     *
     * _.isObject(null);
     * // => false
     */
    function isObject(value) {
      var type = typeof value;
      return value != null && (type == 'object' || type == 'function');
    }

    /** `Object#toString` result references. */
    var asyncTag = '[object AsyncFunction]',
        funcTag$2 = '[object Function]',
        genTag$1 = '[object GeneratorFunction]',
        proxyTag = '[object Proxy]';

    /**
     * Checks if `value` is classified as a `Function` object.
     *
     * @static
     * @memberOf _
     * @since 0.1.0
     * @category Lang
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if `value` is a function, else `false`.
     * @example
     *
     * _.isFunction(_);
     * // => true
     *
     * _.isFunction(/abc/);
     * // => false
     */
    function isFunction(value) {
      if (!isObject(value)) {
        return false;
      }
      // The use of `Object#toString` avoids issues with the `typeof` operator
      // in Safari 9 which returns 'object' for typed arrays and other constructors.
      var tag = baseGetTag(value);
      return tag == funcTag$2 || tag == genTag$1 || tag == asyncTag || tag == proxyTag;
    }

    /** Used to detect overreaching core-js shims. */
    var coreJsData = root['__core-js_shared__'];

    /** Used to detect methods masquerading as native. */
    var maskSrcKey = (function() {
      var uid = /[^.]+$/.exec(coreJsData && coreJsData.keys && coreJsData.keys.IE_PROTO || '');
      return uid ? ('Symbol(src)_1.' + uid) : '';
    }());

    /**
     * Checks if `func` has its source masked.
     *
     * @private
     * @param {Function} func The function to check.
     * @returns {boolean} Returns `true` if `func` is masked, else `false`.
     */
    function isMasked(func) {
      return !!maskSrcKey && (maskSrcKey in func);
    }

    /** Used for built-in method references. */
    var funcProto$1 = Function.prototype;

    /** Used to resolve the decompiled source of functions. */
    var funcToString$1 = funcProto$1.toString;

    /**
     * Converts `func` to its source code.
     *
     * @private
     * @param {Function} func The function to convert.
     * @returns {string} Returns the source code.
     */
    function toSource(func) {
      if (func != null) {
        try {
          return funcToString$1.call(func);
        } catch (e) {}
        try {
          return (func + '');
        } catch (e) {}
      }
      return '';
    }

    /**
     * Used to match `RegExp`
     * [syntax characters](http://ecma-international.org/ecma-262/7.0/#sec-patterns).
     */
    var reRegExpChar = /[\\^$.*+?()[\]{}|]/g;

    /** Used to detect host constructors (Safari). */
    var reIsHostCtor = /^\[object .+?Constructor\]$/;

    /** Used for built-in method references. */
    var funcProto = Function.prototype,
        objectProto$c = Object.prototype;

    /** Used to resolve the decompiled source of functions. */
    var funcToString = funcProto.toString;

    /** Used to check objects for own properties. */
    var hasOwnProperty$a = objectProto$c.hasOwnProperty;

    /** Used to detect if a method is native. */
    var reIsNative = RegExp('^' +
      funcToString.call(hasOwnProperty$a).replace(reRegExpChar, '\\$&')
      .replace(/hasOwnProperty|(function).*?(?=\\\()| for .+?(?=\\\])/g, '$1.*?') + '$'
    );

    /**
     * The base implementation of `_.isNative` without bad shim checks.
     *
     * @private
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if `value` is a native function,
     *  else `false`.
     */
    function baseIsNative(value) {
      if (!isObject(value) || isMasked(value)) {
        return false;
      }
      var pattern = isFunction(value) ? reIsNative : reIsHostCtor;
      return pattern.test(toSource(value));
    }

    /**
     * Gets the value at `key` of `object`.
     *
     * @private
     * @param {Object} [object] The object to query.
     * @param {string} key The key of the property to get.
     * @returns {*} Returns the property value.
     */
    function getValue(object, key) {
      return object == null ? undefined : object[key];
    }

    /**
     * Gets the native function at `key` of `object`.
     *
     * @private
     * @param {Object} object The object to query.
     * @param {string} key The key of the method to get.
     * @returns {*} Returns the function if it's native, else `undefined`.
     */
    function getNative(object, key) {
      var value = getValue(object, key);
      return baseIsNative(value) ? value : undefined;
    }

    /* Built-in method references that are verified to be native. */
    var Map$1 = getNative(root, 'Map');

    /* Built-in method references that are verified to be native. */
    var nativeCreate = getNative(Object, 'create');

    /**
     * Removes all key-value entries from the hash.
     *
     * @private
     * @name clear
     * @memberOf Hash
     */
    function hashClear() {
      this.__data__ = nativeCreate ? nativeCreate(null) : {};
      this.size = 0;
    }

    /**
     * Removes `key` and its value from the hash.
     *
     * @private
     * @name delete
     * @memberOf Hash
     * @param {Object} hash The hash to modify.
     * @param {string} key The key of the value to remove.
     * @returns {boolean} Returns `true` if the entry was removed, else `false`.
     */
    function hashDelete(key) {
      var result = this.has(key) && delete this.__data__[key];
      this.size -= result ? 1 : 0;
      return result;
    }

    /** Used to stand-in for `undefined` hash values. */
    var HASH_UNDEFINED$2 = '__lodash_hash_undefined__';

    /** Used for built-in method references. */
    var objectProto$b = Object.prototype;

    /** Used to check objects for own properties. */
    var hasOwnProperty$9 = objectProto$b.hasOwnProperty;

    /**
     * Gets the hash value for `key`.
     *
     * @private
     * @name get
     * @memberOf Hash
     * @param {string} key The key of the value to get.
     * @returns {*} Returns the entry value.
     */
    function hashGet(key) {
      var data = this.__data__;
      if (nativeCreate) {
        var result = data[key];
        return result === HASH_UNDEFINED$2 ? undefined : result;
      }
      return hasOwnProperty$9.call(data, key) ? data[key] : undefined;
    }

    /** Used for built-in method references. */
    var objectProto$a = Object.prototype;

    /** Used to check objects for own properties. */
    var hasOwnProperty$8 = objectProto$a.hasOwnProperty;

    /**
     * Checks if a hash value for `key` exists.
     *
     * @private
     * @name has
     * @memberOf Hash
     * @param {string} key The key of the entry to check.
     * @returns {boolean} Returns `true` if an entry for `key` exists, else `false`.
     */
    function hashHas(key) {
      var data = this.__data__;
      return nativeCreate ? (data[key] !== undefined) : hasOwnProperty$8.call(data, key);
    }

    /** Used to stand-in for `undefined` hash values. */
    var HASH_UNDEFINED$1 = '__lodash_hash_undefined__';

    /**
     * Sets the hash `key` to `value`.
     *
     * @private
     * @name set
     * @memberOf Hash
     * @param {string} key The key of the value to set.
     * @param {*} value The value to set.
     * @returns {Object} Returns the hash instance.
     */
    function hashSet(key, value) {
      var data = this.__data__;
      this.size += this.has(key) ? 0 : 1;
      data[key] = (nativeCreate && value === undefined) ? HASH_UNDEFINED$1 : value;
      return this;
    }

    /**
     * Creates a hash object.
     *
     * @private
     * @constructor
     * @param {Array} [entries] The key-value pairs to cache.
     */
    function Hash(entries) {
      var index = -1,
          length = entries == null ? 0 : entries.length;

      this.clear();
      while (++index < length) {
        var entry = entries[index];
        this.set(entry[0], entry[1]);
      }
    }

    // Add methods to `Hash`.
    Hash.prototype.clear = hashClear;
    Hash.prototype['delete'] = hashDelete;
    Hash.prototype.get = hashGet;
    Hash.prototype.has = hashHas;
    Hash.prototype.set = hashSet;

    /**
     * Removes all key-value entries from the map.
     *
     * @private
     * @name clear
     * @memberOf MapCache
     */
    function mapCacheClear() {
      this.size = 0;
      this.__data__ = {
        'hash': new Hash,
        'map': new (Map$1 || ListCache),
        'string': new Hash
      };
    }

    /**
     * Checks if `value` is suitable for use as unique object key.
     *
     * @private
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if `value` is suitable, else `false`.
     */
    function isKeyable(value) {
      var type = typeof value;
      return (type == 'string' || type == 'number' || type == 'symbol' || type == 'boolean')
        ? (value !== '__proto__')
        : (value === null);
    }

    /**
     * Gets the data for `map`.
     *
     * @private
     * @param {Object} map The map to query.
     * @param {string} key The reference key.
     * @returns {*} Returns the map data.
     */
    function getMapData(map, key) {
      var data = map.__data__;
      return isKeyable(key)
        ? data[typeof key == 'string' ? 'string' : 'hash']
        : data.map;
    }

    /**
     * Removes `key` and its value from the map.
     *
     * @private
     * @name delete
     * @memberOf MapCache
     * @param {string} key The key of the value to remove.
     * @returns {boolean} Returns `true` if the entry was removed, else `false`.
     */
    function mapCacheDelete(key) {
      var result = getMapData(this, key)['delete'](key);
      this.size -= result ? 1 : 0;
      return result;
    }

    /**
     * Gets the map value for `key`.
     *
     * @private
     * @name get
     * @memberOf MapCache
     * @param {string} key The key of the value to get.
     * @returns {*} Returns the entry value.
     */
    function mapCacheGet(key) {
      return getMapData(this, key).get(key);
    }

    /**
     * Checks if a map value for `key` exists.
     *
     * @private
     * @name has
     * @memberOf MapCache
     * @param {string} key The key of the entry to check.
     * @returns {boolean} Returns `true` if an entry for `key` exists, else `false`.
     */
    function mapCacheHas(key) {
      return getMapData(this, key).has(key);
    }

    /**
     * Sets the map `key` to `value`.
     *
     * @private
     * @name set
     * @memberOf MapCache
     * @param {string} key The key of the value to set.
     * @param {*} value The value to set.
     * @returns {Object} Returns the map cache instance.
     */
    function mapCacheSet(key, value) {
      var data = getMapData(this, key),
          size = data.size;

      data.set(key, value);
      this.size += data.size == size ? 0 : 1;
      return this;
    }

    /**
     * Creates a map cache object to store key-value pairs.
     *
     * @private
     * @constructor
     * @param {Array} [entries] The key-value pairs to cache.
     */
    function MapCache(entries) {
      var index = -1,
          length = entries == null ? 0 : entries.length;

      this.clear();
      while (++index < length) {
        var entry = entries[index];
        this.set(entry[0], entry[1]);
      }
    }

    // Add methods to `MapCache`.
    MapCache.prototype.clear = mapCacheClear;
    MapCache.prototype['delete'] = mapCacheDelete;
    MapCache.prototype.get = mapCacheGet;
    MapCache.prototype.has = mapCacheHas;
    MapCache.prototype.set = mapCacheSet;

    /** Used as the size to enable large array optimizations. */
    var LARGE_ARRAY_SIZE = 200;

    /**
     * Sets the stack `key` to `value`.
     *
     * @private
     * @name set
     * @memberOf Stack
     * @param {string} key The key of the value to set.
     * @param {*} value The value to set.
     * @returns {Object} Returns the stack cache instance.
     */
    function stackSet(key, value) {
      var data = this.__data__;
      if (data instanceof ListCache) {
        var pairs = data.__data__;
        if (!Map$1 || (pairs.length < LARGE_ARRAY_SIZE - 1)) {
          pairs.push([key, value]);
          this.size = ++data.size;
          return this;
        }
        data = this.__data__ = new MapCache(pairs);
      }
      data.set(key, value);
      this.size = data.size;
      return this;
    }

    /**
     * Creates a stack cache object to store key-value pairs.
     *
     * @private
     * @constructor
     * @param {Array} [entries] The key-value pairs to cache.
     */
    function Stack(entries) {
      var data = this.__data__ = new ListCache(entries);
      this.size = data.size;
    }

    // Add methods to `Stack`.
    Stack.prototype.clear = stackClear;
    Stack.prototype['delete'] = stackDelete;
    Stack.prototype.get = stackGet;
    Stack.prototype.has = stackHas;
    Stack.prototype.set = stackSet;

    /**
     * A specialized version of `_.forEach` for arrays without support for
     * iteratee shorthands.
     *
     * @private
     * @param {Array} [array] The array to iterate over.
     * @param {Function} iteratee The function invoked per iteration.
     * @returns {Array} Returns `array`.
     */
    function arrayEach(array, iteratee) {
      var index = -1,
          length = array == null ? 0 : array.length;

      while (++index < length) {
        if (iteratee(array[index], index, array) === false) {
          break;
        }
      }
      return array;
    }

    var defineProperty = (function() {
      try {
        var func = getNative(Object, 'defineProperty');
        func({}, '', {});
        return func;
      } catch (e) {}
    }());

    /**
     * The base implementation of `assignValue` and `assignMergeValue` without
     * value checks.
     *
     * @private
     * @param {Object} object The object to modify.
     * @param {string} key The key of the property to assign.
     * @param {*} value The value to assign.
     */
    function baseAssignValue(object, key, value) {
      if (key == '__proto__' && defineProperty) {
        defineProperty(object, key, {
          'configurable': true,
          'enumerable': true,
          'value': value,
          'writable': true
        });
      } else {
        object[key] = value;
      }
    }

    /** Used for built-in method references. */
    var objectProto$9 = Object.prototype;

    /** Used to check objects for own properties. */
    var hasOwnProperty$7 = objectProto$9.hasOwnProperty;

    /**
     * Assigns `value` to `key` of `object` if the existing value is not equivalent
     * using [`SameValueZero`](http://ecma-international.org/ecma-262/7.0/#sec-samevaluezero)
     * for equality comparisons.
     *
     * @private
     * @param {Object} object The object to modify.
     * @param {string} key The key of the property to assign.
     * @param {*} value The value to assign.
     */
    function assignValue(object, key, value) {
      var objValue = object[key];
      if (!(hasOwnProperty$7.call(object, key) && eq(objValue, value)) ||
          (value === undefined && !(key in object))) {
        baseAssignValue(object, key, value);
      }
    }

    /**
     * Copies properties of `source` to `object`.
     *
     * @private
     * @param {Object} source The object to copy properties from.
     * @param {Array} props The property identifiers to copy.
     * @param {Object} [object={}] The object to copy properties to.
     * @param {Function} [customizer] The function to customize copied values.
     * @returns {Object} Returns `object`.
     */
    function copyObject(source, props, object, customizer) {
      var isNew = !object;
      object || (object = {});

      var index = -1,
          length = props.length;

      while (++index < length) {
        var key = props[index];

        var newValue = customizer
          ? customizer(object[key], source[key], key, object, source)
          : undefined;

        if (newValue === undefined) {
          newValue = source[key];
        }
        if (isNew) {
          baseAssignValue(object, key, newValue);
        } else {
          assignValue(object, key, newValue);
        }
      }
      return object;
    }

    /**
     * The base implementation of `_.times` without support for iteratee shorthands
     * or max array length checks.
     *
     * @private
     * @param {number} n The number of times to invoke `iteratee`.
     * @param {Function} iteratee The function invoked per iteration.
     * @returns {Array} Returns the array of results.
     */
    function baseTimes(n, iteratee) {
      var index = -1,
          result = Array(n);

      while (++index < n) {
        result[index] = iteratee(index);
      }
      return result;
    }

    /**
     * Checks if `value` is object-like. A value is object-like if it's not `null`
     * and has a `typeof` result of "object".
     *
     * @static
     * @memberOf _
     * @since 4.0.0
     * @category Lang
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if `value` is object-like, else `false`.
     * @example
     *
     * _.isObjectLike({});
     * // => true
     *
     * _.isObjectLike([1, 2, 3]);
     * // => true
     *
     * _.isObjectLike(_.noop);
     * // => false
     *
     * _.isObjectLike(null);
     * // => false
     */
    function isObjectLike(value) {
      return value != null && typeof value == 'object';
    }

    /** `Object#toString` result references. */
    var argsTag$3 = '[object Arguments]';

    /**
     * The base implementation of `_.isArguments`.
     *
     * @private
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if `value` is an `arguments` object,
     */
    function baseIsArguments(value) {
      return isObjectLike(value) && baseGetTag(value) == argsTag$3;
    }

    /** Used for built-in method references. */
    var objectProto$8 = Object.prototype;

    /** Used to check objects for own properties. */
    var hasOwnProperty$6 = objectProto$8.hasOwnProperty;

    /** Built-in value references. */
    var propertyIsEnumerable$1 = objectProto$8.propertyIsEnumerable;

    /**
     * Checks if `value` is likely an `arguments` object.
     *
     * @static
     * @memberOf _
     * @since 0.1.0
     * @category Lang
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if `value` is an `arguments` object,
     *  else `false`.
     * @example
     *
     * _.isArguments(function() { return arguments; }());
     * // => true
     *
     * _.isArguments([1, 2, 3]);
     * // => false
     */
    var isArguments = baseIsArguments(function() { return arguments; }()) ? baseIsArguments : function(value) {
      return isObjectLike(value) && hasOwnProperty$6.call(value, 'callee') &&
        !propertyIsEnumerable$1.call(value, 'callee');
    };

    /**
     * Checks if `value` is classified as an `Array` object.
     *
     * @static
     * @memberOf _
     * @since 0.1.0
     * @category Lang
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if `value` is an array, else `false`.
     * @example
     *
     * _.isArray([1, 2, 3]);
     * // => true
     *
     * _.isArray(document.body.children);
     * // => false
     *
     * _.isArray('abc');
     * // => false
     *
     * _.isArray(_.noop);
     * // => false
     */
    var isArray = Array.isArray;

    /**
     * This method returns `false`.
     *
     * @static
     * @memberOf _
     * @since 4.13.0
     * @category Util
     * @returns {boolean} Returns `false`.
     * @example
     *
     * _.times(2, _.stubFalse);
     * // => [false, false]
     */
    function stubFalse() {
      return false;
    }

    /** Detect free variable `exports`. */
    var freeExports$2 = typeof exports == 'object' && exports && !exports.nodeType && exports;

    /** Detect free variable `module`. */
    var freeModule$2 = freeExports$2 && typeof module == 'object' && module && !module.nodeType && module;

    /** Detect the popular CommonJS extension `module.exports`. */
    var moduleExports$2 = freeModule$2 && freeModule$2.exports === freeExports$2;

    /** Built-in value references. */
    var Buffer$1 = moduleExports$2 ? root.Buffer : undefined;

    /* Built-in method references for those with the same name as other `lodash` methods. */
    var nativeIsBuffer = Buffer$1 ? Buffer$1.isBuffer : undefined;

    /**
     * Checks if `value` is a buffer.
     *
     * @static
     * @memberOf _
     * @since 4.3.0
     * @category Lang
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if `value` is a buffer, else `false`.
     * @example
     *
     * _.isBuffer(new Buffer(2));
     * // => true
     *
     * _.isBuffer(new Uint8Array(2));
     * // => false
     */
    var isBuffer = nativeIsBuffer || stubFalse;

    /** Used as references for various `Number` constants. */
    var MAX_SAFE_INTEGER$1 = 9007199254740991;

    /** Used to detect unsigned integer values. */
    var reIsUint = /^(?:0|[1-9]\d*)$/;

    /**
     * Checks if `value` is a valid array-like index.
     *
     * @private
     * @param {*} value The value to check.
     * @param {number} [length=MAX_SAFE_INTEGER] The upper bounds of a valid index.
     * @returns {boolean} Returns `true` if `value` is a valid index, else `false`.
     */
    function isIndex(value, length) {
      var type = typeof value;
      length = length == null ? MAX_SAFE_INTEGER$1 : length;

      return !!length &&
        (type == 'number' ||
          (type != 'symbol' && reIsUint.test(value))) &&
            (value > -1 && value % 1 == 0 && value < length);
    }

    /** Used as references for various `Number` constants. */
    var MAX_SAFE_INTEGER = 9007199254740991;

    /**
     * Checks if `value` is a valid array-like length.
     *
     * **Note:** This method is loosely based on
     * [`ToLength`](http://ecma-international.org/ecma-262/7.0/#sec-tolength).
     *
     * @static
     * @memberOf _
     * @since 4.0.0
     * @category Lang
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if `value` is a valid length, else `false`.
     * @example
     *
     * _.isLength(3);
     * // => true
     *
     * _.isLength(Number.MIN_VALUE);
     * // => false
     *
     * _.isLength(Infinity);
     * // => false
     *
     * _.isLength('3');
     * // => false
     */
    function isLength(value) {
      return typeof value == 'number' &&
        value > -1 && value % 1 == 0 && value <= MAX_SAFE_INTEGER;
    }

    /** `Object#toString` result references. */
    var argsTag$2 = '[object Arguments]',
        arrayTag$2 = '[object Array]',
        boolTag$3 = '[object Boolean]',
        dateTag$3 = '[object Date]',
        errorTag$2 = '[object Error]',
        funcTag$1 = '[object Function]',
        mapTag$5 = '[object Map]',
        numberTag$3 = '[object Number]',
        objectTag$3 = '[object Object]',
        regexpTag$3 = '[object RegExp]',
        setTag$5 = '[object Set]',
        stringTag$3 = '[object String]',
        weakMapTag$2 = '[object WeakMap]';

    var arrayBufferTag$3 = '[object ArrayBuffer]',
        dataViewTag$4 = '[object DataView]',
        float32Tag$2 = '[object Float32Array]',
        float64Tag$2 = '[object Float64Array]',
        int8Tag$2 = '[object Int8Array]',
        int16Tag$2 = '[object Int16Array]',
        int32Tag$2 = '[object Int32Array]',
        uint8Tag$2 = '[object Uint8Array]',
        uint8ClampedTag$2 = '[object Uint8ClampedArray]',
        uint16Tag$2 = '[object Uint16Array]',
        uint32Tag$2 = '[object Uint32Array]';

    /** Used to identify `toStringTag` values of typed arrays. */
    var typedArrayTags = {};
    typedArrayTags[float32Tag$2] = typedArrayTags[float64Tag$2] =
    typedArrayTags[int8Tag$2] = typedArrayTags[int16Tag$2] =
    typedArrayTags[int32Tag$2] = typedArrayTags[uint8Tag$2] =
    typedArrayTags[uint8ClampedTag$2] = typedArrayTags[uint16Tag$2] =
    typedArrayTags[uint32Tag$2] = true;
    typedArrayTags[argsTag$2] = typedArrayTags[arrayTag$2] =
    typedArrayTags[arrayBufferTag$3] = typedArrayTags[boolTag$3] =
    typedArrayTags[dataViewTag$4] = typedArrayTags[dateTag$3] =
    typedArrayTags[errorTag$2] = typedArrayTags[funcTag$1] =
    typedArrayTags[mapTag$5] = typedArrayTags[numberTag$3] =
    typedArrayTags[objectTag$3] = typedArrayTags[regexpTag$3] =
    typedArrayTags[setTag$5] = typedArrayTags[stringTag$3] =
    typedArrayTags[weakMapTag$2] = false;

    /**
     * The base implementation of `_.isTypedArray` without Node.js optimizations.
     *
     * @private
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if `value` is a typed array, else `false`.
     */
    function baseIsTypedArray(value) {
      return isObjectLike(value) &&
        isLength(value.length) && !!typedArrayTags[baseGetTag(value)];
    }

    /**
     * The base implementation of `_.unary` without support for storing metadata.
     *
     * @private
     * @param {Function} func The function to cap arguments for.
     * @returns {Function} Returns the new capped function.
     */
    function baseUnary(func) {
      return function(value) {
        return func(value);
      };
    }

    /** Detect free variable `exports`. */
    var freeExports$1 = typeof exports == 'object' && exports && !exports.nodeType && exports;

    /** Detect free variable `module`. */
    var freeModule$1 = freeExports$1 && typeof module == 'object' && module && !module.nodeType && module;

    /** Detect the popular CommonJS extension `module.exports`. */
    var moduleExports$1 = freeModule$1 && freeModule$1.exports === freeExports$1;

    /** Detect free variable `process` from Node.js. */
    var freeProcess = moduleExports$1 && freeGlobal.process;

    /** Used to access faster Node.js helpers. */
    var nodeUtil = (function() {
      try {
        // Use `util.types` for Node.js 10+.
        var types = freeModule$1 && freeModule$1.require && freeModule$1.require('util').types;

        if (types) {
          return types;
        }

        // Legacy `process.binding('util')` for Node.js < 10.
        return freeProcess && freeProcess.binding && freeProcess.binding('util');
      } catch (e) {}
    }());

    /* Node.js helper references. */
    var nodeIsTypedArray = nodeUtil && nodeUtil.isTypedArray;

    /**
     * Checks if `value` is classified as a typed array.
     *
     * @static
     * @memberOf _
     * @since 3.0.0
     * @category Lang
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if `value` is a typed array, else `false`.
     * @example
     *
     * _.isTypedArray(new Uint8Array);
     * // => true
     *
     * _.isTypedArray([]);
     * // => false
     */
    var isTypedArray = nodeIsTypedArray ? baseUnary(nodeIsTypedArray) : baseIsTypedArray;

    /** Used for built-in method references. */
    var objectProto$7 = Object.prototype;

    /** Used to check objects for own properties. */
    var hasOwnProperty$5 = objectProto$7.hasOwnProperty;

    /**
     * Creates an array of the enumerable property names of the array-like `value`.
     *
     * @private
     * @param {*} value The value to query.
     * @param {boolean} inherited Specify returning inherited property names.
     * @returns {Array} Returns the array of property names.
     */
    function arrayLikeKeys(value, inherited) {
      var isArr = isArray(value),
          isArg = !isArr && isArguments(value),
          isBuff = !isArr && !isArg && isBuffer(value),
          isType = !isArr && !isArg && !isBuff && isTypedArray(value),
          skipIndexes = isArr || isArg || isBuff || isType,
          result = skipIndexes ? baseTimes(value.length, String) : [],
          length = result.length;

      for (var key in value) {
        if ((inherited || hasOwnProperty$5.call(value, key)) &&
            !(skipIndexes && (
               // Safari 9 has enumerable `arguments.length` in strict mode.
               key == 'length' ||
               // Node.js 0.10 has enumerable non-index properties on buffers.
               (isBuff && (key == 'offset' || key == 'parent')) ||
               // PhantomJS 2 has enumerable non-index properties on typed arrays.
               (isType && (key == 'buffer' || key == 'byteLength' || key == 'byteOffset')) ||
               // Skip index properties.
               isIndex(key, length)
            ))) {
          result.push(key);
        }
      }
      return result;
    }

    /** Used for built-in method references. */
    var objectProto$6 = Object.prototype;

    /**
     * Checks if `value` is likely a prototype object.
     *
     * @private
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if `value` is a prototype, else `false`.
     */
    function isPrototype(value) {
      var Ctor = value && value.constructor,
          proto = (typeof Ctor == 'function' && Ctor.prototype) || objectProto$6;

      return value === proto;
    }

    /**
     * Creates a unary function that invokes `func` with its argument transformed.
     *
     * @private
     * @param {Function} func The function to wrap.
     * @param {Function} transform The argument transform.
     * @returns {Function} Returns the new function.
     */
    function overArg(func, transform) {
      return function(arg) {
        return func(transform(arg));
      };
    }

    /* Built-in method references for those with the same name as other `lodash` methods. */
    var nativeKeys = overArg(Object.keys, Object);

    /** Used for built-in method references. */
    var objectProto$5 = Object.prototype;

    /** Used to check objects for own properties. */
    var hasOwnProperty$4 = objectProto$5.hasOwnProperty;

    /**
     * The base implementation of `_.keys` which doesn't treat sparse arrays as dense.
     *
     * @private
     * @param {Object} object The object to query.
     * @returns {Array} Returns the array of property names.
     */
    function baseKeys(object) {
      if (!isPrototype(object)) {
        return nativeKeys(object);
      }
      var result = [];
      for (var key in Object(object)) {
        if (hasOwnProperty$4.call(object, key) && key != 'constructor') {
          result.push(key);
        }
      }
      return result;
    }

    /**
     * Checks if `value` is array-like. A value is considered array-like if it's
     * not a function and has a `value.length` that's an integer greater than or
     * equal to `0` and less than or equal to `Number.MAX_SAFE_INTEGER`.
     *
     * @static
     * @memberOf _
     * @since 4.0.0
     * @category Lang
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if `value` is array-like, else `false`.
     * @example
     *
     * _.isArrayLike([1, 2, 3]);
     * // => true
     *
     * _.isArrayLike(document.body.children);
     * // => true
     *
     * _.isArrayLike('abc');
     * // => true
     *
     * _.isArrayLike(_.noop);
     * // => false
     */
    function isArrayLike(value) {
      return value != null && isLength(value.length) && !isFunction(value);
    }

    /**
     * Creates an array of the own enumerable property names of `object`.
     *
     * **Note:** Non-object values are coerced to objects. See the
     * [ES spec](http://ecma-international.org/ecma-262/7.0/#sec-object.keys)
     * for more details.
     *
     * @static
     * @since 0.1.0
     * @memberOf _
     * @category Object
     * @param {Object} object The object to query.
     * @returns {Array} Returns the array of property names.
     * @example
     *
     * function Foo() {
     *   this.a = 1;
     *   this.b = 2;
     * }
     *
     * Foo.prototype.c = 3;
     *
     * _.keys(new Foo);
     * // => ['a', 'b'] (iteration order is not guaranteed)
     *
     * _.keys('hi');
     * // => ['0', '1']
     */
    function keys(object) {
      return isArrayLike(object) ? arrayLikeKeys(object) : baseKeys(object);
    }

    /**
     * The base implementation of `_.assign` without support for multiple sources
     * or `customizer` functions.
     *
     * @private
     * @param {Object} object The destination object.
     * @param {Object} source The source object.
     * @returns {Object} Returns `object`.
     */
    function baseAssign(object, source) {
      return object && copyObject(source, keys(source), object);
    }

    /**
     * This function is like
     * [`Object.keys`](http://ecma-international.org/ecma-262/7.0/#sec-object.keys)
     * except that it includes inherited enumerable properties.
     *
     * @private
     * @param {Object} object The object to query.
     * @returns {Array} Returns the array of property names.
     */
    function nativeKeysIn(object) {
      var result = [];
      if (object != null) {
        for (var key in Object(object)) {
          result.push(key);
        }
      }
      return result;
    }

    /** Used for built-in method references. */
    var objectProto$4 = Object.prototype;

    /** Used to check objects for own properties. */
    var hasOwnProperty$3 = objectProto$4.hasOwnProperty;

    /**
     * The base implementation of `_.keysIn` which doesn't treat sparse arrays as dense.
     *
     * @private
     * @param {Object} object The object to query.
     * @returns {Array} Returns the array of property names.
     */
    function baseKeysIn(object) {
      if (!isObject(object)) {
        return nativeKeysIn(object);
      }
      var isProto = isPrototype(object),
          result = [];

      for (var key in object) {
        if (!(key == 'constructor' && (isProto || !hasOwnProperty$3.call(object, key)))) {
          result.push(key);
        }
      }
      return result;
    }

    /**
     * Creates an array of the own and inherited enumerable property names of `object`.
     *
     * **Note:** Non-object values are coerced to objects.
     *
     * @static
     * @memberOf _
     * @since 3.0.0
     * @category Object
     * @param {Object} object The object to query.
     * @returns {Array} Returns the array of property names.
     * @example
     *
     * function Foo() {
     *   this.a = 1;
     *   this.b = 2;
     * }
     *
     * Foo.prototype.c = 3;
     *
     * _.keysIn(new Foo);
     * // => ['a', 'b', 'c'] (iteration order is not guaranteed)
     */
    function keysIn(object) {
      return isArrayLike(object) ? arrayLikeKeys(object, true) : baseKeysIn(object);
    }

    /**
     * The base implementation of `_.assignIn` without support for multiple sources
     * or `customizer` functions.
     *
     * @private
     * @param {Object} object The destination object.
     * @param {Object} source The source object.
     * @returns {Object} Returns `object`.
     */
    function baseAssignIn(object, source) {
      return object && copyObject(source, keysIn(source), object);
    }

    /** Detect free variable `exports`. */
    var freeExports = typeof exports == 'object' && exports && !exports.nodeType && exports;

    /** Detect free variable `module`. */
    var freeModule = freeExports && typeof module == 'object' && module && !module.nodeType && module;

    /** Detect the popular CommonJS extension `module.exports`. */
    var moduleExports = freeModule && freeModule.exports === freeExports;

    /** Built-in value references. */
    var Buffer = moduleExports ? root.Buffer : undefined,
        allocUnsafe = Buffer ? Buffer.allocUnsafe : undefined;

    /**
     * Creates a clone of  `buffer`.
     *
     * @private
     * @param {Buffer} buffer The buffer to clone.
     * @param {boolean} [isDeep] Specify a deep clone.
     * @returns {Buffer} Returns the cloned buffer.
     */
    function cloneBuffer(buffer, isDeep) {
      if (isDeep) {
        return buffer.slice();
      }
      var length = buffer.length,
          result = allocUnsafe ? allocUnsafe(length) : new buffer.constructor(length);

      buffer.copy(result);
      return result;
    }

    /**
     * Copies the values of `source` to `array`.
     *
     * @private
     * @param {Array} source The array to copy values from.
     * @param {Array} [array=[]] The array to copy values to.
     * @returns {Array} Returns `array`.
     */
    function copyArray(source, array) {
      var index = -1,
          length = source.length;

      array || (array = Array(length));
      while (++index < length) {
        array[index] = source[index];
      }
      return array;
    }

    /**
     * A specialized version of `_.filter` for arrays without support for
     * iteratee shorthands.
     *
     * @private
     * @param {Array} [array] The array to iterate over.
     * @param {Function} predicate The function invoked per iteration.
     * @returns {Array} Returns the new filtered array.
     */
    function arrayFilter(array, predicate) {
      var index = -1,
          length = array == null ? 0 : array.length,
          resIndex = 0,
          result = [];

      while (++index < length) {
        var value = array[index];
        if (predicate(value, index, array)) {
          result[resIndex++] = value;
        }
      }
      return result;
    }

    /**
     * This method returns a new empty array.
     *
     * @static
     * @memberOf _
     * @since 4.13.0
     * @category Util
     * @returns {Array} Returns the new empty array.
     * @example
     *
     * var arrays = _.times(2, _.stubArray);
     *
     * console.log(arrays);
     * // => [[], []]
     *
     * console.log(arrays[0] === arrays[1]);
     * // => false
     */
    function stubArray() {
      return [];
    }

    /** Used for built-in method references. */
    var objectProto$3 = Object.prototype;

    /** Built-in value references. */
    var propertyIsEnumerable = objectProto$3.propertyIsEnumerable;

    /* Built-in method references for those with the same name as other `lodash` methods. */
    var nativeGetSymbols$1 = Object.getOwnPropertySymbols;

    /**
     * Creates an array of the own enumerable symbols of `object`.
     *
     * @private
     * @param {Object} object The object to query.
     * @returns {Array} Returns the array of symbols.
     */
    var getSymbols = !nativeGetSymbols$1 ? stubArray : function(object) {
      if (object == null) {
        return [];
      }
      object = Object(object);
      return arrayFilter(nativeGetSymbols$1(object), function(symbol) {
        return propertyIsEnumerable.call(object, symbol);
      });
    };

    /**
     * Copies own symbols of `source` to `object`.
     *
     * @private
     * @param {Object} source The object to copy symbols from.
     * @param {Object} [object={}] The object to copy symbols to.
     * @returns {Object} Returns `object`.
     */
    function copySymbols(source, object) {
      return copyObject(source, getSymbols(source), object);
    }

    /**
     * Appends the elements of `values` to `array`.
     *
     * @private
     * @param {Array} array The array to modify.
     * @param {Array} values The values to append.
     * @returns {Array} Returns `array`.
     */
    function arrayPush(array, values) {
      var index = -1,
          length = values.length,
          offset = array.length;

      while (++index < length) {
        array[offset + index] = values[index];
      }
      return array;
    }

    /** Built-in value references. */
    var getPrototype = overArg(Object.getPrototypeOf, Object);

    /* Built-in method references for those with the same name as other `lodash` methods. */
    var nativeGetSymbols = Object.getOwnPropertySymbols;

    /**
     * Creates an array of the own and inherited enumerable symbols of `object`.
     *
     * @private
     * @param {Object} object The object to query.
     * @returns {Array} Returns the array of symbols.
     */
    var getSymbolsIn = !nativeGetSymbols ? stubArray : function(object) {
      var result = [];
      while (object) {
        arrayPush(result, getSymbols(object));
        object = getPrototype(object);
      }
      return result;
    };

    /**
     * Copies own and inherited symbols of `source` to `object`.
     *
     * @private
     * @param {Object} source The object to copy symbols from.
     * @param {Object} [object={}] The object to copy symbols to.
     * @returns {Object} Returns `object`.
     */
    function copySymbolsIn(source, object) {
      return copyObject(source, getSymbolsIn(source), object);
    }

    /**
     * The base implementation of `getAllKeys` and `getAllKeysIn` which uses
     * `keysFunc` and `symbolsFunc` to get the enumerable property names and
     * symbols of `object`.
     *
     * @private
     * @param {Object} object The object to query.
     * @param {Function} keysFunc The function to get the keys of `object`.
     * @param {Function} symbolsFunc The function to get the symbols of `object`.
     * @returns {Array} Returns the array of property names and symbols.
     */
    function baseGetAllKeys(object, keysFunc, symbolsFunc) {
      var result = keysFunc(object);
      return isArray(object) ? result : arrayPush(result, symbolsFunc(object));
    }

    /**
     * Creates an array of own enumerable property names and symbols of `object`.
     *
     * @private
     * @param {Object} object The object to query.
     * @returns {Array} Returns the array of property names and symbols.
     */
    function getAllKeys(object) {
      return baseGetAllKeys(object, keys, getSymbols);
    }

    /**
     * Creates an array of own and inherited enumerable property names and
     * symbols of `object`.
     *
     * @private
     * @param {Object} object The object to query.
     * @returns {Array} Returns the array of property names and symbols.
     */
    function getAllKeysIn(object) {
      return baseGetAllKeys(object, keysIn, getSymbolsIn);
    }

    /* Built-in method references that are verified to be native. */
    var DataView = getNative(root, 'DataView');

    /* Built-in method references that are verified to be native. */
    var Promise$1 = getNative(root, 'Promise');

    /* Built-in method references that are verified to be native. */
    var Set$1 = getNative(root, 'Set');

    /* Built-in method references that are verified to be native. */
    var WeakMap = getNative(root, 'WeakMap');

    /** `Object#toString` result references. */
    var mapTag$4 = '[object Map]',
        objectTag$2 = '[object Object]',
        promiseTag = '[object Promise]',
        setTag$4 = '[object Set]',
        weakMapTag$1 = '[object WeakMap]';

    var dataViewTag$3 = '[object DataView]';

    /** Used to detect maps, sets, and weakmaps. */
    var dataViewCtorString = toSource(DataView),
        mapCtorString = toSource(Map$1),
        promiseCtorString = toSource(Promise$1),
        setCtorString = toSource(Set$1),
        weakMapCtorString = toSource(WeakMap);

    /**
     * Gets the `toStringTag` of `value`.
     *
     * @private
     * @param {*} value The value to query.
     * @returns {string} Returns the `toStringTag`.
     */
    var getTag = baseGetTag;

    // Fallback for data views, maps, sets, and weak maps in IE 11 and promises in Node.js < 6.
    if ((DataView && getTag(new DataView(new ArrayBuffer(1))) != dataViewTag$3) ||
        (Map$1 && getTag(new Map$1) != mapTag$4) ||
        (Promise$1 && getTag(Promise$1.resolve()) != promiseTag) ||
        (Set$1 && getTag(new Set$1) != setTag$4) ||
        (WeakMap && getTag(new WeakMap) != weakMapTag$1)) {
      getTag = function(value) {
        var result = baseGetTag(value),
            Ctor = result == objectTag$2 ? value.constructor : undefined,
            ctorString = Ctor ? toSource(Ctor) : '';

        if (ctorString) {
          switch (ctorString) {
            case dataViewCtorString: return dataViewTag$3;
            case mapCtorString: return mapTag$4;
            case promiseCtorString: return promiseTag;
            case setCtorString: return setTag$4;
            case weakMapCtorString: return weakMapTag$1;
          }
        }
        return result;
      };
    }

    var getTag$1 = getTag;

    /** Used for built-in method references. */
    var objectProto$2 = Object.prototype;

    /** Used to check objects for own properties. */
    var hasOwnProperty$2 = objectProto$2.hasOwnProperty;

    /**
     * Initializes an array clone.
     *
     * @private
     * @param {Array} array The array to clone.
     * @returns {Array} Returns the initialized clone.
     */
    function initCloneArray(array) {
      var length = array.length,
          result = new array.constructor(length);

      // Add properties assigned by `RegExp#exec`.
      if (length && typeof array[0] == 'string' && hasOwnProperty$2.call(array, 'index')) {
        result.index = array.index;
        result.input = array.input;
      }
      return result;
    }

    /** Built-in value references. */
    var Uint8Array$1 = root.Uint8Array;

    /**
     * Creates a clone of `arrayBuffer`.
     *
     * @private
     * @param {ArrayBuffer} arrayBuffer The array buffer to clone.
     * @returns {ArrayBuffer} Returns the cloned array buffer.
     */
    function cloneArrayBuffer(arrayBuffer) {
      var result = new arrayBuffer.constructor(arrayBuffer.byteLength);
      new Uint8Array$1(result).set(new Uint8Array$1(arrayBuffer));
      return result;
    }

    /**
     * Creates a clone of `dataView`.
     *
     * @private
     * @param {Object} dataView The data view to clone.
     * @param {boolean} [isDeep] Specify a deep clone.
     * @returns {Object} Returns the cloned data view.
     */
    function cloneDataView(dataView, isDeep) {
      var buffer = isDeep ? cloneArrayBuffer(dataView.buffer) : dataView.buffer;
      return new dataView.constructor(buffer, dataView.byteOffset, dataView.byteLength);
    }

    /** Used to match `RegExp` flags from their coerced string values. */
    var reFlags = /\w*$/;

    /**
     * Creates a clone of `regexp`.
     *
     * @private
     * @param {Object} regexp The regexp to clone.
     * @returns {Object} Returns the cloned regexp.
     */
    function cloneRegExp(regexp) {
      var result = new regexp.constructor(regexp.source, reFlags.exec(regexp));
      result.lastIndex = regexp.lastIndex;
      return result;
    }

    /** Used to convert symbols to primitives and strings. */
    var symbolProto$1 = Symbol ? Symbol.prototype : undefined,
        symbolValueOf$1 = symbolProto$1 ? symbolProto$1.valueOf : undefined;

    /**
     * Creates a clone of the `symbol` object.
     *
     * @private
     * @param {Object} symbol The symbol object to clone.
     * @returns {Object} Returns the cloned symbol object.
     */
    function cloneSymbol(symbol) {
      return symbolValueOf$1 ? Object(symbolValueOf$1.call(symbol)) : {};
    }

    /**
     * Creates a clone of `typedArray`.
     *
     * @private
     * @param {Object} typedArray The typed array to clone.
     * @param {boolean} [isDeep] Specify a deep clone.
     * @returns {Object} Returns the cloned typed array.
     */
    function cloneTypedArray(typedArray, isDeep) {
      var buffer = isDeep ? cloneArrayBuffer(typedArray.buffer) : typedArray.buffer;
      return new typedArray.constructor(buffer, typedArray.byteOffset, typedArray.length);
    }

    /** `Object#toString` result references. */
    var boolTag$2 = '[object Boolean]',
        dateTag$2 = '[object Date]',
        mapTag$3 = '[object Map]',
        numberTag$2 = '[object Number]',
        regexpTag$2 = '[object RegExp]',
        setTag$3 = '[object Set]',
        stringTag$2 = '[object String]',
        symbolTag$2 = '[object Symbol]';

    var arrayBufferTag$2 = '[object ArrayBuffer]',
        dataViewTag$2 = '[object DataView]',
        float32Tag$1 = '[object Float32Array]',
        float64Tag$1 = '[object Float64Array]',
        int8Tag$1 = '[object Int8Array]',
        int16Tag$1 = '[object Int16Array]',
        int32Tag$1 = '[object Int32Array]',
        uint8Tag$1 = '[object Uint8Array]',
        uint8ClampedTag$1 = '[object Uint8ClampedArray]',
        uint16Tag$1 = '[object Uint16Array]',
        uint32Tag$1 = '[object Uint32Array]';

    /**
     * Initializes an object clone based on its `toStringTag`.
     *
     * **Note:** This function only supports cloning values with tags of
     * `Boolean`, `Date`, `Error`, `Map`, `Number`, `RegExp`, `Set`, or `String`.
     *
     * @private
     * @param {Object} object The object to clone.
     * @param {string} tag The `toStringTag` of the object to clone.
     * @param {boolean} [isDeep] Specify a deep clone.
     * @returns {Object} Returns the initialized clone.
     */
    function initCloneByTag(object, tag, isDeep) {
      var Ctor = object.constructor;
      switch (tag) {
        case arrayBufferTag$2:
          return cloneArrayBuffer(object);

        case boolTag$2:
        case dateTag$2:
          return new Ctor(+object);

        case dataViewTag$2:
          return cloneDataView(object, isDeep);

        case float32Tag$1: case float64Tag$1:
        case int8Tag$1: case int16Tag$1: case int32Tag$1:
        case uint8Tag$1: case uint8ClampedTag$1: case uint16Tag$1: case uint32Tag$1:
          return cloneTypedArray(object, isDeep);

        case mapTag$3:
          return new Ctor;

        case numberTag$2:
        case stringTag$2:
          return new Ctor(object);

        case regexpTag$2:
          return cloneRegExp(object);

        case setTag$3:
          return new Ctor;

        case symbolTag$2:
          return cloneSymbol(object);
      }
    }

    /** Built-in value references. */
    var objectCreate = Object.create;

    /**
     * The base implementation of `_.create` without support for assigning
     * properties to the created object.
     *
     * @private
     * @param {Object} proto The object to inherit from.
     * @returns {Object} Returns the new object.
     */
    var baseCreate = (function() {
      function object() {}
      return function(proto) {
        if (!isObject(proto)) {
          return {};
        }
        if (objectCreate) {
          return objectCreate(proto);
        }
        object.prototype = proto;
        var result = new object;
        object.prototype = undefined;
        return result;
      };
    }());

    /**
     * Initializes an object clone.
     *
     * @private
     * @param {Object} object The object to clone.
     * @returns {Object} Returns the initialized clone.
     */
    function initCloneObject(object) {
      return (typeof object.constructor == 'function' && !isPrototype(object))
        ? baseCreate(getPrototype(object))
        : {};
    }

    /** `Object#toString` result references. */
    var mapTag$2 = '[object Map]';

    /**
     * The base implementation of `_.isMap` without Node.js optimizations.
     *
     * @private
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if `value` is a map, else `false`.
     */
    function baseIsMap(value) {
      return isObjectLike(value) && getTag$1(value) == mapTag$2;
    }

    /* Node.js helper references. */
    var nodeIsMap = nodeUtil && nodeUtil.isMap;

    /**
     * Checks if `value` is classified as a `Map` object.
     *
     * @static
     * @memberOf _
     * @since 4.3.0
     * @category Lang
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if `value` is a map, else `false`.
     * @example
     *
     * _.isMap(new Map);
     * // => true
     *
     * _.isMap(new WeakMap);
     * // => false
     */
    var isMap = nodeIsMap ? baseUnary(nodeIsMap) : baseIsMap;

    /** `Object#toString` result references. */
    var setTag$2 = '[object Set]';

    /**
     * The base implementation of `_.isSet` without Node.js optimizations.
     *
     * @private
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if `value` is a set, else `false`.
     */
    function baseIsSet(value) {
      return isObjectLike(value) && getTag$1(value) == setTag$2;
    }

    /* Node.js helper references. */
    var nodeIsSet = nodeUtil && nodeUtil.isSet;

    /**
     * Checks if `value` is classified as a `Set` object.
     *
     * @static
     * @memberOf _
     * @since 4.3.0
     * @category Lang
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if `value` is a set, else `false`.
     * @example
     *
     * _.isSet(new Set);
     * // => true
     *
     * _.isSet(new WeakSet);
     * // => false
     */
    var isSet = nodeIsSet ? baseUnary(nodeIsSet) : baseIsSet;

    /** Used to compose bitmasks for cloning. */
    var CLONE_DEEP_FLAG$1 = 1,
        CLONE_FLAT_FLAG = 2,
        CLONE_SYMBOLS_FLAG$1 = 4;

    /** `Object#toString` result references. */
    var argsTag$1 = '[object Arguments]',
        arrayTag$1 = '[object Array]',
        boolTag$1 = '[object Boolean]',
        dateTag$1 = '[object Date]',
        errorTag$1 = '[object Error]',
        funcTag = '[object Function]',
        genTag = '[object GeneratorFunction]',
        mapTag$1 = '[object Map]',
        numberTag$1 = '[object Number]',
        objectTag$1 = '[object Object]',
        regexpTag$1 = '[object RegExp]',
        setTag$1 = '[object Set]',
        stringTag$1 = '[object String]',
        symbolTag$1 = '[object Symbol]',
        weakMapTag = '[object WeakMap]';

    var arrayBufferTag$1 = '[object ArrayBuffer]',
        dataViewTag$1 = '[object DataView]',
        float32Tag = '[object Float32Array]',
        float64Tag = '[object Float64Array]',
        int8Tag = '[object Int8Array]',
        int16Tag = '[object Int16Array]',
        int32Tag = '[object Int32Array]',
        uint8Tag = '[object Uint8Array]',
        uint8ClampedTag = '[object Uint8ClampedArray]',
        uint16Tag = '[object Uint16Array]',
        uint32Tag = '[object Uint32Array]';

    /** Used to identify `toStringTag` values supported by `_.clone`. */
    var cloneableTags = {};
    cloneableTags[argsTag$1] = cloneableTags[arrayTag$1] =
    cloneableTags[arrayBufferTag$1] = cloneableTags[dataViewTag$1] =
    cloneableTags[boolTag$1] = cloneableTags[dateTag$1] =
    cloneableTags[float32Tag] = cloneableTags[float64Tag] =
    cloneableTags[int8Tag] = cloneableTags[int16Tag] =
    cloneableTags[int32Tag] = cloneableTags[mapTag$1] =
    cloneableTags[numberTag$1] = cloneableTags[objectTag$1] =
    cloneableTags[regexpTag$1] = cloneableTags[setTag$1] =
    cloneableTags[stringTag$1] = cloneableTags[symbolTag$1] =
    cloneableTags[uint8Tag] = cloneableTags[uint8ClampedTag] =
    cloneableTags[uint16Tag] = cloneableTags[uint32Tag] = true;
    cloneableTags[errorTag$1] = cloneableTags[funcTag] =
    cloneableTags[weakMapTag] = false;

    /**
     * The base implementation of `_.clone` and `_.cloneDeep` which tracks
     * traversed objects.
     *
     * @private
     * @param {*} value The value to clone.
     * @param {boolean} bitmask The bitmask flags.
     *  1 - Deep clone
     *  2 - Flatten inherited properties
     *  4 - Clone symbols
     * @param {Function} [customizer] The function to customize cloning.
     * @param {string} [key] The key of `value`.
     * @param {Object} [object] The parent object of `value`.
     * @param {Object} [stack] Tracks traversed objects and their clone counterparts.
     * @returns {*} Returns the cloned value.
     */
    function baseClone(value, bitmask, customizer, key, object, stack) {
      var result,
          isDeep = bitmask & CLONE_DEEP_FLAG$1,
          isFlat = bitmask & CLONE_FLAT_FLAG,
          isFull = bitmask & CLONE_SYMBOLS_FLAG$1;

      if (customizer) {
        result = object ? customizer(value, key, object, stack) : customizer(value);
      }
      if (result !== undefined) {
        return result;
      }
      if (!isObject(value)) {
        return value;
      }
      var isArr = isArray(value);
      if (isArr) {
        result = initCloneArray(value);
        if (!isDeep) {
          return copyArray(value, result);
        }
      } else {
        var tag = getTag$1(value),
            isFunc = tag == funcTag || tag == genTag;

        if (isBuffer(value)) {
          return cloneBuffer(value, isDeep);
        }
        if (tag == objectTag$1 || tag == argsTag$1 || (isFunc && !object)) {
          result = (isFlat || isFunc) ? {} : initCloneObject(value);
          if (!isDeep) {
            return isFlat
              ? copySymbolsIn(value, baseAssignIn(result, value))
              : copySymbols(value, baseAssign(result, value));
          }
        } else {
          if (!cloneableTags[tag]) {
            return object ? value : {};
          }
          result = initCloneByTag(value, tag, isDeep);
        }
      }
      // Check for circular references and return its corresponding clone.
      stack || (stack = new Stack);
      var stacked = stack.get(value);
      if (stacked) {
        return stacked;
      }
      stack.set(value, result);

      if (isSet(value)) {
        value.forEach(function(subValue) {
          result.add(baseClone(subValue, bitmask, customizer, subValue, value, stack));
        });
      } else if (isMap(value)) {
        value.forEach(function(subValue, key) {
          result.set(key, baseClone(subValue, bitmask, customizer, key, value, stack));
        });
      }

      var keysFunc = isFull
        ? (isFlat ? getAllKeysIn : getAllKeys)
        : (isFlat ? keysIn : keys);

      var props = isArr ? undefined : keysFunc(value);
      arrayEach(props || value, function(subValue, key) {
        if (props) {
          key = subValue;
          subValue = value[key];
        }
        // Recursively populate clone (susceptible to call stack limits).
        assignValue(result, key, baseClone(subValue, bitmask, customizer, key, value, stack));
      });
      return result;
    }

    /** Used to compose bitmasks for cloning. */
    var CLONE_DEEP_FLAG = 1,
        CLONE_SYMBOLS_FLAG = 4;

    /**
     * This method is like `_.clone` except that it recursively clones `value`.
     *
     * @static
     * @memberOf _
     * @since 1.0.0
     * @category Lang
     * @param {*} value The value to recursively clone.
     * @returns {*} Returns the deep cloned value.
     * @see _.clone
     * @example
     *
     * var objects = [{ 'a': 1 }, { 'b': 2 }];
     *
     * var deep = _.cloneDeep(objects);
     * console.log(deep[0] === objects[0]);
     * // => false
     */
    function cloneDeep(value) {
      return baseClone(value, CLONE_DEEP_FLAG | CLONE_SYMBOLS_FLAG);
    }

    /** Used to stand-in for `undefined` hash values. */
    var HASH_UNDEFINED = '__lodash_hash_undefined__';

    /**
     * Adds `value` to the array cache.
     *
     * @private
     * @name add
     * @memberOf SetCache
     * @alias push
     * @param {*} value The value to cache.
     * @returns {Object} Returns the cache instance.
     */
    function setCacheAdd(value) {
      this.__data__.set(value, HASH_UNDEFINED);
      return this;
    }

    /**
     * Checks if `value` is in the array cache.
     *
     * @private
     * @name has
     * @memberOf SetCache
     * @param {*} value The value to search for.
     * @returns {number} Returns `true` if `value` is found, else `false`.
     */
    function setCacheHas(value) {
      return this.__data__.has(value);
    }

    /**
     *
     * Creates an array cache object to store unique values.
     *
     * @private
     * @constructor
     * @param {Array} [values] The values to cache.
     */
    function SetCache(values) {
      var index = -1,
          length = values == null ? 0 : values.length;

      this.__data__ = new MapCache;
      while (++index < length) {
        this.add(values[index]);
      }
    }

    // Add methods to `SetCache`.
    SetCache.prototype.add = SetCache.prototype.push = setCacheAdd;
    SetCache.prototype.has = setCacheHas;

    /**
     * A specialized version of `_.some` for arrays without support for iteratee
     * shorthands.
     *
     * @private
     * @param {Array} [array] The array to iterate over.
     * @param {Function} predicate The function invoked per iteration.
     * @returns {boolean} Returns `true` if any element passes the predicate check,
     *  else `false`.
     */
    function arraySome(array, predicate) {
      var index = -1,
          length = array == null ? 0 : array.length;

      while (++index < length) {
        if (predicate(array[index], index, array)) {
          return true;
        }
      }
      return false;
    }

    /**
     * Checks if a `cache` value for `key` exists.
     *
     * @private
     * @param {Object} cache The cache to query.
     * @param {string} key The key of the entry to check.
     * @returns {boolean} Returns `true` if an entry for `key` exists, else `false`.
     */
    function cacheHas(cache, key) {
      return cache.has(key);
    }

    /** Used to compose bitmasks for value comparisons. */
    var COMPARE_PARTIAL_FLAG$3 = 1,
        COMPARE_UNORDERED_FLAG$1 = 2;

    /**
     * A specialized version of `baseIsEqualDeep` for arrays with support for
     * partial deep comparisons.
     *
     * @private
     * @param {Array} array The array to compare.
     * @param {Array} other The other array to compare.
     * @param {number} bitmask The bitmask flags. See `baseIsEqual` for more details.
     * @param {Function} customizer The function to customize comparisons.
     * @param {Function} equalFunc The function to determine equivalents of values.
     * @param {Object} stack Tracks traversed `array` and `other` objects.
     * @returns {boolean} Returns `true` if the arrays are equivalent, else `false`.
     */
    function equalArrays(array, other, bitmask, customizer, equalFunc, stack) {
      var isPartial = bitmask & COMPARE_PARTIAL_FLAG$3,
          arrLength = array.length,
          othLength = other.length;

      if (arrLength != othLength && !(isPartial && othLength > arrLength)) {
        return false;
      }
      // Check that cyclic values are equal.
      var arrStacked = stack.get(array);
      var othStacked = stack.get(other);
      if (arrStacked && othStacked) {
        return arrStacked == other && othStacked == array;
      }
      var index = -1,
          result = true,
          seen = (bitmask & COMPARE_UNORDERED_FLAG$1) ? new SetCache : undefined;

      stack.set(array, other);
      stack.set(other, array);

      // Ignore non-index properties.
      while (++index < arrLength) {
        var arrValue = array[index],
            othValue = other[index];

        if (customizer) {
          var compared = isPartial
            ? customizer(othValue, arrValue, index, other, array, stack)
            : customizer(arrValue, othValue, index, array, other, stack);
        }
        if (compared !== undefined) {
          if (compared) {
            continue;
          }
          result = false;
          break;
        }
        // Recursively compare arrays (susceptible to call stack limits).
        if (seen) {
          if (!arraySome(other, function(othValue, othIndex) {
                if (!cacheHas(seen, othIndex) &&
                    (arrValue === othValue || equalFunc(arrValue, othValue, bitmask, customizer, stack))) {
                  return seen.push(othIndex);
                }
              })) {
            result = false;
            break;
          }
        } else if (!(
              arrValue === othValue ||
                equalFunc(arrValue, othValue, bitmask, customizer, stack)
            )) {
          result = false;
          break;
        }
      }
      stack['delete'](array);
      stack['delete'](other);
      return result;
    }

    /**
     * Converts `map` to its key-value pairs.
     *
     * @private
     * @param {Object} map The map to convert.
     * @returns {Array} Returns the key-value pairs.
     */
    function mapToArray(map) {
      var index = -1,
          result = Array(map.size);

      map.forEach(function(value, key) {
        result[++index] = [key, value];
      });
      return result;
    }

    /**
     * Converts `set` to an array of its values.
     *
     * @private
     * @param {Object} set The set to convert.
     * @returns {Array} Returns the values.
     */
    function setToArray(set) {
      var index = -1,
          result = Array(set.size);

      set.forEach(function(value) {
        result[++index] = value;
      });
      return result;
    }

    /** Used to compose bitmasks for value comparisons. */
    var COMPARE_PARTIAL_FLAG$2 = 1,
        COMPARE_UNORDERED_FLAG = 2;

    /** `Object#toString` result references. */
    var boolTag = '[object Boolean]',
        dateTag = '[object Date]',
        errorTag = '[object Error]',
        mapTag = '[object Map]',
        numberTag = '[object Number]',
        regexpTag = '[object RegExp]',
        setTag = '[object Set]',
        stringTag = '[object String]',
        symbolTag = '[object Symbol]';

    var arrayBufferTag = '[object ArrayBuffer]',
        dataViewTag = '[object DataView]';

    /** Used to convert symbols to primitives and strings. */
    var symbolProto = Symbol ? Symbol.prototype : undefined,
        symbolValueOf = symbolProto ? symbolProto.valueOf : undefined;

    /**
     * A specialized version of `baseIsEqualDeep` for comparing objects of
     * the same `toStringTag`.
     *
     * **Note:** This function only supports comparing values with tags of
     * `Boolean`, `Date`, `Error`, `Number`, `RegExp`, or `String`.
     *
     * @private
     * @param {Object} object The object to compare.
     * @param {Object} other The other object to compare.
     * @param {string} tag The `toStringTag` of the objects to compare.
     * @param {number} bitmask The bitmask flags. See `baseIsEqual` for more details.
     * @param {Function} customizer The function to customize comparisons.
     * @param {Function} equalFunc The function to determine equivalents of values.
     * @param {Object} stack Tracks traversed `object` and `other` objects.
     * @returns {boolean} Returns `true` if the objects are equivalent, else `false`.
     */
    function equalByTag(object, other, tag, bitmask, customizer, equalFunc, stack) {
      switch (tag) {
        case dataViewTag:
          if ((object.byteLength != other.byteLength) ||
              (object.byteOffset != other.byteOffset)) {
            return false;
          }
          object = object.buffer;
          other = other.buffer;

        case arrayBufferTag:
          if ((object.byteLength != other.byteLength) ||
              !equalFunc(new Uint8Array$1(object), new Uint8Array$1(other))) {
            return false;
          }
          return true;

        case boolTag:
        case dateTag:
        case numberTag:
          // Coerce booleans to `1` or `0` and dates to milliseconds.
          // Invalid dates are coerced to `NaN`.
          return eq(+object, +other);

        case errorTag:
          return object.name == other.name && object.message == other.message;

        case regexpTag:
        case stringTag:
          // Coerce regexes to strings and treat strings, primitives and objects,
          // as equal. See http://www.ecma-international.org/ecma-262/7.0/#sec-regexp.prototype.tostring
          // for more details.
          return object == (other + '');

        case mapTag:
          var convert = mapToArray;

        case setTag:
          var isPartial = bitmask & COMPARE_PARTIAL_FLAG$2;
          convert || (convert = setToArray);

          if (object.size != other.size && !isPartial) {
            return false;
          }
          // Assume cyclic values are equal.
          var stacked = stack.get(object);
          if (stacked) {
            return stacked == other;
          }
          bitmask |= COMPARE_UNORDERED_FLAG;

          // Recursively compare objects (susceptible to call stack limits).
          stack.set(object, other);
          var result = equalArrays(convert(object), convert(other), bitmask, customizer, equalFunc, stack);
          stack['delete'](object);
          return result;

        case symbolTag:
          if (symbolValueOf) {
            return symbolValueOf.call(object) == symbolValueOf.call(other);
          }
      }
      return false;
    }

    /** Used to compose bitmasks for value comparisons. */
    var COMPARE_PARTIAL_FLAG$1 = 1;

    /** Used for built-in method references. */
    var objectProto$1 = Object.prototype;

    /** Used to check objects for own properties. */
    var hasOwnProperty$1 = objectProto$1.hasOwnProperty;

    /**
     * A specialized version of `baseIsEqualDeep` for objects with support for
     * partial deep comparisons.
     *
     * @private
     * @param {Object} object The object to compare.
     * @param {Object} other The other object to compare.
     * @param {number} bitmask The bitmask flags. See `baseIsEqual` for more details.
     * @param {Function} customizer The function to customize comparisons.
     * @param {Function} equalFunc The function to determine equivalents of values.
     * @param {Object} stack Tracks traversed `object` and `other` objects.
     * @returns {boolean} Returns `true` if the objects are equivalent, else `false`.
     */
    function equalObjects(object, other, bitmask, customizer, equalFunc, stack) {
      var isPartial = bitmask & COMPARE_PARTIAL_FLAG$1,
          objProps = getAllKeys(object),
          objLength = objProps.length,
          othProps = getAllKeys(other),
          othLength = othProps.length;

      if (objLength != othLength && !isPartial) {
        return false;
      }
      var index = objLength;
      while (index--) {
        var key = objProps[index];
        if (!(isPartial ? key in other : hasOwnProperty$1.call(other, key))) {
          return false;
        }
      }
      // Check that cyclic values are equal.
      var objStacked = stack.get(object);
      var othStacked = stack.get(other);
      if (objStacked && othStacked) {
        return objStacked == other && othStacked == object;
      }
      var result = true;
      stack.set(object, other);
      stack.set(other, object);

      var skipCtor = isPartial;
      while (++index < objLength) {
        key = objProps[index];
        var objValue = object[key],
            othValue = other[key];

        if (customizer) {
          var compared = isPartial
            ? customizer(othValue, objValue, key, other, object, stack)
            : customizer(objValue, othValue, key, object, other, stack);
        }
        // Recursively compare objects (susceptible to call stack limits).
        if (!(compared === undefined
              ? (objValue === othValue || equalFunc(objValue, othValue, bitmask, customizer, stack))
              : compared
            )) {
          result = false;
          break;
        }
        skipCtor || (skipCtor = key == 'constructor');
      }
      if (result && !skipCtor) {
        var objCtor = object.constructor,
            othCtor = other.constructor;

        // Non `Object` object instances with different constructors are not equal.
        if (objCtor != othCtor &&
            ('constructor' in object && 'constructor' in other) &&
            !(typeof objCtor == 'function' && objCtor instanceof objCtor &&
              typeof othCtor == 'function' && othCtor instanceof othCtor)) {
          result = false;
        }
      }
      stack['delete'](object);
      stack['delete'](other);
      return result;
    }

    /** Used to compose bitmasks for value comparisons. */
    var COMPARE_PARTIAL_FLAG = 1;

    /** `Object#toString` result references. */
    var argsTag = '[object Arguments]',
        arrayTag = '[object Array]',
        objectTag = '[object Object]';

    /** Used for built-in method references. */
    var objectProto = Object.prototype;

    /** Used to check objects for own properties. */
    var hasOwnProperty = objectProto.hasOwnProperty;

    /**
     * A specialized version of `baseIsEqual` for arrays and objects which performs
     * deep comparisons and tracks traversed objects enabling objects with circular
     * references to be compared.
     *
     * @private
     * @param {Object} object The object to compare.
     * @param {Object} other The other object to compare.
     * @param {number} bitmask The bitmask flags. See `baseIsEqual` for more details.
     * @param {Function} customizer The function to customize comparisons.
     * @param {Function} equalFunc The function to determine equivalents of values.
     * @param {Object} [stack] Tracks traversed `object` and `other` objects.
     * @returns {boolean} Returns `true` if the objects are equivalent, else `false`.
     */
    function baseIsEqualDeep(object, other, bitmask, customizer, equalFunc, stack) {
      var objIsArr = isArray(object),
          othIsArr = isArray(other),
          objTag = objIsArr ? arrayTag : getTag$1(object),
          othTag = othIsArr ? arrayTag : getTag$1(other);

      objTag = objTag == argsTag ? objectTag : objTag;
      othTag = othTag == argsTag ? objectTag : othTag;

      var objIsObj = objTag == objectTag,
          othIsObj = othTag == objectTag,
          isSameTag = objTag == othTag;

      if (isSameTag && isBuffer(object)) {
        if (!isBuffer(other)) {
          return false;
        }
        objIsArr = true;
        objIsObj = false;
      }
      if (isSameTag && !objIsObj) {
        stack || (stack = new Stack);
        return (objIsArr || isTypedArray(object))
          ? equalArrays(object, other, bitmask, customizer, equalFunc, stack)
          : equalByTag(object, other, objTag, bitmask, customizer, equalFunc, stack);
      }
      if (!(bitmask & COMPARE_PARTIAL_FLAG)) {
        var objIsWrapped = objIsObj && hasOwnProperty.call(object, '__wrapped__'),
            othIsWrapped = othIsObj && hasOwnProperty.call(other, '__wrapped__');

        if (objIsWrapped || othIsWrapped) {
          var objUnwrapped = objIsWrapped ? object.value() : object,
              othUnwrapped = othIsWrapped ? other.value() : other;

          stack || (stack = new Stack);
          return equalFunc(objUnwrapped, othUnwrapped, bitmask, customizer, stack);
        }
      }
      if (!isSameTag) {
        return false;
      }
      stack || (stack = new Stack);
      return equalObjects(object, other, bitmask, customizer, equalFunc, stack);
    }

    /**
     * The base implementation of `_.isEqual` which supports partial comparisons
     * and tracks traversed objects.
     *
     * @private
     * @param {*} value The value to compare.
     * @param {*} other The other value to compare.
     * @param {boolean} bitmask The bitmask flags.
     *  1 - Unordered comparison
     *  2 - Partial comparison
     * @param {Function} [customizer] The function to customize comparisons.
     * @param {Object} [stack] Tracks traversed `value` and `other` objects.
     * @returns {boolean} Returns `true` if the values are equivalent, else `false`.
     */
    function baseIsEqual(value, other, bitmask, customizer, stack) {
      if (value === other) {
        return true;
      }
      if (value == null || other == null || (!isObjectLike(value) && !isObjectLike(other))) {
        return value !== value && other !== other;
      }
      return baseIsEqualDeep(value, other, bitmask, customizer, baseIsEqual, stack);
    }

    /**
     * Performs a deep comparison between two values to determine if they are
     * equivalent.
     *
     * **Note:** This method supports comparing arrays, array buffers, booleans,
     * date objects, error objects, maps, numbers, `Object` objects, regexes,
     * sets, strings, symbols, and typed arrays. `Object` objects are compared
     * by their own, not inherited, enumerable properties. Functions and DOM
     * nodes are compared by strict equality, i.e. `===`.
     *
     * @static
     * @memberOf _
     * @since 0.1.0
     * @category Lang
     * @param {*} value The value to compare.
     * @param {*} other The other value to compare.
     * @returns {boolean} Returns `true` if the values are equivalent, else `false`.
     * @example
     *
     * var object = { 'a': 1 };
     * var other = { 'a': 1 };
     *
     * _.isEqual(object, other);
     * // => true
     *
     * object === other;
     * // => false
     */
    function isEqual(value, other) {
      return baseIsEqual(value, other);
    }

    const CONDITIONS_CHECK_INTERVAL = 2000;
    function guard_ConditionsConditionRequirements(data) {
        return isObject$1(data) &&
            (data.room === undefined ||
                isObject$1(data.room) &&
                    (data.room.inverted === undefined || data.room.inverted === true) &&
                    (data.room.type === "public" || data.room.type === "private")) &&
            (data.roomName === undefined ||
                isObject$1(data.roomName) &&
                    (data.roomName.inverted === undefined || data.roomName.inverted === true) &&
                    typeof data.roomName.name === "string") &&
            (data.role === undefined ||
                isObject$1(data.role) &&
                    (data.role.inverted === undefined || data.role.inverted === true) &&
                    typeof data.role.role === "number" &&
                    AccessLevel[data.role.role] !== undefined) &&
            (data.player === undefined ||
                isObject$1(data.player) &&
                    (data.player.inverted === undefined || data.player.inverted === true) &&
                    typeof data.player.memberNumber === "number");
    }
    function guard_ConditionsConditionPublicData(category, condition, data) {
        const d = data;
        const handler = conditionHandlers.get(category);
        if (!handler)
            return false;
        return isObject$1(d) &&
            typeof d.active === "boolean" &&
            (d.timer === null || typeof d.timer === "number") &&
            typeof d.timerRemove === "boolean" &&
            (d.requirements === null || guard_ConditionsConditionRequirements(d.requirements)) &&
            handler.validatePublicData(condition, d.data);
    }
    function guard_ConditionsCategoryPublicData(category, data) {
        const d = data;
        const handler = conditionHandlers.get(category);
        if (!handler)
            return false;
        return isObject$1(d) &&
            typeof d.access_normal === "boolean" &&
            typeof d.access_limited === "boolean" &&
            typeof d.access_configure === "boolean" &&
            typeof d.access_changeLimits === "boolean" &&
            typeof d.highestRoleInRoom === "number" &&
            AccessLevel[d.highestRoleInRoom] !== undefined &&
            isObject$1(d.conditions) &&
            Object.entries(d.conditions).every(([condition, conditionData]) => guard_ConditionsConditionPublicData(category, condition, conditionData)) &&
            (d.timer === null || typeof d.timer === "number") &&
            typeof d.timerRemove === "boolean" &&
            guard_ConditionsConditionRequirements(d.requirements) &&
            isObject$1(d.limits) &&
            Object.entries(d.limits).every(([condition, limit]) => limit === undefined || typeof limit === "number" && ConditionsLimit[limit] !== undefined);
    }
    const conditionHandlers = new Map();
    function ConditionsRegisterCategory(category, handler) {
        if (moduleInitPhase !== 1 /* init */) {
            throw new Error("Conditions categories can be registered only during init");
        }
        if (conditionHandlers.has(category)) {
            throw new Error(`Conditions categories "${category}" already defined!`);
        }
        conditionHandlers.set(category, handler);
    }
    function ConditionsGetCategoryHandler(category) {
        const handler = conditionHandlers.get(category);
        if (!handler) {
            throw new Error(`No handler for conditions category ${category}`);
        }
        return handler;
    }
    function ConditionsGetCategoryData(category) {
        var _a;
        if (!conditionHandlers.has(category)) {
            throw new Error(`Attempt to get unknown conditions category data ${category}`);
        }
        const data = (_a = modStorage.conditions) === null || _a === void 0 ? void 0 : _a[category];
        if (!data) {
            throw new Error(`Attempt to get data for uninitialized category ${category}`);
        }
        return data;
    }
    function ConditionsMakeConditionPublicData(handler, condition, conditionData) {
        var _a, _b, _c;
        return {
            active: conditionData.active,
            data: handler.makePublicData(condition, conditionData),
            timer: (_a = conditionData.timer) !== null && _a !== void 0 ? _a : null,
            timerRemove: (_b = conditionData.timerRemove) !== null && _b !== void 0 ? _b : false,
            requirements: (_c = conditionData.requirements) !== null && _c !== void 0 ? _c : null
        };
    }
    function ConditionsGetCategoryPublicData(category, requester) {
        var _a, _b;
        const handler = ConditionsGetCategoryHandler(category);
        const data = ConditionsGetCategoryData(category);
        const res = {
            access_normal: checkPermissionAccess(handler.permission_normal, requester),
            access_limited: checkPermissionAccess(handler.permission_limited, requester),
            access_configure: checkPermissionAccess(handler.permission_configure, requester),
            access_changeLimits: checkPermissionAccess(handler.permission_changeLimits, requester),
            highestRoleInRoom: AccessLevel.public,
            conditions: {},
            timer: (_a = data.timer) !== null && _a !== void 0 ? _a : null,
            timerRemove: (_b = data.timerRemove) !== null && _b !== void 0 ? _b : false,
            limits: cloneDeep(data.limits),
            requirements: cloneDeep(data.requirements)
        };
        for (const char of getAllCharactersInRoom()) {
            const role = getCharacterAccessLevel(char);
            if (role !== AccessLevel.self && role < res.highestRoleInRoom) {
                res.highestRoleInRoom = role;
            }
        }
        for (const [condition, conditionData] of Object.entries(data.conditions)) {
            res.conditions[condition] = ConditionsMakeConditionPublicData(handler, condition, conditionData);
        }
        return res;
    }
    function ConditionsGetCondition(category, condition) {
        return ConditionsGetCategoryData(category).conditions[condition];
    }
    function ConditionsSetCondition(category, condition, data) {
        const handler = ConditionsGetCategoryHandler(category);
        if (!moduleIsEnabled(handler.category))
            return;
        const categoryData = ConditionsGetCategoryData(category);
        const existing = categoryData.conditions[condition];
        if (existing) {
            existing.data = data;
        }
        else {
            categoryData.conditions[condition] = {
                active: true,
                timer: categoryData.timer !== undefined ? Date.now() + categoryData.timer : undefined,
                timerRemove: categoryData.timerRemove,
                data
            };
        }
        modStorageSync();
        notifyOfChange();
    }
    function ConditionsGetConditionLimit(category, condition) {
        var _a;
        const handler = ConditionsGetCategoryHandler(category);
        if (!moduleIsEnabled(handler.category))
            return ConditionsLimit.blocked;
        const data = ConditionsGetCategoryData(category);
        return (_a = data.limits[condition]) !== null && _a !== void 0 ? _a : ConditionsLimit.normal;
    }
    function ConditionsCheckAccess(category, condition, character) {
        const limit = ConditionsGetConditionLimit(category, condition);
        if (limit === ConditionsLimit.blocked)
            return false;
        const handler = ConditionsGetCategoryHandler(category);
        return checkPermissionAccess(limit === ConditionsLimit.limited ? handler.permission_limited : handler.permission_normal, character);
    }
    function ConditionsRemoveCondition(category, conditions) {
        if (!Array.isArray(conditions)) {
            conditions = [conditions];
        }
        const categoryData = ConditionsGetCategoryData(category);
        let changed = false;
        for (const condition of conditions) {
            if (categoryData.conditions[condition]) {
                delete categoryData.conditions[condition];
                changed = true;
            }
        }
        if (changed) {
            modStorageSync();
            notifyOfChange();
        }
        return changed;
    }
    function ConditionsSetLimit(category, condition, limit, character) {
        var _a;
        const handler = ConditionsGetCategoryHandler(category);
        if (!moduleIsEnabled(handler.category))
            return false;
        if (!handler.loadValidateConditionKey(condition)) {
            console.warn(`Attempt to set invalid condition limit ${category}:${condition}`);
            return false;
        }
        const data = ConditionsGetCategoryData(category);
        if (character && !checkPermissionAccess(handler.permission_changeLimits, character)) {
            return false;
        }
        if (data.conditions[condition] !== undefined)
            return false;
        const oldLimit = (_a = data.limits[condition]) !== null && _a !== void 0 ? _a : ConditionsLimit.normal;
        if (oldLimit === limit)
            return true;
        if (limit === ConditionsLimit.normal) {
            delete data.limits[condition];
        }
        else {
            data.limits[condition] = limit;
        }
        if (character) {
            handler.logLimitChange(condition, character, limit, oldLimit);
        }
        notifyOfChange();
        modStorageSync();
        return true;
    }
    function ConditionsUpdate(category, condition, data, character) {
        const handler = ConditionsGetCategoryHandler(category);
        if (character && !ConditionsCheckAccess(category, condition, character))
            return false;
        const conditionData = ConditionsGetCondition(category, condition);
        if (!conditionData)
            return false;
        const oldData = ConditionsMakeConditionPublicData(handler, condition, conditionData);
        if (!handler.updateCondition(condition, conditionData, data.data, character))
            return false;
        conditionData.active = data.active;
        if (data.requirements) {
            conditionData.requirements = data.requirements;
        }
        else {
            delete conditionData.requirements;
        }
        if (data.timer !== null) {
            conditionData.timer = data.timer;
        }
        else {
            delete conditionData.timer;
        }
        if (data.timerRemove) {
            conditionData.timerRemove = true;
        }
        else {
            delete conditionData.timerRemove;
        }
        if (character) {
            handler.logConditionUpdate(condition, character, data, oldData);
        }
        notifyOfChange();
        modStorageSync();
        return true;
    }
    function ConditionsCategoryUpdate(category, data, character) {
        const handler = ConditionsGetCategoryHandler(category);
        if (character && !checkPermissionAccess(handler.permission_configure, character))
            return false;
        const conditionData = ConditionsGetCategoryData(category);
        if (!conditionData)
            return false;
        const oldData = character && ConditionsGetCategoryPublicData(category, character);
        conditionData.requirements = data.requirements;
        if (data.timer !== null) {
            conditionData.timer = data.timer;
        }
        else {
            delete conditionData.timer;
        }
        if (data.timerRemove) {
            conditionData.timerRemove = true;
        }
        else {
            delete conditionData.timerRemove;
        }
        if (character && oldData) {
            handler.logCategoryUpdate(character, data, oldData);
        }
        notifyOfChange();
        modStorageSync();
        return true;
    }
    function ConditionsEvaluateRequirements(requirements) {
        const inChatroom = ServerPlayerIsInChatRoom();
        const chatroomPrivate = inChatroom && ChatRoomData && ChatRoomData.Private;
        if (requirements.room) {
            const res = inChatroom &&
                (requirements.room.type === "public" ? !chatroomPrivate : chatroomPrivate);
            if (!(requirements.room.inverted ? !res : res))
                return false;
        }
        if (requirements.roomName) {
            const res = inChatroom &&
                ChatRoomData &&
                typeof ChatRoomData.Name === "string" &&
                ChatRoomData.Name.toLocaleLowerCase() === requirements.roomName.name.toLocaleLowerCase();
            if (!(requirements.roomName.inverted ? !res : res))
                return false;
        }
        if (requirements.role) {
            const res = inChatroom &&
                getAllCharactersInRoom().some(c => !c.isPlayer() && getCharacterAccessLevel(c) <= requirements.role.role);
            if (!(requirements.role.inverted ? !res : res))
                return false;
        }
        if (requirements.player) {
            const res = inChatroom &&
                getAllCharactersInRoom().some(c => c.MemberNumber === requirements.player.memberNumber);
            if (!(requirements.player.inverted ? !res : res))
                return false;
        }
        return true;
    }
    const ConditionsSubcommands = ["setactive", "triggers", "globaltriggers", "timer", "defaulttimer"];
    /*
    !curses setactive <condition> <yes/no> - Switch the curse and its conditions on and off

    !curses triggers <condition> global <yes/no> - Set the trigger condition of this curse to the global configuration
    !curses triggers <condition> <[for each trigger separately]>
    !curses globaltriggers <[for each trigger separately]>

    !curses timer <condition> <[timer handle]>
    !curses defaulttimer <[timer handle]>

    timer handling:
    disable - Remove the timer and set lifetime to infinite
    set <time> (time in /[0-9]+d [0-9]+h [0-9]+m [0-9]+s/ format, each part optional) - Set timer to the given amount of days, hours, minutes or seconds (e.g. 23h 30m)
    autoremove <yes/no> - Set if the curse is removed when the timer runs out or just disables itself

    (global)triggers commands:
    room ignore 							Remove the 'room type'-based trigger condition
    room <is/isnot> <public/private>		Add such a 'room type'-based trigger condition
    roomname ignore							Remove the 'room name'-based trigger condition
    roomname <is/isnot> <name>				Add such a 'room name'-based trigger condition
    role ignore								Remove the role-based trigger condition
    role <with/notwith> <role>				Add such a role-based trigger condition
    player ignore							Remove the person-based trigger condition
    player <with/notwith> <memberNumber>	Add such a person-based trigger condition
    */
    const ConditionsCommandTriggersKeywords = ["room", "roomname", "role", "player"];
    function ConditionsCommandProcessTriggers(triggers, argv, sender, respond) {
        const trigger = (argv[0] || "").toLocaleLowerCase();
        const keyword = (argv[1] || "").toLocaleLowerCase();
        if (keyword === "ignore" && argv.length !== 2) {
            respond(`Error:\n'${trigger} ignore' does not expect any extra arguments.`);
            return true;
        }
        if (!["is", "isnot", "with", "notwith"].includes(keyword)) {
            respond(`Error:\nUnknown setting '${keyword}'. please use one of: ${trigger === "room" || trigger === "roomname" ? "is, isnot" : "with, notwith"}`);
            return true;
        }
        if (argv.length !== 3) {
            respond(`Error:\n'${trigger} ${keyword} <value>' got too many arguments. Arguments with space need to be "quoted".`);
            return true;
        }
        const inverted = (keyword === "isnot" || keyword === "notwith") ? true : undefined;
        let value = argv[2];
        if (trigger === "room") {
            if (keyword === "ignore") {
                delete triggers.room;
                return false;
            }
            value = value.toLocaleLowerCase();
            if (value !== "public" && value !== "private") {
                respond(`Error:\nRoom can be either 'public' or 'private', got: '${value}'`);
                return true;
            }
            triggers.room = {
                type: value,
                inverted
            };
        }
        else if (trigger === "roomname") {
            if (keyword === "ignore") {
                delete triggers.roomName;
                return false;
            }
            triggers.roomName = {
                name: value,
                inverted
            };
        }
        else if (trigger === "role") {
            if (keyword === "ignore") {
                delete triggers.role;
                return false;
            }
            const level = AccessLevel[value.toLocaleLowerCase()];
            if (typeof level !== "number" || level === AccessLevel.self) {
                respond(`Error:\n` +
                    `'role ${keyword}' expects one of: clubowner, owner, lover, mistress, whitelist, friend, public; got: '${value.toLocaleLowerCase()}'`);
                return true;
            }
            triggers.role = {
                role: level,
                inverted
            };
        }
        else if (trigger === "player") {
            if (keyword === "ignore") {
                delete triggers.player;
                return false;
            }
            const target = Command_selectCharacterMemberNumber(value, true);
            if (typeof target === "string") {
                respond(target);
                return true;
            }
            triggers.player = {
                memberNumber: target,
                inverted
            };
        }
        return false;
    }
    function ConditionsCommandTriggersAutocomplete(argv, sender) {
        const trigger = (argv[0] || "").toLocaleLowerCase();
        if (argv.length < 2)
            return [];
        if (trigger === "room" && argv.length === 2) {
            return Command_pickAutocomplete(argv[1], ["ignore", "is", "isnot"]);
        }
        if (trigger === "room" && argv.length === 3) {
            return Command_pickAutocomplete(argv[2], ["public", "private"]);
        }
        if (trigger === "roomname" && argv.length === 2) {
            return Command_pickAutocomplete(argv[1], ["ignore", "is", "isnot"]);
        }
        if (trigger === "role" && argv.length === 2) {
            return Command_pickAutocomplete(argv[1], ["ignore", "with", "notwith"]);
        }
        if (trigger === "role" && argv.length === 3) {
            return Command_pickAutocomplete(argv[2], ["clubowner", "owner", "lover", "mistress", "whitelist", "friend", "public"]);
        }
        if (trigger === "player" && argv.length === 2) {
            return Command_pickAutocomplete(argv[1], ["ignore", "with", "notwith"]);
        }
        if (trigger === "player" && argv.length === 3) {
            return Command_selectCharacterAutocomplete(argv[2]);
        }
        return [];
    }
    function ConditionsRunSubcommand(category, argv, sender, respond) {
        const subcommand = (argv[0] || "").toLocaleLowerCase();
        if (!ConditionsSubcommands.includes(subcommand)) {
            throw new Error(`Subcomand "${subcommand}" passed to ConditionsRunSubcommand isn't valid ConditionsSubcommand`);
        }
        const handler = conditionHandlers.get(category);
        if (!handler) {
            throw new Error(`Attempt to run command for unknown conditions category ${category}`);
        }
        const categoryData = ConditionsGetCategoryData(category);
        const categorySingular = category.slice(0, -1);
        if (subcommand === "setactive") {
            const active = (argv[2] || "").toLocaleLowerCase();
            if (argv.length !== 3 || active !== "yes" && active !== "no") {
                return respond(`Usage:\nsetactive <${categorySingular}> <yes/no>`);
            }
            const [result, condition] = handler.parseConditionName(argv[1], Object.keys(categoryData.conditions));
            if (!result) {
                return respond(condition);
            }
            if (!categoryData.conditions[condition]) {
                return respond(`This ${categorySingular} doesn't exist`);
            }
            const conditionData = ConditionsMakeConditionPublicData(handler, condition, categoryData.conditions[condition]);
            conditionData.active = active === "yes";
            respond(ConditionsUpdate("curses", condition, conditionData, sender) ? `Ok.` : COMMAND_GENERIC_ERROR);
        }
        else if (subcommand === "triggers") {
            const [result, condition] = handler.parseConditionName(argv[1] || "", Object.keys(categoryData.conditions));
            if (!result) {
                return respond(condition);
            }
            if (!categoryData.conditions[condition]) {
                return respond(`This ${categorySingular} doesn't exist`);
            }
            const conditionData = ConditionsMakeConditionPublicData(handler, condition, categoryData.conditions[condition]);
            const keyword = (argv[2] || "").toLocaleLowerCase();
            if (!keyword) {
                if (!conditionData.requirements) {
                    return respond(`Current status:\n` +
                        `Uses global ${category} trigger configuration`);
                }
                else {
                    const triggers = [];
                    const r = conditionData.requirements;
                    if (r.room) {
                        triggers.push(`When ${r.room.inverted ? "not in" : "in"} ${r.room.type} room`);
                    }
                    if (r.roomName) {
                        triggers.push(`When ${r.roomName.inverted ? "not in" : "in"} room named '${r.roomName.name}'`);
                    }
                    if (r.role) {
                        const role = capitalizeFirstLetter(AccessLevel[r.role.role]) + (r.role.role !== AccessLevel.clubowner ? " ↑" : "");
                        triggers.push(`When ${r.role.inverted ? "not in" : "in"} room with role '${role}'`);
                    }
                    if (r.player) {
                        const name = getCharacterName(r.player.memberNumber, null);
                        triggers.push(`When ${r.player.inverted ? "not in" : "in"} room with member '${r.player.memberNumber}'${name ? ` (${name})` : ""}`);
                    }
                    if (triggers.length > 0) {
                        return respond(`Current status:\n` +
                            `This ${categorySingular} will trigger under following conditions:\n` +
                            triggers.join("\n"));
                    }
                    else {
                        return respond(`Current status:\n` +
                            `No triggers are set. The ${categorySingular} will now always trigger, while it is active`);
                    }
                }
            }
            else if (keyword === "global") {
                const global = (argv[3] || "").toLocaleLowerCase();
                if (argv.length !== 4 || global !== "yes" && global !== "no") {
                    return respond(`Usage:\ntriggers <${categorySingular}> global <yes/no>`);
                }
                if (global === "yes") {
                    conditionData.requirements = null;
                }
                else if (!conditionData.requirements) {
                    conditionData.requirements = cloneDeep(categoryData.requirements);
                }
            }
            else if (!ConditionsCommandTriggersKeywords.includes(keyword)) {
                return respond(`${keyword !== "help" ? `Unknown trigger '${keyword}'. ` : ""}List of possible 'triggers <${categorySingular}> *' options:\n` +
                    `global <yes/no> - Set the trigger condition of this ${categorySingular} to the global configuration\n` +
                    `room ignore - Remove the 'room type'-based trigger condition\n` +
                    `room <is/isnot> <public/private> - Add such a 'room type'-based trigger condition\n` +
                    `roomname ignore - Remove the 'room name'-based trigger condition\n` +
                    `roomname <is/isnot> <name> - Add such a 'room name'-based trigger condition\n` +
                    `role ignore - Remove the role-based trigger condition\n` +
                    `role <with/notwith> <role> - Add such a role-based trigger condition\n` +
                    `player ignore - Remove the person-based trigger condition\n` +
                    `player <with/notwith> <memberNumber> - Add such a person-based trigger condition`);
            }
            else if (!conditionData.requirements) {
                return respond(`Cannot configure specific trigger while using global data. First use:\ntriggers <${categorySingular}> global no`);
            }
            else {
                if (ConditionsCommandProcessTriggers(conditionData.requirements, argv.slice(2), sender, respond))
                    return;
            }
            respond(ConditionsUpdate("curses", condition, conditionData, sender) ? `Ok.` : COMMAND_GENERIC_ERROR);
        }
        else if (subcommand === "globaltriggers") {
            const configData = ConditionsGetCategoryPublicData(category, sender);
            if (!argv[1]) {
                const triggers = [];
                const r = configData.requirements;
                if (r.room) {
                    triggers.push(`When ${r.room.inverted ? "not in" : "in"} ${r.room.type} room`);
                }
                if (r.roomName) {
                    triggers.push(`When ${r.roomName.inverted ? "not in" : "in"} room named '${r.roomName.name}'`);
                }
                if (r.role) {
                    const role = capitalizeFirstLetter(AccessLevel[r.role.role]) + (r.role.role !== AccessLevel.clubowner ? " ↑" : "");
                    triggers.push(`When ${r.role.inverted ? "not in" : "in"} room with role '${role}'`);
                }
                if (r.player) {
                    const name = getCharacterName(r.player.memberNumber, null);
                    triggers.push(`When ${r.player.inverted ? "not in" : "in"} room with member '${r.player.memberNumber}'${name ? ` (${name})` : ""}`);
                }
                if (triggers.length > 0) {
                    return respond(`Current status:\n` +
                        `Globally ${category} are set to trigger under following conditions:\n` +
                        triggers.join("\n"));
                }
                else {
                    return respond(`Current status:\n` +
                        `No triggers are set globally. ${capitalizeFirstLetter(category)} using global config will now always trigger, if they are active`);
                }
            }
            else if (!ConditionsCommandTriggersKeywords.includes(argv[1].toLocaleLowerCase())) {
                return respond(`Unknown trigger '${argv[1].toLocaleLowerCase()}' List of possible 'globaltriggers *' options:\n` +
                    `room ignore - Remove the 'room type'-based trigger condition\n` +
                    `room <is/isnot> <public/private> - Add such a 'room type'-based trigger condition\n` +
                    `roomname ignore - Remove the 'room name'-based trigger condition\n` +
                    `roomname <is/isnot> <name> - Add such a 'room name'-based trigger condition\n` +
                    `role ignore - Remove the role-based trigger condition\n` +
                    `role <with/notwith> <role> - Add such a role-based trigger condition\n` +
                    `player ignore - Remove the person-based trigger condition\n` +
                    `player <with/notwith> <memberNumber> - Add such a person-based trigger condition`);
            }
            else {
                if (ConditionsCommandProcessTriggers(configData.requirements, argv.slice(1), sender, respond))
                    return;
            }
            respond(ConditionsCategoryUpdate(category, configData, sender) ? `Ok.` : COMMAND_GENERIC_ERROR);
        }
        else if (subcommand === "timer") {
            const [result, condition] = handler.parseConditionName(argv[1] || "", Object.keys(categoryData.conditions));
            if (!result) {
                return respond(condition);
            }
            if (!categoryData.conditions[condition]) {
                return respond(`This ${categorySingular} doesn't exist`);
            }
            const keyword = (argv[2] || "").toLocaleLowerCase();
            if (keyword !== "set" && keyword !== "disable" && keyword !== "autoremove") {
                return respond(`Usage:\n` +
                    `timer <${categorySingular}> disable - Remove the timer and set lifetime to infinite\n` +
                    `timer <${categorySingular}> set <time> - Set timer to the given amount of days, hours, minutes or seconds (e.g. 23h 30m)\n` +
                    `timer <${categorySingular}> autoremove <yes/no> - Set if the ${categorySingular} is removed when the timer runs out or just disables itself`);
            }
            const conditionData = ConditionsMakeConditionPublicData(handler, condition, categoryData.conditions[condition]);
            if (keyword === "disable") {
                conditionData.timer = null;
                conditionData.timerRemove = false;
            }
            else if (keyword === "set") {
                let time = 0;
                for (const v of argv.slice(3)) {
                    const i = Command_parseTime(v);
                    if (typeof i === "string") {
                        return respond(i);
                    }
                    time += i;
                }
                conditionData.timer = Date.now() + time;
            }
            else if (keyword === "autoremove") {
                const autoremove = (argv[3] || "").toLocaleLowerCase();
                if (argv.length !== 4 || autoremove !== "yes" && autoremove !== "no") {
                    return respond(`Usage:\ntimer <${categorySingular}> autoremove <yes/no>`);
                }
                if (conditionData.timer === null) {
                    return respond(`Timer is disabled on this ${categorySingular}. To use autoremove, first set timer`);
                }
                conditionData.timerRemove = autoremove === "yes";
            }
            respond(ConditionsUpdate("curses", condition, conditionData, sender) ? `Ok.` : COMMAND_GENERIC_ERROR);
        }
        else if (subcommand === "defaulttimer") {
            const keyword = (argv[1] || "").toLocaleLowerCase();
            if (keyword !== "set" && keyword !== "disable" && keyword !== "autoremove") {
                return respond(`Usage:\n` +
                    `defaulttimer disable - Remove the timer and set lifetime to infinite\n` +
                    `defaulttimer set <time> - Set timer to the given amount of days, hours, minutes or seconds (e.g. 23h 30m)\n` +
                    `defaulttimer autoremove <yes/no> - Set if the ${categorySingular} is removed when the timer runs out or just disables itself`);
            }
            const configData = ConditionsGetCategoryPublicData(category, sender);
            if (keyword === "disable") {
                configData.timer = null;
                configData.timerRemove = false;
            }
            else if (keyword === "set") {
                let time = 0;
                for (const v of argv.slice(2)) {
                    const i = Command_parseTime(v);
                    if (typeof i === "string") {
                        return respond(i);
                    }
                    time += i;
                }
                configData.timer = time;
            }
            else if (keyword === "autoremove") {
                const autoremove = (argv[2] || "").toLocaleLowerCase();
                if (argv.length !== 3 || autoremove !== "yes" && autoremove !== "no") {
                    return respond(`Usage:\ndefaulttimer <${categorySingular}> autoremove <yes/no>`);
                }
                if (configData.timer === null) {
                    return respond(`Timer is disabled by default for ${category}. To use autoremove, first set timer`);
                }
                configData.timerRemove = autoremove === "yes";
            }
            respond(ConditionsCategoryUpdate(category, configData, sender) ? `Ok.` : COMMAND_GENERIC_ERROR);
        }
    }
    function ConditionsAutocompleteSubcommand(category, argv, sender) {
        const subcommand = (argv[0] || "").toLocaleLowerCase();
        if (!ConditionsSubcommands.includes(subcommand)) {
            throw new Error(`Subcomand "${subcommand}" passed to ConditionsAutocompleteSubcommand isn't valid ConditionsSubcommand`);
        }
        const handler = conditionHandlers.get(category);
        if (!handler) {
            throw new Error(`Attempt to autocomplete command for unknown conditions category ${category}`);
        }
        const categoryData = ConditionsGetCategoryData(category);
        if (subcommand === "setactive") {
            if (argv.length === 2) {
                return handler.autocompleteConditionName(argv[1], Object.keys(categoryData.conditions));
            }
            else if (argv.length === 3) {
                return Command_pickAutocomplete(argv[2], ["yes", "no"]);
            }
        }
        else if (subcommand === "triggers") {
            if (argv.length === 2) {
                return handler.autocompleteConditionName(argv[1], Object.keys(categoryData.conditions));
            }
            const [result, condition] = handler.parseConditionName(argv[1] || "", Object.keys(categoryData.conditions));
            if (!result || !categoryData.conditions[condition]) {
                return [];
            }
            if (argv.length === 3) {
                return Command_pickAutocomplete(argv[2], ["global", ...ConditionsCommandTriggersKeywords]);
            }
            if (argv[2].toLocaleLowerCase() === "global") {
                return Command_pickAutocomplete(argv[3], ["yes", "no"]);
            }
            else if (categoryData.conditions[condition].requirements && ConditionsCommandTriggersKeywords.includes(argv[2].toLocaleLowerCase())) {
                return ConditionsCommandTriggersAutocomplete(argv.slice(2), sender);
            }
        }
        else if (subcommand === "globaltriggers") {
            if (argv.length === 2) {
                return Command_pickAutocomplete(argv[2], ConditionsCommandTriggersKeywords);
            }
            else if (ConditionsCommandTriggersKeywords.includes(argv[2].toLocaleLowerCase())) {
                return ConditionsCommandTriggersAutocomplete(argv.slice(1), sender);
            }
        }
        else if (subcommand === "timer") {
            if (argv.length === 2) {
                return handler.autocompleteConditionName(argv[1], Object.keys(categoryData.conditions));
            }
            else if (argv.length === 3) {
                return Command_pickAutocomplete(argv[2], ["set", "disable", "autoremove"]);
            }
            else if (argv.length === 4 && argv[2].toLocaleLowerCase() === "autoremove") {
                return Command_pickAutocomplete(argv[3], ["yes", "no"]);
            }
        }
        else if (subcommand === "defaulttimer") {
            if (argv.length === 2) {
                return Command_pickAutocomplete(argv[1], ["set", "disable", "autoremove"]);
            }
            else if (argv.length === 3 && argv[1].toLocaleLowerCase() === "autoremove") {
                return Command_pickAutocomplete(argv[2], ["yes", "no"]);
            }
        }
        return [];
    }
    class ModuleConditions extends BaseModule {
        constructor() {
            super(...arguments);
            this.timer = null;
        }
        load() {
            if (!isObject$1(modStorage.conditions)) {
                modStorage.conditions = {};
            }
            // cursedItems migration
            if (modStorage.cursedItems) {
                const curses = modStorage.conditions.curses = {
                    conditions: {},
                    limits: {},
                    requirements: {}
                };
                for (const [group, data] of Object.entries(modStorage.cursedItems)) {
                    curses.conditions[group] = {
                        active: true,
                        data
                    };
                }
                delete modStorage.cursedItems;
            }
            for (const key of Object.keys(modStorage.conditions)) {
                const handler = conditionHandlers.get(key);
                if (!handler || !moduleIsEnabled(handler.category)) {
                    console.debug(`BCX: Removing unknown or disabled conditions category ${key}`);
                    delete modStorage.conditions[key];
                    continue;
                }
                const data = modStorage.conditions[key];
                if (!isObject$1(data) || !isObject$1(data.conditions)) {
                    console.warn(`BCX: Removing category ${key} with invalid data`);
                    delete modStorage.conditions[key];
                    continue;
                }
                if (data.timer !== undefined && typeof data.timer !== "number") {
                    console.warn(`BCX: Removing category ${key} invalid timer`, data.timer);
                    delete data.timer;
                }
                // eslint-disable-next-line @typescript-eslint/no-unnecessary-boolean-literal-compare
                if (data.timerRemove !== undefined && data.timerRemove !== true) {
                    console.warn(`BCX: Removing category ${key} invalid timerRemove`, data.timerRemove);
                    delete data.timerRemove;
                }
                if (!isObject$1(data.limits)) {
                    console.warn(`BCX: Resetting category ${key} limits with invalid data`);
                    data.limits = {};
                }
                for (const [condition, limitValue] of Object.entries(data.limits)) {
                    if (!handler.loadValidateConditionKey(condition)) {
                        console.warn(`BCX: Unknown condition ${key}:${condition} limit, removing it`);
                        delete data.limits[condition];
                    }
                    else if (typeof limitValue !== "number" ||
                        limitValue === ConditionsLimit.normal ||
                        ConditionsLimit[limitValue] === undefined) {
                        console.warn(`BCX: Unknown condition ${key}:${condition} limit value, removing it`, limitValue);
                        delete data.limits[condition];
                    }
                }
                if (!guard_ConditionsConditionRequirements(data.requirements)) {
                    console.warn(`BCX: Resetting category ${key} requirements with invalid data`);
                    data.requirements = {};
                }
                for (const [condition, conditiondata] of Object.entries(data.conditions)) {
                    if (!handler.loadValidateConditionKey(condition)) {
                        console.warn(`BCX: Unknown condition ${key}:${condition}, removing it`);
                        delete data.conditions[condition];
                    }
                    else if (!handler.loadValidateCondition(condition, conditiondata)) {
                        delete data.conditions[condition];
                    }
                    else if (typeof conditiondata.active !== "boolean" ||
                        conditiondata.requirements !== undefined && !guard_ConditionsConditionRequirements(conditiondata.requirements) ||
                        conditiondata.timer !== undefined && typeof conditiondata.timer !== "number" ||
                        // eslint-disable-next-line @typescript-eslint/no-unnecessary-boolean-literal-compare
                        conditiondata.timerRemove !== undefined && conditiondata.timerRemove !== true) {
                        console.warn(`BCX: Condition ${key}:${condition} has bad data, removing it`);
                        delete data.conditions[condition];
                    }
                }
            }
            for (const [key, handler] of conditionHandlers.entries()) {
                if (moduleIsEnabled(handler.category) && !isObject$1(modStorage.conditions[key])) {
                    console.debug(`BCX: Adding missing conditions category ${key}`);
                    modStorage.conditions[key] = {
                        conditions: {},
                        limits: {},
                        requirements: {}
                    };
                }
            }
            queryHandlers.conditionsGet = (sender, resolve, data) => {
                if (typeof data === "string" && conditionHandlers.has(data)) {
                    resolve(true, ConditionsGetCategoryPublicData(data, sender));
                }
                else {
                    resolve(false);
                }
            };
            queryHandlers.conditionSetLimit = (sender, resolve, data) => {
                if (isObject$1(data) &&
                    typeof data.category === "string" &&
                    conditionHandlers.has(data.category) &&
                    typeof data.condition === "string" &&
                    typeof data.limit === "number" &&
                    ConditionsLimit[data.limit] !== undefined) {
                    resolve(true, ConditionsSetLimit(data.category, data.condition, data.limit, sender));
                }
                else {
                    resolve(false);
                }
            };
            queryHandlers.conditionUpdate = (sender, resolve, data) => {
                if (isObject$1(data) &&
                    typeof data.category === "string" &&
                    conditionHandlers.has(data.category) &&
                    typeof data.condition === "string" &&
                    guard_ConditionsConditionPublicData(data.category, data.condition, data.data)) {
                    resolve(true, ConditionsUpdate(data.category, data.condition, data.data, sender));
                }
                else {
                    resolve(false);
                }
            };
            queryHandlers.conditionCategoryUpdate = (sender, resolve, data) => {
                if (isObject$1(data) &&
                    typeof data.category === "string" &&
                    conditionHandlers.has(data.category) &&
                    isObject$1(data.data) &&
                    (data.data.timer === null || typeof data.data.timer === "number") &&
                    typeof data.data.timerRemove === "boolean" &&
                    guard_ConditionsConditionRequirements(data.data.requirements)) {
                    resolve(true, ConditionsCategoryUpdate(data.category, data.data, sender));
                }
                else {
                    resolve(false);
                }
            };
        }
        run() {
            this.timer = setInterval(() => this.conditionsTick(), CONDITIONS_CHECK_INTERVAL);
        }
        unload() {
            if (this.timer !== null) {
                clearInterval(this.timer);
                this.timer = null;
            }
        }
        reload() {
            this.unload();
            this.load();
            this.run();
        }
        conditionsTick() {
            var _a;
            if (!ServerIsConnected || !modStorage.conditions)
                return;
            let dataChanged = false;
            const now = Date.now();
            for (const [category, handler] of conditionHandlers.entries()) {
                const categoryData = modStorage.conditions[category];
                if (!moduleIsEnabled(handler.category) || !categoryData)
                    continue;
                for (const [conditionName, conditionData] of Object.entries(categoryData.conditions)) {
                    if (conditionData.timer !== undefined && conditionData.timer <= now) {
                        if (conditionData.timerRemove) {
                            ConditionsRemoveCondition(category, conditionName);
                        }
                        else {
                            delete conditionData.timer;
                            conditionData.active = false;
                            dataChanged = true;
                        }
                    }
                    if (!conditionData.active)
                        continue;
                    const requirements = (_a = conditionData.requirements) !== null && _a !== void 0 ? _a : categoryData.requirements;
                    if (!ConditionsEvaluateRequirements(requirements))
                        continue;
                    const copy = cloneDeep(conditionData);
                    handler.tickHandler(conditionName, conditionData);
                    if (!isEqual(copy, conditionData)) {
                        dataChanged = true;
                    }
                }
            }
            if (dataChanged) {
                modStorageSync();
                notifyOfChange();
            }
        }
    }

    const CURSES_ANTILOOP_RESET_INTERVAL = 60000;
    const CURSES_ANTILOOP_THRESHOLD = 10;
    const CURSES_ANTILOOP_SUSPEND_TIME = 600000;
    const CURSE_IGNORED_PROPERTIES = ValidationModifiableProperties.slice();
    const CURSE_IGNORED_EFFECTS = ["Lock"];
    function curseAllowItemCurseProperty(asset) {
        var _a, _b, _c, _d;
        return !!(asset.Extended ||
            ((_a = asset.Effect) === null || _a === void 0 ? void 0 : _a.includes("Egged")) ||
            ((_b = asset.AllowEffect) === null || _b === void 0 ? void 0 : _b.includes("Egged")) ||
            ((_c = asset.Effect) === null || _c === void 0 ? void 0 : _c.includes("UseRemote")) ||
            ((_d = asset.AllowEffect) === null || _d === void 0 ? void 0 : _d.includes("UseRemote")));
    }
    function curseDefaultItemCurseProperty(asset) {
        return curseAllowItemCurseProperty(asset) && asset.Extended && asset.Archetype === "typed";
    }
    function curseItem(Group, curseProperty, character) {
        if (!moduleIsEnabled(ModuleCategory.Curses))
            return false;
        const group = AssetGroup.find(g => g.Name === Group);
        if (!group || (typeof curseProperty !== "boolean" && curseProperty !== null)) {
            console.error(`BCX: Attempt to curse with invalid data`, Group, curseProperty);
            return false;
        }
        if (group.Category === "Appearance" && !group.Clothing) {
            console.warn(`BCX: Attempt to curse body`, Group);
            return false;
        }
        if (character && !ConditionsCheckAccess("curses", Group, character)) {
            return false;
        }
        const currentItem = InventoryGet(Player, Group);
        if (currentItem) {
            if (curseProperty === null) {
                if (ConditionsGetCondition("curses", Group))
                    return true;
                curseProperty = curseDefaultItemCurseProperty(currentItem.Asset);
            }
            if (!curseAllowItemCurseProperty(currentItem.Asset) && curseProperty) {
                console.warn(`BCX: Attempt to curse properties of item ${currentItem.Asset.Group.Name}:${currentItem.Asset.Name}, while not allowed`);
                curseProperty = false;
            }
            const newCurse = {
                Name: currentItem.Asset.Name,
                curseProperty
            };
            if (currentItem.Color && currentItem.Color !== "Default") {
                newCurse.Color = cloneDeep(currentItem.Color);
            }
            if (currentItem.Difficulty) {
                newCurse.Difficulty = currentItem.Difficulty;
            }
            if (currentItem.Property && Object.keys(currentItem.Property).filter(i => !CURSE_IGNORED_PROPERTIES.includes(i)).length !== 0) {
                newCurse.Property = cloneDeep(currentItem.Property);
                if (newCurse.Property) {
                    for (const key of CURSE_IGNORED_PROPERTIES) {
                        delete newCurse.Property[key];
                    }
                }
            }
            ConditionsSetCondition("curses", Group, newCurse);
            if (character) {
                logMessage("curse_change", LogEntryType.plaintext, `${character} cursed ${Player.Name}'s ${currentItem.Asset.Description}`);
                if (!character.isPlayer()) {
                    ChatRoomSendLocal(`${character} cursed the ${currentItem.Asset.Description} on you`);
                }
            }
        }
        else {
            ConditionsSetCondition("curses", Group, null);
            if (character) {
                logMessage("curse_change", LogEntryType.plaintext, `${character} cursed ${Player.Name}'s body part to stay exposed (${getVisibleGroupName(group)})`);
                if (!character.isPlayer()) {
                    ChatRoomSendLocal(`${character} put a curse on you, forcing part of your body to stay exposed (${getVisibleGroupName(group)})`);
                }
            }
        }
        modStorageSync();
        notifyOfChange();
        return true;
    }
    function curseBatch(mode, includingEmpty, character) {
        if (character && !checkPermissionAccess("curses_normal", character) && !checkPermissionAccess("curses_limited", character))
            return false;
        let assetGroups;
        if (mode === "items") {
            assetGroups = AssetGroup.filter(i => i.Category === "Item" && (includingEmpty || InventoryGet(Player, i.Name)));
        }
        else if (mode === "clothes") {
            assetGroups = AssetGroup.filter(i => i.Category === "Appearance" && i.Clothing && (includingEmpty || InventoryGet(Player, i.Name)));
        }
        else {
            console.error(`BCX: Attempt to curse in invalid mode`, mode);
            return false;
        }
        if (character) {
            logMessage("curse_change", LogEntryType.plaintext, `${character} cursed all of ${Player.Name}'s ` +
                `${includingEmpty ? "" : "occupied "}${mode === "items" ? "item" : "clothing"} slots`);
            if (!character.isPlayer()) {
                ChatRoomSendLocal(`${character} cursed all of your ${includingEmpty ? "" : "occupied "}${mode === "items" ? "item" : "clothing"} slots`);
            }
        }
        for (const group of assetGroups) {
            if (ConditionsGetCondition("curses", group.Name))
                continue;
            if (character && !ConditionsCheckAccess("curses", group.Name, character))
                continue;
            if (!curseItem(group.Name, null, null))
                return false;
        }
        return true;
    }
    function curseLift(Group, character) {
        var _a;
        if (!moduleIsEnabled(ModuleCategory.Curses))
            return false;
        if (character && !ConditionsCheckAccess("curses", Group, character))
            return false;
        const curse = ConditionsGetCondition("curses", Group);
        if (curse) {
            const group = AssetGroup.find(g => g.Name === Group);
            if (character && group) {
                const itemName = curse.data && ((_a = AssetGet(Player.AssetFamily, Group, curse.data.Name)) === null || _a === void 0 ? void 0 : _a.Description);
                if (itemName) {
                    logMessage("curse_change", LogEntryType.plaintext, `${character} lifted the curse on ${Player.Name}'s ${itemName}`);
                    if (!character.isPlayer()) {
                        ChatRoomSendLocal(`${character} lifted the curse on your ${itemName}`);
                    }
                }
                else {
                    logMessage("curse_change", LogEntryType.plaintext, `${character} lifted the curse on ${Player.Name}'s body part (${getVisibleGroupName(group)})`);
                    if (!character.isPlayer()) {
                        ChatRoomSendLocal(`${character} lifted the curse on part of your body (${getVisibleGroupName(group)})`);
                    }
                }
            }
            ConditionsRemoveCondition("curses", Group);
            return true;
        }
        return false;
    }
    function curseLiftAll(character) {
        if (!moduleIsEnabled(ModuleCategory.Curses))
            return false;
        if (character && (!checkPermissionAccess("curses_normal", character) || !checkPermissionAccess("curses_limited", character)))
            return false;
        if (character) {
            logMessage("curse_change", LogEntryType.plaintext, `${character} lifted all curse on ${Player.Name}`);
            if (!character.isPlayer()) {
                ChatRoomSendLocal(`${character} lifted all curses on you`);
            }
        }
        ConditionsRemoveCondition("curses", Object.keys(ConditionsGetCategoryData("curses").conditions));
        return true;
    }
    class ModuleCurses extends BaseModule {
        constructor() {
            super(...arguments);
            this.resetTimer = null;
            this.triggerCounts = new Map();
            this.suspendedUntil = null;
        }
        init() {
            registerPermission("curses_normal", {
                name: "Allows handling curses on non-limited object slots",
                category: ModuleCategory.Curses,
                defaults: {
                    [Preset.dominant]: [true, AccessLevel.lover],
                    [Preset.switch]: [true, AccessLevel.lover],
                    [Preset.submissive]: [false, AccessLevel.mistress],
                    [Preset.slave]: [false, AccessLevel.mistress]
                }
            });
            registerPermission("curses_limited", {
                name: "Allows handling curses on limited object slots",
                category: ModuleCategory.Curses,
                defaults: {
                    [Preset.dominant]: [true, AccessLevel.owner],
                    [Preset.switch]: [true, AccessLevel.owner],
                    [Preset.submissive]: [false, AccessLevel.lover],
                    [Preset.slave]: [false, AccessLevel.lover]
                }
            });
            registerPermission("curses_global_configuration", {
                name: "Allows editing the global curses configuration",
                category: ModuleCategory.Curses,
                defaults: {
                    [Preset.dominant]: [true, AccessLevel.owner],
                    [Preset.switch]: [true, AccessLevel.owner],
                    [Preset.submissive]: [false, AccessLevel.lover],
                    [Preset.slave]: [false, AccessLevel.lover]
                }
            });
            registerPermission("curses_change_limits", {
                name: "Allows to limit/block individual curse object slots",
                category: ModuleCategory.Curses,
                defaults: {
                    [Preset.dominant]: [true, AccessLevel.self],
                    [Preset.switch]: [true, AccessLevel.self],
                    [Preset.submissive]: [true, AccessLevel.self],
                    [Preset.slave]: [false, AccessLevel.owner]
                }
            });
            registerPermission("curses_color", {
                name: "Allow changing colors of cursed objects",
                category: ModuleCategory.Curses,
                defaults: {
                    [Preset.dominant]: [true, AccessLevel.lover],
                    [Preset.switch]: [true, AccessLevel.lover],
                    [Preset.submissive]: [true, AccessLevel.mistress],
                    [Preset.slave]: [false, AccessLevel.mistress]
                }
            });
            queryHandlers.curseItem = (sender, resolve, data) => {
                if (isObject$1(data) && typeof data.Group === "string" && (typeof data.curseProperties === "boolean" || data.curseProperties === null)) {
                    resolve(true, curseItem(data.Group, data.curseProperties, sender));
                }
                else {
                    resolve(false);
                }
            };
            queryHandlers.curseLift = (sender, resolve, data) => {
                if (typeof data === "string") {
                    resolve(true, curseLift(data, sender));
                }
                else {
                    resolve(false);
                }
            };
            queryHandlers.curseBatch = (sender, resolve, data) => {
                if (isObject$1(data) && typeof data.mode === "string" && typeof data.includingEmpty === "boolean") {
                    resolve(true, curseBatch(data.mode, data.includingEmpty, sender));
                }
                else {
                    resolve(false);
                }
            };
            queryHandlers.curseLiftAll = (sender, resolve) => {
                resolve(true, curseLiftAll(sender));
            };
            registerWhisperCommand("curses", "- Manage curses", (argv, sender, respond) => {
                var _a;
                if (!moduleIsEnabled(ModuleCategory.Curses)) {
                    return respond(`Curses module is disabled.`);
                }
                const subcommand = (argv[0] || "").toLocaleLowerCase();
                const cursesInfo = ConditionsGetCategoryPublicData("curses", sender).conditions;
                if (ConditionsSubcommands.includes(subcommand)) {
                    return ConditionsRunSubcommand("curses", argv, sender, respond);
                }
                else if (subcommand === "list") {
                    let result = "Current curses:";
                    for (const [k, v] of Object.entries(cursesInfo)) {
                        const group = AssetGroup.find(g => g.Name === k);
                        if (!group) {
                            console.warn(`BCX: Unknown group ${k}`);
                            continue;
                        }
                        result += `\n[${group.Clothing ? "Clothing" : "Item"}] `;
                        if (v.data === null) {
                            result += `Blocked: ${getVisibleGroupName(group)}`;
                        }
                        else {
                            const item = AssetGet(Player.AssetFamily, k, v.data.Name);
                            result += `${(_a = item === null || item === void 0 ? void 0 : item.Description) !== null && _a !== void 0 ? _a : v.data.Name} (${getVisibleGroupName(group)})`;
                        }
                    }
                    respond(result);
                }
                else if (subcommand === "listgroups") {
                    const listgroup = (argv[1] || "").toLocaleLowerCase();
                    if (listgroup === "items") {
                        let result = `List of item groups:`;
                        const AssetGroupItems = AssetGroup.filter(g => g.Category === "Item");
                        for (const group of AssetGroupItems) {
                            const currentItem = InventoryGet(Player, group.Name);
                            const itemIsCursed = cursesInfo[group.Name] !== undefined;
                            result += `\n${getVisibleGroupName(group)}: ${currentItem ? currentItem.Asset.Description : "[Nothing]"}`;
                            if (itemIsCursed) {
                                result += ` [cursed]`;
                            }
                        }
                        respond(result);
                    }
                    else if (listgroup === "clothes") {
                        let result = `List of clothes groups:`;
                        const AssetGroupClothings = AssetGroup.filter(g => g.Category === "Appearance" && g.Clothing);
                        for (const group of AssetGroupClothings) {
                            const currentItem = InventoryGet(Player, group.Name);
                            const clothingIsCursed = cursesInfo[group.Name] !== undefined;
                            result += `\n${getVisibleGroupName(group)}: ${currentItem ? currentItem.Asset.Description : "[Nothing]"}`;
                            if (clothingIsCursed) {
                                result += ` [cursed]`;
                            }
                        }
                        respond(result);
                    }
                    else {
                        respond(Command_fixExclamationMark(sender, `Expected one of:\n` +
                            `!curses listgroups items\n` +
                            `!curses listgroups clothes`));
                    }
                }
                else if (subcommand === "curse") {
                    const group = Command_selectGroup(argv[1] || "", getPlayerCharacter(), G => G.Category !== "Appearance" || G.Clothing);
                    if (typeof group === "string") {
                        return respond(group);
                    }
                    if (cursesInfo[group.Name] !== undefined) {
                        return respond(`This group or item is already cursed`);
                    }
                    respond(curseItem(group.Name, null, sender) ? `Ok.` : COMMAND_GENERIC_ERROR);
                }
                else if (subcommand === "curseworn" || subcommand === "curseall") {
                    const group = (argv[1] || "").toLocaleLowerCase();
                    if (group === "items" || group === "clothes") {
                        return respond(curseBatch(group, subcommand === "curseall", sender) ? `Ok.` : COMMAND_GENERIC_ERROR);
                    }
                    respond(Command_fixExclamationMark(sender, `Expected one of:\n` +
                        `!curses ${subcommand} items\n` +
                        `!curses ${subcommand} clothes`));
                }
                else if (subcommand === "lift") {
                    const group = Command_selectGroup(argv[1] || "", getPlayerCharacter(), G => G.Category !== "Appearance" || G.Clothing);
                    if (typeof group === "string") {
                        return respond(group);
                    }
                    if (cursesInfo[group.Name] === undefined) {
                        return respond(`This group or item is not cursed`);
                    }
                    respond(curseLift(group.Name, sender) ? `Ok.` : COMMAND_GENERIC_ERROR);
                }
                else if (subcommand === "liftall") {
                    respond(curseLiftAll(sender) ? `Ok.` : COMMAND_GENERIC_ERROR);
                }
                else if (subcommand === "configuration") {
                    const group = Command_selectGroup(argv[1] || "", getPlayerCharacter(), G => G.Category !== "Appearance" || G.Clothing);
                    if (typeof group === "string") {
                        return respond(group);
                    }
                    const curse = cursesInfo[group.Name];
                    if (!curse) {
                        return respond(`This group or item is not cursed`);
                    }
                    const target = (argv[2] || "").toLocaleLowerCase();
                    if (target !== "yes" && target !== "no") {
                        return respond(`Expected yes or no`);
                    }
                    if (curse.data == null) {
                        return respond(`Empty groups cannot have configuration cursed`);
                    }
                    const asset = AssetGet(Player.AssetFamily, group.Name, cursesInfo[group.Name].data.Name);
                    if (asset && target === "yes" && !curseAllowItemCurseProperty(asset)) {
                        return respond(`This item cannot have configuration cursed`);
                    }
                    curse.data.curseProperties = target === "yes";
                    respond(ConditionsUpdate("curses", group.Name, curse, sender) ? `Ok.` : COMMAND_GENERIC_ERROR);
                }
                else {
                    respond(Command_fixExclamationMark(sender, `!curses usage:\n` +
                        `!curses list - List all active curses and related info\n` +
                        `!curses listgroups <items|clothes> - Lists all possible item or clothing group slots\n` +
                        `!curses curse <group> - Places a curse on the specified item or clothing <group>\n` +
                        `!curses curseworn <items|clothes> - Place a curse on all currenty worn items/clothes\n` +
                        `!curses curseall <items|clothes> - Place a curse on all item/cloth slots, both used and empty\n` +
                        `!curses lift <group> - Lifts (removes) the curse from the specified item or clothing <group>\n` +
                        `!curses liftall - Lifts (removes) all curses\n` +
                        `!curses configuration <group> <yes|no> - Curses or uncurses the usage configuration of an item or clothing in <group>`));
                    respond(Command_fixExclamationMark(sender, `!curses setactive <group> <yes/no> - Switch the curse and its conditions on and off\n` +
                        `!curses triggers <group> global <yes/no> - Set the trigger condition of this curse to the global configuration\n` +
                        `!curses triggers <group> help - Set the trigger configuration of a curse\n` +
                        `!curses globaltriggers help - Set global trigger configuration\n` +
                        `!curses timer <group> help - Set timer options of a curse\n` +
                        `!curses defaulttimer help - Set default timer options used on new curses\n\n` +
                        `Hint: If an argument contains spaces: "put it in quotes"`));
                }
            }, (argv, sender) => {
                if (!moduleIsEnabled(ModuleCategory.Curses)) {
                    return [];
                }
                if (argv.length <= 1) {
                    return Command_pickAutocomplete(argv[0], ["list", "listgroups", "curse", "curseworn", "curseall", "lift", "liftall", "configuration", ...ConditionsSubcommands]);
                }
                const subcommand = argv[0].toLocaleLowerCase();
                const cursesInfo = ConditionsGetCategoryPublicData("curses", sender).conditions;
                if (ConditionsSubcommands.includes(subcommand)) {
                    return ConditionsAutocompleteSubcommand("curses", argv, sender);
                }
                else if (subcommand === "listgroups") {
                    if (argv.length === 2) {
                        return Command_pickAutocomplete(argv[1], ["items", "clothes"]);
                    }
                }
                else if (subcommand === "curse") {
                    if (argv.length === 2) {
                        return Command_selectGroupAutocomplete(argv[1] || "", getPlayerCharacter(), G => G.Category !== "Appearance" || G.Clothing);
                    }
                }
                else if (subcommand === "curseworn" || subcommand === "curseall") {
                    if (argv.length === 2) {
                        return Command_pickAutocomplete(argv[1], ["items", "clothes"]);
                    }
                }
                else if (subcommand === "lift") {
                    if (argv.length === 2) {
                        return Command_selectGroupAutocomplete(argv[1] || "", getPlayerCharacter(), G => cursesInfo[G.Name] !== undefined);
                    }
                }
                else if (subcommand === "configuration") {
                    if (argv.length === 2) {
                        return Command_selectGroupAutocomplete(argv[1] || "", getPlayerCharacter(), G => cursesInfo[G.Name] !== undefined);
                    }
                    else if (argv.length === 3) {
                        return Command_pickAutocomplete(argv[2], ["yes", "no"]);
                    }
                }
                return [];
            });
            ConditionsRegisterCategory("curses", {
                category: ModuleCategory.Curses,
                permission_normal: "curses_normal",
                permission_limited: "curses_limited",
                permission_configure: "curses_global_configuration",
                permission_changeLimits: "curses_change_limits",
                loadValidateConditionKey: (group) => AssetGroup.some(g => g.Name === group),
                loadValidateCondition: (group, data) => {
                    const info = data.data;
                    if (info === null)
                        return true;
                    if (!isObject$1(info) ||
                        typeof info.Name !== "string" ||
                        typeof info.curseProperty !== "boolean") {
                        console.error(`BCX: Bad data for cursed item in group ${group}, removing it`, info);
                        return false;
                    }
                    if (AssetGet("Female3DCG", group, info.Name) == null) {
                        console.warn(`BCX: Unknown cursed item ${group}:${info.Name}, removing it`, info);
                        return false;
                    }
                    return true;
                },
                tickHandler: this.curseTick.bind(this),
                makePublicData: (group, data) => {
                    if (data.data === null) {
                        return null;
                    }
                    return {
                        Name: data.data.Name,
                        curseProperties: data.data.curseProperty
                    };
                },
                validatePublicData: (group, data) => data === null ||
                    isObject$1(data) &&
                        typeof data.Name === "string" &&
                        typeof data.curseProperties === "boolean",
                updateCondition: (condition, data, updateData) => {
                    var _a;
                    // Update cannot change cursed item
                    if (((_a = data.data) === null || _a === void 0 ? void 0 : _a.Name) !== (updateData === null || updateData === void 0 ? void 0 : updateData.Name))
                        return false;
                    // Nothing to update on empty slot
                    if (!data.data || !updateData)
                        return true;
                    const asset = AssetGet(Player.AssetFamily, condition, data.data.Name);
                    if (!asset) {
                        console.warn(`BCX: Curse asset ${condition}:${data.data.Name} not found during update`);
                        return false;
                    }
                    data.data.curseProperty = updateData.curseProperties;
                    if (!curseAllowItemCurseProperty(asset) && data.data.curseProperty) {
                        console.warn(`BCX: Attempt to curse properties of item ${condition}:${data.data.Name}, while not allowed`);
                        data.data.curseProperty = false;
                    }
                    return true;
                },
                parseConditionName: (selector, onlyExisting) => {
                    const group = Command_selectGroup(selector, getPlayerCharacter(), G => (G.Category !== "Appearance" || G.Clothing) && (!onlyExisting || onlyExisting.includes(G.Name)));
                    if (typeof group === "string") {
                        return [false, group];
                    }
                    return [true, group.Name];
                },
                autocompleteConditionName: (selector, onlyExisting) => {
                    return Command_selectGroupAutocomplete(selector, getPlayerCharacter(), G => (G.Category !== "Appearance" || G.Clothing) && (!onlyExisting || onlyExisting.includes(G.Name)));
                },
                logLimitChange: (group, character, newLimit) => {
                    logMessage("curse_change", LogEntryType.plaintext, `${character} changed ${Player.Name}'s curse slot '${group}' permission to ${newLimit}`);
                    if (!character.isPlayer()) {
                        ChatRoomSendLocal(`${character} changed curse slot '${group}' permission to ${newLimit}`, undefined, character.MemberNumber);
                    }
                },
                logConditionUpdate: (group, character, newData, oldData) => {
                    var _a, _b, _c;
                    const assetGroup = AssetGroup.find(g => g.Name === group);
                    const visibleName = assetGroup ? getVisibleGroupName(assetGroup) : "[ERROR]";
                    const didTimerChange = newData.timer !== oldData.timer || newData.timerRemove !== oldData.timerRemove;
                    const didTriggerChange = !isEqual(newData.requirements, oldData.requirements);
                    const didItemConfigCurseChange = ((_a = newData.data) === null || _a === void 0 ? void 0 : _a.curseProperties) !== ((_b = oldData.data) === null || _b === void 0 ? void 0 : _b.curseProperties);
                    const changeEvents = [];
                    if (didTimerChange)
                        changeEvents.push("timer");
                    if (didTriggerChange)
                        changeEvents.push("trigger condition");
                    if (didItemConfigCurseChange)
                        changeEvents.push("item config curse");
                    if (changeEvents.length > 0) {
                        logMessage("curse_change", LogEntryType.plaintext, `${character} changed the ${changeEvents.join(", ")} of ${Player.Name}'s curse on slot '${visibleName}'`);
                    }
                    if (!character.isPlayer()) {
                        if (newData.timer !== oldData.timer)
                            if (newData.timer === null) {
                                ChatRoomSendLocal(`${character} disabled the timer of the curse on slot '${visibleName}'`, undefined, character.MemberNumber);
                            }
                            else {
                                ChatRoomSendLocal(`${character} changed the duration of the timer of the curse on slot '${visibleName}' to ${formatTimeInterval(newData.timer - Date.now())}`, undefined, character.MemberNumber);
                            }
                        if (newData.timer !== null && newData.timerRemove !== oldData.timerRemove)
                            ChatRoomSendLocal(`${character} changed the timer behavior of the curse on slot '${visibleName}' to ${newData.timerRemove ? "remove" : "disable"} the curse when time runs out`, undefined, character.MemberNumber);
                        if (didTriggerChange)
                            if (newData.requirements === null) {
                                ChatRoomSendLocal(`${character} set the triggers of curse on slot '${visibleName}' to the global curses configuration`, undefined, character.MemberNumber);
                            }
                            else {
                                const triggers = [];
                                const r = newData.requirements;
                                if (r.room) {
                                    triggers.push(`When ${r.room.inverted ? "not in" : "in"} ${r.room.type} room`);
                                }
                                if (r.roomName) {
                                    triggers.push(`When ${r.roomName.inverted ? "not in" : "in"} room named '${r.roomName.name}'`);
                                }
                                if (r.role) {
                                    const role = capitalizeFirstLetter(AccessLevel[r.role.role]) + (r.role.role !== AccessLevel.clubowner ? " ↑" : "");
                                    triggers.push(`When ${r.role.inverted ? "not in" : "in"} room with role '${role}'`);
                                }
                                if (r.player) {
                                    const name = getCharacterName(r.player.memberNumber, null);
                                    triggers.push(`When ${r.player.inverted ? "not in" : "in"} room with member '${r.player.memberNumber}'${name ? ` (${name})` : ""}`);
                                }
                                if (triggers.length > 0) {
                                    ChatRoomSendLocal(`${character} set the curse on slot ${visibleName} to trigger under following conditions:\n` + triggers.join("\n"), undefined, character.MemberNumber);
                                }
                                else {
                                    ChatRoomSendLocal(`${character} deactivated all trigger conditions of the curse on slot ${visibleName}. The curse will now always trigger, while it is active`, undefined, character.MemberNumber);
                                }
                            }
                        if (didItemConfigCurseChange)
                            ChatRoomSendLocal(`${character} ${((_c = newData.data) === null || _c === void 0 ? void 0 : _c.curseProperties) ? "cursed" : "lifted the curse of"} the '${visibleName}' item's configuration`, undefined, character.MemberNumber);
                    }
                },
                logCategoryUpdate: (character, newData, oldData) => {
                    const didTimerChange = newData.timer !== oldData.timer || newData.timerRemove !== oldData.timerRemove;
                    const didTriggerChange = !isEqual(newData.requirements, oldData.requirements);
                    const changeEvents = [];
                    if (didTimerChange)
                        changeEvents.push("default timer");
                    if (didTriggerChange)
                        changeEvents.push("trigger condition");
                    if (changeEvents.length > 0) {
                        logMessage("curse_change", LogEntryType.plaintext, `${character} changed the ${changeEvents.join(", ")} of ${Player.Name}'s global curses config`);
                    }
                    if (!character.isPlayer()) {
                        if (newData.timer !== oldData.timer)
                            if (newData.timer === null) {
                                ChatRoomSendLocal(`${character} removed the default timer of the global curses configuration`, undefined, character.MemberNumber);
                            }
                            else {
                                ChatRoomSendLocal(`${character} changed the default timer of the global curses configuration to ${formatTimeInterval(newData.timer)}`, undefined, character.MemberNumber);
                            }
                        if (newData.timer !== null && newData.timerRemove !== oldData.timerRemove)
                            ChatRoomSendLocal(`${character} changed the default timeout behavior of the global curses configuration to ${newData.timerRemove ? "removal of curses" : "disabling curses"} when time runs out`, undefined, character.MemberNumber);
                        if (didTriggerChange) {
                            const triggers = [];
                            const r = newData.requirements;
                            if (r.room) {
                                triggers.push(`When ${r.room.inverted ? "not in" : "in"} ${r.room.type} room`);
                            }
                            if (r.roomName) {
                                triggers.push(`When ${r.roomName.inverted ? "not in" : "in"} room named '${r.roomName.name}'`);
                            }
                            if (r.role) {
                                const role = capitalizeFirstLetter(AccessLevel[r.role.role]) + (r.role.role !== AccessLevel.clubowner ? " ↑" : "");
                                triggers.push(`When ${r.role.inverted ? "not in" : "in"} room with role '${role}'`);
                            }
                            if (r.player) {
                                const name = getCharacterName(r.player.memberNumber, null);
                                triggers.push(`When ${r.player.inverted ? "not in" : "in"} room with member '${r.player.memberNumber}'${name ? ` (${name})` : ""}`);
                            }
                            if (triggers.length > 0) {
                                ChatRoomSendLocal(`${character} set the global curses configuration to trigger curses under following conditions:\n` + triggers.join("\n"), undefined, character.MemberNumber);
                            }
                            else {
                                ChatRoomSendLocal(`${character} deactivated all trigger conditions for the global curses configuration. Curses set to this default configuration will now always trigger, while active`, undefined, character.MemberNumber);
                            }
                        }
                    }
                }
            });
        }
        load() {
            if (!moduleIsEnabled(ModuleCategory.Curses)) {
                return;
            }
            hookFunction("ValidationResolveModifyDiff", 0, (args, next) => {
                const params = args[2];
                const result = next(args);
                if (params.C.ID === 0 && result.item) {
                    const condition = ConditionsGetCondition("curses", result.item.Asset.Group.Name);
                    const curse = condition === null || condition === void 0 ? void 0 : condition.data;
                    const character = getChatroomCharacter(params.sourceMemberNumber);
                    if (curse &&
                        !itemColorsEquals(curse.Color, result.item.Color) &&
                        character &&
                        checkPermissionAccess("curses_color", character)) {
                        if (result.item.Color && result.item.Color !== "Default") {
                            curse.Color = cloneDeep(result.item.Color);
                        }
                        else {
                            delete curse.Color;
                        }
                        modStorageSync();
                    }
                }
                return result;
            }, ModuleCategory.Curses);
            hookFunction("ColorPickerDraw", 0, (args, next) => {
                const Callback = args[5];
                if (Callback === ItemColorOnPickerChange) {
                    args[5] = (color) => {
                        if (ItemColorCharacter === Player && ItemColorItem) {
                            // Original code
                            const newColors = ItemColorState.colors.slice();
                            ItemColorPickerIndices.forEach(i => newColors[i] = color);
                            ItemColorItem.Color = newColors;
                            CharacterLoadCanvas(ItemColorCharacter);
                            // Curse color change code
                            const condition = ConditionsGetCondition("curses", ItemColorItem.Asset.Group.Name);
                            const curse = condition === null || condition === void 0 ? void 0 : condition.data;
                            if (curse &&
                                !itemColorsEquals(curse.Color, ItemColorItem.Color) &&
                                checkPermissionAccess("curses_color", getPlayerCharacter())) {
                                if (ItemColorItem.Color && ItemColorItem.Color !== "Default") {
                                    curse.Color = cloneDeep(ItemColorItem.Color);
                                }
                                else {
                                    delete curse.Color;
                                }
                                console.debug("Picker curse color change trigger");
                                modStorageSync();
                            }
                        }
                        else {
                            Callback(color);
                        }
                    };
                }
                return next(args);
            });
        }
        run() {
            if (!moduleIsEnabled(ModuleCategory.Curses))
                return;
            this.resetTimer = setInterval(() => {
                this.triggerCounts.clear();
            }, CURSES_ANTILOOP_RESET_INTERVAL);
        }
        unload() {
            if (this.resetTimer !== null) {
                clearInterval(this.resetTimer);
                this.resetTimer = null;
            }
        }
        reload() {
            this.unload();
            this.load();
            this.run();
        }
        curseTick(group, condition) {
            var _a, _b, _c;
            if (this.suspendedUntil !== null) {
                if (Date.now() >= this.suspendedUntil) {
                    this.suspendedUntil = null;
                    this.triggerCounts.clear();
                    ChatRoomActionMessage(`The dormant curse on ${Player.Name}'s body wakes up again.`);
                }
                else {
                    return;
                }
            }
            const curse = condition.data;
            if (curse === null) {
                const current = InventoryGet(Player, group);
                if (current) {
                    InventoryRemove(Player, group, false);
                    CharacterRefresh(Player, true);
                    ChatRoomCharacterUpdate(Player);
                    ChatRoomActionMessage(`${Player.Name}'s body seems to be cursed and the ${current.Asset.Description} just falls off her body`);
                    logMessage("curse_trigger", LogEntryType.plaintext, `The curse on ${Player.Name}'s body prevented a ${current.Asset.Description} from being added to it`);
                    return;
                }
                return;
            }
            const asset = AssetGet("Female3DCG", group, curse.Name);
            if (!asset) {
                console.error(`BCX: Asset not found for curse ${group}:${curse.Name}`, curse);
                return;
            }
            let changeType = "";
            const CHANGE_TEXTS = {
                add: `The curse on ${Player.Name}'s ${asset.Description} wakes up and the item reappears`,
                swap: `The curse on ${Player.Name}'s ${asset.Description} wakes up, not allowing the item to be replaced by another item`,
                update: `The curse on ${Player.Name}'s ${asset.Description} wakes up and undos all changes to the item`,
                color: `The curse on ${Player.Name}'s ${asset.Description} wakes up, changing the color of the item back`
            };
            const CHANGE_LOGS = {
                add: `The curse on ${Player.Name}'s ${asset.Description} made the item reappear`,
                swap: `The curse on ${Player.Name}'s ${asset.Description} prevented replacing the item`,
                update: `The curse on ${Player.Name}'s ${asset.Description} reverted all changes to the item`,
                color: `The curse on ${Player.Name}'s ${asset.Description} reverted the color of the item`
            };
            let currentItem = InventoryGet(Player, group);
            if (currentItem && currentItem.Asset.Name !== curse.Name) {
                InventoryRemove(Player, group, false);
                changeType = "swap";
                currentItem = null;
            }
            if (!currentItem) {
                currentItem = {
                    Asset: asset,
                    Color: curse.Color != null ? cloneDeep(curse.Color) : "Default",
                    Property: curse.Property != null ? cloneDeep(curse.Property) : {},
                    Difficulty: curse.Difficulty != null ? curse.Difficulty : 0
                };
                Player.Appearance.push(currentItem);
                if (!changeType)
                    changeType = "add";
            }
            const itemProperty = currentItem.Property = ((_a = currentItem.Property) !== null && _a !== void 0 ? _a : {});
            let curseProperty = (_b = curse.Property) !== null && _b !== void 0 ? _b : {};
            if (curse.curseProperty) {
                for (const key of arrayUnique(Object.keys(curseProperty).concat(Object.keys(itemProperty)))) {
                    if (key === "Effect")
                        continue;
                    if (CURSE_IGNORED_PROPERTIES.includes(key)) {
                        if (curseProperty[key] !== undefined) {
                            delete curseProperty[key];
                        }
                        continue;
                    }
                    if (curseProperty[key] === undefined) {
                        if (itemProperty[key] !== undefined) {
                            delete itemProperty[key];
                            if (!changeType)
                                changeType = "update";
                        }
                    }
                    else if (typeof curseProperty[key] !== typeof itemProperty[key] ||
                        !isEqual(curseProperty[key], itemProperty[key])) {
                        itemProperty[key] = cloneDeep(curseProperty[key]);
                        if (!changeType)
                            changeType = "update";
                    }
                }
                const itemIgnoredEffects = Array.isArray(itemProperty.Effect) ? itemProperty.Effect.filter(i => CURSE_IGNORED_EFFECTS.includes(i)) : [];
                const itemEffects = Array.isArray(itemProperty.Effect) ? itemProperty.Effect.filter(i => !CURSE_IGNORED_EFFECTS.includes(i)) : [];
                const curseEffects = Array.isArray(curseProperty.Effect) ? curseProperty.Effect.filter(i => !CURSE_IGNORED_EFFECTS.includes(i)) : [];
                if (!CommonArraysEqual(itemEffects, curseEffects)) {
                    itemProperty.Effect = curseEffects.concat(itemIgnoredEffects);
                }
                else if (Array.isArray(itemProperty.Effect) && itemProperty.Effect.length > 0) {
                    curseProperty.Effect = itemProperty.Effect.slice();
                }
                else {
                    delete curseProperty.Effect;
                }
            }
            else {
                if (!isEqual(curseProperty, itemProperty)) {
                    curseProperty = cloneDeep(itemProperty);
                    for (const key of CURSE_IGNORED_PROPERTIES) {
                        delete curseProperty[key];
                    }
                }
            }
            if (Object.keys(curseProperty).length === 0) {
                if (curse.Property !== undefined) {
                    delete curse.Property;
                }
            }
            else if (!isEqual(curse.Property, curseProperty)) {
                curse.Property = curseProperty;
            }
            if (!itemColorsEquals(curse.Color, currentItem.Color)) {
                if (curse.Color === undefined || curse.Color === "Default") {
                    delete currentItem.Color;
                }
                else {
                    currentItem.Color = cloneDeep(curse.Color);
                }
                if (!changeType)
                    changeType = "color";
            }
            if (changeType) {
                CharacterRefresh(Player, true);
                ChatRoomCharacterUpdate(Player);
                if (CHANGE_TEXTS[changeType]) {
                    ChatRoomActionMessage(CHANGE_TEXTS[changeType]);
                    logMessage("curse_trigger", LogEntryType.plaintext, CHANGE_LOGS[changeType]);
                }
                else {
                    console.error(`BCX: No chat message for curse action ${changeType}`);
                }
                const counter = ((_c = this.triggerCounts.get(group)) !== null && _c !== void 0 ? _c : 0) + 1;
                this.triggerCounts.set(group, counter);
                if (counter >= CURSES_ANTILOOP_THRESHOLD) {
                    ChatRoomActionMessage("Protection triggered: Curses have been disabled for 10 minutes. Please refrain from triggering curses so rapidly, as it creates strain on the server and may lead to unwanted side effects! If you believe this message was triggered by a bug, please report it to BCX Discord.");
                    this.suspendedUntil = Date.now() + CURSES_ANTILOOP_SUSPEND_TIME;
                }
            }
        }
    }

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
        getDisabledModules(timeout) {
            return sendQuery("disabledModules", undefined, this.MemberNumber, timeout).then(data => {
                if (!Array.isArray(data)) {
                    throw new Error("Bad data");
                }
                return data.filter(i => TOGGLEABLE_MODULES.includes(i));
            });
        }
        getPermissions() {
            return sendQuery("permissions", undefined, this.MemberNumber).then(data => {
                if (!isObject$1(data) ||
                    Object.values(data).some(v => !Array.isArray(v) ||
                        typeof v[0] !== "boolean" ||
                        typeof v[1] !== "number" ||
                        AccessLevel[v[1]] === undefined)) {
                    throw new Error("Bad data");
                }
                return getPermissionDataFromBundle(data);
            });
        }
        getPermissionAccess(permission) {
            return sendQuery("permissionAccess", permission, this.MemberNumber).then(data => {
                if (typeof data !== "boolean") {
                    throw new Error("Bad data");
                }
                return data;
            }).catch(err => {
                console.error(`BCX: Error while querying permission "${permission}" access for ${this}`, err);
                return false;
            });
        }
        getMyAccessLevel() {
            return sendQuery("myAccessLevel", undefined, this.MemberNumber).then(data => {
                if (typeof data !== "number" || AccessLevel[data] === undefined) {
                    throw new Error("Bad data");
                }
                return data;
            });
        }
        setPermission(permission, type, target) {
            return sendQuery("editPermission", {
                permission,
                edit: type,
                target
            }, this.MemberNumber).then(data => {
                if (typeof data !== "boolean") {
                    throw new Error("Bad data");
                }
                return data;
            });
        }
        getRolesData() {
            return sendQuery("rolesData", undefined, this.MemberNumber).then(data => {
                if (!isObject$1(data) ||
                    !Array.isArray(data.mistresses) ||
                    !data.mistresses.every(i => Array.isArray(i) && i.length === 2 && typeof i[0] === "number" && typeof i[1] === "string") ||
                    !Array.isArray(data.owners) ||
                    !data.owners.every(i => Array.isArray(i) && i.length === 2 && typeof i[0] === "number" && typeof i[1] === "string") ||
                    typeof data.allowAddMistress !== "boolean" ||
                    typeof data.allowRemoveMistress !== "boolean" ||
                    typeof data.allowAddOwner !== "boolean" ||
                    typeof data.allowRemoveOwner !== "boolean") {
                    throw new Error("Bad data");
                }
                return data;
            });
        }
        editRole(role, action, target) {
            return sendQuery("editRole", {
                type: role,
                action,
                target
            }, this.MemberNumber).then(data => {
                if (typeof data !== "boolean") {
                    throw new Error("Bad data");
                }
                return data;
            });
        }
        getLogEntries() {
            return sendQuery("logData", undefined, this.MemberNumber).then(data => {
                if (!Array.isArray(data) ||
                    !data.every(e => Array.isArray(e) &&
                        e.length === 4 &&
                        typeof e[0] === "number" &&
                        typeof e[1] === "number" &&
                        typeof e[2] === "number")) {
                    throw new Error("Bad data");
                }
                return data;
            });
        }
        logMessageDelete(time) {
            return sendQuery("logDelete", time, this.MemberNumber).then(data => {
                if (typeof data !== "boolean") {
                    throw new Error("Bad data");
                }
                return data;
            });
        }
        getLogConfig() {
            return sendQuery("logConfigGet", undefined, this.MemberNumber).then(data => {
                var _a;
                if (!isObject$1(data) ||
                    Object.values(data).some(v => typeof v !== "number")) {
                    throw new Error("Bad data");
                }
                for (const k of Object.keys(data)) {
                    if (data[k] == null || ((_a = modStorage.logConfig) === null || _a === void 0 ? void 0 : _a[k]) === undefined || LogAccessLevel[data[k]] === undefined) {
                        delete data[k];
                    }
                }
                return data;
            });
        }
        setLogConfig(category, target) {
            return sendQuery("logConfigEdit", {
                category,
                target
            }, this.MemberNumber).then(data => {
                if (typeof data !== "boolean") {
                    throw new Error("Bad data");
                }
                return data;
            });
        }
        logClear() {
            return sendQuery("logClear", undefined, this.MemberNumber).then(data => {
                if (typeof data !== "boolean") {
                    throw new Error("Bad data");
                }
                return data;
            });
        }
        logPraise(value, message) {
            return sendQuery("logPraise", {
                message,
                value
            }, this.MemberNumber).then(data => {
                if (typeof data !== "boolean") {
                    throw new Error("Bad data");
                }
                return data;
            });
        }
        logGetAllowedActions() {
            return sendQuery("logGetAllowedActions", undefined, this.MemberNumber).then(data => {
                if (!isObject$1(data) ||
                    typeof data.delete !== "boolean" ||
                    typeof data.configure !== "boolean" ||
                    typeof data.praise !== "boolean" ||
                    typeof data.leaveMessage !== "boolean") {
                    throw new Error("Bad data");
                }
                return data;
            });
        }
        curseItem(Group, curseProperties) {
            return sendQuery("curseItem", { Group, curseProperties }, this.MemberNumber).then(data => {
                if (typeof data !== "boolean") {
                    throw new Error("Bad data");
                }
                return data;
            });
        }
        curseLift(Group) {
            return sendQuery("curseLift", Group, this.MemberNumber).then(data => {
                if (typeof data !== "boolean") {
                    throw new Error("Bad data");
                }
                return data;
            });
        }
        curseBatch(mode, includingEmpty) {
            return sendQuery("curseBatch", { mode, includingEmpty }, this.MemberNumber).then(data => {
                if (typeof data !== "boolean") {
                    throw new Error("Bad data");
                }
                return data;
            });
        }
        curseLiftAll() {
            return sendQuery("curseLiftAll", undefined, this.MemberNumber).then(data => {
                if (typeof data !== "boolean") {
                    throw new Error("Bad data");
                }
                return data;
            });
        }
        conditionsGetByCategory(category) {
            return sendQuery("conditionsGet", category, this.MemberNumber).then(data => {
                if (!guard_ConditionsCategoryPublicData(category, data)) {
                    throw new Error("Bad data");
                }
                return data;
            });
        }
        conditionSetLimit(category, condition, limit) {
            return sendQuery("conditionSetLimit", { category, condition, limit }, this.MemberNumber).then(data => {
                if (typeof data !== "boolean") {
                    throw new Error("Bad data");
                }
                return data;
            });
        }
        conditionUpdate(category, condition, data) {
            return sendQuery("conditionUpdate", { category, condition, data }, this.MemberNumber).then(res => {
                if (typeof res !== "boolean") {
                    throw new Error("Bad data");
                }
                return res;
            });
        }
        conditionCategoryUpdate(category, data) {
            return sendQuery("conditionCategoryUpdate", { category, data }, this.MemberNumber).then(res => {
                if (typeof res !== "boolean") {
                    throw new Error("Bad data");
                }
                return res;
            });
        }
        hasAccessToPlayer() {
            return ServerChatRoomGetAllowItem(this.Character, Player);
        }
        playerHasAccessToCharacter() {
            return ServerChatRoomGetAllowItem(Player, this.Character);
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
        getDisabledModules() {
            return Promise.resolve(getDisabledModules());
        }
        getPermissions() {
            return Promise.resolve(getPlayerPermissionSettings());
        }
        getPermissionAccess(permission) {
            return Promise.resolve(checkPermissionAccess(permission, this));
        }
        getMyAccessLevel() {
            return Promise.resolve(AccessLevel.self);
        }
        setPermission(permission, type, target) {
            if (type === "self") {
                if (typeof target !== "boolean") {
                    throw new Error("Invalid target value for self permission edit");
                }
                return Promise.resolve(setPermissionSelfAccess(permission, target, this));
            }
            else {
                if (typeof target !== "number") {
                    throw new Error("Invalid target value for min permission edit");
                }
                return Promise.resolve(setPermissionMinAccess(permission, target, this));
            }
        }
        getRolesData() {
            return Promise.resolve(getPlayerRoleData(this));
        }
        editRole(role, action, target) {
            return Promise.resolve(editRole(role, action, target, this));
        }
        getLogEntries() {
            return Promise.resolve(getVisibleLogEntries(this));
        }
        logMessageDelete(time) {
            return Promise.resolve(logMessageDelete(time, this));
        }
        getLogConfig() {
            return Promise.resolve(logGetConfig());
        }
        setLogConfig(category, target) {
            return Promise.resolve(logConfigSet(category, target, this));
        }
        logClear() {
            return Promise.resolve(logClear(this));
        }
        logPraise(value, message) {
            return Promise.resolve(logPraise(value, message, this));
        }
        logGetAllowedActions() {
            return Promise.resolve(logGetAllowedActions(this));
        }
        curseItem(Group, curseProperties) {
            return Promise.resolve(curseItem(Group, curseProperties, this));
        }
        curseLift(Group) {
            return Promise.resolve(curseLift(Group, this));
        }
        curseBatch(mode, includingEmpty) {
            return Promise.resolve(curseBatch(mode, includingEmpty, this));
        }
        curseLiftAll() {
            return Promise.resolve(curseLiftAll(this));
        }
        conditionsGetByCategory(category) {
            return Promise.resolve(ConditionsGetCategoryPublicData(category, this));
        }
        conditionSetLimit(category, condition, limit) {
            return Promise.resolve(ConditionsSetLimit(category, condition, limit, this));
        }
        conditionUpdate(category, condition, data) {
            return Promise.resolve(ConditionsUpdate(category, condition, data, this));
        }
        conditionCategoryUpdate(category, data) {
            return Promise.resolve(ConditionsCategoryUpdate(category, data, this));
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

    const hiddenMessageHandlers = new Map();
    const hiddenBeepHandlers = new Map();
    const queryHandlers = {};
    const changeHandlers = [];
    function sendHiddenMessage(type, message, Target = null) {
        if (!ServerPlayerIsInChatRoom() || firstTimeInit)
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
        if (firstTimeInit) {
            return Promise.reject("Unavailable during init");
        }
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
        if (!isObject$1(message) ||
            typeof message.id !== "string" ||
            typeof message.query !== "string") {
            console.warn(`BCX: Invalid query`, sender, message);
            return;
        }
        const character = getChatroomCharacter(sender);
        if (!character || !character.hasAccessToPlayer()) {
            return sendHiddenMessage("queryAnswer", {
                id: message.id,
                ok: false
            });
        }
        const handler = queryHandlers[message.query];
        if (!handler) {
            console.warn("BCX: Query no handler", sender, message);
            return sendHiddenMessage("queryAnswer", {
                id: message.id,
                ok: false
            });
        }
        handler(character, (ok, data) => {
            sendHiddenMessage("queryAnswer", {
                id: message.id,
                ok,
                data
            }, sender);
        }, message.data);
    });
    hiddenMessageHandlers.set("queryAnswer", (sender, message) => {
        if (!isObject$1(message) ||
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
        if (moduleInitPhase !== 3 /* ready */)
            return;
        sendHiddenMessage("somethingChanged", undefined);
        const player = getPlayerCharacter().MemberNumber;
        changeHandlers.forEach(h => h(player));
    }
    class ModuleMessaging extends BaseModule {
        load() {
            hookFunction("ChatRoomMessage", 10, (args, next) => {
                const data = args[0];
                if ((data === null || data === void 0 ? void 0 : data.Type) === "Hidden" && data.Content === "BCXMsg" && typeof data.Sender === "number") {
                    if (data.Sender === Player.MemberNumber || firstTimeInit)
                        return;
                    if (!isObject$1(data.Dictionary)) {
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
                if (typeof (data === null || data === void 0 ? void 0 : data.BeepType) === "string" && ["Leash", "BCX"].includes(data.BeepType) && isObject$1((_a = data.Message) === null || _a === void 0 ? void 0 : _a.BCX)) {
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

    class GuiSubscreen {
        get active() {
            return getCurrentSubscreen() === this;
        }
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
            setSubscreen(null);
        }
        Unload() {
            // Empty
        }
        onChange(source) {
            // Empty
        }
    }

    const PER_PAGE_COUNT$4 = 6;
    class GuiAuthorityRoles extends GuiSubscreen {
        constructor(character) {
            super();
            this.roleData = null;
            this.roleList = [];
            this.failed = false;
            this.page = 0;
            this.hoveringTextList = [];
            this.character = character;
            this.hoveringTextList =
                character.isPlayer() ? [
                    `You - either top or bottom of the hierarchy`,
                    `Your owner, visible on your character profile`,
                    `Any character, added to the list on the left as "Owner"`,
                    `Any of your lovers, visible on your character profile`,
                    `Any character, added to the list on the left as "Mistress"`,
                    `Anyone you have white-listed`,
                    `Anyone you have friend-listed`,
                    `Anyone, who can use items on you`
                ] : [
                    `This player - either top or bottom of the hierarchy`,
                    `This player's owner, visible on their character profile`,
                    `Any character, added to the list on the left as "Owner"`,
                    `Any lover of this player, visible on their profile`,
                    `Any character, added to the list on the left as "Mistress"`,
                    `Anyone this player has white-listed`,
                    `Anyone this player has friend-listed`,
                    `Anyone, who can use items on this player`
                ];
        }
        Load() {
            this.requestData();
        }
        onChange(sender) {
            if (sender === this.character.MemberNumber) {
                this.requestData();
            }
        }
        requestData() {
            this.roleData = null;
            this.rebuildList();
            Promise.all([this.character.getRolesData()]).then(res => {
                this.roleData = res[0];
                this.rebuildList();
            }, err => {
                console.error(`BCX: Failed to get role info for ${this.character}`, err);
                this.failed = true;
            });
        }
        rebuildList() {
            if (!this.active)
                return;
            this.roleList = [];
            let Input = document.getElementById("BCX_RoleAdd");
            if (!this.roleData) {
                if (Input) {
                    Input.remove();
                }
                return;
            }
            const showInput = this.roleData.allowAddMistress || this.roleData.allowAddOwner;
            if (!showInput && Input) {
                Input.remove();
            }
            else if (showInput && !Input) {
                Input = ElementCreateInput("BCX_RoleAdd", "text", "", "6");
            }
            this.roleList = this.roleData.owners.map((i) => ({
                type: "Owner",
                memberNumber: i[0],
                name: getCharacterName(i[0], i[1] || null)
            }));
            this.roleList.push(...this.roleData.mistresses.map((i) => ({
                type: "Mistress",
                memberNumber: i[0],
                name: getCharacterName(i[0], i[1] || null)
            })));
            const totalPages = Math.ceil(this.roleList.length / PER_PAGE_COUNT$4);
            if (this.page < 0) {
                this.page = Math.max(totalPages - 1, 0);
            }
            else if (this.page >= totalPages) {
                this.page = 0;
            }
        }
        Run() {
            DrawText("Hierarchy of roles:", 1336, 95, "Black");
            // hierarchy background
            MainCanvas.beginPath();
            MainCanvas.moveTo(1450, 134);
            MainCanvas.lineTo(1450 + 150, 134);
            MainCanvas.lineTo(1450 + 80, 740);
            MainCanvas.lineTo(1450 + 70, 740);
            MainCanvas.lineTo(1450, 134);
            MainCanvas.fillStyle = "Black";
            MainCanvas.fill();
            if (this.roleData) {
                for (let off = 0; off < PER_PAGE_COUNT$4; off++) {
                    const i = this.page * PER_PAGE_COUNT$4 + off;
                    if (i >= this.roleList.length)
                        break;
                    const e = this.roleList[i];
                    const Y = 210 + off * 95;
                    // Owner/Mistress list
                    MainCanvas.beginPath();
                    MainCanvas.rect(130, Y, 900, 64);
                    MainCanvas.stroke();
                    const msg = `${e.type} ${e.name === null ? "[unknown name]" : e.name} (${e.memberNumber})`;
                    DrawTextFit(msg, 140, Y + 34, 590, "Black");
                    if ((e.type === "Owner" ? this.roleData.allowRemoveOwner : this.roleData.allowRemoveMistress) || e.memberNumber === Player.MemberNumber) {
                        MainCanvas.textAlign = "center";
                        DrawButton(1090, Y, 64, 64, "X", "White");
                        MainCanvas.textAlign = "left";
                    }
                }
                const Input = document.getElementById("BCX_RoleAdd");
                if (Input) {
                    DrawText("Member Number:", 130, 847, "Black");
                    ElementPosition("BCX_RoleAdd", 580, 842, 300, 64);
                }
                MainCanvas.textAlign = "center";
                if (this.roleData.allowAddOwner) {
                    DrawButton(760, 815, 210, 64, "Add owner", "white");
                }
                if (this.roleData.allowAddMistress) {
                    DrawButton(1008, 815, 210, 64, "Add mistress", "white");
                }
                // Pagination
                const totalPages = Math.ceil(this.roleList.length / PER_PAGE_COUNT$4);
                DrawBackNextButton(1317, 800, 300, 90, `Page ${this.page + 1} / ${totalPages}`, "White", "", () => "", () => "");
            }
            else if (this.failed) {
                MainCanvas.textAlign = "center";
                DrawText(`Failed to get role data from ${this.character.Name}. Maybe you have no access?`, 800, 480, "Black");
            }
            else {
                MainCanvas.textAlign = "center";
                DrawText("Loading...", 800, 480, "Black");
            }
            // hierarchy roles
            MainCanvas.textAlign = "center";
            DrawButton(1420, 130, 208, 54, this.character.Name, "White", undefined, this.hoveringTextList[0]);
            for (let i = 1; i < 8; i++) {
                DrawButton(1430, 130 + 80 * i, 188, 54, capitalizeFirstLetter(AccessLevel[i]), "White", undefined, this.hoveringTextList[i]);
            }
            MainCanvas.textAlign = "left";
            DrawText(`- Authority: Role Management for ${this.character.Name} -`, 125, 125, "Black", "Gray");
            MainCanvas.textAlign = "center";
            DrawButton(1815, 75, 90, 90, "", "White", "Icons/Exit.png", "BCX main menu");
            DrawButton(1815, 190, 90, 90, "", "White", "Icons/West.png", "Previous screen");
        }
        Click() {
            var _a;
            if (MouseIn(1815, 75, 90, 90))
                return this.Exit();
            if (MouseIn(1815, 190, 90, 90))
                return this.Back();
            if (this.roleData) {
                for (let off = 0; off < PER_PAGE_COUNT$4; off++) {
                    const i = this.page * PER_PAGE_COUNT$4 + off;
                    if (i >= this.roleList.length)
                        break;
                    const e = this.roleList[i];
                    const Y = 210 + off * 95;
                    if (((e.type === "Owner" ? this.roleData.allowRemoveOwner : this.roleData.allowRemoveMistress) || e.memberNumber === Player.MemberNumber) && MouseIn(1090, Y, 64, 64)) {
                        this.character.editRole(e.type === "Owner" ? "owner" : "mistress", "remove", e.memberNumber);
                        return;
                    }
                }
                const Input = document.getElementById("BCX_RoleAdd");
                const inputText = (_a = Input === null || Input === void 0 ? void 0 : Input.value) !== null && _a !== void 0 ? _a : "";
                const inputNumber = /^[0-9]+$/.test(inputText) ? Number.parseInt(inputText, 10) : null;
                if (this.roleData.allowAddOwner && Input && inputNumber !== null && MouseIn(760, 815, 210, 64)) {
                    Input.value = "";
                    this.character.editRole("owner", "add", inputNumber);
                    return;
                }
                if (this.roleData.allowAddMistress && Input && inputNumber !== null && MouseIn(1008, 815, 210, 64)) {
                    Input.value = "";
                    this.character.editRole("mistress", "add", inputNumber);
                    return;
                }
                // Pagination
                const totalPages = Math.ceil(this.roleList.length / PER_PAGE_COUNT$4);
                if (MouseIn(1317, 800, 150, 90)) {
                    this.page--;
                    if (this.page < 0) {
                        this.page = Math.max(totalPages - 1, 0);
                    }
                }
                else if (MouseIn(1467, 800, 150, 90)) {
                    this.page++;
                    if (this.page >= totalPages) {
                        this.page = 0;
                    }
                }
            }
        }
        Exit() {
            setSubscreen(new GuiMainMenu(this.character));
        }
        Back() {
            setSubscreen(new GuiAuthorityPermissions(this.character));
        }
        Unload() {
            ElementRemove("BCX_RoleAdd");
        }
    }

    class GuiAuthorityDialogMin extends GuiSubscreen {
        constructor(character, permission, data, myAccesLevel, noAccess, back) {
            super();
            this.character = character;
            this.permission = permission;
            this.permissionData = data;
            this.back = back;
            this.myAccessLevel = myAccesLevel;
            this.noAccess = noAccess;
            this.selectedLevel = data.min;
        }
        Run() {
            DrawTextFit(`- Authority: Changing minimum access to permission "${this.permissionData.name}" -`, 125, 125, 1850, "Black", "Gray");
            MainCanvas.textAlign = "center";
            DrawText("Please select the new lowest role that should still have this permission.", 1000, 255, "Black");
            DrawTextFit(`Info: Currently set role: ${this.permissionData.min === AccessLevel.self ?
            this.character.Name : capitalizeFirstLetter(AccessLevel[this.permissionData.min])} → ` +
                `Newly selected role: ${this.selectedLevel === AccessLevel.self ?
                this.character.Name : capitalizeFirstLetter(AccessLevel[this.selectedLevel])}`, 1000, 320, 1850, "Black");
            DrawText("All roles to the left of the selected one will also automatically get access.", 1000, 385, "Black");
            if (this.myAccessLevel === AccessLevel.self) {
                const available = (this.permissionData.min <= AccessLevel.self) || !this.noAccess;
                DrawButton(1000 - 110, 460, 220, 72, getPermissionMinDisplayText(AccessLevel.self, this.character), this.selectedLevel === AccessLevel.self ? "Cyan" : available ? "White" : "#ddd", undefined, undefined, !available);
            }
            for (let i = 1; i < 8; i++) {
                const current = this.selectedLevel === i;
                const available = (this.myAccessLevel === AccessLevel.self && this.permissionData.min <= i && i <= AccessLevel.owner) ||
                    !this.noAccess && this.myAccessLevel <= i;
                DrawButton(-15 + 230 * i, 577, 190, 72, getPermissionMinDisplayText(i, this.character), current ? "Cyan" : available ? "White" : "#ddd", undefined, undefined, !available);
                if (i < 7)
                    DrawText(">", 196 + 230 * i, 577 + 36, "Black");
            }
            if (this.character.isPlayer() && this.permission === "authority_revoke_self" && this.selectedLevel !== AccessLevel.self) {
                DrawText(`WARNING: If you confirm, all permitted roles can remove your access to this and all other permissions!`, 1000, 730, "Red", "Gray");
            }
            DrawButton(700, 800, 200, 80, "Confirm", "White");
            DrawButton(1120, 800, 200, 80, "Cancel", "White");
        }
        Click() {
            if (MouseIn(700, 800, 200, 80))
                return this.Confirm();
            if (MouseIn(1120, 800, 200, 80))
                return this.Exit();
            if (MouseIn(1000 - 110, 460, 220, 72) && this.myAccessLevel === AccessLevel.self) {
                const available = (this.permissionData.min <= AccessLevel.self) || !this.noAccess;
                if (available) {
                    this.selectedLevel = AccessLevel.self;
                }
            }
            for (let i = 1; i < 8; i++) {
                const current = this.selectedLevel === i;
                const available = (this.myAccessLevel === AccessLevel.self && this.permissionData.min <= i && i <= AccessLevel.owner) ||
                    !this.noAccess && this.myAccessLevel <= i;
                if (MouseIn(-15 + 230 * i, 577, 190, 72) && !current && available) {
                    this.selectedLevel = i;
                }
            }
        }
        Confirm() {
            this.character.setPermission(this.permission, "min", this.selectedLevel);
        }
        Exit() {
            setSubscreen(this.back);
        }
        onChange() {
            // When something changes, we bail from change dialog, because it might no longer be valid
            this.Exit();
        }
    }

    class GuiAuthorityDialogSelf extends GuiSubscreen {
        constructor(character, permission, data, back) {
            super();
            this.character = character;
            this.permission = permission;
            this.permissionData = data;
            this.back = back;
        }
        Run() {
            DrawTextFit(`- Authority: Removing self access to permission "${this.permissionData.name}" -`, 125, 125, 1850, "Black", "Gray");
            MainCanvas.textAlign = "center";
            DrawText("- Warning -", 1000, 375, "Black", "Black");
            DrawText("If you confirm, you won't be able to change your access to this permission back yourself.", 1000, 525, "Black");
            DrawButton(700, 720, 200, 80, "Confirm", "White");
            DrawButton(1120, 720, 200, 80, "Cancel", "White");
        }
        Click() {
            if (MouseIn(700, 720, 200, 80))
                return this.Confirm();
            if (MouseIn(1120, 720, 200, 80))
                return this.Exit();
        }
        Confirm() {
            this.character.setPermission(this.permission, "self", false);
        }
        Exit() {
            setSubscreen(this.back);
        }
        onChange() {
            // When something changes, we bail from change dialog, because it might no longer be valid
            this.Exit();
        }
    }

    const PER_PAGE_COUNT$3 = 6;
    class GuiAuthorityPermissions extends GuiSubscreen {
        constructor(character) {
            super();
            this.permissionData = null;
            this.myAccessLevel = AccessLevel.public;
            this.failed = false;
            this.permList = [];
            this.page = 0;
            this.character = character;
            if (this.character.isPlayer()) {
                this.myAccessLevel = AccessLevel.self;
            }
        }
        Load() {
            this.requestData();
        }
        onChange(sender) {
            if (sender === this.character.MemberNumber) {
                this.requestData();
            }
        }
        requestData() {
            this.permissionData = null;
            this.rebuildList();
            Promise.all([this.character.getPermissions(), this.character.getMyAccessLevel()]).then(res => {
                this.permissionData = res[0];
                this.myAccessLevel = res[1];
                this.rebuildList();
            }, err => {
                console.error(`BCX: Failed to get permission info for ${this.character}`, err);
                this.failed = true;
            });
        }
        rebuildList() {
            if (!this.active)
                return;
            this.permList = [];
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
            const access_grantSelf = this.permissionData.authority_grant_self ?
                checkPermisionAccesData(this.permissionData.authority_grant_self, this.myAccessLevel) :
                false;
            const access_revokeSelf = this.permissionData.authority_revoke_self ?
                checkPermisionAccesData(this.permissionData.authority_revoke_self, this.myAccessLevel) :
                false;
            const access_editMin = this.permissionData.authority_edit_min ?
                checkPermisionAccesData(this.permissionData.authority_edit_min, this.myAccessLevel) :
                false;
            const isPlayer = this.myAccessLevel === AccessLevel.self;
            const categories = new Map();
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
                    const access = checkPermisionAccesData(v, this.myAccessLevel);
                    this.permList.push({
                        separator: false,
                        permission: k,
                        permissionInfo: v,
                        editSelf: 
                        // character must have access to "allow granting/forbidding self access"
                        (v.self ? access_revokeSelf : access_grantSelf) &&
                            // Not player must have access to target rule
                            (isPlayer || access) &&
                            // "minimal access" set to "Self" forces "self access" to "Yes"
                            (!v.self || v.min !== AccessLevel.self),
                        editMin: 
                        // Exception: Player can always lower permissions "Self"->"Owner"
                        (isPlayer && v.min < AccessLevel.owner) ||
                            // Character must have access to "allow minimal access modification" &&
                            // Character must have access to target rule
                            (access_editMin && access)
                    });
                }
            }
            const totalPages = Math.ceil(this.permList.length / PER_PAGE_COUNT$3);
            if (this.page < 0) {
                this.page = Math.max(totalPages - 1, 0);
            }
            else if (this.page >= totalPages) {
                this.page = 0;
            }
        }
        Run() {
            var _a;
            if (this.permissionData !== null) {
                DrawTextFit(this.character.Name, 1111, 190, 189, "Black");
                DrawText("is permitted", 1111, 235, "Black");
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
                    MainCanvas.textAlign = "center";
                    DrawButton(870, 182, 64, 64, "X", "White");
                }
                MainCanvas.textAlign = "left";
                for (let off = 0; off < PER_PAGE_COUNT$3; off++) {
                    const i = this.page * PER_PAGE_COUNT$3 + off;
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
                        DrawButton(1235, Y, 64, 64, "", e.editSelf ? "White" : "#ddd", e.permissionInfo.self ? "Icons/Checked.png" : "", undefined, !e.editSelf);
                        // Min access
                        MainCanvas.textAlign = "center";
                        DrawButton(1370, Y, 170, 64, getPermissionMinDisplayText(e.permissionInfo.min, this.character), e.editMin ? "White" : "#ddd", undefined, undefined, !e.editMin);
                        MainCanvas.textAlign = "left";
                    }
                }
                // Pagination
                const totalPages = Math.max(1, Math.ceil(this.permList.length / PER_PAGE_COUNT$3));
                MainCanvas.textAlign = "center";
                DrawBackNextButton(1605, 800, 300, 90, `${DialogFindPlayer("Page")} ${this.page + 1} / ${totalPages}`, "White", "", () => "", () => "");
            }
            else if (this.failed) {
                MainCanvas.textAlign = "center";
                DrawText(`Failed to get permission data from ${this.character.Name}. Maybe you have no access?`, 1000, 480, "Black");
            }
            else {
                MainCanvas.textAlign = "center";
                DrawText("Loading...", 1000, 480, "Black");
            }
            MainCanvas.textAlign = "left";
            DrawText(`- Authority: Permission Settings for ${this.character.Name} -`, 125, 125, "Black", "Gray");
            MainCanvas.textAlign = "center";
            DrawButton(1815, 75, 90, 90, "", "White", "Icons/Exit.png", "BCX main menu");
            DrawButton(1815, 190, 90, 90, "", "White", icon_OwnerList, "Role management");
        }
        Click() {
            if (MouseIn(1815, 75, 90, 90))
                return this.Exit();
            // Owner list
            if (MouseIn(1815, 190, 90, 90))
                return setSubscreen(new GuiAuthorityRoles(this.character));
            if (this.permissionData !== null) {
                //reset button
                const elem = document.getElementById("BCX_PermissionsFilter");
                if (MouseIn(870, 182, 64, 64) && elem) {
                    elem.value = "";
                    this.rebuildList();
                }
                for (let off = 0; off < PER_PAGE_COUNT$3; off++) {
                    const i = this.page * PER_PAGE_COUNT$3 + off;
                    if (i >= this.permList.length)
                        break;
                    const e = this.permList[i];
                    const Y = 275 + off * 100;
                    if (!e.separator) {
                        // Permission name
                        if (MouseIn(200, Y, 1000, 64)) {
                            // TODO
                        }
                        // Self checkbox
                        if (MouseIn(1235, Y, 64, 64) && e.editSelf) {
                            if (e.permissionInfo.self &&
                                this.character.isPlayer() &&
                                (e.permission === "authority_grant_self" ||
                                    !checkPermissionAccess("authority_grant_self", getPlayerCharacter()))) {
                                // If Player couldn't switch back on, show warning instead
                                setSubscreen(new GuiAuthorityDialogSelf(this.character, e.permission, e.permissionInfo, this));
                            }
                            else {
                                this.character.setPermission(e.permission, "self", !e.permissionInfo.self);
                            }
                            return;
                        }
                        // Min access
                        if (MouseIn(1370, Y, 170, 64) && e.editMin) {
                            const access_editMin = this.permissionData.authority_edit_min ?
                                checkPermisionAccesData(this.permissionData.authority_edit_min, this.myAccessLevel) :
                                false;
                            setSubscreen(new GuiAuthorityDialogMin(this.character, e.permission, e.permissionInfo, this.myAccessLevel, !access_editMin || !checkPermisionAccesData(e.permissionInfo, this.myAccessLevel), this));
                            return;
                        }
                    }
                }
                // Pagination
                const totalPages = Math.ceil(this.permList.length / PER_PAGE_COUNT$3);
                if (MouseIn(1605, 800, 150, 90)) {
                    this.page--;
                    if (this.page < 0) {
                        this.page = Math.max(totalPages - 1, 0);
                    }
                }
                else if (MouseIn(1755, 800, 150, 90)) {
                    this.page++;
                    if (this.page >= totalPages) {
                        this.page = 0;
                    }
                }
            }
        }
        Exit() {
            setSubscreen(new GuiMainMenu(this.character));
        }
        Unload() {
            ElementRemove("BCX_PermissionsFilter");
        }
    }

    class GuiGlobalDialogClearData extends GuiSubscreen {
        constructor(back) {
            super();
            this.allowedConfirmTime = 0;
            this.back = back;
        }
        Load() {
            this.allowedConfirmTime = Date.now() + 10000;
        }
        Run() {
            MainCanvas.textAlign = "center";
            DrawText(`- Permanent deletion of ALL Bondage Club Extended data -`, 1000, 125, "Black");
            DrawText("- Warning -", 1000, 225, "Black", "Black");
            DrawText("If you confirm, all BCX data (including settings, curses, logs, ...) will be permanently deleted!", 1000, 325, "Black");
            DrawText("As part of the deletion process, the window will reload, logging you out of your account.", 1000, 500, "Gray");
            DrawText("You will be able to use BCX again, but none of your current data will be coming back!", 1000, 550, "Gray");
            DrawText("This action cannot be undone!", 1000, 625, "Red", "Black");
            if (this.allowedConfirmTime === null) {
                DrawText("Deleting...", 1000, 720, "Black");
                return;
            }
            const now = Date.now();
            if (now < this.allowedConfirmTime) {
                DrawButton(300, 720, 200, 80, `Confirm (${Math.floor((this.allowedConfirmTime - now) / 1000)})`, "#ddd", undefined, undefined, true);
            }
            else {
                DrawButton(300, 720, 200, 80, "Confirm", "White");
            }
            DrawButton(1520, 720, 200, 80, "Cancel", "White");
        }
        Click() {
            if (this.allowedConfirmTime === null)
                return;
            if (MouseIn(1520, 720, 200, 80))
                return this.Exit();
            if (MouseIn(300, 720, 200, 80) && Date.now() >= this.allowedConfirmTime)
                return this.Confirm();
        }
        Confirm() {
            this.allowedConfirmTime = null;
            clearAllData();
        }
        Exit() {
            if (this.allowedConfirmTime === null)
                return;
            setSubscreen(this.back);
        }
    }

    class GuiGlobalModuleToggling extends GuiSubscreen {
        constructor() {
            super(...arguments);
            this.enabledModules = new Set();
            this.changed = false;
        }
        Load() {
            this.enabledModules.clear();
            for (const m of TOGGLEABLE_MODULES.filter(i => moduleIsEnabled(i))) {
                this.enabledModules.add(m);
            }
            this.changed = false;
        }
        Run() {
            MainCanvas.textAlign = "left";
            DrawText(`- Global: Enable/Disable BCX's modules -`, 125, 125, "Black", "Gray");
            DrawText(`Warning: Disabling a module will reset all its settings and stored data!`, 125, 180, "FireBrick");
            for (let i = 0; i < TOGGLEABLE_MODULES.length; i++) {
                const module = TOGGLEABLE_MODULES[i];
                const PX = Math.floor(i / 5);
                const PY = i % 5;
                DrawCheckbox(150 + 500 * PX, 240 + 110 * PY, 64, 64, "", this.enabledModules.has(module));
                DrawImageEx(MODULE_ICONS[module], 280 + 500 * PX, 240 + 110 * PY, {
                    Height: 64,
                    Width: 64
                });
                DrawText(MODULE_NAMES[module], 370 + 500 * PX, 240 + 32 + 110 * PY, "Black");
            }
            MainCanvas.textAlign = "center";
            DrawButton(300, 800, 200, 80, "Confirm", this.changed ? "White" : "#ddd", undefined, undefined, !this.changed);
            DrawButton(1520, 800, 200, 80, "Cancel", "White");
        }
        Click() {
            if (MouseIn(1815, 75, 90, 90))
                return this.Exit();
            for (let i = 0; i < TOGGLEABLE_MODULES.length; i++) {
                const module = TOGGLEABLE_MODULES[i];
                const PX = Math.floor(i / 5);
                const PY = i % 5;
                if (MouseIn(150 + 500 * PX, 240 + 110 * PY, 64, 64)) {
                    if (this.enabledModules.has(module)) {
                        this.enabledModules.delete(module);
                    }
                    else {
                        this.enabledModules.add(module);
                    }
                    this.changed = true;
                    return;
                }
            }
            if (MouseIn(300, 800, 200, 80) && this.changed) {
                if (setDisabledModules(TOGGLEABLE_MODULES.filter(i => !this.enabledModules.has(i)))) {
                    this.Exit();
                }
                return;
            }
            if (MouseIn(1520, 800, 200, 80)) {
                return this.Exit();
            }
        }
        Exit() {
            setSubscreen(new GuiGlobal(getPlayerCharacter()));
        }
    }

    class GuiGlobal extends GuiSubscreen {
        constructor(character) {
            super();
            this.character = character;
        }
        Run() {
            MainCanvas.textAlign = "left";
            DrawText(`- Global: Configuration for ${this.character.Name} -`, 125, 125, "Black", "Gray");
            MainCanvas.textAlign = "center";
            DrawButton(1815, 75, 90, 90, "", "White", "Icons/Exit.png", "BCX main menu");
            if (!this.character.isPlayer()) {
                DrawText(`Global configuration is not possible on others`, 1000, 500, "Black");
                return;
            }
            DrawButton(120, 200, 400, 90, "Manage BCX modules", "White", "", "Enable/Disable individual modules");
            DrawButton(1525, 800, 300, 90, "Clear all BCX data", "#FF3232", "", "Emergency reset of BCX");
        }
        Click() {
            if (MouseIn(1815, 75, 90, 90))
                return this.Exit();
            if (!this.character.isPlayer())
                return;
            if (MouseIn(120, 200, 400, 90)) {
                setSubscreen(new GuiGlobalModuleToggling());
                return;
            }
            if (MouseIn(1525, 800, 300, 90)) {
                setSubscreen(new GuiGlobalDialogClearData(this));
                return;
            }
        }
        Exit() {
            setSubscreen(new GuiMainMenu(this.character));
        }
    }

    const PER_PAGE_COUNT$2 = 6;
    class GuiLogConfig extends GuiSubscreen {
        constructor(character) {
            super();
            this.config = null;
            this.failed = false;
            this.configList = [];
            this.allowDelete = false;
            this.allowConfigure = false;
            this.page = 0;
            this.character = character;
        }
        Load() {
            this.requestData();
        }
        onChange(sender) {
            if (sender === this.character.MemberNumber) {
                this.requestData();
            }
        }
        requestData() {
            this.config = null;
            this.rebuildList();
            Promise.all([
                this.character.getLogConfig(),
                this.character.getPermissionAccess("log_delete"),
                this.character.getPermissionAccess("log_configure")
            ]).then(res => {
                this.config = res[0];
                this.allowDelete = res[1];
                this.allowConfigure = res[2];
                this.rebuildList();
            }, err => {
                console.error(`BCX: Failed to get log config for ${this.character}`, err);
                this.failed = true;
            });
        }
        rebuildList() {
            if (!this.active)
                return;
            this.configList = [];
            let Input = document.getElementById("BCX_LogConfigFilter");
            if (this.config === null) {
                if (Input) {
                    Input.remove();
                }
                return;
            }
            if (!Input) {
                Input = ElementCreateInput("BCX_LogConfigFilter", "text", "", "30");
                Input.addEventListener("input", ev => {
                    this.rebuildList();
                });
            }
            const filter = Input.value.trim().toLocaleLowerCase().split(" ");
            for (const [k, v] of Object.entries(this.config)) {
                if (LOG_CONFIG_NAMES[k] !== undefined &&
                    LOG_LEVEL_NAMES[v] !== undefined &&
                    filter.every(i => LOG_CONFIG_NAMES[k].toLocaleLowerCase().includes(i) ||
                        k.toLocaleLowerCase().includes(i))) {
                    this.configList.push({
                        category: k,
                        access: v,
                        name: LOG_CONFIG_NAMES[k]
                    });
                }
            }
            this.configList.sort((a, b) => a.name.localeCompare(b.name));
            const totalPages = Math.ceil(this.configList.length / PER_PAGE_COUNT$2);
            if (this.page < 0) {
                this.page = Math.max(totalPages - 1, 0);
            }
            else if (this.page >= totalPages) {
                this.page = 0;
            }
        }
        Run() {
            var _a;
            if (this.config !== null) {
                // filter
                DrawText("Filter:", 130, 215, "Black");
                ElementPosition("BCX_LogConfigFilter", 550, 210, 600, 64);
                //reset button
                if ((_a = document.getElementById("BCX_LogConfigFilter")) === null || _a === void 0 ? void 0 : _a.value) {
                    MainCanvas.textAlign = "center";
                    DrawButton(870, 182, 64, 64, "X", "White");
                }
                MainCanvas.textAlign = "left";
                for (let off = 0; off < PER_PAGE_COUNT$2; off++) {
                    const i = this.page * PER_PAGE_COUNT$2 + off;
                    if (i >= this.configList.length)
                        break;
                    const e = this.configList[i];
                    const Y = 290 + off * 100;
                    // Config name
                    DrawButton(130, Y, 1070, 64, "", "White");
                    DrawTextFit(e.name, 140, Y + 34, 1060, "Black");
                    // Config access
                    MainCanvas.textAlign = "center";
                    if (this.allowConfigure) {
                        DrawBackNextButton(1270, Y, 170, 64, LOG_LEVEL_NAMES[e.access], "White", "", () => (e.access > 0 ? LOG_LEVEL_NAMES[(e.access - 1)] : ""), () => (e.access < 2 ? LOG_LEVEL_NAMES[(e.access + 1)] : ""));
                    }
                    else {
                        DrawButton(1270, Y, 170, 64, LOG_LEVEL_NAMES[e.access], "#ccc", undefined, undefined, true);
                    }
                    MainCanvas.textAlign = "left";
                }
                // Pagination
                const totalPages = Math.max(1, Math.ceil(this.configList.length / PER_PAGE_COUNT$2));
                MainCanvas.textAlign = "center";
                DrawBackNextButton(1605, 800, 300, 90, `${DialogFindPlayer("Page")} ${this.page + 1} / ${totalPages}`, "White", "", () => "", () => "");
            }
            else if (this.failed) {
                MainCanvas.textAlign = "center";
                DrawText(`Failed to get log config data from ${this.character.Name}. Maybe you have no access?`, 1000, 480, "Black");
            }
            else {
                MainCanvas.textAlign = "center";
                DrawText("Loading...", 1000, 480, "Black");
            }
            MainCanvas.textAlign = "left";
            DrawText(`- Behaviour Log: Configuration for ${this.character.Name} -`, 125, 125, "Black", "Gray");
            MainCanvas.textAlign = "center";
            if (this.allowDelete) {
                DrawButton(1525, 690, 380, 64, "Delete all log entries", "White");
            }
            DrawButton(1815, 75, 90, 90, "", "White", "Icons/Exit.png", "BCX main menu");
            DrawButton(1815, 190, 90, 90, "", "White", "Icons/West.png", "Previous screen");
        }
        Click() {
            if (MouseIn(1815, 75, 90, 90))
                return this.Exit();
            if (MouseIn(1815, 190, 90, 90))
                return setSubscreen(new GuiLog(this.character));
            if (this.config !== null) {
                //reset button
                const elem = document.getElementById("BCX_LogConfigFilter");
                if (MouseIn(870, 182, 64, 64) && elem) {
                    elem.value = "";
                    this.rebuildList();
                }
                for (let off = 0; off < PER_PAGE_COUNT$2; off++) {
                    const i = this.page * PER_PAGE_COUNT$2 + off;
                    if (i >= this.configList.length)
                        break;
                    const e = this.configList[i];
                    const Y = 290 + off * 100;
                    if (e.access > 0 && MouseIn(1270, Y, 85, 64) && this.allowConfigure) {
                        this.character.setLogConfig(e.category, (e.access - 1));
                        return;
                    }
                    else if (e.access < 2 && MouseIn(1355, Y, 85, 64) && this.allowConfigure) {
                        this.character.setLogConfig(e.category, (e.access + 1));
                        return;
                    }
                }
                // Clear log button
                if (MouseIn(1525, 690, 380, 64) && this.allowDelete) {
                    this.character.logClear().then(() => {
                        setSubscreen(new GuiLog(this.character));
                    });
                    return;
                }
                // Pagination
                const totalPages = Math.ceil(this.configList.length / PER_PAGE_COUNT$2);
                if (MouseIn(1605, 800, 150, 90)) {
                    this.page--;
                    if (this.page < 0) {
                        this.page = Math.max(totalPages - 1, 0);
                    }
                }
                else if (MouseIn(1755, 800, 150, 90)) {
                    this.page++;
                    if (this.page >= totalPages) {
                        this.page = 0;
                    }
                }
            }
        }
        Exit() {
            setSubscreen(new GuiMainMenu(this.character));
        }
        Unload() {
            ElementRemove("BCX_LogConfigFilter");
        }
    }

    const PER_PAGE_COUNT$1 = 5;
    class GuiLog extends GuiSubscreen {
        constructor(character) {
            super();
            this.failed = false;
            this.logData = null;
            this.logEntries = [];
            this.allowDeletion = false;
            this.allowConfiguration = false;
            this.allowPraise = false;
            this.allowLeaveMessage = false;
            this.page = 0;
            this.character = character;
        }
        Load() {
            this.requestData();
        }
        onChange(sender) {
            if (sender === this.character.MemberNumber) {
                this.requestData();
            }
        }
        requestData() {
            this.logData = null;
            this.refreshScreen();
            Promise.all([
                this.character.getLogEntries(),
                this.character.logGetAllowedActions()
            ]).then(res => {
                this.logData = res[0];
                this.allowDeletion = res[1].delete;
                this.allowConfiguration = res[1].configure || this.character.isPlayer();
                this.allowPraise = res[1].praise;
                this.allowLeaveMessage = res[1].leaveMessage;
                this.refreshScreen();
            }, err => {
                console.error(`BCX: Failed to get log data for ${this.character}`, err);
                this.failed = true;
            });
        }
        refreshScreen() {
            if (!this.active)
                return;
            this.logEntries = [];
            let LogFilter = document.getElementById("BCX_LogFilter");
            let NoteField = document.getElementById("BCX_NoteField");
            if (this.logData === null) {
                if (LogFilter) {
                    LogFilter.remove();
                }
                if (NoteField) {
                    NoteField.remove();
                }
                return;
            }
            if (!LogFilter) {
                LogFilter = ElementCreateInput("BCX_LogFilter", "text", "", "30");
                LogFilter.addEventListener("input", ev => {
                    this.refreshScreen();
                });
            }
            if (!this.allowLeaveMessage && NoteField) {
                NoteField.remove();
            }
            else if (this.allowLeaveMessage && !NoteField) {
                NoteField = ElementCreateInput("BCX_NoteField", "text", "", "30");
            }
            const filter = LogFilter.value.trim().toLocaleLowerCase().split(" ");
            this.logEntries = this.logData.filter(e => {
                const msg = logMessageRender(e).toLocaleLowerCase();
                return filter.every(f => msg.includes(f));
            });
            const totalPages = Math.ceil(this.logEntries.length / PER_PAGE_COUNT$1);
            if (this.page < 0) {
                this.page = Math.max(totalPages - 1, 0);
            }
            else if (this.page >= totalPages) {
                this.page = 0;
            }
        }
        Run() {
            var _a;
            if (this.logData !== null) {
                // filter
                DrawText("Filter:", 130, 215, "Black");
                ElementPosition("BCX_LogFilter", 550, 210, 600, 64);
                //reset button
                if ((_a = document.getElementById("BCX_LogFilter")) === null || _a === void 0 ? void 0 : _a.value) {
                    MainCanvas.textAlign = "center";
                    DrawButton(870, 182, 64, 64, "X", "White");
                }
                for (let off = 0; off < PER_PAGE_COUNT$1; off++) {
                    const i = this.page * PER_PAGE_COUNT$1 + off;
                    if (i >= this.logEntries.length)
                        break;
                    const e = this.logEntries[i];
                    const Y = 290 + off * 95;
                    // Log message
                    DrawImageEx(e[1] === LogAccessLevel.protected ? "Icons/Security.png" : "Icons/Public.png", 125, Y, {
                        Height: 64,
                        Width: 64
                    });
                    MainCanvas.textAlign = "left";
                    DrawButton(200, Y, 1030, 64, "", "White");
                    const msg = logMessageRender(e);
                    DrawTextFit(msg, 210, Y + 34, 1020, msg.startsWith("[") ? "Gray" : "Black");
                    MainCanvas.beginPath();
                    MainCanvas.rect(1270, Y, 320, 64);
                    MainCanvas.stroke();
                    DrawTextFit(new Date(e[0]).toLocaleString(), 1290, Y + 34, 300, "Black", "");
                    MainCanvas.textAlign = "center";
                    if (this.allowDeletion) {
                        DrawButton(1630, Y, 64, 64, "X", "White", "", "Delete log entry");
                    }
                    if (MouseIn(125, Y, 64, 64)) {
                        DrawButtonHover(125, Y, 64, 64, e[1] === LogAccessLevel.protected ? "Protected visibility" : "Normal visibility");
                    }
                }
                // Message field
                if (this.allowLeaveMessage) {
                    MainCanvas.textAlign = "left";
                    DrawText("Attach", 130, 831, "Black");
                    DrawText("note:", 130, 869, "Black");
                    ElementPosition("BCX_NoteField", 580, 842, 660, 64);
                }
                MainCanvas.textAlign = "center";
                // Praise button
                if (this.allowPraise) {
                    DrawButton(950, 815, 150, 64, "Praise", "White");
                }
                // Leave message button
                if (this.allowLeaveMessage) {
                    DrawButton(1150, 815, 200, 64, "Only note", "White");
                }
                // Scold button
                if (this.allowPraise) {
                    DrawButton(1400, 815, 150, 64, "Scold", "White");
                }
                // Pagination
                const totalPages = Math.max(1, Math.ceil(this.logEntries.length / PER_PAGE_COUNT$1));
                DrawBackNextButton(1605, 800, 300, 90, `${DialogFindPlayer("Page")} ${this.page + 1} / ${totalPages}`, "White", "", () => "", () => "");
            }
            else if (this.failed) {
                MainCanvas.textAlign = "center";
                DrawText(`Failed to get log data from ${this.character.Name}. Maybe you have no access?`, 1000, 480, "Black");
            }
            else {
                MainCanvas.textAlign = "center";
                DrawText("Loading...", 1000, 480, "Black");
            }
            MainCanvas.textAlign = "left";
            DrawText(`- Behaviour Log: About ${this.character.Name} -`, 125, 125, "Black", "Gray");
            MainCanvas.textAlign = "center";
            DrawButton(1815, 75, 90, 90, "", "White", "Icons/Exit.png", "BCX main menu");
            DrawButton(1815, 190, 90, 90, "", this.allowConfiguration ? "White" : "#ddd", "Icons/Preference.png", "Configure logging", !this.allowConfiguration);
        }
        Click() {
            if (MouseIn(1815, 75, 90, 90))
                return this.Exit();
            if (MouseIn(1815, 190, 90, 90) && this.allowConfiguration)
                return setSubscreen(new GuiLogConfig(this.character));
            if (this.logData !== null) {
                //reset button
                const elem = document.getElementById("BCX_LogFilter");
                if (MouseIn(870, 182, 64, 64) && elem) {
                    elem.value = "";
                    this.refreshScreen();
                }
                for (let off = 0; off < PER_PAGE_COUNT$1; off++) {
                    const i = this.page * PER_PAGE_COUNT$1 + off;
                    if (i >= this.logEntries.length)
                        break;
                    const e = this.logEntries[i];
                    const Y = 290 + off * 95;
                    if (this.allowDeletion && MouseIn(1630, Y, 64, 64)) {
                        this.character.logMessageDelete(e[0]);
                        return;
                    }
                }
                const field = document.getElementById("BCX_NoteField");
                const msg = (field === null || field === void 0 ? void 0 : field.value) || null;
                let didPraise = false;
                // Praise button
                if (this.allowPraise && MouseIn(950, 815, 150, 64)) {
                    this.character.logPraise(1, msg);
                    didPraise = true;
                }
                // Leave message button
                if (this.allowLeaveMessage && MouseIn(1150, 815, 200, 64) && msg) {
                    this.character.logPraise(0, msg);
                    didPraise = true;
                }
                // Scold button
                if (this.allowPraise && MouseIn(1400, 815, 150, 64)) {
                    this.character.logPraise(-1, msg);
                    didPraise = true;
                }
                if (didPraise) {
                    this.allowPraise = false;
                    if (field) {
                        field.value = "";
                    }
                    return;
                }
                // Pagination
                const totalPages = Math.ceil(this.logEntries.length / PER_PAGE_COUNT$1);
                if (MouseIn(1605, 800, 150, 90)) {
                    this.page--;
                    if (this.page < 0) {
                        this.page = Math.max(totalPages - 1, 0);
                    }
                }
                else if (MouseIn(1755, 800, 150, 90)) {
                    this.page++;
                    if (this.page >= totalPages) {
                        this.page = 0;
                    }
                }
            }
        }
        Exit() {
            setSubscreen(new GuiMainMenu(this.character));
        }
        Unload() {
            ElementRemove("BCX_LogFilter");
            ElementRemove("BCX_NoteField");
        }
    }

    const cheatChangeHooks = {};
    function cheatIsEnabled(cheat) {
        return Array.isArray(modStorage.cheats) && modStorage.cheats.includes(cheat);
    }
    function cheatSetEnabled(cheat, enabled) {
        if (!Array.isArray(modStorage.cheats)) {
            console.error(`BCX: Attempt to set cheat, while not initalized`);
            return;
        }
        if (enabled) {
            if (!modStorage.cheats.includes(cheat)) {
                modStorage.cheats.push(cheat);
            }
        }
        else {
            modStorage.cheats = modStorage.cheats.filter(c => c !== cheat);
        }
        if (cheatChangeHooks[cheat]) {
            cheatChangeHooks[cheat](enabled);
        }
        modStorageSync();
    }
    function cheatToggle(cheat) {
        cheatSetEnabled(cheat, !cheatIsEnabled(cheat));
    }
    const MISTRESS_CHEAT_ONLY_ITEMS = ["MistressPadlock", "MistressPadlockKey", "MistressTimerPadlock"];
    const PANDORA_CHEAT_ONLY_ITEMS = ["PandoraPadlock", "PandoraPadlockKey"];
    class ModuleMiscPatches extends BaseModule {
        constructor() {
            super(...arguments);
            this.o_Player_CanChange = null;
        }
        load() {
            if (!Array.isArray(modStorage.cheats)) {
                modStorage.cheats = [];
            }
            else {
                modStorage.cheats = modStorage.cheats.filter(c => MiscCheat[c] !== undefined);
            }
            hookFunction("AsylumEntranceCanWander", 0, () => true);
            hookFunction("ElementIsScrolledToEnd", 0, (args) => {
                const element = document.getElementById(args[0]);
                return element != null && element.scrollHeight - element.scrollTop - element.clientHeight <= 1;
            });
            hookFunction("CheatFactor", 1, (args, next) => {
                const [CheatName, Factor] = args;
                if (CheatName === "CantLoseMistress" && cheatIsEnabled(MiscCheat.CantLoseMistress)) {
                    return Factor;
                }
                else if (CheatName === "BlockRandomKidnap" && cheatIsEnabled(MiscCheat.BlockRandomEvents)) {
                    return Factor;
                }
                return next(args);
            });
            hookFunction("PrivateRansomStart", 0, (args, next) => {
                if (cheatIsEnabled(MiscCheat.BlockRandomEvents))
                    return false;
                return next(args);
            });
            hookFunction("MainHallWalk", 0, (args, next) => {
                if (cheatIsEnabled(MiscCheat.BlockRandomEvents)) {
                    MainHallRandomEventOdds = 0;
                }
                return next(args);
            });
            // R71 temporary fix
            hookFunction("FriendListLoadFriendList", 0, (args, next) => {
                args[0].forEach((i) => { if (!i.ChatRoomName && i.Private)
                    i.ChatRoomName = "-Private-"; });
                next(args);
            });
            const { NMod } = detectOtherMods();
            if (!NMod) {
                patchFunction("LoginMistressItems", { 'LogQuery("ClubMistress", "Management")': "true" });
                hookFunction("LoginMistressItems", 0, (args, next) => {
                    next(args);
                    if (!cheatIsEnabled(MiscCheat.GiveMistressKey) && !LogQuery("ClubMistress", "Management")) {
                        for (const item of MISTRESS_CHEAT_ONLY_ITEMS) {
                            InventoryDelete(Player, item, "ItemMisc", false);
                        }
                    }
                });
                cheatChangeHooks[MiscCheat.GiveMistressKey] = () => {
                    LoginMistressItems();
                    ServerPlayerInventorySync();
                };
                patchFunction("LoginStableItems", { 'LogQuery("JoinedStable", "PonyExam") || LogQuery("JoinedStable", "TrainerExam")': "true" });
            }
            cheatChangeHooks[MiscCheat.GivePandoraKey] = enabled => {
                for (const item of PANDORA_CHEAT_ONLY_ITEMS) {
                    if (enabled) {
                        InventoryAdd(Player, item, "ItemMisc", false);
                    }
                    else {
                        InventoryDelete(Player, item, "ItemMisc", false);
                    }
                }
                ServerPlayerInventorySync();
            };
            hookFunction("InfiltrationStealItems", 0, (args, next) => {
                next(args);
                if (cheatIsEnabled(MiscCheat.GivePandoraKey)) {
                    cheatChangeHooks[MiscCheat.GivePandoraKey](true);
                }
            });
            // Cheats
            this.o_Player_CanChange = Player.CanChange;
            Player.CanChange = () => { var _a; return allowMode || !!((_a = this.o_Player_CanChange) === null || _a === void 0 ? void 0 : _a.call(Player)); };
            hookFunction("ChatRoomCanLeave", 0, (args, next) => allowMode || next(args));
        }
        run() {
            LoginMistressItems();
            LoginStableItems();
            if (cheatIsEnabled(MiscCheat.GivePandoraKey)) {
                cheatChangeHooks[MiscCheat.GivePandoraKey](true);
            }
            ServerPlayerInventorySync();
        }
        unload() {
            if (this.o_Player_CanChange) {
                Player.CanChange = this.o_Player_CanChange;
            }
        }
    }

    class GuiMisc extends GuiSubscreen {
        constructor(character) {
            super();
            this.character = character;
        }
        Run() {
            MainCanvas.textAlign = "left";
            DrawText(`- Miscellaneous: Configuration for ${this.character.Name} -`, 125, 125, "Black", "Gray");
            MainCanvas.textAlign = "center";
            DrawButton(1815, 75, 90, 90, "", "White", "Icons/Exit.png", "BCX main menu");
            if (!this.character.isPlayer()) {
                DrawText(`Miscellaneous module configuration is not possible on others`, 1000, 500, "Black");
                return;
            }
            MainCanvas.textAlign = "left";
            DrawCheckbox(125, 200, 64, 64, "Enable typing indicator", !!modStorage.typingIndicatorEnable);
            DrawCheckbox(125, 300, 64, 64, "Cheat: Prevent random NPC events (kidnappings, ransoms, asylum, club slaves)", cheatIsEnabled(MiscCheat.BlockRandomEvents));
            DrawCheckbox(125, 400, 64, 64, "Cheat: Prevent loosing Mistress status when reputation falls below 50 dominance", cheatIsEnabled(MiscCheat.CantLoseMistress));
            DrawCheckbox(125, 500, 64, 64, "Cheat: Give yourself the mistress padlock and its key", cheatIsEnabled(MiscCheat.GiveMistressKey));
            DrawCheckbox(125, 600, 64, 64, "Cheat: Give yourself the pandora padlock and its key", cheatIsEnabled(MiscCheat.GivePandoraKey));
        }
        Click() {
            if (MouseIn(1815, 75, 90, 90))
                return this.Exit();
            if (!this.character.isPlayer())
                return;
            if (MouseIn(125, 200, 64, 64)) {
                modStorage.typingIndicatorEnable = !modStorage.typingIndicatorEnable;
                modStorageSync();
            }
            if (MouseIn(125, 300, 64, 64)) {
                cheatToggle(MiscCheat.BlockRandomEvents);
            }
            if (MouseIn(125, 400, 64, 64)) {
                cheatToggle(MiscCheat.CantLoseMistress);
            }
            if (MouseIn(125, 500, 64, 64)) {
                cheatToggle(MiscCheat.GiveMistressKey);
            }
            if (MouseIn(125, 600, 64, 64)) {
                cheatToggle(MiscCheat.GivePandoraKey);
            }
        }
        Exit() {
            setSubscreen(new GuiMainMenu(this.character));
        }
    }

    class GuiConditionEdit extends GuiSubscreen {
        constructor(character, conditionCategory, conditionName, back) {
            super();
            this.conditionCategoryData = null;
            this.conditionData = null;
            this.failed = false;
            this.changes = null;
            this.character = character;
            this.conditionCategory = conditionCategory;
            this.conditionName = conditionName;
            this.back = back;
        }
        makeChangesData() {
            var _a;
            if (!this.conditionData) {
                throw new Error("Data required");
            }
            return (_a = this.changes) !== null && _a !== void 0 ? _a : cloneDeep(this.conditionData);
        }
        Load() {
            this.requestData();
        }
        onChange(sender) {
            if (sender === this.character.MemberNumber) {
                this.requestData();
            }
        }
        requestData() {
            this.conditionCategoryData = null;
            this.conditionData = null;
            this.failed = false;
            this.onDataChange();
            this.character.conditionsGetByCategory(this.conditionCategory).then(res => {
                if (!this.active)
                    return;
                const condition = res.conditions[this.conditionName];
                if (condition) {
                    this.conditionCategoryData = res;
                    this.conditionData = condition;
                    if (!this.checkAccess()) {
                        this.changes = null;
                    }
                    this.onDataChange();
                }
                else {
                    console.warn(`BCX: Condition ${this.conditionCategory}:${this.conditionName} not found in list from ${this.character}`);
                    this.failed = true;
                    this.Exit();
                }
            }, err => {
                console.error(`BCX: Failed to get condition info for ${this.conditionCategory}:${this.conditionName} from ${this.character}`, err);
                this.failed = true;
            });
        }
        onDataChange() {
            var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m;
            let inputRoomName = document.getElementById("BCX_ConditionRoomName");
            let inputMemberNumber = document.getElementById("BCX_ConditionMemberNumber");
            if (!this.conditionCategoryData || !this.conditionData) {
                if (inputRoomName) {
                    inputRoomName.remove();
                }
                if (inputMemberNumber) {
                    inputMemberNumber.remove();
                }
                return;
            }
            const data = (_a = this.changes) !== null && _a !== void 0 ? _a : this.conditionData;
            const requirements = (_b = data.requirements) !== null && _b !== void 0 ? _b : this.conditionCategoryData.requirements;
            const useGlobalCategorySetting = !data.requirements;
            const access = this.checkAccess();
            const disabled = !access || useGlobalCategorySetting;
            if (!inputRoomName) {
                inputRoomName = ElementCreateInput("BCX_ConditionRoomName", "text", (_d = (_c = requirements.roomName) === null || _c === void 0 ? void 0 : _c.name) !== null && _d !== void 0 ? _d : "", "30");
                inputRoomName.oninput = () => {
                    this.changes = this.makeChangesData();
                    this.processInputs();
                };
            }
            if (!inputMemberNumber) {
                inputMemberNumber = ElementCreateInput("BCX_ConditionMemberNumber", "text", (_g = (_f = (_e = requirements.player) === null || _e === void 0 ? void 0 : _e.memberNumber) === null || _f === void 0 ? void 0 : _f.toString()) !== null && _g !== void 0 ? _g : "0", "6");
                inputMemberNumber.inputMode = "numeric";
                inputMemberNumber.pattern = "[0-9]+";
                inputMemberNumber.oninput = () => {
                    this.changes = this.makeChangesData();
                    this.processInputs();
                };
            }
            inputRoomName.disabled = disabled || !requirements.roomName;
            inputMemberNumber.disabled = disabled || !requirements.player;
            if (!this.changes || disabled || !requirements.roomName) {
                inputRoomName.value = (_j = (_h = requirements.roomName) === null || _h === void 0 ? void 0 : _h.name) !== null && _j !== void 0 ? _j : "";
            }
            if (!this.changes || disabled || !requirements.player) {
                inputMemberNumber.value = (_m = (_l = (_k = requirements.player) === null || _k === void 0 ? void 0 : _k.memberNumber) === null || _l === void 0 ? void 0 : _l.toString()) !== null && _m !== void 0 ? _m : "0";
            }
        }
        processInputs() {
            var _a, _b, _c, _d, _e;
            const inputRoomName = document.getElementById("BCX_ConditionRoomName");
            const inputMemberNumber = document.getElementById("BCX_ConditionMemberNumber");
            if (this.changes && inputRoomName && inputMemberNumber) {
                if ((_a = this.changes.requirements) === null || _a === void 0 ? void 0 : _a.roomName) {
                    this.changes.requirements.roomName.name = inputRoomName.value;
                }
                if ((_b = this.changes.requirements) === null || _b === void 0 ? void 0 : _b.player) {
                    const memberNumber = inputMemberNumber.value;
                    if (!memberNumber)
                        return;
                    if (/^[0-9]+$/.test(memberNumber)) {
                        this.changes.requirements.player.memberNumber = Number.parseInt(memberNumber, 10);
                    }
                    else {
                        inputMemberNumber.value = ((_e = (_d = (_c = this.changes.requirements) === null || _c === void 0 ? void 0 : _c.player) === null || _d === void 0 ? void 0 : _d.memberNumber) !== null && _e !== void 0 ? _e : 0).toString();
                    }
                }
            }
        }
        checkAccess() {
            var _a;
            if (!this.conditionCategoryData)
                return false;
            const limit = (_a = this.conditionCategoryData.limits[this.conditionName]) !== null && _a !== void 0 ? _a : ConditionsLimit.normal;
            return [this.conditionCategoryData.access_normal, this.conditionCategoryData.access_limited, false][limit];
        }
        Run() {
            var _a, _b, _c, _d, _e, _f, _g, _h, _j;
            MainCanvas.textAlign = "left";
            DrawText(`- ${this.headerText()} -`, 125, 125, "Black", "Gray");
            MainCanvas.textAlign = "center";
            if (this.changes) {
                DrawButton(1815, 75, 90, 90, "", "White", "Icons/Accept.png", "Save all changes and go back");
                DrawButton(1815, 190, 90, 90, "", "White", "Icons/Cancel.png", "Go back without saving");
            }
            else {
                DrawButton(1815, 75, 90, 90, "", "White", "Icons/Exit.png", "Back");
            }
            if (this.conditionCategoryData === null || this.conditionData === null) {
                MainCanvas.textAlign = "center";
                DrawText(this.failed ? `Failed to get data from ${this.character.Name}. Maybe you have no access?` : "Loading...", 1000, 480, "Black");
                return true;
            }
            if (this.changes && this.changes.timer !== null && this.changes.timer < Date.now()) {
                this.changes.timer = null;
                this.changes.timerRemove = false;
                this.changes.active = false;
            }
            const data = (_a = this.changes) !== null && _a !== void 0 ? _a : this.conditionData;
            const requirements = (_b = data.requirements) !== null && _b !== void 0 ? _b : this.conditionCategoryData.requirements;
            const useGlobalCategorySetting = !data.requirements;
            const access = this.checkAccess();
            const disabled = !access || useGlobalCategorySetting;
            // Spacer
            MainCanvas.beginPath();
            MainCanvas.moveTo(98, 272);
            MainCanvas.lineTo(960, 272);
            MainCanvas.strokeStyle = "Gray";
            MainCanvas.stroke();
            MainCanvas.beginPath();
            MainCanvas.moveTo(98, 540);
            MainCanvas.lineTo(960, 540);
            MainCanvas.stroke();
            // on-off toggle
            MainCanvas.textAlign = "left";
            DrawCheckbox(125, 180, 64, 64, `This ${this.conditionCategory.slice(0, -1)} is active and in effect`, data.active, !access);
            // global-category-configuration-is-active highlighting
            if (useGlobalCategorySetting) {
                MainCanvas.fillStyle = "#0052A3";
                MainCanvas.fillRect(120, 615, 74, 74);
                MainCanvas.fillRect(120, 695, 74, 74);
                MainCanvas.fillRect(120, 775, 74, 74);
                MainCanvas.fillRect(120, 855, 74, 74);
            }
            ////// status and timer area
            MainCanvas.textAlign = "center";
            let statusText;
            if (data.timer === null) {
                statusText = "Timer disabled";
            }
            else {
                statusText = `Time left: `;
                const seconds = Math.floor((data.timer - Date.now()) / 1000);
                const minutes = Math.floor(seconds / 60);
                const hours = Math.floor(minutes / 60);
                const days = Math.floor(hours / 24);
                if (days > 0) {
                    statusText += `${days} days, `;
                }
                if (hours > 0) {
                    statusText += `${hours % 24} hours, `;
                }
                if (minutes > 0) {
                    statusText += `${minutes % 60} minutes, `;
                }
                if (seconds > 0) {
                    statusText += `${seconds % 60} seconds`;
                }
            }
            DrawText(statusText, 530, 311, "Black");
            if (data.timer === null) {
                DrawButton(120, 360, 820, 160, "Enable timer", "White");
                MainCanvas.textAlign = "left";
            }
            else {
                DrawButton(120, 360, 85, 60, "-1d", !access ? "#ddd" : "White", "", "Remove 1 day from the timer", !access);
                DrawButton(120 + 125, 360, 85, 60, "-1h", !access ? "#ddd" : "White", "", "Remove 1 hour from the timer", !access);
                DrawButton(120 + 2 * (125), 360, 85, 60, "-5m", !access ? "#ddd" : "White", "", "Remove 5 minutes from the timer", !access);
                DrawButton(120 + 3 * (125), 360, 70, 60, "∞", !access ? "#ddd" : "White", "", "Set lifetime to infinite", !access);
                DrawButton(105 + 4 * (125), 360, 85, 60, "+5m", !access ? "#ddd" : "White", "", "Add 5 minutes to the timer", !access);
                DrawButton(105 + 5 * (125), 360, 85, 60, "+1h", !access ? "#ddd" : "White", "", "Add 1 hour to the timer", !access);
                DrawButton(105 + 6 * (125), 360, 85, 60, "+1d", !access ? "#ddd" : "White", "", "Add 1 day to the timer", !access);
                MainCanvas.textAlign = "left";
                DrawCheckbox(125, 450, 64, 64, `Remove the ${this.conditionCategory.slice(0, -1)} when timer runs out`, data.timerRemove, !access);
            }
            ////// condition factors area
            DrawText(`${capitalizeFirstLetter(this.conditionCategory.slice(0, -1))} trigger conditions (always, if all unselected):`, 130, 580, "Black", "");
            // In room
            DrawCheckbox(125, 620, 64, 64, "when", !!requirements.room, disabled);
            MainCanvas.textAlign = "center";
            DrawButton(324, 622, 115, 60, ((_c = requirements.room) === null || _c === void 0 ? void 0 : _c.inverted) ? "not in" : "in", disabled || !requirements.room ? "#ddd" : "White", "", "", disabled || !requirements.room);
            DrawButton(324 + 115 + 14, 622, 130, 60, ((_d = requirements.room) === null || _d === void 0 ? void 0 : _d.type) === "private" ? "private" : "public", disabled || !requirements.room ? "#ddd" : "White", "", "", disabled || !requirements.room);
            MainCanvas.textAlign = "left";
            DrawText(`room`, 324 + 115 + 14 + 130 + 14, 620 + 32, "Black", "Gray");
            if (requirements.room) {
                const inChatroom = ServerPlayerIsInChatRoom();
                const chatroomPrivate = inChatroom && ChatRoomData && ChatRoomData.Private;
                const res = inChatroom &&
                    (requirements.room.type === "public" ? !chatroomPrivate : chatroomPrivate);
                MainCanvas.fillStyle = (requirements.room.inverted ? !res : res) ? "#00FF22" : "#AA0000";
                MainCanvas.fillRect(95, 620, 15, 64);
            }
            // In room named
            DrawCheckbox(125, 700, 64, 64, "when", !!requirements.roomName, disabled);
            MainCanvas.textAlign = "center";
            DrawButton(324, 702, 115, 60, ((_e = requirements.roomName) === null || _e === void 0 ? void 0 : _e.inverted) ? "not in" : "in", disabled || !requirements.roomName ? "#ddd" : "White", "", "", disabled || !requirements.roomName);
            MainCanvas.textAlign = "left";
            DrawText(`room named`, 324 + 115 + 14, 700 + 32, "Black", "Gray");
            ElementPosition("BCX_ConditionRoomName", 324 + 115 + 14 + 360, 700 + 26, 285, 60);
            if (requirements.roomName) {
                const inChatroom = ServerPlayerIsInChatRoom();
                const res = inChatroom &&
                    ChatRoomData &&
                    typeof ChatRoomData.Name === "string" &&
                    ChatRoomData.Name.toLocaleLowerCase() === requirements.roomName.name.toLocaleLowerCase();
                MainCanvas.fillStyle = (requirements.roomName.inverted ? !res : res) ? "#00FF22" : "#AA0000";
                MainCanvas.fillRect(95, 700, 15, 64);
            }
            // In presence of role
            DrawCheckbox(125, 780, 64, 64, "when", !!requirements.role, disabled);
            MainCanvas.textAlign = "center";
            DrawButton(324, 782, 115, 60, ((_f = requirements.role) === null || _f === void 0 ? void 0 : _f.inverted) ? "not in" : "in", disabled || !requirements.role ? "#ddd" : "White", "", "", disabled || !requirements.role);
            const roleSelection = (_h = (_g = requirements.role) === null || _g === void 0 ? void 0 : _g.role) !== null && _h !== void 0 ? _h : AccessLevel.mistress;
            const roleSelectionNext = roleSelection < AccessLevel.public ? roleSelection + 1 : AccessLevel.clubowner;
            const roleSelectionPrev = roleSelection > AccessLevel.clubowner ? roleSelection - 1 : AccessLevel.public;
            DrawBackNextButton(324 + 115 + 14 + 242, 782, 244, 60, capitalizeFirstLetter(AccessLevel[roleSelection]) + (roleSelection !== AccessLevel.clubowner ? " ↑" : ""), disabled || !requirements.role ? "#ddd" : "White", "", () => capitalizeFirstLetter(AccessLevel[roleSelectionPrev]), () => capitalizeFirstLetter(AccessLevel[roleSelectionNext]), disabled || !requirements.role);
            MainCanvas.textAlign = "left";
            DrawText(`room with role`, 324 + 115 + 14, 780 + 32, "Black", "Gray");
            if (requirements.role) {
                const inChatroom = ServerPlayerIsInChatRoom();
                const res = inChatroom && getAllCharactersInRoom().length > 1 && this.conditionCategoryData.highestRoleInRoom <= requirements.role.role;
                MainCanvas.fillStyle = (requirements.role.inverted ? !res : res) ? "#00FF22" : "#AA0000";
                MainCanvas.fillRect(95, 780, 15, 64);
            }
            // In presence of player
            DrawCheckbox(125, 860, 64, 64, "when", !!requirements.player, disabled);
            MainCanvas.textAlign = "center";
            DrawButton(324, 862, 115, 60, ((_j = requirements.player) === null || _j === void 0 ? void 0 : _j.inverted) ? "not in" : "in", disabled || !requirements.player ? "#ddd" : "White", "", "", disabled || !requirements.player);
            MainCanvas.textAlign = "left";
            DrawText(`room with member`, 324 + 115 + 14, 860 + 32, "Black", "Gray");
            ElementPositionFix("BCX_ConditionMemberNumber", 40, 768, 860, 162, 60);
            if (requirements.player) {
                const inChatroom = ServerPlayerIsInChatRoom();
                const res = inChatroom &&
                    getAllCharactersInRoom().some(c => c.MemberNumber === requirements.player.memberNumber);
                MainCanvas.fillStyle = (requirements.player.inverted ? !res : res) ? "#00FF22" : "#AA0000";
                MainCanvas.fillRect(95, 860, 15, 64);
                const input = document.getElementById("BCX_ConditionMemberNumber");
                if (input && document.activeElement === input) {
                    DrawHoverElements.push(() => {
                        if (!requirements.player)
                            return;
                        const Left = 957;
                        const Top = 858;
                        MainCanvas.fillStyle = "#FFFF88";
                        MainCanvas.fillRect(Left, Top, 450, 65);
                        MainCanvas.lineWidth = 2;
                        MainCanvas.strokeStyle = 'black';
                        MainCanvas.strokeRect(Left, Top, 450, 65);
                        DrawTextFit(getCharacterName(requirements.player.memberNumber, "[unknown]"), Left + 225, Top + 33, 444, "black");
                    });
                }
            }
            ////// global category configuration toggle
            MainCanvas.beginPath();
            MainCanvas.rect(1190, 830, 720, 104);
            MainCanvas.strokeStyle = "#0052A3";
            MainCanvas.stroke();
            DrawCheckbox(1210, 850, 64, 64, `Set to global ${this.conditionCategory} configuration`, useGlobalCategorySetting, !access);
            MainCanvas.beginPath();
            MainCanvas.ellipse(1877 + 33, 800 + 30, 22, 22, 360, 0, 360);
            MainCanvas.fillStyle = "#0052A3";
            MainCanvas.fill();
            DrawImageEx("Icons/General.png", 1877 + 10, 800 + 7, {
                Height: 46,
                Width: 46
            });
            // hover text for timer behavior toggle
            MainCanvas.textAlign = "center";
            if (data.timer !== null && MouseIn(125, 450, 80, 64))
                DrawButtonHover(125, 450, 64, 64, `Removes ${this.conditionCategory.slice(0, -1)} instead of only deactivating it `);
            // hover text for clobal configuration category toggle
            if (MouseIn(1190, 830, 100, 104))
                DrawButtonHover(1786, 854, 64, 64, `Overwrites current trigger conditions`);
            return false;
        }
        Click() {
            var _a, _b, _c, _d, _e;
            if (MouseIn(1815, 75, 90, 90)) {
                if (this.changes) {
                    this.processInputs();
                    this.character.conditionUpdate(this.conditionCategory, this.conditionName, this.changes);
                }
                this.Exit();
                return true;
            }
            // Cancel
            if (this.changes && MouseIn(1815, 190, 90, 90)) {
                this.Exit();
                return true;
            }
            if (this.conditionCategoryData === null || this.conditionData === null)
                return true;
            if (!this.checkAccess())
                return false;
            const data = (_a = this.changes) !== null && _a !== void 0 ? _a : this.conditionData;
            // on-off toggle
            if (MouseIn(125, 180, 64, 64)) {
                this.changes = this.makeChangesData();
                this.changes.active = !this.changes.active;
                return true;
            }
            ////// status and timer area
            if (data.timer === null) {
                // Enable timer
                if (MouseIn(120, 360, 820, 160)) {
                    this.changes = this.makeChangesData();
                    this.changes.timer = Date.now() + 5 * 60 * 1000;
                    return true;
                }
            }
            else {
                // -1d
                if (MouseIn(120, 360, 85, 60)) {
                    this.changes = this.makeChangesData();
                    this.changes.timer -= 1 * 24 * 60 * 60 * 1000;
                    return true;
                }
                // -1h
                if (MouseIn(120 + 125, 360, 85, 60)) {
                    this.changes = this.makeChangesData();
                    this.changes.timer -= 1 * 60 * 60 * 1000;
                    return true;
                }
                // -5m
                if (MouseIn(120 + 2 * (125), 360, 85, 60)) {
                    this.changes = this.makeChangesData();
                    this.changes.timer -= 5 * 60 * 1000;
                    return true;
                }
                // Disable timer
                if (MouseIn(120 + 3 * (125), 360, 70, 60)) {
                    this.changes = this.makeChangesData();
                    this.changes.timer = null;
                    this.changes.timerRemove = false;
                    return true;
                }
                // +5m
                if (MouseIn(105 + 4 * (125), 360, 85, 60)) {
                    this.changes = this.makeChangesData();
                    this.changes.timer += 5 * 60 * 1000;
                    return true;
                }
                // +1h
                if (MouseIn(105 + 5 * (125), 360, 85, 60)) {
                    this.changes = this.makeChangesData();
                    this.changes.timer += 1 * 60 * 60 * 1000;
                    return true;
                }
                // +1d
                if (MouseIn(105 + 6 * (125), 360, 85, 60)) {
                    this.changes = this.makeChangesData();
                    this.changes.timer += 1 * 24 * 60 * 60 * 1000;
                    return true;
                }
                // Timer remove toggle
                if (MouseIn(125, 450, 64, 64)) {
                    this.changes = this.makeChangesData();
                    this.changes.timerRemove = !this.changes.timerRemove;
                    return true;
                }
            }
            ////// condition factors area
            const useGlobalCategorySetting = !(this.changes ? this.changes.requirements : this.conditionData.requirements);
            const requirements = (_b = (this.changes ? this.changes.requirements : this.conditionData.requirements)) !== null && _b !== void 0 ? _b : this.conditionCategoryData.requirements;
            // In room
            if (MouseIn(125, 620, 64, 64) && !useGlobalCategorySetting) {
                this.changes = this.makeChangesData();
                this.changes.requirements.room = this.changes.requirements.room ? undefined : { type: "public" };
                return true;
            }
            if (MouseIn(324, 622, 115, 60) && !useGlobalCategorySetting && requirements.room) {
                this.changes = this.makeChangesData();
                this.changes.requirements.room.inverted = this.changes.requirements.room.inverted ? undefined : true;
                return true;
            }
            if (MouseIn(324 + 115 + 14, 622, 130, 60) && !useGlobalCategorySetting && requirements.room) {
                this.changes = this.makeChangesData();
                this.changes.requirements.room.type = this.changes.requirements.room.type === "public" ? "private" : "public";
                return true;
            }
            // In room named
            if (MouseIn(125, 700, 64, 64) && !useGlobalCategorySetting) {
                this.changes = this.makeChangesData();
                this.changes.requirements.roomName = this.changes.requirements.roomName ? undefined : { name: "" };
                this.onDataChange();
                return true;
            }
            if (MouseIn(324, 702, 115, 60) && !useGlobalCategorySetting && requirements.roomName) {
                this.changes = this.makeChangesData();
                this.changes.requirements.roomName.inverted = this.changes.requirements.roomName.inverted ? undefined : true;
                return true;
            }
            // In presence of role
            if (MouseIn(125, 780, 64, 64) && !useGlobalCategorySetting) {
                this.changes = this.makeChangesData();
                this.changes.requirements.role = this.changes.requirements.role ? undefined : { role: AccessLevel.mistress };
                return true;
            }
            if (MouseIn(324, 782, 115, 60) && !useGlobalCategorySetting && requirements.role) {
                this.changes = this.makeChangesData();
                this.changes.requirements.role.inverted = this.changes.requirements.role.inverted ? undefined : true;
                return true;
            }
            const roleSelection = (_d = (_c = requirements.role) === null || _c === void 0 ? void 0 : _c.role) !== null && _d !== void 0 ? _d : AccessLevel.mistress;
            if (MouseIn(324 + 115 + 14 + 274, 782, 106, 60) && !useGlobalCategorySetting && requirements.role) {
                this.changes = this.makeChangesData();
                this.changes.requirements.role.role = roleSelection > AccessLevel.clubowner ? roleSelection - 1 : AccessLevel.public;
                return true;
            }
            if (MouseIn(324 + 115 + 14 + 274 + 106, 782, 106, 60) && !useGlobalCategorySetting && requirements.role) {
                this.changes = this.makeChangesData();
                this.changes.requirements.role.role = roleSelection < AccessLevel.public ? roleSelection + 1 : AccessLevel.clubowner;
                return true;
            }
            // In presence of player
            if (MouseIn(125, 860, 64, 64)) {
                this.changes = this.makeChangesData();
                this.changes.requirements.player = this.changes.requirements.player ? undefined : { memberNumber: 0 };
                this.onDataChange();
                return true;
            }
            if (MouseIn(324, 862, 115, 60) && !useGlobalCategorySetting && requirements.player) {
                this.changes = this.makeChangesData();
                this.changes.requirements.player.inverted = this.changes.requirements.player.inverted ? undefined : true;
                return true;
            }
            ////// global category configuration toggle
            if (MouseIn(1210, 850, 64, 64)) {
                this.changes = this.makeChangesData();
                this.changes.requirements = this.changes.requirements ? null : cloneDeep((_e = this.conditionData.requirements) !== null && _e !== void 0 ? _e : this.conditionCategoryData.requirements);
                this.onDataChange();
                return true;
            }
            return false;
        }
        Exit() {
            setSubscreen(this.back);
        }
        Unload() {
            ElementRemove("BCX_ConditionRoomName");
            ElementRemove("BCX_ConditionMemberNumber");
        }
    }

    class GuiConditionEditCurses extends GuiConditionEdit {
        constructor(character, conditionName, back) {
            super(character, "curses", conditionName, back);
            this.item = null;
            this.allowSettingsCurse = false;
        }
        headerText() {
            const group = AssetGroup.find(i => i.Name === this.conditionName);
            return `View / Edit the '${group ? getVisibleGroupName(group) : "[ERROR]"}' curse`;
        }
        onDataChange() {
            var _a, _b;
            super.onDataChange();
            if (!this.conditionCategoryData || !this.conditionData) {
                return;
            }
            if (this.conditionData.data) {
                this.item = AssetGet(this.character.Character.AssetFamily, this.conditionName, this.conditionData.data.Name);
                this.allowSettingsCurse = this.conditionData.data.curseProperties || !this.item || curseAllowItemCurseProperty(this.item);
            }
            else {
                this.item = null;
                this.allowSettingsCurse = false;
            }
            if (this.changes && ((_a = this.changes.data) === null || _a === void 0 ? void 0 : _a.Name) !== ((_b = this.conditionData.data) === null || _b === void 0 ? void 0 : _b.Name)) {
                this.changes.data = cloneDeep(this.conditionData.data);
            }
        }
        Run() {
            var _a;
            if (super.Run() || this.conditionCategoryData === null || this.conditionData === null)
                return true;
            const data = (_a = this.changes) !== null && _a !== void 0 ? _a : this.conditionData;
            const access = this.checkAccess();
            MainCanvas.textAlign = "left";
            ////// right side: special curse category options
            if (this.allowSettingsCurse && data.data) {
                DrawCheckbox(1050, 175, 64, 64, "Also curse the item's configuration", data.data.curseProperties, !access);
                DrawText(`Example: which rope tie is used`, 1151, 287, "Black", "");
            }
            return false;
        }
        Click() {
            var _a;
            if (super.Click() || this.conditionCategoryData === null || this.conditionData === null)
                return true;
            if (!this.checkAccess())
                return false;
            const data = (_a = this.changes) !== null && _a !== void 0 ? _a : this.conditionData;
            if (MouseIn(1050, 175, 64, 64) && this.allowSettingsCurse && data.data) {
                this.changes = this.makeChangesData();
                this.changes.data.curseProperties = !this.changes.data.curseProperties;
                return true;
            }
            return false;
        }
    }

    class GuiConditionGlobal extends GuiSubscreen {
        constructor(character, conditionCategory, back) {
            super();
            this.conditionCategoryData = null;
            this.failed = false;
            this.changes = null;
            this.character = character;
            this.conditionCategory = conditionCategory;
            this.back = back;
        }
        makeChangesData() {
            var _a;
            if (!this.conditionCategoryData) {
                throw new Error("Data required");
            }
            return (_a = this.changes) !== null && _a !== void 0 ? _a : {
                requirements: cloneDeep(this.conditionCategoryData.requirements),
                timer: this.conditionCategoryData.timer,
                timerRemove: this.conditionCategoryData.timerRemove
            };
        }
        Load() {
            this.requestData();
        }
        onChange(sender) {
            if (sender === this.character.MemberNumber) {
                this.requestData();
            }
        }
        requestData() {
            this.conditionCategoryData = null;
            this.failed = false;
            this.onDataChange();
            this.character.conditionsGetByCategory(this.conditionCategory).then(res => {
                if (!this.active)
                    return;
                this.conditionCategoryData = res;
                if (!this.checkAccess()) {
                    this.changes = null;
                }
                this.onDataChange();
            }, err => {
                console.error(`BCX: Failed to get condition info for ${this.conditionCategory} from ${this.character}`, err);
                this.failed = true;
            });
        }
        onDataChange() {
            var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l;
            let inputRoomName = document.getElementById("BCX_ConditionRoomName");
            let inputMemberNumber = document.getElementById("BCX_ConditionMemberNumber");
            if (!this.conditionCategoryData) {
                if (inputRoomName) {
                    inputRoomName.remove();
                }
                if (inputMemberNumber) {
                    inputMemberNumber.remove();
                }
                return;
            }
            const data = (_a = this.changes) !== null && _a !== void 0 ? _a : this.conditionCategoryData;
            const requirements = data.requirements;
            const access = this.checkAccess();
            const disabled = !access;
            if (!inputRoomName) {
                inputRoomName = ElementCreateInput("BCX_ConditionRoomName", "text", (_c = (_b = requirements.roomName) === null || _b === void 0 ? void 0 : _b.name) !== null && _c !== void 0 ? _c : "", "30");
                inputRoomName.oninput = () => {
                    this.changes = this.makeChangesData();
                    this.processInputs();
                };
            }
            if (!inputMemberNumber) {
                inputMemberNumber = ElementCreateInput("BCX_ConditionMemberNumber", "text", (_f = (_e = (_d = requirements.player) === null || _d === void 0 ? void 0 : _d.memberNumber) === null || _e === void 0 ? void 0 : _e.toString()) !== null && _f !== void 0 ? _f : "0", "6");
                inputMemberNumber.inputMode = "numeric";
                inputMemberNumber.pattern = "[0-9]+";
                inputMemberNumber.oninput = () => {
                    this.changes = this.makeChangesData();
                    this.processInputs();
                };
            }
            inputRoomName.disabled = disabled || !requirements.roomName;
            inputMemberNumber.disabled = disabled || !requirements.player;
            if (!this.changes || disabled || !requirements.roomName) {
                inputRoomName.value = (_h = (_g = requirements.roomName) === null || _g === void 0 ? void 0 : _g.name) !== null && _h !== void 0 ? _h : "";
            }
            if (!this.changes || disabled || !requirements.player) {
                inputMemberNumber.value = (_l = (_k = (_j = requirements.player) === null || _j === void 0 ? void 0 : _j.memberNumber) === null || _k === void 0 ? void 0 : _k.toString()) !== null && _l !== void 0 ? _l : "0";
            }
        }
        processInputs() {
            var _a, _b, _c, _d, _e;
            const inputRoomName = document.getElementById("BCX_ConditionRoomName");
            const inputMemberNumber = document.getElementById("BCX_ConditionMemberNumber");
            if (this.changes && inputRoomName && inputMemberNumber) {
                if ((_a = this.changes.requirements) === null || _a === void 0 ? void 0 : _a.roomName) {
                    this.changes.requirements.roomName.name = inputRoomName.value;
                }
                if ((_b = this.changes.requirements) === null || _b === void 0 ? void 0 : _b.player) {
                    const memberNumber = inputMemberNumber.value;
                    if (!memberNumber)
                        return;
                    if (/^[0-9]+$/.test(memberNumber)) {
                        this.changes.requirements.player.memberNumber = Number.parseInt(memberNumber, 10);
                    }
                    else {
                        inputMemberNumber.value = ((_e = (_d = (_c = this.changes.requirements) === null || _c === void 0 ? void 0 : _c.player) === null || _d === void 0 ? void 0 : _d.memberNumber) !== null && _e !== void 0 ? _e : 0).toString();
                    }
                }
            }
        }
        checkAccess() {
            if (!this.conditionCategoryData)
                return false;
            return this.conditionCategoryData.access_configure;
        }
        Run() {
            var _a, _b, _c, _d, _e, _f, _g, _h;
            MainCanvas.textAlign = "left";
            DrawText(`- ${this.headerText()} -`, 125, 125, "Black", "Gray");
            MainCanvas.textAlign = "center";
            if (this.changes) {
                DrawButton(1815, 75, 90, 90, "", "White", "Icons/Accept.png", "Save all changes and go back");
                DrawButton(1815, 190, 90, 90, "", "White", "Icons/Cancel.png", "Go back without saving");
            }
            else {
                DrawButton(1815, 75, 90, 90, "", "White", "Icons/Exit.png", "Back");
            }
            if (this.conditionCategoryData === null) {
                MainCanvas.textAlign = "center";
                DrawText(this.failed ? `Failed to get data from ${this.character.Name}. Maybe you have no access?` : "Loading...", 1000, 480, "Black");
                return true;
            }
            if (this.changes && this.changes.timer !== null && this.changes.timer <= 0) {
                this.changes.timer = null;
                this.changes.timerRemove = false;
            }
            const data = (_a = this.changes) !== null && _a !== void 0 ? _a : this.conditionCategoryData;
            const requirements = data.requirements;
            const access = this.checkAccess();
            const disabled = !access;
            // Spacer
            MainCanvas.beginPath();
            MainCanvas.moveTo(98, 272);
            MainCanvas.lineTo(960, 272);
            MainCanvas.strokeStyle = "Gray";
            MainCanvas.stroke();
            MainCanvas.beginPath();
            MainCanvas.moveTo(98, 540);
            MainCanvas.lineTo(960, 540);
            MainCanvas.stroke();
            ////// status and timer area
            MainCanvas.textAlign = "center";
            let statusText;
            if (data.timer === null) {
                statusText = "Timer disabled by default";
            }
            else {
                statusText = `Default timer: `;
                const seconds = Math.floor(data.timer / 1000);
                const minutes = Math.floor(seconds / 60);
                const hours = Math.floor(minutes / 60);
                const days = Math.floor(hours / 24);
                if (days > 0) {
                    statusText += `${days} days, `;
                }
                if (hours > 0) {
                    statusText += `${hours % 24} hours, `;
                }
                if (minutes > 0) {
                    statusText += `${minutes % 60} minutes, `;
                }
                if (seconds > 0) {
                    statusText += `${seconds % 60} seconds`;
                }
            }
            DrawText(statusText, 530, 311, "Black");
            if (data.timer === null) {
                DrawButton(120, 360, 820, 160, "Enable timer", "White");
                MainCanvas.textAlign = "left";
            }
            else {
                DrawButton(120, 360, 85, 60, "-1d", !access ? "#ddd" : "White", "", "Remove 1 day from the timer", !access);
                DrawButton(120 + 125, 360, 85, 60, "-1h", !access ? "#ddd" : "White", "", "Remove 1 hour from the timer", !access);
                DrawButton(120 + 2 * (125), 360, 85, 60, "-5m", !access ? "#ddd" : "White", "", "Remove 5 minutes from the timer", !access);
                DrawButton(120 + 3 * (125), 360, 70, 60, "∞", !access ? "#ddd" : "White", "", "Set lifetime to infinite", !access);
                DrawButton(105 + 4 * (125), 360, 85, 60, "+5m", !access ? "#ddd" : "White", "", "Add 5 minutes to the timer", !access);
                DrawButton(105 + 5 * (125), 360, 85, 60, "+1h", !access ? "#ddd" : "White", "", "Add 1 hour to the timer", !access);
                DrawButton(105 + 6 * (125), 360, 85, 60, "+1d", !access ? "#ddd" : "White", "", "Add 1 day to the timer", !access);
                MainCanvas.textAlign = "left";
                DrawCheckbox(125, 450, 64, 64, `Remove the ${this.conditionCategory.slice(0, -1)} when timer runs out`, data.timerRemove, !access);
            }
            ////// condition factors area
            DrawText(`${capitalizeFirstLetter(this.conditionCategory.slice(0, -1))} trigger conditions (always, if all unselected):`, 130, 580, "Black", "");
            // In room
            DrawCheckbox(125, 620, 64, 64, "when", !!requirements.room, disabled);
            MainCanvas.textAlign = "center";
            DrawButton(324, 622, 115, 60, ((_b = requirements.room) === null || _b === void 0 ? void 0 : _b.inverted) ? "not in" : "in", disabled || !requirements.room ? "#ddd" : "White", "", "", disabled || !requirements.room);
            DrawButton(324 + 115 + 14, 622, 130, 60, ((_c = requirements.room) === null || _c === void 0 ? void 0 : _c.type) === "private" ? "private" : "public", disabled || !requirements.room ? "#ddd" : "White", "", "", disabled || !requirements.room);
            MainCanvas.textAlign = "left";
            DrawText(`room`, 324 + 115 + 14 + 130 + 14, 620 + 32, "Black", "Gray");
            if (requirements.room) {
                const inChatroom = ServerPlayerIsInChatRoom();
                const chatroomPrivate = inChatroom && ChatRoomData && ChatRoomData.Private;
                const res = inChatroom &&
                    (requirements.room.type === "public" ? !chatroomPrivate : chatroomPrivate);
                MainCanvas.fillStyle = (requirements.room.inverted ? !res : res) ? "#00FF22" : "#AA0000";
                MainCanvas.fillRect(95, 620, 15, 64);
            }
            // In room named
            DrawCheckbox(125, 700, 64, 64, "when", !!requirements.roomName, disabled);
            MainCanvas.textAlign = "center";
            DrawButton(324, 702, 115, 60, ((_d = requirements.roomName) === null || _d === void 0 ? void 0 : _d.inverted) ? "not in" : "in", disabled || !requirements.roomName ? "#ddd" : "White", "", "", disabled || !requirements.roomName);
            MainCanvas.textAlign = "left";
            DrawText(`room named`, 324 + 115 + 14, 700 + 32, "Black", "Gray");
            ElementPosition("BCX_ConditionRoomName", 324 + 115 + 14 + 360, 700 + 26, 285, 60);
            if (requirements.roomName) {
                const inChatroom = ServerPlayerIsInChatRoom();
                const res = inChatroom &&
                    ChatRoomData &&
                    typeof ChatRoomData.Name === "string" &&
                    ChatRoomData.Name.toLocaleLowerCase() === requirements.roomName.name.toLocaleLowerCase();
                MainCanvas.fillStyle = (requirements.roomName.inverted ? !res : res) ? "#00FF22" : "#AA0000";
                MainCanvas.fillRect(95, 700, 15, 64);
            }
            // In presence of role
            DrawCheckbox(125, 780, 64, 64, "when", !!requirements.role, disabled);
            MainCanvas.textAlign = "center";
            DrawButton(324, 782, 115, 60, ((_e = requirements.role) === null || _e === void 0 ? void 0 : _e.inverted) ? "not in" : "in", disabled || !requirements.role ? "#ddd" : "White", "", "", disabled || !requirements.role);
            const roleSelection = (_g = (_f = requirements.role) === null || _f === void 0 ? void 0 : _f.role) !== null && _g !== void 0 ? _g : AccessLevel.mistress;
            const roleSelectionNext = roleSelection < AccessLevel.public ? roleSelection + 1 : AccessLevel.clubowner;
            const roleSelectionPrev = roleSelection > AccessLevel.clubowner ? roleSelection - 1 : AccessLevel.public;
            DrawBackNextButton(324 + 115 + 14 + 242, 782, 244, 60, capitalizeFirstLetter(AccessLevel[roleSelection]) + (roleSelection !== AccessLevel.clubowner ? " ↑" : ""), disabled || !requirements.role ? "#ddd" : "White", "", () => capitalizeFirstLetter(AccessLevel[roleSelectionPrev]), () => capitalizeFirstLetter(AccessLevel[roleSelectionNext]), disabled || !requirements.role);
            MainCanvas.textAlign = "left";
            DrawText(`room with role`, 324 + 115 + 14, 780 + 32, "Black", "Gray");
            if (requirements.role) {
                const inChatroom = ServerPlayerIsInChatRoom();
                const res = inChatroom && getAllCharactersInRoom().length > 1 && this.conditionCategoryData.highestRoleInRoom <= requirements.role.role;
                MainCanvas.fillStyle = (requirements.role.inverted ? !res : res) ? "#00FF22" : "#AA0000";
                MainCanvas.fillRect(95, 780, 15, 64);
            }
            // In presence of player
            DrawCheckbox(125, 860, 64, 64, "when", !!requirements.player, disabled);
            MainCanvas.textAlign = "center";
            DrawButton(324, 862, 115, 60, ((_h = requirements.player) === null || _h === void 0 ? void 0 : _h.inverted) ? "not in" : "in", disabled || !requirements.player ? "#ddd" : "White", "", "", disabled || !requirements.player);
            MainCanvas.textAlign = "left";
            DrawText(`room with member`, 324 + 115 + 14, 860 + 32, "Black", "Gray");
            ElementPositionFix("BCX_ConditionMemberNumber", 40, 768, 860, 162, 60);
            if (requirements.player) {
                const inChatroom = ServerPlayerIsInChatRoom();
                const res = inChatroom &&
                    getAllCharactersInRoom().some(c => c.MemberNumber === requirements.player.memberNumber);
                MainCanvas.fillStyle = (requirements.player.inverted ? !res : res) ? "#00FF22" : "#AA0000";
                MainCanvas.fillRect(95, 860, 15, 64);
                const input = document.getElementById("BCX_ConditionMemberNumber");
                if (input && document.activeElement === input) {
                    DrawHoverElements.push(() => {
                        if (!requirements.player)
                            return;
                        const Left = 957;
                        const Top = 858;
                        MainCanvas.fillStyle = "#FFFF88";
                        MainCanvas.fillRect(Left, Top, 450, 65);
                        MainCanvas.lineWidth = 2;
                        MainCanvas.strokeStyle = 'black';
                        MainCanvas.strokeRect(Left, Top, 450, 65);
                        DrawTextFit(getCharacterName(requirements.player.memberNumber, "[unknown]"), Left + 225, Top + 33, 444, "black");
                    });
                }
            }
            // hover text for timer behavior toggle
            MainCanvas.textAlign = "center";
            if (data.timer !== null && MouseIn(125, 450, 80, 64))
                DrawButtonHover(125, 450, 64, 64, `Removes ${this.conditionCategory.slice(0, -1)} instead of only deactivating it `);
            return false;
        }
        Click() {
            var _a, _b, _c;
            if (MouseIn(1815, 75, 90, 90)) {
                if (this.changes) {
                    this.processInputs();
                    this.character.conditionCategoryUpdate(this.conditionCategory, this.changes);
                }
                this.Exit();
                return true;
            }
            // Cancel
            if (this.changes && MouseIn(1815, 190, 90, 90)) {
                this.Exit();
                return true;
            }
            if (this.conditionCategoryData === null)
                return true;
            if (!this.checkAccess())
                return false;
            const data = (_a = this.changes) !== null && _a !== void 0 ? _a : this.conditionCategoryData;
            ////// status and timer area
            if (data.timer === null) {
                // Enable timer
                if (MouseIn(120, 360, 820, 160)) {
                    this.changes = this.makeChangesData();
                    this.changes.timer = 5 * 60 * 1000;
                    return true;
                }
            }
            else {
                // -1d
                if (MouseIn(120, 360, 85, 60)) {
                    this.changes = this.makeChangesData();
                    this.changes.timer -= 1 * 24 * 60 * 60 * 1000;
                    return true;
                }
                // -1h
                if (MouseIn(120 + 125, 360, 85, 60)) {
                    this.changes = this.makeChangesData();
                    this.changes.timer -= 1 * 60 * 60 * 1000;
                    return true;
                }
                // -5m
                if (MouseIn(120 + 2 * (125), 360, 85, 60)) {
                    this.changes = this.makeChangesData();
                    this.changes.timer -= 5 * 60 * 1000;
                    return true;
                }
                // Disable timer
                if (MouseIn(120 + 3 * (125), 360, 70, 60)) {
                    this.changes = this.makeChangesData();
                    this.changes.timer = null;
                    this.changes.timerRemove = false;
                    return true;
                }
                // +5m
                if (MouseIn(105 + 4 * (125), 360, 85, 60)) {
                    this.changes = this.makeChangesData();
                    this.changes.timer += 5 * 60 * 1000;
                    return true;
                }
                // +1h
                if (MouseIn(105 + 5 * (125), 360, 85, 60)) {
                    this.changes = this.makeChangesData();
                    this.changes.timer += 1 * 60 * 60 * 1000;
                    return true;
                }
                // +1d
                if (MouseIn(105 + 6 * (125), 360, 85, 60)) {
                    this.changes = this.makeChangesData();
                    this.changes.timer += 1 * 24 * 60 * 60 * 1000;
                    return true;
                }
                // Timer remove toggle
                if (MouseIn(125, 450, 64, 64)) {
                    this.changes = this.makeChangesData();
                    this.changes.timerRemove = !this.changes.timerRemove;
                    return true;
                }
            }
            ////// condition factors area
            const requirements = data.requirements;
            // In room
            if (MouseIn(125, 620, 64, 64)) {
                this.changes = this.makeChangesData();
                this.changes.requirements.room = this.changes.requirements.room ? undefined : { type: "public" };
                return true;
            }
            if (MouseIn(324, 622, 115, 60) && requirements.room) {
                this.changes = this.makeChangesData();
                this.changes.requirements.room.inverted = this.changes.requirements.room.inverted ? undefined : true;
                return true;
            }
            if (MouseIn(324 + 115 + 14, 622, 130, 60) && requirements.room) {
                this.changes = this.makeChangesData();
                this.changes.requirements.room.type = this.changes.requirements.room.type === "public" ? "private" : "public";
                return true;
            }
            // In room named
            if (MouseIn(125, 700, 64, 64)) {
                this.changes = this.makeChangesData();
                this.changes.requirements.roomName = this.changes.requirements.roomName ? undefined : { name: "" };
                this.onDataChange();
                return true;
            }
            if (MouseIn(324, 702, 115, 60) && requirements.roomName) {
                this.changes = this.makeChangesData();
                this.changes.requirements.roomName.inverted = this.changes.requirements.roomName.inverted ? undefined : true;
                return true;
            }
            // In presence of role
            if (MouseIn(125, 780, 64, 64)) {
                this.changes = this.makeChangesData();
                this.changes.requirements.role = this.changes.requirements.role ? undefined : { role: AccessLevel.mistress };
                return true;
            }
            if (MouseIn(324, 782, 115, 60) && requirements.role) {
                this.changes = this.makeChangesData();
                this.changes.requirements.role.inverted = this.changes.requirements.role.inverted ? undefined : true;
                return true;
            }
            const roleSelection = (_c = (_b = requirements.role) === null || _b === void 0 ? void 0 : _b.role) !== null && _c !== void 0 ? _c : AccessLevel.mistress;
            if (MouseIn(324 + 115 + 14 + 274, 782, 106, 60) && requirements.role) {
                this.changes = this.makeChangesData();
                this.changes.requirements.role.role = roleSelection > AccessLevel.clubowner ? roleSelection - 1 : AccessLevel.public;
                return true;
            }
            if (MouseIn(324 + 115 + 14 + 274 + 106, 782, 106, 60) && requirements.role) {
                this.changes = this.makeChangesData();
                this.changes.requirements.role.role = roleSelection < AccessLevel.public ? roleSelection + 1 : AccessLevel.clubowner;
                return true;
            }
            // In presence of player
            if (MouseIn(125, 860, 64, 64)) {
                this.changes = this.makeChangesData();
                this.changes.requirements.player = this.changes.requirements.player ? undefined : { memberNumber: 0 };
                this.onDataChange();
                return true;
            }
            if (MouseIn(324, 862, 115, 60) && requirements.player) {
                this.changes = this.makeChangesData();
                this.changes.requirements.player.inverted = this.changes.requirements.player.inverted ? undefined : true;
                return true;
            }
            return false;
        }
        Exit() {
            setSubscreen(this.back);
        }
        Unload() {
            ElementRemove("BCX_ConditionRoomName");
            ElementRemove("BCX_ConditionMemberNumber");
        }
    }

    class GuiConditionGlobalCurses extends GuiConditionGlobal {
        constructor(character, back) {
            super(character, "curses", back);
        }
        headerText() {
            return `View / Edit the global ${this.conditionCategory} configuration`;
        }
        Run() {
            if (super.Run() || this.conditionCategoryData === null)
                return true;
            MainCanvas.textAlign = "left";
            DrawText(`Note: Settings are applied to new curses and all existing ones set to the global config.`, 130, 210, "Black", "");
            return false;
        }
        Click() {
            if (super.Click() || this.conditionCategoryData === null)
                return true;
            return false;
        }
    }

    const PER_COLUMN_COUNT = 7;
    const PER_PAGE_COUNT = PER_COLUMN_COUNT * 2;
    class GuiConditionView extends GuiSubscreen {
        constructor(character, conditionCategory) {
            super();
            this.conditionEntries = [];
            this.conditionCategoryData = null;
            this.failed = false;
            this.page = 0;
            this.character = character;
            this.conditionCategory = conditionCategory;
            this.conditionCategorySingluar = conditionCategory.slice(0, -1);
        }
        Load() {
            this.requestData();
        }
        onChange(sender) {
            if (sender === this.character.MemberNumber) {
                this.requestData();
            }
        }
        requestData() {
            this.conditionCategoryData = null;
            this.failed = false;
            this.onDataChange();
            this.character.conditionsGetByCategory(this.conditionCategory).then(res => {
                if (!this.active)
                    return;
                this.conditionCategoryData = res;
                this.onDataChange();
            }, err => {
                console.error(`BCX: Failed to get condition info for ${this.conditionCategory} from ${this.character}`, err);
                this.failed = true;
            });
        }
        onDataChange() {
            var _a;
            if (!this.active)
                return;
            this.conditionEntries = [];
            if (this.conditionCategoryData === null)
                return;
            for (const [condition, data] of Object.entries(this.conditionCategoryData.conditions)) {
                const res = this.loadCondition(condition, data);
                if (res === null)
                    continue;
                const access = [this.conditionCategoryData.access_normal, this.conditionCategoryData.access_limited, false][(_a = this.conditionCategoryData.limits[condition]) !== null && _a !== void 0 ? _a : ConditionsLimit.normal];
                this.conditionEntries.push({
                    condition,
                    access,
                    data,
                    displayName: res[0],
                    extra: res[1]
                });
            }
            this.page = clamp(this.page, 0, Math.ceil(this.conditionEntries.length / PER_PAGE_COUNT));
        }
        Run() {
            MainCanvas.textAlign = "left";
            DrawText(`- ${this.headerText()} -`, 125, 125, "Black", "Gray");
            MainCanvas.textAlign = "center";
            DrawButton(1815, 75, 90, 90, "", "White", "Icons/Exit.png", "BCX main menu");
            // Column separator
            MainCanvas.beginPath();
            MainCanvas.moveTo(953, 160);
            MainCanvas.lineTo(953, 780);
            MainCanvas.stroke();
            if (this.conditionCategoryData === null) {
                MainCanvas.textAlign = "center";
                DrawText(this.failed ? `Failed to get data from ${this.character.Name}. Maybe you have no access?` : "Loading...", 1000, 480, "Black");
                return true;
            }
            for (let off = 0; off < PER_PAGE_COUNT; off++) {
                const i = this.page * PER_PAGE_COUNT + off;
                if (i >= this.conditionEntries.length)
                    break;
                const e = this.conditionEntries[i];
                const Y = 170 + (off % PER_COLUMN_COUNT) * 90;
                const X = 120 + Math.floor(off / PER_COLUMN_COUNT) * 865;
                const useGlobalCategorySetting = !e.data.requirements;
                // curse description
                MainCanvas.textAlign = "left";
                MainCanvas.beginPath();
                MainCanvas.rect(X, Y, 440, 60);
                MainCanvas.stroke();
                this.drawCategoryImage(X, Y, e);
                DrawTextFit(e.displayName, X + 65, Y + 30, 375, "Black");
                // config button info
                MainCanvas.textAlign = "center";
                DrawButton(X + 470, Y, 240, 60, "", e.data.active ? "#d8fed7" : "White");
                if (useGlobalCategorySetting) {
                    MainCanvas.beginPath();
                    MainCanvas.ellipse(X + 470 + 33, Y + 30, 22, 22, 360, 0, 360);
                    MainCanvas.fillStyle = "#0052A3";
                    MainCanvas.fill();
                }
                DrawImageEx("Icons/General.png", X + 480, Y + 7, {
                    Height: 46,
                    Width: 46
                });
                // shows time left (XXd -> XXh -> XXm -> XXs) or ∞
                let timeLeftText = "n/a";
                if (e.data.timer === null) {
                    timeLeftText = "∞";
                }
                else {
                    const seconds = Math.floor((e.data.timer - Date.now()) / 1000);
                    const minutes = Math.floor(seconds / 60);
                    const hours = Math.floor(minutes / 60);
                    const days = Math.floor(hours / 24);
                    if (days > 1) {
                        timeLeftText = `${days}d`;
                    }
                    else if (hours > 1) {
                        timeLeftText = `${hours}h`;
                    }
                    else if (minutes > 1) {
                        timeLeftText = `${minutes}m`;
                    }
                    else if (seconds > 0) {
                        timeLeftText = `${seconds}s`;
                    }
                }
                DrawText(timeLeftText, X + 570, Y + 30, "Black", "");
                this.drawEntryExtra(X, Y, e);
                // remove curse
                if (e.access) {
                    DrawButton(X + 740, Y, 60, 60, "X", "White", "", this.removeLabel);
                }
                if (MouseIn(X + 470, Y, 60, 60)) {
                    DrawHoverElements.push(() => {
                        DrawButtonHover(X + 470, Y, 60, 60, `Change this ${this.conditionCategorySingluar}'s configuration`);
                    });
                }
                if (MouseIn(X + 531, Y, 78, 60)) {
                    DrawHoverElements.push(() => {
                        DrawButtonHover(X + 531, Y, 78, 60, `Remaining duration of the ${this.conditionCategorySingluar}`);
                    });
                }
            }
            MainCanvas.textAlign = "center";
            DrawButton(968, 820, 605, 90, "", this.conditionCategoryData.access_configure ? "White" : "#ddd", "", this.conditionCategoryData.access_configure ? `Existing ${this.conditionCategory} set to global ${this.conditionCategory} config are also changed` : "You have no permission to use this", !this.conditionCategoryData.access_configure);
            DrawText(`Change global ${this.conditionCategory} config`, 968 + 680 / 2, 865, "Black", "");
            MainCanvas.beginPath();
            MainCanvas.ellipse(968 + 10 + 35, 820 + 44, 34, 34, 360, 0, 360);
            MainCanvas.fillStyle = "#0052A3";
            MainCanvas.fill();
            DrawImageEx("Icons/General.png", 968 + 10, 820 + 10, {
                Height: 70,
                Width: 70
            });
            // Pagination
            const totalPages = Math.ceil(this.conditionEntries.length / PER_PAGE_COUNT);
            DrawBackNextButton(1605, 820, 300, 90, `Page ${this.page + 1} / ${Math.max(totalPages, 1)}`, "White", "", () => "", () => "");
            return false;
        }
        Click() {
            if (MouseIn(1815, 75, 90, 90)) {
                this.Exit();
                return true;
            }
            if (this.conditionCategoryData === null)
                return true;
            for (let off = 0; off < PER_PAGE_COUNT; off++) {
                const i = this.page * PER_PAGE_COUNT + off;
                if (i >= this.conditionEntries.length)
                    break;
                const e = this.conditionEntries[i];
                const Y = 170 + (off % PER_COLUMN_COUNT) * 90;
                const X = 120 + Math.floor(off / PER_COLUMN_COUNT) * 865;
                // config button info
                if (MouseIn(X + 470, Y, 240, 60)) {
                    this.openEditSubscreen(e.condition);
                    return true;
                }
                if (e.access && MouseIn(X + 740, Y, 60, 60)) {
                    this.removeCondition(e.condition);
                    return true;
                }
            }
            if (this.conditionCategoryData.access_configure && MouseIn(968, 820, 605, 90)) {
                this.openGlobalConfig();
                return true;
            }
            // Pagination
            const totalPages = Math.ceil(this.conditionEntries.length / PER_PAGE_COUNT);
            if (MouseIn(1605, 800, 150, 90)) {
                this.page--;
                if (this.page < 0) {
                    this.page = Math.max(totalPages - 1, 0);
                }
                return true;
            }
            else if (MouseIn(1755, 800, 150, 90)) {
                this.page++;
                if (this.page >= totalPages) {
                    this.page = 0;
                }
                return true;
            }
            return false;
        }
        Exit() {
            setSubscreen(new GuiMainMenu(this.character));
        }
    }

    class GuiCursesAdd extends GuiSubscreen {
        constructor(character) {
            super();
            this.curseData = null;
            this.failed = false;
            this.permissionMode = false;
            this.character = character;
        }
        Load() {
            this.requestData();
        }
        onChange(sender) {
            if (sender === this.character.MemberNumber) {
                this.requestData();
            }
        }
        requestData() {
            this.curseData = null;
            this.character.conditionsGetByCategory("curses").then(res => {
                this.curseData = res;
                if (!this.curseData.access_changeLimits) {
                    this.permissionMode = false;
                }
            }, err => {
                console.error(`BCX: Failed to get permission info for ${this.character}`, err);
                this.failed = true;
            });
        }
        Run() {
            var _a, _b;
            MainCanvas.textAlign = "left";
            DrawText(`- Curses: Place new curses on ${this.character.Name} -`, 125, 125, "Black", "Gray");
            MainCanvas.textAlign = "center";
            DrawButton(1815, 75, 90, 90, "", "White", "Icons/Exit.png", "Back");
            if (this.curseData === null) {
                DrawText(this.failed ? `Failed to get curse data from ${this.character.Name}. Maybe you have no access?` : "Loading...", 1000, 480, "Black");
                return;
            }
            DrawButton(1815, 190, 90, 90, "", this.curseData.access_changeLimits ? "White" : "#ddd", this.permissionMode ? "Icons/Reset.png" : "Icons/Preference.png", this.curseData.access_changeLimits ?
                (this.permissionMode ? "Leave permission mode" : "Edit curse slot permissions") :
                "You have no permission to change limits", !this.curseData.access_changeLimits);
            // items
            MainCanvas.textAlign = "left";
            MainCanvas.beginPath();
            MainCanvas.rect(105, 165, 830, 64);
            MainCanvas.fillStyle = "#cccccc";
            MainCanvas.fill();
            DrawText(`Items`, 120, 165 + 34, "Black");
            MainCanvas.textAlign = "center";
            if (!this.permissionMode) {
                DrawButton(440, 173, 265, 48, "Curse occupied", "White", undefined, "Curse all items on the body at once");
                DrawButton(720, 173, 200, 48, "Curse all", "White", undefined, "Curse all item slots at once");
            }
            const AssetGroupItems = AssetGroup.filter(g => g.Category === "Item");
            for (let i = 0; i < AssetGroupItems.length; i++) {
                const row = i % 10;
                const column = Math.floor(i / 10);
                const group = AssetGroupItems[i];
                const currentItem = InventoryGet(this.character.Character, group.Name);
                const itemIsCursed = this.curseData.conditions[group.Name] !== undefined;
                const accessLevel = (_a = this.curseData.limits[group.Name]) !== null && _a !== void 0 ? _a : ConditionsLimit.normal;
                const allowCurse = [this.curseData.access_normal, this.curseData.access_limited, false][accessLevel];
                let color;
                let text;
                if (this.permissionMode) {
                    color = ["#ccfece", "#fefc53", "red"][accessLevel];
                    text = ["Normal", "Limited", "Blocked"][accessLevel];
                }
                else {
                    color = itemIsCursed ? "#88c" :
                        !allowCurse ? "#ccc" :
                            (currentItem ? "Gold" : "White");
                    text = itemIsCursed ? "Already cursed" :
                        !allowCurse ? "You have no permission to curse this" :
                            (currentItem ? currentItem.Asset.Description : "Nothing");
                }
                DrawButton(106 + 281 * column, 240 + 69 * row, 265, 54, getVisibleGroupName(group), color, undefined, text, itemIsCursed || !allowCurse || this.permissionMode);
            }
            // clothing
            MainCanvas.textAlign = "left";
            MainCanvas.beginPath();
            MainCanvas.rect(950, 165, 830, 64);
            MainCanvas.fillStyle = "#cccccc";
            MainCanvas.fill();
            DrawText(`Clothing`, 965, 165 + 34, "Black");
            MainCanvas.textAlign = "center";
            if (!this.permissionMode) {
                DrawButton(1285, 173, 265, 48, "Curse occupied", "White", undefined, "Curse all clothes on the body at once");
                DrawButton(1565, 173, 200, 48, "Curse all", "White", undefined, "Curse all clothing slots at once");
            }
            const AssetGroupClothings = AssetGroup.filter(g => g.Category === "Appearance" && g.Clothing);
            for (let i = 0; i < AssetGroupClothings.length; i++) {
                const row = i % 10;
                const column = Math.floor(i / 10);
                const group = AssetGroupClothings[i];
                const currentItem = InventoryGet(this.character.Character, group.Name);
                const clothingIsCursed = this.curseData.conditions[group.Name] !== undefined;
                const accessLevel = (_b = this.curseData.limits[group.Name]) !== null && _b !== void 0 ? _b : ConditionsLimit.normal;
                const allowCurse = [this.curseData.access_normal, this.curseData.access_limited, false][accessLevel];
                let color;
                let text;
                if (this.permissionMode) {
                    color = ["#ccfece", "#fefc53", "red"][accessLevel];
                    text = ["Normal", "Limited", "Blocked"][accessLevel];
                }
                else {
                    color = clothingIsCursed ? "#88c" :
                        !allowCurse ? "#ccc" :
                            (currentItem ? "Gold" : "White");
                    text = clothingIsCursed ? "Already cursed" :
                        !allowCurse ? "You have no permission to curse this" :
                            (currentItem ? currentItem.Asset.Description : "Nothing");
                }
                DrawButton(951 + 281 * column, 240 + 69 * row, 265, 54, getVisibleGroupName(group), color, undefined, text, clothingIsCursed || !allowCurse || this.permissionMode);
            }
            //Body
            // TODO: Actual data
            // const bodyIsCursed = false;
            // DrawButton(1600, 750, 300, 140, "Character Body", bodyIsCursed ? "#ccc" : "White", undefined,
            //	bodyIsCursed ? "Already cursed" : "Size, skin color, eyes, etc.", bodyIsCursed);
            // permission mode legend
            if (this.permissionMode) {
                MainCanvas.fillStyle = "#ccfece";
                MainCanvas.fillRect(1284, 75, 166, 64);
                MainCanvas.fillStyle = "#fefc53";
                MainCanvas.fillRect(1284 + 1 * 166, 75, 166, 64);
                MainCanvas.fillStyle = "red";
                MainCanvas.fillRect(1284 + 2 * 166, 75, 165, 64);
                MainCanvas.textAlign = "center";
                DrawText(`Normal`, 1284 + 166 / 2, 75 + 34, "Black");
                DrawText(`Limited`, 1284 + 1 * 166 + 166 / 2, 75 + 34, "Black");
                DrawText(`Blocked`, 1284 + 2 * 166 + 166 / 2, 75 + 34, "Black");
            }
        }
        Click() {
            var _a, _b;
            if (MouseIn(1815, 75, 90, 90))
                return this.Exit();
            if (this.curseData === null)
                return;
            // Permission mode
            if (MouseIn(1815, 190, 90, 90)) {
                this.permissionMode = this.curseData.access_changeLimits && !this.permissionMode;
                return;
            }
            // items
            const AssetGroupItems = AssetGroup.filter(g => g.Category === "Item");
            for (let i = 0; i < AssetGroupItems.length; i++) {
                const row = i % 10;
                const column = Math.floor(i / 10);
                const group = AssetGroupItems[i];
                const itemIsCursed = this.curseData.conditions[group.Name] !== undefined;
                if (MouseIn(106 + 281 * column, 240 + 69 * row, 265, 54)) {
                    if (this.permissionMode) {
                        const accessLevel = (_a = this.curseData.limits[group.Name]) !== null && _a !== void 0 ? _a : ConditionsLimit.normal;
                        this.character.conditionSetLimit("curses", group.Name, (accessLevel + 1) % 3);
                    }
                    else if (!itemIsCursed) {
                        this.character.curseItem(group.Name, null);
                    }
                    return;
                }
            }
            if (MouseIn(440, 173, 265, 48) && !this.permissionMode) {
                this.character.curseBatch("items", false);
                return;
            }
            if (MouseIn(720, 173, 200, 48) && !this.permissionMode) {
                this.character.curseBatch("items", true);
                return;
            }
            // clothing
            const AssetGroupClothings = AssetGroup.filter(g => g.Category === "Appearance" && g.Clothing);
            for (let i = 0; i < AssetGroupClothings.length; i++) {
                const row = i % 10;
                const column = Math.floor(i / 10);
                const group = AssetGroupClothings[i];
                const clothingIsCursed = this.curseData.conditions[group.Name] !== undefined;
                if (MouseIn(951 + 281 * column, 240 + 69 * row, 265, 54)) {
                    if (this.permissionMode) {
                        const accessLevel = (_b = this.curseData.limits[group.Name]) !== null && _b !== void 0 ? _b : ConditionsLimit.normal;
                        this.character.conditionSetLimit("curses", group.Name, (accessLevel + 1) % 3);
                    }
                    else if (!clothingIsCursed) {
                        this.character.curseItem(group.Name, null);
                    }
                    return;
                }
            }
            if (MouseIn(1285, 173, 265, 48) && !this.permissionMode) {
                this.character.curseBatch("clothes", false);
                return;
            }
            if (MouseIn(1565, 173, 200, 48) && !this.permissionMode) {
                this.character.curseBatch("clothes", true);
                return;
            }
        }
        Exit() {
            setSubscreen(new GuiConditionViewCurses(this.character));
        }
    }

    class GuiConditionViewCurses extends GuiConditionView {
        constructor(character) {
            super(character, "curses");
            this.removeLabel = "Lift curse";
        }
        Run() {
            if (super.Run() || this.conditionCategoryData === null)
                return true;
            const access = this.conditionCategoryData.access_normal || this.conditionCategoryData.access_limited;
            DrawButton(120, 820, 384, 90, "Add new curse", access ? "White" : "#ddd", "", access ? "Place new curses on body, items or clothes" : "You have no permission to use this", !access);
            DrawButton(536, 820, 400, 90, "Lift all curses", access ? "White" : "#ddd", "", access ? "Remove all curses on body, items or clothes" : "You have no permission to use this", !access);
            return false;
        }
        Click() {
            if (super.Click() || this.conditionCategoryData === null)
                return true;
            const access = this.conditionCategoryData.access_normal || this.conditionCategoryData.access_limited;
            if (access && MouseIn(120, 820, 384, 90)) {
                setSubscreen(new GuiCursesAdd(this.character));
                return true;
            }
            if (access && MouseIn(536, 820, 400, 90)) {
                this.character.curseLiftAll();
                return true;
            }
            return false;
        }
        drawCategoryImage(X, Y, data) {
            DrawImageEx(data.extra.type === "clothing" ? "Icons/Dress.png" : "Assets/Female3DCG/ItemArms/Preview/NylonRope.png", X + 6, Y + 6, {
                Height: 50,
                Width: 50
            });
        }
        drawEntryExtra(X, Y, data) {
            if (data.extra.propertiesCursedShow) {
                DrawImageEx(data.extra.propertiesCursed ? "Icons/Lock.png" : "Icons/Unlock.png", X + 635, Y + 10, {
                    Height: 40,
                    Width: 40,
                    Alpha: data.extra.propertiesCursed ? 1 : 0.2
                });
                if (MouseIn(X + 635, Y + 6, 44, 44)) {
                    DrawHoverElements.push(() => {
                        DrawButtonHover(X + 635, Y + 6, 44, 44, data.extra.propertiesCursed ? "Item configuration cursed" : "Item configuration not cursed");
                    });
                }
            }
        }
        headerText() {
            return `Curses: All active curses on ${this.character.Name}`;
        }
        loadCondition(condition, data) {
            var _a;
            const group = AssetGroup.find(g => g.Name === condition);
            if (!group) {
                console.warn(`BCX: Unknown group ${condition}`);
                return null;
            }
            if (data.data === null) {
                return [`Blocked: ${getVisibleGroupName(group)}`, {
                        type: group.Clothing ? "clothing" : "item"
                    }];
            }
            else {
                const item = AssetGet(this.character.Character.AssetFamily, condition, data.data.Name);
                return [`${(_a = item === null || item === void 0 ? void 0 : item.Description) !== null && _a !== void 0 ? _a : data.data.Name} (${getVisibleGroupName(group)})`, {
                        type: group.Clothing ? "clothing" : "item",
                        propertiesCursed: data.data.curseProperties,
                        propertiesCursedShow: data.data.curseProperties || !item || curseAllowItemCurseProperty(item)
                    }];
            }
        }
        openEditSubscreen(condition) {
            setSubscreen(new GuiConditionEditCurses(this.character, condition, this));
        }
        removeCondition(condition) {
            this.character.curseLift(condition);
        }
        openGlobalConfig() {
            setSubscreen(new GuiConditionGlobalCurses(this.character, this));
        }
    }

    const MAIN_MENU_ITEMS = [
        {
            module: ModuleCategory.Global,
            onclick: (C) => {
                setSubscreen(new GuiGlobal(C));
            }
        },
        {
            module: ModuleCategory.Authority,
            onclick: (C) => {
                setSubscreen(new GuiAuthorityPermissions(C));
            }
        },
        {
            module: ModuleCategory.Log,
            onclick: (C) => {
                setSubscreen(new GuiLog(C));
            }
        },
        {
            module: ModuleCategory.Curses,
            onclick: (C) => {
                setSubscreen(new GuiConditionViewCurses(C));
            }
        },
        {
            module: ModuleCategory.Misc,
            onclick: (C) => {
                setSubscreen(new GuiMisc(C));
            }
        }
    ];
    class GuiMainMenu extends GuiSubscreen {
        constructor(character) {
            super();
            this.disabledModules = TOGGLEABLE_MODULES;
            this.character = character;
        }
        Load() {
            this.character.getDisabledModules(5000).then(data => {
                this.disabledModules = data;
            }).catch(e => {
                this.disabledModules = [];
                console.error(`BCX: error getting disabled modules`, e);
            });
        }
        onChange(source) {
            if (source === this.character.MemberNumber) {
                this.Load();
            }
        }
        Run() {
            DrawText("- Bondage Club Extended -", 125, 125, "Black", "Gray");
            DrawButton(1815, 75, 90, 90, "", "White", "Icons/Exit.png");
            for (let i = 0; i < MAIN_MENU_ITEMS.length; i++) {
                const e = MAIN_MENU_ITEMS[i];
                const PX = Math.floor(i / 7);
                const PY = i % 7;
                const isDisabled = this.disabledModules.includes(e.module);
                DrawButton(150 + 420 * PX, 160 + 110 * PY, 400, 90, "", isDisabled ? "#ddd" : "White", MODULE_ICONS[e.module], isDisabled ? "Module is deactivated" : "", isDisabled);
                DrawTextFit(MODULE_NAMES[e.module], 250 + 420 * PX, 205 + 110 * PY, 310, "Black");
            }
            MainCanvas.textAlign = "center";
            DrawText(`Your BCX version: ${VERSION}`, 1450 + 400 / 2, 765, "Black", "");
            DrawButton(1450, 800, 400, 90, "", "White", "", "Open changelog on GitHub");
            DrawText(`View changelog`, 1450 + 350 / 2, 845, "Black", "");
            DrawImageEx(icon_ExternalLink, 1770, 830, { Width: 30, Height: 30 });
        }
        Click() {
            if (MouseIn(1815, 75, 90, 90))
                return this.Exit();
            // Changelog
            if (MouseIn(1450, 800, 400, 90)) {
                window.open("https://github.com/Jomshir98/bondage-club-extended/blob/stable/CHANGELOG.md", "_blank");
            }
            for (let i = 0; i < MAIN_MENU_ITEMS.length; i++) {
                const e = MAIN_MENU_ITEMS[i];
                const PX = Math.floor(i / 7);
                const PY = i % 7;
                if (MouseIn(150 + 420 * PX, 160 + 110 * PY, 400, 90) && !this.disabledModules.includes(e.module)) {
                    return e.onclick(this.character);
                }
            }
        }
    }

    class GuiWelcomeSelection extends GuiSubscreen {
        constructor() {
            super(...arguments);
            this.selectedPreset = -1;
        }
        Run() {
            MainCanvas.textAlign = "center";
            DrawText(`- Welcome to Bondage Club Extended (BCX) -`, 1000, 100, "Black", "Gray");
            DrawText(`Please choose a preset, which sets your default experience, permissions and configuration.`, 1000, 150, "Black");
            DrawText(`Note: You can change the defaults, but changing to another preset is not possible without resetting BCX fully.`, 1000, 200, "FireBrick");
            const width = 400;
            const texts = ["Dominant", "Switch/Exploring", "Submissive", "Slave"];
            const images = ["Icons/Management.png", "Icons/Swap.png", "Icons/Kneel.png", icon_OwnerList];
            const descriptionDominant = `This preset is for dominants who\n` +
                `never intend to submit. Therefore,\n` +
                `most modules are not loaded at\n` +
                `start. That said, you can still use\n` +
                `the BCX graphical user interface\n` +
                `on other BCX users to use actions,\n` +
                `you have permission for, on them,\n` +
                `same as with all other presets.`;
            const descriptionSwitch = `This preset is for switches who\n` +
                `are sometimes dominant and\n` +
                `sometimes submissive, enabling\n` +
                `them to explore BCX slowly, while\n` +
                `having full control over all of its\n` +
                `settings and features.`;
            const descriptionSubmissive = `This preset is for submissives,\n` +
                `who want to give some of their\n` +
                `control to selected dominants and\n` +
                `lovers, giving only them authority\n` +
                `over some of BCX's settings.`;
            const descriptionSlave = `This preset is a much more\n` +
                `extreme submissive experience,\n` +
                `not leaving much control over the\n` +
                `settings and permissions to you,\n` +
                `thus enabling others to use many\n` +
                `of BCX's features on you, except\n` +
                `the most extreme ones, which you\n` +
                `can still configure to your liking.`;
            const descriptions = [descriptionDominant, descriptionSwitch, descriptionSubmissive, descriptionSlave];
            for (let i = 0; i < 4; i++) {
                const X = 125 + i * (width + 50);
                if (MouseIn(X, 250, width, 575)) {
                    DrawRect(X, 250, width, 575, "#ddd");
                }
                DrawEmptyRect(X, 250, width, 575, "Black");
                if (i === this.selectedPreset) {
                    const border = 10;
                    DrawEmptyRect(X - border, 250 - border, width + 2 * border, 575 + 2 * border, "Cyan", 5);
                    DrawButton(X + 20, 850, width - 40, 65, "Confirm", "White");
                }
                DrawImageEx(images[i], X + width / 2 - 43, 275);
                DrawText(texts[i], X + width / 2, 400, "Black");
                MainCanvas.font = CommonGetFont(24);
                let texty = 475;
                for (const line of descriptions[i].split("\n")) {
                    DrawText(line, X + width / 2, texty, "Black");
                    texty += 36;
                }
                if (i === 1) {
                    DrawText("Easily try out all features", X + width / 2, 775, "Black");
                }
                else if (i === 2) {
                    DrawText("Similar to Ace's Cursed Script", X + width / 2, 775, "Black");
                }
                MainCanvas.font = CommonGetFont(36);
            }
        }
        Click() {
            const width = 400;
            for (let i = 0; i < 4; i++) {
                const X = 125 + i * (width + 50);
                if (MouseIn(X, 250, width, 575)) {
                    this.selectedPreset = i;
                    return;
                }
                if (i === this.selectedPreset && MouseIn(X + 20, 850, width - 40, 65)) {
                    applyPreset(i);
                    setSubscreen(new GuiMainMenu(getPlayerCharacter()));
                }
            }
        }
        Exit() {
            // Empty
        }
    }

    function getCurrentSubscreen() {
        return ModuleGUI.instance && ModuleGUI.instance.currentSubscreen;
    }
    function setSubscreen(subscreen) {
        if (!ModuleGUI.instance) {
            throw new Error("Attempt to set subscreen before init");
        }
        ModuleGUI.instance.currentSubscreen = subscreen;
    }
    class ModuleGUI extends BaseModule {
        constructor() {
            super();
            this._currentSubscreen = null;
            if (ModuleGUI.instance) {
                throw new Error("Duplicate initialization");
            }
            ModuleGUI.instance = this;
        }
        get currentSubscreen() {
            return this._currentSubscreen;
        }
        set currentSubscreen(subscreen) {
            if (this._currentSubscreen) {
                this._currentSubscreen.Unload();
            }
            this._currentSubscreen = subscreen;
            if (this._currentSubscreen) {
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
                if (this._currentSubscreen) {
                    MainCanvas.textAlign = "left";
                    this._currentSubscreen.Run();
                    MainCanvas.textAlign = "center";
                    if (developmentMode) {
                        if (MouseX > 0 || MouseY > 0) {
                            MainCanvas.save();
                            MainCanvas.lineWidth = 1;
                            MainCanvas.strokeStyle = "red";
                            MainCanvas.beginPath();
                            MainCanvas.moveTo(0, MouseY);
                            MainCanvas.lineTo(2000, MouseY);
                            MainCanvas.moveTo(MouseX, 0);
                            MainCanvas.lineTo(MouseX, 1000);
                            MainCanvas.stroke();
                            MainCanvas.fillStyle = "black";
                            MainCanvas.strokeStyle = "white";
                            MainCanvas.fillRect(0, 950, 250, 50);
                            MainCanvas.strokeRect(0, 950, 250, 50);
                            DrawText(`X: ${MouseX} Y: ${MouseY}`, 125, 975, "white");
                            MainCanvas.restore();
                        }
                    }
                    return;
                }
                next(args);
                const C = this.getInformationSheetCharacter();
                if (firstTimeInit) {
                    if (C && C.isPlayer()) {
                        DrawButton(1815, 685, 90, 90, "", "White", icon_BCX);
                        MainCanvas.beginPath();
                        MainCanvas.rect(1300, 685, 500, 90);
                        MainCanvas.fillStyle = "Black";
                        MainCanvas.fill();
                        DrawText(`You can find BCX here ►`, 1550, 685 + 45, "White");
                    }
                }
                else if (C && C.BCXVersion !== null) {
                    DrawButton(1815, 685, 90, 90, "", "White", icon_BCX, "BCX");
                }
            });
            hookFunction("InformationSheetClick", 10, (args, next) => {
                if (this._currentSubscreen) {
                    return this._currentSubscreen.Click();
                }
                const C = this.getInformationSheetCharacter();
                if (MouseIn(1815, 685, 90, 90)) {
                    if (firstTimeInit) {
                        if (C && C.isPlayer()) {
                            ServerBeep = {};
                            this.currentSubscreen = new GuiWelcomeSelection();
                        }
                    }
                    else if (C && C.BCXVersion !== null && MouseIn(1815, 685, 90, 90)) {
                        this.currentSubscreen = new GuiMainMenu(C);
                    }
                }
                else {
                    return next(args);
                }
            });
            hookFunction("InformationSheetExit", 10, (args, next) => {
                if (this._currentSubscreen) {
                    return this._currentSubscreen.Exit();
                }
                return next(args);
            });
        }
        unload() {
            this.currentSubscreen = null;
        }
    }
    ModuleGUI.instance = null;

    const PRESET_DISABLED_MODULES = {
        [Preset.dominant]: [ModuleCategory.Log, ModuleCategory.Curses],
        [Preset.switch]: [],
        [Preset.submissive]: [],
        [Preset.slave]: []
    };
    function getCurrentPreset() {
        var _a;
        return (_a = modStorage.preset) !== null && _a !== void 0 ? _a : Preset.switch;
    }
    function applyPreset(preset) {
        modStorage.preset = preset;
        modules_applyPreset(preset);
        setDisabledModules(PRESET_DISABLED_MODULES[preset]);
        finalizeFirstTimeInit();
    }
    function setDisabledModules(modules) {
        if (!Array.isArray(modStorage.disabledModules)) {
            console.error("BCX: Attempt to set disabled modules before initializetion");
            return false;
        }
        modules = arrayUnique(modules.filter(i => TOGGLEABLE_MODULES.includes(i)));
        if (CommonArraysEqual(modules, modStorage.disabledModules))
            return true;
        modStorage.disabledModules = modules;
        if (reload_modules()) {
            modStorageSync();
            notifyOfChange();
            return true;
        }
        return false;
    }
    function getDisabledModules() {
        return Array.isArray(modStorage.disabledModules) ? modStorage.disabledModules.slice() : [];
    }
    function moduleIsEnabled(module) {
        if (!TOGGLEABLE_MODULES.includes(module))
            return true;
        return Array.isArray(modStorage.disabledModules) ? !modStorage.disabledModules.includes(module) : true;
    }
    class ModulePresets extends BaseModule {
        init() {
            queryHandlers.disabledModules = (sender, resolve) => {
                return resolve(true, getDisabledModules());
            };
        }
        load() {
            if (typeof modStorage.preset !== "number" || Preset[modStorage.preset] === undefined) {
                modStorage.preset = Preset.switch;
            }
            if (!Array.isArray(modStorage.disabledModules)) {
                modStorage.disabledModules = [];
            }
            else {
                modStorage.disabledModules = modStorage.disabledModules.filter(i => TOGGLEABLE_MODULES.includes(i));
            }
        }
        run() {
            if (firstTimeInit) {
                setTimeout(() => {
                    if (firstTimeInit && getCurrentSubscreen() === null) {
                        InfoBeep(`Please visit your profile to finish BCX setup`, Infinity);
                    }
                }, 2000);
            }
        }
    }

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
            m.load(getCurrentPreset());
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
    function reload_modules() {
        if (moduleInitPhase !== 3 /* ready */) {
            console.error("BCX: Attempt to reload modules, while not ready");
            return false;
        }
        for (const m of modules) {
            m.reload(getCurrentPreset());
        }
        return true;
    }
    function modules_applyPreset(preset) {
        if (moduleInitPhase !== 3 /* ready */) {
            console.error("BCX: Attempt to apply preset to modules, while not ready");
            return false;
        }
        for (const m of modules) {
            m.applyPreset(preset);
        }
        return true;
    }

    function loginInit(C) {
        if (window.BCX_Loaded)
            return;
        init();
    }
    function clearCaches() {
        if (typeof DrawRunMap !== "undefined") {
            DrawRunMap.clear();
            DrawScreen = "";
        }
        if (typeof CurrentScreenFunctions !== "undefined") {
            const w = window;
            CurrentScreenFunctions = {
                Run: w[`${CurrentScreen}Run`],
                Click: w[`${CurrentScreen}Click`],
                Load: typeof w[`${CurrentScreen}Load`] === "function" ? w[`${CurrentScreen}Load`] : undefined,
                Unload: typeof w[`${CurrentScreen}Unload`] === "function" ? w[`${CurrentScreen}Unload`] : undefined,
                Resize: typeof w[`${CurrentScreen}Resize`] === "function" ? w[`${CurrentScreen}Resize`] : undefined,
                KeyDown: typeof w[`${CurrentScreen}KeyDown`] === "function" ? w[`${CurrentScreen}KeyDown`] : undefined,
                Exit: typeof w[`${CurrentScreen}Exit`] === "function" ? w[`${CurrentScreen}Exit`] : undefined
            };
        }
    }
    function init() {
        init_modules();
        // Loading into already loaded club - clear some caches
        clearCaches();
        //#region Other mod compatability
        const { BondageClubTools } = detectOtherMods();
        if (BondageClubTools) {
            console.warn("BCX: Bondage Club Tools detected!");
            if (window.BCX_BondageClubToolsPatch === true) {
                console.info("BCX: Bondage Club Tools already patched, skip!");
            }
            else {
                window.BCX_BondageClubToolsPatch = true;
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
        }
        //#endregion
        window.BCX_Loaded = true;
        InfoBeep(`BCX loaded! Version: ${VERSION}`);
    }
    function unload() {
        unload_patches();
        unload_modules();
        // clear some caches
        clearCaches();
        delete window.BCX_Loaded;
        console.log("BCX: Unloaded.");
        return true;
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
                if (!isObject$1(message) || typeof message.status !== "string") {
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

    registerModule(new ModuleAuthority());
    registerModule(new ModuleChatroom());
    registerModule(new ModuleClubUtils());
    registerModule(new ModuleCommands());
    registerModule(new ModuleConditions());
    registerModule(new ModuleConsole());
    registerModule(new ModuleCurses());
    registerModule(new ModuleGUI());
    registerModule(new ModuleLog());
    registerModule(new ModuleMessaging());
    registerModule(new ModuleMiscPatches());
    registerModule(new ModulePresets());
    registerModule(new ModuleStorage());
    registerModule(new ModuleVersionCheck());
    registerModule(new ModuleWardrobe());

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
