import { useState, useEffect, useCallback } from "preact/hooks";

/**
 * A hook to manage a single optimistic value.
 * Falls back to the passthrough value when it changes.
 */
export function useOptimistic<T>(passthrough: T): [T, (value: T) => void, () => void] {
	const [optimisticValue, setOptimisticValue] = useState<T | null>(null);

	useEffect(() => {
		setOptimisticValue(null);
	}, [passthrough]);

	const value = optimisticValue !== null ? optimisticValue : passthrough;
	const reset = useCallback(() => setOptimisticValue(null), []);

	return [value, setOptimisticValue, reset];
}

/**
 * A hook to manage a map of optimistic values, useful for lists of items
 * (e.g. smart home devices / actions) where each item has an independent state.
 */
export function useOptimisticMap<T>(passthroughMap: Record<string, T>) {
	const [optimisticMap, setOptimisticMap] = useState<Record<string, T>>({});

	// Reconcile optimistic values when authoritative values change.
	// If the authoritative value catches up to our optimistic value, remove it.
	useEffect(() => {
		setOptimisticMap((prev) => {
			const next = { ...prev };
			let changed = false;
			for (const key of Object.keys(next)) {
				if (passthroughMap[key] === next[key]) {
					delete next[key];
					changed = true;
				}
			}
			return changed ? next : prev;
		});
	}, [passthroughMap]);

	const setOptimistic = useCallback((key: string, value: T) => {
		setOptimisticMap((prev) => ({ ...prev, [key]: value }));
	}, []);

	const clearOptimistic = useCallback((key: string) => {
		setOptimisticMap((prev) => {
			if (!(key in prev)) return prev;
			const next = { ...prev };
			delete next[key];
			return next;
		});
	}, []);

	const getOptimisticValue = useCallback(
		(key: string, fallback: T) => {
			const opt = optimisticMap[key];
			return opt !== undefined ? opt : fallback;
		},
		[optimisticMap]
	);

	return { getOptimisticValue, setOptimistic, clearOptimistic, optimisticMap };
}
