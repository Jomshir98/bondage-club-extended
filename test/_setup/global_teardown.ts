import type { Config as JestConfig } from "jest";

export default async (_jestConfig: JestConfig) => {
	const ctx = globalThis.__testContext;

	if (!ctx) return;

	if (ctx.cleanup) {
		const cleanup = ctx.cleanup;
		delete ctx.cleanup;

		for (const cleanupCall of cleanup.reverse()) {
			await cleanupCall();
		}
	}
};
