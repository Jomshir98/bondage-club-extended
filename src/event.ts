export abstract class TypedEventEmitter<T extends BCXEvent> implements BCXEventEmitter<T> {
	private readonly _listeners: Map<keyof T, Set<(value: T[keyof T]) => void>> = new Map();
	private readonly _allListeners: Set<(value: BCXAnyEvent<T>) => void> = new Set();

	public onAny(listener: (value: BCXAnyEvent<T>) => void): () => void {
		this._allListeners.add(listener);
		return () => {
			this._allListeners.delete(listener);
		};
	}

	public on<K extends keyof T>(event: K, listener: (value: T[K]) => void): () => void {
		let listeners = this._listeners.get(event) as Set<(value: T[K]) => void>;
		if (!listeners) {
			listeners = new Set<(value: T[K]) => void>();
			this._listeners.set(event, listeners as Set<(value: T[keyof T]) => void>);
		}
		listeners.add(listener);
		return () => {
			listeners.delete(listener);
			if (listeners.size === 0) {
				this._listeners.delete(event);
			}
		};
	}

	protected emit<K extends keyof T>(event: K, value: T[K]): void {
		this._listeners.get(event)?.forEach((observer) => observer(value));
		const eventData: BCXAnyEvent<T> = {
			event,
			data: value,
		};
		this._allListeners.forEach((observer) => observer(eventData));
	}
}

class BCXGlobalEventSystemClass extends TypedEventEmitter<BCX_Events> {
	public emitEvent<K extends keyof BCX_Events>(event: K, value: BCX_Events[K]): void {
		this.emit(event, value);
	}
}

export const BCXGlobalEventSystem = new BCXGlobalEventSystemClass();
