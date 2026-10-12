/**
 * @file main.cpp
 * @brief Complete FreeRTOS Dual-Core Robot Maze Solver Firmware for ESP32
 * 
 * FreeRTOS Architecture:
 *  - Core 1: 1000Hz (1ms) Real-Time Line Following PID Control Loop (Priority 5)
 *  - Core 0: OLED Display Refresh, Telemetry, and Button State Machine (Priority 1)
 */

#include "ESP32_Config.hpp"
#include "MotorController.hpp"
#include "QTRSensors16.hpp"
#include "PIDController.hpp"
#include "MazeSolver.hpp"
#include "DisplayManager.hpp"
#include <Arduino.h>

using namespace Robo1;

// Global Hardware & Logic Instances
MotorController motors;
QTRSensors16    sensors;
PIDController   pid(DEFAULT_KP, DEFAULT_KI, DEFAULT_KD);
MazeSolver      maze(HandPreference::LEFT_HAND_RULE);
DisplayManager  display;

// FreeRTOS Task Handles & Cross-Core Shared Flags
TaskHandle_t hControlTask = nullptr;
TaskHandle_t hDisplayTask = nullptr;

volatile int16_t g_currentError = 0;
volatile bool    g_isCalibrated = false;
volatile bool    g_runActive    = false;

// ========================================================
// CORE 1 TASK: 1000Hz REAL-TIME SENSOR ACQUISITION & PID
// ========================================================
void taskControlLoop(void* pvParameters) {
    TickType_t xLastWakeTime = xTaskGetTickCount();
    const TickType_t xFrequency = pdMS_TO_TICKS(2); // 500Hz loop rate (2ms)

    for (;;) {
        if (g_runActive && g_isCalibrated) {
            // 1. Read Centroid from 16-channel multiplexer
            int16_t error = sensors.getLineCentroid();
            g_currentError = error;

            // 2. Check for Intersections
            IntersectionType inter = sensors.detectIntersection();

            if (maze.getMode() == MazeMode::EXPLORING) {
                if (inter == IntersectionType::LEFT_TURN || 
                    inter == IntersectionType::T_JUNCTION || 
                    inter == IntersectionType::CROSS) {
                    motors.inchForward(40);
                    motors.turnLeft90();
                    maze.recordTurn('L');
                } else if (inter == IntersectionType::DEAD_END) {
                    motors.turn180();
                    maze.recordTurn('B');
                } else if (inter == IntersectionType::RIGHT_TURN) {
                    motors.inchForward(40);
                    motors.turnRight90();
                    maze.recordTurn('R');
                } else if (inter == IntersectionType::FINISH_LINE) {
                    motors.brake();
                    maze.setMode(MazeMode::SPEED_RUN);
                    g_runActive = false;
                } else {
                    // Standard PID Line Tracking
                    int16_t correction = pid.compute(error);
                    motors.setSpeeds(BASE_SPEED + correction, BASE_SPEED - correction);
                }
            } else if (maze.getMode() == MazeMode::SPEED_RUN) {
                if (inter != IntersectionType::NONE && inter != IntersectionType::STRAIGHT_ONLY) {
                    char turn = maze.getNextSpeedrunTurn();
                    motors.inchForward(30);
                    if (turn == 'L') motors.turnLeft90();
                    else if (turn == 'R') motors.turnRight90();
                    else if (turn == 'S') { /* Keep moving straight */ }
                    else if (turn == 'F') {
                        motors.brake();
                        g_runActive = false;
                    }
                } else {
                    // Boosted High-Speed Run on Known Maze
                    int16_t correction = pid.compute(error);
                    motors.setSpeeds(SPEED_RUN_SPEED + correction, SPEED_RUN_SPEED - correction);
                }
            }
        }

        vTaskDelayUntil(&xLastWakeTime, xFrequency);
    }
}

// ========================================================
// CORE 0 TASK: USER INTERFACE, OLED & USB TELEMETRY
// ========================================================
void taskDisplayLoop(void* pvParameters) {
    for (;;) {
        // Calibration Button (GPIO 4)
        if (digitalRead(PIN_BTN_CALIBRATE) == LOW && !g_isCalibrated) {
            Serial.println("[ROBO1] Starting Sensor Calibration...");
            for (int i = 0; i < 200; ++i) {
                sensors.calibrateStep();
                display.showCalibration(i, 200);
                vTaskDelay(pdMS_TO_TICKS(10));
            }
            sensors.calibrateFinished();
            g_isCalibrated = true;
            Serial.println("[ROBO1] Calibration Finished!");
        }

        // Start / Stop Run Button (GPIO 16)
        if (digitalRead(PIN_BTN_START) == LOW && g_isCalibrated) {
            g_runActive = !g_runActive;
            if (!g_runActive) motors.stop();
            vTaskDelay(pdMS_TO_TICKS(300)); // Debounce
        }

        // OLED HUD Refresh
        const char* modeStr = (maze.getMode() == MazeMode::EXPLORING) ? "EXPL" : "RACE";
        display.updateTelemetry(
            modeStr,
            g_currentError,
            motors.getLeftSpeed(),
            motors.getRightSpeed(),
            sensors.getCalibratedValues(),
            maze.getSimplifiedPath().c_str()
        );

        // USB Serial Telemetry
        if (g_runActive) {
            Serial.printf("Err:%6d | L:%3d | R:%3d | Path:%s\n",
                g_currentError, motors.getLeftSpeed(), motors.getRightSpeed(),
                maze.getSimplifiedPath().c_str());
        }

        vTaskDelay(pdMS_TO_TICKS(50)); // 20Hz UI update rate
    }
}

void setup() {
    Serial.begin(115200);
    delay(400);
    Serial.println("==========================================");
    Serial.println("    ROBO1 ESP32 C++ MAZE SOLVER SYSTEM    ");
    Serial.println("==========================================");

    pinMode(PIN_BTN_CALIBRATE, INPUT_PULLUP);
    pinMode(PIN_BTN_START, INPUT_PULLUP);

    motors.init();
    sensors.init();
    display.init();

    // Spawn Core 1 Real-Time Control Task (Highest Priority: 5)
    xTaskCreatePinnedToCore(
        taskControlLoop,
        "ControlTask",
        4096,
        nullptr,
        5,
        &hControlTask,
        1 // CPU Core 1
    );

    // Spawn Core 0 Display/Telemetry Task (Priority: 1)
    xTaskCreatePinnedToCore(
        taskDisplayLoop,
        "DisplayTask",
        4096,
        nullptr,
        1,
        &hDisplayTask,
        0 // CPU Core 0
    );
}

void loop() {
    // Empty: Tasks are managed concurrently by FreeRTOS on Core 0 and Core 1
    vTaskDelay(pdMS_TO_TICKS(1000));
}
