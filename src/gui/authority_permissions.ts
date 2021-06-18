import { ChatroomCharacter } from "../characters";
import { ModuleCategory, MODULE_ICONS, MODULE_NAMES } from "../moduleManager";
import { module_gui } from "../modules";
import { AccessLevel, PermissionData, PermissionInfo } from "../modules/authority";
import { icon_OwnerList } from "../resources";
import { capitalizeFirstLetter } from "../utils";
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

	private rebuildList() {
		const categories: Map<ModuleCategory, PermissionData> = new Map();
		this.permList = [];
		this.page = 0;
		let Input = document.getElementById("BCX_PermissionsFilter") as HTMLInputElement | undefined;
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
			if (filter.some(i =>
				!MODULE_NAMES[v.category].toLocaleLowerCase().includes(i) &&
				!v.name.toLocaleLowerCase().includes(i) &&
				!k.toLocaleLowerCase().includes(i)
			)) continue;
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
			if ((document.getElementById("BCX_PermissionsFilter") as HTMLInputElement | undefined)?.value) {
				DrawButton(870, 182, 64, 64, "", "White");
				DrawTextFit("X", 889, 217, 54, "Black");
			}

			for (let off = 0; off < PER_PAGE_COUNT; off++) {
				const i = this.page * PER_PAGE_COUNT + off;
				if (i >= this.permList.length) break;
				const e = this.permList[i];

				const Y = 275 + off * 100;

				if (e.separator) {
					// idea to highlight the section separator
					MainCanvas.beginPath();
					MainCanvas.rect(125, Y, 1173, 64);
					MainCanvas.fillStyle = "#eeeeee";
					MainCanvas.fill();
					DrawText(`${e.name} module permissions`, 140, Y + 34, "Black");
				} else {
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
		if (MouseIn(1815, 75, 90, 90)) return this.Exit();

		// Owner list
		if (MouseIn(815, 190, 90, 90)) {
			// TODO
		}

		if (this.permissionData !== null) {

			//reset button
			const elem = document.getElementById("BCX_PermissionsFilter") as HTMLInputElement | undefined;
			if (MouseIn(870, 182, 64, 64) && elem) {
				elem.value = "";
			}

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
			} else if (MouseIn(1605, 800, 150, 90)) {
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
