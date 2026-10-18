export type AnimationState =
  | 'idle'
  | 'drag_over'
  | 'selected'
  | 'aiming'
  | 'shooting'
  | 'swish'
  | 'missed'
  | 'uploading'
  | 'success'
  | 'error';

export type FileTypeCategory = 'PDF' | 'IMG' | 'DOC' | 'ZIP' | 'CODE' | 'FILE';

export interface UploadedFileItem {
  id: string;
  file: File;
  name: string;
  size: number;
  formattedSize: string;
  category: FileTypeCategory;
  progress: number;
  status: 'pending' | 'shooting' | 'uploading' | 'completed' | 'error';
  errorMessage?: string;
  uploadedAt?: Date;
  cancel?: () => void;
}

export interface UploadAdapterProgressCallback {
  (percentage: number): void;
}

export interface UploadAdapter {
  upload: (
    file: File,
    onProgress: UploadAdapterProgressCallback,
    signal?: AbortSignal
  ) => Promise<{ url?: string; id?: string }>;
}

export interface BasketballUploaderProps {
  /** Allow selection of multiple files (default: true) */
  multiple?: boolean;
  /** Accepted file formats (default: '*') */
  accept?: string;
  /** Maximum file size in bytes (default: 50MB) */
  maxFileSize?: number;
  /** Maximum number of files allowed (default: 10) */
  maxFiles?: number;
  /** Initial count to display on the badge (default: 2 to match reference) */
  initialCount?: number;
  /** Initial sound effect state (default: true) */
  soundEnabled?: boolean;
  /** Upload adapter instance (uses mock adapter by default) */
  uploadAdapter?: UploadAdapter;
  /** Callback fired when files are chosen or dropped */
  onFilesSelected?: (files: File[]) => void;
  /** Callback fired when an upload completes successfully */
  onUploadComplete?: (item: UploadedFileItem) => void;
  /** Callback fired when an upload encounters an error */
  onUploadError?: (item: UploadedFileItem, error: string) => void;
  /** Additional CSS class name */
  className?: string;
}

export interface TrajectoryPoint {
  x: number;
  y: number;
}
