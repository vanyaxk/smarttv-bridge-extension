import { DeviceInfo } from "../types";
import { runShellCommand } from "./cmd";

export async function getDevices(): Promise<DeviceInfo[]> {
  const devices: DeviceInfo[] = [];
  try {
    // Run the shell command to get connected devices
    const deviceOutput = await runShellCommand("sdb devices");
    const lines = deviceOutput.trim().split('\n');
    
    for (const line of lines) {
      const parts = line.trim().split(/\s+/);
      if (parts.length >= 3) {
        const ipPort = parts[0];
        const ip = ipPort.split(':')[0];
        const model = parts[2].toUpperCase();
        
        let tizenVersion = "unknown";
          if (model.includes("CU") || model.includes("DU")) {
            tizenVersion = "7.0"; // 2023-2024
          } else if (model.includes("BU")) {
            tizenVersion = "6.5"; // 2022
          } else if (model.includes("AU")) {
            tizenVersion = "6.0"; // 2021
          } else if (model.includes("TU")) {
            tizenVersion = "5.5"; // 2020
          } else if (model.includes("RU")) {
            tizenVersion = "5.0"; // 2019
          } else if (model.includes("NU")) {
            tizenVersion = "4.0"; // 2018
          } else if (model.includes("MU") || model.includes("M5")) {
            tizenVersion = "3.0"; // 2017
          } else if (model.includes("KU") || model.includes("KS")) {
            tizenVersion = "2.4"; // 2016
          } else if (model.includes("JU") || model.includes("JS")) {
            tizenVersion = "2.3"; // 2015
          }
        
        const parsedTizenVersion = tizenVersion !== "unknown" ? `Tizen ${tizenVersion}` : tizenVersion;

        devices.push({ ip, model, tizenVersion: parsedTizenVersion });
      }
    }
  } catch (e) {
    console.error("Error detecting devices:", e);
  }
  
  return devices;
}
