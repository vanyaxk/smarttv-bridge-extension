import { generateRandomDeviceName } from "./generateDeviceName";
import * as vscode from 'vscode';

export async function showVSCodeNamePrompt() {
    const randomName = generateRandomDeviceName();
                            const deviceName = await vscode.window.showInputBox({
                                    placeHolder: randomName,
                                    title: 'Enter a name for this device (press Enter to use suggested name)',
                                    prompt: 'A friendly name helps you identify this device later'
                });

    return deviceName || randomName;
}