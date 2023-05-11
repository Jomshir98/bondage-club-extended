interface BCTestButton {
	Left: number;
	Top: number;
	Width: number;
	Height: number;
	Label: string;
	Color: string;
	Image: string;
	HoveringText: string;
	Disabled: boolean;
}

interface BCTestText {
	Text: string;
	X: number;
	Y: number;
	Color: string;
	BackColor: string;
}

type BCTestInjectedFunctionsTable = import("./bcInteractions").InjectedFunctionsTable;

interface Window extends BCTestInjectedFunctionsTable {
	bcModSdk: import("bondage-club-mod-sdk").ModSDKGlobalAPI;

	BCTest_currentButtons?: BCTestButton[];
	BCTest_wantedButton?: Partial<BCTestButton>;

	BCTest_wantedDialogLine?: Partial<DialogLine>;

	BCTest_currentTexts?: BCTestText[];
	BCTest_wantedText?: Partial<BCTestText>;
}
