import { useEffect, useRef } from 'react';

/**
 * Lets a tab screen return to its landing view when its tab is tapped while
 * already active. The nav bar fires `emitTabReset(route)`; the screen for
 * that route runs its reset callback.
 */

type Listener = () => void;
const listeners: Record<string, Set<Listener>> = {};

export function emitTabReset(route: string) {
  listeners[route]?.forEach((listener) => listener());
}

export function useTabReset(route: string, onReset: () => void) {
  const ref = useRef(onReset);

  useEffect(() => {
    ref.current = onReset;
  });

  useEffect(() => {
    const cb = () => ref.current();
    (listeners[route] ??= new Set()).add(cb);
    return () => {
      listeners[route]?.delete(cb);
    };
  }, [route]);
}
