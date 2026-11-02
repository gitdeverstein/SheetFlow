import { useEffect, useRef, type RefObject } from 'react';

/**
 * Fires `onClose` when the user clicks outside of the referenced element.
 * Conditionally attaches the listener only when `active` is `true`.
 *
 * Uses a ref to hold `onClose` so that inline callbacks don't cause
 * the event listener to be re-registered on every render.
 *
 * @example
 * ```tsx
 * const ref = useOutsideClick<HTMLDivElement>(() => setOpen(false), open);
 * return <div ref={ref}>...</div>;
 * ```
 */
export function useOutsideClick<T extends HTMLElement>(
  onClose: () => void,
  active = true,
): RefObject<T | null> {
  const ref = useRef<T | null>(null);
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  });

  useEffect(() => {
    if (!active) return;

    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onCloseRef.current();
      }
    };

    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [active]);

  return ref;
}
