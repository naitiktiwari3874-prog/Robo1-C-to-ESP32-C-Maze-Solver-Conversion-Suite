/**
 * @file PIDController.cpp
 * @brief Discrete PID Implementation with Derivative Low-Pass Filter
 */

#include "PIDController.hpp"
#include <esp_timer.h>
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

    if (dt <= 0.0001f || dt > 0.05f) {
        dt = 0.005f; // Fallback 5ms
    }

    // Proportional
    float pTerm = m_kp * static_cast<float>(error);

    // Integral with Anti-Windup Clamping
    m_integral += static_cast<float>(error) * dt;
    m_integral = std::clamp(m_integral, -INTEGRAL_LIMIT, INTEGRAL_LIMIT);
    float iTerm = m_ki * m_integral;

    // Derivative with 1st-order low-pass filter (0.7 / 0.3)
    float rawD = (static_cast<float>(error) - m_lastError) / dt;
    m_dFilter = (0.7f * m_dFilter) + (0.3f * rawD);
    float dTerm = m_kd * m_dFilter;

    m_lastError = static_cast<float>(error);

    float output = pTerm + iTerm + dTerm;

    return static_cast<int16_t>(std::clamp(output, -255.0f, 255.0f));
}

} // namespace Robo1
