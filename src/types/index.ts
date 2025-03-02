export interface DeviceInfo {
    ip: string;
    model: string;
    tizenVersion: string;
  }

export interface TizenDevice extends DeviceInfo {
    name?: string;     
    lastConnected?: string;
    isConnected?: boolean;
}