/**
 * @file QTRSensors16.cpp
 * @brief 16-Channel Reflectance Sensor Implementation with 74HC4067 MUX
 */

#include "QTRSensors16.hpp"
#include <Arduino.h>

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
    ets_delay_us(4); // 4us multiplexer propagation delay
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
        int32_t weight = (i * 1000) - 7500;
        weightedSum += static_cast<int32_t>(m_calibrated[i]) * weight;
        totalValue += m_calibrated[i];
    }

    if (totalValue < 300) {
        m_onLine = false;
        return (m_lastCentroid > 0) ? 7500 : -7500;
    }

    m_onLine = true;
    m_lastCentroid = static_cast<int16_t>(weightedSum / totalValue);
    return m_lastCentroid;
}

IntersectionType QTRSensors16::detectIntersection() {
    bool leftSeen = (m_calibrated[0] > 600 || m_calibrated[1] > 600 || m_calibrated[2] > 600);
    bool centerSeen = (m_calibrated[7] > 600 || m_calibrated[8] > 600);
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
