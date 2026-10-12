/**
 * @file QTRSensors16.hpp
 * @brief 16-Channel Reflectance Sensor Header for ESP32
 */

#pragma once

#include "ESP32_Config.hpp"
#include <array>
#include <cstdint>

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
