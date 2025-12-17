import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { TreParser } from '../parsers/TreParser';
import { TreBuilder } from './TreBuilder';
import { BuildOptions } from '../types/TreTypes';

/**
 * TRE Archive Converter
 * Convert between TRE versions 0004 and 0005
 */
export class TreConverter {
    /**
     * Convert a TRE archive to a different version
     */
    public static async convert(
        sourcePath: string,
        targetPath: string,
        targetVersion: '0004' | '0005',
        progress?: vscode.Progress<{ message?: string; increment?: number }>
    ): Promise<void> {
        progress?.report({ message: 'Reading source archive...', increment: 10 });

        // Parse source archive
        const sourceArchive = TreParser.parseFile(sourcePath);
        const sourceVersion = sourceArchive.version;

        // Check if conversion is necessary
        if (sourceVersion === targetVersion) {
            throw new Error(`Archive is already version ${targetVersion}`);
        }

        progress?.report({ message: `Converting from ${sourceVersion} to ${targetVersion}...`, increment: 10 });

        // Extract all files to temp directory
        const tempDir = path.join(path.dirname(targetPath), `.tre_convert_${Date.now()}`);
        fs.mkdirSync(tempDir, { recursive: true });

        try {
            progress?.report({ message: 'Extracting files...', increment: 20 });

            // Extract all files
            for (let i = 0; i < sourceArchive.files.length; i++) {
                const file = sourceArchive.files[i];
                const data = TreParser.extractFile(sourcePath, file);

                // Create directory structure
                const filePath = path.join(tempDir, file.name);
                const dir = path.dirname(filePath);
                if (!fs.existsSync(dir)) {
                    fs.mkdirSync(dir, { recursive: true });
                }

                // Write file
                fs.writeFileSync(filePath, data);

                progress?.report({
                    message: `Extracting ${file.name}...`,
                    increment: 40 / sourceArchive.files.length
                });
            }

            progress?.report({ message: 'Building new archive...', increment: 10 });

            // Build new archive with target version
            const buildOptions: BuildOptions = {
                version: targetVersion,
                compressionLevel: 9,
                compressToc: true,
                compressNames: true,
                includeMd5: targetVersion === '0005'
            };

            await TreBuilder.buildArchive(tempDir, targetPath, buildOptions, progress);

            progress?.report({ message: 'Conversion complete!', increment: 10 });

        } finally {
            // Cleanup temp directory
            if (fs.existsSync(tempDir)) {
                this.deleteFolderRecursive(tempDir);
            }
        }
    }

    /**
     * Convert with progress dialog
     */
    public static async convertWithDialog(sourcePath: string, targetPath: string, targetVersion: '0004' | '0005'): Promise<void> {
        await vscode.window.withProgress(
            {
                location: vscode.ProgressLocation.Notification,
                title: `Converting TRE Archive to ${targetVersion}`,
                cancellable: false
            },
            async (progress) => {
                await this.convert(sourcePath, targetPath, targetVersion, progress);
            }
        );

        vscode.window.showInformationMessage(`Archive converted: ${path.basename(targetPath)}`);
    }

    /**
     * Show conversion dialog
     */
    public static async showConversionDialog(sourcePath: string): Promise<void> {
        // Parse archive to get current version
        const archive = TreParser.parseFile(sourcePath);
        const currentVersion = archive.version;

        // Determine target version
        const targetVersion = currentVersion === '0004' ? '0005' : '0004';

        // Confirm with user
        const result = await vscode.window.showWarningMessage(
            `Convert archive from version ${currentVersion} to ${targetVersion}?`,
            { modal: true, detail: 'This will create a new archive file.' },
            'Convert'
        );

        if (result !== 'Convert') {
            return;
        }

        // Get output path
        const defaultPath = sourcePath.replace(/\.tre$/, `_${targetVersion}.tre`);
        const outputFile = await vscode.window.showSaveDialog({
            defaultUri: vscode.Uri.file(defaultPath),
            filters: { 'TRE Archives': ['tre'] },
            title: 'Save Converted Archive'
        });

        if (!outputFile) {
            return;
        }

        await this.convertWithDialog(sourcePath, outputFile.fsPath, targetVersion);
    }

    /**
     * Delete folder recursively
     */
    private static deleteFolderRecursive(folderPath: string): void {
        if (fs.existsSync(folderPath)) {
            fs.readdirSync(folderPath).forEach((file) => {
                const curPath = path.join(folderPath, file);
                if (fs.lstatSync(curPath).isDirectory()) {
                    this.deleteFolderRecursive(curPath);
                } else {
                    fs.unlinkSync(curPath);
                }
            });
            fs.rmdirSync(folderPath);
        }
    }
}
