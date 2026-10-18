import React from 'react';
import { AlertCircle, X } from 'lucide-react';

interface UploadStatusMessageProps {
  message: string | null;
  onDismiss: () => void;
  type?: 'error' | 'warning' | 'info';
}

export const UploadStatusMessage: React.FC<UploadStatusMessageProps> = ({
  message,
  onDismiss,
  type = 'error',
}) => {
  if (!message) return null;

  return (
    <div
      className={`upload-status-banner banner-${type}`}
      role="alert"
      aria-live="assertive"
    >
      <div className="banner-content">
        <AlertCircle size={16} className="banner-icon" />
        <span className="banner-text">{message}</span>
      </div>
      <button
        type="button"
        className="banner-close-btn"
        onClick={onDismiss}
        aria-label="Dismiss message"
      >
        <X size={14} />
      </button>
    </div>
  );
};
