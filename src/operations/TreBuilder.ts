import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { TreFile, TreHeader, TocEntry, BuildOptions } from '../types/TreTypes';
import { CompressionUtil } from '../utils/CompressionUtil';
import { Crc32Util } from '../utils/Crc32Util';
import { FileUtil } from '../utils/FileUtil';
import * as crypto from 'crypto';

/**
 * TRE Archive Builder
 * Creates new TRE archives from directories
 */
export class TreBuilder {
    /**
     * Build a TRE archive from a directory
     */
    public static async buildArchive(
        sourceDir: string,
        outputPath: string,
        options: BuildOptions,
        progress?: vscode.Progress<{ message?: string; increment?: number }>
    ): Promise<void> {
        // Validate inputs
        if (!fs.existsSync(sourceDir)) {
            throw new Error(`Source directory does not exist: ${sourceDir}`);
        }

        if (!fs.statSync(sourceDir).isDirectory()) {
            throw new Error(`Source path is not a directory: ${sourceDir}`);
        }

        // Collect all files
        progress?.report({ message: 'Scanning files...', increment: 5 });
        const files = await this.collectFiles(sourceDir, sourceDir);

        if (files.length === 0) {
            throw new Error('No files found in source directory');
        }

        progress?.report({ message: `Found ${files.length} files`, increment: 5 });

        // Build TOC entries
        const tocEntries: TocEntry[] = [];
        const fileData: Buffer[] = [];
        let currentOffset = 0;

        for (let i = 0; i < files.length; i++) {
            progress?.report({
                message: `Processing ${path.basename(files[i])} (${i + 1}/${files.length})`,
                increment: 70 / files.length
            });

            const relativePath = path.relative(sourceDir, files[i]).replace(/\\/g, '/');
            const crc = Crc32Util.calculateForPath(relativePath);

            let data = fs.readFileSync(files[i]);
            const uncompressedSize = data.length;
            let compressionLevel = 0;

            // Apply compression if enabled
            if (options.compressionLevel > 0) {
                const compressed = CompressionUtil.compress(data, options.compressionLevel);
                if (compressed.length < data.length * 0.9) { // Only use if > 10% savings
                    data = compressed as any;
                    compressionLevel = options.compressionLevel;
                }
            }

            tocEntries.push({
                crc: crc,
                length: uncompressedSize,
                offset: currentOffset,
                compressor: compressionLevel,
                compressedLength: data.length,
                nameOffset: 0 // Will be calculated later
            });

            fileData.push(data);
            currentOffset += data.length;
        }

        progress?.report({ message: 'Building archive structure...', increment: 5 });

        // Build name block
        const relativePaths = files.map(f => path.relative(sourceDir, f).replace(/\\/g, '/'));
        const nameBlock = this.buildNameBlock(tocEntries, relativePaths);

        // Compress TOC if requested
        let tocData = this.buildTocData(tocEntries);
        let tocCompression = 0;
        if (options.compressToc) {
            const compressed = CompressionUtil.compress(tocData, 9);
            if (compressed.length < tocData.length * 0.9) {
                tocData = compressed;
                tocCompression = 2; // zlib
            }
        }

        // Compress name block if requested
        let finalNameBlock = nameBlock;
        let nameCompression = 0;
        if (options.compressNames) {
            const compressed = CompressionUtil.compress(nameBlock, 9);
            if (compressed.length < nameBlock.length * 0.9) {
                finalNameBlock = compressed;
                nameCompression = 2; // zlib
            }
        }

        // Calculate MD5 block for version 0005
        let md5Block = Buffer.alloc(0) as any;
        if (options.version === '0005') {
            md5Block = this.buildMd5Block(fileData) as any;
        }

        // Build header
        const versionNum = options.version === '0005' ? 0x30303035 : 0x30303034;
        const header: TreHeader = {
            token: 0x54524545, // 'TREE'
            format: 'EERT',
            version: versionNum,
            numberOfFiles: files.length,
            fileCount: files.length,
            tocOffset: 0, // Will be updated
            tocCompressor: tocCompression,
            tocCompression: tocCompression,
            sizeOfTOC: tocData.length,
            tocUncompressedSize: this.buildTocData(tocEntries).length,
            blockCompressor: nameCompression,
            nameCompression: nameCompression,
            nameBlockOffset: 0, // Will be updated
            sizeOfNameBlock: finalNameBlock.length,
            nameBlockUncompressedSize: nameBlock.length,
            uncompSizeOfNameBlock: nameBlock.length
        };

        // Calculate offsets
        const headerSize = 36;
        const dataBlockSize = fileData.reduce((sum, buf) => sum + buf.length, 0);
        header.tocOffset = headerSize + dataBlockSize;
        header.nameBlockOffset = header.tocOffset + tocData.length;

        progress?.report({ message: 'Writing archive...', increment: 10 });

        // Write the archive
        const output = fs.createWriteStream(outputPath);

        // Write header
        this.writeHeader(output, header);

        // Write file data
        for (const data of fileData) {
            output.write(data);
        }

        // Write TOC
        output.write(tocData);

        // Write name block
        output.write(finalNameBlock);

        // Write MD5 block if version 0005
        if (md5Block.length > 0) {
            output.write(md5Block);
        }

        output.end();

        await new Promise<void>((resolve, reject) => {
            output.on('finish', resolve);
            output.on('error', reject);
        });

        progress?.report({ message: 'Archive created successfully!', increment: 5 });
    }

    /**
     * Collect all files recursively from a directory
     */
    private static async collectFiles(dir: string, baseDir: string): Promise<string[]> {
        const results: string[] = [];
        const entries = fs.readdirSync(dir, { withFileTypes: true });

        for (const entry of entries) {
            const fullPath = path.join(dir, entry.name);

            if (entry.isDirectory()) {
                results.push(...await this.collectFiles(fullPath, baseDir));
            } else if (entry.isFile()) {
                results.push(fullPath);
            }
        }

        return results.sort(); // Alphabetical order
    }

    /**
     * Build the name block buffer
     */
    private static buildNameBlock(entries: TocEntry[], files: string[]): Buffer {
        const names = files.join('\0') + '\0';

        // Calculate name offsets
        let offset = 0;
        for (let i = 0; i < files.length; i++) {
            entries[i].nameOffset = offset;
            offset += files[i].length + 1; // +1 for null terminator
        }

        return Buffer.from(names, 'utf8');
    }

    /**
     * Build the TOC data buffer
     */
    private static buildTocData(entries: TocEntry[]): Buffer {
        const buffer = Buffer.alloc(entries.length * 24);
        let offset = 0;

        for (const entry of entries) {
            buffer.writeUInt32LE(entry.crc, offset);
            buffer.writeInt32LE(entry.length, offset + 4);
            buffer.writeInt32LE(entry.offset, offset + 8);
            buffer.writeInt32LE(entry.compressor, offset + 12);
            buffer.writeInt32LE(entry.compressedLength, offset + 16);
            buffer.writeInt32LE(entry.nameOffset, offset + 20);
            offset += 24;
        }

        return buffer;
    }

    /**
     * Build the MD5 block for version 0005
     */
    private static buildMd5Block(fileData: Buffer[]): Buffer {
        const buffer = Buffer.alloc(fileData.length * 16) as any;
        let offset = 0;

        for (const data of fileData) {
            const hash = crypto.createHash('md5').update(data).digest();
            hash.copy(buffer, offset);
            offset += 16;
        }

        return buffer;
    }

    /**
     * Write the header to the output stream
     */
    private static writeHeader(stream: fs.WriteStream, header: TreHeader): void {
        const buffer = Buffer.alloc(36);

        buffer.writeUInt32LE(header.token, 0);
        buffer.writeUInt32LE(header.version, 4);
        buffer.writeInt32LE(header.numberOfFiles, 8);
        buffer.writeInt32LE(header.tocOffset, 12);
        buffer.writeInt32LE(header.tocCompressor, 16);
        buffer.writeInt32LE(header.sizeOfTOC, 20);
        buffer.writeInt32LE(header.nameBlockOffset || 0, 24);
        buffer.writeInt32LE(header.blockCompressor, 28);
        buffer.writeInt32LE(header.uncompSizeOfNameBlock, 32);

        stream.write(buffer);
    }

    /**
     * Build archive with progress dialog
     */
    public static async buildWithDialog(sourceDir: string, outputPath: string, options: BuildOptions): Promise<void> {
        await vscode.window.withProgress(
            {
                location: vscode.ProgressLocation.Notification,
                title: 'Building TRE Archive',
                cancellable: false
            },
            async (progress) => {
                await this.buildArchive(sourceDir, outputPath, options, progress);
            }
        );

        vscode.window.showInformationMessage(`Archive created: ${path.basename(outputPath)}`);
    }

    /**
     * Show build dialog and create archive
     */
    public static async showBuildDialog(): Promise<void> {
        // Select source directory
        const sourceDirs = await vscode.window.showOpenDialog({
            canSelectFiles: false,
            canSelectFolders: true,
            canSelectMany: false,
            title: 'Select Source Directory'
        });

        if (!sourceDirs || sourceDirs.length === 0) {
            return;
        }

        const sourceDir = sourceDirs[0].fsPath;

        // Select output location
        const outputFile = await vscode.window.showSaveDialog({
            defaultUri: vscode.Uri.file(path.join(path.dirname(sourceDir), path.basename(sourceDir) + '.tre')),
            filters: { 'TRE Archives': ['tre'] },
            title: 'Save TRE Archive'
        });

        if (!outputFile) {
            return;
        }

        // Get options
        const version = await vscode.window.showQuickPick(['0005', '0004'], {
            placeHolder: 'Select TRE version',
            title: 'TRE Version'
        });

        if (!version) {
            return;
        }

        const compressionChoice = await vscode.window.showQuickPick(
            ['Yes', 'No'],
            { placeHolder: 'Compress files?', title: 'Compression' }
        );

        const options: BuildOptions = {
            version: version as '0004' | '0005',
            compressionLevel: compressionChoice === 'Yes' ? 9 : 0,
            compressToc: compressionChoice === 'Yes',
            compressNames: compressionChoice === 'Yes',
            includeMd5: version === '0005'
        };

        await this.buildWithDialog(sourceDir, outputFile.fsPath, options);
    }
}
