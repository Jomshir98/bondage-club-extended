export function Test_setTimeout(handler: () => (void | Promise<void>), timeout?: number): NodeJS.Timeout {
	// eslint-disable-next-line no-restricted-globals
	return setTimeout(() => {
		handler();
	}, timeout);
}

/**
 * Waits for set amount of time, returning promes
 * @param ms The time in ms to wait for
 */
export function wait(ms: number): Promise<void> {
	return new Promise(r => Test_setTimeout(r, ms));
}

export function Assert(condition: unknown, msg?: string): asserts condition {
	if (!condition) {
		throw new Error(msg ? `Assetion failed: ${msg}` : "Assertion failed");
	}
}

/**
 * Assert all arguments are `never`
 *
 * Useful for checking all possible outcomes are handled
 */
export function AssertNever(...args: never[]): never {
	throw new Error(`Never assertion failed with arguments: ${args.join(", ")}`);
}

export function AssertNotNullable<T>(value: T): asserts value is NonNullable<T> {
	if (value === null || value === undefined) {
		throw new Error("Value is null or undefined");
	}
}

export type ManuallyResolvedPromise<T> = {
	promise: Promise<T>;
	resolve: (value: T | PromiseLike<T>) => void;
	reject: (reason?: unknown) => void;
};

export function CreateManuallyResolvedPromise<T>(): ManuallyResolvedPromise<T> {
	let resolve!: ManuallyResolvedPromise<T>["resolve"];
	let reject!: ManuallyResolvedPromise<T>["reject"];
	const promise = new Promise<T>((promiseResolve, promiseReject) => {
		resolve = promiseResolve;
		reject = promiseReject;
	});
	return { promise, resolve, reject };
}
