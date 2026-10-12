/**
 * @file MazeSolver.cpp
 * @brief Autonomous Line Maze Solver Implementation
 * Canonical Reduction Rules:
 *   LBL -> S
 *   LBS -> R
 *   RBL -> B
 *   SBL -> R
 *   SBS -> B
 *   LBR -> B
 */

#include "MazeSolver.hpp"

namespace Robo1 {

MazeSolver::MazeSolver(HandPreference preference)
    : m_mode(MazeMode::EXPLORING)
    , m_preference(preference)
    , m_stepIndex(0) {
    reset();
}

void MazeSolver::reset() {
    m_rawPath.clear();
    m_simplifiedPath.clear();
    m_stepIndex = 0;
    m_mode = MazeMode::EXPLORING;
}

void MazeSolver::setMode(MazeMode mode) {
    m_mode = mode;
    if (mode == MazeMode::SPEED_RUN) {
        m_stepIndex = 0;
    }
}

void MazeSolver::recordTurn(char turn) {
    m_rawPath.push_back(turn);
    m_simplifiedPath.push_back(turn);
    simplifyPath();
}

bool MazeSolver::reduceLastThree() {
    size_t len = m_simplifiedPath.size();
    if (len < 3) return false;

    // Check if middle turn was a U-turn (Dead End)
    if (m_simplifiedPath[len - 2] != 'B') return false;

    char first = m_simplifiedPath[len - 3];
    char second = 'B';
    char third = m_simplifiedPath[len - 1];
    char replacement = 0;

    // Standard LSRB Reduction Matrix
    if (first == 'L' && second == 'B' && third == 'L') replacement = 'S';
    else if (first == 'L' && second == 'B' && third == 'S') replacement = 'R';
    else if (first == 'R' && second == 'B' && third == 'L') replacement = 'B';
    else if (first == 'S' && second == 'B' && third == 'L') replacement = 'R';
    else if (first == 'S' && second == 'B' && third == 'S') replacement = 'B';
    else if (first == 'L' && second == 'B' && third == 'R') replacement = 'B';

    if (replacement != 0) {
        m_simplifiedPath.erase(len - 3, 3);
        m_simplifiedPath.push_back(replacement);
        return true;
    }

    return false;
}

void MazeSolver::simplifyPath() {
    while (reduceLastThree()) {
        // Continue reducing for nested dead-end loops
    }
}

char MazeSolver::getNextSpeedrunTurn() {
    if (m_stepIndex < m_simplifiedPath.size()) {
        return m_simplifiedPath[m_stepIndex++];
    }
    m_mode = MazeMode::COMPLETED;
    return 'F'; // Finished
}

bool MazeSolver::isSpeedRunComplete() const {
    return (m_stepIndex >= m_simplifiedPath.size());
}

} // namespace Robo1
