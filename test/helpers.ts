import type { Page } from "puppeteer";
import type { JestPuppeteerGlobal } from "./_setup/config";
import { BCInteractionManager } from "./bcInteractions";

export function TestBrowserGlobals(): JestPuppeteerGlobal {
	return globalThis as unknown as JestPuppeteerGlobal;
}

const handlePageError = (error: Error) => {
	process.emit("uncaughtException", error);
};

async function doClosePage(page: Page): Promise<void> {
	const { puppeteerConfig } = TestBrowserGlobals();

	if (puppeteerConfig.exitOnPageError) {
		page.off("pageerror", handlePageError);
	}
	await page.close({
		runBeforeUnload: Boolean(puppeteerConfig.runBeforeUnloadOnClose)
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

	return page;
}

export async function TestOpenBC(options: TestPageOptions = {}): Promise<BCInteractionManager> {
	const { httpAddressBc, bcServerAddress } = TestBrowserGlobals();

	const page = await TestOpenPage(options);

	await page.goto(httpAddressBc, {
		waitUntil: "networkidle2"
	});

	// Load ModSDK
	await page.addScriptTag({
		path: "node_modules/bondage-club-mod-sdk/dist/bcmodsdk.js"
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
		url: httpAddressBcx
	});

	await page.waitForFunction(() => !!ServerBeep && typeof ServerBeep === "object" && ServerBeep.Message === "BCX Ready!");
}
