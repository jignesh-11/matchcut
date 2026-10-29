import React, { useEffect, useRef, useState } from 'react';
import {
  Sparkles,
  ArrowRight,
  Zap,
  Anchor,
  Layers,
  Video,
  Play,
  RotateCcw,
  CheckCircle2,
  ChevronDown,
  Volume2,
  ShieldCheck,
  Cpu,
  Smartphone,
  Flame,
  HelpCircle,
  FileText,
  Sliders,
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

  const [openFaq, setOpenFaq] = useState<number | null>(0);

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
              Rendered in real-time by the WordAnchor Engine with zero external server dependencies.
            </p>
          </div>
        </div>
      </main>

      {/* How It Works Section */}
      <section className="border-t border-[#1a202c] bg-[#090b0f]/80 py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Simple 3-Step Workflow</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              How to Create Kinetic Text Match Cuts
            </h2>
            <p className="text-slate-400 text-sm sm:text-base">
              Turn any script, hook, or quote into a hypnotic short-form video in under a minute.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Step 1 */}
            <div className="p-6 rounded-2xl bg-[#11141b] border border-[#212735] hover:border-blue-500/40 transition-all group relative">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-400 flex items-center justify-center font-mono font-bold text-base mb-5 group-hover:scale-110 transition-transform">
                01
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Input Your Script & Lines</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Enter your text phrases or let the generator split your lines into rhythmic, punchy composition cards designed for short-form retention.
              </p>
            </div>

            {/* Step 2 */}
            <div className="p-6 rounded-2xl bg-[#11141b] border border-[#212735] hover:border-blue-500/40 transition-all group relative">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 flex items-center justify-center font-mono font-bold text-base mb-5 group-hover:scale-110 transition-transform">
                02
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Lock Your Pivot Anchor Word</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Select the core word to anchor. WordAnchor's geometric engine calculates sub-pixel coordinates to keep that word laser-focused in the same visual spot across cuts.
              </p>
            </div>

            {/* Step 3 */}
            <div className="p-6 rounded-2xl bg-[#11141b] border border-[#212735] hover:border-blue-500/40 transition-all group relative">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center font-mono font-bold text-base mb-5 group-hover:scale-110 transition-transform">
                03
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Export 60 FPS MP4 Video</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Customize typography themes, add synchronized procedural sound effects (whooshes, shutters), and export crisp 1080×1920 video via hardware WebCodecs.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Highlights & Benefits */}
      <section className="py-20 px-6 bg-[#0d0f14] relative">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              Engineered for Maximum Short-Form Viewer Retention
            </h2>
            <p className="text-slate-400 text-sm sm:text-base">
              The match-cut typography effect keeps the viewer's eyes hypnotically locked while message context shifts rapidly around it.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="p-6 rounded-2xl bg-[#13161f] border border-[#222938] space-y-3">
              <div className="w-9 h-9 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center">
                <Anchor className="w-4 h-4" />
              </div>
              <h3 className="text-base font-bold text-white">Sub-Pixel Anchor Engine</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Prevents visual jitter by computing exact glyph bounding boxes so the target word never drifts, even as fonts and layout structures change.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-[#13161f] border border-[#222938] space-y-3">
              <div className="w-9 h-9 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
                <Volume2 className="w-4 h-4" />
              </div>
              <h3 className="text-base font-bold text-white">Procedural Rhythmic SFX</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Built-in audio synthesizer triggers camera shutter clicks, air whooshes, and sub-bass thuds on every cut with zero external audio assets needed.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-[#13161f] border border-[#222938] space-y-3">
              <div className="w-9 h-9 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                <Cpu className="w-4 h-4" />
              </div>
              <h3 className="text-base font-bold text-white">100% Client-Side WebCodecs</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Hardware-accelerated 60 FPS video export directly inside your browser. No server render queues, zero cloud latency, and 100% private.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-[#13161f] border border-[#222938] space-y-3">
              <div className="w-9 h-9 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <h3 className="text-base font-bold text-white">Zero Watermark, 100% Free</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                No account registration, no credit card, and no intrusive branding. Your videos are clean and ready to publish directly to TikTok, Reels, or Shorts.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Comparison Section */}
      <section className="border-t border-[#1a202c] bg-[#090b0f]/80 py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12 space-y-3">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
              Why Creators Choose WordAnchor Over After Effects
            </h2>
            <p className="text-slate-400 text-sm">
              Save hours of tedious manual keyframing and anchor point pinning.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-6 rounded-2xl bg-[#151212]/80 border border-red-500/20 space-y-3">
              <h3 className="font-bold text-red-300 text-sm uppercase tracking-wider">Traditional Motion Workflow</h3>
              <ul className="space-y-2.5 text-xs text-slate-400">
                <li className="flex items-start gap-2">
                  <span className="text-red-400 font-bold">✕</span>
                  <span>Hours spent manually adjusting anchor points for each word layer</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-400 font-bold">✕</span>
                  <span>Heavy desktop software ($30+/month Adobe subscriptions)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-400 font-bold">✕</span>
                  <span>Manual sound effect alignment on separate audio tracks</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-400 font-bold">✕</span>
                  <span>Slow timeline rendering and cumbersome export pipelines</span>
                </li>
              </ul>
            </div>

            <div className="p-6 rounded-2xl bg-blue-950/20 border border-blue-500/30 space-y-3">
              <h3 className="font-bold text-blue-400 text-sm uppercase tracking-wider">With WordAnchor Studio</h3>
              <ul className="space-y-2.5 text-xs text-slate-300">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Sub-pixel anchor math automatically pins target words</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Runs 100% in any web browser on desktop or laptop</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Procedural audio synthesis triggers on cuts automatically</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Instant hardware WebCodecs 60 FPS MP4 export</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Frequently Asked Questions (FAQ) Section */}
      <section className="py-20 px-6 bg-[#0d0f14]">
        <div className="max-w-3xl mx-auto space-y-8">
          <div className="text-center space-y-3">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold">
              <HelpCircle className="w-3.5 h-3.5" />
              <span>Got Questions?</span>
            </div>
            <h2 className="text-3xl font-extrabold text-white">
              Frequently Asked Questions
            </h2>
            <p className="text-slate-400 text-sm">
              Everything you need to know about creating text match cuts and kinetic typography.
            </p>
          </div>

          <div className="space-y-3">
            {[
              {
                q: "What is a kinetic text match cut video?",
                a: "A text match cut is a viral kinetic typography animation where a selected anchor word remains locked in the exact same visual spot on screen while surrounding words, fonts, layout sizes, and styles dynamically mutate around it. This creates intense visual momentum that stops the scroll and boosts viewer retention on TikTok, Reels, and YouTube Shorts."
              },
              {
                q: "How do I create a text match cut in WordAnchor?",
                a: "Simply input or paste your script, select the pivot word you want to anchor across cuts, customize your typography themes and motion settings, and export a ready-to-share 60 FPS MP4 video with one click directly in your browser."
              },
              {
                q: "Is WordAnchor free and without watermark?",
                a: "Yes! WordAnchor is completely free to use with zero watermarks and no required sign-ups. All video rendering and export happens client-side on your device via the WebCodecs API."
              },
              {
                q: "Do I need Adobe After Effects or Premiere Pro to make text match cuts?",
                a: "No. In the past, video editors had to manually pin anchor points and keyframe scale across separate layers in After Effects or Premiere Pro. WordAnchor automates sub-pixel alignment and dynamic layout balancing entirely in your web browser."
              },
              {
                q: "What video formats and aspect ratios are supported?",
                a: "WordAnchor exports native 9:16 vertical video at 1080×1920 resolution at up to 60 FPS in standard MP4 (H.264 / AVC) and WebM formats, perfectly ready for TikTok, Instagram Reels, YouTube Shorts, and Snapchat."
              }
            ].map((faq, idx) => (
              <div
                key={idx}
                className="rounded-xl bg-[#12161f] border border-[#212836] overflow-hidden transition-all"
              >
                <button
                  onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                  className="w-full px-5 py-4 text-left flex items-center justify-between text-white font-medium text-sm hover:text-blue-400 transition-colors"
                >
                  <span>{faq.q}</span>
                  <ChevronDown
                    className={`w-4 h-4 text-slate-400 transition-transform duration-200 shrink-0 ${
                      openFaq === idx ? 'rotate-180 text-blue-400' : ''
                    }`}
                  />
                </button>
                {openFaq === idx && (
                  <div className="px-5 pb-4 text-xs text-slate-400 leading-relaxed border-t border-[#1a212e] pt-3">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Bottom CTA Banner */}
      <section className="py-16 px-6 bg-gradient-to-b from-[#0d0f14] to-[#080a0e] border-t border-[#1a202c]">
        <div className="max-w-4xl mx-auto rounded-3xl bg-gradient-to-r from-blue-900/30 via-indigo-900/30 to-blue-950/40 border border-blue-500/30 p-8 sm:p-12 text-center space-y-6 relative overflow-hidden">
          <div className="space-y-3">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white">
              Ready to Make Words Hit the Same Spot?
            </h2>
            <p className="text-slate-300 text-sm sm:text-base max-w-xl mx-auto">
              Start building viral kinetic match cut typography for your short-form videos in seconds. Free, client-side, and no watermark.
            </p>
          </div>

          <div className="flex justify-center">
            <button
              onClick={() => setCurrentView('editor')}
              className="flex items-center gap-2 px-8 py-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-sm shadow-xl shadow-blue-600/30 active:scale-95 transition-all group"
            >
              <span>Launch Studio Editor</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#1c222c] bg-[#07080c] py-10 px-6 text-center text-xs text-slate-500 space-y-3">
        <div className="flex justify-center items-center gap-6 text-slate-400 text-xs">
          <button onClick={() => setCurrentView('editor')} className="hover:text-white transition-colors">
            Studio Editor
          </button>
          <span>•</span>
          <span>1080×1920 60 FPS Export</span>
          <span>•</span>
          <span>WebCodecs Powered</span>
          <span>•</span>
          <span>Zero Watermark</span>
        </div>
        <p>
          WordAnchor — Free Kinetic Text Match Cut Video Studio • Engineered for viral TikTok, Instagram Reels & YouTube Shorts typography.
        </p>
      </footer>
    </div>
  );
};
