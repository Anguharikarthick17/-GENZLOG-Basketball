import React, { useRef } from 'react';
import { Upload } from 'lucide-react';
import type { AnimationState, UploadedFileItem } from '../types/uploader';
import { BasketballCourt3D } from './BasketballCourt3D';
import { UploadProgressItem } from './UploadProgressItem';

interface UploadDropzoneProps {
  state: AnimationState;
  activeItem: UploadedFileItem | null;
  uploadedItems?: UploadedFileItem[];
  isDragOver: boolean;
  onDrop: (e: React.DragEvent) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: (e: React.DragEvent) => void;
  onFileSelectClick: () => void;
  onAimStart?: () => void;
  onAimEnd?: () => void;
  onShotSuccess: () => void;
  onShotMiss: () => void;
  onRetryItem?: (id: string) => void;
  onRemoveItem?: (id: string) => void;
  controlledBallPos?: { x: number; y: number; z: number };
  controlledAimTarget?: { x: number; y: number; z: number };
  controlledTrajectory?: boolean;
  controlledNetSwish?: number;
}

export const UploadDropzone: React.FC<UploadDropzoneProps> = ({
  state,
  activeItem,
  isDragOver,
  onDrop,
  onDragOver,
  onDragLeave,
  onFileSelectClick,
  onAimStart,
  onAimEnd,
  onShotSuccess,
  onShotMiss,
  onRetryItem,
  onRemoveItem,
  controlledBallPos,
  controlledAimTarget,
  controlledTrajectory,
  controlledNetSwish,
}) => {
  const dropzoneRef = useRef<HTMLDivElement>(null);
  const hasActiveProgress =
    activeItem !== null &&
    (state === 'uploading' || state === 'success' || state === 'error');

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (state === 'idle') {
        onFileSelectClick();
      }
    }
  };

  const getMainInstructionText = () => {
    if (isDragOver) return 'RELEASE TO SHOOT';
    switch (state) {
      case 'idle':
        return 'SELECT A FILE TO START';
      case 'selected':
        return 'AIM YOUR SHOT';
      case 'aiming':
        return 'DRAG TO POSITION • RELEASE TO SHOOT';
      case 'shooting':
        return 'IN THE AIR...';
      case 'swish':
        return 'NICE SHOT! UPLOADING...';
      case 'missed':
        return 'MISSED — TRY AGAIN';
      case 'uploading':
        return 'UPLOADING FILE...';
      case 'success':
        return 'FILE UPLOADED SUCCESSFULLY';
      default:
        return 'SELECT A FILE TO START';
    }
  };

  const getSubInstructionText = () => {
    switch (state) {
      case 'idle':
        return 'Click the ball, court, or drop files here';
      case 'selected':
        return 'Drag ball anywhere on court to aim';
      case 'aiming':
        return 'Release pointer or click Shoot';
      case 'missed':
        return 'Re-aim and take another shot';
      default:
        return 'Aim & take the shot';
    }
  };

  return (
    <div
      ref={dropzoneRef}
      className={`upload-dropzone ${isDragOver ? 'drag-over' : ''} state-${state}`}
      onDrop={onDrop}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onClick={(e) => {
        const target = e.target as HTMLElement;
        if (
          target.closest('.action-icon-btn') ||
          target.closest('.upload-progress-row') ||
          target.closest('.shoot-action-btn')
        ) {
          return;
        }
        if (state === 'idle') {
          onFileSelectClick();
        }
      }}
      onKeyDown={handleKeyDown}
      role="region"
      aria-label="3D Basketball File Upload Dropzone"
      tabIndex={0}
    >
      {/* 1. Progress Bar Row (Shown when uploading/done/error) */}
      {hasActiveProgress && activeItem && (
        <div className="dropzone-progress-container">
          <UploadProgressItem
            item={activeItem}
            onRetry={onRetryItem}
            onRemove={onRemoveItem}
          />
        </div>
      )}

      {/* 2. Top Drop Header (Dynamic Instructions) */}
      {!hasActiveProgress && (
        <div
          className="dropzone-instructions"
          onClick={(e) => {
            if (state === 'idle') {
              e.stopPropagation();
              onFileSelectClick();
            }
          }}
        >
          <div className="dropzone-upload-icon-wrapper" aria-hidden="true">
            <Upload size={17} className="dropzone-upload-icon" strokeWidth={2} />
          </div>
          <span className="dropzone-main-text">{getMainInstructionText()}</span>
          <span className="dropzone-sub-text">{getSubInstructionText()}</span>
        </div>
      )}

      {/* 3. Three.js Realistic 3D Basketball Court Arena */}
      <div className="dropzone-arena">
        <BasketballCourt3D
          state={state}
          activeItem={activeItem}
          onFileSelectClick={onFileSelectClick}
          onAimStart={onAimStart}
          onAimEnd={onAimEnd}
          onShotSuccess={onShotSuccess}
          onShotMiss={onShotMiss}
          isInteractive={state !== 'uploading' && state !== 'shooting'}
          controlledBallPos={controlledBallPos}
          controlledAimTarget={controlledAimTarget}
          controlledTrajectory={controlledTrajectory}
          controlledNetSwish={controlledNetSwish}
        />
      </div>

      {/* 4. Bottom Court Ambient Border */}
      <div className="dropzone-bottom-bar" />
    </div>
  );
};
