/**
 * @file DisplayManager.hpp
 * @brief SH1106 128x64 OLED Display Manager for ESP32
 */

#pragma once

#include "ESP32_Config.hpp"
#include <Wire.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SH1106G.h>
#include <array>
#include <cstdint>

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
