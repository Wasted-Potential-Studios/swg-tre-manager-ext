/**
 * Copyright (c) 2024-2026 Wasted Potential Studios LLC
 * Licensed under the MIT License
 *
 * File system utilities
 */

import * as fs from 'fs';
import * as path from 'path';

/**
 * File system utility class
 */
export class FileUtil {
    /**
     * Ensure directory exists, creating it if necessary
     */
    static ensureDirectory(dirPath: string): void {
        if (!fs.existsSync(dirPath)) {
            fs.mkdirSync(dirPath, { recursive: true });
        }
    }

    /**
     * Read binary file into buffer
     */
    static readBinaryFile(filePath: string): Buffer {
        return fs.readFileSync(filePath);
    }

    /**
     * Write binary buffer to file
     */
    static writeBinaryFile(filePath: string, data: Buffer): void {
        // Ensure directory exists
        const dirPath = path.dirname(filePath);
        this.ensureDirectory(dirPath);

        fs.writeFileSync(filePath, data);
    }

    /**
     * Get relative path from base to target
     */
    static getRelativePath(from: string, to: string): string {
        return path.relative(from, to);
    }

    /**
     * Sanitize filename for safe file system operations
     */
    static sanitizeFilename(name: string): string {
        // Replace invalid characters
        return name.replace(/[<>:"|?*]/g, '_')
            .replace(/\\/g, '/'); // Normalize to forward slashes
    }

    /**
     * Get file size in bytes
     */
    static getFileSize(filePath: string): number {
        const stats = fs.statSync(filePath);
        return stats.size;
    }

    /**
     * Check if file exists
     */
    static fileExists(filePath: string): boolean {
        return fs.existsSync(filePath) && fs.statSync(filePath).isFile();
    }

    /**
     * Check if directory exists
     */
    static directoryExists(dirPath: string): boolean {
        return fs.existsSync(dirPath) && fs.statSync(dirPath).isDirectory();
    }

    /**
     * Format file size for display (bytes, KB, MB, GB)
     */
    static formatFileSize(bytes: number): string {
        if (bytes === 0) {
            return '0 B';
        }

        const units = ['B', 'KB', 'MB', 'GB', 'TB'];
        const k = 1024;
        const i = Math.floor(Math.log(bytes) / Math.log(k));

        return (bytes / Math.pow(k, i)).toFixed(2) + ' ' + units[i];
    }

    /**
     * Get all files in directory recursively
     */
    static getAllFiles(dirPath: string, baseDir?: string): string[] {
        const base = baseDir || dirPath;
        const files: string[] = [];

        const items = fs.readdirSync(dirPath);

        for (const item of items) {
            const fullPath = path.join(dirPath, item);
            const stat = fs.statSync(fullPath);

            if (stat.isDirectory()) {
                files.push(...this.getAllFiles(fullPath, base));
            } else {
                const relativePath = path.relative(base, fullPath);
                files.push(relativePath);
            }
        }

        return files;
    }

    /**
     * Create directory structure for a file path
     */
    static createDirectoryStructure(filePath: string): void {
        const dir = path.dirname(filePath);
        this.ensureDirectory(dir);
    }

    /**
     * Get file extension (including dot)
     */
    static getExtension(filePath: string): string {
        return path.extname(filePath).toLowerCase();
    }

    /**
     * Get filename without extension
     */
    static getBasename(filePath: string): string {
        const ext = path.extname(filePath);
        const base = path.basename(filePath);
        return base.substring(0, base.length - ext.length);
    }

    /**
     * Normalize path separators to forward slashes
     */
    static normalizePath(filePath: string): string {
        return filePath.replace(/\\/g, '/');
    }

    /**
     * Delete file if it exists
     */
    static deleteFile(filePath: string): void {
        if (this.fileExists(filePath)) {
            fs.unlinkSync(filePath);
        }
    }

    /**
     * Copy file
     */
    static copyFile(source: string, destination: string): void {
        this.createDirectoryStructure(destination);
        fs.copyFileSync(source, destination);
    }
}
