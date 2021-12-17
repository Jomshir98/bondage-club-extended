import { hookFunction } from "../patching";
import { DrawImageEx, isNModClient } from "../utilsClub";
import { modStorage, modStorageSync } from "./storage";
import { BaseModule } from "./_BaseModule";

const AUTOREFRESH_INTERVAL = 10_000;

export class ModuleFriends extends BaseModule {
	load() {
		//#region Friendlist Auto-Refresh
		if (!isNModClient()) {
			let friendListNextRefresh: number = 0;
			let pendingRefresh: boolean = false;

			hookFunction("FriendListRun", 0, (args, next) => {
				next(args);
				DrawButton(1755, 25, 40, 40, "", pendingRefresh ? "#88c" : "White", "", "Toggle 10 sec auto-refresh");
				DrawImageEx("Icons/Wait.png", 1755 + 3, 25 + 3, { Alpha: modStorage.FLAutorefresh ? 1 : 0.2, Width: 34, Height: 34 });
				if (modStorage.FLAutorefresh && Date.now() >= friendListNextRefresh && ServerIsConnected) {
					friendListNextRefresh = Date.now() + AUTOREFRESH_INTERVAL;
					pendingRefresh = true;
					ServerSend("AccountQuery", { Query: "OnlineFriends" });
				}
			});
			hookFunction("FriendListLoadFriendList", 0, (args, next) => {
				pendingRefresh = false;
				next(args);
			});
			hookFunction("FriendListClick", 4, (args, next) => {
				if (MouseIn(1755, 25, 40, 40)) {
					if (modStorage.FLAutorefresh) {
						delete modStorage.FLAutorefresh;
					} else {
						modStorage.FLAutorefresh = true;
						friendListNextRefresh = Date.now() + AUTOREFRESH_INTERVAL;
						pendingRefresh = true;
						ElementContent("FriendList", "");
						ServerSend("AccountQuery", { Query: "OnlineFriends" });
					}
					modStorageSync();
					return;
				}
				next(args);
			});
		}
		//#endregion
	}
}
