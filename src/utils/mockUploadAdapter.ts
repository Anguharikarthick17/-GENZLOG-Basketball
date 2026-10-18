import type { UploadAdapter, UploadAdapterProgressCallback } from '../types/uploader';

export interface MockUploadOptions {
  /** Total simulated duration in ms (default: 2000) */
  durationMs?: number;
  /** Should this simulated upload fail? (default: false) */
  shouldFail?: boolean;
  /** Failure error message */
  failureMessage?: string;
}

/**
 * A simulated upload adapter for standalone demos and testing.
 * Provides realistic network progress pacing and abort handling.
 * Easily swapped with a production Axios/Fetch implementation.
 */
export class MockUploadAdapter implements UploadAdapter {
  private options: MockUploadOptions;

  constructor(options: MockUploadOptions = {}) {
    this.options = {
      durationMs: 2200,
      shouldFail: false,
      failureMessage: 'Simulated network connection error',
      ...options,
    };
  }

  public upload(
    file: File,
    onProgress: UploadAdapterProgressCallback,
    signal?: AbortSignal
  ): Promise<{ url?: string; id?: string }> {
    return new Promise((resolve, reject) => {
      if (signal?.aborted) {
        return reject(new DOMException('Upload aborted by user', 'AbortError'));
      }

      const totalDuration = this.options.durationMs || 2200;
      const intervalMs = 60;
      let currentProgress = 0;
      const startTime = Date.now();

      const timer = setInterval(() => {
        if (signal?.aborted) {
          clearInterval(timer);
          reject(new DOMException('Upload aborted by user', 'AbortError'));
          return;
        }

        const elapsed = Date.now() - startTime;
        // Non-linear easing (fast start, gradual finish)
        const progressFactor = Math.min(1, elapsed / totalDuration);
        currentProgress = Math.round(Math.min(99, progressFactor * 100));

        onProgress(currentProgress);

        if (elapsed >= totalDuration) {
          clearInterval(timer);

          if (this.options.shouldFail) {
            reject(new Error(this.options.failureMessage || 'Upload failed'));
            return;
          }

          onProgress(100);
          resolve({
            id: `genzlog_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
            url: URL.createObjectURL(file),
          });
        }
      }, intervalMs);

      signal?.addEventListener('abort', () => {
        clearInterval(timer);
        reject(new DOMException('Upload aborted by user', 'AbortError'));
      });
    });
  }
}

export const defaultMockAdapter = new MockUploadAdapter();
