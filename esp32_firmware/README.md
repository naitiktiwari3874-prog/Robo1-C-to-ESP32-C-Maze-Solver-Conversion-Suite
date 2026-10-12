# Robo1: ESP32 Autonomous Line & Maze Solver (Pure C++)

This folder contains the **100% pure C++ (C++17)** firmware for the Robo1 maze-solving robot.

## Directory Structure
```
esp32_firmware/
├── include/
│   ├── ESP32_Config.hpp     # GPIO pin mappings & tuning constants
│   ├── MotorController.hpp  # LEDC Hardware PWM Motor Driver
│   ├── QTRSensors16.hpp     # 16-channel sensor array via 74HC4067 MUX
│   ├── PIDController.hpp    # Discrete filtered PID controller
│   ├── MazeSolver.hpp       # Tremaux / LSRB string reduction engine
│   └── DisplayManager.hpp   # SH1106 OLED display HUD driver
├── src/
│   ├── main.cpp             # FreeRTOS Dual-Core task allocation
│   ├── MotorController.cpp
│   ├── QTRSensors16.cpp
│   ├── PIDController.cpp
│   ├── MazeSolver.cpp
│   └── DisplayManager.cpp
├── Robo1_ESP32.ino          # Arduino IDE entry point
├── platformio.ini           # PlatformIO project configuration
└── CMakeLists.txt           # ESP-IDF native build file
```

## How to Flash
### Option A: VS Code + PlatformIO
1. Install PlatformIO extension in VS Code.
2. Open the `esp32_firmware` directory.
3. Connect your ESP32 via USB and click **Upload** (`Ctrl+Alt+U`).

### Option B: Arduino IDE
1. Open `Robo1_ESP32.ino` or paste `src/main.cpp`.
2. Select Board: **ESP32 Dev Module**.
3. Install libraries: **Adafruit SH110X** and **Adafruit GFX**.
4. Click **Upload**.
