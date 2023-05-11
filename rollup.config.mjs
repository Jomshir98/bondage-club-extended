"use strict";

import typescript from "@rollup/plugin-typescript";
import progress from "rollup-plugin-progress";
import serve from "rollup-plugin-serve";
import copy from "rollup-plugin-copy";
import resolve from "@rollup/plugin-node-resolve";
import json from "@rollup/plugin-json";
import commonjs from "@rollup/plugin-commonjs";
import terser from "@rollup/plugin-terser";

import packageJson from "./package.json" assert { type: "json" };
import simpleGit from "simple-git";

/* global process */

/**
 * Creates options for building BCX
 * @param {string} output - Output file for bcx
 * @param {import("rollup").OutputPlugin[]} plugins - Extra plugins to apply
 * @returns {import("rollup").OutputOptions}
 */
function GetBCXBuilder(output, plugins = []) {
	return {
		file: output,
		format: "iife",
		sourcemap: true,
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
		intro: async () => {
			const git = simpleGit();
			let BCX_VERSION = packageJson.version;
			let BCX_DEVEL = "false";
			if ((await git.status()).modified.length > 0) {
				BCX_VERSION += `-DEV-${new Date().toISOString().replace(/[-:T]/g, "").replace(/\.[0-9]*Z/, "")}`;
				BCX_DEVEL = "true";
			} else {
				BCX_VERSION += `-${(await git.revparse("HEAD")).substr(0, 8)}`;
			}
			if (process.env.IS_DEVEL) {
				BCX_DEVEL = "true";
			}
			return `const BCX_VERSION="${BCX_VERSION}";const BCX_DEVEL=${BCX_DEVEL};`;
		},
		plugins,
	};
}

/** @type {import("rollup").RollupOptions} */
const config = {
	input: "src/index.ts",
	output: [],
	treeshake: false,
	cache: false,
	plugins: [
		progress({ clearLine: true }),
		resolve({ browser: true }),
		json(),
		typescript({ tsconfig: "./tsconfig.json", inlineSources: true }),
		commonjs(),
		copy({
			targets: [
				{
					src: [
						"static/*",
						process.env.IS_DEVEL ? "static_devel/*" : "static_stable/*",
					],
					dest: "dist",
				},
				{
					src: "resources/*",
					dest: "dist/resources",
				},
			],
		}),
	],
	onwarn(warning, warn) {
		switch (warning.code) {
			case "EVAL":
			case "CIRCULAR_DEPENDENCY":
				return;
			default:
				warn(warning);
		}
	},
};

if (process.env.ROLLUP_WATCH) {
	config.output.push(
		GetBCXBuilder("dist/bcx.js")
	);
	config.plugins.push(
		serve({
			contentBase: "dist",
			host: "localhost",
			port: 8082,
			headers: {
				"Access-Control-Allow-Origin": "*",
			},
		})
	);
} else {
	config.output.push(
		GetBCXBuilder("dist/bcx.js", [
			terser(),
		]),
		GetBCXBuilder("dist/bcx.dev.js")
	);
}

export default config;
