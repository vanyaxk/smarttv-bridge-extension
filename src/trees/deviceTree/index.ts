import * as vscode from 'vscode';
import { DeviceManager } from '../../managers/deviceManager';
import { TizenDevice } from '../../types';
import { connectSdbDevice, disconnectSdbDevice } from '../../utils/sdb';
import { showVSCodeNamePrompt } from '../../utils/showVSCodeNamePrompt';
import { DeviceTreeItem } from './item';
import { DeviceDetailTreeItem } from './detail';
// Define tree item types for our hierarchy

// Define a device tree data provider
export class DeviceTreeDataProvider implements vscode.TreeDataProvider<DeviceTreeItem | DeviceDetailTreeItem> {
  private _onDidChangeTreeData: vscode.EventEmitter<DeviceTreeItem | DeviceDetailTreeItem | undefined | null | void> = 
    new vscode.EventEmitter<DeviceTreeItem | DeviceDetailTreeItem | undefined | null | void>();
  
  readonly onDidChangeTreeData: vscode.Event<DeviceTreeItem | DeviceDetailTreeItem | undefined | null | void> = 
    this._onDidChangeTreeData.event;

  constructor(private deviceManager: DeviceManager) {
    // Listen for device updates from the device manager
    this.deviceManager.onDevicesChanged(() => {
      this.refresh();
    });
  }

  refresh(): void {
    this._onDidChangeTreeData.fire();
  }

  getTreeItem(element: DeviceTreeItem | DeviceDetailTreeItem): vscode.TreeItem {
    return element;
  }

  getChildren(element?: DeviceTreeItem | DeviceDetailTreeItem): Thenable<(DeviceTreeItem | DeviceDetailTreeItem)[]> {
    if (!element) {
      // Root level - return all devices
      const devices = this.deviceManager.getDevices();
      return Promise.resolve(
        devices.map(device => new DeviceTreeItem(
          device,
          vscode.TreeItemCollapsibleState.Collapsed
        ))
      );
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
}

// Register the tree view
export function registerDeviceExplorer(context: vscode.ExtensionContext): vscode.Disposable {
  const deviceManager = DeviceManager.getInstance();
  const deviceTreeDataProvider = new DeviceTreeDataProvider(deviceManager);
  
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
    renameCommand
  );
  
  return treeView;
}