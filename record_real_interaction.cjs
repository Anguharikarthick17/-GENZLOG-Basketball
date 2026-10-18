const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const FRAMES_DIR = path.join(__dirname, 'output', 'real_frames');
const TOTAL_PRODUCT_FRAMES = 480; // 16 seconds @ 30 FPS (0.0s to 16.0s)
const FPS = 30;

async function recordRealApplication() {
  fs.mkdirSync(FRAMES_DIR, { recursive: true });
  console.log('Launching hardware-accelerated Chrome to record genuine application on http://127.0.0.1:5173...');

  const chrome = spawn('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', [
    '--headless',
    '--remote-debugging-port=9222',
    '--hide-scrollbars',
    'http://127.0.0.1:5173'
  ]);

  let list = null;
  for (let i = 0; i < 25; i++) {
    try {
      list = await fetch('http://127.0.0.1:9222/json').then(r => r.json());
      if (list && list.length > 0) break;
    } catch {}
    await new Promise(r => setTimeout(r, 200));
  }

  const page = list.find(t => t.type === 'page');
  const ws = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise(r => ws.onopen = r);

  let msgId = 1;
  const send = (method, params = {}) => new Promise((resolve, reject) => {
    const cur = msgId++;
    const handler = (e) => {
      const d = JSON.parse(e.data);
      if (d.id === cur) {
        ws.removeEventListener('message', handler);
        if (d.error) reject(d.error);
        else resolve(d.result);
      }
    };
    ws.addEventListener('message', handler);
    ws.send(JSON.stringify({ id: cur, method, params }));
  });

  await send('Page.enable');
  await send('DOM.enable');

  // Set device metrics so card renders at crisp high resolution (540x960 @ 2x = 1080x1920)
  await send('Emulation.setDeviceMetricsOverride', {
    width: 540,
    height: 960,
    deviceScaleFactor: 2,
    mobile: true,
    fitWindow: false,
  });

  // Inject a visual cursor element into the real page so pointer interactions are visible in the screen recording
  await send('Runtime.evaluate', {
    expression: `
      (() => {
        const cursor = document.createElement('div');
        cursor.id = 'demo-pointer-cursor';
        cursor.style.position = 'fixed';
        cursor.style.width = '32px';
        cursor.style.height = '32px';
        cursor.style.zIndex = '999999';
        cursor.style.pointerEvents = 'none';
        cursor.style.transition = 'transform 0.08s ease';
        cursor.style.left = '0px';
        cursor.style.top = '0px';
        cursor.style.display = 'none';
        cursor.innerHTML = \`
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" style="filter: drop-shadow(0 3px 6px rgba(0,0,0,0.35));">
            <path d="M3 3L10.07 20.97L13.58 13.58L20.97 10.07L3 3Z" fill="#111111" stroke="#FFFFFF" stroke-width="2" stroke-linejoin="round"/>
          </svg>
        \`;
        document.body.appendChild(cursor);
        window.__moveCursor = (x, y, visible = true, click = false) => {
          cursor.style.display = visible ? 'block' : 'none';
          cursor.style.left = x + 'px';
          cursor.style.top = y + 'px';
          cursor.style.transform = click ? 'scale(0.85)' : 'scale(1)';
        };
      })()
    `
  });

  await new Promise(r => setTimeout(r, 1200));

  const doc = await send('DOM.getDocument');
  const fileInputNode = await send('DOM.querySelector', {
    nodeId: doc.root.nodeId,
    selector: 'input[type=file]'
  });
  const chooseBtnNode = await send('DOM.querySelector', {
    nodeId: doc.root.nodeId,
    selector: '.choose-file-btn'
  });

  const chooseBox = await send('DOM.getBoxModel', { nodeId: chooseBtnNode.nodeId });
  const chooseBtnX = (chooseBox.model.border[0] + chooseBox.model.border[2]) / 2;
  const chooseBtnY = (chooseBox.model.border[1] + chooseBox.model.border[5]) / 2;

  const canvasInfo = await send('Runtime.evaluate', {
    expression: `
      (() => {
        const c = document.querySelector('.basketball-court-3d-canvas');
        const r = c.getBoundingClientRect();
        return { left: r.left, top: r.top, width: r.width, height: r.height };
      })()
    `,
    returnByValue: true
  });
  const courtBox = canvasInfo.result.value;
  console.log('3D Court canvas box:', courtBox);

  // Ball initial position on screen
  const ballStartX = Math.round(courtBox.left + 116);
  const ballStartY = Math.round(courtBox.top + 274);

  const startTime = Date.now();
  let fileSelected = false;
  let dragStarted = false;
  let shotTriggered = false;

  console.log(`Recording ${TOTAL_PRODUCT_FRAMES} frames of genuine website interaction...`);

  for (let i = 0; i < TOTAL_PRODUCT_FRAMES; i++) {
    const t = i / FPS; // 0.0s to 16.0s

    // 1. Cursor & Interaction Management along Real Timeline
    if (t < 3.0) {
      // Scene 1: Idle
      await send('Runtime.evaluate', {
        expression: `window.__moveCursor(0, 0, false);`
      });
    } else if (t >= 3.0 && t < 4.5) {
      // Scene 2: Moving cursor to Choose file button and selecting genuine file
      const p = (t - 3.0) / 1.5;
      const curX = 360 + p * (chooseBtnX - 360);
      const curY = 480 - p * (480 - chooseBtnY);
      const isClick = t >= 4.0 && t <= 4.4;
      await send('Runtime.evaluate', {
        expression: `window.__moveCursor(${curX}, ${curY}, true, ${isClick});`
      });

      if (t >= 4.2 && !fileSelected) {
        fileSelected = true;
        console.log(`[t=${t.toFixed(2)}s] Selecting genuine file pitch_deck_q4.pdf...`);
        await send('DOM.setFileInputFiles', {
          nodeId: fileInputNode.nodeId,
          files: ['/Users/angu/Documents/bb/pitch_deck_q4.pdf']
        });
        await new Promise(r => setTimeout(r, 60));
      }
    } else if (t >= 4.5 && t < 5.8) {
      // File is selected, move cursor down to the basketball
      const p = (t - 4.5) / 1.3;
      const curX = chooseBtnX + p * (ballStartX - chooseBtnX);
      const curY = chooseBtnY + p * (ballStartY - chooseBtnY);
      await send('Runtime.evaluate', {
        expression: `window.__moveCursor(${curX}, ${curY}, true, false);`
      });
    } else if (t >= 5.8 && t < 10.2) {
      // Scene 3: Aiming & Dragging basketball across court (5.8s to 10.2s)
      if (!dragStarted) {
        dragStarted = true;
        console.log(`[t=${t.toFixed(2)}s] Pressing pointer on basketball to begin aiming...`);
        await send('Input.dispatchMouseEvent', {
          type: 'mousePressed',
          x: ballStartX,
          y: ballStartY,
          button: 'left',
          buttons: 1,
          clickCount: 1
        });
      }

      // Calculate smooth aiming path across court
      let targetX = ballStartX;
      let targetY = ballStartY;

      if (t < 7.2) {
        // Drag towards left wing
        const p = (t - 5.8) / 1.4;
        targetX = ballStartX - p * 25;
        targetY = ballStartY + p * 15;
      } else if (t < 8.8) {
        // Drag from left wing across to key center
        const p = (t - 7.2) / 1.6;
        targetX = (ballStartX - 25) + p * 115;
        targetY = (ballStartY + 15) - p * 35;
      } else {
        // Hold at perfect sweet spot (center-top key)
        const p = (t - 8.8) / 1.4;
        targetX = (ballStartX + 90) + p * 15;
        targetY = (ballStartY - 20) - p * 10;
      }

      await send('Runtime.evaluate', {
        expression: `window.__moveCursor(${targetX}, ${targetY}, true, true);`
      });

      // Dispatch real pointermove to the court
      await send('Input.dispatchMouseEvent', {
        type: 'mouseMoved',
        x: Math.round(targetX),
        y: Math.round(targetY),
        buttons: 1
      });
    } else if (t >= 10.2 && t < 10.5) {
      // Scene 4: Releasing pointer launches the genuine shot into the hoop!
      if (dragStarted && !shotTriggered) {
        dragStarted = false;
        shotTriggered = true;
        console.log(`[t=${t.toFixed(2)}s] Releasing pointer to trigger shot!`);
        await send('Input.dispatchMouseEvent', {
          type: 'mouseReleased',
          x: Math.round(ballStartX + 105),
          y: Math.round(ballStartY - 30),
          button: 'left'
        });
      }
      await send('Runtime.evaluate', {
        expression: `window.__moveCursor(0, 0, false);`
      });
    } else if (t >= 10.5) {
      // Hide cursor during flight, net swish, and upload progress
      await send('Runtime.evaluate', {
        expression: `window.__moveCursor(0, 0, false);`
      });
    }

    // Capture screenshot from surface (1080x1920 crisp retina)
    const shot = await send('Page.captureScreenshot', {
      format: 'png',
      fromSurface: true
    });

    const frameNum = String(i).padStart(4, '0');
    fs.writeFileSync(path.join(FRAMES_DIR, `real_frame_${frameNum}.png`), Buffer.from(shot.data, 'base64'));

    if ((i + 1) % 30 === 0 || i === TOTAL_PRODUCT_FRAMES - 1) {
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
      console.log(`[Frame ${i + 1}/${TOTAL_PRODUCT_FRAMES}] Timestamp: ${t.toFixed(2)}s | Elapsed: ${elapsed}s`);
    }

    // Pacing interval to sync with real-time Three.js animation clock (1 / 30s)
    await new Promise(r => setTimeout(r, 28));
  }

  console.log(`Completed capture of all ${TOTAL_PRODUCT_FRAMES} product frames.`);
  chrome.kill();
  process.exit(0);
}

recordRealApplication().catch(err => {
  console.error('Recording failed:', err);
  process.exit(1);
});
