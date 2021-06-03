import { detectOtherMods } from "./clubUtils";
import { hookFunction, patchFunction } from "./patching";
import { j_WardrobeExportSelectionClothes, j_WardrobeImportSelectionClothes } from "./wardrobe";
import { j_InvisEarbuds } from "./clubUtils";

export let allowMode: boolean = false;
export let developmentMode: boolean = false;
export let antigarble = 0;

class ConsoleInterface {
	get isAllow(): boolean {
		return allowMode;
	}

	Allow(allow: boolean) {
		if (typeof allow !== "boolean") {
			return false;
		}
		if (allowMode === allow)
			return true;
		allowMode = allow;
		if (allow) {
			console.warn("Cheats enabled; please be careful not to break things");
		} else {
			this.Devel(false);
			console.info("Cheats disabled");
		}
		return true;
	}

	get isDevel(): boolean {
		return developmentMode;
	}

	Devel(devel: boolean) {
		if (typeof devel !== "boolean") {
			return false;
		}
		if (developmentMode === devel)
			return true;
		if (devel) {
			if (!this.Allow(true)) return false;
			AssetGroup.forEach(G => G.Description = G.Name);
			Asset.forEach(A => A.Description = A.Group.Name + ":" + A.Name);
			BackgroundSelectionAll.forEach(B => {
				B.Description = B.Name;
				B.Low = B.Description.toLowerCase();
			});
			console.warn("Developer mode enabled");
		} else {
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

	get antigarble(): number {
		return antigarble;
	}

	set antigarble(value: number) {
		if (![0, 1, 2].includes(value)) {
			throw new Error("Bad antigarble value, expected 0/1/2");
		}
		antigarble = value;
	}

	j_WardrobeExportSelectionClothes(includeBinds: boolean = false): string {
		return j_WardrobeExportSelectionClothes(includeBinds);
	}

	j_WardrobeImportSelectionClothes(data: string | ItemBundle[], includeBinds: boolean, force: boolean = false): string | true {
		return j_WardrobeImportSelectionClothes(data, includeBinds, force);
	}

	j_InvisEarbuds(): void {
		return j_InvisEarbuds();
	}
}

export const consoleInterface: ConsoleInterface = Object.freeze(new ConsoleInterface());

export function init_console() {
	(window as any).bcx = consoleInterface;

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
			DialogTextDefault = (args[0] as Character).FocusGroup.Description;
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
		} else if (opt.Name === "Expression") {
			opt.Draw = DialogDrawExpressionMenu;
		}
	});

	hookFunction("SpeechGarble", 0, (args, next) => {
		if (antigarble === 2) return args[1];
		let res = next(args);
		if (typeof res === "string" && res !== args[1] && antigarble === 1) res += ` <> ${args[1]}`;
		return res;
	});
}
