/**
 * Copyright (c) 2024-2026 Wasted Potential Studios LLC
 * Licensed under the MIT License
 *
 * TRE file extraction operations
 */

import * as vscode from 'vscode';
import * as path from 'path';
import * as os from 'os';
import * as fs from 'fs';
import { TreParser } from '../parsers/TreParser';
import { TreArchive, TreFile, ExtractionOptions, ProgressCallback } from '../types/TreTypes';
import { FileUtil } from '../utils/FileUtil';
import { DEFAULT_EXTRACTION_OPTIONS } from '../constants/TreConstants';

/**
 * TRE extraction class
 */
export class TreExtractor {
    /**
     * Extract a single file to temp directory for viewing
     */
    static async extractToTemp(
        archive: TreArchive,
        file: TreFile
    ): Promise<string> {
        const data = TreParser.extractFile(archive.path, file);

        // Create temp directory for TRE files
        const tempDir = path.join(os.tmpdir(), 'swg-tre-manager');
        if (!fs.existsSync(tempDir)) {
            fs.mkdirSync(tempDir, { recursive: true });
        }

        // Use just the file basename to avoid path issues
        const fileName = path.basename(file.name);
        const tempPath = path.join(tempDir, fileName);

        FileUtil.writeBinaryFile(tempPath, data);

        return tempPath;
    }

    /**
     * Extract a single file
     */
    static async extractFile(
        archive: TreArchive,
        file: TreFile,
        destinationDir: string,
        preserveStructure: boolean = true
    ): Promise<string> {
        const data = TreParser.extractFile(archive.path, file);

        let outputPath: string;
        if (preserveStructure) {
            outputPath = path.join(destinationDir, file.name);
        } else {
            outputPath = path.join(destinationDir, path.basename(file.name));
        }

        FileUtil.writeBinaryFile(outputPath, data);

        return outputPath;
    }

    /**
     * Extract multiple files
     */
    static async extractFiles(
        archive: TreArchive,
        files: TreFile[],
        destinationDir: string,
        options: Partial<ExtractionOptions> = {},
        progressCallback?: ProgressCallback
    ): Promise<string[]> {
        const opts = { ...DEFAULT_EXTRACTION_OPTIONS, ...options, destination: destinationDir };
        const extractedPaths: string[] = [];

        let current = 0;
        const total = files.length;

        for (const file of files) {
            current++;

            if (progressCallback) {
                progressCallback(current, total, `Extracting ${file.name}...`);
            }

            // Check if file exists and overwrite option
            const outputPath = opts.preserveStructure
                ? path.join(destinationDir, file.name)
                : path.join(destinationDir, path.basename(file.name));

            if (FileUtil.fileExists(outputPath) && !opts.overwrite) {
                // Skip file
                continue;
            }

            try {
                const extracted = await this.extractFile(archive, file, destinationDir, opts.preserveStructure);
                extractedPaths.push(extracted);
            } catch (error) {
                console.error(`Failed to extract ${file.name}:`, error);
            }
        }

        return extractedPaths;
    }

    /**
     * Extract all files from archive
     */
    static async extractAll(
        archive: TreArchive,
        destinationDir: string,
        progressCallback?: ProgressCallback
    ): Promise<string[]> {
        return this.extractFiles(archive, archive.files, destinationDir, { preserveStructure: true }, progressCallback);
    }

    /**
     * Extract folder (all files in a directory)
     */
    static async extractFolder(
        archive: TreArchive,
        folderPath: string,
        destinationDir: string,
        progressCallback?: ProgressCallback
    ): Promise<string[]> {
        const prefix = folderPath + '/';
        const filesInFolder = archive.files.filter(file => file.name.startsWith(prefix));

        return this.extractFiles(archive, filesInFolder, destinationDir, { preserveStructure: true }, progressCallback);
    }

    /**
     * Extract with user-friendly UI
     */
    static async extractWithProgress(
        archive: TreArchive,
        files: TreFile[],
        destinationDir: string
    ): Promise<void> {
        await vscode.window.withProgress(
            {
                location: vscode.ProgressLocation.Notification,
                title: 'Extracting files from TRE archive',
                cancellable: true
            },
            async (progress, token) => {
                const total = files.length;
                let current = 0;

                for (const file of files) {
                    if (token.isCancellationRequested) {
                        break;
                    }

                    current++;
                    const percentage = (current / total) * 100;

                    progress.report({
                        message: `${current}/${total}: ${path.basename(file.name)}`,
                        increment: 100 / total
                    });

                    try {
                        await this.extractFile(archive, file, destinationDir);
                    } catch (error) {
                        console.error(`Failed to extract ${file.name}:`, error);
                    }
                }

                vscode.window.showInformationMessage(
                    `Successfully extracted ${current} file(s) to ${destinationDir}`
                );
            }
        );
    }

    /**
     * Prompt user for destination and extract
     */
    static async extractWithDialog(
        archive: TreArchive,
        files: TreFile[]
    ): Promise<void> {
        const config = vscode.workspace.getConfiguration('swg-tre-manager');
        const defaultPath = config.get<string>('defaultExtractionPath', '');

        const options: vscode.OpenDialogOptions = {
            canSelectMany: false,
            canSelectFiles: false,
            canSelectFolders: true,
            openLabel: 'Select Destination',
            title: 'Select extraction destination'
        };

        if (defaultPath) {
            options.defaultUri = vscode.Uri.file(defaultPath);
        }

        const result = await vscode.window.showOpenDialog(options);

        if (!result || result.length === 0) {
            return; // User cancelled
        }

        const destinationDir = result[0].fsPath;

        await this.extractWithProgress(archive, files, destinationDir);
    }
}
