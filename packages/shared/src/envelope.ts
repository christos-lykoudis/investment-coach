export type ApiEnvelope<T> = {
  data: T;
  error: null | { code: string; message: string; details?: unknown };
  meta: Record<string, unknown>;
};

export const okEnvelope = <T>(data: T, meta: Record<string, unknown> = {}): ApiEnvelope<T> => {
  return { data, error: null, meta };
};

export const errorEnvelope = (
  message: string,
  code: string,
  meta: Record<string, unknown> = {},
  details?: unknown
): ApiEnvelope<unknown> => {
  return {
    data: {},
    error: { code, message, details },
    meta
  };
};

