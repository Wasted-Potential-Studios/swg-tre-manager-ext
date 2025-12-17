/**
 * Copyright (c) 2024-2026 Wasted Potential Studios LLC
 * Licensed under the MIT License
 *
 * TRE file parser - Core library for reading TRE archives
 */

import * as fs from 'fs';
import * as crypto from 'crypto';
import { TreHeader, TocEntry, TreFile, TreArchive } from '../types/TreTypes';
import { InvalidFormatError, UnsupportedVersionError, CorruptedArchiveError } from '../types/ErrorTypes';
import { TRE_CONSTANTS } from '../constants/TreConstants';
import { CompressionUtil } from '../utils/CompressionUtil';
import { Crc32Util } from '../utils/Crc32Util';

/**
 * TRE file parser class
 */
export class TreParser {
    /**
     * Parse TRE file and return complete archive data
     */
    static parseFile(filePath: string): TreArchive {
        const buffer = fs.readFileSync(filePath);

        // Parse header
        const header = this.parseHeader(buffer);

        // Parse TOC
        const toc = this.parseToc(buffer, header);

        // Parse name block
        const names = this.parseNameBlock(buffer, header);

        // Parse MD5 block (version 0005 only)
        let md5Hashes: string[] | undefined;
        if (header.version === TRE_CONSTANTS.VERSION_0005) {
            md5Hashes = this.parseMd5Block(buffer, header);
        }

        // Build file list
        const files = this.buildFileList(header, toc, names, md5Hashes);

        // Calculate statistics
        const totalSize = files.reduce((sum, file) => sum + file.size, 0);
        const compressedSize = files.reduce((sum, file) => sum + file.compressedSize, 0);
        const compressionRatio = totalSize > 0 ? compressedSize / totalSize : 0;

        const version = header.version === TRE_CONSTANTS.VERSION_0005 ? '0005' : '0004';

        return {
            path: filePath,
            header,
            files,
            totalSize,
            compressedSize,
            compressionRatio,
            version
        };
    }

    /**
     * Parse TRE header (36 bytes)
     */
    static parseHeader(buffer: Buffer): TreHeader {
        if (buffer.length < TRE_CONSTANTS.HEADER_SIZE) {
            throw new InvalidFormatError('File too small to be a valid TRE archive');
        }

        const token = buffer.readUInt32LE(0);
        if (token !== TRE_CONSTANTS.MAGIC_TOKEN) {
            throw new InvalidFormatError('Invalid TRE magic token');
        }

        const version = buffer.readUInt32LE(4);
        if (version !== TRE_CONSTANTS.VERSION_0004 && version !== TRE_CONSTANTS.VERSION_0005) {
            throw new UnsupportedVersionError(this.versionToString(version));
        }

        return {
            token,
            version,
            numberOfFiles: buffer.readUInt32LE(8),
            tocOffset: buffer.readUInt32LE(12),
            tocCompressor: buffer.readUInt32LE(16),
            sizeOfTOC: buffer.readUInt32LE(20),
            blockCompressor: buffer.readUInt32LE(24),
            sizeOfNameBlock: buffer.readUInt32LE(28),
            uncompSizeOfNameBlock: buffer.readUInt32LE(32)
        };
    }

    /**
     * Parse Table of Contents
     */
    static parseToc(buffer: Buffer, header: TreHeader): TocEntry[] {
        // Extract TOC data
        let tocData: Buffer = buffer.slice(header.tocOffset, header.tocOffset + header.sizeOfTOC);

        // Decompress if needed
        if (CompressionUtil.isCompressed(header.tocCompressor)) {
            tocData = CompressionUtil.decompress(tocData) as any;
        }

        const expectedSize = header.numberOfFiles * TRE_CONSTANTS.TOC_ENTRY_SIZE;
        if (tocData.length < expectedSize) {
            throw new CorruptedArchiveError('TOC size mismatch');
        }

        const entries: TocEntry[] = [];

        for (let i = 0; i < header.numberOfFiles; i++) {
            const offset = i * TRE_CONSTANTS.TOC_ENTRY_SIZE;

            entries.push({
                crc: tocData.readUInt32LE(offset),
                length: tocData.readInt32LE(offset + 4),
                offset: tocData.readInt32LE(offset + 8),
                compressor: tocData.readInt32LE(offset + 12),
                compressedLength: tocData.readInt32LE(offset + 16),
                nameOffset: tocData.readInt32LE(offset + 20)
            });
        }

        return entries;
    }

    /**
     * Parse name block
     */
    static parseNameBlock(buffer: Buffer, header: TreHeader): string[] {
        // Calculate name block offset (after TOC)
        const nameBlockOffset = header.tocOffset + header.sizeOfTOC;

        // Extract name block data
        let nameData: Buffer = buffer.slice(nameBlockOffset, nameBlockOffset + header.sizeOfNameBlock);

        // Decompress if needed
        if (CompressionUtil.isCompressed(header.blockCompressor)) {
            nameData = CompressionUtil.decompress(nameData) as any;
        }

        if (nameData.length < header.uncompSizeOfNameBlock) {
            throw new CorruptedArchiveError('Name block size mismatch');
        }

        // Parse null-terminated strings
        const names: string[] = [];
        let currentName = '';

        for (let i = 0; i < nameData.length; i++) {
            const byte = nameData[i];

            if (byte === 0) {
                if (currentName.length > 0) {
                    names.push(currentName);
                    currentName = '';
                }
            } else {
                currentName += String.fromCharCode(byte);
            }
        }

        return names;
    }

    /**
     * Parse MD5 block (version 0005 only)
     */
    static parseMd5Block(buffer: Buffer, header: TreHeader): string[] {
        // Calculate MD5 block offset (after name block)
        const nameBlockOffset = header.tocOffset + header.sizeOfTOC;
        const md5Offset = nameBlockOffset + header.sizeOfNameBlock;

        const md5BlockSize = header.numberOfFiles * TRE_CONSTANTS.MD5_SIZE;

        if (buffer.length < md5Offset + md5BlockSize) {
            throw new CorruptedArchiveError('MD5 block missing or incomplete');
        }

        const md5Hashes: string[] = [];

        for (let i = 0; i < header.numberOfFiles; i++) {
            const offset = md5Offset + (i * TRE_CONSTANTS.MD5_SIZE);
            const hash = buffer.slice(offset, offset + TRE_CONSTANTS.MD5_SIZE);
            md5Hashes.push(hash.toString('hex'));
        }

        return md5Hashes;
    }

    /**
     * Build file list from TOC and names
     */
    static buildFileList(
        header: TreHeader,
        toc: TocEntry[],
        names: string[],
        md5Hashes?: string[]
    ): TreFile[] {
        const files: TreFile[] = [];

        for (let i = 0; i < toc.length; i++) {
            const entry = toc[i];

            // Skip deleted files (length = 0)
            if (entry.length === 0) {
                continue;
            }

            // Get filename from name block
            const name = this.getNameFromOffset(names, entry.nameOffset);

            files.push({
                name,
                crc: entry.crc,
                checksum: entry.crc,
                size: entry.length,
                uncompressedSize: entry.length,
                compressedSize: entry.compressedLength,
                dataSize: entry.compressedLength,
                offset: entry.offset,
                dataOffset: entry.offset,
                compressed: CompressionUtil.isCompressed(entry.compressor),
                compressionLevel: entry.compressor,
                md5: md5Hashes ? md5Hashes[i] : undefined
            });
        }

        return files;
    }

    /**
     * Get filename from name block using offset
     */
    private static getNameFromOffset(names: string[], offset: number): string {
        // The offset indicates which string in the names array
        // This is a simplified implementation - actual implementation
        // would track byte offsets within the name block
        if (offset >= 0 && offset < names.length) {
            return names[offset];
        }
        return `unknown_${offset}`;
    }

    /**
     * Extract file data from archive
     */
    static extractFile(treePath: string, file: TreFile): Buffer {
        const fd = fs.openSync(treePath, 'r');

        try {
            // Read file data
            const buffer = Buffer.alloc(file.compressedSize);
            fs.readSync(fd, buffer, 0, file.compressedSize, file.offset);

            // Decompress if needed
            if (file.compressed) {
                return CompressionUtil.decompress(buffer);
            }

            return buffer;
        } finally {
            fs.closeSync(fd);
        }
    }

    /**
     * Find file by name (CRC32 lookup)
     */
    static findFile(archive: TreArchive, filename: string): TreFile | null {
        const searchCrc = Crc32Util.calculateForPath(filename);

        for (const file of archive.files) {
            if (file.crc === searchCrc) {
                return file;
            }
        }

        return null;
    }

    /**
     * Find files by extension
     */
    static findFilesByExtension(archive: TreArchive, extension: string): TreFile[] {
        const ext = extension.toLowerCase();
        return archive.files.filter(file => file.name.toLowerCase().endsWith(ext));
    }

    /**
     * Find files by pattern (simple wildcard matching)
     */
    static findFilesByPattern(archive: TreArchive, pattern: string): TreFile[] {
        const regex = new RegExp(
            '^' + pattern.replace(/\*/g, '.*').replace(/\?/g, '.') + '$',
            'i'
        );

        return archive.files.filter(file => regex.test(file.name));
    }

    /**
     * Get directory structure from file list
     */
    static getDirectoryStructure(files: TreFile[]): Map<string, TreFile[]> {
        const structure = new Map<string, TreFile[]>();

        for (const file of files) {
            const dir = this.getDirectory(file.name);

            if (!structure.has(dir)) {
                structure.set(dir, []);
            }

            structure.get(dir)!.push(file);
        }

        return structure;
    }

    /**
     * Get directory path from file path
     */
    private static getDirectory(filePath: string): string {
        const lastSlash = filePath.lastIndexOf('/');
        if (lastSlash === -1) {
            return '';
        }
        return filePath.substring(0, lastSlash);
    }

    /**
     * Validate MD5 hash for a file
     */
    static validateMd5(treePath: string, file: TreFile): boolean {
        if (!file.md5) {
            return true; // No MD5 to validate
        }

        const data = this.extractFile(treePath, file);
        const hash = crypto.createHash('md5').update(data).digest('hex');

        return hash === file.md5;
    }

    /**
     * Convert version number to string
     */
    private static versionToString(version: number): string {
        const bytes = [
            (version >> 24) & 0xFF,
            (version >> 16) & 0xFF,
            (version >> 8) & 0xFF,
            version & 0xFF
        ];
        return String.fromCharCode(...bytes);
    }

    /**
     * Get version string from header
     */
    static getVersionString(header: TreHeader): string {
        return header.version === TRE_CONSTANTS.VERSION_0005 ? '0005' : '0004';
    }
}
