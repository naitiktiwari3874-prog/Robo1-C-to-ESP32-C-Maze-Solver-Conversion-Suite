import React, { useState } from 'react';
import { Header } from './components/Header';
import { PureCppExplorer } from './components/PureCppExplorer';
import { CodeConversionStudio } from './components/CodeConversionStudio';
import { HardwareDiagram } from './components/HardwareDiagram';
import { PortingGuide } from './components/PortingGuide';
import { TargetBoard, TargetFramework } from './types/codebase';

export default function App() {
  const [currentTab, setCurrentTab] = useState<string>('cpp_explorer');
  const [targetBoard, setTargetBoard] = useState<TargetBoard>('esp32_wroom');
  const [targetFramework, setTargetFramework] = useState<TargetFramework>('arduino_esp32');

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Header with Navigation and ZIP Exporter */}
      <Header
        currentTab={currentTab}
        onTabChange={setCurrentTab}
        targetBoard={targetBoard}
        onBoardChange={setTargetBoard}
        targetFramework={targetFramework}
        onFrameworkChange={setTargetFramework}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {currentTab === 'cpp_explorer' && (
          <PureCppExplorer
            targetBoard={targetBoard}
            targetFramework={targetFramework}
          />
        )}

        {currentTab === 'conversion' && (
          <CodeConversionStudio
            targetBoard={targetBoard}
            targetFramework={targetFramework}
          />
        )}

        {currentTab === 'hardware' && (
          <HardwareDiagram />
        )}

        {currentTab === 'guide' && (
          <PortingGuide />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-900/60 py-4 mt-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-wrap items-center justify-between gap-4 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
            <span className="font-medium text-slate-300">Robo1 ESP32 Pure C++ Firmware Backend</span>
            <span className="text-slate-600">|</span>
            <span>240MHz Dual-Core Xtensa &bull; FreeRTOS &bull; 20kHz LEDC PWM &bull; QTR-16 MUX &bull; LSRB Maze Engine</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setCurrentTab('cpp_explorer')}
              className="hover:text-cyan-400 transition-colors cursor-pointer"
            >
              C++ Source Files
            </button>
            <span className="text-slate-700">&bull;</span>
            <button
              onClick={() => setCurrentTab('hardware')}
              className="hover:text-cyan-400 transition-colors cursor-pointer"
            >
              Pinout Reference
            </button>
            <span className="text-slate-700">&bull;</span>
            <span className="text-slate-500 font-mono">PlatformIO / Arduino Ready</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
