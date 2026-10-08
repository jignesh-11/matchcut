import React, { useRef } from 'react';
import {
  Clock,
  Gauge,
  SlidersHorizontal,
  ChevronRight,
  Maximize2,
} from 'lucide-react';
import { useEditorStore } from '../../stores/editorStore';

export const Timeline: React.FC = () => {
  const {
    compositions,
    currentCompositionIndex,
    setCurrentCompositionIndex,
    currentTime,
    setCurrentTime,
    setIsPlaying,
    animation,
    setAnimation,
  } = useEditorStore();

  const trackRef = useRef<HTMLDivElement>(null);

  const totalDuration = compositions.reduce((sum, c) => sum + c.duration, 0) || 1;

  // Jump to specific cut
  const handleCutClick = (index: number) => {
    let accumulated = 0;
    for (let i = 0; i < index; i++) {
      accumulated += compositions[i].duration;
    }
    setCurrentCompositionIndex(index);
    setCurrentTime(accumulated);
  };

  // Timeline scrubber click / drag
  const handleScrub = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!trackRef.current) return;
    const rect = trackRef.current.getBoundingClientRect();
    const clickX = Math.max(0, Math.min(rect.width, e.clientX - rect.left));
    const ratio = clickX / rect.width;
    const targetTime = ratio * totalDuration;

    let accum = 0;
    let targetIndex = 0;
    for (let i = 0; i < compositions.length; i++) {
      if (targetTime >= accum && targetTime < accum + compositions[i].duration) {
        targetIndex = i;
        break;
      }
      accum += compositions[i].duration;
    }

    setCurrentTime(targetTime);
    setCurrentCompositionIndex(targetIndex);
  };

  const playheadPercent = Math.min(100, Math.max(0, (currentTime / totalDuration) * 100));

  return (
    <footer className="h-28 border-t border-[#242933] bg-[#101318] px-4 py-2 flex flex-col justify-between select-none z-20 shrink-0">
      {/* Top Header of Timeline: Stats & Global Speed */}
      <div className="flex items-center justify-between text-xs text-slate-400">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 font-semibold text-slate-200">
            <Clock className="w-3.5 h-3.5 text-blue-400" />
            <span>Timeline</span>
          </div>

          <div className="flex items-center gap-1 font-mono text-[11px] text-slate-400">
            <span>Duration:</span>
            <span className="text-white font-bold">{totalDuration.toFixed(2)}s</span>
            <span>({Math.round(totalDuration * animation.fps)} frames @ {animation.fps}fps)</span>
          </div>
        </div>

        {/* Global Speed Selector */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 text-[11px]">
            <Gauge className="w-3.5 h-3.5 text-slate-400" />
            <span>Speed:</span>
          </div>
          <div className="flex items-center bg-[#171b23] rounded p-0.5 border border-[#242933]">
            {([0.5, 0.75, 1.0, 1.5, 2.0] as const).map((spd) => (
              <button
                key={spd}
                onClick={() => setAnimation({ speedMultiplier: spd })}
                className={`px-2 py-0.5 rounded text-[10px] font-mono font-medium transition-colors ${
                  animation.speedMultiplier === spd
                    ? 'bg-blue-600 text-white font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {spd}x
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Interactive Track */}
      <div
        ref={trackRef}
        onClick={handleScrub}
        className="relative h-14 bg-[#141820] rounded-lg border border-[#232936] p-1 flex items-stretch gap-1 cursor-pointer overflow-hidden group shadow-inner"
      >
        {/* Playhead Indicator Line */}
        <div
          className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-30 pointer-events-none transition-all duration-75 shadow-lg shadow-red-500/50"
          style={{ left: `${playheadPercent}%` }}
        >
          <div className="w-2.5 h-2.5 bg-red-500 rounded-full -ml-1 -mt-0.5 shadow-md" />
        </div>

        {/* Composition Segments */}
        {compositions.map((comp, idx) => {
          const isActive = currentCompositionIndex === idx;
          const flexRatio = comp.duration / totalDuration;

          return (
            <div
              key={comp.id}
              onClick={(e) => {
                e.stopPropagation();
                handleCutClick(idx);
              }}
              style={{ flex: flexRatio }}
              className={`relative rounded-md flex flex-col justify-between p-1.5 transition-all overflow-hidden border ${
                isActive
                  ? 'bg-gradient-to-b from-blue-600/30 to-blue-800/40 border-blue-500 text-white shadow-md'
                  : 'bg-[#191e28] hover:bg-[#202736] border-[#293142] text-slate-300'
              }`}
            >
              <div className="flex items-center justify-between pointer-events-none">
                <span className="font-bold text-[11px] truncate">
                  Cut {idx + 1}
                </span>
                <span className="text-[9px] font-mono px-1 rounded bg-black/40 text-slate-300">
                  {comp.duration.toFixed(2)}s
                </span>
              </div>

              <div className="flex items-center justify-between text-[9px] text-slate-400 uppercase tracking-wider font-semibold pointer-events-none">
                <span className="truncate">{comp.layoutStyle}</span>
                <span className="text-[8px] text-blue-400 font-mono">
                  {comp.elements.length} els
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </footer>
  );
};
