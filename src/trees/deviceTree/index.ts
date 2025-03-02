import * as vscode from 'vscode';
import { DeviceManager } from '../../managers/deviceManager';
import { TizenDevice } from '../../types';
import { connectSdbDevice, disconnectSdbDevice, isSdbServerRunning, startSdbServer } from '../../utils/sdb';
import { showVSCodeNamePrompt } from '../../utils/showVSCodeNamePrompt';
import { DeviceTreeItem } from './item';
import { DeviceDetailTreeItem } from './detail';
import { SdbStatusTreeItem } from '../sdbStatusPanel';

// Define a device tree data provider
export class DeviceTreeDataProvider implements vscode.TreeDataProvider<vscode.TreeItem> {
  private _onDidChangeTreeData: vscode.EventEmitter<vscode.TreeItem | undefined | null | void> = 
    new vscode.EventEmitter<vscode.TreeItem | undefined | null | void>();
  
  readonly onDidChangeTreeData: vscode.Event<vscode.TreeItem | undefined | null | void> = 
    this._onDidChangeTreeData.event;

  // SDB server status variables
  private sdbStatus: boolean | undefined = undefined;
  private checkInterval: NodeJS.Timeout | undefined;

  constructor(
    private deviceManager: DeviceManager,
    private outputChannel: vscode.OutputChannel
  ) {
    // Listen for device updates from the device manager
    this.deviceManager.onDevicesChanged(() => {
      this.refresh();
    });

    // Start checking SDB status
    this.startSdbStatusChecks();

    // register sdb command
    vscode.commands.registerCommand('tizen-commander.restartSdbServer', () => {
      this.restartSdbServer();
    });
  }

  private startSdbStatusChecks(): void {
    // Check immediately
    this.checkSdbStatus();
    
    // Then start interval
    this.checkInterval = setInterval(() => {
      this.checkSdbStatus();
    }, 10000); // Check every 10 seconds
  }

  private async checkSdbStatus(): Promise<void> {
    try {
      this.sdbStatus = await isSdbServerRunning();
      this.refresh();
    } catch (error) {
      this.outputChannel.appendLine(`Error checking SDB server status: ${error}`);
      this.sdbStatus = false;
      this.refresh();
    }
  }

  private async restartSdbServer(): Promise<void> {
    try {
      this.outputChannel.appendLine('Restarting SDB server...');
      this.sdbStatus = undefined; // Show as "Checking..." while restarting
      this.refresh();

      await startSdbServer();
      await this.checkSdbStatus();
      
      this.outputChannel.appendLine('SDB server restarted successfully');
    } catch (error) {
      this.outputChannel.appendLine(`Error restarting SDB server: ${error}`);
      vscode.window.showErrorMessage(`Failed to restart SDB server: ${error}`);
      this.sdbStatus = false;
      this.refresh();
    }
  }

  refresh(): void {
    this._onDidChangeTreeData.fire();
  }

  getTreeItem(element: vscode.TreeItem): vscode.TreeItem {
    return element;
  }

  getChildren(element?: vscode.TreeItem): Thenable<vscode.TreeItem[]> {
    if (!element) {
      // Root level - return SDB status items and all devices
      const items: vscode.TreeItem[] = [];
      
      // Add SDB status item
      items.push(new SdbStatusTreeItem(this.sdbStatus));
      
      // Add all devices
      const devices = this.deviceManager.getDevices();
      if (devices.length > 0) {
        devices.forEach(device => {
          items.push(new DeviceTreeItem(
            device,
            vscode.TreeItemCollapsibleState.Collapsed
          ));
        });
      } else {
        // Show placeholder if no devices
        const noDevicesItem = new vscode.TreeItem('No devices found', vscode.TreeItemCollapsibleState.None);
        noDevicesItem.contextValue = 'noDevices';
        items.push(noDevicesItem);
      }
      
      return Promise.resolve(items);
    } else if (element instanceof DeviceTreeItem) {
      // Device level - return device details
      const device = element.device;
      
      // Create detail items
      const details: DeviceDetailTreeItem[] = [];
      
      // Connection status
      details.push(new DeviceDetailTreeItem(
        'Status',
        device.isConnected ? 'Connected' : 'Disconnected',
        device
      ));
      
      // IP Address
      details.push(new DeviceDetailTreeItem(
        'IP Address',
        device.ip || 'Unknown',
        device
      ));
      
      // Model information
      details.push(new DeviceDetailTreeItem(
        'Model',
        device.model,
        device
      ));
      
      details.push(new DeviceDetailTreeItem(
        'OS Version',
        device.tizenVersion || 'unknown',
        device
      ));
      
      // Last connected timestamp
      const lastConnected = new Date(device.lastConnected || 0);
      details.push(new DeviceDetailTreeItem(
        'Last Connected',
        lastConnected.toLocaleString(),
        device
      ));
      
      return Promise.resolve(details);
    }
    
    return Promise.resolve([]);
  }

  dispose() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
    }
  }
}

// Register the tree view
export function registerDeviceExplorer(context: vscode.ExtensionContext, outputChannel: vscode.OutputChannel): vscode.Disposable {
  const deviceManager = DeviceManager.getInstance();
  const deviceTreeDataProvider = new DeviceTreeDataProvider(deviceManager, outputChannel);
  
  // Register the tree view with the provider
  const treeView = vscode.window.createTreeView('tizenDevices', {
    treeDataProvider: deviceTreeDataProvider,
    showCollapseAll: true
  });
  
  // Create a command to refresh the tree
  const refreshCommand = vscode.commands.registerCommand('tizen-commander.refreshDevices', () => {
    deviceTreeDataProvider.refresh();
  });
  
  // Register commands for interacting with devices
  const connectCommand = vscode.commands.registerCommand('tizen-commander.connectToDeviceFromTree', async (item: DeviceTreeItem) => {
    if (item.device && item.device.ip) {
      await vscode.window.withProgress(
        {
          location: vscode.ProgressLocation.Notification,
          title: `Connecting... to ${item.device.name}`,
          cancellable: false,
        },
        async () => {
          try {
            // Connect to the device
            await connectSdbDevice(item.device.ip);
            
            // Update the connection status
            await deviceManager.updateConnectionStatus(item.device.ip, true);
            
            // Show success message
            vscode.window.showInformationMessage(`Connected to ${item.device.name || item.device.ip}`);
          } catch (error) {
            // Show error message
            vscode.window.showErrorMessage(`Failed to connect to ${item.device.ip}: ${error}`);
          }
        }
      );
    }
  });

  const removeDeviceCommand = vscode.commands.registerCommand('tizen-commander.removeDeviceFromTree', async (item: DeviceTreeItem) => {
    if (item.device && item.device.ip) {
      await vscode.window.withProgress(
        {
          location: vscode.ProgressLocation.Notification,
          title: `Removing... ${item.device.name}`,
          cancellable: false,
        },
        async () => {
          try {
            // remove device from global state
            await deviceManager.removeDevice(item.device.ip);
          } catch (error) {
            // Show error message
            vscode.window.showErrorMessage(`Failed to remove ${item.device.ip}: ${error}`);
          }
        }
      );
    }
  });
  
  const disconnectCommand = vscode.commands.registerCommand('tizen-commander.disconnectDeviceFromTree', (item: DeviceTreeItem) => {
    if (item.device && item.device.ip) {
      disconnectSdbDevice(item.device.ip);
      deviceManager.updateConnectionStatus(item.device.ip, false);
    }
  });
  
  const renameCommand = vscode.commands.registerCommand('tizen-commander.renameDeviceFromTree', async (item: DeviceTreeItem) => {
    if (item.device && item.device.ip) {
      const newName = await showVSCodeNamePrompt();
      
      if (newName !== undefined) {
        // Update name in device manager
        await deviceManager.updateDeviceName(item.device.ip, newName);
      }
    }
  });
  
  context.subscriptions.push(
    treeView, 
    refreshCommand, 
    connectCommand, 
    disconnectCommand, 
    renameCommand,
    removeDeviceCommand,
    { dispose: () => deviceTreeDataProvider.dispose() }
  );
  
  return treeView;
}