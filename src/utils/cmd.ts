import { exec } from 'child_process';
import { promisify } from 'util';
import * as vscode from 'vscode';

export const execAsync = promisify(exec);

export async function runShellCommand(command: string): Promise<string> {
  try {
    const { stdout, stderr } = await execAsync(command);
    if (stderr) {
      console.error(`stderr: ${stderr}`);
    }
    return stdout;
  } catch (error) {
    console.error(`Error executing command: ${error}`);
    if (error) {
        vscode.window.showErrorMessage(`Tizen command failed: ${error}`);
    }
    throw error;
  }
}

export function executeCommandWithChannelOutput(command: string, output: vscode.OutputChannel) {
    output.show(true);
    output.appendLine(`Executing: ${command}`);
    
    return exec(command, (error, stdout, stderr) => {
        if (stdout) {
            output.appendLine(stdout);
        }
        if (stderr) {
            output.appendLine(`Error: ${stderr}`);
        }
        if (error) {
            output.appendLine(`Exit code: ${error.code}`);
            vscode.window.showErrorMessage(`Tizen command failed: ${error.message}`);
        }
    });
}