import { AddInterfaceText } from "./miscPatches";

export function GetDialogMenuButtonArray(): BCX_DialogMenuButton[] {
	return DialogMenuButton;
}

export function SetDialogMenuButtonArray(newValue: BCX_DialogMenuButton[]): void {
	DialogMenuButton = newValue as DialogMenuButtonType[];
}

export function AddDialogMenuButtonName(keyword: string, value: string) {
	AddInterfaceText(`DialogMenu${keyword}`, value);
}
