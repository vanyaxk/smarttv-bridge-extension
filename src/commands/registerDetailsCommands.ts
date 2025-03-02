import * as vscode from 'vscode';
import { DeviceDetailTreeItem } from '../trees/deviceTree/detail';

/**
 * Register detail-specific commands for the device tree view
 */
export function registerDetailCommands(context: vscode.ExtensionContext): void {
  const copyValueCommand = vscode.commands.registerCommand('tizen-commander.copyDeviceDetailValue', async ({value}: 
    {value: string}
  ) => {
    await vscode.env.clipboard.writeText(value);
    vscode.window.showInformationMessage(`Copied: ${value}`);
  });

  // IP Address-specific commands
  const connectToIPCommand = vscode.commands.registerCommand('tizen-commander.connectToDetailIP', (item: DeviceDetailTreeItem) => {
    if (item.label === 'IP Address' && item.value) {
      vscode.commands.executeCommand('tizen-commander.connectToDevice', item.value);
    }
  });

  // Model-specific commands
  const searchModelCommand = vscode.commands.registerCommand('tizen-commander.searchModel', (item: DeviceDetailTreeItem) => {
    if (item.label === 'Model' && item.value) {
      vscode.env.openExternal(vscode.Uri.parse(`https://www.google.com/search?q=Samsung+${encodeURIComponent(item.value)}`));
    }
  });

  // Status-specific commands
  const refreshStatusCommand = vscode.commands.registerCommand('tizen-commander.refreshDeviceStatus', (item: DeviceDetailTreeItem) => {
    if (item.label === 'Status' && item.device && item.device.ip) {
      // You would need to implement a command to check device status
      vscode.commands.executeCommand('tizen-commander.checkDeviceStatus', item.device.ip);
    }
  });

  // Add these commands to your context
  context.subscriptions.push(
    connectToIPCommand,
    searchModelCommand,
    refreshStatusCommand,
    copyValueCommand,
  );
}