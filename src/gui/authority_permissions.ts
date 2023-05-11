import { ChatroomCharacter, getPlayerCharacter } from "../characters";
import { ModuleCategory, MODULE_ICONS, MODULE_NAMES } from "../constants";
import { AccessLevel, checkPermissionAccessData, checkPermissionAccess, getPermissionMinDisplayText, PermissionData, PermissionInfo } from "../modules/authority";
import { DrawImageEx, showHelp } from "../utilsClub";
import { GuiMainMenu } from "./mainmenu";
import { GuiSubscreen } from "./subscreen";
import { GuiAuthorityRoles } from "./authority_roles";
import { GuiAuthorityDialogMin } from "./authority_dialogMin";
import { GuiAuthorityDialogSelf } from "./authority_dialogSelf";
import { setSubscreen } from "../modules/gui";
import { Views, HELP_TEXTS } from "../helpTexts";
import { createInputElement, positionElement } from "../utils";

type PermListItem = (
	{
		separator: false;
		permission: BCX_Permissions;
		permissionInfo: PermissionInfo;
		editSelf: boolean;
		editMin: boolean;
	} | {
		separator: true;
		name: string;
	} | null
);

const PER_PAGE_COUNT = 6;

export class GuiAuthorityPermissions extends GuiSubscreen {

	readonly character: ChatroomCharacter;
	private permissionData: PermissionData | null = null;
	private myAccessLevel: AccessLevel = AccessLevel.public;
	private failed: boolean = false;
	private permList: PermListItem[] = [];
	private page: number = 0;

	private showHelp: boolean = false;

	private filterInput = createInputElement("text", 30);

	constructor(character: ChatroomCharacter) {
		super();
		this.character = character;
		if (this.character.isPlayer()) {
			this.myAccessLevel = AccessLevel.self;
		}
		this.filterInput.addEventListener("input", ev => {
			this.rebuildList();
		});
	}

	Load() {
		this.requestData();
	}

	onChange(sender: number) {
		if (sender === this.character.MemberNumber) {
			this.requestData();
		}
	}

	private requestData() {
		Promise.all([this.character.getPermissions(), this.character.getMyAccessLevel()]).then(res => {
			this.permissionData = res[0];
			this.myAccessLevel = res[1];
			this.failed = false;
			this.rebuildList();
		}, err => {
			console.error(`BCX: Failed to get permission info for ${this.character}`, err);
			this.permissionData = null;
			this.failed = true;
			this.rebuildList();
		});
	}

	private rebuildList() {
		if (!this.active) return;

		this.permList = [];
		if (this.permissionData === null) {
			this.filterInput.remove();
			return;
		}

		if (!this.filterInput.parentElement) {
			document.body.appendChild(this.filterInput);
		}

		const filter = this.filterInput.value.trim().toLocaleLowerCase().split(" ").filter(Boolean);

		const access_grantSelf = this.permissionData.authority_grant_self ?
			checkPermissionAccessData(this.permissionData.authority_grant_self, this.myAccessLevel) :
			false;
		const access_revokeSelf = this.permissionData.authority_revoke_self ?
			checkPermissionAccessData(this.permissionData.authority_revoke_self, this.myAccessLevel) :
			false;
		const access_editMin = this.permissionData.authority_edit_min ?
			checkPermissionAccessData(this.permissionData.authority_edit_min, this.myAccessLevel) :
			false;
		const isPlayer = this.myAccessLevel === AccessLevel.self;

		const categories: Map<ModuleCategory, PermissionData> = new Map();
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
			if (filter.length === 0) {
				while (this.permList.length % PER_PAGE_COUNT !== 0) {
					this.permList.push(null);
				}
			}
			this.permList.push({
				separator: true,
				name: `${MODULE_NAMES[category]} module permissions`,
			});
			for (const [k, v] of Object.entries(data).sort((a, b) => a[1].name.localeCompare(b[1].name))) {
				if (filter.length === 0 && this.permList.length % PER_PAGE_COUNT === 0) {
					this.permList.push({
						separator: true,
						name: `${MODULE_NAMES[category]} module permissions (continued)`,
					});
				}
				const access = checkPermissionAccessData(v, this.myAccessLevel);
				this.permList.push({
					separator: false,
					permission: k as BCX_Permissions,
					permissionInfo: v,
					editSelf:
						// character must have access to "allow granting/forbidding self access"
						(v.self ? access_revokeSelf : access_grantSelf) &&
						// Not player must have access to target rule
						(isPlayer || access) &&
						// "lowest access" set to "Self" forces "self access" to "Yes"
						(!v.self || v.min !== AccessLevel.self),
					editMin:
						// Exception: Player can always lower permissions "Self"->"Owner"
						(isPlayer && v.min < AccessLevel.owner) ||
						// Character must have access to "allow lowest access modification" &&
						// Character must have access to target rule
						(access_editMin && access),
				});
			}
		}

		const totalPages = Math.ceil(this.permList.length / PER_PAGE_COUNT);
		if (this.page < 0) {
			this.page = Math.max(totalPages - 1, 0);
		} else if (this.page >= totalPages) {
			this.page = 0;
		}
	}

	Run() {
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
			positionElement(this.filterInput, 550, 210, 600, 64);

			//reset button
			if (this.filterInput.value) {
				MainCanvas.textAlign = "center";
				DrawButton(870, 182, 64, 64, "X", "White");
			}

			MainCanvas.textAlign = "left";
			for (let off = 0; off < PER_PAGE_COUNT; off++) {
				const i = this.page * PER_PAGE_COUNT + off;
				if (i >= this.permList.length) break;
				const e = this.permList[i];
				if (e === null)
					continue;

				const Y = 275 + off * 100;

				if (e.separator) {
					// idea to highlight the section separator
					MainCanvas.beginPath();
					MainCanvas.rect(125, Y, 1173, 64);
					MainCanvas.fillStyle = "#eeeeee";
					MainCanvas.fill();
					DrawText(e.name, 140, Y + 34, "Black");
				} else {
					DrawImageEx(MODULE_ICONS[e.permissionInfo.category], 125, Y, {
						Height: 64,
						Width: 64,
					});
					// Permission name
					MainCanvas.beginPath();
					MainCanvas.rect(200, Y, 1000, 64);
					MainCanvas.fillStyle = checkPermissionAccessData(e.permissionInfo, this.myAccessLevel) ? "White" : "#ddd";
					MainCanvas.fill();
					MainCanvas.stroke();
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
			const totalPages = Math.max(1, Math.ceil(this.permList.length / PER_PAGE_COUNT));
			MainCanvas.textAlign = "center";
			DrawBackNextButton(1605, 800, 300, 90, `${DialogFindPlayer("Page")} ${this.page + 1} / ${totalPages}`, "White", "", () => "", () => "");
		} else if (this.failed) {
			MainCanvas.textAlign = "center";
			DrawText(`Failed to get permission data from ${this.character.Name}. Maybe you have no access?`, 1000, 480, "Black");
		} else {
			MainCanvas.textAlign = "center";
			DrawText("Loading...", 1000, 480, "Black");
		}

		// help text
		if (this.showHelp) {
			showHelp(HELP_TEXTS[Views.AuthorityPermissions]);
		}

		MainCanvas.textAlign = "left";

		DrawText(`- Authority: Permission Settings for ${this.character.Name} -`, 125, 125, "Black", "Gray");
		MainCanvas.textAlign = "center";
		DrawButton(1815, 75, 90, 90, "", "White", "Icons/Exit.png", "BCX main menu");
		DrawButton(1815, 190, 90, 90, "", "White", "Icons/Question.png");
		DrawButton(1815, 305, 90, 90, "", "White", "Icons/West.png", "Previous screen");
	}

	Click() {
		if (MouseIn(1815, 75, 90, 90)) return this.Exit();
		if (MouseIn(1815, 190, 90, 90)) {
			this.showHelp = !this.showHelp;
			return;
		}

		// Owner list
		if (MouseIn(1815, 305, 90, 90)) return setSubscreen(new GuiAuthorityRoles(this.character));

		if (this.permissionData !== null) {

			//reset button
			if (MouseIn(870, 182, 64, 64)) {
				this.filterInput.value = "";
				this.rebuildList();
			}

			for (let off = 0; off < PER_PAGE_COUNT; off++) {
				const i = this.page * PER_PAGE_COUNT + off;
				if (i >= this.permList.length) break;
				const e = this.permList[i];
				if (e === null)
					continue;

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
							(
								e.permission === "authority_grant_self" ||
								!checkPermissionAccess("authority_grant_self", getPlayerCharacter())
							)
						) {
							// If Player couldn't switch back on, show warning instead
							setSubscreen(new GuiAuthorityDialogSelf(this.character, e.permission, e.permissionInfo, this));
						} else {
							this.character.setPermission(e.permission, "self", !e.permissionInfo.self);
						}
						return;
					}
					// Min access
					if (MouseIn(1370, Y, 170, 64) && e.editMin) {
						const access_editMin = this.permissionData.authority_edit_min ?
							checkPermissionAccessData(this.permissionData.authority_edit_min, this.myAccessLevel) :
							false;
						setSubscreen(new GuiAuthorityDialogMin(
							this.character,
							e.permission,
							e.permissionInfo,
							this.myAccessLevel,
							!access_editMin || !checkPermissionAccessData(e.permissionInfo, this.myAccessLevel),
							this
						));
						return;
					}
				}
			}

			// Pagination
			const totalPages = Math.ceil(this.permList.length / PER_PAGE_COUNT);
			if (MouseIn(1605, 800, 150, 90)) {
				this.page--;
				if (this.page < 0) {
					this.page = Math.max(totalPages - 1, 0);
				}
			} else if (MouseIn(1755, 800, 150, 90)) {
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
		this.filterInput.remove();
	}
}
