/**
 * Copyright (c) 2024-2026 Wasted Potential Studios LLC
 * Licensed under the MIT License
 *
 * Tree item model for TRE explorer
 */

import * as vscode from 'vscode';
import * as path from 'path';
import { TREE_ITEM_CONTEXT, KNOWN_EXTENSIONS } from '../constants/TreConstants';
import { TreFile } from '../types/TreTypes';

/**
 * Tree item type
 */
export type TreItemType = 'category' | 'archive' | 'folder' | 'file';

/**
 * Tree item for TRE explorer
 */
export class TreItem extends vscode.TreeItem {
    constructor(
        public readonly label: string,
        public readonly type: TreItemType,
        public readonly collapsibleState: vscode.TreeItemCollapsibleState,
        public readonly treePath?: string,
        public readonly filePath?: string,
        public readonly fileInfo?: TreFile,
        public readonly parent?: TreItem
    ) {
        super(label, collapsibleState);

        this.contextValue = this.getContextValue();
        this.iconPath = this.getIcon();
        this.tooltip = this.getTooltip();
        this.description = this.getDescription();

        // Set resource URI for context menu filtering
        if (fileInfo) {
            this.resourceUri = vscode.Uri.file(fileInfo.name);
        }
    }

    /**
     * Get context value for context menu
     */
    private getContextValue(): string {
        switch (this.type) {
            case 'category':
                return TREE_ITEM_CONTEXT.CATEGORY;
            case 'archive':
                return TREE_ITEM_CONTEXT.ARCHIVE;
            case 'folder':
                return TREE_ITEM_CONTEXT.FOLDER;
            case 'file':
                return TREE_ITEM_CONTEXT.FILE;
        }
    }

    /**
     * Get icon for tree item
     */
    private getIcon(): vscode.ThemeIcon {
        switch (this.type) {
            case 'category':
                return new vscode.ThemeIcon('folder');
            case 'archive':
                return new vscode.ThemeIcon('archive');
            case 'folder':
                return new vscode.ThemeIcon('folder');
            case 'file':
                return this.getFileIcon();
        }
    }

    /**
     * Get icon for file based on extension
     */
    private getFileIcon(): vscode.ThemeIcon {
        if (!this.fileInfo) {
            return new vscode.ThemeIcon('file');
        }

        const ext = path.extname(this.fileInfo.name).toLowerCase();

        switch (ext) {
            case KNOWN_EXTENSIONS.IFF:
                return new vscode.ThemeIcon('file-code');
            case KNOWN_EXTENSIONS.TAB:
                return new vscode.ThemeIcon('table');
            case KNOWN_EXTENSIONS.STF:
                return new vscode.ThemeIcon('symbol-string');
            case KNOWN_EXTENSIONS.LUA:
                return new vscode.ThemeIcon('file-code');
            case KNOWN_EXTENSIONS.DDS:
            case KNOWN_EXTENSIONS.TGA:
                return new vscode.ThemeIcon('file-media');
            case KNOWN_EXTENSIONS.MSH:
            case KNOWN_EXTENSIONS.MGN:
                return new vscode.ThemeIcon('symbol-namespace');
            default:
                return new vscode.ThemeIcon('file');
        }
    }

    /**
     * Get tooltip text
     */
    private getTooltip(): string {
        if (this.type === 'file' && this.fileInfo) {
            const size = this.formatSize(this.fileInfo.size);
            const compressed = this.fileInfo.compressed ? ' (compressed)' : '';
            return `${this.fileInfo.name}\nSize: ${size}${compressed}`;
        }

        if (this.type === 'archive' && this.treePath) {
            return this.treePath;
        }

        return this.label;
    }

    /**
     * Get description (right side text)
     */
    private getDescription(): string | undefined {
        if (this.type === 'file' && this.fileInfo) {
            return this.formatSize(this.fileInfo.size);
        }
        return undefined;
    }

    /**
     * Format file size
     */
    private formatSize(bytes: number): string {
        if (bytes === 0) {
            return '0 B';
        }

        const units = ['B', 'KB', 'MB', 'GB'];
        const k = 1024;
        const i = Math.floor(Math.log(bytes) / Math.log(k));

        return (bytes / Math.pow(k, i)).toFixed(2) + ' ' + units[i];
    }

    /**
     * Get full path in archive
     */
    getFullPath(): string {
        if (this.type === 'file' && this.fileInfo) {
            return this.fileInfo.name;
        }

        if (this.type === 'folder' && this.filePath) {
            return this.filePath;
        }

        return '';
    }
}
