/**
 * @file ESP32_Config.hpp
 * @brief Robot Configuration, Hardware Pinout & Tuning Parameters
 * Target: ESP32-WROOM-32 / ESP32-S3 / NodeMCU-32S
 */

#pragma once

#include <cstdint>
#include <cstddef>

namespace Robo1 {

// ========================================================
// 1. MOTOR DRIVER (TB6612FNG / L298N)
// ========================================================
// Safe General-Purpose Output Pins (No strapping pin conflicts)
constexpr int PIN_MOTOR_LEFT_PWM   = 25; // LEDC Channel 0
constexpr int PIN_MOTOR_LEFT_DIR1  = 26;
constexpr int PIN_MOTOR_LEFT_DIR2  = 27;

constexpr int PIN_MOTOR_RIGHT_PWM  = 32; // LEDC Channel 1
constexpr int PIN_MOTOR_RIGHT_DIR1 = 33;
constexpr int PIN_MOTOR_RIGHT_DIR2 = 14;

constexpr int PIN_MOTOR_STBY       = 13; // Standby / Enable

// LEDC Hardware PWM Settings
constexpr uint32_t LEDC_PWM_FREQ       = 20000; // 20kHz Ultrasonic (Silent)
constexpr uint8_t  LEDC_PWM_RESOLUTION = 8;     // 8-bit (0..255)
constexpr uint8_t  LEDC_CHANNEL_LEFT   = 0;
constexpr uint8_t  LEDC_CHANNEL_RIGHT  = 1;

// ========================================================
// 2. QTR-16 REFLECTANCE SENSOR ARRAY (74HC4067 MUX)
// ========================================================
constexpr int PIN_MUX_S0           = 19;
constexpr int PIN_MUX_S1           = 18;
constexpr int PIN_MUX_S2           = 5;
constexpr int PIN_MUX_S3           = 17;
constexpr int PIN_MUX_SIG_ADC      = 34; // Input-only pin (ADC1_CH6)

constexpr uint8_t  SENSOR_COUNT    = 16;
constexpr uint16_t ADC_MAX_VAL     = 4095; // 12-bit SAR ADC

// ========================================================
// 3. I2C OLED DISPLAY (SH1106 128x64)
// ========================================================
constexpr int PIN_I2C_SDA          = 21;
constexpr int PIN_I2C_SCL          = 22;
constexpr uint8_t OLED_I2C_ADDR    = 0x3C;
constexpr uint16_t OLED_WIDTH      = 128;
constexpr uint16_t OLED_HEIGHT     = 64;

// ========================================================
// 4. USER BUTTONS & BATTERY MONITOR
// ========================================================
constexpr int PIN_BTN_CALIBRATE    = 4;  // Active LOW, Internal Pullup
constexpr int PIN_BTN_START        = 16; // Active LOW, Internal Pullup
constexpr int PIN_BATTERY_ADC      = 35; // Input-only pin (ADC1_CH7)

// ========================================================
// 5. PID & MOTOR SPEED CONSTANTS
// ========================================================
constexpr float DEFAULT_KP         = 0.045f;
constexpr float DEFAULT_KI         = 0.0002f;
constexpr float DEFAULT_KD         = 0.280f;

constexpr int16_t BASE_SPEED       = 150; // 0..255 PWM
constexpr int16_t MAX_SPEED        = 250;
constexpr int16_t TURN_SPEED       = 130;
constexpr int16_t SPEED_RUN_SPEED  = 210; // Boosted speed for mapped run

// Maze Maximum Path Capacity
constexpr size_t MAX_PATH_LENGTH   = 160;

} // namespace Robo1
