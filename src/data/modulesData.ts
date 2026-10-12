import { CodeModule } from '../types/codebase';
import { C_CODEBASE } from './cCodebase';
import { ESP_CPP_CODEBASE } from './espCppCodebase';

export const CONVERSION_MODULES: CodeModule[] = [
  {
    id: 'config',
    name: 'Hardware Config & Pin Mapping',
    cFileName: 'config.h',
    cppFileName: 'ESP32_Config.hpp',
    category: 'config',
    description: 'Pin remapping from 8-bit AVR pins (D0-D13, A0-A7) to ESP32 32-bit GPIOs with strapping pin protection and LEDC PWM channels.',
    cCode: C_CODEBASE.config_h,
    cppCodeArduino: ESP_CPP_CODEBASE.config_hpp,
    cppCodeIdf: ESP_CPP_CODEBASE.config_hpp,
    keyChanges: [
      'Moved pins away from ESP32 strapping GPIOs (GPIO 0, 2, 12, 15) to prevent boot freeze.',
      'Replaced 8-bit timer register pin numbers with ESP32 LEDC PWM Channels 0 and 1.',
      'Mapped analog multiplexer input to GPIO 34 (ADC1 Channel 6, which is an input-only pin, freeing up standard GPIOs for motor driver outputs).',
      'Encapsulated all constants in a C++ `namespace Robo1` using `constexpr` instead of macro `#define` for strict type safety.'
    ],
    esp32Advantages: [
      'Zero strapping pin conflicts: reliable flashing and boot.',
      'Hardware 20kHz silent PWM eliminates motor coil whine.',
      '12-bit ADC offers 4096 levels of resolution instead of 1024.'
    ]
  },
  {
    id: 'motor',
    name: 'Motor Controller (LEDC Hardware PWM)',
    cFileName: 'motor.c',
    cppFileName: 'MotorController.cpp',
    category: 'motor',
    description: 'Migrating legacy analogWrite() to ESP32 hardware LEDC PWM timer channels with smooth speed limiting and calibrated turning routines.',
    cCode: C_CODEBASE.motor_c,
    cppCodeArduino: ESP_CPP_CODEBASE.motor_cpp,
    cppCodeIdf: ESP_CPP_CODEBASE.motor_cpp,
    keyChanges: [
      'Replaced `analogWrite()` with `ledcSetup()`, `ledcAttachPin()`, and `ledcWrite()`.',
      'Configured 20,000 Hz ultrasonic PWM frequency for whisper-quiet motor operation.',
      'Converted global C functions into an object-oriented `MotorController` class.',
      'Added non-blocking state accessors and encapsulated speed clamping.'
    ],
    esp32Advantages: [
      'Ultrasonic 20kHz frequency prevents motor squeal and increases battery efficiency.',
      'Dedicated hardware timer peripheral causes 0% CPU overhead for PWM generation.',
      'Precise braking using H-bridge fast-decay mode.'
    ]
  },
  {
    id: 'sensors',
    name: 'QTR-16 Reflectance Sensor Array',
    cFileName: 'qtr16.c',
    cppFileName: 'QTRSensors16.cpp',
    category: 'sensors',
    description: '16-channel sensor acquisition using 74HC4067 multiplexer, 12-bit ADC calibration, centroid calculation, and intersection classification.',
    cCode: C_CODEBASE.qtr16_c,
    cppCodeArduino: ESP_CPP_CODEBASE.qtr16_cpp,
    cppCodeIdf: ESP_CPP_CODEBASE.qtr16_cpp,
    keyChanges: [
      'Upgraded ADC resolution from 10-bit (0..1023) to 12-bit (0..4095) via `analogReadResolution(12)`.',
      'Applied `analogSetAttenuation(ADC_11db)` to accept full 0-3.3V sensor output signals.',
      'Replaced `delayMicroseconds(5)` with microsecond hardware delay `ets_delay_us(4)` for faster MUX channel switching.',
      'Added `detectIntersection()` state machine for 4-way Cross, T-Junction, Left/Right turns, and Finish Line.'
    ],
    esp32Advantages: [
      'Over 4x higher resolution line positioning.',
      'Ultra-fast sampling rate (reads all 16 channels in under 120 microseconds).',
      'Line-loss recovery memory retains last known centroid trajectory.'
    ]
  },
  {
    id: 'pid',
    name: 'Discrete PID Controller with Filter',
    cFileName: 'pid.c',
    cppFileName: 'PIDController.cpp',
    category: 'pid',
    description: 'Modernized C++ PID controller with microsecond delta-time tracking (esp_timer_get_time), anti-windup clamping, and derivative low-pass filter.',
    cCode: C_CODEBASE.pid_c,
    cppCodeArduino: ESP_CPP_CODEBASE.pid_cpp,
    cppCodeIdf: ESP_CPP_CODEBASE.pid_cpp,
    keyChanges: [
      'Replaced fixed `dt` assumptions with high-precision hardware timestamps via `esp_timer_get_time()`.',
      'Added 1st-order low-pass filter on derivative term `(0.7 * dFilter + 0.3 * rawD)` to eliminate noise spikes from optical reflections.',
      'Integrated clamping with `std::clamp` and anti-windup limits on the integral accumulator.',
      'Class methods allow dynamic gain tuning on-the-fly via Serial or Web GUI.'
    ],
    esp32Advantages: [
      'Zero jitter: microsecond timing accuracy guarantees rock-solid derivative calculations.',
      'Filter suppresses high-frequency motor vibration noise.',
      'Smooth differential steering at high speeds without oscillation.'
    ]
  },
  {
    id: 'maze',
    name: 'Maze Solver & LSRB String Reduction',
    cFileName: 'maze.c',
    cppFileName: 'MazeSolver.cpp',
    category: 'maze',
    description: 'Autonomous line maze solving via Left-Hand / Right-Hand Rule, with recursive path simplification (e.g. LBL->S, LBR->B) and Speed Run replay.',
    cCode: C_CODEBASE.maze_c,
    cppCodeArduino: ESP_CPP_CODEBASE.maze_cpp,
    cppCodeIdf: ESP_CPP_CODEBASE.maze_cpp,
    keyChanges: [
      'Replaced raw fixed C character buffers and pointer arithmetic with dynamic, safe `std::string`.',
      'Added recursive multi-pass path simplification (`reduceLastThree()`) to handle nested dead-end cascades.',
      'Separated `EXPLORING` (dry run mapping) from `SPEED_RUN` (flawless fastest path replay) state machines.',
      'Integrated user-selectable Left-Hand Rule or Right-Hand Rule preference.'
    ],
    esp32Advantages: [
      'ESP32 520KB SRAM eliminates stack overflow risks from long complex maze paths.',
      'Seamless transition from exploration to second-run race mode.',
      'Self-healing route optimization.'
    ]
  },
  {
    id: 'main',
    name: 'FreeRTOS Dual-Core Architecture',
    cFileName: 'main.c',
    cppFileName: 'main.cpp',
    category: 'main',
    description: 'Revolutionizing the single-threaded loop() into a true dual-core FreeRTOS architecture: Core 1 runs the 1000Hz PID loop, Core 0 runs Display & Telemetry.',
    cCode: C_CODEBASE.main_c,
    cppCodeArduino: ESP_CPP_CODEBASE.main_cpp,
    cppCodeIdf: ESP_CPP_CODEBASE.main_cpp,
    keyChanges: [
      'Created `taskControlLoop` pinned to CPU Core 1 using `xTaskCreatePinnedToCore` with priority 5.',
      'Created `taskDisplayLoop` pinned to CPU Core 0 for OLED and button handling with priority 1.',
      'Used `vTaskDelayUntil` for deterministic 1ms control loop frequency with zero OS jitter.',
      'Replaced blocking delays with non-blocking FreeRTOS task delays (`vTaskDelay`).'
    ],
    esp32Advantages: [
      'Sensors and motors NEVER stutter, even during heavy OLED screen redraws or serial logging!',
      'True hardware parallel processing utilizes both 240MHz Xtensa cores.',
      'Deterministic 1kHz control frequency gives maximum line tracking speed.'
    ]
  },
  {
    id: 'build',
    name: 'PlatformIO & Flashing Config',
    cFileName: 'Makefile',
    cppFileName: 'platformio.ini',
    category: 'build',
    description: 'Complete build files, library dependencies (Adafruit SH110X, Adafruit GFX), and compiler optimization flags (-O3, -std=gnu++17).',
    cCode: `# Legacy Makefile for AVR / Arduino
MCU = atmega328p
F_CPU = 16000000L
TARGET = robo1
CC = avr-gcc
CFLAGS = -Wall -Os -DF_CPU=$(F_CPU) -mmcu=$(MCU)

all: $(TARGET).hex
`,
    cppCodeArduino: ESP_CPP_CODEBASE.platformio_ini,
    cppCodeIdf: ESP_CPP_CODEBASE.platformio_ini,
    keyChanges: [
      'Configured espressif32 platform with automatic dependency resolution in PlatformIO.',
      'Enabled -O3 compiler optimization flags for peak execution speed.',
      'Enabled C++17 modern language standard (`-std=gnu++17`).'
    ],
    esp32Advantages: [
      'One-click compilation & upload via PlatformIO or Arduino IDE.',
      'Pre-configured baud rate (115200) and serial monitor filters.'
    ]
  }
];
