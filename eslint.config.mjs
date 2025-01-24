import stylisticTs from "@stylistic/eslint-plugin-ts";
import { fixupPluginRules } from "@eslint/compat";
import deprecation from "eslint-plugin-deprecation";
import globals from "globals";
import tsParser from "@typescript-eslint/parser";
import path from "node:path";
import { fileURLToPath } from "node:url";
import eslint from "@eslint/js";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const compat = new FlatCompat({
	baseDirectory: __dirname,
	recommendedConfig: eslint.configs.recommended,
	allConfig: eslint.configs.all,
});

/** @type {import("typescript-eslint").InfiniteDepthConfigWithExtends} */
const conf = [
	{
		ignores: [
			".git/**",
			"coverage/**",
			"dist/**",
			"eslint.config.mjs",
			"jest.config.js",
			"node_modules/**",
			"static_devel/",
			"static_stable/",
			"tools/*.mjs",
			"webpack.config.ts",
		],
	},
	...compat.extends("eslint:recommended", "plugin:@typescript-eslint/recommended"),
	{
		plugins: {
			"@stylistic/ts": stylisticTs,
		},

		languageOptions: {
			ecmaVersion: 2021,
			sourceType: "module",

			parser: tsParser,
			parserOptions: {
				projectService: true,
				tsconfigRootDir: import.meta.dirname,
				project: ["./tsconfig.json", "./test/tsconfig.json", "./tsconfig.webpack.json"],
			},

			globals: {
				...globals.browser,
			},
		},

		rules: {
			"@typescript-eslint/no-inferrable-types": "off",
			"no-console": "off",
			"@typescript-eslint/no-explicit-any": "off",
			"@typescript-eslint/no-non-null-assertion": "off",
			"@typescript-eslint/restrict-template-expressions": "off",
			"@typescript-eslint/explicit-module-boundary-types": "off",
			"no-debugger": "off",
			"require-yield": "off",
			"no-use-before-define": "off",

			"@typescript-eslint/ban-ts-comment": ["error", {
				"ts-expect-error": "allow-with-description",
			}],

			"@typescript-eslint/parameter-properties": ["error", {
				prefer: "class-property",
			}],

			"eqeqeq": ["error", "always", {
				null: "ignore",
			}],

			"no-bitwise": "error",
			"no-eval": "error",
			"no-shadow": "off",

			"@typescript-eslint/no-shadow": ["error", {
				hoist: "all",
			}],

			"no-throw-literal": "error",
			"no-var": "error",
			"unicode-bom": "error",
			"@typescript-eslint/unified-signatures": "error",
			"no-caller": "error",
			"no-new-wrappers": "error",

			"@typescript-eslint/no-unused-vars": ["warn", {
				"args": "none",
				"caughtErrors": "none"
				// "varsIgnorePattern": "^_",
				// "argsIgnorePattern": "^_",
			}],

			"no-unused-expressions": "off",
			"@typescript-eslint/no-unused-expressions": "warn",
			"@typescript-eslint/prefer-for-of": "warn",
			"prefer-const": "warn",
			"no-undef-init": "warn",
			"object-shorthand": "warn",

			"no-multiple-empty-lines": ["warn", {
				max: 1,
				maxBOF: 0,
				maxEOF: 1,
			}],

			"operator-assignment": "warn",
			"prefer-object-spread": "warn",
			"radix": "warn",
			"dot-notation": "warn",
			"@stylistic/ts/semi": ["warn", "always"],

			"@stylistic/ts/indent": ["warn", "tab", {
				SwitchCase: 1,
				ignoredNodes: ["ConditionalExpression"],
			}],

			"@stylistic/ts/comma-dangle": ["warn", {
				arrays: "always-multiline",
				objects: "always-multiline",
				imports: "always-multiline",
				exports: "always-multiline",
				enums: "always-multiline",
				functions: "never",
				generics: "never",
				tuples: "never",
			}],

			"@stylistic/ts/member-delimiter-style": ["warn", {
				singleline: {
					requireLast: true,
				},
			}],

			"no-trailing-spaces": "warn",

			"@stylistic/ts/quotes": ["warn", "double", {
				avoidEscape: true,
				allowTemplateLiterals: true,
			}],

			"@typescript-eslint/array-type": ["warn"],

			"@typescript-eslint/consistent-type-assertions": ["warn", {
				assertionStyle: "as",
				objectLiteralTypeAssertions: "never",
			}],

			"@typescript-eslint/prefer-function-type": "warn",
			"one-var": ["warn", "never"],
			"@stylistic/ts/brace-style": ["warn", "1tbs"],

			"space-before-function-paren": ["warn", {
				anonymous: "always",
				named: "never",
				asyncArrow: "always",
			}],

			"array-bracket-spacing": ["warn", "never"],
			"@stylistic/ts/comma-spacing": "warn",
			"comma-style": "warn",
			"computed-property-spacing": "warn",
			"eol-last": "warn",
			"func-call-spacing": "warn",
			"key-spacing": "warn",
			"@stylistic/ts/type-annotation-spacing": "warn",
			"@stylistic/ts/keyword-spacing": "warn",
			"linebreak-style": ["warn", "unix"],
			"no-whitespace-before-property": "warn",

			"object-curly-newline": ["warn", {
				multiline: true,
				consistent: true,
			}],

			"@stylistic/ts/object-curly-spacing": ["warn", "always"],
			"quote-props": ["warn", "consistent"],
			"semi-spacing": "warn",
			"semi-style": "warn",
			"space-before-blocks": "warn",
			"space-in-parens": "warn",
			"switch-colon-spacing": "warn",
			"arrow-spacing": "warn",
			"new-parens": "warn",

			"no-restricted-globals": ["error", {
				name: "setInterval",
				message: "Use BCX_setInterval instead.",
			}, {
				name: "setTimeout",
				message: "Use BCX_setTimeout instead.",
			}],

			"no-restricted-properties": ["error", {
				object: "window",
				property: "setInterval",
				message: "Use BCX_setInterval instead.",
			}, {
				object: "window",
				property: "setTimeout",
				message: "Use BCX_setTimeout instead.",
			}],
		},
	},
	...compat.extends(
		"plugin:@typescript-eslint/recommended-type-checked-only",
	).map(config => ({
		...config,
		files: ["**/*.ts"],
	})),
	...compat.extends(
		"plugin:deprecation/recommended",
	).map(config => ({
		...config,
		plugins: { deprecation: fixupPluginRules(config.plugins.deprecation) },
		files: ["**/*.ts"],
	})),
	{
		rules: {
			"@typescript-eslint/no-unsafe-member-access": "off",
			"@typescript-eslint/no-unsafe-assignment": "off",
			"@typescript-eslint/restrict-template-expressions": "off",
			"@typescript-eslint/no-unsafe-return": "off",
			"@typescript-eslint/no-unsafe-argument": "off",
			"@typescript-eslint/no-floating-promises": "off",
			"@typescript-eslint/no-explicit-any": "off",
			"@typescript-eslint/no-unsafe-enum-comparison": "off",
			"@typescript-eslint/only-throw-error": "error",

			"@typescript-eslint/restrict-plus-operands": ["error", {
				allowAny: true,
			}],

			"@typescript-eslint/no-unnecessary-boolean-literal-compare": "warn",
			"dot-notation": "off",
			"@typescript-eslint/dot-notation": "warn",
		},
	}
];

console.log(conf);

export default conf;
