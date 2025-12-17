/**
 * Copyright (c) 2024-2026 Wasted Potential Studios LLC
 * Licensed under the MIT License
 *
 * URI handling utilities for tre:// scheme
 */

import * as vscode from 'vscode';
import * as path from 'path';

/**
 * URI utility class for tre:// scheme
 */
export class UriUtil {
    private static readonly SCHEME = 'tre';

    /**
     * Create a tre:// URI for a file in an archive
     * @param archivePath Path to the TRE archive file
     * @param filePath Path of file within archive
     */
    static createTreUri(archivePath: string, filePath: string): vscode.Uri {
        // Encode the archive path and file path
        const encodedArchive = encodeURIComponent(archivePath);
        const encodedFile = filePath.split('/').map(encodeURIComponent).join('/');

        // Format: tre://archive-path/file-path
        return vscode.Uri.parse(`${this.SCHEME}://${encodedArchive}/${encodedFile}`);
    }

    /**
     * Parse a tre:// URI to extract archive and file paths
     */
    static parseTreUri(uri: vscode.Uri): { archivePath: string; filePath: string } {
        if (uri.scheme !== this.SCHEME) {
            throw new Error(`Invalid URI scheme: ${uri.scheme} (expected ${this.SCHEME})`);
        }

        // Extract authority (archive path) and path (file path)
        const archivePath = decodeURIComponent(uri.authority);
        const filePath = uri.path.startsWith('/') ? uri.path.substring(1) : uri.path;

        return {
            archivePath,
            filePath: decodeURIComponent(filePath)
        };
    }

    /**
     * Check if URI is a tre:// URI
     */
    static isTreUri(uri: vscode.Uri): boolean {
        return uri.scheme === this.SCHEME;
    }

    /**
     * Get display path for a tre:// URI
     */
    static getDisplayPath(uri: vscode.Uri): string {
        if (!this.isTreUri(uri)) {
            return uri.fsPath;
        }

        const { archivePath, filePath } = this.parseTreUri(uri);
        const archiveName = path.basename(archivePath);

        return `${archiveName}/${filePath}`;
    }

    /**
     * Get parent directory URI for a tre:// URI
     */
    static getParentUri(uri: vscode.Uri): vscode.Uri | null {
        const { archivePath, filePath } = this.parseTreUri(uri);

        const parentPath = path.dirname(filePath);
        if (parentPath === '.' || parentPath === '/') {
            return null; // Root of archive
        }

        return this.createTreUri(archivePath, parentPath);
    }

    /**
     * Join paths in a tre:// URI
     */
    static joinPath(baseUri: vscode.Uri, ...pathSegments: string[]): vscode.Uri {
        const { archivePath, filePath } = this.parseTreUri(baseUri);
        const newPath = path.posix.join(filePath, ...pathSegments);

        return this.createTreUri(archivePath, newPath);
    }
}
