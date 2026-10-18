import React, { useState, useEffect, useRef } from 'react';
import { Volume2, Upload, Play, CheckCircle2, FileText, Folder, HardDrive, ArrowRight, Code } from 'lucide-react';
import { BasketballCourt3D } from './BasketballCourt3D';
import type { AnimationState, UploadedFileItem } from '../types/uploader';
import './BasketballUploader.css';

interface CinematicAdPlayerProps {
  initialTime?: number;
  autoPlay?: boolean;
}

export const CinematicAdPlayer: React.FC<CinematicAdPlayerProps> = ({
  initialTime = 0,
  autoPlay = false,
}) => {
  const queryTime = typeof window !== 'undefined'
    ? parseFloat(new URLSearchParams(window.location.search).get('t') || String(initialTime))
    : initialTime;

  const [time, setTime] = useState<number>(queryTime);
  const [isPlaying, setIsPlaying] = useState<boolean>(autoPlay);
  const requestRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number | null>(null);

  // Global seek hook for deterministic frame capture
  useEffect(() => {
    (window as unknown as { __adSeek: (t: number) => void }).__adSeek = (targetTime: number) => {
      setTime(Math.max(0, Math.min(20, targetTime)));
    };
  }, []);

  // Animation frame loop if playing live
  useEffect(() => {
    if (!isPlaying) return;

    const animate = (now: number) => {
      if (lastTimeRef.current !== null) {
        const delta = (now - lastTimeRef.current) / 1000;
        setTime((prev) => {
          const next = prev + delta;
          if (next >= 20) {
            setIsPlaying(false);
            return 20;
          }
          return next;
        });
      }
      lastTimeRef.current = now;
      requestRef.current = requestAnimationFrame(animate);
    };

    lastTimeRef.current = performance.now();
    requestRef.current = requestAnimationFrame(animate);

    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
      lastTimeRef.current = null;
    };
  }, [isPlaying]);

  // =========================================================================
  // REVISED FAST-PACED STORYBOARD TIMELINE (0.0s to 20.0s)
  // =========================================================================

  // Scene Determination:
  // Scene 1: 0.0 - 3.0s (Opening: FILE UPLOAD. REIMAGINED.)
  // Scene 2: 3.0 - 6.0s (File Selection: CHOOSE YOUR FILE)
  // Scene 3: 6.0 - 10.0s (Aiming: AIM YOUR SHOT)
  // Scene 4: 10.0 - 14.0s (Basketball Shot: MAKE THE SHOT)
  // Scene 5: 14.0 - 16.5s (Upload Complete: UPLOADED SUCCESSFULLY)
  // Scene 6: 16.5 - 20.0s (Promotional End Card: GET THIS SOURCE CODE FOR FREE)
  const isEndCard = time >= 16.5;

  // Active File Data
  const sampleFile: UploadedFileItem = {
    id: 'file_sample_q4',
    file: new File(['pitch deck presentation binary stream'], 'pitch_deck_q4.pdf', { type: 'application/pdf' }),
    name: 'pitch_deck_q4.pdf',
    size: 1.8 * 1024 * 1024,
    formattedSize: '1.8 MB',
    category: 'PDF',
    progress: Math.min(100, Math.max(0, Math.round(((time - 14.0) / 1.7) * 100))),
    status: time >= 15.7 ? 'completed' : time >= 14.0 ? 'uploading' : 'pending',
  };

  // Uploader Animation State derived from Timeline
  let animState: AnimationState = 'idle';
  if (time >= 15.7) animState = 'success';
  else if (time >= 14.0) animState = 'uploading';
  else if (time >= 11.2) animState = 'swish';
  else if (time >= 10.0) animState = 'shooting';
  else if (time >= 6.2) animState = 'aiming';
  else if (time >= 4.8) animState = 'selected';
  else animState = 'idle';

  // 3D Ball Position Calculation along Timeline
  let ballPos = { x: -1.1, y: 0.36, z: 1.8 };
  let aimTarget = { x: 0, y: 1.71, z: -0.52 };
  let trajectoryVisible = false;
  let netSwishProgress = 0;

  if (time < 4.8) {
    // Idle position
    ballPos = { x: -1.1, y: 0.36, z: 1.8 };
    trajectoryVisible = false;
  } else if (time >= 4.8 && time < 6.2) {
    // Selected position with idle bounce
    ballPos = { x: -1.1, y: 0.52 + Math.sin(time * 6) * 0.04, z: 1.8 };
    trajectoryVisible = true;
  } else if (time >= 6.2 && time < 10.0) {
    // Scene 3: Aiming & Dragging across court
    trajectoryVisible = true;
    if (time < 7.5) {
      // Move from (-1.1, 1.8) to Left Wing (-1.15, 2.1)
      const p = (time - 6.2) / 1.3;
      const smoothP = 0.5 - 0.5 * Math.cos(p * Math.PI);
      ballPos = {
        x: -1.1 + smoothP * (-1.15 - -1.1),
        y: 0.36,
        z: 1.8 + smoothP * (2.1 - 1.8),
      };
    } else if (time < 8.7) {
      // Move from Left Wing (-1.15, 2.1) to Top of Key (0.0, 2.6)
      const p = (time - 7.5) / 1.2;
      const smoothP = 0.5 - 0.5 * Math.cos(p * Math.PI);
      ballPos = {
        x: -1.15 + smoothP * (0.0 - -1.15),
        y: 0.36,
        z: 2.1 + smoothP * (2.6 - 2.1),
      };
    } else {
      // Move from Top of Key (0.0, 2.6) to Right Mid-range (0.85, 1.75)
      const p = (time - 8.7) / 1.3;
      const smoothP = 0.5 - 0.5 * Math.cos(p * Math.PI);
      ballPos = {
        x: 0.0 + smoothP * (0.85 - 0.0),
        y: 0.36,
        z: 2.6 + smoothP * (1.75 - 2.6),
      };
    }
  } else if (time >= 10.0 && time < 11.2) {
    // Scene 4: Flight toward hoop (Parabolic Bezier)
    const tFlight = (time - 10.0) / 1.2;
    trajectoryVisible = false;

    const startX = 0.85;
    const startY = 0.36;
    const startZ = 1.75;

    const targetX = 0;
    const targetY = 1.71;
    const targetZ = -0.52;

    const dist = Math.hypot(targetX - startX, targetZ - startZ);
    const apexY = Math.max(2.85, 1.85 + dist * 0.42);

    const controlX = (startX + targetX) / 2;
    const controlZ = (startZ + targetZ) / 2;
    const controlY = 2 * apexY - 0.5 * (startY + targetY);

    const t = tFlight;
    ballPos = {
      x: (1 - t) * (1 - t) * startX + 2 * (1 - t) * t * controlX + t * t * targetX,
      y: (1 - t) * (1 - t) * startY + 2 * (1 - t) * t * controlY + t * t * targetY,
      z: (1 - t) * (1 - t) * startZ + 2 * (1 - t) * t * controlZ + t * t * targetZ,
    };
  } else if (time >= 11.2 && time < 12.0) {
    // Ball drops through net
    const tDrop = (time - 11.2) / 0.8;
    ballPos = {
      x: 0,
      y: 1.71 - tDrop * (1.71 - 0.36),
      z: -0.52 + tDrop * 0.16,
    };
    netSwishProgress = (time - 11.2);
  } else {
    // Ball at rest on floor after basket
    ballPos = { x: 0, y: 0.36, z: -0.36 };
    netSwishProgress = 0;
  }

  // Upload progress calculation
  const uploadProgress = Math.min(100, Math.max(0, Math.round(((time - 14.0) / 1.7) * 100)));
  const isUploadedComplete = time >= 15.7;
  const uploadCount = isUploadedComplete ? 3 : 2;

  // Pointer Cursor Position along Timeline
  let showCursor = false;
  let cursorX = 540;
  let cursorY = 960;
  let cursorClicked = false;

  if (time >= 3.0 && time < 4.9) {
    // Moving to Choose File button and clicking
    showCursor = true;
    if (time < 3.5) {
      const p = (time - 3.0) / 0.5;
      cursorX = 640 + p * 150;
      cursorY = 500 - p * 105;
    } else if (time < 3.7) {
      cursorX = 790;
      cursorY = 395;
      cursorClicked = true;
    } else if (time < 4.4) {
      // Hovering in file modal over pitch_deck_q4.pdf
      const p = (time - 3.7) / 0.7;
      cursorX = 790 - p * 250;
      cursorY = 395 + p * 530;
    } else if (time < 4.8) {
      // Clicking Open
      cursorX = 795;
      cursorY = 1105;
      cursorClicked = time >= 4.6;
    }
  } else if (time >= 6.0 && time < 10.1) {
    // Cursor dragging ball across court
    showCursor = true;
    cursorClicked = time < 10.0;
    if (time < 6.4) {
      cursorX = 370;
      cursorY = 1040;
    } else if (time < 7.5) {
      cursorX = 370 + ((time - 6.4) / 1.1) * -100;
      cursorY = 1040 + ((time - 6.4) / 1.1) * 80;
    } else if (time < 8.7) {
      cursorX = 270 + ((time - 7.5) / 1.2) * 270;
      cursorY = 1120 + ((time - 7.5) / 1.2) * 50;
    } else if (time < 10.0) {
      cursorX = 540 + ((time - 8.7) / 1.3) * 140;
      cursorY = 1170 - ((time - 8.7) / 1.3) * 140;
    } else {
      cursorX = 680;
      cursorY = 1030;
      cursorClicked = false;
    }
  }

  // Simulated macOS Native File Picker Dialog (Active between 3.6s and 4.8s)
  const showFileDialog = time >= 3.6 && time < 4.8;

  // Revised Headlines (Clean, Bold, Punchy)
  const getSceneHeadline = () => {
    if (time < 3.0) return 'FILE UPLOAD.\nREIMAGINED.';
    if (time < 6.0) return 'CHOOSE YOUR FILE';
    if (time < 10.0) return 'AIM YOUR SHOT';
    if (time < 14.0) return 'MAKE THE SHOT';
    return 'UPLOADED SUCCESSFULLY';
  };

  return (
    <div
      style={{
        position: 'relative',
        width: '1080px',
        height: '1920px',
        backgroundColor: '#D8D3CD',
        overflow: 'hidden',
        fontFamily: "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        userSelect: 'none',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'flex-start',
        paddingTop: '64px',
      }}
    >
      {/* 1. Cinematic Background Texture */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: 'radial-gradient(circle at 50% 50%, #E6E2DC 0%, #D8D3CD 60%, #CAC5BF 100%)',
          pointerEvents: 'none',
        }}
      />

      {/* 2. Top Branding: Official GENZLOG Logo (Clean & Unobtrusive) */}
      {!isEndCard && (
        <header
          style={{
            position: 'absolute',
            top: '56px',
            left: '65px',
            zIndex: 40,
          }}
        >
          <img
            src="/genzlog-logo-black.png"
            alt="GENZLOG Official Logo"
            style={{ height: '48px', width: 'auto', display: 'block' }}
          />
        </header>
      )}

      {/* 3. Bold Main Headline Area (Large, High Contrast, Readable on Mobile) */}
      {!isEndCard && (
        <div
          style={{
            width: '950px',
            marginTop: '48px',
            marginBottom: '22px',
            textAlign: 'center',
            zIndex: 40,
            minHeight: '150px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          {time < 3.0 ? (
            <div>
              <h1
                style={{
                  margin: 0,
                  fontSize: '76px',
                  fontWeight: 900,
                  color: '#111111',
                  letterSpacing: '-0.035em',
                  lineHeight: 1.05,
                  whiteSpace: 'pre-line',
                }}
              >
                FILE UPLOAD.{'\n'}REIMAGINED.
              </h1>
              <p
                style={{
                  margin: '14px 0 0 0',
                  fontSize: '28px',
                  color: '#5E5B56',
                  fontWeight: 500,
                  letterSpacing: '-0.01em',
                }}
              >
                An interactive 3D basketball upload experience.
              </p>
            </div>
          ) : (
            <h2
              style={{
                margin: 0,
                fontSize: '68px',
                fontWeight: 900,
                color: '#111111',
                letterSpacing: '-0.03em',
                lineHeight: 1.08,
                textTransform: 'uppercase',
              }}
            >
              {getSceneHeadline()}
            </h2>
          )}
        </div>
      )}

      {/* 4. Center Product Stage — Product Occupies Most of Vertical Frame */}
      {!isEndCard && (
        <div
          style={{
            position: 'relative',
            width: '950px',
            zIndex: 20,
          }}
        >
          {/* Main GENZLOG Basketball Uploader Card (Enlarged for Mobile Dominance) */}
          <div
            className="basketball-uploader-card"
            style={{
              width: '100%',
              maxWidth: '950px',
              padding: '38px 44px 34px 44px',
              boxShadow: '0 35px 80px -15px rgba(35, 30, 25, 0.18), 0 4px 16px rgba(35, 30, 25, 0.08)',
              borderRadius: '36px',
            }}
          >
            {/* Card Top Action Bar */}
            <div className="uploader-top-bar" style={{ marginBottom: '22px' }}>
              <div className="branding-logo-wrapper">
                <img
                  src="/genzlog-logo-black.png"
                  alt="GENZLOG Official Logo"
                  className="genzlog-official-logo"
                  style={{ height: '44px' }}
                />
              </div>

              <div className="header-actions-group" style={{ gap: '14px' }}>
                {animState === 'idle' && (
                  <button
                    type="button"
                    className="choose-file-btn"
                    style={{
                      backgroundColor: cursorClicked && time < 4.0 ? '#E8E4DE' : '#FFFFFF',
                      transform: cursorClicked && time < 4.0 ? 'scale(0.96)' : 'none',
                      fontSize: '16px',
                      padding: '10px 22px',
                      borderRadius: '999px',
                    }}
                  >
                    <Upload size={17} strokeWidth={2.4} /> Choose file
                  </button>
                )}

                <button
                  type="button"
                  className="sound-toggle-btn"
                  aria-label="Sound active"
                  style={{ padding: '10px' }}
                >
                  <Volume2 size={22} className="sound-icon is-active" />
                </button>

                <div
                  className={`uploaded-count-badge ${isUploadedComplete ? 'is-bumping' : ''}`}
                  style={{ fontSize: '15px', padding: '8px 18px' }}
                >
                  Uploaded {uploadCount}
                </div>
              </div>
            </div>

            {/* Heading Section */}
            <div className="uploader-header" style={{ marginBottom: '18px' }}>
              <h1 className="uploader-heading" style={{ fontSize: '28px' }}>Upload files</h1>
              <p className="uploader-subheading" style={{ fontSize: '16px' }}>
                Drag and drop, or take the shot.
              </p>
            </div>

            {/* Selected File Ready Bar (Scenes 2, 3, 4) */}
            {time >= 4.8 && time < 14.0 && (
              <div
                className="selected-file-ready-bar"
                style={{ padding: '14px 20px', marginBottom: '18px', borderRadius: '18px' }}
              >
                <div className="selected-file-info" style={{ gap: '12px' }}>
                  <span className="file-tag tag-pdf" style={{ fontSize: '12px', padding: '4px 10px' }}>
                    PDF
                  </span>
                  <span className="selected-file-name" style={{ fontSize: '17px', maxWidth: '340px' }}>
                    pitch_deck_q4.pdf
                  </span>
                  <span className="selected-file-size" style={{ fontSize: '15px' }}>(1.8 MB)</span>
                </div>

                <button
                  type="button"
                  className="shoot-action-btn"
                  style={{
                    fontSize: '15px',
                    padding: '9px 24px',
                    backgroundColor: time >= 9.8 && time < 10.4 ? '#444444' : '#111111',
                    borderRadius: '12px',
                  }}
                >
                  <Play size={15} fill="currentColor" /> Shoot
                </button>
              </div>
            )}

            {/* Main Dropzone & 3D Court Area (Substantial Height: 940px to dominate vertical frame) */}
            <div
              className={`upload-dropzone state-${animState}`}
              style={{
                height: time >= 4.8 && time < 14.0 ? '880px' : '940px',
                borderRadius: '26px',
              }}
            >
              {/* Upload Progress Bar Row (Scene 5) */}
              {time >= 14.0 && (
                <div className="dropzone-progress-container" style={{ top: '20px', left: '4%', width: '92%' }}>
                  <div className="upload-progress-row" style={{ padding: '18px 20px', borderRadius: '16px' }}>
                    <div className="progress-row-header" style={{ marginBottom: '4px' }}>
                      <div className="progress-file-info" style={{ gap: '10px' }}>
                        <span className="file-tag tag-pdf" style={{ fontSize: '11px', padding: '4px 8px' }}>
                          PDF
                        </span>
                        <span className="file-name" style={{ fontSize: '16px', maxWidth: '320px' }}>
                          pitch_deck_q4.pdf
                        </span>
                      </div>

                      <div className="progress-status-indicator">
                        {isUploadedComplete ? (
                          <span className="status-done-text" style={{ fontSize: '15px' }}>100% Complete</span>
                        ) : (
                          <span className="status-percent-text" style={{ fontSize: '15px' }}>{uploadProgress}%</span>
                        )}
                      </div>
                    </div>

                    <div className="progress-bar-track" style={{ height: '7px' }}>
                      <div
                        className={`progress-bar-fill ${isUploadedComplete ? 'fill-completed' : ''}`}
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>

                    <div className="progress-row-footer" style={{ fontSize: '13.5px', marginTop: '4px' }}>
                      {isUploadedComplete ? (
                        <span className="status-msg-completed">
                          <CheckCircle2 size={16} className="status-icon-check" /> Upload confirmed
                        </span>
                      ) : (
                        <span className="status-msg-uploading">Simulated transfer • 1.8 MB</span>
                      )}
                      <span className="file-size-text">1.8 MB</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Dropzone Header Instructions (Scene 1: before file selected) */}
              {time < 4.8 && (
                <div className="dropzone-instructions" style={{ top: '24px' }}>
                  <div className="dropzone-upload-icon-wrapper" style={{ marginBottom: '6px' }}>
                    <Upload size={24} className="dropzone-upload-icon" strokeWidth={2.4} />
                  </div>
                  <span className="dropzone-main-text" style={{ fontSize: '18px', fontWeight: 700 }}>
                    SELECT A FILE TO START
                  </span>
                  <span className="dropzone-sub-text" style={{ fontSize: '14px', marginTop: '3px' }}>
                    Click the ball, court, or drop files here
                  </span>
                </div>
              )}

              {/* 3D Court Canvas */}
              <div className="dropzone-arena">
                <BasketballCourt3D
                  state={animState}
                  activeItem={time >= 4.8 ? sampleFile : null}
                  onFileSelectClick={() => {}}
                  onShotSuccess={() => {}}
                  onShotMiss={() => {}}
                  isInteractive={false}
                  controlledBallPos={ballPos}
                  controlledAimTarget={aimTarget}
                  controlledTrajectory={trajectoryVisible}
                  controlledNetSwish={netSwishProgress}
                />
              </div>

              <div className="dropzone-bottom-bar" />
            </div>

            {/* Footer Instruction Text */}
            <div className="uploader-footer" style={{ marginTop: '20px' }}>
              <span className="footer-instruction-text" style={{ fontSize: '14.5px', fontWeight: 600 }}>
                {animState === 'idle'
                  ? 'SELECT A FILE TO START'
                  : animState === 'selected'
                  ? 'AIM YOUR SHOT'
                  : animState === 'aiming'
                  ? 'DRAG TO POSITION • RELEASE TO SHOOT'
                  : animState === 'shooting'
                  ? 'IN THE AIR...'
                  : animState === 'swish'
                  ? 'NICE SHOT! UPLOADING...'
                  : animState === 'uploading'
                  ? 'UPLOADING FILE...'
                  : 'FILE UPLOADED SUCCESSFULLY'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* 5. Simulated Native macOS File Picker Modal (Scene 2) */}
      {showFileDialog && (
        <div
          style={{
            position: 'absolute',
            top: '52%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '620px',
            backgroundColor: '#FFFFFF',
            borderRadius: '18px',
            boxShadow: '0 30px 80px rgba(0, 0, 0, 0.28), 0 4px 16px rgba(0, 0, 0, 0.1)',
            border: '1px solid #D0CBC4',
            overflow: 'hidden',
            zIndex: 60,
          }}
        >
          {/* Finder Header Bar */}
          <div
            style={{
              padding: '16px 20px',
              backgroundColor: '#ECE9E4',
              borderBottom: '1px solid #D0CBC4',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#FF5F56' }} />
              <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#FFBD2E' }} />
              <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#27C93F' }} />
            </div>
            <span style={{ fontSize: '15px', fontWeight: 600, color: '#111111' }}>Select File to Upload</span>
            <div style={{ width: '36px' }} />
          </div>

          {/* Finder Body */}
          <div style={{ display: 'flex', height: '220px' }}>
            {/* Sidebar */}
            <div
              style={{
                width: '160px',
                backgroundColor: '#F6F5F2',
                borderRight: '1px solid #D0CBC4',
                padding: '14px 12px',
                fontSize: '13px',
                color: '#6B6863',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600, color: '#111111' }}>
                <Folder size={14} /> Documents
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <HardDrive size={14} /> Desktop
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Folder size={14} /> Downloads
              </div>
            </div>

            {/* File List */}
            <div style={{ flex: 1, padding: '12px 14px', fontSize: '14px' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '8px 12px',
                  borderRadius: '8px',
                  backgroundColor: '#ECE9E4',
                  fontWeight: 600,
                  color: '#111111',
                  marginBottom: '6px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <FileText size={16} color="#C8461D" /> pitch_deck_q4.pdf
                </div>
                <span style={{ fontSize: '12.5px', color: '#6B6863' }}>1.8 MB</span>
              </div>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '8px 12px',
                  borderRadius: '8px',
                  color: '#6B6863',
                  marginBottom: '6px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <FileText size={16} /> brand_identity.zip
                </div>
                <span style={{ fontSize: '12.5px' }}>14.2 MB</span>
              </div>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '8px 12px',
                  borderRadius: '8px',
                  color: '#6B6863',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <FileText size={16} /> court_diagram.png
                </div>
                <span style={{ fontSize: '12.5px' }}>3.4 MB</span>
              </div>
            </div>
          </div>

          {/* Finder Footer */}
          <div
            style={{
              padding: '14px 18px',
              borderTop: '1px solid #D0CBC4',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
              gap: '10px',
              backgroundColor: '#F8F7F4',
            }}
          >
            <button
              type="button"
              style={{
                padding: '7px 16px',
                borderRadius: '8px',
                border: '1px solid #D0CBC4',
                background: '#FFFFFF',
                fontSize: '13px',
                color: '#6B6863',
              }}
            >
              Cancel
            </button>
            <button
              type="button"
              style={{
                padding: '7px 20px',
                borderRadius: '8px',
                border: 'none',
                background: '#111111',
                color: '#FFFFFF',
                fontSize: '13px',
                fontWeight: 600,
              }}
            >
              Open
            </button>
          </div>
        </div>
      )}

      {/* 6. Realistic Animated Pointer Cursor */}
      {showCursor && !isEndCard && (
        <div
          style={{
            position: 'absolute',
            left: `${cursorX}px`,
            top: `${cursorY}px`,
            pointerEvents: 'none',
            zIndex: 80,
            transform: cursorClicked ? 'scale(0.88)' : 'scale(1)',
            transition: 'transform 0.1s ease',
          }}
        >
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
            <path
              d="M3 3L10.07 20.97L13.58 13.58L20.97 10.07L3 3Z"
              fill="#111111"
              stroke="#FFFFFF"
              strokeWidth="2"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      )}

      {/* 7. HIGH-IMPACT PROMOTIONAL END CARD (Scene 6: 16.5s – 20.0s) */}
      {isEndCard && (
        <div
          style={{
            position: 'relative',
            width: '960px',
            minHeight: '1120px',
            margin: 'auto 0',
            backgroundColor: '#F8F7F4',
            borderRadius: '48px',
            padding: '96px 72px 88px 72px',
            boxShadow: '0 45px 100px -15px rgba(35, 30, 25, 0.24), 0 8px 24px rgba(35, 30, 25, 0.08)',
            border: '2.5px solid #D0CBC4',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
            zIndex: 50,
            animation: 'endCardZoomIn 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards',
          }}
        >
          {/* Official GENZLOG Logo (Prominently featured) */}
          <div style={{ marginBottom: '40px' }}>
            <img
              src="/genzlog-logo-black.png"
              alt="GENZLOG Official Logo"
              style={{ height: '98px', width: 'auto', display: 'block' }}
            />
          </div>

          {/* Main Headline */}
          <h2
            style={{
              margin: '0 0 22px 0',
              fontSize: '74px',
              fontWeight: 900,
              color: '#111111',
              letterSpacing: '-0.035em',
              lineHeight: 1.05,
            }}
          >
            GET THIS SOURCE CODE<br />FOR FREE
          </h2>

          {/* Supporting line */}
          <p
            style={{
              margin: '0 0 48px 0',
              fontSize: '28px',
              color: '#5E5B56',
              fontWeight: 500,
              lineHeight: 1.35,
              maxWidth: '780px',
            }}
          >
            Find the Basketball Upload component in our Free Code section.
          </p>

          {/* Primary Action Button / Website Callout */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '26px',
              width: '100%',
            }}
          >
            {/* Website Link Callout */}
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '16px',
                backgroundColor: '#FFFFFF',
                border: '3px solid #111111',
                borderRadius: '26px',
                padding: '24px 54px',
                fontSize: '44px',
                fontWeight: 800,
                color: '#111111',
                boxShadow: '0 10px 30px rgba(0, 0, 0, 0.08)',
              }}
            >
              <span>Visit</span>
              <span style={{ color: '#D96222' }}>genzlog.tech</span>
              <ArrowRight size={36} strokeWidth={2.8} />
            </div>

            {/* Navigation Instruction Pill highlighting Product #2 */}
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '16px',
                backgroundColor: '#111111',
                borderRadius: '999px',
                padding: '22px 54px',
                color: '#FFFFFF',
                fontSize: '34px',
                fontWeight: 750,
                letterSpacing: '-0.01em',
                boxShadow: '0 14px 34px rgba(17, 17, 17, 0.28)',
              }}
            >
              <Code size={30} strokeWidth={2.6} />
              <span>Free Code → Search Product #2</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
