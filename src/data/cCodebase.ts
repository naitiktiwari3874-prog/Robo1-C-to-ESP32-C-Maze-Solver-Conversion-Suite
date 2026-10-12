export const C_CODEBASE = {
  config_h: `/**
 * @file config.h
 * @brief Robot Configuration and Pin Definitions (Legacy C / AVR)
 * Target: ATmega328P / ATmega2560 (8-bit Microcontroller)
 */
#ifndef CONFIG_H
#define CONFIG_H

#include <stdint.h>
#include <stdbool.h>

/* Motor Driver Pins (TB6612FNG / L298N) */
#define MOTOR_LEFT_PWM_PIN       5   /* OC0B (Timer 0 PWM) */
#define MOTOR_LEFT_DIR1_PIN      4
#define MOTOR_LEFT_DIR2_PIN      2

#define MOTOR_RIGHT_PWM_PIN      6   /* OC0A (Timer 0 PWM) */
#define MOTOR_RIGHT_DIR1_PIN     7
#define MOTOR_RIGHT_DIR2_PIN     8

#define MOTOR_STBY_PIN           3

/* QTR-16 Sensor Array (Using 74HC4067 16-channel Multiplexer) */
#define MUX_S0_PIN               9
#define MUX_S1_PIN               10
#define MUX_S2_PIN               11
#define MUX_S3_PIN               12
#define MUX_SIG_ANALOG_PIN       0   /* Analog Pin A0 (10-bit ADC: 0..1023) */

#define SENSOR_COUNT             16
#define SENSOR_MIN_VAL           100
#define SENSOR_MAX_VAL           950
#define SENSOR_BLACK_THRESHOLD   500

/* OLED Display SH1106 (I2C) */
#define OLED_I2C_ADDR            0x3C
#define OLED_WIDTH               128
#define OLED_HEIGHT              64

/* Button Inputs */
#define BTN_CALIBRATE_PIN        13
#define BTN_START_PIN            14  /* A0 as digital or dedicated pin */

/* PID Default Constants */
#define DEFAULT_KP               18.5f
#define DEFAULT_KI               0.05f
#define DEFAULT_KD               22.0f
#define BASE_MOTOR_SPEED         140
#define MAX_MOTOR_SPEED          255
#define TURN_MOTOR_SPEED         120

/* Maze Algorithm Constraints */
#define MAX_PATH_LENGTH          128

#endif /* CONFIG_H */
`,

  motor_h: `/**
 * @file motor.h
 * @brief Motor Control Driver Header (C Implementation)
 */
#ifndef MOTOR_H
#define MOTOR_H

#include "config.h"

void motor_init(void);
void motor_set_speeds(int16_t left_speed, int16_t right_speed);
void motor_brake(void);
void motor_stop(void);

void motor_turn_left_90(void);
void motor_turn_right_90(void);
void motor_turn_180(void);
void motor_inch_forward(uint16_t ms);

#endif /* MOTOR_H */
`,

  motor_c: `/**
 * @file motor.c
 * @brief Differential Motor Driver Implementation in C
 * Uses standard Arduino wiring / AVR register analogWrite
 */
#include "motor.h"
#include <Arduino.h>

void motor_init(void) {
    pinMode(MOTOR_LEFT_PWM_PIN, OUTPUT);
    pinMode(MOTOR_LEFT_DIR1_PIN, OUTPUT);
    pinMode(MOTOR_LEFT_DIR2_PIN, OUTPUT);

    pinMode(MOTOR_RIGHT_PWM_PIN, OUTPUT);
    pinMode(MOTOR_RIGHT_DIR1_PIN, OUTPUT);
    pinMode(MOTOR_RIGHT_DIR2_PIN, OUTPUT);

    pinMode(MOTOR_STBY_PIN, OUTPUT);
    digitalWrite(MOTOR_STBY_PIN, HIGH); /* Enable motor driver */

    motor_stop();
}

void motor_set_speeds(int16_t left_speed, int16_t right_speed) {
    /* Clamp speeds to -255 .. 255 */
    if (left_speed > MAX_MOTOR_SPEED) left_speed = MAX_MOTOR_SPEED;
    if (left_speed < -MAX_MOTOR_SPEED) left_speed = -MAX_MOTOR_SPEED;
    if (right_speed > MAX_MOTOR_SPEED) right_speed = MAX_MOTOR_SPEED;
    if (right_speed < -MAX_MOTOR_SPEED) right_speed = -MAX_MOTOR_SPEED;

    /* Left Motor Direction */
    if (left_speed >= 0) {
        digitalWrite(MOTOR_LEFT_DIR1_PIN, HIGH);
        digitalWrite(MOTOR_LEFT_DIR2_PIN, LOW);
        analogWrite(MOTOR_LEFT_PWM_PIN, left_speed);
    } else {
        digitalWrite(MOTOR_LEFT_DIR1_PIN, LOW);
        digitalWrite(MOTOR_LEFT_DIR2_PIN, HIGH);
        analogWrite(MOTOR_LEFT_PWM_PIN, -left_speed);
    }

    /* Right Motor Direction */
    if (right_speed >= 0) {
        digitalWrite(MOTOR_RIGHT_DIR1_PIN, HIGH);
        digitalWrite(MOTOR_RIGHT_DIR2_PIN, LOW);
        analogWrite(MOTOR_RIGHT_PWM_PIN, right_speed);
    } else {
        digitalWrite(MOTOR_RIGHT_DIR1_PIN, LOW);
        digitalWrite(MOTOR_RIGHT_DIR2_PIN, HIGH);
        analogWrite(MOTOR_RIGHT_PWM_PIN, -right_speed);
    }
}

void motor_brake(void) {
    digitalWrite(MOTOR_LEFT_DIR1_PIN, HIGH);
    digitalWrite(MOTOR_LEFT_DIR2_PIN, HIGH);
    analogWrite(MOTOR_LEFT_PWM_PIN, 255);

    digitalWrite(MOTOR_RIGHT_DIR1_PIN, HIGH);
    digitalWrite(MOTOR_RIGHT_DIR2_PIN, HIGH);
    analogWrite(MOTOR_RIGHT_PWM_PIN, 255);
}

void motor_stop(void) {
    digitalWrite(MOTOR_LEFT_DIR1_PIN, LOW);
    digitalWrite(MOTOR_LEFT_DIR2_PIN, LOW);
    analogWrite(MOTOR_LEFT_PWM_PIN, 0);

    digitalWrite(MOTOR_RIGHT_DIR1_PIN, LOW);
    digitalWrite(MOTOR_RIGHT_DIR2_PIN, LOW);
    analogWrite(MOTOR_RIGHT_PWM_PIN, 0);
}

void motor_turn_left_90(void) {
    motor_set_speeds(-TURN_MOTOR_SPEED, TURN_MOTOR_SPEED);
    delay(180); /* Fixed delay turn in legacy C */
    motor_stop();
}

void motor_turn_right_90(void) {
    motor_set_speeds(TURN_MOTOR_SPEED, -TURN_MOTOR_SPEED);
    delay(180);
    motor_stop();
}

void motor_turn_180(void) {
    motor_set_speeds(-TURN_MOTOR_SPEED, TURN_MOTOR_SPEED);
    delay(360);
    motor_stop();
}

void motor_inch_forward(uint16_t ms) {
    motor_set_speeds(BASE_MOTOR_SPEED, BASE_MOTOR_SPEED);
    delay(ms);
    motor_stop();
}
`,

  qtr16_h: `/**
 * @file qtr16.h
 * @brief QTR-16 Reflectance Sensor Bar Header (C Implementation)
 */
#ifndef QTR16_H
#define QTR16_H

#include "config.h"

typedef struct {
    uint16_t raw_values[SENSOR_COUNT];
    uint16_t calibrated_values[SENSOR_COUNT];
    uint16_t cal_min[SENSOR_COUNT];
    uint16_t cal_max[SENSOR_COUNT];
    int16_t  last_centroid;
    bool     on_line;
} QTR16_Sensor_t;

void qtr16_init(QTR16_Sensor_t *sensor);
void qtr16_calibrate_step(QTR16_Sensor_t *sensor);
void qtr16_read_raw(QTR16_Sensor_t *sensor);
void qtr16_read_calibrated(QTR16_Sensor_t *sensor);
int16_t qtr16_get_line_centroid(QTR16_Sensor_t *sensor);
bool qtr16_is_intersection(QTR16_Sensor_t *sensor, uint8_t *type);

#endif /* QTR16_H */
`,

  qtr16_c: `/**
 * @file qtr16.c
 * @brief QTR-16 Sensor Multiplexer Reader & Centroid Calculation (C)
 */
#include "qtr16.h"
#include <Arduino.h>

void qtr16_init(QTR16_Sensor_t *sensor) {
    pinMode(MUX_S0_PIN, OUTPUT);
    pinMode(MUX_S1_PIN, OUTPUT);
    pinMode(MUX_S2_PIN, OUTPUT);
    pinMode(MUX_S3_PIN, OUTPUT);

    for (int i = 0; i < SENSOR_COUNT; i++) {
        sensor->cal_min[i] = 1023; /* 10-bit ADC max */
        sensor->cal_max[i] = 0;
        sensor->raw_values[i] = 0;
        sensor->calibrated_values[i] = 0;
    }
    sensor->last_centroid = 0;
    sensor->on_line = false;
}

static void select_mux_channel(uint8_t channel) {
    digitalWrite(MUX_S0_PIN, (channel & 0x01) ? HIGH : LOW);
    digitalWrite(MUX_S1_PIN, (channel & 0x02) ? HIGH : LOW);
    digitalWrite(MUX_S2_PIN, (channel & 0x04) ? HIGH : LOW);
    digitalWrite(MUX_S3_PIN, (channel & 0x08) ? HIGH : LOW);
    delayMicroseconds(5); /* MUX settling time */
}

void qtr16_read_raw(QTR16_Sensor_t *sensor) {
    for (uint8_t i = 0; i < SENSOR_COUNT; i++) {
        select_mux_channel(i);
        sensor->raw_values[i] = analogRead(MUX_SIG_ANALOG_PIN);
    }
}

void qtr16_calibrate_step(QTR16_Sensor_t *sensor) {
    qtr16_read_raw(sensor);
    for (int i = 0; i < SENSOR_COUNT; i++) {
        if (sensor->raw_values[i] < sensor->cal_min[i]) {
            sensor->cal_min[i] = sensor->raw_values[i];
        }
        if (sensor->raw_values[i] > sensor->cal_max[i]) {
            sensor->cal_max[i] = sensor->raw_values[i];
        }
    }
}

void qtr16_read_calibrated(QTR16_Sensor_t *sensor) {
    qtr16_read_raw(sensor);
    for (int i = 0; i < SENSOR_COUNT; i++) {
        uint16_t min = sensor->cal_min[i];
        uint16_t max = sensor->cal_max[i];
        if (max <= min) max = min + 1;

        int32_t val = (int32_t)(sensor->raw_values[i] - min) * 1000 / (max - min);
        if (val < 0) val = 0;
        if (val > 1000) val = 1000;
        sensor->calibrated_values[i] = (uint16_t)val;
    }
}

int16_t qtr16_get_line_centroid(QTR16_Sensor_t *sensor) {
    qtr16_read_calibrated(sensor);

    int32_t weighted_sum = 0;
    int32_t total_val = 0;

    /* Weighted average across 16 sensors: indices 0..15 mapped to -7500..+7500 */
    for (int i = 0; i < SENSOR_COUNT; i++) {
        int32_t weight = (i * 1000) - 7500; /* Center is 0 */
        weighted_sum += (int32_t)sensor->calibrated_values[i] * weight;
        total_val += sensor->calibrated_values[i];
    }

    if (total_val < 300) {
        sensor->on_line = false;
        /* Line lost: return extreme previous side to recover */
        return (sensor->last_centroid > 0) ? 7500 : -7500;
    }

    sensor->on_line = true;
    int16_t centroid = (int16_t)(weighted_sum / total_val);
    sensor->last_centroid = centroid;
    return centroid;
}
`,

  pid_h: `/**
 * @file pid.h
 * @brief Discrete PID Controller for Line Following (C Implementation)
 */
#ifndef PID_H
#define PID_H

#include "config.h"

typedef struct {
    float kp;
    float ki;
    float kd;
    float integral;
    float last_error;
    int32_t max_output;
    uint32_t last_time_ms;
} PID_Controller_t;

void pid_init(PID_Controller_t *pid, float kp, float ki, float kd);
int16_t pid_compute(PID_Controller_t *pid, int16_t error, float dt_sec);
void pid_reset(PID_Controller_t *pid);

#endif /* PID_H */
`,

  pid_c: `/**
 * @file pid.c
 * @brief PID Computation Implementation with Integral Anti-Windup (C)
 */
#include "pid.h"

void pid_init(PID_Controller_t *pid, float kp, float ki, float kd) {
    pid->kp = kp;
    pid->ki = ki;
    pid->kd = kd;
    pid->integral = 0.0f;
    pid->last_error = 0.0f;
    pid->max_output = 255;
    pid->last_time_ms = 0;
}

void pid_reset(PID_Controller_t *pid) {
    pid->integral = 0.0f;
    pid->last_error = 0.0f;
}

int16_t pid_compute(PID_Controller_t *pid, int16_t error, float dt_sec) {
    if (dt_sec <= 0.0001f) dt_sec = 0.005f;

    /* Proportional Term */
    float p_term = pid->kp * (float)error;

    /* Integral Term with clamp */
    pid->integral += (float)error * dt_sec;
    if (pid->integral > 3000.0f) pid->integral = 3000.0f;
    if (pid->integral < -3000.0f) pid->integral = -3000.0f;
    float i_term = pid->ki * pid->integral;

    /* Derivative Term */
    float d_term = pid->kd * ((float)error - pid->last_error) / dt_sec;
    pid->last_error = (float)error;

    float output = p_term + i_term + d_term;

    /* Scale normalized centroid down to motor PWM difference */
    int16_t output_pwm = (int16_t)(output / 100.0f);
    if (output_pwm > pid->max_output) output_pwm = pid->max_output;
    if (output_pwm < -pid->max_output) output_pwm = -pid->max_output;

    return output_pwm;
}
`,

  maze_h: `/**
 * @file maze.h
 * @brief Maze Solving & Path Simplification Header (C Implementation)
 * Implements Left Hand Rule / LSRB dead-end cancellation
 */
#ifndef MAZE_H
#define MAZE_H

#include "config.h"

typedef enum {
    MAZE_EXPLORE,   /* Dry run: mapping maze via Left Hand Rule */
    MAZE_SPEED_RUN  /* Second run: executing simplified shortest path */
} Maze_Mode_t;

typedef struct {
    char path[MAX_PATH_LENGTH];
    uint8_t path_length;
    uint8_t current_step;
    Maze_Mode_t mode;
} Maze_Solver_t;

void maze_init(Maze_Solver_t *solver);
void maze_record_turn(Maze_Solver_t *solver, char turn);
void maze_simplify_path(Maze_Solver_t *solver);
char maze_get_next_speedrun_turn(Maze_Solver_t *solver);

#endif /* MAZE_H */
`,

  maze_c: `/**
 * @file maze.c
 * @brief Tremaux / Left-Hand Rule Maze String Reduction (C)
 * Standard replacements:
 *   LBL -> S
 *   LBR -> B
 *   RBL -> B
 *   SBS -> B
 *   LBS -> R
 *   SBL -> R
 */
#include "maze.h"
#include <string.h>

void maze_init(Maze_Solver_t *solver) {
    memset(solver->path, 0, sizeof(solver->path));
    solver->path_length = 0;
    solver->current_step = 0;
    solver->mode = MAZE_EXPLORE;
}

void maze_record_turn(Maze_Solver_t *solver, char turn) {
    if (solver->path_length < MAX_PATH_LENGTH - 1) {
        solver->path[solver->path_length++] = turn;
        solver->path[solver->path_length] = '\\0';
        maze_simplify_path(solver);
    }
}

void maze_simplify_path(Maze_Solver_t *solver) {
    /* Need at least 3 steps with the middle one being 'B' (U-turn / dead end) */
    if (solver->path_length < 3) return;

    if (solver->path[solver->path_length - 2] != 'B') return;

    char first = solver->path[solver->path_length - 3];
    char second = solver->path[solver->path_length - 2]; /* 'B' */
    char third = solver->path[solver->path_length - 1];
    char replacement = 0;

    if (first == 'L' && second == 'B' && third == 'L') replacement = 'S';
    else if (first == 'L' && second == 'B' && third == 'R') replacement = 'B';
    else if (first == 'R' && second == 'B' && third == 'L') replacement = 'B';
    else if (first == 'S' && second == 'B' && third == 'S') replacement = 'B';
    else if (first == 'L' && second == 'B' && third == 'S') replacement = 'R';
    else if (first == 'S' && second == 'B' && third == 'L') replacement = 'R';

    if (replacement != 0) {
        solver->path[solver->path_length - 3] = replacement;
        solver->path_length -= 2;
        solver->path[solver->path_length] = '\\0';
    }
}

char maze_get_next_speedrun_turn(Maze_Solver_t *solver) {
    if (solver->current_step < solver->path_length) {
        return solver->path[solver->current_step++];
    }
    return 'F'; /* Finish / End */
}
`,

  oled_sh1106_c: `/**
 * @file oled_sh1106.c
 * @brief Basic SH1106 I2C OLED Driver (Legacy C / Wire)
 */
#include "oled_sh1106.h"
#include <Wire.h>

void oled_init(void) {
    Wire.begin();
    /* Sends initialization byte sequence to SH1106 */
}

void oled_display_status(const char *mode, int16_t error, const uint16_t *sensors) {
    /* Draws 16 sensor vertical bars and text */
}
`,

  main_c: `/**
 * @file main.c
 * @brief Main Execution Loop (Legacy C Firmware for Robot Maze Solver)
 */
#include "config.h"
#include "motor.h"
#include "qtr16.h"
#include "pid.h"
#include "maze.h"
#include <Arduino.h>

static QTR16_Sensor_t sensor;
static PID_Controller_t pid;
static Maze_Solver_t maze;

void setup() {
    Serial.begin(115200);
    motor_init();
    qtr16_init(&sensor);
    pid_init(&pid, DEFAULT_KP, DEFAULT_KI, DEFAULT_KD);
    maze_init(&maze);

    /* Calibrate sensors by sweeping left and right */
    for (int i = 0; i < 200; i++) {
        qtr16_calibrate_step(&sensor);
        delay(10);
    }
}

void loop() {
    /* Compute centroid */
    int16_t error = qtr16_get_line_centroid(&sensor);

    /* Compute PID output */
    int16_t correction = pid_compute(&pid, error, 0.005f);

    /* Apply differential steering */
    int16_t left = BASE_MOTOR_SPEED + correction;
    int16_t right = BASE_MOTOR_SPEED - correction;
    motor_set_speeds(left, right);

    delay(5); /* Jittery delay in legacy C */
}
`
};
