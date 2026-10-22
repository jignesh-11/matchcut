import React, { useState, useRef } from 'react';
import {
  Sparkles,
  Loader2,
  Wand2,
  Anchor,
  Check,
  RotateCcw,
  AlertCircle,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  Flame,
  Film,
  ListOrdered,
  Quote,
  Key,
  ExternalLink,
} from 'lucide-react';
import { useEditorStore } from '../../stores/editorStore';
import { AIService } from '../../engine/ai/aiService';
import { AIGeneratedSentence, AILength, AIMode, AITone } from '../../types/ai';

const PROMPT_INSPIRATIONS = [
  {
    label: '⚡ Solo Developer',
    prompt: 'A dark, cinematic quote about a lonely developer who builds something great in silence without anyone noticing.',
  },
  {
    label: '🔥 Hard Choices',
    prompt: 'A bold, punchy quote about choosing discipline over comfort to achieve real freedom.',
  },
  {
    label: '🌌 Silent Grind',
    prompt: 'A motivational quote about grinding when nobody is watching and letting the final results make the noise.',
  },
  {
    label: '💎 Unstoppable',
    prompt: 'An intense, dramatic statement about refusing to quit no matter how heavy the obstacles become.',
  },
  {
    label: '🤖 AI Revolution',
    prompt: 'A futuristic quote about humans mastering AI tools to build the impossible at lightspeed.',
  },
];

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
];

export const MatchCutAIPanel: React.FC = () => {
  const { applyAISentence, applyAIScript, setNotification } = useEditorStore();

  const [prompt, setPrompt] = useState('');
  const [tone, setTone] = useState<AITone>('cinematic');
  const [customTone, setCustomTone] = useState('');
  const [length, setLength] = useState<AILength>('short');
  const [count, setCount] = useState<number>(5);
  const [mode, setMode] = useState<AIMode>('sentences');

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

  const handleGenerate = async () => {
    if (!prompt.trim()) return;

    setIsLoading(true);
    setErrorMessage(null);
    setAppliedId(null);
    setAppliedScript(false);

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
    // Use the first result's anchor or common prominent word
    const anchorWord = selectedAnchors[results[0].id] || results[0].suggestedAnchor;
    applyAIScript(lines, anchorWord);
    setAppliedScript(true);
    setNotification(`Applied ${lines.length}-line script story (Anchored on "${anchorWord}")`);
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
            Gemini 1.5 & GPT Ready
          </span>
        </div>
        <p className="text-[11px] text-slate-300 leading-relaxed">
          Describe any concept or narrative. Receive punchy kinetic typography sentences with sub-pixel match-word anchors.
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
                ✓ {userApiKey.startsWith('AIzaSy') ? 'Gemini Free Key Active' : 'Active'}
              </span>
            ) : (
              <span className="px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[9px] font-semibold">
                Free Key Option
              </span>
            )}
          </div>
          <button
            onClick={() => setShowKeyConfig(!showKeyConfig)}
            className="text-[10px] text-blue-400 hover:text-blue-300 font-semibold"
          >
            {showKeyConfig ? 'Hide' : userApiKey ? 'Edit Key' : 'Enter Key'}
          </button>
        </div>

        {showKeyConfig && (
          <div className="pt-1.5 border-t border-white/5 space-y-2 animate-in fade-in">
            <div className="flex gap-1.5">
              <input
                type="password"
                value={userApiKey}
                onChange={(e) => handleSaveApiKey(e.target.value)}
                placeholder="Paste Gemini (AIzaSy...) or OpenAI (sk-...) key"
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
              <span>Supports <strong>Google Gemini (free)</strong>, Groq, or OpenAI</span>
              <a
                href="https://aistudio.google.com/app/apikey"
                target="_blank"
                rel="noreferrer"
                className="text-blue-400 hover:text-blue-300 flex items-center gap-0.5 font-semibold underline"
              >
                <span>Get free Gemini key</span>
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

      {/* Prompt Input */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="text-[11px] font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1">
            <span>Describe your video</span>
          </label>
          <span className="text-[10px] font-mono text-slate-500">
            {prompt.length} / 1000
          </span>
        </div>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value.slice(0, 1000))}
          rows={3}
          placeholder="e.g. A cinematic story about working hard in silence and proving everyone wrong..."
          className="w-full bg-[#121620] border border-[#262e3e] rounded-lg p-2.5 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-blue-500 transition-colors resize-none shadow-inner"
        />
      </div>

      {/* Prompt Inspirations Chips */}
      <div>
        <div className="text-[10px] text-slate-400 mb-1 flex items-center gap-1">
          <Flame className="w-3 h-3 text-amber-400" />
          <span>Inspiration ideas:</span>
        </div>
        <div className="flex flex-wrap gap-1">
          {PROMPT_INSPIRATIONS.map((chip, idx) => (
            <button
              key={idx}
              onClick={() => setPrompt(chip.prompt)}
              className="px-2 py-0.5 rounded bg-[#171b24] hover:bg-[#222836] border border-[#242933] text-[10px] text-slate-300 hover:text-white transition-colors truncate max-w-full"
            >
              {chip.label}
            </button>
          ))}
        </div>
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
              ({tone} • {length} • {count} results)
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
              <div className="grid grid-cols-3 gap-1.5">
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
                Number of Variations
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
                    {num} Results
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
            <span className="font-bold text-slate-200 uppercase tracking-wider text-[11px]">
              {mode === 'script' ? 'Generated Script Story' : `Results (${results.length})`}
            </span>
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
            💡 Click any word in a sentence to choose it as the anchored match word before applying.
          </p>

          <div className="space-y-2 max-h-[480px] overflow-y-auto pr-0.5">
            {results.map((res, idx) => {
              const currentAnchor = selectedAnchors[res.id] || res.suggestedAnchor;
              const isApplied = appliedId === res.id;
              const words = res.text.split(/(\s+)/);

              return (
                <div
                  key={res.id}
                  className={`p-3 rounded-xl border transition-all text-xs flex flex-col gap-2 relative ${
                    isApplied
                      ? 'bg-emerald-950/20 border-emerald-500/60 ring-1 ring-emerald-500/30'
                      : 'bg-[#151922] border-[#252c3c] hover:border-[#384459]'
                  }`}
                >
                  {/* Sentence Number & Text with Clickable Words */}
                  <div className="flex items-start gap-2">
                    <span className="font-mono text-slate-500 font-bold shrink-0 text-[10px] mt-0.5">
                      {idx + 1}.
                    </span>
                    <div className="font-semibold text-white text-[13px] leading-snug flex-1 flex flex-wrap gap-x-1 gap-y-0.5">
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
                  </div>

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
