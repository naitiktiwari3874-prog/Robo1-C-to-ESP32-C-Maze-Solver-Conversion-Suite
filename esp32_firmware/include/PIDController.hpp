/**
 * @file PIDController.hpp
 * @brief Discrete PID Controller Header for ESP32
 */

#pragma once

#include "ESP32_Config.hpp"
#include <cstdint>

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
