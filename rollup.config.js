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
		banner: "// BCX: Bondage Club Extended\n"
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
				console.log(warning.code);
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
