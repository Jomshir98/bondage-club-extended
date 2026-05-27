import type { BrowserContext, Browser, LaunchOptions } from "puppeteer";

export type TestContext = {
	cleanup?: (() => Promise<void> | void)[];
};

declare global {
	var __testContext: TestContext | undefined;
}

export type Config = {
	browserContext: "default" | "incognito";
	exitOnPageError: true;
	runBeforeUnloadOnClose?: boolean;
	launch: LaunchOptions;
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
				headless: true,
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
			headless: true,
		},
	};
}
