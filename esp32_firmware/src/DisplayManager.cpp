/**
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

    // Draw progress bar
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

    // Line 1: Mode & Error
    m_display.setTextSize(1);
    m_display.setCursor(0, 0);
    m_display.printf("MODE:%s E:%4d", modeStr, error);

    // Line 2: 16-Sensor Bar Graph (Y: 12 to 38)
    for (uint8_t i = 0; i < SENSOR_COUNT; ++i) {
        int barHeight = (sensorBars[i] * 24) / 1000;
        if (barHeight > 24) barHeight = 24;
        m_display.fillRect(i * 8, 38 - barHeight, 6, barHeight, SH110X_WHITE);
    }

    // Line 3: Motor Speeds
    m_display.setCursor(0, 42);
    m_display.printf("L:%3d  R:%3d", leftSpeed, rightSpeed);

    // Line 4: Path string
    m_display.setCursor(0, 54);
    m_display.printf("PATH:%s", pathStr ? pathStr : "");

    m_display.display();
}

} // namespace Robo1
