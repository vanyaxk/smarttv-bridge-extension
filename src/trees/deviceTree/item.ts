import { TizenDevice } from "../../types";
import * as vscode from 'vscode';

export class DeviceTreeItem extends vscode.TreeItem {
    constructor(
      public readonly device: TizenDevice,
      public readonly collapsibleState: vscode.TreeItemCollapsibleState
    ) {
      super(device.name || device.ip || 'Unknown Device', collapsibleState);
      
      // Set description to show connection status
      this.description = device.isConnected ? 'Connected' : 'Disconnected';
      
      // Set tooltip to show device details
      this.tooltip = `${this.label}\nIP: ${device.ip}\nStatus: ${device.isConnected ? 'Connected' : 'Disconnected'}`;
      
      // Set the icon based on connection status
      this.iconPath = new vscode.ThemeIcon(
        device.isConnected ? 'vm-running' : 'vm-outline'
      );
      
      // Set the context value for menu contributions
      this.contextValue = device.isConnected ? 'connectedDevice' : 'disconnectedDevice';
    }
  }
  