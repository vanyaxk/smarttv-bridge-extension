import * as vscode from 'vscode';
import { executeCommandWithChannelOutput } from '../utils/cmd';

export function createTizenPackageInstaller (output: vscode.OutputChannel): vscode.Disposable {
    return vscode.commands.registerCommand('tizen-commander.installPackage', async () => {
        const wkspFolder = vscode.workspace.workspaceFolders?.[0].uri.fsPath;
        if (!wkspFolder) {
            vscode.window.showErrorMessage('No workspace folder open');
            return;
        }
        
        // Find .wgt files
        const files = await vscode.workspace.findFiles('**/*.wgt', '**/node_modules/**');
        if (files.length === 0) {
            vscode.window.showErrorMessage('No .wgt package found');
            return;
        }
        
        // Get the latest one by modified time
        const latestFile = files[0];
        const packagePath = latestFile.fsPath;
        
        executeCommandWithChannelOutput(`tizen install -n "${packagePath}"`, output);
    });
}