import React, { useState } from 'react';
import { ESP_CPP_CODEBASE } from '../data/espCppCodebase';
import { FileCode, Download, Copy, Check, Terminal, FolderTree, Cpu, Sparkles, Code2 } from 'lucide-react';
import { TargetBoard, TargetFramework } from '../types/codebase';

interface PureCppExplorerProps {
  targetBoard: TargetBoard;
  targetFramework: TargetFramework;
}

interface CppFileItem {
  path: string;
  filename: string;
  category: 'header' | 'source' | 'sketch' | 'config' | 'docs';
  content: string;
  description: string;
}

export const PureCppExplorer: React.FC<PureCppExplorerProps> = ({
  targetBoard,
  targetFramework
}) => {
  const cppFiles: CppFileItem[] = [
    {
      path: 'esp32_firmware/include/ESP32_Config.hpp',
      filename: 'ESP32_Config.hpp',
      category: 'header',
      content: ESP_CPP_CODEBASE.config_hpp,
      description: 'Pin mappings, LEDC hardware PWM channels, 12-bit ADC parameters, and PID default gains.'
    },
    {
      path: 'esp32_firmware/include/MotorController.hpp',
      filename: 'MotorController.hpp',
      category: 'header',
      content: ESP_CPP_CODEBASE.motor_hpp,
      description: 'Differential motor driver class interface with 20kHz ultrasonic LEDC PWM and calibrated turns.'
    },
    {
      path: 'esp32_firmware/src/MotorController.cpp',
      filename: 'MotorController.cpp',
      category: 'source',
      content: ESP_CPP_CODEBASE.motor_cpp,
      description: 'LEDC hardware timer implementation, speed clamping (-255..255), and H-bridge fast-decay braking.'
    },
    {
      path: 'esp32_firmware/include/QTRSensors16.hpp',
      filename: 'QTRSensors16.hpp',
      category: 'header',
      content: ESP_CPP_CODEBASE.qtr16_hpp,
      description: '16-channel reflectance sensor bar header with intersection classification types.'
    },
    {
      path: 'esp32_firmware/src/QTRSensors16.cpp',
      filename: 'QTRSensors16.cpp',
      category: 'source',
      content: ESP_CPP_CODEBASE.qtr16_cpp,
      description: '74HC4067 multiplexer fast sampling (4us delay) and weighted line centroid (-7500..+7500).'
    },
    {
      path: 'esp32_firmware/include/PIDController.hpp',
      filename: 'PIDController.hpp',
      category: 'header',
      content: ESP_CPP_CODEBASE.pid_hpp,
      description: 'Discrete PID controller class with integral anti-windup clamping and derivative filtering.'
    },
    {
      path: 'esp32_firmware/src/PIDController.cpp',
      filename: 'PIDController.cpp',
      category: 'source',
      content: ESP_CPP_CODEBASE.pid_cpp,
      description: 'High-precision microsecond delta-time calculation via esp_timer_get_time() and derivative filter.'
    },
    {
      path: 'esp32_firmware/include/MazeSolver.hpp',
      filename: 'MazeSolver.hpp',
      category: 'header',
      content: ESP_CPP_CODEBASE.maze_hpp,
      description: 'Autonomous maze solver class interface for Tremaux Left-Hand Rule and speed run modes.'
    },
    {
      path: 'esp32_firmware/src/MazeSolver.cpp',
      filename: 'MazeSolver.cpp',
      category: 'source',
      content: ESP_CPP_CODEBASE.maze_cpp,
      description: 'Canonical LSRB dead-end cancellation engine (LBL->S, LBS->R, RBL->B, SBL->R, SBS->B, LBR->B).'
    },
    {
      path: 'esp32_firmware/include/DisplayManager.hpp',
      filename: 'DisplayManager.hpp',
      category: 'header',
      content: ESP_CPP_CODEBASE.display_hpp,
      description: 'SH1106 128x64 I2C OLED display manager header for live sensor bar graph HUD.'
    },
    {
      path: 'esp32_firmware/src/DisplayManager.cpp',
      filename: 'DisplayManager.cpp',
      category: 'source',
      content: `/**
 * @file DisplayManager.cpp
 * @brief SH1106 128x64 OLED Display Implementation for ESP32
 */
#include "DisplayManager.hpp"

namespace Robo1 {

DisplayManager::DisplayManager()
    : m_display(OLED_WIDTH, OLED_HEIGHT, &Wire, -1) {}

bool DisplayManager::init() {
    Wire.begin(PIN_I2C_SDA, PIN_I2C_SCL);
    if (!m_display.begin(OLED_I2C_ADDR, true)) {
        return false;
    }
    m_display.clearDisplay();
    m_display.setTextColor(SH110X_WHITE);
    showSplash();
    return true;
}

void DisplayManager::showSplash() {
    m_display.clearDisplay();
    m_display.setTextSize(1);
    m_display.setCursor(16, 12);
    m_display.print("ROBO1 ESP32");
    m_display.setCursor(16, 26);
    m_display.print("MAZE SOLVER C++");
    m_display.setCursor(16, 42);
    m_display.print("Dual-Core FreeRTOS");
    m_display.display();
}

void DisplayManager::showCalibration(uint16_t step, uint16_t maxSteps) {
    m_display.clearDisplay();
    m_display.setTextSize(1);
    m_display.setCursor(10, 10);
    m_display.print("CALIBRATING SENSORS");
    m_display.drawRect(10, 30, 108, 12, SH110X_WHITE);
    int fillWidth = (step * 104) / maxSteps;
    m_display.fillRect(12, 32, fillWidth, 8, SH110X_WHITE);
    m_display.display();
}

void DisplayManager::updateTelemetry(
    const char* modeStr,
    int16_t error,
    int16_t leftSpeed,
    int16_t rightSpeed,
    const std::array<uint16_t, SENSOR_COUNT>& sensorBars,
    const char* pathStr
) {
    m_display.clearDisplay();
    m_display.setTextSize(1);
    m_display.setCursor(0, 0);
    m_display.printf("MODE:%s E:%4d", modeStr, error);

    for (uint8_t i = 0; i < SENSOR_COUNT; ++i) {
        int barHeight = (sensorBars[i] * 24) / 1000;
        if (barHeight > 24) barHeight = 24;
        m_display.fillRect(i * 8, 38 - barHeight, 6, barHeight, SH110X_WHITE);
    }

    m_display.setCursor(0, 42);
    m_display.printf("L:%3d  R:%3d", leftSpeed, rightSpeed);

    m_display.setCursor(0, 54);
    m_display.printf("PATH:%s", pathStr ? pathStr : "");

    m_display.display();
}

} // namespace Robo1
`,
      description: 'OLED telemetry HUD rendering 16 sensor bars, mode badges, and motor speeds.'
    },
    {
      path: 'esp32_firmware/src/main.cpp',
      filename: 'main.cpp',
      category: 'source',
      content: ESP_CPP_CODEBASE.main_cpp,
      description: 'FreeRTOS dual-core firmware entry: Core 1 runs 1000Hz PID loop, Core 0 runs OLED & buttons.'
    },
    {
      path: 'esp32_firmware/Robo1_ESP32.ino',
      filename: 'Robo1_ESP32.ino',
      category: 'sketch',
      content: `/**
 * @file Robo1_ESP32.ino
 * @brief Arduino IDE Sketch for ESP32 Robo1 Maze Solver
 */
#include "include/ESP32_Config.hpp"
#include "include/MotorController.hpp"
#include "include/QTRSensors16.hpp"
#include "include/PIDController.hpp"
#include "include/MazeSolver.hpp"
#include "include/DisplayManager.hpp"

// Refer to src/main.cpp for complete FreeRTOS setup and real-time control routines.
`,
      description: 'Arduino IDE main sketch entry point.'
    },
    {
      path: 'esp32_firmware/platformio.ini',
      filename: 'platformio.ini',
      category: 'config',
      content: ESP_CPP_CODEBASE.platformio_ini,
      description: 'PlatformIO configuration with -O3 optimizations, -std=gnu++17, and library dependencies.'
    },
    {
      path: 'esp32_firmware/CMakeLists.txt',
      filename: 'CMakeLists.txt',
      category: 'config',
      content: `cmake_minimum_required(VERSION 3.16)
include($ENV{IDF_PATH}/tools/cmake/project.cmake)
project(robo1_esp32)
`,
      description: 'Native ESP-IDF CMake configuration.'
    },
    {
      path: 'esp32_firmware/README.md',
      filename: 'README.md',
      category: 'docs',
      content: ESP_CPP_CODEBASE.readme_md,
      description: 'Complete flashing instructions for VS Code PlatformIO and Arduino IDE.'
    }
  ];

  const [selectedFile, setSelectedFile] = useState<CppFileItem>(cppFiles[0]);
  const [copied, setCopied] = useState<boolean>(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(selectedFile.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadFile = () => {
    const blob = new Blob([selectedFile.content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = selectedFile.filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getBadgeColor = (cat: CppFileItem['category']) => {
    switch (cat) {
      case 'header': return 'bg-cyan-950 text-cyan-300 border-cyan-800';
      case 'source': return 'bg-emerald-950 text-emerald-300 border-emerald-800';
      case 'sketch': return 'bg-amber-950 text-amber-300 border-amber-800';
      case 'config': return 'bg-purple-950 text-purple-300 border-purple-800';
      case 'docs':   return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Cpu className="w-5 h-5 text-cyan-400" />
            <span>Pure C++ ESP32 Firmware Backend</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            100% C++17 modular firmware architecture. FreeRTOS Dual-Core, LEDC Hardware PWM, and LSRB Maze Optimization.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono">
          <span className="px-2.5 py-1 rounded-md bg-slate-950 border border-slate-800 text-slate-300">
            Target: <strong className="text-cyan-400">{targetBoard.toUpperCase()}</strong>
          </span>
          <span className="px-2.5 py-1 rounded-md bg-slate-950 border border-slate-800 text-slate-300">
            Files: <strong className="text-emerald-400">{cppFiles.length} Pure C++ Files</strong>
          </span>
        </div>
      </div>

      {/* Main Two-Column Explorer: Left File Tree, Right Code Viewer */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left Column: File Tree (4 Cols) */}
        <div className="lg:col-span-4 bg-slate-900/90 border border-slate-800 rounded-xl p-3 flex flex-col space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400 px-2 pt-1">
            <FolderTree className="w-4 h-4 text-cyan-400" />
            <span>Firmware Files (/esp32_firmware)</span>
          </div>

          <div className="space-y-1 overflow-auto max-h-[640px]">
            {cppFiles.map((file) => {
              const isSelected = selectedFile.filename === file.filename;
              return (
                <button
                  key={file.filename}
                  onClick={() => setSelectedFile(file)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-xs font-mono transition-all flex items-center justify-between gap-2 cursor-pointer ${
                    isSelected
                      ? 'bg-cyan-500 text-slate-950 font-bold shadow-md shadow-cyan-500/20'
                      : 'bg-slate-950/70 text-slate-300 hover:bg-slate-800 hover:text-white border border-slate-800/80'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <FileCode className={`w-3.5 h-3.5 shrink-0 ${isSelected ? 'text-slate-950' : 'text-cyan-400'}`} />
                    <span className="truncate">{file.filename}</span>
                  </div>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded border uppercase font-sans shrink-0 ${
                    isSelected ? 'bg-slate-950/20 text-slate-950 border-slate-950/30' : getBadgeColor(file.category)
                  }`}>
                    {file.category}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Column: Code Viewer (8 Cols) */}
        <div className="lg:col-span-8 bg-slate-950 border border-cyan-900/40 rounded-xl overflow-hidden flex flex-col shadow-xl">
          {/* Header of Code Viewer */}
          <div className="bg-slate-900 px-4 py-3 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <Code2 className="w-4 h-4 text-cyan-400" />
                <span className="text-xs font-bold text-white font-mono">{selectedFile.path}</span>
                <span className={`text-[10px] px-2 py-0.5 rounded border uppercase ${getBadgeColor(selectedFile.category)}`}>
                  {selectedFile.category}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                {selectedFile.description}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleCopy}
                className="flex items-center gap-1.5 text-xs text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 px-2.5 py-1 rounded transition-colors cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>

              <button
                onClick={handleDownloadFile}
                className="flex items-center gap-1.5 text-xs text-cyan-300 hover:text-white bg-cyan-950 hover:bg-cyan-900 border border-cyan-800 px-3 py-1 rounded transition-colors cursor-pointer"
                title="Download this raw C++ file directly"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download File</span>
              </button>
            </div>
          </div>

          {/* Code Content */}
          <div className="p-4 font-mono text-xs overflow-auto max-h-[640px] text-slate-200 leading-relaxed bg-slate-950">
            <pre className="whitespace-pre">
              {selectedFile.content}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};
