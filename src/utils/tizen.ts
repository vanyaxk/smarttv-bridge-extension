import { runShellCommand } from "./cmd";

export function displayTizenCertificates() {
    return runShellCommand('tizen security-profiles list');   
}

export function packageTizenApp({
    type,
    certificate,
    outputPath,
    inputPath = ''
}: {
    type: 'wgt' | 'tpk',
    certificate: string,
    outputPath: string
    inputPath: string
}) {
    return runShellCommand(`tizen package -t ${type} -s ${certificate} -o ${outputPath} -- ${inputPath}`);
}

export async function installTizenApp({
    type,
    packageName,
    inputPath,
}: {
    type: 'wgt' | 'tpk',
    packageName: string,
    inputPath: string
}): Promise<string> {
    const output = await runShellCommand(`tizen install -n ${packageName}.${type} -- ${inputPath}`);

    return output.match(/with debug \d+ port: (\d+)/)?.toString() || '';
}

export function uninstallTizenApp({
    packageId,
}: {
    packageId: string,
}) {
    return runShellCommand(`tizen uninstall -p ${packageId}`);
}

export function launchTizenApp({
    packageId,
}: {
    packageId: string,
}) {
    return runShellCommand(`tizen run -p ${packageId}`);
}