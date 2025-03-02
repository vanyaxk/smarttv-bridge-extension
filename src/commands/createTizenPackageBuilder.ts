import * as vscode from 'vscode';
import { executeCommandWithChannelOutput } from '../utils/cmd';

export function createTizenPackageBuilder(output: vscode.OutputChannel): vscode.Disposable {
    return vscode.commands.registerCommand('tizen-commander.buildPackage', () => {
        executeCommandWithChannelOutput('tizen package -b .', output);
    });
}