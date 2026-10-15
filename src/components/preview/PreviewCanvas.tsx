import React, { useEffect, useRef, useState } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  Crosshair,
  Maximize2,
  Sparkles,
} from 'lucide-react';
import { useEditorStore } from '../../stores/editorStore';
import { canvasRenderer } from '../../engine/renderer/canvasRenderer';
import { getFrameCompositionInfo } from '../../engine/video/videoExporter';
import { fontManager } from '../../engine/fonts/fontManager';
import { soundManager } from '../../engine/audio/soundManager';

export const PreviewCanvas: React.FC = () => {
  const {
    canvasWidth,
    canvasHeight,
    aspectRatio,
    compositions,
    currentCompositionIndex,
    setCurrentCompositionIndex,
    isPlaying,
    setIsPlaying,
    currentTime,
    setCurrentTime,
    restartPlayback,
    stepComposition,
    background,
    effects,
    animation,
    sound,
    anchor,
    setAnchor,
  } = useEditorStore();

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Playback animation loop refs to keep 60fps loop independent of React state updates
  const animFrameIdRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(performance.now());
  const currentTimeRef = useRef<number>(currentTime);
  const isPlayingRef = useRef<boolean>(isPlaying);
  const soundRef = useRef(sound);
  const lastPlayedCompIndexRef = useRef<number>(-1);

  useEffect(() => {
    soundRef.current = sound;
  }, [sound]);

  // Live performance stats
  const [liveFps, setLiveFps] = useState<number>(30);
  const fpsFrameCountRef = useRef<number>(0);
  const fpsLastSampleRef = useRef<number>(performance.now());

  // Keep refs in sync
  useEffect(() => {
    currentTimeRef.current = currentTime;
  }, [currentTime]);

  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);

  // Pre-load fonts when compositions change
  useEffect(() => {
    const families = Array.from(
      new Set(compositions.flatMap((c) => c.elements.map((el) => el.fontFamily)))
    );
    fontManager.ensureFontsLoaded(families);
  }, [compositions]);

  // Responsive internal preview size (540x960 for 9:16 preview, high performance)
  const previewScale = 0.5; // Half of 1080x1920
  const previewWidth = Math.round(canvasWidth * previewScale);
  const previewHeight = Math.round(canvasHeight * previewScale);

  // Calculate total duration
  const totalDuration = compositions.reduce((sum, c) => sum + c.duration, 0) || 1;

  // Single-frame draw helper
  const drawFrame = (time: number) => {
    const canvas = canvasRef.current;
    if (!canvas || compositions.length === 0) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { currentComp, nextComp, transitionProgress, compositionIndex } =
      getFrameCompositionInfo(compositions, time, animation.transitionDuration);

    if (compositionIndex !== currentCompositionIndex) {
      setCurrentCompositionIndex(compositionIndex);
    }

    // Play synced audio transition sound on each cut
    if (isPlayingRef.current && compositionIndex !== lastPlayedCompIndexRef.current) {
      lastPlayedCompIndexRef.current = compositionIndex;
      if (soundRef.current.enabled && soundRef.current.effect !== 'none') {
        soundManager.playCutSound(soundRef.current.effect, soundRef.current.volume);
      }
    }

    // Canvas scaling to match preview resolution
    ctx.save();
    ctx.scale(previewScale, previewScale);

    canvasRenderer.render(canvas, ctx, {
      composition: currentComp,
      nextComposition: nextComp,
      transitionProgress,
      transitionType: animation.transition,
      background,
      effects,
      showAnchorIndicator: anchor.showAnchorIndicator,
      isExport: false,
      width: canvasWidth,
      height: canvasHeight,
    });

    ctx.restore();
  };

  // Main animation loop
  useEffect(() => {
    const loop = (timestamp: number) => {
      const deltaSec = (timestamp - lastTimeRef.current) / 1000;
      lastTimeRef.current = timestamp;

      // FPS tracking
      fpsFrameCountRef.current++;
      if (timestamp - fpsLastSampleRef.current >= 600) {
        const measured = Math.round(
          (fpsFrameCountRef.current * 1000) / (timestamp - fpsLastSampleRef.current)
        );
        setLiveFps(measured);
        fpsFrameCountRef.current = 0;
        fpsLastSampleRef.current = timestamp;
      }

      if (isPlayingRef.current && totalDuration > 0) {
        let nextTime = currentTimeRef.current + deltaSec * animation.speedMultiplier;
        if (nextTime >= totalDuration) {
          nextTime = 0; // Loop playback seamlessly
          lastPlayedCompIndexRef.current = -1;
        }
        currentTimeRef.current = nextTime;
        drawFrame(nextTime);
      } else {
        drawFrame(currentTimeRef.current);
      }

      animFrameIdRef.current = requestAnimationFrame(loop);
    };

    lastTimeRef.current = performance.now();
    animFrameIdRef.current = requestAnimationFrame(loop);

    return () => {
      if (animFrameIdRef.current) {
        cancelAnimationFrame(animFrameIdRef.current);
      }
    };
  }, [
    compositions,
    background,
    effects,
    animation,
    anchor.showAnchorIndicator,
    canvasWidth,
    canvasHeight,
    totalDuration,
  ]);

  // Format seconds into MM:SS.SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = (seconds % 60).toFixed(1);
    return `${mins < 10 ? '0' : ''}${mins}:${parseFloat(secs) < 10 ? '0' : ''}${secs}`;
  };

  // Keyboard shortcuts (Space: play/pause, R: restart, Left/Right: step)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing in input or textarea
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return;

      if (e.code === 'Space') {
        e.preventDefault();
        setIsPlaying(!isPlayingRef.current);
      } else if (e.key === 'r' || e.key === 'R') {
        e.preventDefault();
        restartPlayback();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        stepComposition(-1);
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        stepComposition(1);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setIsPlaying, restartPlayback, stepComposition]);

  return (
    <div
      ref={containerRef}
      className="flex-1 flex flex-col items-center justify-center p-3 sm:p-6 bg-[#090b0e] relative overflow-hidden select-none"
    >
      {/* Subtle background ambient blur */}
      <div className="absolute inset-0 bg-radial-gradient pointer-events-none opacity-40" />

      {/* Canvas Frame Wrapper with Aspect Ratio */}
      <div
        className="relative flex items-center justify-center max-h-[82vh] max-w-full rounded-2xl overflow-hidden shadow-2xl shadow-black/80 border border-[#232936] bg-[#000000] group"
        style={{
          aspectRatio: aspectRatio === '9:16' ? '9/16' : aspectRatio === '1:1' ? '1/1' : '16/9',
          height: '100%',
        }}
      >
        <canvas
          ref={canvasRef}
          width={previewWidth}
          height={previewHeight}
          className="w-full h-full object-contain pointer-events-auto"
        />

        {/* Top Overlay HUD */}
        <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <div className="flex items-center gap-1.5 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/10 text-[11px] font-mono text-slate-200">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>{liveFps} FPS</span>
            <span className="text-slate-500">|</span>
            <span>{aspectRatio}</span>
          </div>

          <div className="flex items-center gap-1 pointer-events-auto">
            {/* Toggle Anchor Crosshair */}
            <button
              onClick={() =>
                setAnchor({ showAnchorIndicator: !anchor.showAnchorIndicator })
              }
              className={`p-1.5 rounded-full backdrop-blur-md border transition-all ${
                anchor.showAnchorIndicator
                  ? 'bg-blue-600/80 border-blue-400 text-white'
                  : 'bg-black/60 border-white/10 text-slate-300 hover:text-white'
              }`}
              title="Toggle Anchor Crosshair Marker"
            >
              <Crosshair className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Center Click-to-Play Overlay */}
        <button
          onClick={() => setIsPlaying(!isPlaying)}
          className="absolute inset-0 w-full h-full flex items-center justify-center bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <div className="w-14 h-14 rounded-full bg-black/60 backdrop-blur-md border border-white/20 flex items-center justify-center text-white shadow-xl hover:scale-110 active:scale-95 transition-transform">
            {isPlaying ? (
              <Pause className="w-6 h-6 fill-white" />
            ) : (
              <Play className="w-6 h-6 fill-white ml-0.5" />
            )}
          </div>
        </button>

        {/* Bottom Floating Transport Controls Bar */}
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-black/75 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/15 text-white shadow-xl opacity-90 hover:opacity-100 transition-opacity">
          <button
            onClick={() => stepComposition(-1)}
            className="p-1 hover:text-blue-400 transition-colors"
            title="Previous Cut (Left Arrow)"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="p-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-full transition-transform active:scale-95"
            title="Play/Pause (Space)"
          >
            {isPlaying ? (
              <Pause className="w-3.5 h-3.5 fill-white" />
            ) : (
              <Play className="w-3.5 h-3.5 fill-white ml-0.5" />
            )}
          </button>

          <button
            onClick={() => stepComposition(1)}
            className="p-1 hover:text-blue-400 transition-colors"
            title="Next Cut (Right Arrow)"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          <button
            onClick={restartPlayback}
            className="p-1 hover:text-blue-400 transition-colors"
            title="Restart (R)"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          <div className="h-3 w-px bg-white/20 mx-1" />

          {/* Time & Cut Counters */}
          <div className="flex items-center gap-2 font-mono text-[11px] text-slate-300">
            <span>
              {formatTime(currentTimeRef.current)} / {formatTime(totalDuration)}
            </span>
            <span className="px-1.5 py-0.5 rounded bg-white/10 text-[10px] font-sans font-medium text-slate-300">
              Cut {currentCompositionIndex + 1}/{compositions.length}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
