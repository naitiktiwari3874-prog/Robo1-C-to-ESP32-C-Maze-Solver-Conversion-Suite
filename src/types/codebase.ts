export type TargetBoard = 'esp32_wroom' | 'esp32_s3' | 'esp32_c3';
export type TargetFramework = 'arduino_esp32' | 'esp_idf';
export type SensorType = 'qtr16_mux' | 'qtr16_gpio' | 'qtr8_analog';

export interface CodeModule {
  id: string;
  name: string;
  cFileName: string;
  cppFileName: string;
  category: 'config' | 'motor' | 'sensors' | 'pid' | 'maze' | 'display' | 'main' | 'build';
  description: string;
  cCode: string;
  cppCodeArduino: string;
  cppCodeIdf: string;
  keyChanges: string[];
  esp32Advantages: string[];
}

export interface PinMapping {
  functionName: string;
  description: string;
  originalCPin: string;
  esp32Pin: number;
  safeForBoot: boolean;
  notes: string;
}
