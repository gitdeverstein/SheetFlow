import { queryClient } from '../hooks/queryClient.js';

/** Standard toast function signature used across all store slices. */
export type ToastFn = (
  text: string,
  type?: 'success' | 'info' | 'error',
  undoAction?: () => void,
) => void;

export interface ApiActionOptions<T> {
  /** Query keys to invalidate on success. */
  invalidateKeys?: readonly (readonly unknown[])[];
  /** Success toast message (omit to skip success toast). */
  successMessage?: string;
  /** Success toast color variant. */
  successType?: 'success' | 'info';
  /** Fallback error message used when the caught value is not an Error. */
  errorMessage: string;
  /** Extra side effect invoked with the result after a successful API call. */
  onSuccess?: (result: T, addToast: ToastFn) => void;
}

/**
 * Wraps a common API-call pattern used across Zustand slices:
 *   1. Call the async action.
 *   2. On success → invalidate query keys, run onSuccess, optionally show a toast.
 *   3. On error   → show an error toast with the Error message or a fallback.
 *
 * Returns `undefined` when the action fails.
 */
export async function apiAction<T>(
  apiCall: () => Promise<T>,
  addToast: ToastFn,
  options: ApiActionOptions<T>,
): Promise<T | undefined> {
  try {
    const result = await apiCall();

    if (options.invalidateKeys) {
      for (const key of options.invalidateKeys) {
        queryClient.invalidateQueries({ queryKey: key });
      }
    }

    if (options.onSuccess) {
      options.onSuccess(result, addToast);
    }

    if (options.successMessage) {
      addToast(options.successMessage, options.successType ?? 'success');
    }

    return result;
  } catch (err: unknown) {
    addToast(
      err instanceof Error ? err.message : options.errorMessage,
      'error',
    );
    return undefined;
  }
}
