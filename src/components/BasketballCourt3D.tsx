import React, { useRef, useEffect, useState, useCallback } from 'react';
import * as THREE from 'three';
import { createBasketballTexture } from '../utils/basketballTexture';
import { createCourtTexture } from '../utils/courtTexture';
import type { AnimationState, UploadedFileItem } from '../types/uploader';
import { soundManager } from '../utils/soundEffects';

interface BasketballCourt3DProps {
  state: AnimationState;
  activeItem?: UploadedFileItem | null;
  onFileSelectClick: () => void;
  onAimStart?: () => void;
  onAimEnd?: () => void;
  onShotSuccess: () => void;
  onShotMiss: () => void;
  isInteractive?: boolean;
  controlledBallPos?: { x: number; y: number; z: number };
  controlledAimTarget?: { x: number; y: number; z: number };
  controlledTrajectory?: boolean;
  controlledNetSwish?: number;
}

export const BasketballCourt3D: React.FC<BasketballCourt3DProps> = ({
  state,
  activeItem,
  onFileSelectClick,
  onAimStart,
  onAimEnd,
  onShotSuccess,
  onShotMiss,
  isInteractive = true,
  controlledBallPos,
  controlledAimTarget,
  controlledTrajectory,
  controlledNetSwish,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [useFallback, setUseFallback] = useState(false);
  const animFrameIdRef = useRef<number | null>(null);

  // Floating file document badge coordinates
  const [ballScreenPos, setBallScreenPos] = useState<{ x: number; y: number } | null>(null);
  const lastScreenPosRef = useRef<{ x: number; y: number } | null>(null);

  // Three.js instances ref
  const sceneRefs = useRef<{
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    renderer: THREE.WebGLRenderer;
    ball: THREE.Mesh;
    ballShadow: THREE.Mesh;
    hoopGroup: THREE.Group;
    rimMesh: THREE.Mesh;
    netGroup: THREE.Group;
    trajectoryDots: THREE.InstancedMesh;
    isShooting: boolean;
    isSwishing: boolean;
    isBouncingMiss: boolean;
    swishTime: number;
    ballPos: THREE.Vector3;
    defaultPos: THREE.Vector3;
    aimTarget: THREE.Vector3;
    controlPoint: THREE.Vector3;
    raycaster: THREE.Raycaster;
    courtPlane: THREE.Plane;
    isDragging: boolean;
    pointerDownPos: { x: number; y: number };
    pointerDownTime: number;
    lastPointerX: number;
    dragVelocityX: number;
  } | null>(null);

  // Court Playable Boundaries
  const COURT_BOUNDS = {
    xMin: -2.0,
    xMax: 2.0,
    zMin: 0.6,
    zMax: 3.1,
  };

  const RIM_CENTER = new THREE.Vector3(0, 1.71, -0.52);

  // Helper to calculate trajectory control point & apex
  const computeBezierControl = (start: THREE.Vector3, target: THREE.Vector3) => {
    const dx = target.x - start.x;
    const dz = target.z - start.z;
    const dist = Math.hypot(dx, dz);
    const apexY = Math.max(2.85, 1.85 + dist * 0.42);

    const controlX = (start.x + target.x) / 2;
    const controlZ = (start.z + target.z) / 2;
    const controlY = 2 * apexY - 0.5 * (start.y + target.y);

    return new THREE.Vector3(controlX, controlY, controlZ);
  };

  // Update Trajectory Preview Dots
  const updateTrajectoryDots = useCallback(() => {
    const refs = sceneRefs.current;
    if (!refs) return;
    const { trajectoryDots, ballPos, aimTarget } = refs;

    const control = computeBezierControl(ballPos, aimTarget);
    refs.controlPoint.copy(control);

    const count = 14;
    const dummy = new THREE.Object3D();

    for (let i = 0; i < count; i++) {
      const t = (i + 1) / (count + 1);
      const x = (1 - t) * (1 - t) * ballPos.x + 2 * (1 - t) * t * control.x + t * t * aimTarget.x;
      const y = (1 - t) * (1 - t) * ballPos.y + 2 * (1 - t) * t * control.y + t * t * aimTarget.y;
      const z = (1 - t) * (1 - t) * ballPos.z + 2 * (1 - t) * t * control.z + t * t * aimTarget.z;

      dummy.position.set(x, y, z);
      dummy.updateMatrix();
      trajectoryDots.setMatrixAt(i, dummy.matrix);
    }

    trajectoryDots.instanceMatrix.needsUpdate = true;
    trajectoryDots.visible = true;
  }, []);

  const hideTrajectoryDots = useCallback(() => {
    const refs = sceneRefs.current;
    if (refs) {
      refs.trajectoryDots.visible = false;
    }
  }, []);

  // Execute Shot Launch (Follows preview trajectory exactly)
  const executeShot = useCallback(() => {
    if (useFallback) return;

    const refs = sceneRefs.current;
    if (!refs || refs.isShooting) return;

    refs.isShooting = true;
    refs.isDragging = false;
    hideTrajectoryDots();
    soundManager.playWhoosh();

    const { ball, ballShadow, ballPos, aimTarget, controlPoint, rimMesh } = refs;
    const startPos = ballPos.clone();
    const target = aimTarget.clone();
    const control = controlPoint.clone();

    // Check hit vs miss based on target alignment with rim
    const isHit = Math.abs(target.x - RIM_CENTER.x) <= 0.35;

    const dx = target.x - startPos.x;
    const dz = target.z - startPos.z;
    const dist = Math.hypot(dx, dz);
    const flightDuration = Math.min(950, Math.max(680, 600 + dist * 70));
    const startTime = performance.now();

    const animateFlight = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / flightDuration);

      if (progress < 1) {
        const t = progress;
        // Exact Quadratic Bezier formula
        ball.position.x = (1 - t) * (1 - t) * startPos.x + 2 * (1 - t) * t * control.x + t * t * target.x;
        ball.position.y = (1 - t) * (1 - t) * startPos.y + 2 * (1 - t) * t * control.y + t * t * target.y;
        ball.position.z = (1 - t) * (1 - t) * startPos.z + 2 * (1 - t) * t * control.z + t * t * target.z;

        // Natural backspin & directional spin
        ball.rotation.x -= 0.18;
        ball.rotation.y += (target.x - startPos.x) * 0.04;

        ballShadow.position.x = ball.position.x;
        ballShadow.position.z = ball.position.z;
        ballShadow.scale.setScalar(Math.max(0.3, 1 - ball.position.y * 0.22));

        requestAnimationFrame(animateFlight);
      } else {
        if (isHit) {
          // --- SUCCESSFUL BASKET ---
          soundManager.playSwish();
          refs.isSwishing = true;
          refs.swishTime = 0;

          // Ball drops cleanly through net
          const dropStartTime = performance.now();
          const dropDuration = 380;
          const dropFloorY = 0.36;

          const animateDrop = (nowDrop: number) => {
            const dropElapsed = nowDrop - dropStartTime;
            const dropT = Math.min(1, dropElapsed / dropDuration);

            ball.position.x = target.x;
            ball.position.z = target.z + dropT * 0.18;
            ball.position.y = target.y - dropT * (target.y - dropFloorY);

            ballShadow.position.x = ball.position.x;
            ballShadow.position.z = ball.position.z;
            ballShadow.scale.setScalar(0.4 + dropT * 0.6);

            if (dropT < 1) {
              requestAnimationFrame(animateDrop);
            } else {
              ball.position.y = dropFloorY;
              refs.ballPos.copy(ball.position);
              refs.isShooting = false;
              onShotSuccess();
            }
          };

          requestAnimationFrame(animateDrop);
        } else {
          // --- MISSED SHOT ---
          soundManager.playRimBounce();
          // Rim shudder
          rimMesh.position.y = 1.83;
          setTimeout(() => {
            rimMesh.position.y = 1.85;
          }, 120);

          // Ball bounces off rim ring onto court floor
          const missStartTime = performance.now();
          const missDuration = 520;
          const bounceStartX = target.x;
          const bounceStartY = target.y;
          const bounceStartZ = target.z;
          const bounceEndX = target.x + (target.x >= 0 ? 0.65 : -0.65);
          const bounceEndZ = target.z + 0.85;

          const animateMiss = (nowMiss: number) => {
            const missElapsed = nowMiss - missStartTime;
            const missT = Math.min(1, missElapsed / missDuration);

            ball.position.x = bounceStartX + missT * (bounceEndX - bounceStartX);
            ball.position.z = bounceStartZ + missT * (bounceEndZ - bounceStartZ);
            // Parabolic bounce off rim
            ball.position.y = bounceStartY + Math.sin(missT * Math.PI) * 0.45 - missT * (bounceStartY - 0.36);

            ball.rotation.x += 0.12;
            ball.rotation.z += 0.08;

            ballShadow.position.x = ball.position.x;
            ballShadow.position.z = ball.position.z;
            ballShadow.scale.setScalar(0.4 + missT * 0.6);

            if (missT < 1) {
              requestAnimationFrame(animateMiss);
            } else {
              ball.position.y = 0.36;
              refs.ballPos.copy(ball.position);
              refs.isShooting = false;
              onShotMiss();
            }
          };

          requestAnimationFrame(animateMiss);
        }
      }
    };

    requestAnimationFrame(animateFlight);
  }, [useFallback, hideTrajectoryDots, onShotSuccess, onShotMiss]);

  // Initialize Three.js
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Test WebGL
    try {
      const testCanvas = document.createElement('canvas');
      const gl = testCanvas.getContext('webgl2') || testCanvas.getContext('webgl');
      if (!gl) {
        setUseFallback(true);
        return;
      }
    } catch {
      setUseFallback(true);
      return;
    }

    const width = container.clientWidth || 440;
    const height = container.clientHeight || 320;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: true,
        powerPreference: 'high-performance',
        alpha: false,
      });
    } catch {
      setUseFallback(true);
      return;
    }

    // 1. Scene & Camera
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf6f5f2);

    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 50);
    camera.position.set(0, 3.4, 5.8);
    camera.lookAt(0, 1.35, -0.4);

    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    container.appendChild(renderer.domElement);

    // 2. Studio Lighting (Natural, Warm, Zero Neon)
    const ambientLight = new THREE.AmbientLight(0xfaf8f5, 1.25);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xfff5ea, 2.4);
    keyLight.position.set(3.5, 7.5, 4.0);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width = 1024;
    keyLight.shadow.mapSize.height = 1024;
    keyLight.shadow.bias = -0.0003;
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0xe8e2db, 1.1);
    fillLight.position.set(-3.5, 4.5, 2.5);
    scene.add(fillLight);

    // 3. Basketball Court Floor
    const courtTexture = createCourtTexture();
    const courtGeo = new THREE.PlaneGeometry(8, 8);
    const courtMat = new THREE.MeshStandardMaterial({
      map: courtTexture,
      roughness: 0.65,
      metalness: 0.05,
    });
    const courtMesh = new THREE.Mesh(courtGeo, courtMat);
    courtMesh.rotation.x = -Math.PI / 2;
    courtMesh.position.y = 0;
    courtMesh.receiveShadow = true;
    scene.add(courtMesh);

    // 4. Basketball Hoop Assembly
    const hoopGroup = new THREE.Group();
    hoopGroup.position.set(0, -0.15, -1.2);

    // Backboard (Frosted tempered glass)
    const backboardGeo = new THREE.BoxGeometry(2.8, 1.9, 0.06);
    const backboardMat = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      transmission: 0.75,
      opacity: 0.9,
      transparent: true,
      roughness: 0.2,
      ior: 1.5,
    });
    const backboard = new THREE.Mesh(backboardGeo, backboardMat);
    backboard.position.set(0, 2.35, 0);
    backboard.castShadow = true;
    hoopGroup.add(backboard);

    // Backboard Frame
    const frameGeo = new THREE.BoxGeometry(2.86, 1.96, 0.04);
    const frameMat = new THREE.MeshStandardMaterial({
      color: 0xded8d0,
      roughness: 0.5,
    });
    const frame = new THREE.Mesh(frameGeo, frameMat);
    frame.position.set(0, 2.35, -0.02);
    hoopGroup.add(frame);

    // Target Rectangle
    const targetOutlineGeo = new THREE.BoxGeometry(1.05, 0.8, 0.02);
    const targetOutlineMat = new THREE.MeshStandardMaterial({
      color: 0x332f2b,
      roughness: 0.6,
    });
    const targetOutline = new THREE.Mesh(targetOutlineGeo, targetOutlineMat);
    targetOutline.position.set(0, 2.15, 0.035);
    hoopGroup.add(targetOutline);

    // Mounting Bracket
    const bracketGeo = new THREE.BoxGeometry(0.35, 0.25, 0.35);
    const bracketMat = new THREE.MeshStandardMaterial({
      color: 0x423d38,
      roughness: 0.4,
      metalness: 0.3,
    });
    const bracket = new THREE.Mesh(bracketGeo, bracketMat);
    bracket.position.set(0, 1.85, 0.18);
    hoopGroup.add(bracket);

    // Rim (Physical Torus in satin basketball orange)
    const rimGeo = new THREE.TorusGeometry(0.48, 0.04, 16, 40);
    const rimMat = new THREE.MeshStandardMaterial({
      color: 0xc8461d,
      roughness: 0.35,
      metalness: 0.25,
    });
    const rimMesh = new THREE.Mesh(rimGeo, rimMat);
    rimMesh.rotation.x = Math.PI / 2;
    rimMesh.position.set(0, 1.85, 0.68);
    rimMesh.castShadow = true;
    hoopGroup.add(rimMesh);

    // Net Assembly
    const netGroup = new THREE.Group();
    netGroup.position.set(0, 1.85, 0.68);
    const netGeo = new THREE.CylinderGeometry(0.46, 0.24, 0.75, 16, 6, true);
    const netMat = new THREE.MeshStandardMaterial({
      color: 0xf5f3f0,
      roughness: 0.7,
      wireframe: true,
    });
    const netMesh = new THREE.Mesh(netGeo, netMat);
    netMesh.position.y = -0.38;
    netMesh.castShadow = true;
    netGroup.add(netMesh);
    hoopGroup.add(netGroup);
    scene.add(hoopGroup);

    // 5. Realistic 3D Basketball
    const { map: bMap, bumpMap: bBump } = createBasketballTexture();
    const ballGeo = new THREE.SphereGeometry(0.36, 48, 36);
    const ballMat = new THREE.MeshStandardMaterial({
      map: bMap,
      bumpMap: bBump,
      bumpScale: 0.04,
      roughness: 0.6,
      metalness: 0.05,
    });
    const ball = new THREE.Mesh(ballGeo, ballMat);
    const defaultBallPos = new THREE.Vector3(-1.1, 0.36, 1.8);
    ball.position.copy(defaultBallPos);
    ball.castShadow = true;
    scene.add(ball);

    // Ball soft contact shadow
    const shadowGeo = new THREE.CircleGeometry(0.42, 32);
    const shadowMat = new THREE.MeshBasicMaterial({
      color: 0x1f1d1b,
      transparent: true,
      opacity: 0.28,
    });
    const ballShadow = new THREE.Mesh(shadowGeo, shadowMat);
    ballShadow.rotation.x = -Math.PI / 2;
    ballShadow.position.set(defaultBallPos.x, 0.005, defaultBallPos.z);
    scene.add(ballShadow);

    // 6. Trajectory Guide (Subtle, neutral small dots)
    const dotCount = 14;
    const dotGeo = new THREE.SphereGeometry(0.024, 12, 12);
    const dotMat = new THREE.MeshBasicMaterial({
      color: 0x9e9890,
      transparent: true,
      opacity: 0.45,
    });
    const trajectoryDots = new THREE.InstancedMesh(dotGeo, dotMat, dotCount);
    trajectoryDots.visible = false;
    scene.add(trajectoryDots);

    const initialAim = RIM_CENTER.clone();
    const initialControl = computeBezierControl(defaultBallPos, initialAim);

    sceneRefs.current = {
      scene,
      camera,
      renderer,
      ball,
      ballShadow,
      hoopGroup,
      rimMesh,
      netGroup,
      trajectoryDots,
      isShooting: false,
      isSwishing: false,
      isBouncingMiss: false,
      swishTime: 0,
      ballPos: defaultBallPos.clone(),
      defaultPos: defaultBallPos.clone(),
      aimTarget: initialAim,
      controlPoint: initialControl,
      raycaster: new THREE.Raycaster(),
      courtPlane: new THREE.Plane(new THREE.Vector3(0, 1, 0), -0.36),
      isDragging: false,
      pointerDownPos: { x: 0, y: 0 },
      pointerDownTime: 0,
      lastPointerX: 0,
      dragVelocityX: 0,
    };

    const handleResize = () => {
      if (!container || !sceneRefs.current) return;
      const newW = container.clientWidth;
      const newH = container.clientHeight;
      camera.aspect = newW / newH;
      camera.updateProjectionMatrix();
      renderer.setSize(newW, newH);
    };

    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(container);

    // Animation Loop
    let clock = new THREE.Clock();
    const render = () => {
      const delta = clock.getDelta();
      const stateRef = sceneRefs.current;

      if (stateRef) {
        const { ball, ballShadow, rimMesh, netGroup, isShooting, isSwishing, isDragging } = stateRef;

        // Position ball and shadow
        if (controlledBallPos) {
          ball.position.set(controlledBallPos.x, controlledBallPos.y, controlledBallPos.z);
          stateRef.ballPos.set(controlledBallPos.x, controlledBallPos.y, controlledBallPos.z);
          ballShadow.position.set(controlledBallPos.x, 0.005, controlledBallPos.z);
          ballShadow.scale.setScalar(Math.max(0.25, 1 - controlledBallPos.y * 0.22));
          if (controlledAimTarget) {
            stateRef.aimTarget.set(controlledAimTarget.x, controlledAimTarget.y, controlledAimTarget.z);
          }
        } else if (!isShooting && !isDragging) {
          if (state === 'selected' || state === 'aiming') {
            ball.position.y = 0.52 + Math.sin(clock.getElapsedTime() * 4) * 0.04;
            ballShadow.scale.setScalar(0.88);
          } else {
            ball.position.y = 0.36;
            ballShadow.scale.setScalar(1);
          }
          ballShadow.position.x = ball.position.x;
          ballShadow.position.z = ball.position.z;
        }

        // Net and rim reaction animation
        if (controlledNetSwish !== undefined && controlledNetSwish > 0) {
          const t = controlledNetSwish;
          rimMesh.position.y = 1.85 - Math.sin(t * 18) * Math.exp(-t * 5) * 0.08;
          netGroup.scale.set(
            1 + Math.sin(t * 12) * Math.exp(-t * 4) * 0.28,
            1 + Math.sin(t * 14) * Math.exp(-t * 3) * 0.35,
            1 + Math.sin(t * 12) * Math.exp(-t * 4) * 0.28
          );
        } else if (isSwishing) {
          stateRef.swishTime += delta;
          const t = stateRef.swishTime;
          if (t < 0.8) {
            rimMesh.position.y = 1.85 - Math.sin(t * 18) * Math.exp(-t * 5) * 0.08;
            netGroup.scale.set(
              1 + Math.sin(t * 12) * Math.exp(-t * 4) * 0.28,
              1 + Math.sin(t * 14) * Math.exp(-t * 3) * 0.35,
              1 + Math.sin(t * 12) * Math.exp(-t * 4) * 0.28
            );
          } else {
            rimMesh.position.y = 1.85;
            netGroup.scale.set(1, 1, 1);
            stateRef.isSwishing = false;
          }
        }

        // Project ball screen position for the attached document label badge
        if (container) {
          const w = container.clientWidth;
          const h = container.clientHeight;
          const projected = ball.position.clone();
          projected.y += 0.44;
          projected.project(camera);
          const screenX = ((projected.x + 1) * w) / 2;
          const screenY = ((-projected.y + 1) * h) / 2;

          const last = lastScreenPosRef.current;
          if (!last || Math.hypot(screenX - last.x, screenY - last.y) > 0.8) {
            lastScreenPosRef.current = { x: screenX, y: screenY };
            setBallScreenPos({ x: screenX, y: screenY });
          }
        }

        renderer.render(scene, camera);
      }

      animFrameIdRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animFrameIdRef.current) cancelAnimationFrame(animFrameIdRef.current);
      resizeObserver.disconnect();
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  // Sync state changes
  useEffect(() => {
    if (controlledTrajectory !== undefined) {
      if (controlledTrajectory) {
        updateTrajectoryDots();
      } else {
        hideTrajectoryDots();
      }
      return;
    }
    if (state === 'shooting') {
      executeShot();
    } else if (state === 'selected' || state === 'aiming') {
      updateTrajectoryDots();
    } else if (state === 'idle') {
      hideTrajectoryDots();
      if (sceneRefs.current && !sceneRefs.current.isShooting) {
        sceneRefs.current.ball.position.copy(sceneRefs.current.defaultPos);
        sceneRefs.current.ballPos.copy(sceneRefs.current.defaultPos);
        sceneRefs.current.aimTarget.copy(RIM_CENTER);
        sceneRefs.current.ballShadow.position.set(
          sceneRefs.current.defaultPos.x,
          0.005,
          sceneRefs.current.defaultPos.z
        );
      }
    }
  }, [state, controlledTrajectory, executeShot, updateTrajectoryDots, hideTrajectoryDots]);

  // Sync fallback SVG ball position when controlledBallPos is supplied
  useEffect(() => {
    if (controlledBallPos) {
      const svgX = 220 + controlledBallPos.x * 70;
      const baseSvgY = 155 + controlledBallPos.z * 44;
      const svgY = baseSvgY - (controlledBallPos.y - 0.36) * 65;
      setSvgBallPos({ x: svgX, y: svgY });
    }
  }, [controlledBallPos]);

  // Pointer Handlers for Raycasting, Court Aiming, and Click Triggering
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isInteractive || state === 'shooting' || state === 'uploading') return;

    const refs = sceneRefs.current;
    if (!refs) return;

    refs.pointerDownPos = { x: e.clientX, y: e.clientY };
    refs.pointerDownTime = Date.now();
    refs.lastPointerX = e.clientX;
    refs.dragVelocityX = 0;

    // In State A (Idle): Clicking opens file picker
    if (state === 'idle') {
      return;
    }

    // In State B / Aiming / Missed: Start dragging across the playable court
    const rect = e.currentTarget.getBoundingClientRect();
    const ndcX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const ndcY = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    refs.raycaster.setFromCamera(new THREE.Vector2(ndcX, ndcY), refs.camera);
    const hitPoint = new THREE.Vector3();
    if (refs.raycaster.ray.intersectPlane(refs.courtPlane, hitPoint)) {
      refs.isDragging = true;
      e.currentTarget.setPointerCapture(e.pointerId);

      // Clamp to playable court boundaries
      const clampedX = THREE.MathUtils.clamp(hitPoint.x, COURT_BOUNDS.xMin, COURT_BOUNDS.xMax);
      const clampedZ = THREE.MathUtils.clamp(hitPoint.z, COURT_BOUNDS.zMin, COURT_BOUNDS.zMax);

      refs.ball.position.set(clampedX, 0.36, clampedZ);
      refs.ballPos.set(clampedX, 0.36, clampedZ);
      refs.ballShadow.position.set(clampedX, 0.005, clampedZ);

      updateTrajectoryDots();
      onAimStart?.();
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const refs = sceneRefs.current;
    if (!refs || !refs.isDragging) return;

    // Track drag flick velocity
    const dx = e.clientX - refs.lastPointerX;
    refs.dragVelocityX = dx;
    refs.lastPointerX = e.clientX;

    const rect = e.currentTarget.getBoundingClientRect();
    const ndcX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const ndcY = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    refs.raycaster.setFromCamera(new THREE.Vector2(ndcX, ndcY), refs.camera);
    const hitPoint = new THREE.Vector3();
    if (refs.raycaster.ray.intersectPlane(refs.courtPlane, hitPoint)) {
      const clampedX = THREE.MathUtils.clamp(hitPoint.x, COURT_BOUNDS.xMin, COURT_BOUNDS.xMax);
      const clampedZ = THREE.MathUtils.clamp(hitPoint.z, COURT_BOUNDS.zMin, COURT_BOUNDS.zMax);

      refs.ball.position.set(clampedX, 0.36, clampedZ);
      refs.ballPos.set(clampedX, 0.36, clampedZ);
      refs.ballShadow.position.set(clampedX, 0.005, clampedZ);

      // Aim target points directly toward the rim opening
      // If user drags at an extreme side angle, allow slight target deviation
      let aimX = RIM_CENTER.x;
      if (Math.abs(clampedX) > 1.85 && clampedZ < 1.1) {
        // Obstructed side angle behind/beside backboard -> rim edge hit
        aimX = clampedX > 0 ? 0.42 : -0.42;
      }
      refs.aimTarget.set(aimX, RIM_CENTER.y, RIM_CENTER.z);

      updateTrajectoryDots();
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    const refs = sceneRefs.current;
    if (!refs) return;

    const dist = Math.hypot(e.clientX - refs.pointerDownPos.x, e.clientY - refs.pointerDownPos.y);
    const duration = Date.now() - refs.pointerDownTime;

    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }

    // 1. If in State A (idle) and user clicked
    if (state === 'idle') {
      if (dist < 8 && duration < 500) {
        onFileSelectClick();
      }
      return;
    }

    // 2. If user was dragging in aim state
    if (refs.isDragging) {
      refs.isDragging = false;
      onAimEnd?.();

      // Adjust aimTarget if released with strong sideways flick
      if (Math.abs(refs.dragVelocityX) > 14) {
        refs.aimTarget.x = THREE.MathUtils.clamp(refs.dragVelocityX * 0.02, -0.6, 0.6);
      }

      // Releasing drag shoots the ball!
      executeShot();
    } else if (dist < 6 && (state === 'selected' || state === 'aiming' || state === 'missed')) {
      // Tap without drag also shoots
      executeShot();
    }
  };

  const handlePointerCancel = (e: React.PointerEvent<HTMLDivElement>) => {
    const refs = sceneRefs.current;
    if (refs) {
      refs.isDragging = false;
      onAimEnd?.();
    }
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
  };

  // =========================================================================
  // FALLBACK VIEW (High-fidelity Isometric Studio SVG with Free Aiming & Shots)
  // =========================================================================
  const [svgBallPos, setSvgBallPos] = useState({ x: 110, y: 250 });
  const [isSvgDragging, setIsSvgDragging] = useState(false);
  const svgDragStartRef = useRef<{ x: number; y: number; time: number }>({ x: 0, y: 0, time: 0 });

  const SVG_BOUNDS = { xMin: 75, xMax: 365, yMin: 185, yMax: 295 };
  const SVG_HOOP = { x: 220, y: 140 };

  const handleSvgPointerDown = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!isInteractive || state === 'shooting' || state === 'uploading') return;

    svgDragStartRef.current = { x: e.clientX, y: e.clientY, time: Date.now() };

    if (state === 'idle') {
      return;
    }

    setIsSvgDragging(true);
    e.currentTarget.setPointerCapture(e.pointerId);
    onAimStart?.();
  };

  const handleSvgPointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!isSvgDragging || state === 'shooting' || state === 'uploading') return;

    const svg = e.currentTarget;
    const rect = svg.getBoundingClientRect();
    const scaleX = 440 / rect.width;
    const scaleY = 320 / rect.height;

    const currentX = (e.clientX - rect.left) * scaleX;
    const currentY = (e.clientY - rect.top) * scaleY;

    const clampedX = Math.max(SVG_BOUNDS.xMin, Math.min(SVG_BOUNDS.xMax, currentX));
    const clampedY = Math.max(SVG_BOUNDS.yMin, Math.min(SVG_BOUNDS.yMax, currentY));

    setSvgBallPos({ x: clampedX, y: clampedY });
  };

  const handleSvgPointerUp = (e: React.PointerEvent<SVGSVGElement>) => {
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }

    const dist = Math.hypot(e.clientX - svgDragStartRef.current.x, e.clientY - svgDragStartRef.current.time);
    const duration = Date.now() - svgDragStartRef.current.time;

    if (state === 'idle') {
      if (dist < 8 && duration < 500) {
        onFileSelectClick();
      }
      return;
    }

    if (isSvgDragging) {
      setIsSvgDragging(false);
      onAimEnd?.();
      triggerSvgShot();
    } else if (dist < 6) {
      triggerSvgShot();
    }
  };

  const triggerSvgShot = () => {
    soundManager.playWhoosh();
    // Simulate flight to hoop
    setTimeout(() => {
      soundManager.playSwish();
      onShotSuccess();
    }, 750);
  };

  if (useFallback) {
    const isShooting = state === 'shooting';
    const isSwishing = state === 'swish' || state === 'uploading';

    const dx = SVG_HOOP.x - svgBallPos.x;
    const dy = SVG_HOOP.y - svgBallPos.y;
    const midX = (svgBallPos.x + SVG_HOOP.x) / 2;
    const apexY = Math.min(svgBallPos.y, SVG_HOOP.y) - 90;

    return (
      <div
        className="basketball-court-3d-canvas fallback-view"
        role="application"
        aria-label="Realistic 3D Basketball Court"
        tabIndex={0}
      >
        {/* Floating Document Badge */}
        {activeItem && (state === 'selected' || state === 'aiming' || state === 'missed') && (
          <div
            className="ball-document-badge"
            style={{
              left: `${(svgBallPos.x / 440) * 100}%`,
              top: `${((svgBallPos.y - 32) / 320) * 100}%`,
            }}
          >
            <span className={`file-badge-tag tag-${activeItem.category.toLowerCase()}`}>
              {activeItem.category}
            </span>
            <span className="file-badge-name">{activeItem.name}</span>
            <span className="file-badge-size">({activeItem.formattedSize})</span>
          </div>
        )}

        <svg
          viewBox="0 0 440 320"
          className="isometric-court-svg"
          xmlns="http://www.w3.org/2000/svg"
          onPointerDown={handleSvgPointerDown}
          onPointerMove={handleSvgPointerMove}
          onPointerUp={handleSvgPointerUp}
        >
          <defs>
            <radialGradient id="ball-grad" cx="35%" cy="30%" r="65%">
              <stop offset="0%" stopColor="#E06B26" />
              <stop offset="60%" stopColor="#D5621F" />
              <stop offset="100%" stopColor="#9C3A0A" />
            </radialGradient>
            <radialGradient id="contact-shadow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="rgba(31, 29, 27, 0.35)" />
              <stop offset="100%" stopColor="rgba(31, 29, 27, 0)" />
            </radialGradient>
            <filter id="backboard-soft-shadow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="6" stdDeviation="8" floodColor="#221C16" floodOpacity="0.08" />
            </filter>
          </defs>

          {/* Court Floor */}
          <rect width="440" height="320" fill="#F6F5F2" />
          <path
            d="M 40 288 L 400 288 L 340 152 L 100 152 Z"
            fill="#E3DED8"
            stroke="#D0CBC4"
            strokeWidth="1.5"
          />

          {/* Markings */}
          <path
            d="M 175 152 L 265 152 L 290 288 L 150 288 Z"
            fill="rgba(220, 215, 209, 0.45)"
            stroke="#FFFFFF"
            strokeWidth="2"
          />
          <ellipse cx="220" cy="288" rx="70" ry="25" fill="none" stroke="#FFFFFF" strokeWidth="2" />
          <ellipse cx="220" cy="200" rx="35" ry="12" fill="none" stroke="#FFFFFF" strokeWidth="1.5" />

          {/* Dynamic Live Trajectory Curve */}
          {(state === 'selected' || state === 'aiming' || state === 'missed') && (
            <g className="fallback-trajectory">
              <path
                d={`M ${svgBallPos.x} ${svgBallPos.y} Q ${midX} ${apexY} ${SVG_HOOP.x} ${SVG_HOOP.y}`}
                fill="none"
                stroke="#A8A39C"
                strokeWidth="1.8"
                strokeDasharray="4 6"
              />
              <circle
                cx={0.75 * svgBallPos.x + 0.25 * midX}
                cy={0.75 * svgBallPos.y + 0.25 * apexY}
                r="2.5"
                fill="#8F8B85"
              />
              <circle cx={midX} cy={apexY} r="3" fill="#8F8B85" />
              <circle
                cx={0.25 * midX + 0.75 * SVG_HOOP.x}
                cy={0.25 * apexY + 0.75 * SVG_HOOP.y}
                r="2.5"
                fill="#8F8B85"
              />
            </g>
          )}

          {/* Hoop Assembly */}
          <g transform="translate(220, 138)">
            <rect x="-8" y="-45" width="16" height="50" fill="#3D3833" rx="2" />
            <rect
              x="-65"
              y="-75"
              width="130"
              height="85"
              rx="6"
              fill="rgba(255, 255, 255, 0.92)"
              stroke="#D6D1CA"
              strokeWidth="2"
              filter="url(#backboard-soft-shadow)"
            />
            <rect
              x="-28"
              y="-48"
              width="56"
              height="42"
              rx="3"
              fill="none"
              stroke="#2B2723"
              strokeWidth="2.5"
            />
            <ellipse cx="0" cy="5" rx="32" ry="9" fill="none" stroke="#8C2C0E" strokeWidth="4" />

            <g className={`fallback-net ${isSwishing ? 'swishing' : ''}`}>
              <path
                d="M -28 5 L -14 42 C -5 45, 5 45, 14 42 L 28 5 Z"
                fill="rgba(245, 243, 240, 0.4)"
              />
              <path
                d="
                  M -28 5 L -10 22 L -8 40
                  M -18 5 L -2 22 L 0 41
                  M -8 5 L 6 22 L 8 41
                  M 2 5 L 14 22 L 14 41
                  M 12 5 L 22 22
                  M 28 5 L 10 22 L 8 40
                  M 18 5 L 2 22 L 0 41
                  M 8 5 L -6 22 L -8 41
                  M -2 5 L -14 22 L -14 41
                  M -12 5 L -22 22
                "
                stroke="#6B6863"
                strokeWidth="1.2"
                fill="none"
              />
              <ellipse cx="0" cy="41" rx="14" ry="4" fill="none" stroke="#4A4742" strokeWidth="1.5" />
            </g>

            <path
              d="M -32 5 C -32 14, 32 14, 32 5"
              fill="none"
              stroke="#C8461D"
              strokeWidth="4"
              strokeLinecap="round"
            />
          </g>

          {/* Dynamic 3D Basketball & Shadow */}
          <g
            className={`fallback-ball-group ${isShooting ? 'shooting' : ''}`}
            style={{
              transform: isShooting
                ? `translate(${dx}px, ${dy}px) scale(0.7)`
                : `translate(${svgBallPos.x - 95}px, ${svgBallPos.y - 240}px)`,
              transition: isShooting ? 'transform 0.75s cubic-bezier(0.25, 0.46, 0.45, 0.94)' : 'none',
            }}
          >
            <ellipse cx="95" cy="254" rx="20" ry="7" fill="url(#contact-shadow)" />
            <circle cx="95" cy="240" r="18" fill="url(#ball-grad)" />
            <path d="M 77 240 C 85 240, 105 240, 113 240" stroke="#1C130E" strokeWidth="1.6" fill="none" />
            <path d="M 95 222 C 95 230, 95 250, 95 258" stroke="#1C130E" strokeWidth="1.6" fill="none" />
            <path d="M 83 226 C 93 234, 93 246, 83 254" stroke="#1C130E" strokeWidth="1.4" fill="none" />
            <path d="M 107 226 C 97 234, 97 246, 107 254" stroke="#1C130E" strokeWidth="1.4" fill="none" />
          </g>
        </svg>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="basketball-court-3d-canvas"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerCancel}
      role="application"
      aria-label="Interactive 3D Basketball Court"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          if (state === 'idle') {
            onFileSelectClick();
          } else if (state === 'selected' || state === 'aiming' || state === 'missed') {
            executeShot();
          }
        }
      }}
    >
      {/* Floating Document Label Badge directly attached to 3D Basketball */}
      {ballScreenPos && activeItem && (state === 'selected' || state === 'aiming' || state === 'missed') && (
        <div
          className="ball-document-badge"
          style={{
            left: `${ballScreenPos.x}px`,
            top: `${ballScreenPos.y}px`,
          }}
        >
          <span className={`file-badge-tag tag-${activeItem.category.toLowerCase()}`}>
            {activeItem.category}
          </span>
          <span className="file-badge-name">{activeItem.name}</span>
          <span className="file-badge-size">({activeItem.formattedSize})</span>
        </div>
      )}
    </div>
  );
};
