export interface DeviceInfo {
    ip: string;
    model: string;
    tizen: string;
  }

export interface TizenDevice {
    id: string;        
    name?: string;     
    model?: string;    
    tizenVersion?: string;
    lastConnected: string;
}