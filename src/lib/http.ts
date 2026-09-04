export type FetchState<T> = {
  data: T | null;
  loading: boolean;
  error: string | null;
};

export const INITIAL_FETCH_STATE = {
  data: null,
  loading: true,
  error: null,
} as const;

export async function parseJson<T>(response: Response): Promise<T> {
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }
  return (await response.json()) as T;
}
