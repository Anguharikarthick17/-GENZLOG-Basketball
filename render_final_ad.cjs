const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const TOTAL_FRAMES = 600; // Exactly 20.0s @ 30 FPS
const OUTPUT_DIR = path.join(__dirname, 'output', 'final_frames');
const REAL_FRAMES_DIR = path.join(__dirname, 'output', 'real_frames');
const LOGO_PATH = path.join(__dirname, 'public', 'genzlog-logo-black.png');

async function renderFinalAd() {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  console.log(`Starting production rendering of ${TOTAL_FRAMES} final advertisement frames...`);

  // Create an HTML compositor page
  const compositorHtmlPath = path.join(__dirname, 'output', 'compositor.html');
  const logoBase64 = fs.readFileSync(LOGO_PATH).toString('base64');

  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { background: #E8E4DE; width: 1080px; height: 1920px; overflow: hidden; font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", Roboto, Helvetica, Arial, sans-serif; }
    #canvas { width: 1080px; height: 1920px; display: block; }
  </style>
</head>
<body>
  <canvas id="canvas" width="1080" height="1920"></canvas>
  <img id="logo" src="data:image/png;base64,${logoBase64}" style="display:none;" />
  <script>
    const canvas = document.getElementById('canvas');
    const ctx = canvas.getContext('2d');
    const logoImg = document.getElementById('logo');

    function roundRect(ctx, x, y, width, height, radius, fill, stroke, strokeWidth) {
      ctx.beginPath();
      ctx.moveTo(x + radius, y);
      ctx.lineTo(x + width - radius, y);
      ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
      ctx.lineTo(x + width, y + height - radius);
      ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
      ctx.lineTo(x + radius, y + height);
      ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
      ctx.lineTo(x, y + radius);
      ctx.quadraticCurveTo(x, y, x + radius, y);
      ctx.closePath();
      if (fill) ctx.fill();
      if (stroke) {
        ctx.lineWidth = strokeWidth || 1;
        ctx.stroke();
      }
    }

    window.drawFrame = function(frameIndex, imgDataUrl) {
      return new Promise((resolve) => {
        // 1. Studio Warm Neutral Background
        const grad = ctx.createLinearGradient(0, 0, 0, 1920);
        grad.addColorStop(0, '#EAE6E0');
        grad.addColorStop(1, '#DCD7D0');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, 1080, 1920);

        const t = frameIndex / 30; // 0.0s to 20.0s

        if (frameIndex < 480) {
          // ==========================================
          // SCENES 1 - 5: PRODUCT INTERACTION (0-16s)
          // ==========================================
          const img = new Image();
          img.onload = () => {
            let headline = '', subtitle = '', subColor = '#5A544E';

            if (t < 3.0) {
              // Scene 1 (0-3s): Introduction
              headline = ['FILE UPLOAD.', 'REIMAGINED.'];
              subtitle = 'Interactive 3D Basketball Upload';
            } else if (t < 6.0) {
              // Scene 2 (3-6s): Select a file
              headline = ['CHOOSE YOUR FILE'];
              subtitle = 'Select a document to begin';
            } else if (t < 10.0) {
              // Scene 3 (6-10s): Aim the basketball
              headline = ['AIM YOUR SHOT'];
              subtitle = 'Drag anywhere on court to adjust trajectory';
            } else if (t < 14.0) {
              // Scene 4 (10-14s): Shoot & Net reaction
              headline = ['MAKE THE SHOT'];
              subtitle = 'Release to score through the hoop';
            } else {
              // Scene 5 (14-16s): Upload completion
              headline = ['UPLOAD COMPLETE'];
              subtitle = 'File transferred successfully';
              subColor = '#246B2A';
            }

            // Exact crop: entire product card from rounded top to bottom
            const sx = 20, sy = 390, sw = 1040, sh = 1070;
            const dx = 20, dy = 440, dw = 1040, dh = 1070;

            // Draw product card with subtle ambient drop shadow
            ctx.save();
            ctx.shadowColor = 'rgba(28, 24, 20, 0.09)';
            ctx.shadowBlur = 36;
            ctx.shadowOffsetY = 18;
            ctx.drawImage(img, sx, sy, sw, sh, dx, dy, dw, dh);
            ctx.restore();

            // Official GENZLOG Logo at top
            const logoW = 126;
            const logoH = 52;
            ctx.drawImage(logoImg, (1080 - logoW) / 2, 72, logoW, logoH);

            // Headline & Subtitle
            ctx.textAlign = 'center';
            if (Array.isArray(headline) && headline.length === 2) {
              ctx.font = '900 64px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
              ctx.fillStyle = '#141210';
              ctx.fillText(headline[0], 540, 210);
              ctx.fillText(headline[1], 540, 280);
              ctx.font = '500 26px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
              ctx.fillStyle = subColor;
              ctx.fillText(subtitle, 540, 345);
            } else {
              ctx.font = '900 62px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
              ctx.fillStyle = '#141210';
              ctx.fillText(headline[0], 540, 245);
              ctx.font = '500 26px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
              ctx.fillStyle = subColor;
              ctx.fillText(subtitle, 540, 315);
            }

            resolve();
          };
          img.src = imgDataUrl;
        } else {
          // ==========================================
          // SCENE 6: SOURCE-CODE CALL TO ACTION (16-20s)
          // ==========================================
          // Spacing rules strictly followed:
          // Logo to headline: 56px (req 48-64px)
          // Headline to supporting: 42px (req 32-48px)
          // Supporting to website CTA: 44px (req 36-48px)
          // Website CTA to product number: 28px (req 24-32px)

          const ctaCardY = 460;
          ctx.textAlign = 'center';

          // 1. Official GENZLOG Logo
          const ctaLogoW = 164;
          const ctaLogoH = 68;
          const logoX = (1080 - ctaLogoW) / 2;
          const logoY = ctaCardY;
          ctx.drawImage(logoImg, logoX, logoY, ctaLogoW, ctaLogoH);

          // 2. Headline (Gap: 56px)
          const headY1 = logoY + ctaLogoH + 56 + 56;
          const headY2 = headY1 + 80;
          ctx.font = '900 74px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
          ctx.fillStyle = '#141210';
          ctx.fillText('GET THIS SOURCE CODE', 540, headY1);
          ctx.fillText('FOR FREE', 540, headY2);

          // 3. Supporting sentence (Gap: 42px)
          const supportY = headY2 + 42 + 22;
          ctx.font = '500 27px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
          ctx.fillStyle = '#48433E';
          ctx.fillText('Find the Basketball Upload component in our Free Code section.', 540, supportY);

          // 4. Website CTA Button (Gap: 46px)
          const btnW = 500;
          const btnH = 82;
          const btnX = (1080 - btnW) / 2;
          const btnY = supportY + 46;
          ctx.fillStyle = '#F5F2EB';
          ctx.strokeStyle = '#181614';
          roundRect(ctx, btnX, btnY, btnW, btnH, 41, true, true, 2.8);

          ctx.font = '800 32px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
          ctx.fillStyle = '#141210';
          ctx.fillText('Visit genzlog.tech →', 540, btnY + 52);

          // 5. Product Number CTA (Gap: 28px)
          const pillW = 460;
          const pillH = 110;
          const pillX = (1080 - pillW) / 2;
          const pillY = btnY + btnH + 28;
          ctx.fillStyle = '#161412';
          roundRect(ctx, pillX, pillY, pillW, pillH, 24, true, false);

          ctx.font = '700 14px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
          ctx.fillStyle = '#9C958C';
          ctx.fillText('FREE CODE', 540, pillY + 38);

          ctx.font = '900 32px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
          ctx.fillStyle = '#FFFFFF';
          ctx.fillText('SEARCH PRODUCT #2', 540, pillY + 80);

          resolve();
        }
      });
    };
  </script>
</body>
</html>
  `;

  fs.writeFileSync(compositorHtmlPath, htmlContent);

  // Spawn headless Chrome to render compositor
  const chrome = spawn('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', [
    '--headless',
    '--disable-gpu',
    '--remote-debugging-port=9223',
    '--hide-scrollbars',
    `file://${compositorHtmlPath}`
  ]);

  let list = null;
  for (let i = 0; i < 25; i++) {
    try {
      list = await fetch('http://127.0.0.1:9223/json').then(r => r.json());
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
  await send('Emulation.setDeviceMetricsOverride', {
    width: 1080,
    height: 1920,
    deviceScaleFactor: 1,
    mobile: false,
  });

  await new Promise(r => setTimeout(r, 1000));

  const startTime = Date.now();
  console.log(`Rendering ${TOTAL_FRAMES} frames...`);

  // Scene mapping:
  // Scene 1: 0 to 89 (t 0.0s to 3.0s) -> real_frame_0000 to real_frame_0089
  // Scene 2: 90 to 179 (t 3.0s to 6.0s) -> real_frame_0090 to real_frame_0179
  // Scene 3: 180 to 299 (t 6.0s to 10.0s) -> real_frame_0180 to real_frame_0299
  // Scene 4: 300 to 419 (t 10.0s to 14.0s) -> real shot & swish (real_frame_0300 to 0324 paced across 120 frames)
  // Scene 5: 420 to 479 (t 14.0s to 16.0s) -> real upload progress & complete (real_frame_0325 to 0370 across 60 frames)
  // Scene 6: 480 to 599 (t 16.0s to 20.0s) -> final CTA

  for (let i = 0; i < TOTAL_FRAMES; i++) {
    let dataUrl = '';
    if (i < 480) {
      let sourceFrameIndex = i;
      if (i >= 300 && i < 420) {
        // Scene 4: Make the shot (emphasized smooth shot & net swish)
        const p = (i - 300) / 120; // 0 to 1
        sourceFrameIndex = Math.min(324, Math.round(300 + p * 24));
      } else if (i >= 420 && i < 480) {
        // Scene 5: Upload complete (progress bar 0% -> 100% and completion badge)
        const p = (i - 420) / 60; // 0 to 1
        sourceFrameIndex = Math.min(370, Math.round(325 + p * 45));
      }

      const realFrameNum = String(sourceFrameIndex).padStart(4, '0');
      const realFramePath = path.join(REAL_FRAMES_DIR, `real_frame_${realFrameNum}.png`);
      const base64 = fs.readFileSync(realFramePath).toString('base64');
      dataUrl = `data:image/png;base64,${base64}`;
    }

    // Call drawFrame on browser canvas
    await send('Runtime.evaluate', {
      expression: `window.drawFrame(${i}, "${dataUrl}")`,
      awaitPromise: true,
    });

    // Capture frame screenshot
    const shot = await send('Page.captureScreenshot', {
      format: 'png',
      fromSurface: true,
    });

    const frameNum = String(i).padStart(4, '0');
    fs.writeFileSync(path.join(OUTPUT_DIR, `frame_${frameNum}.png`), Buffer.from(shot.data, 'base64'));

    if ((i + 1) % 50 === 0 || i === TOTAL_FRAMES - 1) {
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
      console.log(`[Frame ${i + 1}/${TOTAL_FRAMES}] Rendered (${elapsed}s elapsed)`);
    }
  }

  console.log('All 600 frames rendered successfully!');
  chrome.kill();
  process.exit(0);
}

renderFinalAd().catch(err => {
  console.error('Rendering failed:', err);
  process.exit(1);
});
