export type AppErrorCode =
  | "HELIUS_RATE_LIMIT"
  | "HELIUS_UNAVAILABLE"
  | "RPC_FALLBACK_FAILED"
  | "INVALID_WALLET_ADDRESS"
  | "COLLECTION_NOT_FOUND"
  | "PRICE_FEED_UNAVAILABLE"
  | "MAGICEDEN_API_ERROR"
  | "NETWORK_ERROR"
  | "VALIDATION_ERROR"
  | "DB_ERROR"
  | "VERIFICATION_FAILED";

export interface AppError {
  readonly code: AppErrorCode;
  readonly message: string;
  readonly details?: unknown;
  readonly retryable: boolean;
}

export type ApiResult<T> =
  | { readonly success: true; readonly data: T }
  | { readonly success: false; readonly error: AppError };

export interface PaginatedResult<T> {
  readonly items: readonly T[];
  readonly total: number;
  readonly page: number;
  readonly pageSize: number;
  readonly hasMore: boolean;
  readonly cursor?: string;
}

/**
 * Creates a successful API result
 */
export const ok = <T>(data: T): ApiResult<T> => ({
  success: true,
  data,
});

/**
 * Creates a failed API result
 */
export const err = <T>(
  code: AppErrorCode,
  message: string,
  retryable = false,
  details?: unknown
): ApiResult<T> => ({
  success: false,
  error: { code, message, retryable, details },
});
