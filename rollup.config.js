"use strict";

import typescript from "@rollup/plugin-typescript";
import progress from "rollup-plugin-progress";
import serve from "rollup-plugin-serve";

/** @type {import("rollup").RollupOptions} */
const config = {
	input: "src/index.ts",
	output: {
		file: "dist/bcx.js",
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
`
	},
	treeshake: false,
	plugins: [
		progress({ clearLine: true }),
		typescript({ tsconfig: "./tsconfig.json" })
	],
	onwarn: function (warning, warn) {
		switch (warning.code) {
			case "EVAL":
			case "CIRCULAR_DEPENDENCY":
				return;
			default:
				warn(warning);
		}
	}
};

if (process.env.ROLLUP_WATCH) {
	config.plugins.push(
		serve({
			contentBase: "dist",
			host: "localhost",
			port: 8082,
			headers: {
				"Access-Control-Allow-Origin": "*"
			}
		})
	);
}

export default config;
