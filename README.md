# MatchType — Kinetic Text Match Cut Video Studio

> **"Make words hit the same spot."**  
> A high-performance, browser-based kinetic typography video generator inspired by modern TikTok, Instagram Reels, and YouTube Shorts dynamic match cuts.

---

## Overview

**MatchType** takes a sentence or multi-line script, lets you designate any word or phrase as the **MATCH WORD**, and deterministically generates rapidly changing typography compositions where:
1. Surrounding words, scales, layout hierarchies, and alignments change dynamically across cuts.
2. The selected **MATCH WORD** remains visually locked to the exact same screen anchor point (with sub-pixel stability).
3. Transitions (hard cut, glitch, flash, zoom pulse, blur, crossfade) and visual post-processing (vignette, film grain, chromatic aberration, glow) produce a kinetic video ready for social channels.
4. Export renders directly to **MP4** (H.264) or **WebM** (VP8/VP9) entirely inside the client using **WebCodecs** hardware acceleration, with automated streaming canvas fallback.

---

## Key Features

- **Sub-Pixel Anchor Engine**: Calculates font ascents, descents, alignments, and visual centers to guarantee the match word never drifts, regardless of font family or scale.
- **12 Dynamic Layout Engines**:
  - `Center Stack`: Classic balanced kinetic stack.
  - `Editorial Left`: Asymmetric left-aligned magazine layout.
  - `Editorial Right`: High-contrast right-aligned typography.
  - `Huge Typography`: Dominant display match word with micro subtitle tracking.
  - `Scattered Typography`: Floating, dynamic angled kinetic phrases.
  - `Swiss Magazine Layout`: Headline and kicker editorial hierarchy.
  - `Minimal Layout`: Expansive whitespace with elegant tracking.
  - `Vertical Typography`: Column-based vertical rhythm.
  - `Split-Screen Focus`: Dual-tone division anchored at the center.
  - `Fullscreen Word`: Maximal canvas punch.
  - `Random Controlled`: Seeded algorithmic variations.
  - `Kinetic`: High-energy social-video style with heavy uppercase punch.
- **Hardware WebCodecs Video Export**:
  - Export real 720p, 1080p, and 1440p videos in **9:16**, **1:1**, or **16:9**.
  - Frame-by-frame encoding with `mp4-muxer` and `webm-muxer`.
  - Non-blocking export pipeline with live progress (0% → 100%).
  - Graceful fallback to `MediaRecorder` on unsupported browsers.
- **Deterministic Seeded Randomness**:
  - Mulberry32 PRNG ensures that identical seeds produce 100% reproducible frame sequences and exports.
- **Live Real-Time Preview**:
  - Canvas preview running at 60 FPS independent of React re-render cycles.
  - Live FPS measurement, timecode scrub bar, and transport controls.
- **Project Serialization & History**:
  - Full Undo / Redo support (`Ctrl+Z`, `Ctrl+Shift+Z`).
  - Import / Export JSON projects with strict schema validation.
  - Auto-persistence with `localStorage`.

---

## Architecture Overview

```
                 ┌───────────────────┐
                 │    React Editor   │
                 │   (Zustand Store) │
                 └─────────┬─────────┘
                           │
                           ▼
                 ┌───────────────────┐
                 │  MatchCut Engine  │
                 │ ───────────────── │
                 │ • Text Slicer     │
                 │ • Layouts (x12)   │
                 │ • Anchor Locking  │
                 │ • Validator       │
                 └─────────┬─────────┘
                           │
                           ▼
                    Composition[]
                           │
                           ▼
                 ┌───────────────────┐
                 │  Canvas Renderer  │
                 │ ───────────────── │
                 │ • Typography Draw │
                 │ • Transitions     │
                 │ • Post-Processing │
                 └──────┬─────┬──────┘
                        │     │
         Live Preview   │     │   Full Resolution Export
                        ▼     ▼
                HTML Canvas   WebCodecs VideoEncoder
                              │
                              ▼
                         MP4 / WebM Muxer
```

### Rendering Architecture
- **Preview Canvas**: Decoupled from React lifecycle using `requestAnimationFrame`. Renders at half resolution (e.g. 540×960) for low-overhead 60 FPS playback.
- **Export Pipeline**: Dedicated offscreen canvas renders at full export resolution (e.g. 1080×1920 or 1440×2560). Each frame is converted into a `VideoFrame` and submitted to the hardware encoder.
- **Font Manager**: Asynchronously loads and measures fonts using `document.fonts.ready` and caches measured text metrics for instant lookups.

---

## Getting Started

### Prerequisites
- Node.js 18+ (tested on Node v24.19.0)
- npm or pnpm

### Installation
```bash
git clone <repo-url>
cd matchcut
npm install
```

### Development
Start the local development server:
```bash
npm run dev
```
Open `http://localhost:3000` in your browser.

### Running Tests
Execute the unit test suite with Vitest:
```bash
npm run test
```

### Building for Production
Create the production build:
```bash
npm run build
```

Preview the production build locally:
```bash
npm run preview
```

---

## Keyboard Shortcuts

| Shortcut | Action |
| :--- | :--- |
| `Space` | Play / Pause playback |
| `R` | Restart animation from beginning |
| `←` (Left Arrow) | Step to previous cut |
| `→` (Right Arrow) | Step to next cut |
| `Ctrl + Z` / `Cmd + Z` | Undo |
| `Ctrl + Shift + Z` / `Cmd + Shift + Z` | Redo |

---

## Exporting a Video

1. In the Top Bar, click **Export** (or trigger from the editor).
2. Select your desired settings:
   - **Format**: MP4 (H.264) or WebM (VP8/VP9)
   - **Resolution**: 720p, 1080p, or 1440p
   - **Framerate**: 24, 30, or 60 FPS
3. Click **Start Render & Export**.
4. The engine encodes the frames offscreen without freezing the UI.
5. When complete, the video file automatically downloads to your browser's Downloads directory.

---

## Browser Compatibility

| Feature | Chrome / Edge | Safari (16.4+) | Firefox | Mobile Chrome / Safari |
| :--- | :--- | :--- | :--- | :--- |
| Canvas Preview | Full | Full | Full | Full |
| WebCodecs MP4 Export | Full (Hardware) | Supported (16.4+) | MediaRecorder Fallback | Supported |
| WebCodecs WebM Export | Full (Hardware) | MediaRecorder Fallback | MediaRecorder Fallback | Supported |
| Touch / Responsive Controls | Full | Full | Full | Full |

---

## Known Limitations & Considerations
- **Font Glyph Loading**: When using custom web fonts, measurements are performed after the font asset is downloaded; initial render may take a moment on slower network connections.
- **Very Long Paragraphs**: Slicing algorithms are optimized for short-to-medium scripts (1 to 50 words) typically used in kinetic social videos.
- **Safari WebCodecs Restrictions**: Older Safari versions (< 16.4) automatically use the Canvas `MediaRecorder` fallback stream.

---

## Future Improvements
- Audio waveform synchronization & beat-matching kinetic cuts to uploaded audio tracks.
- Direct export presets optimized for TikTok, Instagram Reels, and YouTube Shorts.
- Custom font upload (.ttf, .otf, .woff2) with drag-and-drop support.
