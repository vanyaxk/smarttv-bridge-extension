import * as vscode from 'vscode';
import { executeCommandWithChannelOutput } from '../utils/cmd';

export function createTizenCommandRunner (output: vscode.OutputChannel): vscode.Disposable {
    return vscode.commands.registerCommand('tizen-commander.runCommand', async () => {
            const command = await vscode.window.showInputBox({
                placeHolder: 'package -b',
                prompt: 'Enter Tizen command'
            });
            
            if (command) {
                executeCommandWithChannelOutput(`tizen ${command}`, output);
            }
        });
}