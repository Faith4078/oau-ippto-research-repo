import { useCallback, useEffect, useMemo, useRef, useState } from "react";

/**
 * Returns a debounced copy of `value` that only updates once `value` has
 * stopped changing for `delayMs` milliseconds. The input stays fully
 * controlled and instantly responsive; only the *reaction* to it (a network
 * request, an expensive filter, etc.) is delayed.
 */
export function useDebouncedValue<T>(value: T, delayMs: number): T {
	const [debounced, setDebounced] = useState(value);

	useEffect(() => {
		const timer = setTimeout(() => setDebounced(value), delayMs);
		return () => clearTimeout(timer);
	}, [value, delayMs]);

	return debounced;
}

type DebouncedCallback<Args extends unknown[]> = ((...args: Args) => void) & {
	/** Cancels any pending invocation without calling it. */
	cancel: () => void;
};

/**
 * Wraps `callback` so that calling the returned function schedules it to run
 * after `delayMs` milliseconds, resetting the timer on every call so only
 * the last call in a burst (e.g. a run of keystrokes) actually executes.
 *
 * Always invokes the latest `callback` passed in (safe to use with a
 * callback whose identity changes across renders), and cleans up its pending
 * timer automatically on unmount. Call `.cancel()` on the returned function
 * to discard a pending invocation, e.g. before firing an immediate,
 * non-debounced call of your own.
 */
export function useDebouncedCallback<Args extends unknown[]>(
	callback: (...args: Args) => void,
	delayMs: number,
): DebouncedCallback<Args> {
	const callbackRef = useRef(callback);
	const timeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(
		undefined,
	);

	useEffect(() => {
		callbackRef.current = callback;
	}, [callback]);

	const cancel = useCallback(() => {
		if (timeoutRef.current !== undefined) {
			clearTimeout(timeoutRef.current);
			timeoutRef.current = undefined;
		}
	}, []);

	// Cancel any pending call when the component using this hook unmounts.
	useEffect(() => cancel, [cancel]);

	const debounced = useCallback(
		(...args: Args) => {
			cancel();
			timeoutRef.current = setTimeout(() => {
				timeoutRef.current = undefined;
				callbackRef.current(...args);
			}, delayMs);
		},
		[cancel, delayMs],
	);

	return useMemo(
		() => Object.assign(debounced, { cancel }),
		[debounced, cancel],
	);
}
