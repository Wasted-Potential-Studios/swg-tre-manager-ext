/**
 * Copyright (c) 2024-2026 Wasted Potential Studios LLC
 * Licensed under the MIT License
 *
 * TRE Explorer tree data provider for Activity Bar
 */

import * as vscode from 'vscode';
import * as path from 'path';
import { TreItem } from '../models/TreItem';
import { TreParser } from '../parsers/TreParser';
import { TreArchive } from '../types/TreTypes';
import { ARCHIVE_CATEGORIES } from '../constants/TreConstants';
import { FileUtil } from '../utils/FileUtil';

/**
 * TRE Explorer provider
 */
export class TreExplorerProvider implements vscode.TreeDataProvider<TreItem> {
    private _onDidChangeTreeData: vscode.EventEmitter<TreItem | undefined | null | void> = new vscode.EventEmitter<TreItem | undefined | null | void>();
    readonly onDidChangeTreeData: vscode.Event<TreItem | undefined | null | void> = this._onDidChangeTreeData.event;

    private archives: Map<string, TreArchive> = new Map();
    private treeCache: Map<string, TreItem[]> = new Map();

    constructor(private context: vscode.ExtensionContext) {
        this.scanWorkspace();
    }

    /**
     * Refresh the tree view
     */
    refresh(): void {
        this.archives.clear();
        this.treeCache.clear();
        this.scanWorkspace();
        this._onDidChangeTreeData.fire();
    }

    /**
     * Get tree item
     */
    getTreeItem(element: TreItem): vscode.TreeItem {
        return element;
    }

    /**
     * Get children of a tree item
     */
    async getChildren(element?: TreItem): Promise<TreItem[]> {
        if (!element) {
            // Root level - return categories
            return this.getRootItems();
        }

        if (element.type === 'category') {
            // Return archives in category - use contextValue which has the category name without count
            return this.getArchivesInCategory(element.contextValue || element.label);
        }

        if (element.type === 'archive') {
            // Return root folders/files in archive
            return this.getArchiveContents(element.treePath!);
        }

        if (element.type === 'folder') {
            // Return contents of folder
            return this.getFolderContents(element);
        }

        return [];
    }

    /**
     * Get root level items (categories)
     */
    private getRootItems(): TreItem[] {
        const categories = [
            ARCHIVE_CATEGORIES.CLIENT_DATA,
            ARCHIVE_CATEGORIES.PATCHES,
            ARCHIVE_CATEGORIES.CUSTOM_CONTENT,
            ARCHIVE_CATEGORIES.SERVER_FILES
        ];

        return categories.map(category => {
            const count = this.getArchiveCountInCategory(category);
            const label = count > 0 ? `${category} (${count})` : category;

            const item = new TreItem(
                label,
                'category',
                vscode.TreeItemCollapsibleState.Expanded
            );

            // Store the actual category name (without count) for matching
            item.contextValue = category;

            return item;
        });
    }

    /**
     * Get archives in a category
     */
    private getArchivesInCategory(category: string): TreItem[] {
        const items: TreItem[] = [];

        for (const [archivePath, archive] of this.archives) {
            if (this.getCategoryForArchive(archivePath) === category) {
                const config = vscode.workspace.getConfiguration('swg-tre-manager');
                const showFileCount = config.get<boolean>('showFileCount', true);
                const showFileSize = config.get<boolean>('showFileSize', true);

                let description = '';
                if (showFileCount) {
                    description += `${archive.files.length} files`;
                }
                if (showFileSize) {
                    if (description) {
                        description += ', ';
                    }
                    description += FileUtil.formatFileSize(archive.totalSize);
                }

                const item = new TreItem(
                    path.basename(archivePath),
                    'archive',
                    vscode.TreeItemCollapsibleState.Collapsed,
                    archivePath
                );

                item.description = description;
                item.tooltip = `${archivePath}\n${archive.files.length} files\nTotal size: ${FileUtil.formatFileSize(archive.totalSize)}\nVersion: ${archive.version}`;

                items.push(item);
            }
        }

        return items.sort((a, b) => a.label.localeCompare(b.label));
    }

    /**
     * Get archive contents (root level)
     */
    private getArchiveContents(archivePath: string): TreItem[] {
        const cacheKey = `archive:${archivePath}`;
        if (this.treeCache.has(cacheKey)) {
            return this.treeCache.get(cacheKey)!;
        }

        const archive = this.archives.get(archivePath);
        if (!archive) {
            return [];
        }

        // Build folder structure
        const structure = this.buildFolderStructure(archive.files);
        const items = this.structureToTreeItems(structure, archivePath, '');

        this.treeCache.set(cacheKey, items);
        return items;
    }

    /**
     * Get folder contents
     */
    private getFolderContents(folderItem: TreItem): TreItem[] {
        const cacheKey = `folder:${folderItem.treePath}:${folderItem.filePath}`;
        if (this.treeCache.has(cacheKey)) {
            return this.treeCache.get(cacheKey)!;
        }

        const archive = this.archives.get(folderItem.treePath!);
        if (!archive) {
            return [];
        }

        const folderPath = folderItem.filePath!;
        const prefix = folderPath + '/';

        // Get files in this folder
        const filesInFolder = archive.files.filter(file => {
            if (!file.name.startsWith(prefix)) {
                return false;
            }

            const remainder = file.name.substring(prefix.length);
            return !remainder.includes('/'); // Only direct children
        });

        // Get subfolders
        const subfolders = new Set<string>();
        for (const file of archive.files) {
            if (file.name.startsWith(prefix)) {
                const remainder = file.name.substring(prefix.length);
                const slashIndex = remainder.indexOf('/');
                if (slashIndex !== -1) {
                    subfolders.add(remainder.substring(0, slashIndex));
                }
            }
        }

        const items: TreItem[] = [];

        // Add subfolders
        for (const subfolder of Array.from(subfolders).sort()) {
            items.push(new TreItem(
                subfolder,
                'folder',
                vscode.TreeItemCollapsibleState.Collapsed,
                folderItem.treePath,
                prefix + subfolder,
                undefined,
                folderItem
            ));
        }

        // Add files
        for (const file of filesInFolder.sort((a, b) => a.name.localeCompare(b.name))) {
            const filename = path.basename(file.name);
            items.push(new TreItem(
                filename,
                'file',
                vscode.TreeItemCollapsibleState.None,
                folderItem.treePath,
                file.name,
                file,
                folderItem
            ));
        }

        this.treeCache.set(cacheKey, items);
        return items;
    }

    /**
     * Build folder structure from file list
     */
    private buildFolderStructure(files: any[]): Map<string, any[]> {
        const structure = new Map<string, any[]>();

        for (const file of files) {
            const parts = file.name.split('/');
            const folder = parts.length > 1 ? parts[0] : '';

            if (!structure.has(folder)) {
                structure.set(folder, []);
            }

            structure.get(folder)!.push(file);
        }

        return structure;
    }

    /**
     * Convert structure to tree items
     */
    private structureToTreeItems(structure: Map<string, any[]>, archivePath: string, parentPath: string): TreItem[] {
        const items: TreItem[] = [];
        const folders = new Set<string>();
        const rootFiles: any[] = [];

        for (const [folder, files] of structure) {
            if (folder === '') {
                rootFiles.push(...files);
            } else {
                folders.add(folder);
            }
        }

        // Add folders
        for (const folder of Array.from(folders).sort()) {
            items.push(new TreItem(
                folder,
                'folder',
                vscode.TreeItemCollapsibleState.Collapsed,
                archivePath,
                parentPath ? `${parentPath}/${folder}` : folder
            ));
        }

        // Add root files
        for (const file of rootFiles.sort((a, b) => a.name.localeCompare(b.name))) {
            const filename = path.basename(file.name);
            items.push(new TreItem(
                filename,
                'file',
                vscode.TreeItemCollapsibleState.None,
                archivePath,
                file.name,
                file
            ));
        }

        return items;
    }

    /**
     * Get category for archive based on filename patterns
     * Works with any workspace structure - categorizes by TRE naming conventions
     * Default: All user-created TRE files go to 'Custom Content' - no file is left behind!
     */
    private getCategoryForArchive(archivePath: string): string {
        const filename = path.basename(archivePath).toLowerCase();

        // Official SOE client data files (data_*.tre)
        if (filename.startsWith('data_')) {
            return ARCHIVE_CATEGORIES.CLIENT_DATA;
        }

        // Official SOE patches (patch_*.tre, hotfix_*.tre, default_patch.tre)
        if (filename.startsWith('patch_') ||
            filename.startsWith('hotfix_') ||
            filename === 'default_patch.tre') {
            return ARCHIVE_CATEGORIES.PATCHES;
        }

        // Server-specific files (bottom.tre is the main server TRE)
        if (filename === 'bottom.tre' ||
            archivePath.toLowerCase().includes('/serverdata/') ||
            archivePath.toLowerCase().includes('\\serverdata\\') ||
            archivePath.toLowerCase().includes('/server-data/') ||
            archivePath.toLowerCase().includes('\\server-data\\')) {
            return ARCHIVE_CATEGORIES.SERVER_FILES;
        }

        // Everything else is custom content (mods, user-created, community servers, etc.)
        // This includes: beginnings_*.tre, legends_*.tre, myserver_*.tre, mymod.tre, anything!
        return ARCHIVE_CATEGORIES.CUSTOM_CONTENT;
    }

    /**
     * Get archive count in category
     */
    private getArchiveCountInCategory(category: string): number {
        let count = 0;
        for (const archivePath of this.archives.keys()) {
            if (this.getCategoryForArchive(archivePath) === category) {
                count++;
            }
        }
        return count;
    }

    /**
     * Scan workspace for TRE files
     */
    private async scanWorkspace(): Promise<void> {
        const config = vscode.workspace.getConfiguration('swg-tre-manager');
        const autoDetect = config.get<boolean>('autoDetectTreFiles', true);

        if (!autoDetect) {
            console.log('SWG TRE Manager: Auto-detect disabled');
            return;
        }

        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders) {
            console.log('SWG TRE Manager: No workspace folders found');
            return;
        }

        console.log('SWG TRE Manager: Scanning for TRE files...');

        try {
            // Get user-configurable settings
            const excludePatterns = config.get<string[]>('excludePatterns', ['**/node_modules/**', '**/backup/**', '**/.git/**']);
            const maxFiles = config.get<number>('maxFilesToScan', 5000);

            // Build exclude pattern (combine all patterns with comma)
            const excludePattern = excludePatterns.length > 0 ? `{${excludePatterns.join(',')}}` : '**/node_modules/**';

            // Search for .tre files
            const files = await vscode.workspace.findFiles('**/*.tre', excludePattern, maxFiles);
            console.log(`SWG TRE Manager: Found ${files.length} TRE file(s)`);

            let successCount = 0;
            let failCount = 0;

            for (const file of files) {
                try {
                    console.log(`SWG TRE Manager: Parsing ${file.fsPath}...`);
                    const archive = TreParser.parseFile(file.fsPath);
                    this.archives.set(file.fsPath, archive);
                    successCount++;
                    console.log(`SWG TRE Manager: Successfully parsed ${file.fsPath} (${archive.files.length} files)`);
                } catch (error) {
                    failCount++;
                    const errorMsg = error instanceof Error ? error.message : String(error);
                    console.error(`SWG TRE Manager: Failed to parse TRE file ${file.fsPath}:`, errorMsg);

                    // Show notification for first few failures
                    if (failCount <= 3) {
                        vscode.window.showWarningMessage(
                            `Failed to parse ${file.fsPath.split(/[/\\]/).pop()}: ${errorMsg}`
                        );
                    }
                }
            }

            console.log(`SWG TRE Manager: Scan complete. Success: ${successCount}, Failed: ${failCount}`);

            // Notify tree view to refresh after scan completes
            this._onDidChangeTreeData.fire();

            if (successCount > 0) {
                vscode.window.showInformationMessage(
                    `SWG TRE Manager: Found ${successCount} TRE archive(s)${failCount > 0 ? ` (${failCount} failed to parse)` : ''}`
                );
            } else if (files.length > 0) {
                vscode.window.showWarningMessage(
                    `SWG TRE Manager: Found ${files.length} .tre file(s) but none could be parsed. Check the output console for errors.`
                );
            } else {
                console.log('SWG TRE Manager: No .tre files found in workspace');
            }
        } catch (error) {
            const errorMsg = error instanceof Error ? error.message : String(error);
            console.error('SWG TRE Manager: Error during workspace scan:', errorMsg);
            vscode.window.showErrorMessage(`SWG TRE Manager: Scan failed - ${errorMsg}`);
        }
    }

    /**
     * Get archive by path
     */
    getArchive(archivePath: string): TreArchive | undefined {
        return this.archives.get(archivePath);
    }

    /**
     * Get all archives
     */
    getAllArchives(): Map<string, TreArchive> {
        return this.archives;
    }
}
