
import * as cp from 'child_process';
import { promisify } from 'util';
import { runShellCommand } from './cmd';

const execAsync = promisify(cp.exec);

/**
 * Checks if SDB server is running without starting it
 */
export async function isSdbServerRunning(): Promise<boolean> {
  // Approach: Create a temporary file to capture output, then check process list
  // This avoids accidentally starting the server
  
  try {
    let cmd = '';
    if (process.platform === 'win32') {
      // Windows
      cmd = 'tasklist /FI "IMAGENAME eq sdb.exe" /FO CSV';
    } else {
      // macOS or Linux
      cmd = 'ps aux | grep "[s]db fork-server"';
    }
    
    const { stdout } = await execAsync(cmd);
    
    if (process.platform === 'win32') {
      // On Windows, if sdb.exe is in the task list
      return stdout.includes('sdb.exe');
    } else {
      // On macOS/Linux, if we found the sdb process
      return stdout.trim().length > 0;
    }
  } catch (error) {
    // If command failed, assume server is not running
    return false;
  }
}

export async function startSdbServer(): Promise<unknown> {
  return runShellCommand('sdb start-server');
}

export async function stopSdbServer(): Promise<unknown> {
  return runShellCommand('sdb kill-server');
}

export async function restartSdbServer(): Promise<unknown> {
  await stopSdbServer();
  return startSdbServer();
}

export async function connectSdbDevice(ip: string): Promise<unknown> {
  return runShellCommand(`sdb connect ${ip}`);
}

export async function disconnectSdbDevice(ip: string): Promise<unknown> {
  return runShellCommand(`sdb disconnect ${ip}`);
}

export async function runAppWithDebug({
  packageName,
  packageId,
  addZero
}: {
  packageName: string,
  packageId: string,
  addZero: boolean
}) {
  return runShellCommand(`sdb shell 0 debug ${packageId}.${packageName} ${addZero ? '0' : ''}`);
}

export async function forwardSdbPort({
  devicePort,
  localPort
}: {
  devicePort: number,
  localPort: number
}): Promise<string> {
  return runShellCommand(`sdb forward tcp:${devicePort} tcp:${localPort}`);
}