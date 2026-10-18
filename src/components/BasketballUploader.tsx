import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Volume2, VolumeX, Play, Upload } from 'lucide-react';
import type {
  AnimationState,
  BasketballUploaderProps,
  UploadedFileItem,
} from '../types/uploader';
import { formatFileSize, getFileCategory } from '../utils/formatters';
import { soundManager } from '../utils/soundEffects';
import { defaultMockAdapter } from '../utils/mockUploadAdapter';
import { UploadDropzone } from './UploadDropzone';
import { UploadStatusMessage } from './UploadStatusMessage';
import './BasketballUploader.css';

export const BasketballUploader: React.FC<BasketballUploaderProps> = ({
  multiple = true,
  accept = '*',
  maxFileSize = 50 * 1024 * 1024, // 50 MB
  maxFiles = 10,
  initialCount = 2,
  soundEnabled = true,
  uploadAdapter = defaultMockAdapter,
  onFilesSelected,
  onUploadComplete,
  onUploadError,
  className = '',
}) => {
  // State Machine
  const [animState, setAnimState] = useState<AnimationState>('idle');
  const [isDragOver, setIsDragOver] = useState<boolean>(false);
  const [uploadedCount, setUploadedCount] = useState<number>(initialCount);
  const [isCountBumping, setIsCountBumping] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(!soundEnabled);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // File queue & active file
  const [fileQueue, setFileQueue] = useState<File[]>([]);
  const [activeItem, setActiveItem] = useState<UploadedFileItem | null>(null);
  const [uploadedItems, setUploadedItems] = useState<UploadedFileItem[]>([]);

  // Refs
  const fileInputRef = useRef<HTMLInputElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const stateTimeoutRef = useRef<number | null>(null);
  const lastPickerOpenRef = useRef<number>(0);

  useEffect(() => {
    soundManager.setEnabled(!isMuted);
  }, [isMuted]);

  useEffect(() => {
    return () => {
      if (stateTimeoutRef.current) clearTimeout(stateTimeoutRef.current);
      if (abortControllerRef.current) abortControllerRef.current.abort();
    };
  }, []);

  const scheduleStep = (fn: () => void, ms: number) => {
    if (stateTimeoutRef.current) clearTimeout(stateTimeoutRef.current);
    stateTimeoutRef.current = window.setTimeout(fn, ms);
  };

  /**
   * Safe, debounced native file picker trigger
   */
  const handleOpenPicker = useCallback(() => {
    if (animState === 'shooting' || animState === 'uploading') return;

    const now = Date.now();
    if (now - lastPickerOpenRef.current < 450) return;
    lastPickerOpenRef.current = now;

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      fileInputRef.current.click();
    }
  }, [animState]);

  /**
   * Called when a valid file is picked or dropped
   */
  const handleSelectFile = useCallback(
    (file: File) => {
      const item: UploadedFileItem = {
        id: `file_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        file,
        name: file.name,
        size: file.size,
        formattedSize: formatFileSize(file.size),
        category: getFileCategory(file),
        progress: 0,
        status: 'pending',
      };

      setActiveItem(item);
      setAnimState('selected');
    },
    []
  );

  /**
   * Take the shot (launches basketball flight from current aim position)
   */
  const triggerShot = useCallback(() => {
    if (!activeItem) {
      handleOpenPicker();
      return;
    }

    if (animState === 'shooting' || animState === 'uploading') {
      return;
    }

    setAnimState('shooting');
  }, [activeItem, animState, handleOpenPicker]);

  /**
   * Called when a shot misses the basket
   */
  const handleShotMiss = useCallback(() => {
    setAnimState('missed');
    // Allow user to aim and try again without losing the selected file
    scheduleStep(() => {
      setAnimState('selected');
    }, 1800);
  }, []);

  /**
   * Called by 3D canvas when the ball swishes cleanly through the hoop
   */
  const handleShotSuccess = useCallback(() => {
    if (!activeItem) return;

    setAnimState('swish');

    // Transition smoothly from swish reaction to uploading state
    scheduleStep(() => {
      setAnimState('uploading');

      const item = activeItem;
      item.status = 'uploading';
      setActiveItem({ ...item });

      const controller = new AbortController();
      abortControllerRef.current = controller;
      item.cancel = () => controller.abort();

      uploadAdapter
        .upload(
          item.file,
          (progress: number) => {
            setActiveItem((prev) => (prev ? { ...prev, progress } : null));
          },
          controller.signal
        )
        .then(() => {
          // Upload Succeeded
          soundManager.playSuccessChime();
          const completedItem: UploadedFileItem = {
            ...item,
            progress: 100,
            status: 'completed',
            uploadedAt: new Date(),
          };
          setActiveItem(completedItem);
          setAnimState('success');

          setUploadedCount((prev) => prev + 1);
          setIsCountBumping(true);
          setTimeout(() => setIsCountBumping(false), 500);

          setUploadedItems((prev) => [completedItem, ...prev]);
          onUploadComplete?.(completedItem);

          // Reset to State A (idle) for the next file
          scheduleStep(() => {
            setAnimState('idle');
            setActiveItem(null);
          }, 3200);
        })
        .catch((err) => {
          if (err.name === 'AbortError') return;
          soundManager.playError();
          const errorItem: UploadedFileItem = {
            ...item,
            status: 'error',
            errorMessage: err.message || 'Upload failed',
          };
          setActiveItem(errorItem);
          setAnimState('error');
          onUploadError?.(errorItem, err.message || 'Upload failed');
        });
    }, 450);
  }, [activeItem, uploadAdapter, onUploadComplete, onUploadError]);

  // Queue runner for multiple files
  useEffect(() => {
    if (fileQueue.length > 0 && animState === 'idle') {
      const next = fileQueue[0];
      setFileQueue((prev) => prev.slice(1));
      handleSelectFile(next);
    }
  }, [fileQueue, animState, handleSelectFile]);

  // Validate incoming files
  const handleIncomingFiles = (files: FileList | File[]) => {
    const fileList = Array.from(files);
    if (fileList.length === 0) return;

    setErrorMessage(null);

    if (uploadedItems.length + fileList.length > maxFiles) {
      setErrorMessage(`Maximum limit of ${maxFiles} files exceeded.`);
      soundManager.playError();
      return;
    }

    const validFiles: File[] = [];
    for (const file of fileList) {
      if (file.size > maxFileSize) {
        setErrorMessage(
          `"${file.name}" exceeds the maximum allowed size of ${formatFileSize(
            maxFileSize
          )}.`
        );
        soundManager.playError();
        return;
      }

      const isDuplicate = uploadedItems.some(
        (item) => item.name === file.name && item.size === file.size
      );
      if (isDuplicate) {
        setErrorMessage(`"${file.name}" has already been uploaded.`);
        soundManager.playError();
        return;
      }

      validFiles.push(file);
    }

    if (validFiles.length > 0) {
      onFilesSelected?.(validFiles);
      if (animState === 'idle') {
        handleSelectFile(validFiles[0]);
        if (validFiles.length > 1) {
          setFileQueue((prev) => [...prev, ...validFiles.slice(1)]);
        }
      } else {
        setFileQueue((prev) => [...prev, ...validFiles]);
      }
    }
  };

  // Drag and drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.currentTarget.contains(e.relatedTarget as Node)) return;
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleIncomingFiles(e.dataTransfer.files);
    }
  };

  const handleRetryItem = (id: string) => {
    if (activeItem && activeItem.id === id) {
      triggerShot();
    }
  };

  const handleRemoveItem = (id: string) => {
    if (activeItem && activeItem.id === id) {
      if (activeItem.cancel) activeItem.cancel();
      setActiveItem(null);
      setAnimState('idle');
    }
    setUploadedItems((prev) => prev.filter((item) => item.id !== id));
  };

  // Footer Dynamic Instruction Text
  const getFooterInstruction = () => {
    switch (animState) {
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
      case 'error':
        return 'UPLOAD FAILED — RETRY SHOT';
      default:
        return 'SELECT A FILE TO START';
    }
  };

  return (
    <div className={`basketball-uploader-card ${className}`}>
      {/* Hidden Accessible Native File Input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple={multiple}
        accept={accept}
        onChange={(e) => {
          if (e.target.files && e.target.files.length > 0) {
            handleIncomingFiles(e.target.files);
          }
        }}
        className="hidden-file-input"
        tabIndex={-1}
        aria-hidden="true"
      />

      {/* 1. Official GENZLOG Top Branding & Action Bar */}
      <div className="uploader-top-bar">
        {/* Official GENZLOG Logo (Preserved original asset) */}
        <div className="branding-logo-wrapper">
          <img
            src="/genzlog-logo-black.png"
            alt="GENZLOG Official Logo"
            className="genzlog-official-logo"
            width={124}
            height={52}
          />
        </div>

        <div className="header-actions-group">
          {/* Visible "Choose file" action in Idle State */}
          {animState === 'idle' && (
            <button
              type="button"
              className="choose-file-btn"
              onClick={handleOpenPicker}
              title="Select a file from your computer"
            >
              <Upload size={13} strokeWidth={2.2} /> Choose file
            </button>
          )}

          {/* Sound Toggle Button */}
          <button
            type="button"
            className="sound-toggle-btn"
            onClick={() => setIsMuted(!isMuted)}
            title={isMuted ? 'Enable sound effects' : 'Mute sound effects'}
            aria-label={isMuted ? 'Enable sound effects' : 'Mute sound effects'}
          >
            {isMuted ? (
              <VolumeX size={16} className="sound-icon is-muted" />
            ) : (
              <Volume2 size={16} className="sound-icon is-active" />
            )}
          </button>

          {/* Uploaded Count Pill Badge */}
          <div
            className={`uploaded-count-badge ${isCountBumping ? 'is-bumping' : ''}`}
            aria-live="polite"
          >
            Uploaded {uploadedCount}
          </div>
        </div>
      </div>

      {/* 2. Heading Section */}
      <div className="uploader-header">
        <h1 className="uploader-heading">Upload files</h1>
        <p className="uploader-subheading">Drag and drop, or take the shot.</p>
      </div>

      {/* 3. Validation Status Message Banner */}
      <UploadStatusMessage
        message={errorMessage}
        onDismiss={() => setErrorMessage(null)}
      />

      {/* 4. Selected File Ready Bar (when file is loaded before shooting) */}
      {activeItem && (animState === 'selected' || animState === 'aiming' || animState === 'missed') && (
        <div className="selected-file-ready-bar">
          <div className="selected-file-info">
            <span className={`file-tag tag-${activeItem.category.toLowerCase()}`}>
              {activeItem.category}
            </span>
            <span className="selected-file-name" title={activeItem.name}>
              {activeItem.name}
            </span>
            <span className="selected-file-size">({activeItem.formattedSize})</span>
          </div>

          <button
            type="button"
            className="shoot-action-btn"
            onClick={triggerShot}
            title="Shoot basketball into the hoop"
          >
            <Play size={13} fill="currentColor" /> Shoot
          </button>
        </div>
      )}

      {/* 5. Main Dashed Dropzone & 3D Basketball Arena */}
      <UploadDropzone
        state={animState}
        activeItem={activeItem}
        uploadedItems={uploadedItems}
        isDragOver={isDragOver}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onFileSelectClick={handleOpenPicker}
        onAimStart={() => setAnimState('aiming')}
        onAimEnd={() => {
          if (animState === 'aiming') setAnimState('selected');
        }}
        onShotSuccess={handleShotSuccess}
        onShotMiss={handleShotMiss}
        onRetryItem={handleRetryItem}
        onRemoveItem={handleRemoveItem}
      />

      {/* 6. Card Bottom Footer Instruction */}
      <div className="uploader-footer">
        <span className="footer-instruction-text">{getFooterInstruction()}</span>
      </div>
    </div>
  );
};
