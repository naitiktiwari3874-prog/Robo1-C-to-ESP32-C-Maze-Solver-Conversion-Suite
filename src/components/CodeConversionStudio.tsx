import React, { useState } from 'react';
import { CONVERSION_MODULES } from '../data/modulesData';
import { TargetBoard, TargetFramework } from '../types/codebase';
import { Copy, Check, ArrowRight, Sparkles, FileCode, CheckCircle2, Search, Split, Maximize2, ShieldAlert } from 'lucide-react';

interface CodeConversionStudioProps {
  targetBoard: TargetBoard;
  targetFramework: TargetFramework;
}

export const CodeConversionStudio: React.FC<CodeConversionStudioProps> = ({
  targetBoard,
  targetFramework
}) => {
  const [selectedModuleId, setSelectedModuleId] = useState<string>('motor');
  const [copiedSide, setCopiedSide] = useState<'left' | 'right' | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [layoutMode, setLayoutMode] = useState<'split' | 'tabs'>('split');
  const [activeTabSide, setActiveTabSide] = useState<'c' | 'cpp'>('cpp');

  const activeModule = CONVERSION_MODULES.find(m => m.id === selectedModuleId) || CONVERSION_MODULES[0];

  const handleCopy = (text: string, side: 'left' | 'right') => {
    navigator.clipboard.writeText(text);
    setCopiedSide(side);
    setTimeout(() => setCopiedSide(null), 2000);
  };

  const getCppCode = () => {
    return targetFramework === 'arduino_esp32'
      ? activeModule.cppCodeArduino
      : activeModule.cppCodeIdf;
  };

  return (
    <div className="space-y-4">
      {/* Module Selector Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1.5">
          {CONVERSION_MODULES.map((mod) => {
            const isSelected = mod.id === selectedModuleId;
            return (
              <button
                key={mod.id}
                onClick={() => setSelectedModuleId(mod.id)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-cyan-500 text-slate-950 font-bold shadow-md shadow-cyan-500/20'
                    : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700/80 hover:text-white border border-slate-700/60'
                }`}
              >
                <FileCode className="w-3.5 h-3.5" />
                <span>{mod.name}</span>
                <span className={`text-[10px] px-1 py-0.2 rounded font-mono ${
                  isSelected ? 'bg-slate-950/20 text-slate-950' : 'bg-slate-900 text-slate-400'
                }`}>
                  {mod.cFileName}
                </span>
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Find in code..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-3 py-1 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500 w-44"
            />
          </div>

          <div className="flex rounded-lg border border-slate-800 bg-slate-950 p-0.5">
            <button
              onClick={() => setLayoutMode('split')}
              className={`p-1 rounded text-xs cursor-pointer ${
                layoutMode === 'split' ? 'bg-slate-800 text-cyan-400' : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Side-by-side comparison"
            >
              <Split className="w-4 h-4" />
            </button>
            <button
              onClick={() => setLayoutMode('tabs')}
              className={`p-1 rounded text-xs cursor-pointer ${
                layoutMode === 'tabs' ? 'bg-slate-800 text-cyan-400' : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Stacked tab view"
            >
              <Maximize2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Migration Highlights & Architecture Differences */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center gap-2 text-amber-400 text-xs font-semibold uppercase tracking-wider mb-2">
            <ShieldAlert className="w-4 h-4" />
            <span>Key Translation Changes & Porting Steps</span>
          </div>
          <ul className="space-y-1.5 text-xs text-slate-300">
            {activeModule.keyChanges.map((change, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="text-amber-500 font-bold">&bull;</span>
                <span>{change}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center gap-2 text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-2">
            <Sparkles className="w-4 h-4" />
            <span>ESP32 Hardware & Architectural Gains</span>
          </div>
          <ul className="space-y-1.5 text-xs text-slate-300">
            {activeModule.esp32Advantages.map((adv, i) => (
              <li key={i} className="flex items-start gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                <span>{adv}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Code Viewer Viewport */}
      {layoutMode === 'split' ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Left: Original C Code */}
          <div className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden flex flex-col">
            <div className="bg-slate-900/90 px-4 py-2.5 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-slate-600"></span>
                <span className="text-xs font-bold text-slate-300 font-mono">{activeModule.cFileName}</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 font-mono">
                  Legacy C (AVR / 8-bit)
                </span>
              </div>
              <button
                onClick={() => handleCopy(activeModule.cCode, 'left')}
                className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 px-2 py-1 rounded transition-colors cursor-pointer"
              >
                {copiedSide === 'left' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedSide === 'left' ? 'Copied' : 'Copy C'}</span>
              </button>
            </div>
            <div className="p-4 font-mono text-xs overflow-auto max-h-[620px] bg-slate-950 text-slate-300 leading-relaxed">
              <pre className="whitespace-pre">
                {activeModule.cCode}
              </pre>
            </div>
          </div>

          {/* Right: Modern Converted ESP32 C++ Code */}
          <div className="bg-slate-950 border border-cyan-900/50 rounded-xl overflow-hidden flex flex-col shadow-lg shadow-cyan-950/20">
            <div className="bg-gradient-to-r from-slate-900 to-cyan-950/40 px-4 py-2.5 border-b border-cyan-900/40 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse"></span>
                <span className="text-xs font-bold text-cyan-300 font-mono">{activeModule.cppFileName}</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-900/60 text-cyan-300 font-mono border border-cyan-800/60">
                  ESP32 C++ (C++17)
                </span>
              </div>
              <button
                onClick={() => handleCopy(getCppCode(), 'right')}
                className="flex items-center gap-1.5 text-xs text-cyan-300 hover:text-white bg-cyan-950 hover:bg-cyan-900 border border-cyan-800 px-2.5 py-1 rounded transition-colors cursor-pointer"
              >
                {copiedSide === 'right' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedSide === 'right' ? 'Copied' : 'Copy C++'}</span>
              </button>
            </div>
            <div className="p-4 font-mono text-xs overflow-auto max-h-[620px] bg-slate-950 text-emerald-200/90 leading-relaxed">
              <pre className="whitespace-pre">
                {getCppCode()}
              </pre>
            </div>
          </div>
        </div>
      ) : (
        /* Single Tab Stacked View */
        <div className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden">
          <div className="bg-slate-900 px-4 py-2 border-b border-slate-800 flex items-center justify-between">
            <div className="flex gap-2">
              <button
                onClick={() => setActiveTabSide('cpp')}
                className={`px-3 py-1 text-xs font-mono font-medium rounded cursor-pointer ${
                  activeTabSide === 'cpp'
                    ? 'bg-cyan-500 text-slate-950 font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {activeModule.cppFileName} (ESP32 C++)
              </button>
              <button
                onClick={() => setActiveTabSide('c')}
                className={`px-3 py-1 text-xs font-mono font-medium rounded cursor-pointer ${
                  activeTabSide === 'c'
                    ? 'bg-slate-700 text-white font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {activeModule.cFileName} (Original C)
              </button>
            </div>

            <button
              onClick={() => handleCopy(activeTabSide === 'cpp' ? getCppCode() : activeModule.cCode, 'right')}
              className="flex items-center gap-1.5 text-xs text-slate-300 hover:text-white bg-slate-800 px-2 py-1 rounded"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>Copy Code</span>
            </button>
          </div>
          <div className="p-4 font-mono text-xs overflow-auto max-h-[600px] text-slate-200 leading-relaxed">
            <pre className="whitespace-pre">
              {activeTabSide === 'cpp' ? getCppCode() : activeModule.cCode}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
};
