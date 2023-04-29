import * as puppeteer from "puppeteer";
import type { Browser } from "puppeteer";
import NodeEnvironment from "jest-environment-node";
import { Config, CoverageData, StrictGlobal, getConfig } from "./config";

function getEnvString(name: string): string {
	const value = process.env[name];
	if (typeof value !== "string") {
		throw new Error(`Env: ${name} not found`);
	}
	return value;
}

async function connectBrowserFromWorker(config: Config): Promise<Browser> {
	const wsEndpoint = getEnvString("PUPPETEER_WS_ENDPOINT");
	return puppeteer.connect({
		...config.launch,
		browserURL: undefined,
		browserWSEndpoint: wsEndpoint,
	});
}

class PuppeteerEnvironment extends NodeEnvironment {
	public coverageData: CoverageData = [];

	async setup(): Promise<void> {
		await super.setup();

		// Preset
		const global = this.global as unknown as StrictGlobal;
		global.puppeteerConfig = getConfig();

		global.bcServerAddress = getEnvString("BC_SERVER_ADDRESS");
		global.httpAddressBc = getEnvString("HTTP_SERVER_BC_ADDRESS");
		global.httpAddressBcx = getEnvString("HTTP_SERVER_BCX_ADDRESS");

		global.writeCoverate = (coverage) => {
			this.coverageData.push(...coverage);
		};

		// Connect to the browser
		if (global.browser) {
			throw new Error("Cannot connect browser before closing previous browser.");
		}
		const browser = global.browser = await connectBrowserFromWorker(global.puppeteerConfig);

		// Create context
		if (global.context) {
			throw new Error("Cannot create context before closing previous context.");
		}
		const configBrowserContext = global.puppeteerConfig.browserContext;
		switch (configBrowserContext) {
			case "default":
				global.context = browser.defaultBrowserContext();
				break;
			case "incognito":
				global.context = await browser.createIncognitoBrowserContext();
				break;
			default:
				throw new Error(
					`browserContext should be either 'incognito' or 'default'. Received '${configBrowserContext}'`
				);
		}
	}

	async teardown() {
		const global = this.global as unknown as StrictGlobal;

		// Close context
		if (global.context) {
			if (global.context.isIncognito()) {
				await global.context.close();
			}
			global.context = undefined;
		}

		// Disconnect
		if (global.browser) {
			global.browser.disconnect();
			global.browser = undefined;
		}

		await super.teardown();
	}
}

export default PuppeteerEnvironment;
