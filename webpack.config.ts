import { join } from "path";
import { BannerPlugin, Configuration, DefinePlugin, RuleSetRule } from "webpack";
import "webpack-dev-server";
import CopyPlugin from "copy-webpack-plugin";
import TerserPlugin from "terser-webpack-plugin";
import { CleanWebpackPlugin } from "clean-webpack-plugin";

import packageJson from "./package.json";
import simpleGit from "simple-git";

const WEBPACK_DEV_SERVER_PORT = 8082;

const SRC_DIR = join(__dirname, "src");
const DIST_DIR = join(__dirname, "dist");
const STATIC_DIR = join(__dirname, "static");
const STATIC_DEVEL_DIR = join(__dirname, "static_devel");
const STATIC_STABLE_DIR = join(__dirname, "static_stable");
const RESOURCES_DIR = join(__dirname, "resources");

interface WebpackEnv {
	prod?: boolean;
}

export default async function (env: WebpackEnv): Promise<Configuration> {
	const mode = env.prod ? "production" : "development";
	const git = simpleGit();
	let BCX_VERSION = packageJson.version;
	let BCX_DEVEL = false;
	if ((await git.status()).modified.length > 0) {
		BCX_VERSION += `-DEV-${new Date().toISOString().replace(/[-:T]/g, "").replace(/\.[0-9]*Z/, "")}`;
		BCX_DEVEL = true;
	} else {
		BCX_VERSION += `-${(await git.revparse("HEAD")).substring(0, 8)}`;
	}
	if (process.env.IS_DEVEL) {
		BCX_DEVEL = true;
	}

	return {
		devServer: {
			hot: false,
			open: false,
			client: false,
			allowedHosts: "all",
			headers: {
				"Access-Control-Allow-Origin": "*",
				"Access-Control-Allow-Credentials": "true",
				"Access-Control-Allow-Methods": "GET,HEAD,PUT,PATCH,POST,DELETE",
				"Access-Control-Expose-Headers": "Content-Length",
				"Access-Control-Allow-Headers": "Accept, Authorization, Content-Type, X-Requested-With, Range",
			},
			port: WEBPACK_DEV_SERVER_PORT,
			compress: true,
			devMiddleware: {
				writeToDisk: true,
			},
		},
		devtool: env.prod ? "source-map" : "inline-source-map",
		entry: join(SRC_DIR, "index.ts"),
		mode,
		module: {
			rules: GenerateRules(env),
		},
		optimization: {
			minimizer: [
				new TerserPlugin({
					terserOptions: {
						compress: {
							passes: 2,
						},
						format: {
							preamble: "// BCX: Bondage Club Extended",
						},
					},
					include: "bcx.js",
				}),
			],
			usedExports: true,
			splitChunks: false,
		},
		output: {
			path: DIST_DIR,
			filename: `bcx.js`,
		},
		plugins: [
			new CleanWebpackPlugin(),
			new DefinePlugin({
				BCX_VERSION: JSON.stringify(BCX_VERSION),
				BCX_DEVEL: JSON.stringify(BCX_DEVEL),
			}),
			new BannerPlugin({
				banner: `// BCX: Bondage Club Extended
if (typeof window.ImportBondageCollege !== "function") {
	alert("Club not detected! Please only use this while you have Club open!");
	throw "Dependency not met";
}
if (window.BCX_Loaded !== undefined) {
	alert("BCX is already detected in current window. To reload, please refresh the window.");
	throw "Already loaded";
}
window.BCX_Loaded = false;
console.debug("BCX: Parse start...");
`,
				raw: true,
			}),
			new CopyPlugin({
				patterns: [
					{ from: STATIC_DIR, to: DIST_DIR },
					{ from: process.env.IS_DEVEL ? STATIC_DEVEL_DIR : STATIC_STABLE_DIR, to: DIST_DIR },
					{ from: RESOURCES_DIR, to: join(DIST_DIR, "resources") },
				],
			}),
		],
		resolve: {
			extensions: [".ts", ".tsx", ".js"],
		},
		performance: false,
	};
}

function GenerateRules(_env: WebpackEnv): RuleSetRule[] {
	const moduleRules: RuleSetRule[] = [
		{
			test: /\.tsx?$/i,
			exclude: /node_modules/,
			use: [{
				loader: "ts-loader",
				options: {
					configFile: "tsconfig.json",
				},
			}],
		},
	];

	return moduleRules;
}
