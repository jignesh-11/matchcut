import React, { useState } from 'react';
import { useEditorStore } from './stores/editorStore';
import { TopBar } from './components/editor/TopBar';
import { LeftSidebar } from './components/editor/LeftSidebar';
import { PreviewCanvas } from './components/preview/PreviewCanvas';
import { Timeline } from './components/timeline/Timeline';
import { ExportModal } from './components/export/ExportModal';
import { LandingPage } from './components/landing/LandingPage';
import { Sliders, Eye } from 'lucide-react';

export const App: React.FC = () => {
  const { currentView, notification } = useEditorStore();
  const [mobileTab, setMobileTab] = useState<'preview' | 'controls' | 'inspector'>('preview');

  if (currentView === 'landing') {
    return (
      <div className="h-screen w-screen flex flex-col overflow-hidden">
        <TopBar />
        <div className="flex-1 overflow-y-auto">
          <LandingPage />
        </div>
        <ExportModal />
      </div>
    );
  }

  return (
    <div className="h-screen w-screen flex flex-col bg-[#0d0f12] text-slate-100 overflow-hidden font-sans">
      {/* Top Application Bar */}
      <TopBar />

      {/* Notification Toast */}
      {notification && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-50 px-4 py-2 bg-blue-600 text-white font-medium text-xs rounded-full shadow-2xl shadow-blue-500/40 border border-blue-400/30 animate-bounce">
          {notification}
        </div>
      )}

      {/* Mobile Tab Switcher (< 768px) */}
      <div className="flex md:hidden bg-[#11141a] border-b border-[#242933] p-1 justify-around text-xs">
        <button
          onClick={() => setMobileTab('preview')}
          className={`flex items-center gap-1.5 py-1 px-3 rounded-md ${
            mobileTab === 'preview' ? 'bg-blue-600 text-white font-bold' : 'text-slate-400'
          }`}
        >
          <Eye className="w-3.5 h-3.5" />
          <span>Preview</span>
        </button>
        <button
          onClick={() => setMobileTab('controls')}
          className={`flex items-center gap-1.5 py-1 px-3 rounded-md ${
            mobileTab === 'controls' ? 'bg-blue-600 text-white font-bold' : 'text-slate-400'
          }`}
        >
          <Sliders className="w-3.5 h-3.5" />
          <span>Controls</span>
        </button>
      </div>

      {/* Main Workspace */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Left Sidebar (Desktop always, Mobile conditional) */}
        <div className={`${mobileTab === 'controls' ? 'flex w-full' : 'hidden md:flex'}`}>
          <LeftSidebar />
        </div>

        {/* Center Preview Canvas */}
        <div className={`${mobileTab === 'preview' ? 'flex flex-1' : 'hidden md:flex flex-1'}`}>
          <PreviewCanvas />
        </div>

      </div>

      {/* Bottom Timeline */}
      <Timeline />

      {/* Export Modal */}
      <ExportModal />
    </div>
  );
};

export default App;
