import JSZip from 'jszip';
import { ESP_CPP_CODEBASE } from '../data/espCppCodebase';
import { TargetBoard, TargetFramework } from '../types/codebase';

export async function exportEsp32ProjectZip(
  board: TargetBoard = 'esp32_wroom',
  framework: TargetFramework = 'arduino_esp32'
): Promise<Blob> {
  const zip = new JSZip();

  const folderName = 'Robo1_ESP32_Firmware';
  const root = zip.folder(folderName) || zip;

  // 1. Include directory
  const include = root.folder('include');
  if (include) {
    include.file('ESP32_Config.hpp', ESP_CPP_CODEBASE.config_hpp);
    include.file('MotorController.hpp', ESP_CPP_CODEBASE.motor_hpp);
    include.file('QTRSensors16.hpp', ESP_CPP_CODEBASE.qtr16_hpp);
    include.file('PIDController.hpp', ESP_CPP_CODEBASE.pid_hpp);
    include.file('MazeSolver.hpp', ESP_CPP_CODEBASE.maze_hpp);
    include.file('DisplayManager.hpp', ESP_CPP_CODEBASE.display_hpp);
  }

  // 2. Src directory
  const src = root.folder('src');
  if (src) {
    src.file('main.cpp', ESP_CPP_CODEBASE.main_cpp);
    src.file('MotorController.cpp', ESP_CPP_CODEBASE.motor_cpp);
    src.file('QTRSensors16.cpp', ESP_CPP_CODEBASE.qtr16_cpp);
    src.file('PIDController.cpp', ESP_CPP_CODEBASE.pid_cpp);
    src.file('MazeSolver.cpp', ESP_CPP_CODEBASE.maze_cpp);
  }

  // 3. PlatformIO config
  let boardIni = 'esp32dev';
  if (board === 'esp32_s3') boardIni = 'esp32-s3-devkitc-1';
  if (board === 'esp32_c3') boardIni = 'esp32-c3-devkitm-1';

  const platformioIni = `; PlatformIO Project Configuration for Robo1 ESP32
[env:${boardIni}]
platform = espressif32 @ ^6.5.0
board = ${boardIni}
framework = arduino
monitor_speed = 115200
upload_speed = 921600

build_flags = 
    -D CORE_DEBUG_LEVEL=2
    -O3
    -std=gnu++17

lib_deps = 
    adafruit/Adafruit SH110X @ ^2.1.10
    adafruit/Adafruit GFX Library @ ^1.11.9
    Wire
`;

  root.file('platformio.ini', platformioIni);

  // 4. Arduino IDE direct sketch version
  root.file('Robo1_ESP32.ino', ESP_CPP_CODEBASE.main_cpp);

  // 5. Documentation
  root.file('README.md', ESP_CPP_CODEBASE.readme_md);

  return await zip.generateAsync({ type: 'blob' });
}
