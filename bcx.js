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
            Timer: CurrentTime + 3000,
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
            div.innerHTML = msg;
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
    function j_InvisEarbuds() {
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
        ChatRoomCharacterUpdate(Player);
    }

    const VERSION = "0.1.0";
    const FUNCTION_HASHES = {
        AppearanceClick: ["CA4ED810", "B895612C"],
        AppearanceRun: ["904E8E84", "791E142F"],
        AsylumEntranceCanWander: ["3F5F4041"],
        ChatRoomCanLeave: ["B964B0B0", "7EDA9A86"],
        ChatRoomClearAllElements: ["D1E1F8C3", "9EA1595C"],
        ChatRoomCreateElement: ["4837C2F6", "76299AEC"],
        ChatRoomDrawCharacterOverlay: ["1E1A1B60", "10CE4173"],
        ChatRoomDrawFriendList: ["2A9BD99D"],
        ChatRoomMessage: ["2C6E4EC3", "AA8D20E0"],
        ChatRoomSendChat: ["39B06D87", "385B9E9C"],
        CheatImport: ["412422CC", "1ECB0CC4"],
        DialogDrawExpressionMenu: ["071C32ED", "EEFB3D22"],
        DialogDrawItemMenu: ["E0313EBF", "7C83D23C"],
        DialogDrawPoseMenu: ["6145B7D7", "4B146E82"],
        ElementIsScrolledToEnd: ["064E4232", "D28B0638"],
        ExtendedItemDraw: ["486A52DF", "AABA9073"],
        LoginMistressItems: ["984A6AD9"],
        LoginStableItems: ["C3F50DD1"],
        ServerAccountBeep: ["0057EF1D", "96F8C34D"],
        SpeechGarble: ["1BC8E005", "B3A5973D"]
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
    const clipboardAvailable = Boolean(navigator.clipboard);

    const patchedFunctions = new Map();
    function makePatchRouter(data) {
        return (...args) => {
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
        let result = patchedFunctions.get(target);
        if (!result) {
            const original = window[target];
            const expectedHashes = (_a = FUNCTION_HASHES[target]) !== null && _a !== void 0 ? _a : [];
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

    const hiddenMessageHandlers = new Map();
    const hiddenBeepHandlers = new Map();
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
    function init_messaging() {
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
            if (typeof (data === null || data === void 0 ? void 0 : data.BeepType) === "string" && ["Leash", "BCX"] && isObject((_a = data.Message) === null || _a === void 0 ? void 0 : _a.BCX)) {
                const { type, message } = data.Message.BCX;
                if (typeof type === "string") {
                    const handler = hiddenMessageHandlers.get(type);
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

    class ChatroomCharacter {
        constructor(character) {
            this.BCXVersion = null;
            this.Character = character;
            if (character.ID === 0) {
                this.BCXVersion = VERSION;
            }
            console.debug(`BCX: Loaded character ${character.Name} (${character.MemberNumber})`);
        }
    }
    const currentRoomCharacters = [];
    function getChatroomCharacter(memberNumber) {
        if (typeof memberNumber !== "number")
            return null;
        let character = currentRoomCharacters.find(c => c.Character.MemberNumber === memberNumber);
        if (!character) {
            const BCCharacter = ChatRoomCharacter.find(c => c.MemberNumber === memberNumber);
            if (!BCCharacter) {
                return null;
            }
            character = new ChatroomCharacter(BCCharacter);
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
    }
    let ChatroomSM;
    function init_chatroom() {
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
        hookFunction("ChatRoomMessage", 10, (args, next) => {
            const data = args[0];
            if ((data === null || data === void 0 ? void 0 : data.Type) === "Action" && data.Content === "ServerEnter") {
                announceSelf(false);
            }
            return next(args);
        });
        const { NMod } = detectOtherMods();
        patchFunction("ChatRoomDrawCharacterOverlay", NMod ? {} : {
            'DrawImageResize("Icons/Small/FriendList.png", CharX + 375 * Zoom, CharY, 50 * Zoom, 50 * Zoom);': ""
        });
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
        }
        ChatroomSM = new ChatRoomStatusManager();
        if (document.getElementById("InputChat") != null) {
            ChatroomSM.SetInputElement(document.getElementById("InputChat"));
        }
        hookFunction("ChatRoomSendChat", 0, (args, next) => {
            next(args);
            ChatroomSM.InputEnd();
        });
        hookFunction("ChatRoomCreateElement", 0, (args, next) => {
            next(args);
            ChatroomSM.SetInputElement(document.getElementById("InputChat"));
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
        announceSelf(true);
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
    function init_wardrobe() {
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
        document.addEventListener("paste", ev => {
            if (CurrentScreen === "Appearance" && CharacterAppearanceMode === "Wardrobe") {
                ev.preventDefault();
                ev.stopImmediatePropagation();
                const data = (ev.clipboardData || window.clipboardData).getData("text");
                const res = j_WardrobeImportSelectionClothes(data, j_WardrobeIncludeBinds, allowMode);
                CharacterAppearanceWardrobeText = res !== true ? `Import error: ${res}` : "Imported!";
            }
        });
    }

    let allowMode = false;
    let developmentMode = false;
    let antigarble = 0;
    class ConsoleInterface {
        get isAllow() {
            return allowMode;
        }
        Allow(allow) {
            if (typeof allow !== "boolean") {
                return false;
            }
            if (allowMode === allow)
                return true;
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
            if (typeof devel !== "boolean") {
                return false;
            }
            if (developmentMode === devel)
                return true;
            if (devel) {
                if (!this.Allow(true))
                    return false;
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
        j_InvisEarbuds() {
            return j_InvisEarbuds();
        }
    }
    const consoleInterface = Object.freeze(new ConsoleInterface());
    function init_console() {
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
                opt.Draw = DialogDrawPoseMenu;
            }
            else if (opt.Name === "Expression") {
                opt.Draw = DialogDrawExpressionMenu;
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

    const commands = new Map();
    function registerCommand(name, callback, description = "") {
        name = name.toLocaleLowerCase();
        if (commands.has(name)) {
            throw new Error(`Command "${name}" already registered!`);
        }
        commands.set(name, {
            parse: false,
            callback,
            description
        });
    }
    function registerCommandParsed(name, callback, description = "") {
        name = name.toLocaleLowerCase();
        if (commands.has(name)) {
            throw new Error(`Command "${name}" already registered!`);
        }
        commands.set(name, {
            parse: true,
            callback,
            description
        });
    }
    function RunCommand(msg) {
        const commandMatch = /^\s*(\S+)(?:\s|$)(.*)$/.exec(msg);
        if (msg && !commandMatch) {
            ChatRoomSendLocal("There was an error during parsing of your command");
            return false;
        }
        const command = msg ? commandMatch[1].toLocaleLowerCase() : "";
        const args = msg ? commandMatch[2] : "";
        const commandInfo = commands.get(command);
        if (!commandInfo) {
            // Command not found
            ChatRoomSendLocal(`Unknown command "${command}"\n` +
                `To see list of valid commands whisper '!help'`, 15000);
            return false;
        }
        if (commandInfo.parse) {
            const argv = [...args.matchAll(/".+?(?:"|$)|'.+?(?:'|$)|[^ ]+/g)]
                .map(a => a[0])
                .map(a => a[0] === '"' || a[0] === "'" ? a.substring(1, a[a.length - 1] === a[0] ? a.length - 1 : a.length) : a);
            return commandInfo.callback(argv);
        }
        else {
            return commandInfo.callback(args);
        }
    }
    function init_commands() {
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
        const command_help = () => {
            ChatRoomSendLocal(`Available commands:\n` +
                Array.from(commands.entries())
                    .filter(c => c[1].description !== null)
                    .map(c => `.${c[0]}` + (c[1].description ? ` - ${c[1].description}` : ""))
                    .sort()
                    .join("\n"));
            return true;
        };
        registerCommand("help", command_help, "display this help [alias: . ]");
        registerCommand("", command_help, null);
        const command_action = (msg) => {
            ChatRoomActionMessage(msg);
            return true;
        };
        registerCommand("action", command_action, "send custom (action) [alias: .a ]");
        registerCommand("a", command_action, null);
        registerCommand("antigarble", (value) => {
            if (["0", "1", "2"].includes(value)) {
                consoleInterface.antigarble = Number.parseInt(value, 10);
                ChatRoomSendLocal(`Antigarble set to ${value}`);
                return true;
            }
            else {
                ChatRoomSendLocal(`Invalid antigarble level; use 0 1 or 2`);
                return false;
            }
        }, "set garble prevention to show [garbled|both|ungarbled] messages (only affects received messages!)");
    }

    function init_miscPatches() {
        hookFunction("AsylumEntranceCanWander", 0, () => true);
        patchFunction("CheatImport", { "MainCanvas == null": "true" });
        CheatImport();
        hookFunction("ElementIsScrolledToEnd", 0, (args) => {
            const element = document.getElementById(args[0]);
            return element != null && element.scrollHeight - element.scrollTop - element.clientHeight <= 1;
        });
        const { NMod } = detectOtherMods();
        if (!NMod) {
            patchFunction("LoginMistressItems", { 'LogQuery("ClubMistress", "Management")': "true" });
            patchFunction("LoginStableItems", { 'LogQuery("JoinedStable", "PonyExam") || LogQuery("JoinedStable", "TrainerExam")': "true" });
        }
        if (Player.Inventory.length > 0) {
            LoginMistressItems();
            LoginStableItems();
            ServerPlayerInventorySync();
        }
        // Cheats
        const o_Player_CanChange = Player.CanChange;
        Player.CanChange = () => allowMode || o_Player_CanChange.call(Player);
        hookFunction("ChatRoomCanLeave", 0, (args, next) => allowMode || next(args));
    }

    function init() {
        // Loading into already loaded club - clear some caches
        DrawRunMap.clear();
        DrawScreen = "";
        init_messaging();
        init_chatroom();
        init_wardrobe();
        init_commands();
        init_console();
        init_miscPatches();
        //#region Other mod compatability
        const { NMod, BondageClubTools } = detectOtherMods();
        if (NMod) {
            console.warn("BCX: NMod load!");
            window.ChatRoomSM = ChatroomSM;
            ServerSocket.on("ChatRoomMessageSync", () => {
                announceSelf(true);
            });
        }
        if (BondageClubTools) {
            console.warn("BCX: Bondage Club Tools detected!");
            const ChatRoomMessageForwarder = ServerSocket.listeners("ChatRoomMessage").find(i => i.toString().includes("window.postMessage"));
            const AccountBeepForwarder = ServerSocket.listeners("AccountBeep").find(i => i.toString().includes("window.postMessage"));
            console.assert(ChatRoomMessageForwarder !== undefined && AccountBeepForwarder !== undefined);
            ServerSocket.off("ChatRoomMessage");
            ServerSocket.on("ChatRoomMessage", data => {
                if ((data === null || data === void 0 ? void 0 : data.Type) !== "Hidden" || data.Content !== "JModMsg" || typeof data.Sender !== "number") {
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
    init();

}());
//# sourceMappingURL=bcx.js.map
