import React, { useState, useRef } from 'react';
import {
  X,
  Download,
  Film,
  Cpu,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { useEditorStore } from '../../stores/editorStore';
import {
  VideoExporter,
  getResolutionDimensions,
} from '../../engine/video/videoExporter';

export const ExportModal: React.FC = () => {
  const {
    isExportModalOpen,
    setIsExportModalOpen,
    exportSettings,
    setExportSettings,
    compositions,
    background,
    effects,
    animation,
    aspectRatio,
  } = useEditorStore();

  const [isExporting, setIsExporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [completedBlob, setCompletedBlob] = useState<Blob | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  if (!isExportModalOpen) return null;

  const isWebCodecsSupported = VideoExporter.isWebCodecsSupported();
  const { width, height } = getResolutionDimensions(
    exportSettings.resolution,
    aspectRatio
  );

  const handleStartExport = async () => {
    setIsExporting(true);
    setProgress(0);
    setErrorMessage(null);
    setCompletedBlob(null);

    abortControllerRef.current = new AbortController();

    try {
      const blob = await VideoExporter.exportVideo({
        compositions,
        background,
        effects,
        transitionType: animation.transition,
        transitionDuration: animation.transitionDuration,
        fps: exportSettings.fps,
        resolution: exportSettings.resolution,
        aspectRatio,
        format: exportSettings.format,
        onProgress: (p) => setProgress(p),
        signal: abortControllerRef.current.signal,
      });

      setCompletedBlob(blob);
      setIsExporting(false);

      // Trigger download automatically
      const extension = exportSettings.format === 'mp4' ? 'mp4' : 'webm';
      const filename = `matchcut_${aspectRatio.replace(':', 'x')}_${exportSettings.resolution}_${Date.now()}.${extension}`;
      VideoExporter.downloadBlob(blob, filename);
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        setErrorMessage(err.message || 'Export failed unexpectedly');
      }
      setIsExporting(false);
    }
  };

  const handleCancelExport = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setIsExporting(false);
    setProgress(0);
  };

  const handleDownloadAgain = () => {
    if (!completedBlob) return;
    const extension = exportSettings.format === 'mp4' ? 'mp4' : 'webm';
    const filename = `matchcut_${Date.now()}.${extension}`;
    VideoExporter.downloadBlob(completedBlob, filename);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-[#141820] border border-[#272e3c] rounded-2xl shadow-2xl overflow-hidden text-slate-200">
        {/* Header */}
        <div className="px-5 py-4 border-b border-[#242933] flex items-center justify-between bg-[#11141b]">
          <div className="flex items-center gap-2">
            <Film className="w-5 h-5 text-blue-400" />
            <h2 className="text-sm font-bold text-white tracking-wide">
              Export Kinetic Video
            </h2>
          </div>
          <button
            onClick={() => {
              if (isExporting) handleCancelExport();
              setIsExportModalOpen(false);
            }}
            className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-[#202532] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-5 text-xs">
          {/* Hardware acceleration badge */}
          <div className="flex items-center justify-between p-3 rounded-lg bg-[#181d27] border border-[#252c3a]">
            <div className="flex items-center gap-2">
              <Cpu className="w-4 h-4 text-emerald-400" />
              <div>
                <div className="font-semibold text-white text-xs">
                  {isWebCodecsSupported
                    ? 'Hardware WebCodecs Acceleration Active'
                    : 'MediaRecorder Canvas Fallback Active'}
                </div>
                <div className="text-[11px] text-slate-400">
                  {isWebCodecsSupported
                    ? 'Encoding directly via browser GPU hardware pipeline.'
                    : 'WebCodecs unavailable; using streaming canvas recorder.'}
                </div>
              </div>
            </div>
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                isWebCodecsSupported ? 'bg-emerald-500' : 'bg-amber-500'
              }`}
            />
          </div>

          {/* Export Settings Controls */}
          {!isExporting && !completedBlob && (
            <div className="space-y-4">
              {/* Format */}
              <div>
                <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">
                  Format
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setExportSettings({ format: 'mp4' })}
                    className={`py-2 px-3 rounded-lg border font-semibold text-xs flex flex-col items-center gap-0.5 transition-all ${
                      exportSettings.format === 'mp4'
                        ? 'bg-blue-600 text-white border-blue-500 shadow-sm'
                        : 'bg-[#181d27] border-[#252c3a] text-slate-300 hover:text-white'
                    }`}
                  >
                    <span>MP4 (H.264)</span>
                    <span className="text-[10px] font-normal opacity-80">
                      Standard for TikTok & Reels
                    </span>
                  </button>

                  <button
                    onClick={() => setExportSettings({ format: 'webm' })}
                    className={`py-2 px-3 rounded-lg border font-semibold text-xs flex flex-col items-center gap-0.5 transition-all ${
                      exportSettings.format === 'webm'
                        ? 'bg-blue-600 text-white border-blue-500 shadow-sm'
                        : 'bg-[#181d27] border-[#252c3a] text-slate-300 hover:text-white'
                    }`}
                  >
                    <span>WebM (VP8/VP9)</span>
                    <span className="text-[10px] font-normal opacity-80">
                      High efficiency web format
                    </span>
                  </button>
                </div>
              </div>

              {/* Resolution */}
              <div>
                <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">
                  Resolution
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['720p', '1080p', '1440p'] as const).map((res) => (
                    <button
                      key={res}
                      onClick={() => setExportSettings({ resolution: res })}
                      className={`py-2 rounded-lg border font-semibold text-xs text-center transition-all ${
                        exportSettings.resolution === res
                          ? 'bg-blue-600 text-white border-blue-500 shadow-sm'
                          : 'bg-[#181d27] border-[#252c3a] text-slate-300 hover:text-white'
                      }`}
                    >
                      {res}
                    </button>
                  ))}
                </div>
                <div className="text-[11px] text-slate-400 mt-1 font-mono">
                  Output Dimensions: {width} × {height}px ({aspectRatio})
                </div>
              </div>

              {/* Frame rate */}
              <div>
                <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">
                  Frame Rate (FPS)
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {([24, 30, 60] as const).map((f) => (
                    <button
                      key={f}
                      onClick={() => setExportSettings({ fps: f })}
                      className={`py-2 rounded-lg border font-mono font-semibold text-xs text-center transition-all ${
                        exportSettings.fps === f
                          ? 'bg-blue-600 text-white border-blue-500 shadow-sm'
                          : 'bg-[#181d27] border-[#252c3a] text-slate-300 hover:text-white'
                      }`}
                    >
                      {f} FPS
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Progress / Status Display during Export */}
          {isExporting && (
            <div className="py-6 space-y-4 text-center">
              <Loader2 className="w-8 h-8 text-blue-500 animate-spin mx-auto" />
              <div>
                <div className="text-sm font-bold text-white mb-1">
                  Exporting Kinetic Match Cut Video...
                </div>
                <div className="text-xs text-slate-400">
                  Rendering frames at {width}×{height} ({exportSettings.fps} FPS)
                </div>
              </div>

              {/* Progress Bar */}
              <div className="space-y-1.5 max-w-sm mx-auto">
                <div className="w-full h-3 bg-[#1e2430] rounded-full overflow-hidden border border-[#2b3344] p-0.5">
                  <div
                    className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full transition-all duration-150"
                    style={{ width: `${Math.round(progress * 100)}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs font-mono text-slate-400">
                  <span>{Math.round(progress * 100)}%</span>
                  <span>{progress < 1 ? 'Encoding frames...' : 'Finalizing file...'}</span>
                </div>
              </div>

              <button
                onClick={handleCancelExport}
                className="px-4 py-1.5 rounded-lg bg-[#222834] hover:bg-[#2b3342] text-slate-300 text-xs font-medium transition-colors"
              >
                Cancel
              </button>
            </div>
          )}

          {/* Completed State */}
          {!isExporting && completedBlob && (
            <div className="py-6 space-y-4 text-center">
              <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
              <div>
                <div className="text-base font-bold text-white mb-1">
                  Video Render Complete!
                </div>
                <div className="text-xs text-slate-400">
                  Your video has been exported and saved to your Downloads folder.
                </div>
              </div>

              <div className="flex justify-center gap-3">
                <button
                  onClick={handleDownloadAgain}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs shadow-lg transition-all"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Again</span>
                </button>
                <button
                  onClick={() => setIsExportModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-[#202532] hover:bg-[#282f40] text-slate-300 text-xs font-medium transition-colors"
                >
                  Done
                </button>
              </div>
            </div>
          )}

          {/* Error Message */}
          {errorMessage && (
            <div className="p-3 rounded-lg bg-red-950/40 border border-red-500/50 flex items-start gap-2 text-red-200">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <div>
                <div className="font-semibold text-xs">Export encountered an issue</div>
                <div className="text-[11px] text-red-300">{errorMessage}</div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {!isExporting && !completedBlob && (
          <div className="px-5 py-3 border-t border-[#242933] bg-[#11141b] flex items-center justify-end gap-2">
            <button
              onClick={() => setIsExportModalOpen(false)}
              className="px-4 py-2 rounded-lg text-slate-400 hover:text-white hover:bg-[#1a1f29] transition-colors text-xs font-medium"
            >
              Cancel
            </button>
            <button
              onClick={handleStartExport}
              className="flex items-center gap-1.5 px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs shadow-lg shadow-blue-600/30 active:scale-95 transition-all"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Start Render & Export</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
