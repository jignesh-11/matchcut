import React from 'react';
import {
  Crosshair,
  Lock,
  Layers,
  Sliders,
  Info,
  Maximize2,
  Move,
} from 'lucide-react';
import { useEditorStore } from '../../stores/editorStore';

export const RightSidebar: React.FC = () => {
  const {
    anchor,
    setAnchor,
    canvasWidth,
    canvasHeight,
    compositions,
    currentCompositionIndex,
    matchWord,
  } = useEditorStore();

  const currentComp = compositions[currentCompositionIndex] ?? compositions[0];

  const handleAnchorChange = (x: number, y: number) => {
    setAnchor({
      x: Math.max(0.1, Math.min(0.9, x)),
      y: Math.max(0.1, Math.min(0.9, y)),
    });
  };

  return (
    <aside className="w-72 border-l border-[#242933] bg-[#12151b] flex flex-col h-full select-none shrink-0 z-20">
      <div className="p-3.5 border-b border-[#242933] flex items-center justify-between bg-[#0f1217]">
        <div className="flex items-center gap-1.5 font-bold text-white text-xs">
          <Crosshair className="w-3.5 h-3.5 text-blue-400" />
          <span>Anchor & Inspector</span>
        </div>
        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">
          Locked
        </span>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-5 text-xs text-slate-300">
        {/* ================= SECTION 1: ANCHOR POSITION ================= */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Visual Anchor Point
            </label>
            <button
              onClick={() =>
                setAnchor({ showAnchorIndicator: !anchor.showAnchorIndicator })
              }
              className={`text-[10px] font-medium px-2 py-0.5 rounded border transition-colors ${
                anchor.showAnchorIndicator
                  ? 'bg-blue-600/30 border-blue-500 text-blue-300'
                  : 'bg-[#171b23] border-[#242933] text-slate-400'
              }`}
            >
              {anchor.showAnchorIndicator ? 'Indicator On' : 'Indicator Off'}
            </button>
          </div>

          <p className="text-[11px] text-slate-400 leading-relaxed">
            The word <span className="font-bold text-blue-400">"{matchWord}"</span> remains
            visually pinned to this exact screen coordinate across every cut.
          </p>

          {/* Quick Anchor Placement Presets */}
          <div className="grid grid-cols-2 gap-1.5">
            <button
              onClick={() => handleAnchorChange(0.5, 0.5)}
              className={`px-2 py-1.5 rounded text-[11px] font-medium border text-center transition-colors ${
                Math.abs(anchor.x - 0.5) < 0.02 && Math.abs(anchor.y - 0.5) < 0.02
                  ? 'bg-blue-600 text-white border-blue-500'
                  : 'bg-[#171b23] border-[#242933] text-slate-300 hover:text-white'
              }`}
            >
              Exact Center (50, 50)
            </button>
            <button
              onClick={() => handleAnchorChange(0.5, 0.38)}
              className={`px-2 py-1.5 rounded text-[11px] font-medium border text-center transition-colors ${
                Math.abs(anchor.x - 0.5) < 0.02 && Math.abs(anchor.y - 0.38) < 0.02
                  ? 'bg-blue-600 text-white border-blue-500'
                  : 'bg-[#171b23] border-[#242933] text-slate-300 hover:text-white'
              }`}
            >
              Top Third (50, 38)
            </button>
            <button
              onClick={() => handleAnchorChange(0.5, 0.62)}
              className={`px-2 py-1.5 rounded text-[11px] font-medium border text-center transition-colors ${
                Math.abs(anchor.x - 0.5) < 0.02 && Math.abs(anchor.y - 0.62) < 0.02
                  ? 'bg-blue-600 text-white border-blue-500'
                  : 'bg-[#171b23] border-[#242933] text-slate-300 hover:text-white'
              }`}
            >
              Bottom Third (50, 62)
            </button>
            <button
              onClick={() => handleAnchorChange(0.5, 0.45)}
              className={`px-2 py-1.5 rounded text-[11px] font-medium border text-center transition-colors ${
                Math.abs(anchor.x - 0.5) < 0.02 && Math.abs(anchor.y - 0.45) < 0.02
                  ? 'bg-blue-600 text-white border-blue-500'
                  : 'bg-[#171b23] border-[#242933] text-slate-300 hover:text-white'
              }`}
            >
              Editorial Focus (50, 45)
            </button>
          </div>

          {/* Coordinate Sliders */}
          <div className="p-3 bg-[#171b24] rounded-lg border border-[#262d3c] space-y-3">
            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-[11px] text-slate-400">Anchor X Axis</span>
                <span className="font-mono text-white text-[11px]">
                  {Math.round(anchor.x * 100)}% ({Math.round(canvasWidth * anchor.x)}px)
                </span>
              </div>
              <input
                type="range"
                min="0.2"
                max="0.8"
                step="0.01"
                value={anchor.x}
                onChange={(e) => handleAnchorChange(parseFloat(e.target.value), anchor.y)}
                className="w-full accent-blue-500"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-[11px] text-slate-400">Anchor Y Axis</span>
                <span className="font-mono text-white text-[11px]">
                  {Math.round(anchor.y * 100)}% ({Math.round(canvasHeight * anchor.y)}px)
                </span>
              </div>
              <input
                type="range"
                min="0.2"
                max="0.8"
                step="0.01"
                value={anchor.y}
                onChange={(e) => handleAnchorChange(anchor.x, parseFloat(e.target.value))}
                className="w-full accent-blue-500"
              />
            </div>
          </div>
        </div>

        {/* ================= SECTION 2: COMPOSITION INSPECT ================= */}
        {currentComp && (
          <div className="space-y-3">
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Active Cut Inspector
            </label>

            <div className="p-3 bg-[#171b24] rounded-lg border border-[#262d3c] space-y-2 font-mono text-[11px]">
              <div className="flex justify-between">
                <span className="text-slate-400">Cut Index:</span>
                <span className="text-white">#{currentComp.index + 1}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Layout Style:</span>
                <span className="text-blue-400 font-semibold uppercase">{currentComp.layoutStyle}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Target Center:</span>
                <span className="text-white">
                  ({Math.round(currentComp.anchor.x)}, {Math.round(currentComp.anchor.y)})
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Word Center:</span>
                <span className="text-emerald-400">
                  ({Math.round(currentComp.matchWordBounds.centerX)},{' '}
                  {Math.round(currentComp.matchWordBounds.centerY)})
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Word Size:</span>
                <span className="text-white">
                  {Math.round(currentComp.matchWordBounds.width)} ×{' '}
                  {Math.round(currentComp.matchWordBounds.height)}px
                </span>
              </div>
            </div>

            {/* Elements in this composition */}
            <div>
              <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center justify-between">
                <span>Text Elements ({currentComp.elements.length})</span>
                <Layers className="w-3.5 h-3.5" />
              </div>
              <div className="space-y-1.5 max-h-56 overflow-y-auto">
                {currentComp.elements.map((el) => (
                  <div
                    key={el.id}
                    className={`p-2 rounded border text-[11px] ${
                      el.isMatchWord
                        ? 'bg-blue-950/40 border-blue-500/50 text-white font-bold'
                        : 'bg-[#151922] border-[#242a38] text-slate-300'
                    }`}
                  >
                    <div className="flex justify-between items-center mb-0.5">
                      <span className="truncate max-w-[140px] font-semibold">{el.text}</span>
                      {el.isMatchWord && (
                        <span className="text-[9px] bg-blue-500 text-white px-1 rounded uppercase">
                          MATCH
                        </span>
                      )}
                    </div>
                    <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                      <span>{el.fontFamily}</span>
                      <span>{el.fontSize}px</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};
