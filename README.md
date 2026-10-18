# GENZLOG — 3D Basketball File Upload (Clean Premium Redesign)

A production-grade, interactive 3D file-upload component for React & TypeScript featuring a realistic basketball court, physical basketball with authentic pebbled leather and dark seams, glass backboard, dimensional rim with hanging net physics, and permanent GENZLOG official branding.

Designed with a warm neutral studio aesthetic (**zero neon, zero RGB glow, zero cyberpunk styling**).

---

## Visual Direction & Color Palette

- **Main Background**: Warm light grey (`#D8D3CD`)
- **Main Surface**: Off-white (`#F8F7F4`)
- **Secondary Surface**: Muted neutral (`#ECE9E4`)
- **Court Surface**: Studio floor grey (`#F6F5F2` with `#E3DED8` lane fill)
- **Primary Text**: Deep slate black (`#111111`)
- **Secondary Text**: Muted stone (`#6B6863`)
- **Borders**: Neutral beige-grey (`#D0CBC4`)
- **Basketball**: Realistic natural leather orange (`#D96222` / `#E06B26`)
- **Basketball Seams**: Recessed dark brown/black (`#221812` / `#1C130E`)
- **Success State**: Restrained green (`#2E7D32`)
- **Error State**: Restrained red (`#C62828`)
- **Branding**: Official black GENZLOG emblem (`/genzlog-logo-black.png`)

---

## 3D Environment & Interactive Features

1. **Official GENZLOG Branding**:
   - Permanently anchored at the top-left of the card.
   - Uses the official high-resolution black vector wordmark from project assets.

2. **Realistic 3D Basketball**:
   - Authentic spherical geometry with procedurally generated high-resolution pebbled rubber texture.
   - Recessed dark curved seams (equator, meridian, and cross-hemisphere arcs).
   - Real-time backspin rotation during shot flight and soft contact shadows on the court floor.

3. **Dimensional Hoop & Backboard**:
   - Tempered frosted glass backboard with clean bevel frame.
   - Inner dark rectangular target.
   - Dimensional torus rim in satin basketball finish.
   - Hanging nylon net with spring deformation physics (swishes and ripples when the ball passes through).

4. **Studio Lighting & Materials**:
   - Natural key light, soft fill light, and ambient illumination with soft PCF shadow mapping.
   - Zero neon underglow, zero electric trails, zero bloom, zero lens flare.

5. **Aim & Shoot Interaction**:
   - Supports dragging the basketball to aim or clicking the "Take Shot" button / pressing Space.
   - Neutral trajectory guide (small understated grey dots).
   - Ball flies along a parabolic arc into the hoop, swishes through the net, and seamlessly initiates upload progress.

6. **Full Upload Lifecycle**:
   - Native OS file picker and drag-and-drop.
   - File size and duplicate detection with animated banner alerts.
   - Smooth progress tracking (0% → 100%) via pluggable `UploadAdapter`.
   - Restrained green completion state with updated "Uploaded {count}" badge.
   - WebGL detection with high-precision isometric fallback if hardware acceleration is unavailable.

---

## Architecture & Files

```
src/
├── components/
│   ├── BasketballUploader.tsx       # Root container, GENZLOG branding, & state machine
│   ├── BasketballUploader.css       # Clean neutral stylesheet with studio shadows
│   ├── BasketballCourt3D.tsx        # Three.js 3D court, lighting, ball & hoop physics
│   ├── UploadDropzone.tsx           # Drop target wrapper with progress overlay
│   ├── UploadProgressItem.tsx       # Neutral progress card, completion & error states
│   ├── UploadStatusMessage.tsx      # Validation error banner
│   └── index.ts                     # Modular barrel export
├── types/
│   └── uploader.ts                  # TypeScript definitions & state machine types
└── utils/
    ├── basketballTexture.ts         # Procedural leather & seam texture generator
    ├── courtTexture.ts              # Studio court markings texture generator
    ├── formatters.ts                # File size & category formatters
    ├── soundEffects.ts              # Web Audio API sound synthesizer
    └── mockUploadAdapter.ts         # Standalone simulated upload adapter
```

---

## Quick Start

```bash
# Install dependencies
npm install

# Start Vite development server
npm run dev

# Run production TypeScript build
npm run build
```
# -GENZLOG-Basketball
