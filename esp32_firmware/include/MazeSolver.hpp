/**
 * @file MazeSolver.hpp
 * @brief Autonomous Line Maze Solver Header (LSRB Reduction Engine)
 */

#pragma once

#include "ESP32_Config.hpp"
#include <string>
#include <cstddef>

namespace Robo1 {

enum class MazeMode {
    EXPLORING,
    SPEED_RUN,
    COMPLETED
};

enum class HandPreference {
    LEFT_HAND_RULE,
    RIGHT_HAND_RULE
};

class MazeSolver {
public:
    MazeSolver(HandPreference preference = HandPreference::LEFT_HAND_RULE);

    void reset();
    void setMode(MazeMode mode);
    void setPreference(HandPreference pref) { m_preference = pref; }

    void recordTurn(char turn); // 'L', 'R', 'S', 'B'
    void simplifyPath();

    char getNextSpeedrunTurn();
    bool isSpeedRunComplete() const;

    const std::string& getRecordedPath() const { return m_rawPath; }
    const std::string& getSimplifiedPath() const { return m_simplifiedPath; }
    MazeMode getMode() const { return m_mode; }
    size_t getCurrentStep() const { return m_stepIndex; }

private:
    MazeMode m_mode;
    HandPreference m_preference;
    std::string m_rawPath;
    std::string m_simplifiedPath;
    size_t m_stepIndex;

    bool reduceLastThree();
};

} // namespace Robo1
