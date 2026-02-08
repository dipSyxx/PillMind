/**
 * Retry utility with exponential backoff
 */

export interface RetryOptions {
  maxAttempts?: number
  initialDelayMs?: number
  maxDelayMs?: number
  backoffMultiplier?: number
  retryableErrors?: string[]
}

const DEFAULT_OPTIONS: Required<RetryOptions> = {
  maxAttempts: 3,
  initialDelayMs: 1000,
  maxDelayMs: 10000,
  backoffMultiplier: 2,
  retryableErrors: ['P2002', 'P2025', 'TIMEOUT', 'ECONNRESET', 'ETIMEDOUT'],
}

/**
 * Retry a function with exponential backoff
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const opts = { ...DEFAULT_OPTIONS, ...options }
  let lastError: Error | unknown
  let delay = opts.initialDelayMs

  for (let attempt = 1; attempt <= opts.maxAttempts; attempt++) {
    try {
      return await fn()
    } catch (error: any) {
      lastError = error

      // Check if error is retryable
      const errorCode = error?.code || error?.name || ''
      const isRetryable = opts.retryableErrors.some((code) =>
        errorCode.toString().includes(code)
      )

      // Don't retry if it's the last attempt or error is not retryable
      if (attempt === opts.maxAttempts || !isRetryable) {
        throw error
      }

      // Wait before retrying with exponential backoff
      await new Promise((resolve) => setTimeout(resolve, delay))
      delay = Math.min(delay * opts.backoffMultiplier, opts.maxDelayMs)
    }
  }

  throw lastError
}
