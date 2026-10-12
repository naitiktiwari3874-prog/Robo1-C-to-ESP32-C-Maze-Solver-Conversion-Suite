/**
 * @file MotorController.cpp
 * @brief Differential Motor Controller Implementation using ESP32 LEDC PWM
 */

#include "MotorController.hpp"
#include <Arduino.h>

namespace Robo1 {

MotorController::MotorController()
    : m_currentLeft(0)
    , m_currentRight(0) {}

void MotorController::init() {
    // Direction Output Pins
    pinMode(PIN_MOTOR_LEFT_DIR1, OUTPUT);
    pinMode(PIN_MOTOR_LEFT_DIR2, OUTPUT);
    pinMode(PIN_MOTOR_RIGHT_DIR1, OUTPUT);
    pinMode(PIN_MOTOR_RIGHT_DIR2, OUTPUT);

    pinMode(PIN_MOTOR_STBY, OUTPUT);
    digitalWrite(PIN_MOTOR_STBY, HIGH); // Enable H-Bridge

    // ESP32 Hardware LEDC Timer Setup
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
