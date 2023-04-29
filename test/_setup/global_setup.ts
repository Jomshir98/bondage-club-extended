import * as puppeteer from "puppeteer";
import type { Config as JestConfig } from "jest";
import * as fs from "fs";
import * as path from "path";
import express from "express";
import { getPortPromise } from "portfinder";
import { spawnSync, SpawnSyncOptions } from "child_process";
import { setup as setupDevServer, teardown as teardownDevServer } from "jest-dev-server";
import { MongoMemoryServer } from "mongodb-memory-server-core";

import { TestContext, getConfig } from "./config";

function run(command: string, args: string[] = [], options: SpawnSyncOptions = {}): void {
	const { error } = spawnSync(command, args, {
		stdio: "inherit",
		...options,
	});
	if (error)
		throw error;
}

export default async (_jestConfig: JestConfig) => {
	console.log("\nRunning global setup");

	const ctx: TestContext = globalThis.__testContext = globalThis.__testContext ?? {};
	const cleanup: (() => Promise<void> | void)[] = ctx.cleanup = [];
	const config = getConfig();

	let port = 8080;
	let mongoDbStringConnection: string;

	// Start MongoDB
	{
		console.log("Starting MongoDB server...");
		const mongoDbServer = await MongoMemoryServer.create({
			binary: {
				checkMD5: false,
			},
			instance: {
				storageEngine: "ephemeralForTest",
				args: ["--setParameter", "diagnosticDataCollectionEnabled=false"],
			},
		});

		mongoDbStringConnection = mongoDbServer.getUri();

		cleanup.push(async () => {
			await mongoDbServer.stop();
		});
	}

	// Start BC server
	{
		console.log("Starting BC server...");
		const BCServerPath = path.join("..", "Bondage-Club-Server");
		const BCServerApp = path.join(BCServerPath, "app.js");
		if (!fs.existsSync(BCServerApp) || !fs.statSync(BCServerApp).isFile()) {
			throw new Error(`Did not find BC server at ${BCServerPath}`);
		}

		const newrelicConfig = path.join(BCServerPath, "newrelic.js");
		if (fs.existsSync(newrelicConfig)) {
			fs.unlinkSync(newrelicConfig);
		}

		run("npm", ["install", "--no-audit", "--no-fund"], {
			cwd: BCServerPath,
		});

		port = await getPortPromise({ host: "127.0.0.1", port: port + 1 });

		const server = await setupDevServer({
			command: `npm run start`,
			launchTimeout: 15000,
			debug: true,
			port,
			options: {
				env: {
					...process.env,
					NEW_RELIC_ENABLED: "false",
					NEW_RELIC_NO_CONFIG_FILE: "true",
					PORT: port.toString(10),
					DATABASE_URL: mongoDbStringConnection,
				},
				cwd: BCServerPath,
			},
		});

		process.env.BC_SERVER_ADDRESS = `http://localhost:${port}/`;

		cleanup.push(async () => {
			await teardownDevServer(server);
		});
	}

	// Start BC host
	{
		console.log("Starting HTTP server...");
		const BCPath = path.join("..", "Bondage-College");
		const BCIndex = path.join(BCPath, "BondageClub", "index.html");
		if (!fs.existsSync(BCIndex) || !fs.statSync(BCIndex).isFile()) {
			throw new Error(`Did not find BC at ${BCPath}`);
		}

		const BCXPath = "dist";
		const BCXLoader = path.join(BCXPath, "bcx.dev.js");
		if (!fs.existsSync(BCXLoader) || !fs.statSync(BCXLoader).isFile()) {
			throw new Error(`Did not find built BCX at ${BCPath}, please build BCX first`);
		}

		const app = express();

		app.use(
			"/Bondage-College",
			express.static(BCPath)
		);
		app.use(
			"/BCX",
			express.static(BCXPath)
		);

		port = await getPortPromise({ host: "127.0.0.1", port: port + 1 });
		const server = app.listen(port);

		process.env.HTTP_SERVER_BC_ADDRESS = `http://localhost:${port}/Bondage-College/BondageClub`;
		process.env.HTTP_SERVER_BCX_ADDRESS = `http://localhost:${port}/BCX/bcx.dev.js`;

		cleanup.push(async () => {
			await new Promise((resolve) => {
				server.close(resolve);
				server.closeAllConnections();
			});
		});
	}

	// Start puppeteer
	{
		console.log("Starting browser...");
		const browser = await puppeteer.launch(config.launch);
		process.env.PUPPETEER_WS_ENDPOINT = browser.wsEndpoint();
		cleanup.push(async () => {
			await browser.close();
		});
	}

	console.log("\nGlobal setup done\n");
};
