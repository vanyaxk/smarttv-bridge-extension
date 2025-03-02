import * as vscode from 'vscode';

// Special SDB Status TreeItem
export class SdbStatusTreeItem extends vscode.TreeItem {
    constructor(isRunning: boolean | undefined) {
      super('SDB Server', vscode.TreeItemCollapsibleState.None);
      
      if (isRunning === undefined) {
        this.description = 'Checking...';
        this.iconPath = new vscode.ThemeIcon('loading~spin');
      } else if (isRunning) {
        this.description = 'Running';
        this.iconPath = new vscode.ThemeIcon('check', new vscode.ThemeColor('testing.iconPassed'));
      } else {
        this.description = 'Stopped';
        this.iconPath = new vscode.ThemeIcon('error', new vscode.ThemeColor('testing.iconFailed'));
      }
      
      this.contextValue = 'sdbStatusRow';
      this.command = {
        title: '',
        command: 'tizen-commander.restartSdbServer'
      };
    }
  }