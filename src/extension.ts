import * as vscode from 'vscode';
import { createTizenPackageInstaller } from './commands/createTizenPackageInstaller';
import { createTizenPackageBuilder } from './commands/createTizenPackageBuilder';
import { createTizenCommandRunner } from './commands/createTizenCommandRunner';
import { createTizenDeviceGatherer } from './commands/createTizenDeviceGatherer';
import { createTizenDeviceConnector } from './commands/createTizenDeviceConnector';
import { DeviceManager } from './managers/deviceManager';
import { registerDeviceExplorer } from './trees/deviceTree';
import { registerDetailCommands } from './commands/registerDetailsCommands';

export function activate(context: vscode.ExtensionContext) {
    console.log('Tizen Commander extension is now active');

    // Create output channel for command results
    const outputChannel = vscode.window.createOutputChannel('Tizen Commands');

    DeviceManager.getInstance().initialize(context, outputChannel);

    // Register the main command
    const runTizenCommand = createTizenCommandRunner(outputChannel);

    // Add quick commands for common operations
    const buildPackage = createTizenPackageBuilder(outputChannel);
    const installPackage = createTizenPackageInstaller(outputChannel);
	const devicePackage = createTizenDeviceGatherer(outputChannel);
	const connectPackage = createTizenDeviceConnector(outputChannel);

    // Tree view for connected devices
    registerDeviceExplorer(context, outputChannel);
    registerDetailCommands(context);

    // Add them to subscriptions for proper disposal
    context.subscriptions.push(runTizenCommand, buildPackage, installPackage, devicePackage, connectPackage);
}

export function deactivate() {}