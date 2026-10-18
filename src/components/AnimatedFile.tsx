import React from 'react';
import type { AnimationState, FileTypeCategory } from '../types/uploader';

interface AnimatedFileProps {
  state: AnimationState;
  category?: FileTypeCategory;
  fileName?: string;
  onClick?: (e: React.MouseEvent) => void;
  onDragStart?: (e: React.DragEvent) => void;
}

export const AnimatedFile: React.FC<AnimatedFileProps> = ({
  state,
  category = 'PDF',
  fileName,
  onClick,
}) => {
  const isShooting = state === 'shooting';
  const isSwishing = state === 'swish';
  const isSelected = state === 'selected';
  const isHidden = state === 'uploading' || state === 'success';

  return (
    <div
      className={`animated-file-wrapper state-${state} ${isShooting ? 'is-shooting' : ''} ${
        isSwishing ? 'is-swishing' : ''
      } ${isSelected ? 'is-selected' : ''} ${isHidden ? 'is-hidden' : ''}`}
      onClick={onClick}
      role="button"
      tabIndex={0}
      title={fileName || 'Click or drag to take the shot'}
      aria-label={fileName ? `File ${fileName}, take shot` : 'File ready to shoot'}
    >
      <div className="file-document-card">
        {/* Top-Right Dog-ear Fold */}
        <div className="file-fold-corner" />

        {/* Content Lines Skeleton */}
        <div className="file-skeleton-lines">
          <div className="skeleton-line line-wide" />
          <div className="skeleton-line line-medium" />
          <div className="skeleton-line line-short" />
        </div>

        {/* Category Pill Tag (PDF, IMG, DOC, etc.) */}
        <div className={`file-type-pill pill-${category.toLowerCase()}`}>
          {category}
        </div>

        {/* Hand pointer cursor indicator (as in reference video) */}
        <div className="file-hand-cursor" aria-hidden="true">
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="black"
            stroke="white"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M18 11V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v0" />
            <path d="M14 10V4a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v2" />
            <path d="M10 10.5V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v8" />
            <path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15" />
          </svg>
        </div>
      </div>
    </div>
  );
};
