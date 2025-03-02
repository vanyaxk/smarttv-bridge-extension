import * as vscode from 'vscode';
import { TizenDevice } from '../types';

export class DeviceManager {
    private static instance: DeviceManager;
    private context: vscode.ExtensionContext | undefined;
    private outputChannel: vscode.OutputChannel | undefined;
    private readonly STORAGE_KEY = 'tizenDevices';
    
    // Event emitter for device changes
    private _onDevicesChanged: vscode.EventEmitter<void> = new vscode.EventEmitter<void>();
    public readonly onDevicesChanged: vscode.Event<void> = this._onDevicesChanged.event;

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
     * Fires the devicesChanged event to notify subscribers
     */
    private fireDevicesChanged(): void {
        this._onDevicesChanged.fire();
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
     * 
     * @returns true if the device was added, false if it was updated
     */
    public async addOrUpdateDevice(device: TizenDevice): Promise<boolean> {
        this.ensureInitialized();
        const devices = this.getDevices();
        
        // Check if device already exists
        const index = devices.findIndex(d => d.ip === device.ip);
        
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
        this.outputChannel!.appendLine(`Device ${device.ip} saved to history`);

        // Notify subscribers that the device list has changed
        this.fireDevicesChanged();

        // If the device was added before, return 
        return index < 0;
    }
    
    /**
     * Remove a device from the list
     */
    public async removeDevice(ip: string): Promise<void> {
        this.ensureInitialized();
        const devices = this.getDevices();
        const filteredDevices = devices.filter(d => d.ip !== ip);
        
        if (devices.length !== filteredDevices.length) {
            await this.context!.globalState.update(this.STORAGE_KEY, filteredDevices);
            this.outputChannel!.appendLine(`Device ${ip} removed from history`);
            
            // Notify subscribers that the device list has changed
            this.fireDevicesChanged();
        }
    }
    
    /**
     * Clear all device history
     */
    public async clearDevices(): Promise<void> {
        this.ensureInitialized();
        await this.context!.globalState.update(this.STORAGE_KEY, []);
        this.outputChannel!.appendLine('Device history cleared');
        
        // Notify subscribers that the device list has changed
        this.fireDevicesChanged();
    }
    
    /**
     * Update the friendly name of a device
     */
    public async updateDeviceName(ip: string, name: string): Promise<void> {
        this.ensureInitialized();
        const devices = this.getDevices();
        const device = devices.find(d => d.ip === ip);
        
        if (device) {
            device.name = name;
            await this.context!.globalState.update(this.STORAGE_KEY, devices);
            this.outputChannel!.appendLine(`Updated name for device ${ip} to "${name}"`);
            
            // Notify subscribers that the device list has changed
            this.fireDevicesChanged();
        }
    }
    
    /**
     * Update the connection status of a device
     */
    public async updateConnectionStatus(ip: string, isConnected: boolean): Promise<void> {
        this.ensureInitialized();
        const devices = this.getDevices();
        const device = devices.find(d => d.ip === ip);
        
        if (device) {
            device.isConnected = isConnected;
            if (isConnected) {
                device.lastConnected = new Date().toISOString();
            }
            await this.context!.globalState.update(this.STORAGE_KEY, devices);
            this.outputChannel!.appendLine(`Updated connection status for device ${ip}: ${isConnected ? 'Connected' : 'Disconnected'}`);
            
            // Notify subscribers that the device list has changed
            this.fireDevicesChanged();
        }
    }
    
    /**
     * Dispose the event emitter
     */
    public dispose(): void {
        this._onDevicesChanged.dispose();
    }
}