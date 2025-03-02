import { DeviceInfo } from "../types";
import { runShellCommand } from "./cmd";

export async function getDevices(): Promise<DeviceInfo[]> {
  const devices: DeviceInfo[] = [];
  try {
    // Run the shell command to get connected devices
    const deviceOutput = await runShellCommand("sdb devices");
    const lines = deviceOutput.trim().split('\n');
    
    for (const line of lines) {
      // Each line is expected to have at least three columns.
      // Example line: "192.168.0.192:26101     device          UE43TU7022KXXH"
      const parts = line.trim().split(/\s+/);
      if (parts.length >= 3) {
        // The first column includes IP and port (e.g. "192.168.0.192:26101")
        const ipPort = parts[0];
        const ip = ipPort.split(':')[0];  // Extract IP without the port
        
        // The third column is the model
        const model = parts[2].toUpperCase();
        
        // Determine Tizen version based on model info
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
        
        // Add this device to our array
        devices.push({ ip, model, tizen: tizenVersion });
      }
    }
  } catch (e) {
    console.error("Error detecting devices:", e);
  }
  
  return devices;
}
