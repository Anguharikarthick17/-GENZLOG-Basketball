import React from 'react';
import { Check, AlertCircle, RotateCcw, X } from 'lucide-react';
import type { UploadedFileItem } from '../types/uploader';

interface UploadProgressItemProps {
  item: UploadedFileItem;
  onRetry?: (id: string) => void;
  onRemove?: (id: string) => void;
}

export const UploadProgressItem: React.FC<UploadProgressItemProps> = ({
  item,
  onRetry,
  onRemove,
}) => {
  const isCompleted = item.status === 'completed';
  const isError = item.status === 'error';
  const isUploading = item.status === 'uploading' || item.status === 'shooting';

  return (
    <div
      className={`upload-progress-row ${isCompleted ? 'is-completed' : ''} ${
        isError ? 'is-error' : ''
      }`}
      role="status"
      aria-label={`File ${item.name}, ${item.status}`}
    >
      {/* Top Header: Category Tag, Filename, Percentage or Done */}
      <div className="progress-row-header">
        <div className="progress-file-info">
          <span className={`file-tag tag-${item.category.toLowerCase()}`}>
            {item.category}
          </span>
          <span className="file-name" title={item.name}>
            {item.name}
          </span>
        </div>

        <div className="progress-status-indicator">
          {isCompleted ? (
            <span className="status-done-text">Done</span>
          ) : isError ? (
            <span className="status-error-text">Failed</span>
          ) : (
            <span className="status-percent-text">{item.progress}%</span>
          )}
        </div>
      </div>

      {/* Progress Track & Fill Bar */}
      <div
        className="progress-bar-track"
        role="progressbar"
        aria-valuenow={item.progress}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className={`progress-bar-fill ${isCompleted ? 'fill-completed' : ''} ${
            isError ? 'fill-error' : ''
          }`}
          style={{ width: `${item.progress}%` }}
        />
      </div>

      {/* Bottom Subtext: Status message on left, file size on right */}
      <div className="progress-row-footer">
        <div className="progress-status-message">
          {isCompleted ? (
            <div className="status-msg-completed">
              <Check className="status-icon-check" size={14} strokeWidth={2.5} />
              <span>File uploaded successfully</span>
            </div>
          ) : isError ? (
            <div className="status-msg-error">
              <AlertCircle size={14} strokeWidth={2.2} />
              <span>{item.errorMessage || 'Upload failed'}</span>
            </div>
          ) : (
            <span className="status-msg-uploading">
              {isUploading ? 'Uploading file...' : 'Preparing...'}
            </span>
          )}
        </div>

        <div className="progress-meta-actions">
          <span className="file-size-text">{item.formattedSize}</span>

          {isError && onRetry && (
            <button
              type="button"
              className="action-icon-btn retry-btn"
              onClick={() => onRetry(item.id)}
              title="Retry upload"
              aria-label={`Retry uploading ${item.name}`}
            >
              <RotateCcw size={13} />
            </button>
          )}

          {onRemove && (
            <button
              type="button"
              className="action-icon-btn remove-btn"
              onClick={() => onRemove(item.id)}
              title="Remove file"
              aria-label={`Remove ${item.name}`}
            >
              <X size={13} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
