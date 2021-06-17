import { ChatroomCharacter } from "../characters";
import { ModuleCategory, MODULE_ICONS, MODULE_NAMES } from "../moduleManager";
import { module_gui } from "../modules";
import { AccessLevel, PermissionData, PermissionInfo } from "../modules/authority";
import { icon_OwnerList } from "../resources";
import { DrawImageEx } from "../utilsClub";
import { GuiMainMenu } from "./mainmenu";
import { GuiSubscreen } from "./subscreen";

type PermListItem = (
	{
		separator: false;
		permission: string;
		permissionInfo: PermissionInfo;
	} | {
		separator: true;
		name: string;
	}
);

const PER_PAGE_COUNT = 6;

export class GuiAuthorityPermissions extends GuiSubscreen {

	readonly character: ChatroomCharacter;
	private permissionData: PermissionData | null = null;
	private failed: boolean = false;
	private permList: PermListItem[] = [];
	private page: number = 0;

	constructor(character: ChatroomCharacter) {
		super();
		this.character = character;

		character.getPermissions().then(res => {
			this.permissionData = res;
			this.rebuildList();
		}, err => {
			console.error(`BCX: Failed to get permission info for ${character}`, err);
			this.failed = true;
		});
	}

	private rebuildList() {
		const categories: Map<ModuleCategory, PermissionData> = new Map();
		this.permList = [];
		this.page = 0;
		if (this.permissionData === null) {
			return;
		}
		for (const [k, v] of Object.entries(this.permissionData)) {
			let permdata = categories.get(v.category);
			if (!permdata) {
				categories.set(v.category, permdata = {});
			}
			permdata[k as BCX_Permissions] = v;
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
		if (this.permissionData !== null) {

			DrawText("Self", 1250, 200, "Black");
			DrawText("Lowest permitted role", 1350, 200, "Black");
			MainCanvas.beginPath();
			MainCanvas.moveTo(1345, 275);
			MainCanvas.lineTo(1345, 275 + 600);
			MainCanvas.stroke();

			DrawText("Filter", 1200, 150, "Black");
			DrawButton(1300, 150, 300, 64, "", "White", undefined, undefined, true);

			for (let off = 0; off < PER_PAGE_COUNT; off++) {
				const i = this.page * PER_PAGE_COUNT + off;
				if (i >= this.permList.length) break;
				const e = this.permList[i];

				const Y = 275 + off * 100;

				if (e.separator) {
					DrawText(e.name, 200, Y + 32, "Black", "Black");
				} else {
					DrawImageEx(MODULE_ICONS[e.permissionInfo.category], 125, Y, {
						Height: 64,
						Width: 64
					});
					// Permission name
					DrawButton(200, Y, 1000, 64, "", "White");
					DrawTextFit(e.permissionInfo.name, 210, Y + 32, 990, "Black");
					// Self checkbox
					DrawButton(1250, Y, 90, 90, "", "White", e.permissionInfo.self ? "Icons/Checked.png" : "");
					// Min access
					DrawButton(1350, Y, 150, 64, "", "White");
					MainCanvas.textAlign = "center";
					DrawTextFit(AccessLevel[e.permissionInfo.min], 1360, Y + 32, 150, "Black");
					MainCanvas.textAlign = "left";
				}
			}

			// Pagination
			const totalPages = Math.ceil(this.permList.length / PER_PAGE_COUNT);
			MainCanvas.textAlign = "center";
			DrawBackNextButton(1675, 800, 300, 90, `${DialogFindPlayer("Page")} ${this.page + 1} / ${totalPages}`, "White", "", () => "", () => "");
			MainCanvas.textAlign = "left";
		}

		DrawText("- Authority: Permissions -", 125, 125, "Black", "Gray");
		DrawButton(1815, 75, 90, 90, "", "White", "Icons/Exit.png");
		DrawButton(1815, 190, 90, 90, "", "White", icon_OwnerList);
	}

	Click() {
		if (MouseIn(1815, 75, 90, 90)) return this.Exit();

		if (this.permissionData !== null) {

			for (let off = 0; off < PER_PAGE_COUNT; off++) {
				const i = this.page * PER_PAGE_COUNT + off;
				if (i >= this.permList.length) break;
				const e = this.permList[i];

				const Y = 275 + i * 100;

				if (!e.separator) {
					// Permission name
					if (MouseIn(200, Y, 1000, 64)) {
						// TODO
					}
					// Self checkbox
					if (MouseIn(1250, Y, 90, 90)) {
						// TODO
					}
					// Min access
					if (MouseIn(1350, Y, 150, 64)) {
						// TODO
					}
				}
			}

			// Pagination
			const totalPages = Math.ceil(this.permList.length / PER_PAGE_COUNT);
			if (MouseIn(1675, 800, 150, 90)) {
				this.page--;
				if (this.page < 0) {
					this.page = totalPages - 1;
				}
			} else if (MouseIn(1825, 800, 150, 90)) {
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
}
