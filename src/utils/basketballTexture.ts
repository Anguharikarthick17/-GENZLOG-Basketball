import * as THREE from 'three';

/**
 * Generates an authentic basketball texture with natural leather grain and dark seams.
 * Uses procedural 2D Canvas rendering - zero external asset dependencies.
 */
export function createBasketballTexture(): { map: THREE.CanvasTexture; bumpMap: THREE.CanvasTexture } {
  const width = 1024;
  const height = 512;

  // 1. Color Map Canvas
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;

  // Base orange leather gradient
  const baseGrad = ctx.createLinearGradient(0, 0, width, height);
  baseGrad.addColorStop(0, '#E06B26');
  baseGrad.addColorStop(0.5, '#D5621F');
  baseGrad.addColorStop(1, '#C25215');
  ctx.fillStyle = baseGrad;
  ctx.fillRect(0, 0, width, height);

  // Micro-pebble grain noise
  const imgData = ctx.getImageData(0, 0, width, height);
  const data = imgData.data;
  for (let i = 0; i < data.length; i += 4) {
    const noise = (Math.random() - 0.5) * 16;
    data[i] = Math.min(255, Math.max(0, data[i] + noise));
    data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + noise * 0.8));
    data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + noise * 0.5));
  }
  ctx.putImageData(imgData, 0, 0);

  // 2. Bump Map Canvas for physical pebble texture & recessed seams
  const bumpCanvas = document.createElement('canvas');
  bumpCanvas.width = width;
  bumpCanvas.height = height;
  const bumpCtx = bumpCanvas.getContext('2d')!;
  bumpCtx.fillStyle = '#808080';
  bumpCtx.fillRect(0, 0, width, height);

  // Draw dark recessed basketball seams on both canvases
  const drawSeams = (targetCtx: CanvasRenderingContext2D, isBump: boolean) => {
    targetCtx.strokeStyle = isBump ? '#202020' : '#1C130E';
    targetCtx.lineWidth = 8;
    targetCtx.lineCap = 'round';
    targetCtx.lineJoin = 'round';

    // Horizontal equator seam
    targetCtx.beginPath();
    targetCtx.moveTo(0, height / 2);
    targetCtx.lineTo(width, height / 2);
    targetCtx.stroke();

    // Vertical meridian seams
    targetCtx.beginPath();
    targetCtx.moveTo(width / 4, 0);
    targetCtx.lineTo(width / 4, height);
    targetCtx.moveTo((3 * width) / 4, 0);
    targetCtx.lineTo((3 * width) / 4, height);
    targetCtx.stroke();

    // Curved parabolic seams
    // Left hemisphere curve
    targetCtx.beginPath();
    targetCtx.ellipse(width / 4, height / 2, width / 7, height / 2.3, 0, 0, Math.PI * 2);
    targetCtx.stroke();

    // Right hemisphere curve
    targetCtx.beginPath();
    targetCtx.ellipse((3 * width) / 4, height / 2, width / 7, height / 2.3, 0, 0, Math.PI * 2);
    targetCtx.stroke();
  };

  drawSeams(ctx, false);
  drawSeams(bumpCtx, true);

  const map = new THREE.CanvasTexture(canvas);
  map.colorSpace = THREE.SRGBColorSpace;
  map.wrapS = THREE.RepeatWrapping;
  map.wrapT = THREE.ClampToEdgeWrapping;

  const bumpMap = new THREE.CanvasTexture(bumpCanvas);
  bumpMap.wrapS = THREE.RepeatWrapping;
  bumpMap.wrapT = THREE.ClampToEdgeWrapping;

  return { map, bumpMap };
}
