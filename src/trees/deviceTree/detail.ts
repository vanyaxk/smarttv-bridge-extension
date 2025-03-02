import * as vscode from 'vscode';
import { TizenDevice } from '../../types';

// Define tree item for device details
export class DeviceDetailTreeItem extends vscode.TreeItem {
  constructor(
    public readonly label: string,
    public readonly value: string,
    public readonly device: TizenDevice
  ) {
    super(label, vscode.TreeItemCollapsibleState.None);
    
    // Show the value in the description
    this.description = value;
    
    // Create a context value that includes the property name
    this.contextValue = `deviceDetail-${label.toLowerCase().replace(/\s+/g, '')}`;
  }
}