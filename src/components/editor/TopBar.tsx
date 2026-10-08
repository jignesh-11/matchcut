import React, { useRef } from 'react';
import {
  Sparkles,
  Download,
  FolderOpen,
  Save,
  RotateCcw,
  Undo2,
  Redo2,
  Smartphone,
  Square,
  Monitor,
  Eye,
  PlusCircle,
} from 'lucide-react';
import { useEditorStore } from '../../stores/editorStore';
import { AspectRatioType } from '../../types/rendering';

export const TopBar: React.FC = () => {
  const {
    currentView,
    setCurrentView,
    aspectRatio,
    setAspectRatio,
    undo,
    redo,
    canUndo,
    canRedo,
    resetToDefaults,
    setIsExportModalOpen,
    exportProjectJSON,
    importProjectJSON,
    setNotification,
  } = useEditorStore();

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSaveProject = () => {
    const jsonStr = exportProjectJSON();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `matchcut-project-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setNotification('Project saved to JSON file');
    setTimeout(() => setNotification(null), 3000);
  };

  const handleOpenProject = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const success = importProjectJSON(content);
      if (success) {
        setNotification('Project loaded successfully');
      } else {
        setNotification('Failed to load project: Invalid JSON file');
      }
      setTimeout(() => setNotification(null), 4000);
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <header className="h-14 border-b border-[#242933] bg-[#12151b] px-4 flex items-center justify-between select-none z-30 shrink-0 overflow-x-auto no-scrollbar gap-4">
      {/* Brand & Landing toggle */}
      <div className="flex items-center gap-3 shrink-0">
        <button
          onClick={() => setCurrentView(currentView === 'landing' ? 'editor' : 'landing')}
          className="flex items-center gap-2 group text-left"
          title="Toggle Landing / Editor"
        >
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20 group-hover:scale-105 transition-transform">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-1.5 font-bold tracking-tight text-white text-sm">
              <span>MATCHTYPE</span>
              <span className="text-[10px] font-semibold tracking-wider px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400 border border-blue-500/30">
                PRO
              </span>
            </div>
            <div className="text-[11px] text-slate-400 hidden sm:block">
              Kinetic Text Match Cut
            </div>
          </div>
        </button>

        <div className="h-5 w-px bg-[#242933] mx-1 hidden md:block" />

        {/* View Switcher Button */}
        <button
          onClick={() => setCurrentView(currentView === 'landing' ? 'editor' : 'landing')}
          className="hidden md:flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md text-slate-300 hover:text-white hover:bg-[#1c2028] border border-transparent hover:border-[#2e3646] transition-colors"
        >
          <Eye className="w-3.5 h-3.5 text-slate-400" />
          <span>{currentView === 'landing' ? 'Enter Editor' : 'Hero Landing'}</span>
        </button>
      </div>

      {/* Aspect Ratio & Undo/Redo */}
      <div className="flex items-center gap-1 sm:gap-2 shrink-0">
        <div className="flex items-center bg-[#171a22] p-0.5 rounded-lg border border-[#242933]">
          <button
            onClick={() => setAspectRatio('9:16')}
            className={`flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-md transition-all ${
              aspectRatio === '9:16'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-[#202530]'
            }`}
            title="9:16 Vertical (Reels/TikTok)"
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">9:16</span>
          </button>
          <button
            onClick={() => setAspectRatio('1:1')}
            className={`flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-md transition-all ${
              aspectRatio === '1:1'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-[#202530]'
            }`}
            title="1:1 Square (Instagram Feed)"
          >
            <Square className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">1:1</span>
          </button>
          <button
            onClick={() => setAspectRatio('16:9')}
            className={`flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-md transition-all ${
              aspectRatio === '16:9'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-[#202530]'
            }`}
            title="16:9 Landscape (YouTube/Desktop)"
          >
            <Monitor className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">16:9</span>
          </button>
        </div>

        <div className="h-5 w-px bg-[#242933] mx-1 hidden sm:block" />

        {/* Undo / Redo */}
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={undo}
            disabled={!canUndo()}
            className="p-1.5 rounded-md text-slate-400 hover:text-white hover:bg-[#1c2028] disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-slate-400 transition-colors"
            title="Undo (Ctrl+Z)"
          >
            <Undo2 className="w-4 h-4" />
          </button>
          <button
            onClick={redo}
            disabled={!canRedo()}
            className="p-1.5 rounded-md text-slate-400 hover:text-white hover:bg-[#1c2028] disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-slate-400 transition-colors"
            title="Redo (Ctrl+Shift+Z)"
          >
            <Redo2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Project actions & Export */}
      <div className="flex items-center gap-2 shrink-0">
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleOpenProject}
          accept=".json"
          className="hidden"
        />

        <button
          onClick={resetToDefaults}
          className="p-1.5 text-slate-400 hover:text-white hover:bg-[#1c2028] rounded-md transition-colors hidden lg:flex items-center gap-1 text-xs font-medium"
          title="Reset Project"
        >
          <PlusCircle className="w-3.5 h-3.5" />
          <span>New</span>
        </button>

        <button
          onClick={() => fileInputRef.current?.click()}
          className="p-1.5 text-slate-400 hover:text-white hover:bg-[#1c2028] rounded-md transition-colors hidden sm:flex items-center gap-1 text-xs font-medium"
          title="Import Project JSON"
        >
          <FolderOpen className="w-3.5 h-3.5" />
          <span>Open</span>
        </button>

        <button
          onClick={handleSaveProject}
          className="p-1.5 text-slate-400 hover:text-white hover:bg-[#1c2028] rounded-md transition-colors hidden sm:flex items-center gap-1 text-xs font-medium"
          title="Save Project JSON"
        >
          <Save className="w-3.5 h-3.5" />
          <span>Save</span>
        </button>

        <button
          onClick={() => setIsExportModalOpen(true)}
          className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/25 active:scale-95 transition-all"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Export</span>
        </button>
      </div>
    </header>
  );
};
