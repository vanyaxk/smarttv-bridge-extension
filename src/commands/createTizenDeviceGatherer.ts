import { executeCommandWithChannelOutput } from "../utils/cmd";
import * as vscode from 'vscode';
import { getDevices } from "../utils/getDevices";

export function createTizenDeviceGatherer(output: vscode.OutputChannel): vscode.Disposable {
    return vscode.commands.registerCommand('tizen-commander.gatherDevices', async () => {
        const devices = await getDevices();

        return devices;
    });
}