import React, { useState } from 'react';
import { Layers, ShieldCheck, AlertTriangle, Cpu, Zap, Radio, Info } from 'lucide-react';

interface PinRow {
  pin: number | string;
  name: string;
  func: string;
  color: string;
  isStrapping?: boolean;
  isInputOnly?: boolean;
  notes: string;
}

export const HardwareDiagram: React.FC = () => {
  const [selectedComponent, setSelectedComponent] = useState<'all' | 'motors' | 'qtr' | 'oled' | 'power'>('all');

  const esp32LeftPins: PinRow[] = [
    { pin: '3V3', name: '3.3V Power', func: 'Logic Supply', color: 'text-rose-400', notes: 'Powers logic on QTR-16 and SH1106 OLED' },
    { pin: 'EN', name: 'CHIP_PU', func: 'Reset Line', color: 'text-slate-400', notes: 'Active High, 10k pullup to 3.3V' },
    { pin: 36, name: 'VP / SENSOR_VP', func: 'ADC1_CH0', color: 'text-amber-400', isInputOnly: true, notes: 'Input Only (no pullup)' },
    { pin: 39, name: 'VN / SENSOR_VN', func: 'ADC1_CH3', color: 'text-amber-400', isInputOnly: true, notes: 'Input Only (no pullup)' },
    { pin: 34, name: 'GPIO 34', func: 'QTR-16 MUX SIG', color: 'text-emerald-400', isInputOnly: true, notes: 'ADC1_CH6 (Analog input from 74HC4067)' },
    { pin: 35, name: 'GPIO 35', func: 'Battery Monitor', color: 'text-emerald-400', isInputOnly: true, notes: 'ADC1_CH7 (Voltage divider for 2S LiPo)' },
    { pin: 32, name: 'GPIO 32', func: 'Motor R PWM', color: 'text-cyan-400', notes: 'LEDC Channel 1 (20kHz Hardware PWM)' },
    { pin: 33, name: 'GPIO 33', func: 'Motor R DIR1', color: 'text-cyan-400', notes: 'Right motor direction pin 1' },
    { pin: 25, name: 'GPIO 25', func: 'Motor L PWM', color: 'text-cyan-400', notes: 'LEDC Channel 0 (20kHz Hardware PWM)' },
    { pin: 26, name: 'GPIO 26', func: 'Motor L DIR1', color: 'text-cyan-400', notes: 'Left motor direction pin 1' },
    { pin: 27, name: 'GPIO 27', func: 'Motor L DIR2', color: 'text-cyan-400', notes: 'Left motor direction pin 2' },
    { pin: 14, name: 'GPIO 14', func: 'Motor R DIR2', color: 'text-cyan-400', notes: 'Right motor direction pin 2' },
    { pin: 12, name: 'GPIO 12', func: 'Strapping Pin', color: 'text-amber-400', isStrapping: true, notes: 'Boot strapping (MTDI) - Leave free' },
    { pin: 'GND', name: 'Ground', func: 'Common GND', color: 'text-slate-500', notes: 'Tied to motor driver & battery GND' }
  ];

  const esp32RightPins: PinRow[] = [
    { pin: 'VIN', name: '5V In / USB', func: '5V Power Bus', color: 'text-rose-400', notes: 'From 5V 3A UBEC/Step-down regulator' },
    { pin: 'GND', name: 'Ground', func: 'Common GND', color: 'text-slate-500', notes: 'Power return ground' },
    { pin: 13, name: 'GPIO 13', func: 'Motor STBY', color: 'text-cyan-400', notes: 'TB6612FNG Standby (HIGH = Active)' },
    { pin: 9, name: 'GPIO 9', func: 'SPI Flash', color: 'text-red-500', notes: 'Internal SPI Flash (DO NOT USE)' },
    { pin: 10, name: 'GPIO 10', func: 'SPI Flash', color: 'text-red-500', notes: 'Internal SPI Flash (DO NOT USE)' },
    { pin: 11, name: 'GPIO 11', func: 'SPI Flash', color: 'text-red-500', notes: 'Internal SPI Flash (DO NOT USE)' },
    { pin: 6, name: 'GPIO 6', func: 'SPI Flash', color: 'text-red-500', notes: 'Internal SPI Flash (DO NOT USE)' },
    { pin: 7, name: 'GPIO 7', func: 'SPI Flash', color: 'text-red-500', notes: 'Internal SPI Flash (DO NOT USE)' },
    { pin: 8, name: 'GPIO 8', func: 'SPI Flash', color: 'text-red-500', notes: 'Internal SPI Flash (DO NOT USE)' },
    { pin: 17, name: 'GPIO 17', func: 'MUX S3', color: 'text-emerald-400', notes: '74HC4067 Address select bit 3' },
    { pin: 5, name: 'GPIO 5', func: 'MUX S2', color: 'text-emerald-400', isStrapping: true, notes: '74HC4067 Address select bit 2' },
    { pin: 18, name: 'GPIO 18', func: 'MUX S1', color: 'text-emerald-400', notes: '74HC4067 Address select bit 1' },
    { pin: 19, name: 'GPIO 19', func: 'MUX S0', color: 'text-emerald-400', notes: '74HC4067 Address select bit 0' },
    { pin: 21, name: 'GPIO 21', func: 'I2C SDA', color: 'text-purple-400', notes: 'SH1106 OLED Display Data' },
    { pin: 22, name: 'GPIO 22', func: 'I2C SCL', color: 'text-purple-400', notes: 'SH1106 OLED Display Clock' }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Layers className="w-5 h-5 text-cyan-400" />
            <span>ESP32 Hardware Pinout & Wiring Visualizer</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Verified safe GPIO allocations avoiding boot strapping lockouts and flash pin corruption.
          </p>
        </div>

        {/* Filter Buttons */}
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            onClick={() => setSelectedComponent('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer ${
              selectedComponent === 'all' ? 'bg-cyan-500 text-slate-950 font-bold' : 'bg-slate-800 text-slate-300'
            }`}
          >
            All Connections
          </button>
          <button
            onClick={() => setSelectedComponent('motors')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer ${
              selectedComponent === 'motors' ? 'bg-cyan-500 text-slate-950 font-bold' : 'bg-slate-800 text-slate-300'
            }`}
          >
            TB6612FNG Motors
          </button>
          <button
            onClick={() => setSelectedComponent('qtr')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer ${
              selectedComponent === 'qtr' ? 'bg-cyan-500 text-slate-950 font-bold' : 'bg-slate-800 text-slate-300'
            }`}
          >
            QTR-16 Sensor Mux
          </button>
          <button
            onClick={() => setSelectedComponent('oled')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer ${
              selectedComponent === 'oled' ? 'bg-cyan-500 text-slate-950 font-bold' : 'bg-slate-800 text-slate-300'
            }`}
          >
            SH1106 OLED (I2C)
          </button>
        </div>
      </div>

      {/* Strapping & Input-Only Warnings Alert */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-amber-950/40 border border-amber-800/60 rounded-xl p-3.5 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div className="text-xs text-slate-300 space-y-1">
            <span className="font-bold text-amber-300">Strapping Pins Warning (GPIO 0, 2, 12, 15)</span>
            <p>
              These pins control ESP32 boot modes (UART download, flash voltage, bootloader). In our C++ config, we have specifically kept them unassigned so the robot boots reliably even when batteries fluctuate.
            </p>
          </div>
        </div>

        <div className="bg-emerald-950/40 border border-emerald-800/60 rounded-xl p-3.5 flex items-start gap-3">
          <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
          <div className="text-xs text-slate-300 space-y-1">
            <span className="font-bold text-emerald-300">Input-Only Pins (GPIO 34, 35, 36, 39)</span>
            <p>
              These GPIOs have no output drivers or internal pullups. In our conversion, we smartly assign <span className="font-mono text-emerald-300">GPIO 34</span> to the QTR-16 analog signal and <span className="font-mono text-emerald-300">GPIO 35</span> to battery monitoring!
            </p>
          </div>
        </div>
      </div>

      {/* Visual ESP32 Chip Layout */}
      <div className="bg-slate-950 border border-slate-800 rounded-xl p-6 shadow-2xl">
        <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Left Pins Table */}
          <div className="w-full md:w-1/2 space-y-1.5 font-mono text-xs">
            {esp32LeftPins.map((p, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between bg-slate-900/90 border border-slate-800/80 px-3 py-1.5 rounded-lg hover:border-cyan-500/50 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <span className={`font-bold ${p.color}`}>{p.func}</span>
                  {p.isInputOnly && <span className="text-[9px] bg-emerald-950 text-emerald-400 px-1 rounded">ADC In</span>}
                  {p.isStrapping && <span className="text-[9px] bg-amber-950 text-amber-400 px-1 rounded">Strap</span>}
                </div>
                <span className="text-slate-400 font-bold bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                  {p.pin}
                </span>
              </div>
            ))}
          </div>

          {/* Central ESP32 DevKit Graphic */}
          <div className="w-48 bg-slate-900 border-2 border-slate-700 rounded-2xl p-4 flex flex-col items-center justify-between py-8 shadow-2xl relative shrink-0">
            {/* Micro USB Port */}
            <div className="w-12 h-4 bg-slate-700 rounded-t-sm border border-slate-600 mb-4"></div>

            {/* Espressif Metal RF Shield */}
            <div className="w-36 h-28 bg-gradient-to-br from-slate-400 to-slate-600 rounded-xl border-2 border-slate-300 flex flex-col items-center justify-center text-center p-2 shadow-inner">
              <Cpu className="w-6 h-6 text-slate-800 mb-1" />
              <span className="text-[10px] font-bold text-slate-900 tracking-wider">ESP-WROOM-32</span>
              <span className="text-[8px] text-slate-800 font-mono">240MHz Dual Xtensa</span>
            </div>

            {/* Status LEDs & Boot/EN buttons */}
            <div className="flex justify-between w-full px-2 mt-6">
              <div className="w-3 h-3 rounded-full bg-rose-500 animate-pulse shadow-md shadow-rose-500/50"></div>
              <div className="w-3 h-3 rounded-full bg-cyan-400 shadow-md shadow-cyan-400/50"></div>
            </div>

            {/* PCB Antenna Trace */}
            <div className="w-32 h-6 border-2 border-amber-600/60 rounded-b-lg mt-4 flex items-center justify-center">
              <span className="text-[8px] font-mono text-amber-500">2.4GHz Wi-Fi / BT</span>
            </div>
          </div>

          {/* Right Pins Table */}
          <div className="w-full md:w-1/2 space-y-1.5 font-mono text-xs">
            {esp32RightPins.map((p, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between bg-slate-900/90 border border-slate-800/80 px-3 py-1.5 rounded-lg hover:border-cyan-500/50 transition-colors"
              >
                <span className="text-slate-400 font-bold bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                  {p.pin}
                </span>
                <div className="flex items-center gap-2">
                  <span className={`font-bold ${p.color}`}>{p.func}</span>
                  {p.isStrapping && <span className="text-[9px] bg-amber-950 text-amber-400 px-1 rounded">Strap</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
