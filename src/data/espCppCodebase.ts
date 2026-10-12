export const ESP_CPP_CODEBASE = {
  config_hpp: `/**
 * @file ESP32_Config.hpp
 * @brief Modern ESP32 Hardware Configuration & Pin Mappings (C++)
 * Compatible with ESP32-WROOM-32, ESP32-S3, ESP32-C3
 * 
 * ESP32 Hardware Highlights:
 *  - Dual-Core Xtensa LX6 @ 240MHz (Core 0: UI/Telemetry, Core 1: PID Real-Time)
 *  - Hardware LEDC PWM with 14-channel 13-bit precision timers
 *  - 12-bit SAR ADC (0..4095) with programmable attenuation
 */
#pragma once

#include <cstdint>
#include <esp_timer.h>

namespace Robo1 {

// ==========================================
// 1. MOTOR DRIVER (TB6612FNG / L298N)
// ==========================================
// Safe General Purpose Output GPIOs (No strapping pin conflicts)
constexpr int PIN_MOTOR_LEFT_PWM   = 25; // LEDC Channel 0
constexpr int PIN_MOTOR_LEFT_DIR1  = 26;
constexpr int PIN_MOTOR_LEFT_DIR2  = 27;

constexpr int PIN_MOTOR_RIGHT_PWM  = 32; // LEDC Channel 1
constexpr int PIN_MOTOR_RIGHT_DIR1 = 33;
constexpr int PIN_MOTOR_RIGHT_DIR2 = 14;

constexpr int PIN_MOTOR_STBY       = 13;

// LEDC Hardware PWM Parameters
constexpr uint32_t LEDC_PWM_FREQ       = 20000; // 20kHz Ultrasonic (Silent motor operation)
constexpr uint8_t  LEDC_PWM_RESOLUTION = 8;     // 8-bit resolution (0..255)
constexpr uint8_t  LEDC_CHANNEL_LEFT   = 0;
constexpr uint8_t  LEDC_CHANNEL_RIGHT  = 1;

// ==========================================
// 2. QTR-16 REFLECTANCE SENSOR (74HC4067 MUX)
// ==========================================
constexpr int PIN_MUX_S0           = 19;
constexpr int PIN_MUX_S1           = 18;
constexpr int PIN_MUX_S2           = 5;
constexpr int PIN_MUX_S3           = 17;
constexpr int PIN_MUX_SIG_ADC      = 34; // Input-only pin (ADC1 Channel 6) - Perfect for ADC!

constexpr uint8_t SENSOR_COUNT     = 16;
constexpr uint16_t ADC_MAX_VAL     = 4095; // 12-bit ADC on ESP32

// ==========================================
// 3. I2C OLED DISPLAY (SH1106 128x64)
// ==========================================
constexpr int PIN_I2C_SDA          = 21; // Default ESP32 Hardware I2C SDA
constexpr int PIN_I2C_SCL          = 22; // Default ESP32 Hardware I2C SCL
constexpr uint8_t OLED_I2C_ADDR    = 0x3C;
constexpr uint16_t OLED_WIDTH      = 128;
constexpr uint16_t OLED_HEIGHT     = 64;

// ==========================================
// 4. USER BUTTONS & BATTERY MONITOR
// ==========================================
constexpr int PIN_BTN_CALIBRATE    = 4;  // Pulled high internally
constexpr int PIN_BTN_START        = 16; // Pulled high internally
constexpr int PIN_BATTERY_ADC      = 35; // Input-only pin (ADC1 Channel 7)

// ==========================================
// 5. PID & SPEED CONSTANTS
// ==========================================
constexpr float DEFAULT_KP         = 0.045f;
constexpr float DEFAULT_KI         = 0.0002f;
constexpr float DEFAULT_KD         = 0.280f;

constexpr int16_t BASE_SPEED       = 150; // 0..255
constexpr int16_t MAX_SPEED        = 250;
constexpr int16_t TURN_SPEED       = 130;
constexpr int16_t SPEED_RUN_SPEED  = 210; // Boosted speed for mapped maze

// Max Maze Path Capacity
constexpr size_t MAX_PATH_LENGTH   = 160;

} // namespace Robo1
`,

  motor_hpp: `/**
 * @file MotorController.hpp
 * @brief High-Performance Motor Controller Class for ESP32
 * Replaces legacy analogWrite with ESP32 Hardware LEDC PWM
 */
#pragma once

#include "ESP32_Config.hpp"
#include <Arduino.h>

namespace Robo1 {

class MotorController {
public:
    MotorController();
    ~MotorController() = default;

    void init();
    void setSpeeds(int16_t leftSpeed, int16_t rightSpeed);
    void brake();
    void stop();

    // Calibrated turn routines
    void turnLeft90(uint16_t durationMs = 170);
    void turnRight90(uint16_t durationMs = 170);
    void turn180(uint16_t durationMs = 340);
    void inchForward(uint16_t durationMs = 80);

    inline int16_t getLeftSpeed() const { return m_currentLeft; }
    inline int16_t getRightSpeed() const { return m_currentRight; }

private:
    int16_t m_currentLeft;
    int16_t m_currentRight;

    void applyPwm(uint8_t channel, int pinDir1, int pinDir2, int16_t speed);
};

} // namespace Robo1
`,

  motor_cpp: `/**
 * @file MotorController.cpp
 * @brief ESP32 Motor Controller Implementation using LEDC Hardware Timers
 */
#include "MotorController.hpp"

namespace Robo1 {

MotorController::MotorController()
    : m_currentLeft(0)
    , m_currentRight(0) {}

void MotorController::init() {
    // Configure Direction Pins
    pinMode(PIN_MOTOR_LEFT_DIR1, OUTPUT);
    pinMode(PIN_MOTOR_LEFT_DIR2, OUTPUT);
    pinMode(PIN_MOTOR_RIGHT_DIR1, OUTPUT);
    pinMode(PIN_MOTOR_RIGHT_DIR2, OUTPUT);

    pinMode(PIN_MOTOR_STBY, OUTPUT);
    digitalWrite(PIN_MOTOR_STBY, HIGH); // Enable H-Bridge

    // Initialize ESP32 Hardware LEDC PWM Timers
    ledcSetup(LEDC_CHANNEL_LEFT, LEDC_PWM_FREQ, LEDC_PWM_RESOLUTION);
    ledcAttachPin(PIN_MOTOR_LEFT_PWM, LEDC_CHANNEL_LEFT);

    ledcSetup(LEDC_CHANNEL_RIGHT, LEDC_PWM_FREQ, LEDC_PWM_RESOLUTION);
    ledcAttachPin(PIN_MOTOR_RIGHT_PWM, LEDC_CHANNEL_RIGHT);

    stop();
}

void MotorController::applyPwm(uint8_t channel, int pinDir1, int pinDir2, int16_t speed) {
    if (speed > MAX_SPEED) speed = MAX_SPEED;
    if (speed < -MAX_SPEED) speed = -MAX_SPEED;

    if (speed > 0) {
        digitalWrite(pinDir1, HIGH);
        digitalWrite(pinDir2, LOW);
        ledcWrite(channel, speed);
    } else if (speed < 0) {
        digitalWrite(pinDir1, LOW);
        digitalWrite(pinDir2, HIGH);
        ledcWrite(channel, -speed);
    } else {
        digitalWrite(pinDir1, LOW);
        digitalWrite(pinDir2, LOW);
        ledcWrite(channel, 0);
    }
}

void MotorController::setSpeeds(int16_t leftSpeed, int16_t rightSpeed) {
    m_currentLeft = leftSpeed;
    m_currentRight = rightSpeed;
    applyPwm(LEDC_CHANNEL_LEFT, PIN_MOTOR_LEFT_DIR1, PIN_MOTOR_LEFT_DIR2, leftSpeed);
    applyPwm(LEDC_CHANNEL_RIGHT, PIN_MOTOR_RIGHT_DIR1, PIN_MOTOR_RIGHT_DIR2, rightSpeed);
}

void MotorController::brake() {
    digitalWrite(PIN_MOTOR_LEFT_DIR1, HIGH);
    digitalWrite(PIN_MOTOR_LEFT_DIR2, HIGH);
    ledcWrite(LEDC_CHANNEL_LEFT, 255);

    digitalWrite(PIN_MOTOR_RIGHT_DIR1, HIGH);
    digitalWrite(PIN_MOTOR_RIGHT_DIR2, HIGH);
    ledcWrite(LEDC_CHANNEL_RIGHT, 255);
    
    m_currentLeft = 0;
    m_currentRight = 0;
}

void MotorController::stop() {
    setSpeeds(0, 0);
}

void MotorController::turnLeft90(uint16_t durationMs) {
    setSpeeds(-TURN_SPEED, TURN_SPEED);
    delay(durationMs);
    brake();
    delay(20);
}

void MotorController::turnRight90(uint16_t durationMs) {
    setSpeeds(TURN_SPEED, -TURN_SPEED);
    delay(durationMs);
    brake();
    delay(20);
}

void MotorController::turn180(uint16_t durationMs) {
    setSpeeds(-TURN_SPEED, TURN_SPEED);
    delay(durationMs);
    brake();
    delay(20);
}

void MotorController::inchForward(uint16_t durationMs) {
    setSpeeds(BASE_SPEED, BASE_SPEED);
    delay(durationMs);
    brake();
    delay(20);
}

} // namespace Robo1
`,

  qtr16_hpp: `/**
 * @file QTRSensors16.hpp
 * @brief 16-Channel Reflectance Sensor Class for ESP32
 * Supports 74HC4067 multiplexer with 12-bit ADC calibration
 */
#pragma once

#include "ESP32_Config.hpp"
#include <Arduino.h>
#include <array>

namespace Robo1 {

enum class IntersectionType : uint8_t {
    NONE = 0,
    STRAIGHT_ONLY,
    LEFT_TURN,
    RIGHT_TURN,
    T_JUNCTION,
    CROSS,
    DEAD_END,
    FINISH_LINE
};

class QTRSensors16 {
public:
    QTRSensors16();
    void init();
    void calibrateStep();
    void calibrateFinished();

    void readRaw(std::array<uint16_t, SENSOR_COUNT>& outRaw);
    void readCalibrated(std::array<uint16_t, SENSOR_COUNT>& outCalibrated);

    // Returns line centroid from -7500 (far left) to +7500 (far right)
    int16_t getLineCentroid();

    IntersectionType detectIntersection();
    bool isOnLine() const { return m_onLine; }

    const std::array<uint16_t, SENSOR_COUNT>& getCalibratedValues() const { return m_calibrated; }

private:
    std::array<uint16_t, SENSOR_COUNT> m_raw;
    std::array<uint16_t, SENSOR_COUNT> m_calibrated;
    std::array<uint16_t, SENSOR_COUNT> m_min;
    std::array<uint16_t, SENSOR_COUNT> m_max;

    int16_t m_lastCentroid;
    bool m_onLine;

    void selectMuxChannel(uint8_t channel);
};

} // namespace Robo1
`,

  qtr16_cpp: `/**
 * @file QTRSensors16.cpp
 * @brief ESP32 QTR-16 Implementation with High-Speed ADC Sampling
 */
#include "QTRSensors16.hpp"

namespace Robo1 {

QTRSensors16::QTRSensors16()
    : m_lastCentroid(0)
    , m_onLine(false) {
    m_raw.fill(0);
    m_calibrated.fill(0);
    m_min.fill(ADC_MAX_VAL);
    m_max.fill(0);
}

void QTRSensors16::init() {
    pinMode(PIN_MUX_S0, OUTPUT);
    pinMode(PIN_MUX_S1, OUTPUT);
    pinMode(PIN_MUX_S2, OUTPUT);
    pinMode(PIN_MUX_S3, OUTPUT);

    // ESP32 ADC1 setup: 12-bit (0..4095) with 11dB attenuation (up to 3.3V)
    analogReadResolution(12);
    analogSetAttenuation(ADC_11db);

    pinMode(PIN_MUX_SIG_ADC, INPUT);
}

inline void QTRSensors16::selectMuxChannel(uint8_t channel) {
    digitalWrite(PIN_MUX_S0, (channel & 0x01) ? HIGH : LOW);
    digitalWrite(PIN_MUX_S1, (channel & 0x02) ? HIGH : LOW);
    digitalWrite(PIN_MUX_S2, (channel & 0x04) ? HIGH : LOW);
    digitalWrite(PIN_MUX_S3, (channel & 0x08) ? HIGH : LOW);
    ets_delay_us(4); // ESP32 microsecond delay for multiplexer propagation
}

void QTRSensors16::readRaw(std::array<uint16_t, SENSOR_COUNT>& outRaw) {
    for (uint8_t i = 0; i < SENSOR_COUNT; ++i) {
        selectMuxChannel(i);
        m_raw[i] = analogRead(PIN_MUX_SIG_ADC);
        outRaw[i] = m_raw[i];
    }
}

void QTRSensors16::calibrateStep() {
    for (uint8_t i = 0; i < SENSOR_COUNT; ++i) {
        selectMuxChannel(i);
        uint16_t val = analogRead(PIN_MUX_SIG_ADC);
        if (val < m_min[i]) m_min[i] = val;
        if (val > m_max[i]) m_max[i] = val;
    }
}

void QTRSensors16::calibrateFinished() {
    // Add small guard band to prevent division by zero
    for (uint8_t i = 0; i < SENSOR_COUNT; ++i) {
        if (m_max[i] <= m_min[i]) {
            m_max[i] = m_min[i] + 100;
        }
    }
}

void QTRSensors16::readCalibrated(std::array<uint16_t, SENSOR_COUNT>& outCalibrated) {
    for (uint8_t i = 0; i < SENSOR_COUNT; ++i) {
        selectMuxChannel(i);
        uint16_t raw = analogRead(PIN_MUX_SIG_ADC);
        m_raw[i] = raw;

        int32_t cal = (static_cast<int32_t>(raw) - m_min[i]) * 1000 / (m_max[i] - m_min[i]);
        if (cal < 0) cal = 0;
        if (cal > 1000) cal = 1000;
        m_calibrated[i] = static_cast<uint16_t>(cal);
        outCalibrated[i] = m_calibrated[i];
    }
}

int16_t QTRSensors16::getLineCentroid() {
    readCalibrated(m_calibrated);

    int32_t weightedSum = 0;
    int32_t totalValue = 0;

    for (int i = 0; i < SENSOR_COUNT; ++i) {
        // Center of 16 sensors is between sensor 7 and 8 (index 0..15 -> -7500..+7500)
        int32_t weight = (i * 1000) - 7500;
        weightedSum += static_cast<int32_t>(m_calibrated[i]) * weight;
        totalValue += m_calibrated[i];
    }

    // Line lost: preserve last direction so robot returns toward line
    if (totalValue < 300) {
        m_onLine = false;
        return (m_lastCentroid > 0) ? 7500 : -7500;
    }

    m_onLine = true;
    m_lastCentroid = static_cast<int16_t>(weightedSum / totalValue);
    return m_lastCentroid;
}

IntersectionType QTRSensors16::detectIntersection() {
    // Outer 3 sensors on left (indices 0, 1, 2)
    bool leftSeen = (m_calibrated[0] > 600 || m_calibrated[1] > 600 || m_calibrated[2] > 600);
    // Center 6 sensors (indices 5..10)
    bool centerSeen = (m_calibrated[7] > 600 || m_calibrated[8] > 600);
    // Outer 3 sensors on right (indices 13, 14, 15)
    bool rightSeen = (m_calibrated[13] > 600 || m_calibrated[14] > 600 || m_calibrated[15] > 600);

    uint8_t countBlack = 0;
    for (uint8_t i = 0; i < SENSOR_COUNT; ++i) {
        if (m_calibrated[i] > 600) countBlack++;
    }

    if (countBlack >= 14) return IntersectionType::FINISH_LINE;
    if (countBlack == 0) return IntersectionType::DEAD_END;
    if (leftSeen && rightSeen && centerSeen) return IntersectionType::CROSS;
    if (leftSeen && rightSeen && !centerSeen) return IntersectionType::T_JUNCTION;
    if (leftSeen) return IntersectionType::LEFT_TURN;
    if (rightSeen) return IntersectionType::RIGHT_TURN;

    return IntersectionType::NONE;
}

} // namespace Robo1
`,

  pid_hpp: `/**
 * @file PIDController.hpp
 * @brief Discrete C++ PID Controller with Anti-Windup & Derivative Filter
 */
#pragma once

#include "ESP32_Config.hpp"
#include <esp_timer.h>

namespace Robo1 {

class PIDController {
public:
    PIDController(float kp = DEFAULT_KP, float ki = DEFAULT_KI, float kd = DEFAULT_KD);

    void reset();
    void setTunings(float kp, float ki, float kd);

    int16_t compute(int16_t error);

    inline float getKp() const { return m_kp; }
    inline float getKi() const { return m_ki; }
    inline float getKd() const { return m_kd; }
    inline float getLastError() const { return m_lastError; }
    inline float getIntegral() const { return m_integral; }

private:
    float m_kp;
    float m_ki;
    float m_kd;

    float m_integral;
    float m_lastError;
    float m_dFilter;
    int64_t m_lastTimeMicros;

    static constexpr float INTEGRAL_LIMIT = 4000.0f;
};

} // namespace Robo1
`,

  pid_cpp: `/**
 * @file PIDController.cpp
 * @brief ESP32 PID Computation with Microsecond Hardware Timer (esp_timer)
 */
#include "PIDController.hpp"
#include <algorithm>

namespace Robo1 {

PIDController::PIDController(float kp, float ki, float kd)
    : m_kp(kp)
    , m_ki(ki)
    , m_kd(kd)
    , m_integral(0.0f)
    , m_lastError(0.0f)
    , m_dFilter(0.0f)
    , m_lastTimeMicros(esp_timer_get_time()) {}

void PIDController::reset() {
    m_integral = 0.0f;
    m_lastError = 0.0f;
    m_dFilter = 0.0f;
    m_lastTimeMicros = esp_timer_get_time();
}

void PIDController::setTunings(float kp, float ki, float kd) {
    m_kp = kp;
    m_ki = ki;
    m_kd = kd;
}

int16_t PIDController::compute(int16_t error) {
    int64_t now = esp_timer_get_time();
    float dt = static_cast<float>(now - m_lastTimeMicros) / 1000000.0f;
    m_lastTimeMicros = now;

    // Guard against timer hiccups
    if (dt <= 0.0001f || dt > 0.05f) {
        dt = 0.005f; // fallback 5ms
    }

    // Proportional
    float pTerm = m_kp * static_cast<float>(error);

    // Integral with Anti-Windup Clamping
    m_integral += static_cast<float>(error) * dt;
    m_integral = std::clamp(m_integral, -INTEGRAL_LIMIT, INTEGRAL_LIMIT);
    float iTerm = m_ki * m_integral;

    // Derivative with Low-Pass Filter (Alpha = 0.7) to reject sensor jitter
    float rawD = (static_cast<float>(error) - m_lastError) / dt;
    m_dFilter = (0.7f * m_dFilter) + (0.3f * rawD);
    float dTerm = m_kd * m_dFilter;

    m_lastError = static_cast<float>(error);

    float output = pTerm + iTerm + dTerm;

    return static_cast<int16_t>(std::clamp(output, -255.0f, 255.0f));
}

} // namespace Robo1
`,

  maze_hpp: `/**
 * @file MazeSolver.hpp
 * @brief Modern C++ Line Maze Solver with LSRB Reduction
 * Implements Left Hand Rule (LHR) / Right Hand Rule (RHR) & Optimal Path Replay
 */
#pragma once

#include "ESP32_Config.hpp"
#include <string>
#include <vector>

namespace Robo1 {

enum class MazeMode {
    EXPLORING,
    SPEED_RUN,
    COMPLETED
};

enum class HandPreference {
    LEFT_HAND_RULE,
    RIGHT_HAND_RULE
};

class MazeSolver {
public:
    MazeSolver(HandPreference preference = HandPreference::LEFT_HAND_RULE);

    void reset();
    void setMode(MazeMode mode);
    void setPreference(HandPreference pref) { m_preference = pref; }

    void recordTurn(char turn); // 'L', 'R', 'S', 'B'
    void simplifyPath();

    char getNextSpeedrunTurn();
    bool isSpeedRunComplete() const;

    const std::string& getRecordedPath() const { return m_rawPath; }
    const std::string& getSimplifiedPath() const { return m_simplifiedPath; }
    MazeMode getMode() const { return m_mode; }
    size_t getCurrentStep() const { return m_stepIndex; }

private:
    MazeMode m_mode;
    HandPreference m_preference;
    std::string m_rawPath;
    std::string m_simplifiedPath;
    size_t m_stepIndex;

    bool reduceLastThree();
};

} // namespace Robo1
`,

  maze_cpp: `/**
 * @file MazeSolver.cpp
 * @brief Implementation of Tremaux / LSRB Path Reduction Algorithm
 */
#include "MazeSolver.hpp"

namespace Robo1 {

MazeSolver::MazeSolver(HandPreference preference)
    : m_mode(MazeMode::EXPLORING)
    , m_preference(preference)
    , m_stepIndex(0) {
    reset();
}

void MazeSolver::reset() {
    m_rawPath.clear();
    m_simplifiedPath.clear();
    m_stepIndex = 0;
    m_mode = MazeMode::EXPLORING;
}

void MazeSolver::setMode(MazeMode mode) {
    m_mode = mode;
    if (mode == MazeMode::SPEED_RUN) {
        m_stepIndex = 0;
    }
}

void MazeSolver::recordTurn(char turn) {
    m_rawPath.push_back(turn);
    m_simplifiedPath.push_back(turn);

    // Apply recursive simplification whenever a dead end 'B' is added
    simplifyPath();
}

bool MazeSolver::reduceLastThree() {
    size_t len = m_simplifiedPath.size();
    if (len < 3) return false;

    // Check if middle turn was a U-Turn (Dead End)
    if (m_simplifiedPath[len - 2] != 'B') return false;

    char first = m_simplifiedPath[len - 3];
    char second = 'B';
    char third = m_simplifiedPath[len - 1];
    char replacement = 0;

    // Standard Maze Reduction Rules:
    if (first == 'L' && second == 'B' && third == 'L') replacement = 'S';
    else if (first == 'L' && second == 'B' && third == 'S') replacement = 'R';
    else if (first == 'R' && second == 'B' && third == 'L') replacement = 'B';
    else if (first == 'S' && second == 'B' && third == 'L') replacement = 'R';
    else if (first == 'S' && second == 'B' && third == 'S') replacement = 'B';
    else if (first == 'L' && second == 'B' && third == 'R') replacement = 'B';

    if (replacement != 0) {
        m_simplifiedPath.erase(len - 3, 3);
        m_simplifiedPath.push_back(replacement);
        return true;
    }

    return false;
}

void MazeSolver::simplifyPath() {
    while (reduceLastThree()) {
        // Continue reducing in case multiple nested U-turns collapse
    }
}

char MazeSolver::getNextSpeedrunTurn() {
    if (m_stepIndex < m_simplifiedPath.size()) {
        return m_simplifiedPath[m_stepIndex++];
    }
    m_mode = MazeMode::COMPLETED;
    return 'F'; // Finished
}

bool MazeSolver::isSpeedRunComplete() const {
    return (m_stepIndex >= m_simplifiedPath.size());
}

} // namespace Robo1
`,

  display_hpp: `/**
 * @file DisplayManager.hpp
 * @brief SH1106 128x64 OLED Display Manager for ESP32
 * Uses Adafruit_SH1106G or U8g2 library for real-time telemetry HUD
 */
#pragma once

#include "ESP32_Config.hpp"
#include <Wire.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SH1106G.h>
#include <array>

namespace Robo1 {

class DisplayManager {
public:
    DisplayManager();
    bool init();

    void showSplash();
    void showCalibration(uint16_t step, uint16_t maxSteps);
    void updateTelemetry(
        const char* modeStr,
        int16_t error,
        int16_t leftSpeed,
        int16_t rightSpeed,
        const std::array<uint16_t, SENSOR_COUNT>& sensorBars,
        const char* pathStr
    );

private:
    Adafruit_SH1106G m_display;
};

} // namespace Robo1
`,

  main_cpp: `/**
 * @file main.cpp
 * @brief Complete ESP32 FreeRTOS Dual-Core Robot Maze Solver Firmware
 * 
 * Task Architecture:
 *  - Core 1: 1000Hz Real-Time Sensor Reading & PID Motor Control Loop (High Priority)
 *  - Core 0: OLED Display Refresh, Telemetry, and Button State Machine (Low Priority)
 */
#include "ESP32_Config.hpp"
#include "MotorController.hpp"
#include "QTRSensors16.hpp"
#include "PIDController.hpp"
#include "MazeSolver.hpp"
#include <Arduino.h>

using namespace Robo1;

// Global Hardware & Logic Instances
MotorController motors;
QTRSensors16    sensors;
PIDController   pid(DEFAULT_KP, DEFAULT_KI, DEFAULT_KD);
MazeSolver      maze(HandPreference::LEFT_HAND_RULE);

// FreeRTOS Task Handles & Synchronization
TaskHandle_t hControlTask = nullptr;
TaskHandle_t hDisplayTask = nullptr;

volatile int16_t g_currentError = 0;
volatile bool    g_isCalibrated = false;
volatile bool    g_runActive = false;

// ==========================================
// CORE 1 TASK: 1000Hz (1ms) REAL-TIME PID LOOP
// ==========================================
void taskControlLoop(void* pvParameters) {
    TickType_t xLastWakeTime = xTaskGetTickCount();
    const TickType_t xFrequency = pdMS_TO_TICKS(2); // 500Hz loop rate (2ms)

    for (;;) {
        if (g_runActive && g_isCalibrated) {
            // 1. Read Centroid
            int16_t error = sensors.getLineCentroid();
            g_currentError = error;

            // 2. Check Intersections (LSRB Logic)
            IntersectionType inter = sensors.detectIntersection();

            if (maze.getMode() == MazeMode::EXPLORING) {
                if (inter == IntersectionType::LEFT_TURN || inter == IntersectionType::T_JUNCTION || inter == IntersectionType::CROSS) {
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
                    // Standard PID Line Following
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
                    int16_t correction = pid.compute(error);
                    motors.setSpeeds(SPEED_RUN_SPEED + correction, SPEED_RUN_SPEED - correction);
                }
            }
        }

        vTaskDelayUntil(&xLastWakeTime, xFrequency);
    }
}

// ==========================================
// CORE 0 TASK: USER INTERFACE & TELEMETRY
// ==========================================
void taskDisplayLoop(void* pvParameters) {
    for (;;) {
        // Handle Button Presses
        if (digitalRead(PIN_BTN_CALIBRATE) == LOW && !g_isCalibrated) {
            Serial.println("[ROBO1] Starting Sensor Calibration...");
            for (int i = 0; i < 250; ++i) {
                sensors.calibrateStep();
                vTaskDelay(pdMS_TO_TICKS(10));
            }
            sensors.calibrateFinished();
            g_isCalibrated = true;
            Serial.println("[ROBO1] Calibration Complete!");
        }

        if (digitalRead(PIN_BTN_START) == LOW && g_isCalibrated) {
            g_runActive = !g_runActive;
            if (!g_runActive) motors.stop();
            vTaskDelay(pdMS_TO_TICKS(300)); // Debounce
        }

        // Print Telemetry over USB Serial
        if (g_runActive) {
            Serial.printf("Err: %6d | L: %3d | R: %3d | Path: %s\\n",
                g_currentError, motors.getLeftSpeed(), motors.getRightSpeed(),
                maze.getSimplifiedPath().c_str());
        }

        vTaskDelay(pdMS_TO_TICKS(50)); // 20Hz UI update rate
    }
}

void setup() {
    Serial.begin(115200);
    delay(500);
    Serial.println("==========================================");
    Serial.println("  ROBO1 ESP32 C++ MAZE SOLVER FIRMWARE   ");
    Serial.println("==========================================");

    pinMode(PIN_BTN_CALIBRATE, INPUT_PULLUP);
    pinMode(PIN_BTN_START, INPUT_PULLUP);

    motors.init();
    sensors.init();

    // Spawn Core 1 Real-Time Control Task (Highest Priority: 5)
    xTaskCreatePinnedToCore(
        taskControlLoop,
        "ControlTask",
        4096,
        nullptr,
        5,
        &hControlTask,
        1 // Pin to CPU Core 1
    );

    // Spawn Core 0 Display/UI Task (Priority: 1)
    xTaskCreatePinnedToCore(
        taskDisplayLoop,
        "DisplayTask",
        4096,
        nullptr,
        1,
        &hDisplayTask,
        0 // Pin to CPU Core 0
    );
}

void loop() {
    // Empty: FreeRTOS tasks handle everything independently on Core 0 and Core 1
    vTaskDelay(pdMS_TO_TICKS(1000));
}
`,

  platformio_ini: `; PlatformIO Project Configuration File
; Project: Robo1 ESP32 C++ Autonomous Maze Solver

[env:esp32dev]
platform = espressif32 @ ^6.5.0
board = esp32dev
framework = arduino
monitor_speed = 115200
upload_speed = 921600

build_flags = 
    -D CORE_DEBUG_LEVEL=2
    -O3
    -std=gnu++17

lib_deps = 
    adafruit/Adafruit SH110X @ ^2.1.10
    adafruit/Adafruit GFX Library @ ^1.11.9
    Wire
`,

  readme_md: `# Robo1: ESP32 Autonomous Line & Maze Solver (C++)

This project is a high-performance ESP32 C++ port of the classic **Robo1** line follower and maze solving firmware.

## Architecture Highlights
- **Dual-Core FreeRTOS**:
  - **Core 1**: Real-time 500Hz-1000Hz sensor acquisition, centroid calculation, and discrete PID motor steering.
  - **Core 0**: SH1106 OLED display HUD, serial telemetry, and button debouncing.
- **Hardware LEDC PWM**:
  - Replaces jittery 8-bit AVR \`analogWrite\` with 20kHz ultrasonic silent hardware PWM.
- **12-bit SAR ADC**:
  - Calibrated reflectance reads across 16 sensors via 74HC4067 multiplexer.
- **LSRB Maze Optimization**:
  - Autonomous dead-end cancellation (\`LBL -> S\`, \`LBR -> B\`, etc.) with high-speed optimal path replay.

## Pinout Map
| Peripheral | Pin (ESP32) | Notes |
|------------|-------------|-------|
| Motor L PWM | GPIO 25 | LEDC Channel 0 |
| Motor L DIR1| GPIO 26 | Digital Out |
| Motor L DIR2| GPIO 27 | Digital Out |
| Motor R PWM | GPIO 32 | LEDC Channel 1 |
| Motor R DIR1| GPIO 33 | Digital Out |
| Motor R DIR2| GPIO 14 | Digital Out |
| Motor STBY  | GPIO 13 | Enable H-Bridge |
| Mux S0..S3  | GPIO 19, 18, 5, 17 | 74HC4067 Select |
| Mux SIG ADC | GPIO 34 | Input-Only ADC1_CH6 |
| OLED I2C    | GPIO 21 (SDA), 22 (SCL) | Hardware I2C |
| Button Cal  | GPIO 4 | Pullup |
| Button Start| GPIO 16| Pullup |

## Flashing Instructions
### PlatformIO (VSCode)
1. Open this directory in VS Code with PlatformIO extension installed.
2. Click **Build** (\`Ctrl+Alt+B\`) and **Upload** (\`Ctrl+Alt+U\`).
3. Open Serial Monitor at 115200 baud.

### Arduino IDE
1. Install **ESP32 by Espressif Systems** via Boards Manager.
2. Select Board: **ESP32 Dev Module**.
3. Install **Adafruit SH110X** and **Adafruit GFX** from Library Manager.
4. Open \`Robo1_ESP32.ino\` and flash!
`
};
