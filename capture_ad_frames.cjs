const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const TOTAL_FRAMES = 600; // 20 seconds at 30 fps
const FPS = 30;
const OUTPUT_DIR = path.join(__dirname, 'output', 'frames');

async function run() {
  console.log(`Starting capture of ${TOTAL_FRAMES} frames at ${FPS} FPS...`);
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  const chrome = spawn('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', [
    '--headless',
    '--disable-gpu',
    '--remote-debugging-port=9222',
    '--window-size=1080,1920',
    '--hide-scrollbars',
    'http://127.0.0.1:5173/?ad=1'
  ]);

  chrome.stderr.on('data', () => {}); // swallow chrome stderr noise

  // Wait for Chrome to bind port 9222
  let list = null;
  for (let attempt = 0; attempt < 20; attempt++) {
    try {
      list = await fetch('http://127.0.0.1:9222/json').then(r => r.json());
      if (list && list.length > 0) break;
    } catch {
      await new Promise(r => setTimeout(r, 200));
    }
  }

  if (!list) {
    throw new Error('Failed to connect to Chrome DevTools endpoint');
  }

  const pageTarget = list.find(t => t.type === 'page' && t.url.includes('5173')) || list.find(t => t.type === 'page');
  console.log('Target page found:', pageTarget.title, pageTarget.url);

  const ws = new WebSocket(pageTarget.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => {
    ws.onopen = resolve;
    ws.onerror = reject;
  });

  let msgId = 1;
  const send = (method, params = {}) => new Promise((resolve, reject) => {
    const curId = msgId++;
    const handler = (evt) => {
      try {
        const data = JSON.parse(evt.data);
        if (data.id === curId) {
          ws.removeEventListener('message', handler);
          if (data.error) reject(data.error);
          else resolve(data.result);
        }
      } catch (err) {
        reject(err);
      }
    };
    ws.addEventListener('message', handler);
    ws.send(JSON.stringify({ id: curId, method, params }));
  });

  // Enable Page and DOM domains
  await send('Page.enable');
  await send('DOM.enable');

  // Set accurate mobile portrait viewport: 1080x1920
  await send('Emulation.setDeviceMetricsOverride', {
    width: 1080,
    height: 1920,
    deviceScaleFactor: 1,
    mobile: true,
    fitWindow: false,
  });

  // Wait for React and Three.js scene to mount
  await new Promise(r => setTimeout(r, 1500));

  console.log('Viewport initialized. Beginning frame capture loop...');
  const startTime = Date.now();

  for (let i = 0; i < TOTAL_FRAMES; i++) {
    const t = i / FPS;
    // Seek application to exact timeline timestamp
    await send('Runtime.evaluate', {
      expression: `if (window.__adSeek) window.__adSeek(${t});`,
    });

    // Capture exact PNG screenshot
    const shot = await send('Page.captureScreenshot', {
      format: 'png',
      fromSurface: true,
    });

    const frameNum = String(i).padStart(4, '0');
    const framePath = path.join(OUTPUT_DIR, `frame_${frameNum}.png`);
    fs.writeFileSync(framePath, Buffer.from(shot.data, 'base64'));

    if ((i + 1) % 30 === 0 || i === TOTAL_FRAMES - 1) {
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
      const fpsAchieved = ((i + 1) / ((Date.now() - startTime) / 1000)).toFixed(1);
      console.log(`[Frame ${i + 1}/${TOTAL_FRAMES}] Timestamp: ${t.toFixed(2)}s | Elapsed: ${elapsed}s (${fpsAchieved} fps)`);
    }
  }

  console.log(`Completed capture of all ${TOTAL_FRAMES} frames in ${((Date.now() - startTime) / 1000).toFixed(1)}s.`);
  chrome.kill();
  process.exit(0);
}

run().catch(err => {
  console.error('Capture failed:', err);
  process.exit(1);
});
