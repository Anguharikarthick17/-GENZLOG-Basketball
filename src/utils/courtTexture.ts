import * as THREE from 'three';

/**
 * Creates a clean, warm-grey miniature basketball court texture with subtle markings.
 */
export function createCourtTexture(): THREE.CanvasTexture {
  const size = 1024;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  // Warm light grey court surface
  ctx.fillStyle = '#E3DED8';
  ctx.fillRect(0, 0, size, size);

  // Subtle studio court line markings
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.65)';
  ctx.lineWidth = 6;
  ctx.lineCap = 'round';

  // Key / Paint Area (rectangle leading toward the hoop)
  const keyWidth = 320;
  const keyHeight = 440;
  const keyX = (size - keyWidth) / 2;
  const keyY = 60;

  // Key fill (slightly tinted warm neutral)
  ctx.fillStyle = 'rgba(220, 215, 209, 0.4)';
  ctx.fillRect(keyX, keyY, keyWidth, keyHeight);

  // Key outline
  ctx.strokeRect(keyX, keyY, keyWidth, keyHeight);

  // Free throw line & circle
  ctx.beginPath();
  ctx.arc(size / 2, keyY + keyHeight, keyWidth / 2, 0, Math.PI);
  ctx.stroke();

  // Free throw dashed top half
  ctx.setLineDash([12, 12]);
  ctx.beginPath();
  ctx.arc(size / 2, keyY + keyHeight, keyWidth / 2, Math.PI, 0);
  ctx.stroke();
  ctx.setLineDash([]);

  // Restricted area arc beneath hoop
  ctx.beginPath();
  ctx.arc(size / 2, keyY + 110, 80, 0, Math.PI * 2);
  ctx.stroke();

  // Three-point arc (subtle outer curve)
  ctx.beginPath();
  ctx.arc(size / 2, keyY + 70, 480, 0.25 * Math.PI, 0.75 * Math.PI);
  ctx.stroke();

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}
