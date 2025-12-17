/**
 * Copyright (c) 2024-2026 Wasted Potential Studios LLC
 * Licensed under the MIT License
 *
 * Main extension entry point
 */

import * as vscode from 'vscode';
import { TreExplorerProvider } from './views/TreExplorerProvider';
import { registerCommands } from './commands/CommandRegistry';

/**
 * Extension activation
 */
export function activate(context: vscode.ExtensionContext) {
    console.log('SWG TRE Archive Manager is now active');

    // Create TRE explorer provider
    const treExplorer = new TreExplorerProvider(context);

    // Register tree view
    const treeView = vscode.window.createTreeView('swg-tre-explorer', {
        treeDataProvider: treExplorer,
        showCollapseAll: true
    });

    context.subscriptions.push(treeView);

    // Register all commands
    registerCommands(context, treExplorer, treeView);

    // Handle tree view selection - open files on double-click
    treeView.onDidChangeSelection(e => {
        if (e.selection.length > 0) {
            const item = e.selection[0];
            if (item.type === 'file') {
                vscode.commands.executeCommand('swg-tre-manager.openFile', item);
            }
        }
    });

    // Show welcome message
    vscode.window.showInformationMessage(
        'SWG TRE Archive Manager loaded! Check the Activity Bar for TRE files.'
    );
}

/**
 * Extension deactivation
 */
export function deactivate() {
    console.log('SWG TRE Archive Manager deactivated');
}
