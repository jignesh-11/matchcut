import React, { useRef } from 'react';
import {
  Type,
  Layout,
  Palette,
  Film,
  Sparkles,
  Shuffle,
  Wand2,
  Image as ImageIcon,
  Check,
} from 'lucide-react';
import { useEditorStore } from '../../stores/editorStore';
import { AVAILABLE_FONTS } from '../../engine/fonts/fontManager';
import { LayoutStyle, TransitionType } from '../../types/rendering';
import { findMatchWordOccurrences } from '../../utils/text';
import { TYPOGRAPHY_PRESETS } from '../../presets/typography';
import { BACKGROUND_PRESETS } from '../../presets/backgrounds';
import { ANIMATION_PRESETS } from '../../presets/animations';

const SAMPLE_TEXTS = [
  {
    label: '⚡ Stop Scrolling',
    text: `Stop scrolling for a second.\nStop wasting precious time.\nStop doubting your potential.\nStop waiting for permission.`,
    matchWord: 'Stop',
  },
  {
    label: '🔥 Hard Choices',
    text: `Hard choices easy life.\nEasy choices hard life.\nMake the hard choices.`,
    matchWord: 'choices',
  },
  {
    label: '🚀 Never Stop',
    text: `Never stop building.\nNever stop shipping.\nNever stop learning.\nNever stop growing.`,
    matchWord: 'stop',
  },
  {
    label: '💡 The Secret',
    text: `Everybody searches for the secret.\nDaily discipline is the only secret.\nRelentless execution is the real secret.`,
    matchWord: 'secret',
  },
  {
    label: '🤖 AI Revolution',
    text: `AI will not replace humans.\nHumans using AI will lead.\nMaster the new AI tools.`,
    matchWord: 'AI',
  },
  {
    label: '🎯 Build Systems',
    text: `Build better daily systems.\nStick to your proven systems.\nTrust your systems.`,
    matchWord: 'systems',
  },
  {
    label: '✨ One Decision',
    text: `You are one decision away.\nMake that one decision count.\nEvery bold decision matters.`,
    matchWord: 'decision',
  },
  {
    label: '💎 Make It Yours',
    text: `Make it simple.\nMake it bold.\nMake it fast.\nMake it yours.`,
    matchWord: 'Make',
  },
];

export const LeftSidebar: React.FC = () => {
  const {
    activeSidebarTab,
    setActiveSidebarTab,
    text,
    setText,
    matchWord,
    setMatchWord,
    occurrenceIndex,
    setOccurrenceIndex,
    fontConfig,
    setFontConfig,
    layoutStyle,
    setLayoutStyle,
    density,
    setDensity,
    compositionCount,
    setCompositionCount,
    seed,
    setSeed,
    randomizeSeed,
    background,
    setBackground,
    effects,
    setEffects,
    animation,
    setAnimation,
    regenerateCompositions,
    anchor,
    setAnchor,
  } = useEditorStore();

  const occurrences = findMatchWordOccurrences(text, matchWord);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const src = event.target?.result as string;
      setBackground({
        type: 'image',
        image: {
          src,
          opacity: 0.65,
          blur: 0,
          scale: 1.0,
          positionX: 0.5,
          positionY: 0.5,
        },
      });
    };
    reader.readAsDataURL(file);
  };

  return (
    <aside className="w-full md:w-80 border-r border-[#242933] bg-[#12151b] flex flex-col h-full select-none shrink-0 z-20">
      {/* Sidebar Tabs */}
      <div className="grid grid-cols-4 border-b border-[#242933] bg-[#0f1217] p-1">
        <button
          onClick={() => setActiveSidebarTab('text')}
          className={`flex flex-col items-center justify-center py-2 text-[11px] font-medium rounded transition-all ${
            activeSidebarTab === 'text'
              ? 'bg-[#1e232d] text-blue-400 font-semibold shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-[#151921]'
          }`}
        >
          <Type className="w-4 h-4 mb-1" />
          <span>Text</span>
        </button>

        <button
          onClick={() => setActiveSidebarTab('layout')}
          className={`flex flex-col items-center justify-center py-2 text-[11px] font-medium rounded transition-all ${
            activeSidebarTab === 'layout'
              ? 'bg-[#1e232d] text-blue-400 font-semibold shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-[#151921]'
          }`}
        >
          <Layout className="w-4 h-4 mb-1" />
          <span>Layout</span>
        </button>

        <button
          onClick={() => setActiveSidebarTab('style')}
          className={`flex flex-col items-center justify-center py-2 text-[11px] font-medium rounded transition-all ${
            activeSidebarTab === 'style'
              ? 'bg-[#1e232d] text-blue-400 font-semibold shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-[#151921]'
          }`}
        >
          <Palette className="w-4 h-4 mb-1" />
          <span>Style</span>
        </button>

        <button
          onClick={() => setActiveSidebarTab('animation')}
          className={`flex flex-col items-center justify-center py-2 text-[11px] font-medium rounded transition-all ${
            activeSidebarTab === 'animation'
              ? 'bg-[#1e232d] text-blue-400 font-semibold shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-[#151921]'
          }`}
        >
          <Film className="w-4 h-4 mb-1" />
          <span>Motion</span>
        </button>
      </div>

      {/* Tab Panels */}
      <div className="flex-1 overflow-y-auto p-4 space-y-5 text-xs text-slate-300">
        {/* ===================== TAB 1: TEXT ===================== */}
        {activeSidebarTab === 'text' && (
          <div className="space-y-5">
            {/* Quick Templates */}
            <div>
              <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-2">
                Quick Prompts
              </label>
              <div className="grid grid-cols-2 gap-1.5">
                {SAMPLE_TEXTS.map((sample, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      setText(sample.text);
                      setMatchWord(sample.matchWord);
                    }}
                    className="px-2.5 py-1.5 text-left rounded bg-[#171b23] hover:bg-[#202532] border border-[#242933] text-[11px] font-medium text-slate-300 hover:text-white transition-colors truncate"
                  >
                    {sample.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Source Text Input */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  Source Script
                </label>
                <span className="text-[10px] text-slate-500">
                  {text.split(/\s+/).filter(Boolean).length} words
                </span>
              </div>
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                rows={4}
                placeholder="Enter words or lines of text..."
                className="w-full bg-[#171a22] border border-[#272e3b] rounded-lg p-2.5 text-white font-mono text-xs focus:outline-none focus:border-blue-500 transition-colors resize-none shadow-inner"
              />
            </div>

            {/* Match Word Selector */}
            <div className="p-3 bg-[#171b24] rounded-lg border border-[#262d3c] space-y-3">
              <div>
                <label className="text-[11px] font-bold text-blue-400 uppercase tracking-wider block mb-1">
                  Anchored Match Word / Phrase
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={matchWord}
                    onChange={(e) => setMatchWord(e.target.value)}
                    placeholder="Enter word to anchor..."
                    className="flex-1 bg-[#0f1217] border border-[#2c3444] rounded px-2.5 py-1.5 text-white font-semibold text-xs focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Occurrences Selector if found multiple times */}
              {occurrences.length > 1 && (
                <div>
                  <div className="text-[10px] text-slate-400 mb-1">
                    Occurs {occurrences.length} times in text. Select target:
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {occurrences.map((occ, idx) => (
                      <button
                        key={idx}
                        onClick={() => setOccurrenceIndex(idx)}
                        className={`px-2 py-1 rounded text-[10px] font-medium border ${
                          occurrenceIndex === idx
                            ? 'bg-blue-600/30 border-blue-500 text-blue-300'
                            : 'bg-[#10131a] border-[#252b38] text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        #{idx + 1}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Click-to-pick helper */}
              <div>
                <div className="text-[10px] text-slate-400 mb-1.5">
                  Click any word below to lock as match word:
                </div>
                <div className="flex flex-wrap gap-1 max-h-28 overflow-y-auto p-1 bg-[#0f1217] rounded border border-[#202634]">
                  {Array.from(new Set(text.split(/[\s,\.!?\n]+/).filter((w) => w.length > 0))).map(
                    (w, i) => {
                      const isCurrent = w.toLowerCase() === matchWord.toLowerCase();
                      return (
                        <button
                          key={i}
                          onClick={() => setMatchWord(w)}
                          className={`px-2 py-0.5 rounded text-[11px] transition-colors ${
                            isCurrent
                              ? 'bg-blue-600 text-white font-bold'
                              : 'bg-[#191e28] text-slate-300 hover:bg-[#252c3c] hover:text-white'
                          }`}
                        >
                          {w}
                        </button>
                      );
                    }
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ===================== TAB 2: LAYOUT ===================== */}
        {activeSidebarTab === 'layout' && (
          <div className="space-y-5">
            {/* Anchor Positioning */}
            <div>
              <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-2">
                Anchor Position
              </label>
              <div className="flex gap-4">
                <div className="flex-1">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[10px] text-slate-500">X-Axis</span>
                    <span className="font-mono text-white text-[10px]">{Math.round(anchor.x * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0.2"
                    max="0.8"
                    step="0.01"
                    value={anchor.x}
                    onChange={(e) => setAnchor({ ...anchor, x: parseFloat(e.target.value) })}
                    className="w-full accent-blue-500"
                  />
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[10px] text-slate-500">Y-Axis</span>
                    <span className="font-mono text-white text-[10px]">{Math.round(anchor.y * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0.2"
                    max="0.8"
                    step="0.01"
                    value={anchor.y}
                    onChange={(e) => setAnchor({ ...anchor, y: parseFloat(e.target.value) })}
                    className="w-full accent-blue-500"
                  />
                </div>
              </div>
            </div>
            {/* Layout Style */}
            <div>
              <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-2">
                Composition Style
              </label>
              <select
                value={layoutStyle}
                onChange={(e) => setLayoutStyle(e.target.value as LayoutStyle | 'mixed')}
                className="w-full bg-[#171a22] border border-[#272e3b] rounded-lg px-3 py-2 text-white text-xs focus:outline-none focus:border-blue-500"
              >
                <option value="mixed">Dynamic Mixed (High Variety across cuts)</option>
                <option value="kinetic">Kinetic High Energy (Shorts / Reels)</option>
                <option value="center-stack">Center Stack (Classic Kinetic)</option>
                <option value="editorial-left">Editorial Left (Magazine Asymmetry)</option>
                <option value="editorial-right">Editorial Right</option>
                <option value="huge-typography">Huge Typography Contrast</option>
                <option value="scattered">Scattered Kinetic Floating</option>
                <option value="magazine">Swiss Magazine Layout</option>
                <option value="minimal">Minimal Clean White Space</option>
                <option value="vertical">Vertical Flow Stack</option>
                <option value="split-screen">Split-Screen Dual Focus</option>
                <option value="fullscreen-word">Fullscreen Anchor Punch</option>
                <option value="random-controlled">Random Controlled</option>
              </select>
            </div>

            {/* Density */}
            <div>
              <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-2">
                Typography Density
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                {(['sparse', 'normal', 'dense'] as const).map((d) => (
                  <button
                    key={d}
                    onClick={() => setDensity(d)}
                    className={`py-1.5 text-center rounded capitalize text-xs font-medium border ${
                      density === d
                        ? 'bg-blue-600/25 border-blue-500 text-blue-300'
                        : 'bg-[#171b23] border-[#242933] text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>

            {/* Number of compositions / cuts */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  Composition Cuts Count
                </label>
                <span className="font-mono text-white text-xs">{compositionCount} cuts</span>
              </div>
              <input
                type="range"
                min="2"
                max="16"
                step="1"
                value={compositionCount}
                onChange={(e) => setCompositionCount(parseInt(e.target.value, 10))}
                className="w-full accent-blue-500"
              />
            </div>

            {/* Seed & Randomizer */}
            <div className="p-3 bg-[#171b24] rounded-lg border border-[#262d3c] space-y-2.5">
              <div className="flex justify-between items-center">
                <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">
                  Deterministic Seed
                </label>
                <button
                  onClick={randomizeSeed}
                  className="flex items-center gap-1 px-2 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded text-[11px] font-medium transition-colors"
                >
                  <Shuffle className="w-3 h-3" />
                  <span>Randomize</span>
                </button>
              </div>
              <input
                type="number"
                value={seed}
                onChange={(e) => setSeed(parseInt(e.target.value, 10) || 0)}
                className="w-full bg-[#0f1217] border border-[#272e3b] rounded px-2.5 py-1.5 text-white font-mono text-xs focus:outline-none focus:border-blue-500"
              />
              <p className="text-[10px] text-slate-500">
                Same seed guarantees 100% identical composition sequences and frame exports.
              </p>
            </div>

            <button
              onClick={() => regenerateCompositions(true)}
              className="w-full flex items-center justify-center gap-2 py-2 bg-[#202634] hover:bg-[#283144] border border-[#2e374c] rounded-lg text-slate-200 hover:text-white font-semibold transition-colors"
            >
              <Wand2 className="w-3.5 h-3.5 text-blue-400" />
              <span>Regenerate Compositions</span>
            </button>
          </div>
        )}

        {/* ===================== TAB 3: STYLE ===================== */}
        {activeSidebarTab === 'style' && (
          <div className="space-y-5">
            {/* Typography Presets */}
            <div>
              <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-2">
                Style Presets
              </label>
              <div className="grid grid-cols-1 gap-1.5">
                {TYPOGRAPHY_PRESETS.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => setFontConfig(p.config)}
                    className="px-2.5 py-2 text-left rounded bg-[#171b23] hover:bg-[#202532] border border-[#242933] transition-colors group"
                  >
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-white group-hover:text-blue-400">
                        {p.name}
                      </span>
                      <span
                        className="w-3 h-3 rounded-full border border-slate-600"
                        style={{ backgroundColor: p.config.highlightColor }}
                      />
                    </div>
                    <div className="text-[10px] text-slate-400">{p.description}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Font Family */}
            <div>
              <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">
                Primary Font
              </label>
              <select
                value={fontConfig.family}
                onChange={(e) => setFontConfig({ family: e.target.value })}
                className="w-full bg-[#171a22] border border-[#272e3b] rounded-lg px-3 py-2 text-white text-xs focus:outline-none focus:border-blue-500"
              >
                {AVAILABLE_FONTS.map((f) => (
                  <option key={f.family} value={f.family}>
                    {f.name} ({f.category})
                  </option>
                ))}
              </select>
            </div>

            {/* Font Size & Weight */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-[11px] text-slate-400">Base Size</label>
                  <span className="font-mono text-white text-[11px]">{fontConfig.size}px</span>
                </div>
                <input
                  type="range"
                  min="48"
                  max="160"
                  step="2"
                  value={fontConfig.size}
                  onChange={(e) => setFontConfig({ size: parseInt(e.target.value, 10) })}
                  className="w-full accent-blue-500"
                />
              </div>

              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Weight</label>
                <select
                  value={fontConfig.weight}
                  onChange={(e) => setFontConfig({ weight: parseInt(e.target.value, 10) })}
                  className="w-full bg-[#171a22] border border-[#272e3b] rounded px-2 py-1 text-white text-xs"
                >
                  <option value={400}>Regular (400)</option>
                  <option value={600}>Semi-Bold (600)</option>
                  <option value={700}>Bold (700)</option>
                  <option value={800}>Extra Bold (800)</option>
                  <option value={900}>Black (900)</option>
                </select>
              </div>
            </div>

            {/* Colors */}
            <div className="grid grid-cols-2 gap-3 p-3 bg-[#171b24] rounded-lg border border-[#262d3c]">
              <div>
                <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                  Match Highlight
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={fontConfig.highlightColor}
                    onChange={(e) => setFontConfig({ highlightColor: e.target.value })}
                    className="w-7 h-7 rounded border border-[#3b4458] bg-transparent cursor-pointer"
                  />
                  <span className="font-mono text-[11px] text-slate-300">
                    {fontConfig.highlightColor}
                  </span>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                  Surrounding Text
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={fontConfig.color}
                    onChange={(e) => setFontConfig({ color: e.target.value })}
                    className="w-7 h-7 rounded border border-[#3b4458] bg-transparent cursor-pointer"
                  />
                  <span className="font-mono text-[11px] text-slate-300">{fontConfig.color}</span>
                </div>
              </div>
            </div>

            {/* Background Settings */}
            <div>
              <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-2">
                Canvas Background
              </label>
              <div className="grid grid-cols-3 gap-1.5 mb-2.5">
                {(['solid', 'gradient', 'black', 'white', 'image'] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => {
                      if (t === 'image') {
                        imageInputRef.current?.click();
                      } else {
                        setBackground({ type: t });
                      }
                    }}
                    className={`py-1.5 px-2 rounded capitalize text-[11px] font-medium border text-center ${
                      background.type === t
                        ? 'bg-blue-600/25 border-blue-500 text-blue-300'
                        : 'bg-[#171b23] border-[#242933] text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>

              <input
                type="file"
                ref={imageInputRef}
                onChange={handleImageUpload}
                accept="image/*"
                className="hidden"
              />

              {background.type === 'solid' && (
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={background.color}
                    onChange={(e) => setBackground({ color: e.target.value })}
                    className="w-7 h-7 rounded border border-[#3b4458] bg-transparent cursor-pointer"
                  />
                  <span className="font-mono text-[11px] text-slate-300">{background.color}</span>
                </div>
              )}
            </div>

            {/* Effects */}
            <div className="space-y-3 p-3 bg-[#171b24] rounded-lg border border-[#262d3c]">
              <div className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">
                Visual Post-Processing
              </div>

              <div className="flex items-center justify-between">
                <span className="text-[11px] text-slate-300">Anchor Glow Accent</span>
                <input
                  type="checkbox"
                  checked={effects.glow}
                  onChange={(e) => setEffects({ glow: e.target.checked })}
                  className="rounded accent-blue-500 w-4 h-4 cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-[11px] text-slate-400">Film Grain</span>
                  <span className="font-mono text-white text-[10px]">
                    {Math.round(effects.grain * 100)}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="0.5"
                  step="0.05"
                  value={effects.grain}
                  onChange={(e) => setEffects({ grain: parseFloat(e.target.value) })}
                  className="w-full accent-blue-500"
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-[11px] text-slate-400">Vignette</span>
                  <span className="font-mono text-white text-[10px]">
                    {Math.round(effects.vignette * 100)}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1.0"
                  step="0.05"
                  value={effects.vignette}
                  onChange={(e) => setEffects({ vignette: parseFloat(e.target.value) })}
                  className="w-full accent-blue-500"
                />
              </div>
            </div>
          </div>
        )}

        {/* ===================== TAB 4: ANIMATION ===================== */}
        {activeSidebarTab === 'animation' && (
          <div className="space-y-5">
            {/* Motion Presets */}
            <div>
              <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-2">
                Motion Presets
              </label>
              <div className="space-y-1.5">
                {ANIMATION_PRESETS.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => setAnimation(p.settings)}
                    className="w-full px-2.5 py-2 text-left rounded bg-[#171b23] hover:bg-[#202532] border border-[#242933] transition-colors"
                  >
                    <div className="font-semibold text-white text-xs">{p.name}</div>
                    <div className="text-[10px] text-slate-400">{p.description}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Cut Duration */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  Cut Duration
                </label>
                <span className="font-mono text-white text-xs">
                  {animation.cutDuration.toFixed(2)}s
                </span>
              </div>
              <input
                type="range"
                min="0.2"
                max="1.8"
                step="0.05"
                value={animation.cutDuration}
                onChange={(e) => setAnimation({ cutDuration: parseFloat(e.target.value) })}
                className="w-full accent-blue-500"
              />
              <div className="flex justify-between text-[10px] text-slate-500 mt-1">
                <span>0.2s (Fast)</span>
                <span>0.6s (Standard)</span>
                <span>1.8s (Slow)</span>
              </div>
            </div>

            {/* FPS Selector */}
            <div>
              <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-2">
                Frame Rate (FPS)
              </label>
              <div className="grid grid-cols-4 gap-1.5">
                {([12, 24, 30, 60] as const).map((rate) => (
                  <button
                    key={rate}
                    onClick={() => setAnimation({ fps: rate })}
                    className={`py-1.5 text-center rounded font-mono text-xs border ${
                      animation.fps === rate
                        ? 'bg-blue-600/30 border-blue-500 text-blue-300 font-bold'
                        : 'bg-[#171b23] border-[#242933] text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {rate}
                  </button>
                ))}
              </div>
            </div>

            {/* Transition Type */}
            <div>
              <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-2">
                Transition Type
              </label>
              <select
                value={animation.transition}
                onChange={(e) => setAnimation({ transition: e.target.value as TransitionType })}
                className="w-full bg-[#171a22] border border-[#272e3b] rounded-lg px-3 py-2 text-white text-xs focus:outline-none focus:border-blue-500"
              >
                <option value="hard-cut">Hard Cut (Instant Kinetic Snap)</option>
                <option value="glitch">Glitch Slice</option>
                <option value="flash">Flash Burst</option>
                <option value="crossfade">Crossfade (Opacity Blend)</option>
                <option value="zoom">Zoom Anchor Pulse</option>
                <option value="scale">Scale Bounce</option>
                <option value="blur">Motion Blur</option>
                <option value="slide">Horizontal Slide</option>
                <option value="shake">Camera Shake</option>
                <option value="none">None</option>
              </select>
            </div>

            {/* Transition Duration */}
            {animation.transition !== 'hard-cut' && animation.transition !== 'none' && (
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-[11px] text-slate-400">Transition Duration</label>
                  <span className="font-mono text-white text-[11px]">
                    {animation.transitionDuration.toFixed(2)}s
                  </span>
                </div>
                <input
                  type="range"
                  min="0.04"
                  max="0.3"
                  step="0.02"
                  value={animation.transitionDuration}
                  onChange={(e) =>
                    setAnimation({ transitionDuration: parseFloat(e.target.value) })
                  }
                  className="w-full accent-blue-500"
                />
              </div>
            )}
          </div>
        )}
      </div>
    </aside>
  );
};
