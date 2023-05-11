import type { Page } from "puppeteer";
import type { JestPuppeteerGlobal } from "./_setup/config";
import { BCInteractionManager } from "./bcInteractions";
import { AssertNotNullable } from "./utils";
import * as path from "path";

export function TestBrowserGlobals(): JestPuppeteerGlobal {
	return globalThis as unknown as JestPuppeteerGlobal;
}

const handlePageError = (error: Error) => {
	process.emit("uncaughtException", error);
};

async function doClosePage(page: Page): Promise<void> {
	const { writeCoverate, puppeteerConfig, httpAddressBcx, httpAddressBc } = TestBrowserGlobals();

	if (puppeteerConfig.exitOnPageError) {
		page.off("pageerror", handlePageError);
	}

	const jsCoverage = await page.coverage.stopJSCoverage();

	const BCPath = path.resolve(process.cwd(), "../Bondage-College/BondageClub");
	const BCXPath = path.resolve(process.cwd(), "./dist/bcx.dev.js");
	const AllowedPath = path.resolve(process.cwd(), "..");

	// Point to original .js files
	const coverage = jsCoverage
		.map(({ rawScriptCoverage: it }) => {
			AssertNotNullable(it);
			return ({
				...it,
				scriptId: String(it.scriptId),
				url: it.url
					.replaceAll(httpAddressBcx, BCXPath)
					.replaceAll(httpAddressBc, BCPath),
			});
		})
		.filter(res =>
			res.url.startsWith(AllowedPath) &&
			!res.url.includes("node_modules") &&
			res.url.endsWith(".js") &&
			!res.url.endsWith(".min.js")
		);

	// Export coverage data
	writeCoverate(coverage);

	await page.close({
		runBeforeUnload: Boolean(puppeteerConfig.runBeforeUnloadOnClose),
	});
}

export async function ClosePage(page: Page): Promise<void> {
	const openEachIndex = openPagesEach.indexOf(page);
	if (openEachIndex >= 0) {
		openPagesEach.splice(openEachIndex, 1);
	}
	const openAllIndex = openPagesAll.indexOf(page);
	if (openAllIndex >= 0) {
		openPagesAll.splice(openAllIndex, 1);
	}

	await doClosePage(page);
}

let openPagesEach: Page[] = [];
afterEach(async () => {
	await Promise.all(openPagesEach.map(doClosePage));
	openPagesEach = [];
}, 60_000);

let openPagesAll: Page[] = [];
afterAll(async () => {
	await Promise.all(openPagesAll.map(doClosePage));
	openPagesAll = [];
}, 60_000);

export interface TestPageOptions {
	keepOpen?: boolean;
}

export async function TestOpenPage(options: TestPageOptions = {}): Promise<Page> {
	const { context, puppeteerConfig } = TestBrowserGlobals();

	const page = await context.newPage();
	if (puppeteerConfig.exitOnPageError) {
		page.on("pageerror", handlePageError);
	}

	if (options.keepOpen) {
		openPagesAll.push(page);
	} else {
		openPagesEach.push(page);
	}

	await page.coverage.startJSCoverage({
		resetOnNavigation: false,
		includeRawScriptCoverage: true,
	});

	return page;
}

export async function TestOpenBC(options: TestPageOptions = {}): Promise<BCInteractionManager> {
	const { httpAddressBc, bcServerAddress } = TestBrowserGlobals();

	const page = await TestOpenPage(options);

	await page.goto(httpAddressBc, {
		waitUntil: "networkidle2",
	});

	// Load ModSDK
	await page.addScriptTag({
		path: "node_modules/bondage-club-mod-sdk/dist/bcmodsdk.js",
	});

	// Replace server connection to the correct server
	const currentAddress = await page.evaluate(() => ServerURL);
	expect(currentAddress).toBe("https://bondage-club-server-test.herokuapp.com/");
	await page.evaluate((serverAddress) => {
		ServerURL = serverAddress;
		ServerSocket.close();
		if (ServerIsConnected) {
			throw new Error("Assertion failed");
		}
		ServerInit();
	}, bcServerAddress);
	await page.waitForFunction(() => ServerIsConnected);

	const bc = new BCInteractionManager(page);
	await bc._init();

	return bc;
}

export async function TestLoadBCX(page: Page): Promise<void> {
	const { httpAddressBcx } = TestBrowserGlobals();

	await page.addScriptTag({
		url: httpAddressBcx,
	});

	await page.waitForFunction(() => !!ServerBeep && typeof ServerBeep === "object" &&
		(ServerBeep.Message === "BCX Ready!" || ServerBeep.Message.startsWith("BCX loaded!"))
	);
}
