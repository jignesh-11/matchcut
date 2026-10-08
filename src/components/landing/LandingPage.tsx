import React, { useEffect, useRef } from 'react';
import {
  Sparkles,
  ArrowRight,
  Zap,
  Anchor,
  Layers,
  Video,
  Play,
  RotateCcw,
} from 'lucide-react';
import { useEditorStore } from '../../stores/editorStore';
import { canvasRenderer } from '../../engine/renderer/canvasRenderer';
import { getFrameCompositionInfo } from '../../engine/video/videoExporter';
import { fontManager } from '../../engine/fonts/fontManager';

export const LandingPage: React.FC = () => {
  const {
    setCurrentView,
    compositions,
    background,
    effects,
    animation,
    matchWord,
  } = useEditorStore();

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number | null>(null);
  const timeRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(performance.now());

  const totalDuration = compositions.reduce((s, c) => s + c.duration, 0) || 1;

  useEffect(() => {
    const families = Array.from(
      new Set(compositions.flatMap((c) => c.elements.map((el) => el.fontFamily)))
    );
    fontManager.ensureFontsLoaded(families);
  }, [compositions]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const loop = (now: number) => {
      const dt = (now - lastTimeRef.current) / 1000;
      lastTimeRef.current = now;

      timeRef.current = (timeRef.current + dt) % totalDuration;

      const { currentComp, nextComp, transitionProgress } =
        getFrameCompositionInfo(compositions, timeRef.current, animation.transitionDuration);

      // Render at 0.5x internal scale for crisp preview
      ctx.save();
      ctx.scale(0.5, 0.5);

      canvasRenderer.render(canvas, ctx, {
        composition: currentComp,
        nextComposition: nextComp,
        transitionProgress,
        transitionType: animation.transition,
        background,
        effects,
        showAnchorIndicator: false,
        isExport: false,
        width: 1080,
        height: 1920,
      });

      ctx.restore();

      animRef.current = requestAnimationFrame(loop);
    };

    lastTimeRef.current = performance.now();
    animRef.current = requestAnimationFrame(loop);

    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [compositions, background, effects, animation, totalDuration]);

  return (
    <div className="min-h-full bg-[#0d0f14] text-slate-100 flex flex-col justify-between selection:bg-blue-600 selection:text-white relative overflow-x-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-blue-600/10 blur-[130px] rounded-full pointer-events-none" />
      <div className="absolute top-1/3 right-10 w-[400px] h-[400px] bg-indigo-600/10 blur-[120px] rounded-full pointer-events-none" />

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-6 pt-12 pb-16 w-full flex-1 flex flex-col justify-center">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left Text & CTA */}
          <div className="lg:col-span-7 space-y-7">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Next-Gen Kinetic Typography Generator</span>
            </div>

            <div className="space-y-4">
              <h1 className="text-4xl sm:text-6xl xl:text-7xl font-extrabold tracking-tight leading-[1.08] text-white">
                Make words hit the{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-300 to-sky-400 underline decoration-blue-500 decoration-wavy underline-offset-8">
                  same spot.
                </span>
              </h1>
              <p className="text-lg sm:text-xl text-slate-400 max-w-xl font-normal leading-relaxed">
                Generate dynamic, rapidly changing typography cuts where surrounding layouts,
                sizes, and fonts mutate between cuts—while your selected word remains visually
                pinned to the exact same screen position.
              </p>
            </div>

            {/* Feature bullets */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div className="flex items-center gap-2.5 text-xs text-slate-300">
                <div className="w-5 h-5 rounded-md bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0">
                  <Anchor className="w-3 h-3" />
                </div>
                <span>Sub-pixel visual anchor stability</span>
              </div>
              <div className="flex items-center gap-2.5 text-xs text-slate-300">
                <div className="w-5 h-5 rounded-md bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0">
                  <Zap className="w-3 h-3" />
                </div>
                <span>12 kinetic layout algorithms</span>
              </div>
              <div className="flex items-center gap-2.5 text-xs text-slate-300">
                <div className="w-5 h-5 rounded-md bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0">
                  <Video className="w-3 h-3" />
                </div>
                <span>Hardware WebCodecs MP4 export</span>
              </div>
              <div className="flex items-center gap-2.5 text-xs text-slate-300">
                <div className="w-5 h-5 rounded-md bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0">
                  <Layers className="w-3 h-3" />
                </div>
                <span>Deterministic seeded generation</span>
              </div>
            </div>

            {/* Action Button */}
            <div className="pt-4 flex flex-wrap items-center gap-4">
              <button
                onClick={() => setCurrentView('editor')}
                className="flex items-center gap-2.5 px-8 py-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-base shadow-xl shadow-blue-600/30 active:scale-95 transition-all group"
              >
                <span>Create a Match Cut</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>

              <button
                onClick={() => setCurrentView('editor')}
                className="px-6 py-4 rounded-xl bg-[#161a22] hover:bg-[#1f2430] border border-[#272e3b] text-slate-300 hover:text-white font-semibold text-sm transition-colors"
              >
                Open Studio Editor
              </button>
            </div>
          </div>

          {/* Right Live Engine Canvas Preview */}
          <div className="lg:col-span-5 flex flex-col items-center">
            <div className="relative w-full max-w-[340px] aspect-[9/16] rounded-3xl overflow-hidden shadow-2xl shadow-blue-500/10 border-2 border-[#2b3344] bg-black group">
              <canvas
                ref={canvasRef}
                width={540}
                height={960}
                className="w-full h-full object-cover"
              />

              {/* Live badge */}
              <div className="absolute top-4 left-4 bg-black/70 backdrop-blur-md px-3 py-1 rounded-full border border-white/10 flex items-center gap-2 text-[11px] font-mono text-white">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                <span>LIVE ENGINE PREVIEW</span>
              </div>

              {/* Anchored word badge */}
              <div className="absolute bottom-4 left-4 right-4 bg-black/70 backdrop-blur-md px-3 py-2 rounded-xl border border-white/10 flex items-center justify-between text-xs text-slate-300">
                <div className="flex items-center gap-1.5">
                  <Anchor className="w-3.5 h-3.5 text-blue-400" />
                  <span>
                    Anchored to: <strong className="text-white">"{matchWord}"</strong>
                  </span>
                </div>
                <button
                  onClick={() => setCurrentView('editor')}
                  className="text-blue-400 hover:text-blue-300 font-semibold text-[11px]"
                >
                  Edit →
                </button>
              </div>
            </div>

            <p className="text-[11px] text-slate-500 mt-3 text-center">
              Rendered in real-time by the MatchCut Engine with zero external server dependencies.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-[#1c222c] py-6 px-6 text-center text-xs text-slate-500">
        MatchType — Kinetic Text Match Cut Video Studio • 100% Client-Side WebCodecs Video Engine
      </footer>
    </div>
  );
};
