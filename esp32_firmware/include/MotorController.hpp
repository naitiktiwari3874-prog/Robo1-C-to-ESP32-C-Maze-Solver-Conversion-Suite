/**
 * @file MotorController.hpp
 * @brief Differential Motor Controller Header for ESP32
 */

#pragma once

#include "ESP32_Config.hpp"
#include <cstdint>

namespace Robo1 {

class MotorController {
public:
    MotorController();
    ~MotorController() = default;

    void init();
    void setSpeeds(int16_t leftSpeed, int16_t rightSpeed);
    void brake();
    void stop();

    // Turn routines
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
