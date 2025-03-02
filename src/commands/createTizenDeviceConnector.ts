import * as vscode from 'vscode';
import { isSdbServerRunning, startSdbServer } from '../utils/sdb';
import { execAsync } from '../utils/cmd';


export function createTizenDeviceConnector(output: vscode.OutputChannel): vscode.Disposable {
    return vscode.commands.registerCommand('tizen-commander.connectToDevice', async () => {
        output.show(true);
        output.appendLine('Checking SDB server status...');

        const isRunning = await isSdbServerRunning();

        if (!isRunning) {
            output.appendLine('SDB server is not running. Starting server...');
            await startSdbServer();
        } else {
            output.appendLine('SDB server is running');
        }

        const ipAddress = await vscode.window.showInputBox({
            placeHolder: '192.168.0.100:26101',
            title: 'Enter your TV\'s IP address and port (default port is 26101)',
            validateInput: (input) => {
                // Basic validation for IP:PORT format
                if (!/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}(:\d+)?$/.test(input)) {
                    return 'Please enter a valid IP address with optional port';
                }
                return null; // Null means valid
            }
        });

        if (ipAddress) {
            output.appendLine(`Connecting to device at ${ipAddress}...`);
            
            try {
                const { stdout, stderr } = await execAsync(`sdb connect ${ipAddress}`);
                
                if (stdout) {output.appendLine(stdout);}
                if (stderr) {output.appendLine(stderr);}
                
                if (stdout && stdout.includes('connected')) {
                    vscode.window.showInformationMessage(`Successfully connected to ${ipAddress}`);
                    
                    // Refresh the devices list if you have that command
                    try {
                        await vscode.commands.executeCommand('tizen-commander.refreshDevices');
                    } catch (e) {
                        // Command might not exist yet, that's fine
                    }
                } else {
                    vscode.window.showErrorMessage(`Failed to connect to ${ipAddress}`);
                }
            } catch (error) {
                output.appendLine(`Error: ${error}`);
                vscode.window.showErrorMessage(`Connection failed: ${error}`);
            }
        }
    });
}