import type Runtime from "jest-runtime";
import type PuppeteerEnvironment from "./environment";

export default function (...args: unknown[]) {
	const environment = args[2] as PuppeteerEnvironment;
	const runtime = args[3] as Runtime;

	const originalCoverage = runtime.getAllV8CoverageInfoCopy.bind(runtime);
	runtime.getAllV8CoverageInfoCopy = (...covArgs) => {
		const result = originalCoverage(...covArgs);

		environment.coverageData.forEach((covData) => {
			result.push({
				codeTransformResult: undefined,
				result: covData,
			});
		});

		return result;
	};

	// eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-var-requires
	return require("jest-circus/runner")(...args);
}
