import * as vscode from 'vscode';
import { TizenDevice } from '../types';

export class DeviceManager {
    private static instance: DeviceManager;
    private context: vscode.ExtensionContext | undefined;
    private outputChannel: vscode.OutputChannel | undefined;
    private readonly STORAGE_KEY = 'tizenDevices';

    constructor() {        
    }

    public static getInstance(): DeviceManager {
        if (!DeviceManager.instance) {
            DeviceManager.instance = new DeviceManager();
        }

        return DeviceManager.instance;
    }

    // Initialize with context and output channel
    public initialize(context: vscode.ExtensionContext, outputChannel: vscode.OutputChannel): void {
        this.context = context;
        this.outputChannel = outputChannel;
    }

    private ensureInitialized(): void {
        if (!this.context || !this.outputChannel) {
            throw new Error('DeviceManager not initialized. Call initialize() first.');
        }
    }


    /**
     * Get all stored devices
     */
    public getDevices(): TizenDevice[] {
        this.ensureInitialized();
        return this.context!.globalState.get<TizenDevice[]>(this.STORAGE_KEY, []);
    }
    
    /**
     * Add or update a device in the list
     */
    public async addOrUpdateDevice(device: TizenDevice): Promise<void> {
        this.ensureInitialized();
        const devices = this.getDevices();
        
        // Check if device already exists
        const index = devices.findIndex(d => d.id === device.id);
        
        if (index >= 0) {
            // Update existing device
            devices[index] = {
                ...devices[index],
                ...device,
                lastConnected: new Date().toISOString() // Always update timestamp
            };
        } else {
            // Add new device
            devices.push({
                ...device,
                lastConnected: new Date().toISOString()
            });
        }
        
        // Save to storage
        await this.context!.globalState.update(this.STORAGE_KEY, devices);
        this.outputChannel!.appendLine(`Device ${device.id} saved to history`);
    }
    
    /**
     * Remove a device from the list
     */
    public async removeDevice(deviceId: string): Promise<void> {
        this.ensureInitialized();
        const devices = this.getDevices();
        const filteredDevices = devices.filter(d => d.id !== deviceId);
        
        if (devices.length !== filteredDevices.length) {
            await this.context!.globalState.update(this.STORAGE_KEY, filteredDevices);
            this.outputChannel!.appendLine(`Device ${deviceId} removed from history`);
        }
    }
    
    /**
     * Clear all device history
     */
    public async clearDevices(): Promise<void> {
        this.ensureInitialized();
        await this.context!.globalState.update(this.STORAGE_KEY, []);
        this.outputChannel!.appendLine('Device history cleared');
    }
    
    /**
     * Add device from SDB connection
     */
    public async addDeviceFromConnection(ipAddress: string, modelInfo?: string): Promise<TizenDevice> {
        this.ensureInitialized();
        const device: TizenDevice = {
            id: ipAddress,
            lastConnected: new Date().toISOString()
        };
        
        if (modelInfo) {
            device.model = modelInfo;
            // Detect Tizen version from model if possible
            device.tizenVersion = this.detectTizenVersionFromModel(modelInfo);
        }
        
        await this.addOrUpdateDevice(device);
        return device;
    }
    
    /**
     * Get a specific device by ID
     */
    public getDeviceById(deviceId: string): TizenDevice | undefined {
        this.ensureInitialized();
        const devices = this.getDevices();
        return devices.find(d => d.id === deviceId);
    }
    
    /**
     * Update the friendly name of a device
     */
    public async updateDeviceName(deviceId: string, name: string): Promise<void> {
        this.ensureInitialized();
        const devices = this.getDevices();
        const device = devices.find(d => d.id === deviceId);
        
        if (device) {
            device.name = name;
            await this.context!.globalState.update(this.STORAGE_KEY, devices);
            this.outputChannel!.appendLine(`Updated name for device ${deviceId} to "${name}"`);
        }
    }
    
    /**
     * Detect Tizen version from model number
     */
    private detectTizenVersionFromModel(model: string): string | undefined {
        if (!model) {return undefined;}
        
        const normalizedModel = model.toUpperCase();
        
        if (normalizedModel.includes("CU") || normalizedModel.includes("DU")) {return "7.0";} // 2023-2024
        if (normalizedModel.includes("BU")) {return "6.5";} // 2022
        if (normalizedModel.includes("AU")) {return "6.0";} // 2021
        if (normalizedModel.includes("TU")) {return "5.5";} // 2020
        if (normalizedModel.includes("RU")) {return "5.0";} // 2019
        if (normalizedModel.includes("NU")) {return "4.0";} // 2018
        
        return undefined;
    }
}