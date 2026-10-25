import React, { useState, useRef } from 'react';
import {
  Sparkles,
  Loader2,
  Wand2,
  Anchor,
  Check,
  RotateCcw,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Film,
  ListOrdered,
  Quote,
  Key,
  Pencil,
  Save,
  X,
  ExternalLink,
} from 'lucide-react';
import { useEditorStore } from '../../stores/editorStore';
import { AIService } from '../../engine/ai/aiService';
import { AIGeneratedSentence, AILength, AIMode, AITone } from '../../types/ai';
import { CREATIVE_PRESETS, CreativePreset } from '../../engine/ai/presets';
import { validateOrResolveAnchor, findBestScriptAnchor } from '../../engine/ai/validation';

const TONES: { id: AITone; label: string }[] = [
  { id: 'cinematic', label: 'Cinematic' },
  { id: 'motivational', label: 'Motivational' },
  { id: 'dark', label: 'Dark' },
  { id: 'emotional', label: 'Emotional' },
  { id: 'minimal', label: 'Minimal' },
  { id: 'dramatic', label: 'Dramatic' },
  { id: 'bold', label: 'Bold' },
  { id: 'romantic', label: 'Romantic' },
  { id: 'funny', label: 'Funny' },
  { id: 'inspirational', label: 'Inspirational' },
  { id: 'custom', label: 'Custom' },
];

const LENGTHS: { id: AILength; label: string; desc: string }[] = [
  { id: 'ultra-short', label: 'Ultra-Short', desc: '1–4 words' },
  { id: 'short', label: 'Short', desc: '3–7 words' },
  { id: 'medium', label: 'Medium', desc: '6–12 words' },
  { id: 'long', label: 'Long', desc: '10–20 words' },
];

export const MatchCutAIPanel: React.FC = () => {
  const { applyAISentence, applyAIScript, setNotification } = useEditorStore();

  const [prompt, setPrompt] = useState('');
  const [tone, setTone] = useState<AITone>('cinematic');
  const [customTone, setCustomTone] = useState('');
  const [length, setLength] = useState<AILength>('short');
  const [count, setCount] = useState<number>(5);
  const [mode, setMode] = useState<AIMode>('sentences');
  const [activePresetId, setActivePresetId] = useState<string | null>(null);

  // Client-configurable API key (stored in localStorage) for users with their own Gemini key
  const [userApiKey, setUserApiKey] = useState<string>(() => {
    return typeof localStorage !== 'undefined'
      ? localStorage.getItem('matchcut_ai_key') || ''
      : '';
  });
  const [showKeyConfig, setShowKeyConfig] = useState<boolean>(() => {
    return typeof localStorage !== 'undefined'
      ? !localStorage.getItem('matchcut_ai_key')
      : false;
  });

  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<AIGeneratedSentence[]>([]);
  const [selectedAnchors, setSelectedAnchors] = useState<Record<string, string>>({});
  const [appliedId, setAppliedId] = useState<string | null>(null);
  const [appliedScript, setAppliedScript] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showOptions, setShowOptions] = useState(false);

  // Inline editing state for individual results
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');

  const abortControllerRef = useRef<AbortController | null>(null);

  const handleSaveApiKey = (keyVal: string) => {
    const clean = keyVal.trim();
    setUserApiKey(clean);
    if (typeof localStorage !== 'undefined') {
      if (clean) {
        localStorage.setItem('matchcut_ai_key', clean);
      } else {
        localStorage.removeItem('matchcut_ai_key');
      }
    }
  };

  const handleSelectPreset = (preset: CreativePreset) => {
    setActivePresetId(preset.id);
    setTone(preset.tone);
    if (preset.customTone) setCustomTone(preset.customTone);
    setLength(preset.length);
    setMode(preset.mode);

    // If prompt is empty or was set by another preset, prefill with preset's prompt
    const isOtherPresetPrompt = CREATIVE_PRESETS.some((p) => p.prompt === prompt);
    if (!prompt.trim() || isOtherPresetPrompt) {
      setPrompt(preset.prompt);
    }
  };

  const handleUsePresetPrompt = (presetPrompt: string) => {
    setPrompt(presetPrompt);
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) return;

    setIsLoading(true);
    setErrorMessage(null);
    setAppliedId(null);
    setAppliedScript(false);
    setEditingId(null);

    abortControllerRef.current = new AbortController();

    try {
      const response = await AIService.generateSentences(
        {
          prompt: prompt.trim(),
          tone,
          customTone: tone === 'custom' ? customTone : undefined,
          length,
          count,
          mode,
        },
        userApiKey,
        abortControllerRef.current.signal
      );

      if (!response.success || response.results.length === 0) {
        setErrorMessage(response.error || 'No results generated. Please try again.');
        if (response.error?.includes('AI_API_KEY') || response.error?.includes('API key')) {
          setShowKeyConfig(true);
        }
        setIsLoading(false);
        return;
      }

      setResults(response.results);

      // Initialize selected anchor words with AI suggestions
      const initialAnchors: Record<string, string> = {};
      for (const res of response.results) {
        initialAnchors[res.id] = res.suggestedAnchor;
      }
      setSelectedAnchors(initialAnchors);
      setIsLoading(false);
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        setErrorMessage(err.message || 'An unexpected error occurred while calling AI service.');
      }
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setIsLoading(false);
  };

  const handleApplySingle = (res: AIGeneratedSentence) => {
    const anchorWord = selectedAnchors[res.id] || res.suggestedAnchor;
    applyAISentence(res.text, anchorWord);
    setAppliedId(res.id);
    setNotification(`Applied: "${res.text}" (Anchored on "${anchorWord}")`);
    setTimeout(() => setAppliedId(null), 3000);
    setTimeout(() => setNotification(null), 3500);
  };

  const handleApplyAllAsScript = () => {
    if (results.length === 0) return;
    const lines = results.map((r) => r.text);
    // Find best shared anchor across all cuts or use first line's anchor
    const detectedAnchor = findBestScriptAnchor(lines);
    const anchorWord = selectedAnchors[results[0].id] || detectedAnchor;
    applyAIScript(lines, anchorWord);
    setAppliedScript(true);
    setNotification(`Applied ${lines.length}-cut story script (Anchored on "${anchorWord}")`);
    setTimeout(() => setAppliedScript(false), 3000);
    setTimeout(() => setNotification(null), 3500);
  };

  const handleWordClick = (resId: string, word: string) => {
    const cleanWord = word.replace(/^[^a-zA-Z0-9]+|[^a-zA-Z0-9]+$/g, '');
    if (!cleanWord) return;
    setSelectedAnchors((prev) => ({
      ...prev,
      [resId]: cleanWord,
    }));
  };

  const handleStartEdit = (res: AIGeneratedSentence) => {
    setEditingId(res.id);
    setEditingText(res.text);
  };

  const handleSaveEdit = (resId: string) => {
    const clean = editingText.trim();
    if (!clean) return;

    setResults((prev) =>
      prev.map((r) => {
        if (r.id !== resId) return r;
        const currentAnchor = selectedAnchors[resId] || r.suggestedAnchor;
        const newAnchor = validateOrResolveAnchor(clean, currentAnchor);
        setSelectedAnchors((anchors) => ({ ...anchors, [resId]: newAnchor }));
        return { ...r, text: clean, suggestedAnchor: newAnchor };
      })
    );
    setEditingId(null);
    setEditingText('');
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditingText('');
  };

  const activePreset = CREATIVE_PRESETS.find((p) => p.id === activePresetId);
  const showPresetPromptButton =
    activePreset && prompt.trim() && prompt !== activePreset.prompt;

  return (
    <div className="space-y-4 text-xs text-slate-300">
      {/* Header Banner */}
      <div className="p-3 bg-gradient-to-r from-blue-900/40 via-indigo-900/30 to-purple-900/30 rounded-xl border border-blue-500/30 shadow-lg">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-1.5 font-bold text-white text-xs">
            <Sparkles className="w-4 h-4 text-blue-400" />
            <span>MatchCut AI Generator</span>
          </div>
          <span className="px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 font-mono text-[9px] uppercase tracking-wider font-semibold border border-blue-400/30">
            Multi-Key Active
          </span>
        </div>
        <p className="text-[11px] text-slate-300 leading-relaxed">
          Transform concepts into cinematic kinetic typography sentences and multi-cut story scripts with sub-pixel match-word anchors.
        </p>
      </div>

      {/* API Key Configuration Section (Free Gemini or OpenAI Key) */}
      <div className="p-2.5 rounded-xl bg-[#141822] border border-[#262e3e] space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 font-bold text-slate-200 text-[11px]">
            <Key className="w-3.5 h-3.5 text-amber-400" />
            <span>AI Key Configuration</span>
            {userApiKey ? (
              <span className="px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[9px] font-semibold">
                ✓ {userApiKey.startsWith('AIzaSy') ? 'Gemini Key Active' : 'Key Active'}
              </span>
            ) : (
              <span className="px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[9px] font-semibold">
                Server Multi-Key Pool Ready
              </span>
            )}
          </div>
          <button
            onClick={() => setShowKeyConfig(!showKeyConfig)}
            className="text-[10px] text-blue-400 hover:text-blue-300 font-semibold"
          >
            {showKeyConfig ? 'Hide' : userApiKey ? 'Edit Key' : 'BYOK Option'}
          </button>
        </div>

        {showKeyConfig && (
          <div className="pt-1.5 border-t border-white/5 space-y-2 animate-in fade-in">
            <div className="flex gap-1.5">
              <input
                type="password"
                value={userApiKey}
                onChange={(e) => handleSaveApiKey(e.target.value)}
                placeholder="Optional: Enter your own Gemini (AIzaSy...) or OpenAI key"
                className="flex-1 bg-[#0d1017] border border-[#2a3344] rounded px-2.5 py-1.5 text-white font-mono text-[11px] focus:outline-none focus:border-blue-500"
              />
              {userApiKey && (
                <button
                  onClick={() => handleSaveApiKey('')}
                  className="px-2 py-1 bg-red-950/40 hover:bg-red-900/40 border border-red-700/50 text-red-300 rounded text-[10px]"
                >
                  Clear
                </button>
              )}
            </div>
            <div className="flex items-center justify-between text-[10px] text-slate-400">
              <span>Supports <strong>Google Gemini</strong>, Groq, or OpenAI</span>
              <a
                href="https://aistudio.google.com/app/apikey"
                target="_blank"
                rel="noreferrer"
                className="text-blue-400 hover:underline flex items-center gap-0.5"
              >
                <span>Get Gemini Key</span>
                <ExternalLink className="w-2.5 h-2.5" />
              </a>
            </div>
          </div>
        )}
      </div>

      {/* Mode Selector (Sentences vs Multi-Cut Script) */}
      <div className="grid grid-cols-2 p-1 bg-[#151922] rounded-lg border border-[#242b3a]">
        <button
          onClick={() => setMode('sentences')}
          className={`flex items-center justify-center gap-1.5 py-1.5 rounded-md text-[11px] font-medium transition-all ${
            mode === 'sentences'
              ? 'bg-blue-600 text-white font-semibold shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Quote className="w-3.5 h-3.5" />
          <span>Standalone Quotes</span>
        </button>
        <button
          onClick={() => setMode('script')}
          className={`flex items-center justify-center gap-1.5 py-1.5 rounded-md text-[11px] font-medium transition-all ${
            mode === 'script'
              ? 'bg-blue-600 text-white font-semibold shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <ListOrdered className="w-3.5 h-3.5" />
          <span>Multi-Cut Story Script</span>
        </button>
      </div>

      {/* Creative Direction Presets */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="text-[10px] font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1">
            <Wand2 className="w-3 h-3 text-blue-400" />
            <span>Creative Presets</span>
          </label>
          <span className="text-[10px] text-slate-500">
            {activePreset ? activePreset.label : 'Select a preset'}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
          {CREATIVE_PRESETS.map((p) => {
            const isSelected = activePresetId === p.id;
            return (
              <button
                key={p.id}
                onClick={() => handleSelectPreset(p)}
                className={`p-1.5 rounded-lg border text-left transition-all flex items-start gap-1.5 ${
                  isSelected
                    ? 'bg-blue-950/40 border-blue-500 text-white shadow-sm ring-1 ring-blue-500/40'
                    : 'bg-[#151922] border-[#222938] text-slate-300 hover:border-[#333d52] hover:text-white'
                }`}
                title={p.description}
              >
                <span className="text-sm shrink-0">{p.icon}</span>
                <div className="min-w-0">
                  <div className="font-semibold text-[11px] truncate leading-tight">
                    {p.label}
                  </div>
                  <div className="text-[9px] text-slate-400 capitalize truncate mt-0.5">
                    {p.tone} • {p.length}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {showPresetPromptButton && (
          <div className="mt-1.5 flex items-center justify-between p-1.5 rounded bg-blue-950/30 border border-blue-500/20 text-[10px] text-blue-300">
            <span>Preset configured ({activePreset.tone} • {activePreset.length}). Custom prompt kept.</span>
            <button
              onClick={() => handleUsePresetPrompt(activePreset.prompt)}
              className="text-blue-400 hover:underline font-semibold shrink-0 ml-2"
            >
              Use Preset Idea
            </button>
          </div>
        )}
      </div>

      {/* Prompt Input */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="text-[11px] font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1">
            <span>Describe your video</span>
          </label>
          <span className="text-[10px] font-mono text-slate-500">
            {prompt.length} / 3000
          </span>
        </div>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value.slice(0, 3000))}
          rows={4}
          placeholder="e.g. A cinematic story about working hard in silence and proving everyone wrong when the time comes..."
          className="w-full bg-[#121620] border border-[#262e3e] rounded-lg p-2.5 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-blue-500 transition-colors resize-none shadow-inner"
        />
      </div>

      {/* Accordion Toggle for Tone & Length Parameters */}
      <div className="border border-[#232936] rounded-lg overflow-hidden bg-[#131720]">
        <button
          onClick={() => setShowOptions(!showOptions)}
          className="w-full px-3 py-2 flex items-center justify-between text-[11px] font-semibold text-slate-300 hover:text-white hover:bg-[#181d28] transition-colors"
        >
          <div className="flex items-center gap-1.5">
            <span>Tone, Length & Count</span>
            <span className="text-[10px] text-blue-400 font-normal">
              ({tone} • {length} • {count} cuts)
            </span>
          </div>
          {showOptions ? (
            <ChevronUp className="w-3.5 h-3.5 text-slate-400" />
          ) : (
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          )}
        </button>

        {showOptions && (
          <div className="p-3 border-t border-[#232936] space-y-3 bg-[#0f1218]">
            {/* Tone Selector */}
            <div>
              <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                Tone
              </label>
              <div className="grid grid-cols-3 gap-1">
                {TONES.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setTone(t.id)}
                    className={`py-1 px-1.5 rounded text-[10px] font-medium border text-center transition-all ${
                      tone === t.id
                        ? 'bg-blue-600/30 border-blue-500 text-blue-300 font-bold'
                        : 'bg-[#151922] border-[#222836] text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
              {tone === 'custom' && (
                <input
                  type="text"
                  value={customTone}
                  onChange={(e) => setCustomTone(e.target.value)}
                  placeholder="Enter custom mood or tone..."
                  className="mt-1.5 w-full bg-[#151922] border border-[#2b3446] rounded px-2 py-1 text-white text-[11px] focus:outline-none focus:border-blue-500"
                />
              )}
            </div>

            {/* Length Selector */}
            <div>
              <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                Sentence Length
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                {LENGTHS.map((len) => (
                  <button
                    key={len.id}
                    onClick={() => setLength(len.id)}
                    className={`py-1.5 px-1 rounded border text-center transition-all ${
                      length === len.id
                        ? 'bg-blue-600/30 border-blue-500 text-blue-300 font-bold'
                        : 'bg-[#151922] border-[#222836] text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <div className="text-[10px]">{len.label}</div>
                    <div className="text-[9px] text-slate-500">{len.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Results Count Selector */}
            <div>
              <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                Number of Cuts / Variations
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                {[5, 8, 10].map((num) => (
                  <button
                    key={num}
                    onClick={() => setCount(num)}
                    className={`py-1 rounded border font-mono text-[11px] font-bold text-center transition-all ${
                      count === num
                        ? 'bg-blue-600/30 border-blue-500 text-blue-300'
                        : 'bg-[#151922] border-[#222836] text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {num} Cuts
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Generate Button */}
      <div className="flex gap-2">
        <button
          onClick={handleGenerate}
          disabled={isLoading || !prompt.trim()}
          className="flex-1 py-2.5 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:from-slate-700 disabled:to-slate-800 disabled:cursor-not-allowed text-white font-bold rounded-xl shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin text-white" />
              <span>Generating Copy...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 text-amber-300 fill-amber-300" />
              <span>{mode === 'script' ? 'Generate Video Script' : 'Generate Sentences'}</span>
            </>
          )}
        </button>

        {isLoading && (
          <button
            onClick={handleCancel}
            className="px-3 py-2 rounded-xl bg-red-900/30 border border-red-700/50 text-red-300 text-xs font-semibold hover:bg-red-900/50 transition-colors"
          >
            Cancel
          </button>
        )}
      </div>

      {/* Error Message Alert */}
      {errorMessage && (
        <div className="p-3 rounded-xl bg-red-950/40 border border-red-800/50 text-red-200 text-xs space-y-2 animate-in fade-in">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <div className="leading-snug">{errorMessage}</div>
          </div>
          {errorMessage.includes('AI_API_KEY') && (
            <div className="p-2 rounded bg-black/40 border border-white/5 text-[11px] text-slate-300">
              <span className="font-semibold text-white">Setup Tip:</span> Copy <code className="text-blue-300 font-mono">.env.example</code> to <code className="text-blue-300 font-mono">.env</code> and add your <code className="text-blue-300 font-mono">AI_API_KEY</code>, then restart your local server.
            </div>
          )}
          <button
            onClick={handleGenerate}
            className="text-[11px] font-semibold text-blue-400 hover:text-blue-300 underline block"
          >
            Try Again
          </button>
        </div>
      )}

      {/* Results Section */}
      {results.length > 0 && (
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between border-b border-[#242933] pb-1.5">
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-200 uppercase tracking-wider text-[11px]">
                {mode === 'script' ? `Story Script (${results.length} Cuts)` : `Results (${results.length})`}
              </span>
              <button
                onClick={handleGenerate}
                disabled={isLoading}
                className="text-[10px] text-slate-400 hover:text-blue-400 flex items-center gap-1 transition-colors"
                title="Regenerate new variations with current concept"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Regenerate</span>
              </button>
            </div>

            {mode === 'script' && (
              <button
                onClick={handleApplyAllAsScript}
                className={`px-2.5 py-1 rounded-md text-[11px] font-bold flex items-center gap-1 transition-all ${
                  appliedScript
                    ? 'bg-emerald-600 text-white'
                    : 'bg-blue-600 hover:bg-blue-500 text-white shadow-sm'
                }`}
              >
                {appliedScript ? <Check className="w-3.5 h-3.5" /> : <Film className="w-3.5 h-3.5" />}
                <span>{appliedScript ? 'Script Applied!' : 'Use Full Script in Video'}</span>
              </button>
            )}
          </div>

          <p className="text-[10px] text-slate-400 italic">
            💡 Click any word in a sentence to lock it as the anchored match word, or click the pencil to edit the text before applying.
          </p>

          <div className="space-y-2 max-h-[500px] overflow-y-auto pr-0.5">
            {results.map((res, idx) => {
              const currentAnchor = selectedAnchors[res.id] || res.suggestedAnchor;
              const isApplied = appliedId === res.id;
              const isEditing = editingId === res.id;
              const words = res.text.split(/(\s+)/);

              // Narrative beat label for multi-cut script
              const beatLabel =
                mode === 'script'
                  ? idx === 0
                    ? 'Beginning • Setup'
                    : idx === results.length - 1
                    ? 'Ending • Climax Beat'
                    : `Development • Cut ${idx + 1}`
                  : null;

              return (
                <div
                  key={res.id}
                  className={`p-3 rounded-xl border transition-all text-xs flex flex-col gap-2 relative ${
                    isApplied
                      ? 'bg-emerald-950/20 border-emerald-500/60 ring-1 ring-emerald-500/30'
                      : 'bg-[#151922] border-[#252c3c] hover:border-[#384459]'
                  }`}
                >
                  {/* Top Bar: Beat info & Edit Button */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono text-slate-500 font-bold text-[10px]">
                        {idx + 1}.
                      </span>
                      {beatLabel && (
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold bg-[#1a2130] text-blue-300 border border-blue-500/20">
                          {beatLabel}
                        </span>
                      )}
                    </div>

                    {!isEditing && (
                      <button
                        onClick={() => handleStartEdit(res)}
                        className="text-[10px] text-slate-400 hover:text-white flex items-center gap-1 transition-colors px-1.5 py-0.5 rounded hover:bg-white/5"
                        title="Edit text before applying"
                      >
                        <Pencil className="w-2.5 h-2.5" />
                        <span>Edit</span>
                      </button>
                    )}
                  </div>

                  {/* Body: Clickable Words or Inline Editor */}
                  {isEditing ? (
                    <div className="space-y-2 pt-0.5 animate-in fade-in">
                      <textarea
                        value={editingText}
                        onChange={(e) => setEditingText(e.target.value)}
                        rows={2}
                        className="w-full bg-[#0d1017] border border-blue-500/50 rounded-lg p-2 text-white text-xs focus:outline-none resize-none"
                      />
                      <div className="flex justify-end gap-1.5">
                        <button
                          onClick={handleCancelEdit}
                          className="px-2 py-1 rounded bg-[#222836] hover:bg-[#2b3345] text-slate-300 text-[10px] flex items-center gap-1"
                        >
                          <X className="w-3 h-3" />
                          <span>Cancel</span>
                        </button>
                        <button
                          onClick={() => handleSaveEdit(res.id)}
                          className="px-2.5 py-1 rounded bg-blue-600 hover:bg-blue-500 text-white font-bold text-[10px] flex items-center gap-1 shadow-sm"
                        >
                          <Save className="w-3 h-3" />
                          <span>Save Changes</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="font-semibold text-white text-[13px] leading-snug flex flex-wrap gap-x-1 gap-y-0.5">
                      {words.map((chunk, wIdx) => {
                        if (/^\s+$/.test(chunk)) return <span key={wIdx}> </span>;
                        const clean = chunk.replace(/^[^a-zA-Z0-9]+|[^a-zA-Z0-9]+$/g, '');
                        const isAnchor = clean.toLowerCase() === currentAnchor.toLowerCase();

                        return (
                          <button
                            key={wIdx}
                            onClick={() => handleWordClick(res.id, clean)}
                            className={`rounded px-1 py-0.5 transition-all text-[13px] ${
                              isAnchor
                                ? 'bg-blue-600 text-white font-black shadow-sm ring-1 ring-blue-400'
                                : 'hover:bg-white/10 hover:text-blue-300'
                            }`}
                            title={`Click to set "${clean}" as match word`}
                          >
                            {chunk}
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {/* Anchor Badge & Apply Button */}
                  <div className="flex items-center justify-between pt-1 border-t border-white/5">
                    <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
                      <Anchor className="w-3 h-3 text-blue-400" />
                      <span>Anchor:</span>
                      <span className="font-bold text-blue-300 bg-blue-950/60 px-1.5 py-0.2 rounded border border-blue-500/30">
                        "{currentAnchor}"
                      </span>
                    </div>

                    <button
                      onClick={() => handleApplySingle(res)}
                      className={`px-3 py-1 rounded-md text-[11px] font-bold flex items-center gap-1 transition-all ${
                        isApplied
                          ? 'bg-emerald-600 text-white'
                          : 'bg-[#222938] hover:bg-blue-600 text-slate-200 hover:text-white'
                      }`}
                    >
                      {isApplied ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>Applied!</span>
                        </>
                      ) : (
                        <span>Apply to Video</span>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
