import React from 'react';
import { BookOpen, Cpu, Zap, Layers, Code2, AlertCircle, CheckCircle2 } from 'lucide-react';

export const PortingGuide: React.FC = () => {
  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Intro Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
        <h2 className="text-lg font-bold text-white flex items-center gap-2 mb-2">
          <BookOpen className="w-5 h-5 text-cyan-400" />
          <span>C to ESP32 C++ Firmware Migration Engineering Guide</span>
        </h2>
        <p className="text-xs text-slate-300 leading-relaxed">
          Migrating line following and maze solving firmware from 8-bit AVR microcontrollers (ATmega328P/2560) to a modern 32-bit dual-core ESP32 requires fundamental architectural shifts. This guide explains every architectural enhancement implemented in the converted codebase.
        </p>
      </div>

      {/* Chapter 1: FreeRTOS Dual-Core Architecture */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-6 space-y-4">
        <div className="flex items-center gap-2 text-cyan-400 text-sm font-bold uppercase tracking-wider">
          <Cpu className="w-5 h-5" />
          <span>1. FreeRTOS Dual-Core Task Allocation</span>
        </div>
        <p className="text-xs text-slate-300 leading-relaxed">
          In legacy C on AVR, firmware runs in a single monolithic <code className="bg-slate-950 px-1 py-0.5 rounded text-cyan-300 font-mono">loop()</code>. When drawing graphics to the SH1106 OLED over I2C (which takes ~15ms), the motor loop freezes, causing the robot to drift off the line at high speed.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
            <span className="text-amber-400 font-bold block">CPU Core 0: UI & Telemetry (Priority 1)</span>
            <p className="text-slate-400 font-sans">
              Handles non-time-critical tasks: drawing sensor bars to the SH1106 OLED, button debouncing, and streaming wireless/serial telemetry.
            </p>
          </div>
          <div className="bg-slate-950 p-4 rounded-xl border border-cyan-800 space-y-2">
            <span className="text-cyan-400 font-bold block">CPU Core 1: 1000Hz PID Control Loop (Priority 5)</span>
            <p className="text-slate-400 font-sans">
              Dedicated real-time core. Samples all 16 multiplexer channels, calculates line centroid, executes filtered PID differential steering every 1-2 milliseconds with zero OS interruption.
            </p>
          </div>
        </div>
      </div>

      {/* Chapter 2: Hardware LEDC PWM Migration */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-6 space-y-4">
        <div className="flex items-center gap-2 text-cyan-400 text-sm font-bold uppercase tracking-wider">
          <Zap className="w-5 h-5" />
          <span>2. Hardware LEDC PWM vs Legacy analogWrite()</span>
        </div>
        <p className="text-xs text-slate-300 leading-relaxed">
          The ESP32 does not have an internal 8-bit timer register like <code className="bg-slate-950 px-1 py-0.5 rounded text-cyan-300 font-mono">TCCR0A / OCR0A</code>. Instead, it features the <strong>LEDC (LED Control) Peripheral</strong> with 16 independent hardware channels.
        </p>
        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 font-mono text-xs text-slate-300 space-y-2">
          <div className="text-slate-500">// Configure 20kHz Ultrasonic silent PWM (Channels 0 & 1)</div>
          <div><span className="text-cyan-400">ledcSetup</span>(LEDC_CHANNEL_LEFT, 20000, 8);</div>
          <div><span className="text-cyan-400">ledcAttachPin</span>(PIN_MOTOR_LEFT_PWM, LEDC_CHANNEL_LEFT);</div>
          <div className="text-slate-500 mt-2">// Set Motor Speed (-255 .. 255)</div>
          <div><span className="text-cyan-400">ledcWrite</span>(LEDC_CHANNEL_LEFT, speed);</div>
        </div>
        <div className="flex items-start gap-2 text-xs text-emerald-300 bg-emerald-950/40 p-3 rounded-lg border border-emerald-900">
          <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
          <span>At 20kHz, PWM pulses are outside human hearing range, completely eliminating high-pitched motor squeal while delivering smooth low-speed torque!</span>
        </div>
      </div>

      {/* Chapter 3: ADC Calibration & 74HC4067 Timing */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-6 space-y-4">
        <div className="flex items-center gap-2 text-cyan-400 text-sm font-bold uppercase tracking-wider">
          <Layers className="w-5 h-5" />
          <span>3. 12-Bit SAR ADC & Analog Multiplexer Optimization</span>
        </div>
        <ul className="space-y-2 text-xs text-slate-300">
          <li className="flex items-start gap-2">
            <span className="text-cyan-400 font-bold">&bull;</span>
            <span><strong>12-bit Resolution:</strong> Values range from 0 to 4095 (4x more granularity than AVR&apos;s 10-bit 0..1023). Centroid calculations have millimeter precision.</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-cyan-400 font-bold">&bull;</span>
            <span><strong>Multiplexer Settling Delay:</strong> When switching channels on the 74HC4067, the RC filter on the photodiode requires ~4 microseconds. We use <code className="bg-slate-950 px-1 py-0.5 rounded text-cyan-300 font-mono">ets_delay_us(4)</code> instead of blocking delay functions.</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-cyan-400 font-bold">&bull;</span>
            <span><strong>ADC1 vs ADC2:</strong> Always use ADC1 pins (GPIO 32-39). ADC2 cannot be used when Wi-Fi is active on the ESP32.</span>
          </li>
        </ul>
      </div>

      {/* Chapter 4: Object-Oriented Refactoring */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-6 space-y-4">
        <div className="flex items-center gap-2 text-cyan-400 text-sm font-bold uppercase tracking-wider">
          <Code2 className="w-5 h-5" />
          <span>4. Converting C Structs to Modern C++ Classes</span>
        </div>
        <p className="text-xs text-slate-300 leading-relaxed">
          In C, state was passed via pointers to mutable structs (<code className="bg-slate-950 px-1 py-0.5 rounded text-cyan-300 font-mono">qtr16_get_line_centroid(&sensor)</code>). In our ESP32 C++ implementation:
        </p>
        <ul className="space-y-1.5 text-xs text-slate-300 list-disc list-inside">
          <li>Encapsulated classes: <code className="text-cyan-300 font-mono">MotorController</code>, <code className="text-cyan-300 font-mono">QTRSensors16</code>, <code className="text-cyan-300 font-mono">PIDController</code>, and <code className="text-cyan-300 font-mono">MazeSolver</code>.</li>
          <li>Replaced raw C arrays with type-safe <code className="text-cyan-300 font-mono">std::array&lt;uint16_t, 16&gt;</code> to eliminate buffer overruns.</li>
          <li>Path reduction string logic uses <code className="text-cyan-300 font-mono">std::string</code> with recursive multi-pass elimination instead of fixed-size raw character arrays.</li>
        </ul>
      </div>
    </div>
  );
};
