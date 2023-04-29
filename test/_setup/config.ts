import type { BrowserContext, Browser, PuppeteerLaunchOptions } from "puppeteer";

export type TestContext = {
	cleanup?: (() => Promise<void> | void)[];
};

declare global {
	// eslint-disable-next-line no-var
	var __testContext: TestContext | undefined;
}

export type Config = {
	browserContext: "default" | "incognito";
	exitOnPageError: true;
	runBeforeUnloadOnClose?: boolean;
	launch: PuppeteerLaunchOptions;
};

export type CoverageData = import("inspector").Profiler.ScriptCoverage[];

export type StrictGlobal = {
	writeCoverate?: (coverageData: CoverageData) => void;
	browser?: Browser | undefined;
	context?: BrowserContext | undefined;
	puppeteerConfig: Config;
	bcServerAddress?: string;
	httpAddressBc?: string;
	httpAddressBcx?: string;
};

export type JestPuppeteerGlobal = Required<StrictGlobal>;

const DEFAULT_CONFIG = {
	browserContext: "incognito",
	exitOnPageError: true,
} as const;

export function getConfig(): Config {
	if (process.env.CI) {
		return {
			...DEFAULT_CONFIG,
			launch: {
				headless: "new",
				args: [
					"--no-sandbox",
					"--disable-setuid-sandbox",
					"--disable-background-timer-throttling",
					"--disable-backgrounding-occluded-windows",
					"--disable-renderer-backgrounding",
				],
			},
		};
	}
	return {
		...DEFAULT_CONFIG,
		launch: {
			headless: "new",
		},
	};
}
