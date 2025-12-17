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
import { TreBuilderPanel } from '../views/TreBuilderPanel';
import { TreBuilder } from '../operations/TreBuilder';
import { BuildOptions } from '../types/TreTypes';

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
        vscode.commands.registerCommand('swg-tre-manager.openArchive', async (item: TreItem | vscode.Uri) => {
            let treePath: string;

            // Handle being called from File Explorer context menu
            if (item instanceof vscode.Uri) {
                treePath = item.fsPath;
            } else if (item.type !== 'archive' || !item.treePath) {
                return;
            } else {
                treePath = item.treePath;
            }

            let archive = treExplorer.getArchive(treePath);

            // If archive not in cache, try to parse it
            if (!archive) {
                try {
                    const { TreParser } = await import('../parsers/TreParser');
                    archive = TreParser.parseFile(treePath);
                } catch (error) {
                    vscode.window.showErrorMessage(`Failed to open archive: ${error}`);
                    return;
                }
            }

            if (!archive) {
                vscode.window.showErrorMessage('Archive not found');
                return;
            }

            TreViewerPanel.createOrShow(context.extensionUri, archive);
        })
    );

    // Open file command - extract to temp and open in editor
    context.subscriptions.push(
        vscode.commands.registerCommand('swg-tre-manager.openFile', async (item: TreItem) => {
            if (item.type !== 'file' || !item.treePath || !item.fileInfo) {
                return;
            }

            const archive = treExplorer.getArchive(item.treePath);
            if (!archive) {
                vscode.window.showErrorMessage('Archive not found');
                return;
            }

            try {
                const tempPath = await TreExtractor.extractToTemp(archive, item.fileInfo);
                const doc = await vscode.workspace.openTextDocument(tempPath);
                await vscode.window.showTextDocument(doc);
            } catch (error) {
                vscode.window.showErrorMessage(`Failed to open file: ${error}`);
            }
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
        vscode.commands.registerCommand('swg-tre-manager.extractAll', async (item: TreItem | vscode.Uri) => {
            let treePath: string;

            // Handle being called from File Explorer context menu
            if (item instanceof vscode.Uri) {
                treePath = item.fsPath;
            } else if (item.type !== 'archive' || !item.treePath) {
                return;
            } else {
                treePath = item.treePath;
            }

            let archive = treExplorer.getArchive(treePath);

            // If archive not in cache, try to parse it
            if (!archive) {
                try {
                    const { TreParser } = await import('../parsers/TreParser');
                    archive = TreParser.parseFile(treePath);
                } catch (error) {
                    vscode.window.showErrorMessage(`Failed to open archive: ${error}`);
                    return;
                }
            }

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
        vscode.commands.registerCommand('swg-tre-manager.validateArchive', async (item: TreItem | vscode.Uri) => {
            let treePath: string;

            // Handle being called from File Explorer context menu
            if (item instanceof vscode.Uri) {
                treePath = item.fsPath;
            } else if (item.type !== 'archive' || !item.treePath) {
                return;
            } else {
                treePath = item.treePath;
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
        vscode.commands.registerCommand('swg-tre-manager.showProperties', async (item: TreItem | vscode.Uri) => {
            let treePath: string;

            // Handle being called from File Explorer context menu
            if (item instanceof vscode.Uri) {
                treePath = item.fsPath;
            } else if (item.type !== 'archive' || !item.treePath) {
                return;
            } else {
                treePath = item.treePath;
            }

            let archive = treExplorer.getArchive(treePath);

            // If archive not in cache, try to parse it
            if (!archive) {
                try {
                    const { TreParser } = await import('../parsers/TreParser');
                    archive = TreParser.parseFile(treePath);
                } catch (error) {
                    vscode.window.showErrorMessage(`Failed to open archive: ${error}`);
                    return;
                }
            }

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
            // Select source folder
            const sourceFolderUri = await vscode.window.showOpenDialog({
                canSelectFiles: false,
                canSelectFolders: true,
                canSelectMany: false,
                openLabel: 'Select Source Folder',
                title: 'Select folder to create TRE archive from'
            });

            if (!sourceFolderUri || sourceFolderUri.length === 0) {
                return;
            }

            // Get output location
            const outputUri = await vscode.window.showSaveDialog({
                saveLabel: 'Create TRE Archive',
                filters: {
                    'TRE Archives': ['tre']
                },
                title: 'Save TRE Archive As'
            });

            if (!outputUri) {
                return;
            }

            // Select TRE version
            const version = await vscode.window.showQuickPick(
                [
                    { label: '0005', description: 'TRE version 0005 (recommended, supports MD5)', detail: 'Use this for modern SWG servers' },
                    { label: '0004', description: 'TRE version 0004 (legacy)', detail: 'Use this for compatibility with older tools' }
                ],
                {
                    placeHolder: 'Select TRE version',
                    title: 'TRE Archive Version'
                }
            );

            if (!version) {
                return;
            }

            // Select compression
            const compress = await vscode.window.showQuickPick(
                [
                    { label: 'Yes', description: 'Compress files (smaller size, slower)', picked: true },
                    { label: 'No', description: 'No compression (larger size, faster)' }
                ],
                {
                    placeHolder: 'Enable compression?',
                    title: 'TRE Archive Compression'
                }
            );

            if (!compress) {
                return;
            }

            // Build the archive
            try {
                const options: BuildOptions = {
                    version: version.label as '0004' | '0005',
                    compressionLevel: compress.label === 'Yes' ? 9 : 0,
                    compressToc: compress.label === 'Yes',
                    compressNames: compress.label === 'Yes',
                    includeMd5: version.label === '0005'
                };

                await TreBuilder.buildWithDialog(sourceFolderUri[0].fsPath, outputUri.fsPath, options);

                // Refresh the tree to show the new archive if it's in the workspace
                treExplorer.refresh();
            } catch (error) {
                vscode.window.showErrorMessage(`Failed to build TRE archive: ${error}`);
            }
        })
    );

    // Convert version command
    context.subscriptions.push(
        vscode.commands.registerCommand('swg-tre-manager.convertVersion', async (item: TreItem | vscode.Uri) => {
            let treePath: string;

            // Handle being called from File Explorer context menu
            if (item instanceof vscode.Uri) {
                treePath = item.fsPath;
            } else if (item.type !== 'archive' || !item.treePath) {
                return;
            } else {
                treePath = item.treePath;
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

    // Builder Template command
    context.subscriptions.push(
        vscode.commands.registerCommand('swg-tre-manager.builderTemplate', () => {
            TreBuilderPanel.createOrShow(context.extensionUri);
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
