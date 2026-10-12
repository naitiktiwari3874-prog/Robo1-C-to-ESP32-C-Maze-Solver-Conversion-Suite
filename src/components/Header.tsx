import React from 'react';
import { TargetBoard, TargetFramework } from '../types/codebase';
import { Download, Cpu, Code2, Layers, BookOpen, CheckCircle2, FolderTree } from 'lucide-react';
import { exportEsp32ProjectZip } from '../utils/zipExporter';

interface HeaderProps {
  currentTab: string;
  onTabChange: (tab: string) => void;
  targetBoard: TargetBoard;
  onBoardChange: (board: TargetBoard) => void;
  targetFramework: TargetFramework;
  onFrameworkChange: (framework: TargetFramework) => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  onTabChange,
  targetBoard,
  onBoardChange,
  targetFramework,
  onFrameworkChange
}) => {
  const [downloading, setDownloading] = React.useState(false);
  const [downloadSuccess, setDownloadSuccess] = React.useState(false);

  const handleDownload = async () => {
    try {
      setDownloading(true);
      const blob = await exportEsp32ProjectZip(targetBoard, targetFramework);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Robo1_ESP32_Pure_CPP_${targetBoard}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 3000);
    } catch (err) {
      console.error('Download failed:', err);
    } finally {
      setDownloading(false);
    }
  };

  const navItems = [
    { id: 'cpp_explorer', label: 'Pure C++ Firmware Files', icon: FolderTree },
    { id: 'conversion', label: 'C to ESP32 C++ Diff Studio', icon: Code2 },
    { id: 'hardware', label: 'Pinout & Hardware Architecture', icon: Layers },
    { id: 'guide', label: 'FreeRTOS Porting Guide', icon: BookOpen }
  ];

  return (
    <header className="border-b border-slate-800 bg-slate-900/90 backdrop-blur-md sticky top-0 z-50">
      {/* Top Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20 text-white font-bold tracking-wider">
            C++
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-white tracking-tight">Robo1 ESP32 C++ Backend</h1>
              <span className="px-2 py-0.5 text-xs font-semibold rounded bg-cyan-950 text-cyan-400 border border-cyan-800">
                Pure C++17 Firmware
              </span>
              <span className="px-2 py-0.5 text-xs font-medium rounded bg-emerald-950 text-emerald-400 border border-emerald-800 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                FreeRTOS Dual-Core
              </span>
            </div>
            <p className="text-xs text-slate-400">
              QTR-16 Mux &bull; 20kHz Silent LEDC PWM &bull; Filtered PID &bull; LSRB Line Maze Solver &bull; SH1106 OLED
            </p>
          </div>
        </div>

        {/* Board & Framework Selectors + Download */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-slate-800/80 px-2.5 py-1.5 rounded-lg border border-slate-700 text-xs">
            <Cpu className="w-4 h-4 text-cyan-400" />
            <span className="text-slate-400 font-medium">Board:</span>
            <select
              value={targetBoard}
              onChange={(e) => onBoardChange(e.target.value as TargetBoard)}
              className="bg-slate-900 text-slate-200 rounded px-2 py-0.5 border border-slate-700 focus:outline-none focus:border-cyan-500 font-mono text-xs cursor-pointer"
            >
              <option value="esp32_wroom">ESP32-WROOM-32</option>
              <option value="esp32_s3">ESP32-S3</option>
              <option value="esp32_c3">ESP32-C3</option>
            </select>
          </div>

          <div className="flex items-center gap-2 bg-slate-800/80 px-2.5 py-1.5 rounded-lg border border-slate-700 text-xs">
            <span className="text-slate-400 font-medium">SDK:</span>
            <select
              value={targetFramework}
              onChange={(e) => onFrameworkChange(e.target.value as TargetFramework)}
              className="bg-slate-900 text-slate-200 rounded px-2 py-0.5 border border-slate-700 focus:outline-none focus:border-cyan-500 font-mono text-xs cursor-pointer"
            >
              <option value="arduino_esp32">Arduino-ESP32 (C++17)</option>
              <option value="esp_idf">ESP-IDF Native C++</option>
            </select>
          </div>

          <button
            onClick={handleDownload}
            disabled={downloading}
            className="flex items-center gap-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-medium px-3.5 py-1.5 rounded-lg text-xs shadow-md shadow-cyan-600/20 transition-all cursor-pointer disabled:opacity-50"
            title="Download full PlatformIO & Arduino project ready to flash"
          >
            {downloadSuccess ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                <span>Downloaded!</span>
              </>
            ) : downloading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                <span>Packaging...</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                <span>Download Pure C++ (.ZIP)</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 border-t border-slate-800/60 overflow-x-auto">
        <div className="flex gap-1 py-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={`flex items-center gap-2 px-3.5 py-2 text-xs font-medium rounded-md whitespace-nowrap transition-colors cursor-pointer ${
                  isActive
                    ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-cyan-400' : 'text-slate-500'}`} />
                {item.label}
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
};
