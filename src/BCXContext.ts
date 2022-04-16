export function BCX_setInterval(handler: () => void, timeout?: number): number {
	// eslint-disable-next-line no-restricted-globals
	return setInterval(() => {
		const ctx = debugContextStart("BCX internal interval", { root: true, bcxArea: true });
		handler();
		ctx.end();
	}, timeout);
}

export function BCX_setTimeout(handler: () => (void | Promise<void>), timeout?: number): number {
	// eslint-disable-next-line no-restricted-globals
	return setTimeout(() => {
		const ctx = debugContextStart("BCX internal timeout", { root: true, bcxArea: true });
		handler();
		ctx.end();
	}, timeout);
}

export interface DebugContextHandle {
	end(): void;
}

interface DebugContext {
	name: string;
	bcxArea: boolean;
	root: boolean;
	extraInfo?: () => string;
}

let contextStack: DebugContext[] = [];

export function contextInBCXArea(): boolean {
	if (contextStack.length === 0)
		return false;
	return contextStack[contextStack.length - 1].bcxArea;
}

export function debugContextStart(name: string, { root = false, bcxArea, extraInfo }: {
	root?: boolean,
	bcxArea?: boolean,
	extraInfo?: () => string
} = {}): DebugContextHandle {

	const context: DebugContext = {
		name,
		bcxArea: bcxArea ?? contextInBCXArea(),
		root,
		extraInfo
	};

	const handle: DebugContextHandle = {
		end: () => {
			if (contextStack[contextStack.length - 1] === context) {
				contextStack.pop();
				return;
			}
			const index = contextStack.indexOf(context);
			if (index < 0) {
				console.warn(`BCX: Debug context end while it is not on stack`, context, new Error());
			} else {
				const toRemove = contextStack.length - index;
				const removed = contextStack.splice(index, toRemove);
				console.warn(`BCX: Debug context end while not on top of the stack (depth ${toRemove})`, removed, new Error());
			}
		}
	};

	if (root && contextStack.length > 0) {
		console.warn(`BCX: Root context when we already have context`, contextStack, new Error());
		contextStack = [];
	}

	contextStack.push(context);

	return handle;
}

export function debugMakeContextReport(): string {
	let res = `----- Current context (most recent first) -----\n`;
	if (contextStack.length === 0) {
		res += `[None]\n`;
	} else {
		for (let i = contextStack.length - 1; i >= 0; i--) {
			const ctx = contextStack[i];
			res += `> ${ctx.name}\n`;
			if (ctx.extraInfo) {
				let extra = "";
				try {
					extra = ctx.extraInfo();
				} catch (error) {
					extra = "Error processing extra info:\n" + (error instanceof Error ? (error.stack ?? "[stack missing]") : `${error}`);
				}
				if (extra) {
					res += extra.trim().replace(/\n|^/g, m => `${m}| `) + "\n";
				}
			}
		}
		if (!contextStack[0].root) {
			res += `[unknown origin]\n`;
		}
	}

	return res;
}
