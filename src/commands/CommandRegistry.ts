/**
 * Copyright (c) 2024-2026 Wasted Potential Studios LLC
 * Licensed under the MIT License
 *
 * Command registry for all extension commands
 */

import * as vscode from 'vscode';
import { TreExplorerProvider } from '../views/TreExplorerProvider';
import { TreItem } from '../models/TreItem';
import { TreExtractor } from '../operations/TreExtractor';
import { TreViewerPanel } from '../views/TreViewerPanel';

/**
 * Register all extension commands
 */
export function registerCommands(
    context: vscode.ExtensionContext,
    treExplorer: TreExplorerProvider,
    treeView: vscode.TreeView<TreItem>
): void {

    // Refresh command
    context.subscriptions.push(
        vscode.commands.registerCommand('swg-tre-manager.refresh', () => {
            treExplorer.refresh();
            vscode.window.showInformationMessage('TRE archive list refreshed');
        })
    );

    // Open archive command
    context.subscriptions.push(
        vscode.commands.registerCommand('swg-tre-manager.openArchive', async (item: TreItem) => {
            if (item.type !== 'archive' || !item.treePath) {
                return;
            }

            const archive = treExplorer.getArchive(item.treePath);
            if (!archive) {
                vscode.window.showErrorMessage('Archive not found');
                return;
            }

            TreViewerPanel.createOrShow(context.extensionUri, archive);
        })
    );

    // Extract file command
    context.subscriptions.push(
        vscode.commands.registerCommand('swg-tre-manager.extractFile', async (item: TreItem) => {
            if (item.type !== 'file' || !item.treePath || !item.fileInfo) {
                return;
            }

            const archive = treExplorer.getArchive(item.treePath);
            if (!archive) {
                vscode.window.showErrorMessage('Archive not found');
                return;
            }

            await TreExtractor.extractWithDialog(archive, [item.fileInfo]);
        })
    );

    // Extract folder command
    context.subscriptions.push(
        vscode.commands.registerCommand('swg-tre-manager.extractFolder', async (item: TreItem) => {
            if (item.type !== 'folder' || !item.treePath || !item.filePath) {
                return;
            }

            const archive = treExplorer.getArchive(item.treePath);
            if (!archive) {
                vscode.window.showErrorMessage('Archive not found');
                return;
            }

            const prefix = item.filePath + '/';
            const files = archive.files.filter(file => file.name.startsWith(prefix));

            await TreExtractor.extractWithDialog(archive, files);
        })
    );

    // Extract all command
    context.subscriptions.push(
        vscode.commands.registerCommand('swg-tre-manager.extractAll', async (item: TreItem) => {
            if (item.type !== 'archive' || !item.treePath) {
                return;
            }

            const archive = treExplorer.getArchive(item.treePath);
            if (!archive) {
                vscode.window.showErrorMessage('Archive not found');
                return;
            }

            const confirm = await vscode.window.showWarningMessage(
                `Extract all ${archive.files.length} files from ${archive.path}?`,
                'Extract',
                'Cancel'
            );

            if (confirm === 'Extract') {
                await TreExtractor.extractWithDialog(archive, archive.files);
            }
        })
    );

    // Validate archive command
    context.subscriptions.push(
        vscode.commands.registerCommand('swg-tre-manager.validateArchive', async (item: TreItem) => {
            if (item.type !== 'archive' || !item.treePath) {
                return;
            }

            await vscode.window.showInformationMessage('Archive validation not yet implemented');
        })
    );

    // Compare archive command
    context.subscriptions.push(
        vscode.commands.registerCommand('swg-tre-manager.compareArchive', async (item: TreItem) => {
            if (item.type !== 'archive' || !item.treePath) {
                return;
            }

            await vscode.window.showInformationMessage('Archive comparison not yet implemented');
        })
    );

    // Show properties command
    context.subscriptions.push(
        vscode.commands.registerCommand('swg-tre-manager.showProperties', async (item: TreItem) => {
            if (item.type !== 'archive' || !item.treePath) {
                return;
            }

            const archive = treExplorer.getArchive(item.treePath);
            if (!archive) {
                vscode.window.showErrorMessage('Archive not found');
                return;
            }

            TreViewerPanel.createOrShow(context.extensionUri, archive);
        })
    );

    // Build archive command
    context.subscriptions.push(
        vscode.commands.registerCommand('swg-tre-manager.buildArchive', async () => {
            await vscode.window.showInformationMessage('Build archive not yet implemented');
        })
    );

    // Convert version command
    context.subscriptions.push(
        vscode.commands.registerCommand('swg-tre-manager.convertVersion', async (item: TreItem) => {
            if (item.type !== 'archive' || !item.treePath) {
                return;
            }

            await vscode.window.showInformationMessage('Version conversion not yet implemented');
        })
    );

    // Open in IFF Editor command
    context.subscriptions.push(
        vscode.commands.registerCommand('swg-tre-manager.openInIffEditor', async (item: TreItem) => {
            if (item.type !== 'file' || !item.treePath || !item.fileInfo) {
                return;
            }

            await openInEditor(item, 'WastedPotentialStudios.swg-iff-editor');
        })
    );

    // Open in DataTable Editor command
    context.subscriptions.push(
        vscode.commands.registerCommand('swg-tre-manager.openInDataTableEditor', async (item: TreItem) => {
            if (item.type !== 'file' || !item.treePath || !item.fileInfo) {
                return;
            }

            await openInEditor(item, 'WastedPotentialStudios.swg-datatable-editor');
        })
    );

    // Open in STF Editor command
    context.subscriptions.push(
        vscode.commands.registerCommand('swg-tre-manager.openInStfEditor', async (item: TreItem) => {
            if (item.type !== 'file' || !item.treePath || !item.fileInfo) {
                return;
            }

            await openInEditor(item, 'WastedPotentialStudios.swg-stf-editor');
        })
    );

    // Search archives command
    context.subscriptions.push(
        vscode.commands.registerCommand('swg-tre-manager.searchArchives', async () => {
            const searchTerm = await vscode.window.showInputBox({
                prompt: 'Enter filename to search for',
                placeHolder: 'e.g., *.iff or object/tangible/*'
            });

            if (!searchTerm) {
                return;
            }

            await vscode.window.showInformationMessage('Search not yet implemented');
        })
    );
}

/**
 * Open file in external editor
 */
async function openInEditor(item: TreItem, extensionId: string): Promise<void> {
    // Check if extension is installed
    const extension = vscode.extensions.getExtension(extensionId);

    if (!extension) {
        const extensionName = extensionId.split('.').pop();
        const install = await vscode.window.showWarningMessage(
            `${extensionName} extension is not installed. Would you like to install it?`,
            'Install',
            'Cancel'
        );

        if (install === 'Install') {
            await vscode.commands.executeCommand('workbench.extensions.search', extensionId);
        }
        return;
    }

    // Extract file to temp location
    const tempDir = await vscode.workspace.getConfiguration('swg-tre-manager').get<string>('tempDirectory') || '';

    await vscode.window.showInformationMessage(
        `Opening ${item.fileInfo?.name} in ${extensionId} (not yet fully implemented)`
    );
}
