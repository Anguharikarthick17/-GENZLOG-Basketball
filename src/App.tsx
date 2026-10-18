import React, { useState } from 'react';
import { BasketballUploader } from './components/BasketballUploader';
import { CinematicAdPlayer } from './components/CinematicAdPlayer';
import { MockUploadAdapter } from './utils/mockUploadAdapter';

export const App: React.FC = () => {
  const isAdMode = typeof window !== 'undefined' && window.location.search.includes('ad=1');

  if (isAdMode) {
    return <CinematicAdPlayer />;
  }

  const [shouldSimulateError, setShouldSimulateError] = useState(false);

  // Custom upload adapter with optional simulation of network error
  const customAdapter = new MockUploadAdapter({
    durationMs: 2200,
    shouldFail: shouldSimulateError,
    failureMessage: 'Connection interrupted. Please retry.',
  });

  return (
    <main
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        maxWidth: '520px',
        margin: '0 auto',
      }}
    >
      {/* 1. Main 3D Basketball Uploader Component */}
      <BasketballUploader
        uploadAdapter={customAdapter}
        maxFileSize={50 * 1024 * 1024}
        maxFiles={10}
        initialCount={2}
        soundEnabled={true}
        onUploadComplete={(item) => {
          console.log('[GENZLOG Upload Complete]', item.name, item.formattedSize);
        }}
        onUploadError={(item, err) => {
          console.warn('[GENZLOG Upload Error]', item.name, err);
        }}
      />

      {/* 2. Developer Options Bar */}
      <aside
        style={{
          marginTop: '16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '12px',
          fontSize: '11.5px',
          color: '#8F8B85',
        }}
      >
        <label
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '5px',
            cursor: 'pointer',
            userSelect: 'none',
          }}
        >
          <input
            type="checkbox"
            checked={shouldSimulateError}
            onChange={(e) => setShouldSimulateError(e.target.checked)}
            style={{ accentColor: '#C62828', cursor: 'pointer' }}
          />
          Simulate network error on upload
        </label>
      </aside>
    </main>
  );
};

export default App;
