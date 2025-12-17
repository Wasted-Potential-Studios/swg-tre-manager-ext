/**
 * Copyright (c) 2024-2026 Wasted Potential Studios LLC
 * Licensed under the MIT License
 *
 * Core type definitions for TRE file format
 */

/**
 * TRE file header structure (36 bytes)
 */
export interface TreHeader {
    /** Magic number "TREE" (0x54524545) */
    token: number;

    /** Magic number string "EERT" */
    format?: string;

    /** Version tag: "0004" (0x30303034) or "0005" (0x30303035) */
    version: number;

    /** Total number of files in archive */
    numberOfFiles: number;

    /** Total number of files (alias) */
    fileCount?: number;

    /** Byte offset to Table of Contents from file start */
    tocOffset: number;

    /** TOC compression method (0=none, 2=zlib) */
    tocCompressor: number;

    /** TOC compression method (alias) */
    tocCompression?: number;

    /** Size of (compressed) TOC in bytes */
    sizeOfTOC: number;

    /** Uncompressed size of TOC */
    tocUncompressedSize?: number;

    /** Name block compression method (0=none, 2=zlib) */
    blockCompressor: number;

    /** Name block compression (alias) */
    nameCompression?: number;

    /** Name block offset */
    nameBlockOffset?: number;

    /** Size of (compressed) name block in bytes */
    sizeOfNameBlock: number;

    /** Name block uncompressed size */
    nameBlockUncompressedSize?: number;

    /** Uncompressed size of name block */
    uncompSizeOfNameBlock: number;
}

/**
 * Table of Contents entry (24 bytes per entry)
 */
export interface TocEntry {
    /** CRC32 of the lowercase filename */
    crc: number;

    /** Uncompressed file size (0 = deleted) */
    length: number;

    /** Byte offset to file data from file start */
    offset: number;

    /** File compression method (0=none, 2=zlib) */
    compressor: number;

    /** Compressed file size */
    compressedLength: number;

    /** Offset into name block for filename */
    nameOffset: number;
}

/**
 * Parsed TRE file information
 */
export interface TreFile {
    /** File name (path in archive) */
    name: string;

    /** CRC32 hash of lowercase filename */
    crc: number;

    /** CRC32 hash (alias for compatibility) */
    checksum: number;

    /** Uncompressed file size */
    size: number;

    /** Uncompressed file size (alias for compatibility) */
    uncompressedSize: number;

    /** Compressed file size */
    compressedSize: number;

    /** Compressed file size (alias for compatibility) */
    dataSize: number;

    /** Byte offset to file data */
    offset: number;

    /** Byte offset (alias for compatibility) */
    dataOffset: number;

    /** Whether file is compressed */
    compressed: boolean;

    /** Compression level */
    compressionLevel: number;

    /** MD5 hash (version 0005 only) */
    md5?: string;
}

/**
 * Complete TRE archive data
 */
export interface TreArchive {
    /** Archive file path */
    path: string;

    /** Parsed header */
    header: TreHeader;

    /** List of files in archive */
    files: TreFile[];

    /** Total uncompressed size */
    totalSize: number;

    /** Total compressed size */
    compressedSize: number;

    /** Compression ratio (0-1) */
    compressionRatio: number;

    /** Archive version string */
    version: '0004' | '0005';

    /** MD5 hashes (version 0005 only) */
    md5Hashes?: string[];
}

/**
 * Options for building a new TRE archive
 */
export interface BuildOptions {
    /** Target version */
    version: '0004' | '0005';

    /** Compress Table of Contents */
    compressToc: boolean;

    /** Compress name block */
    compressNames: boolean;

    /** Compression level (0-9) */
    compressionLevel: number;

    /** Include MD5 hashes (version 0005 only) */
    includeMd5: boolean;
}

/**
 * File to add to archive during building
 */
export interface FileToAdd {
    /** Relative path in archive */
    path: string;

    /** Source path on file system */
    sourcePath: string;

    /** Compress this file */
    compress: boolean;
}

/**
 * Build statistics
 */
export interface BuildStatistics {
    /** Number of files */
    fileCount: number;

    /** Total uncompressed size */
    totalSize: number;

    /** Total compressed size */
    compressedSize: number;

    /** Compression ratio */
    compressionRatio: number;

    /** Estimated archive size */
    estimatedSize: number;
}

/**
 * Archive validation result
 */
export interface ValidationResult {
    /** Whether archive is valid */
    isValid: boolean;

    /** List of issues found */
    issues: ValidationIssue[];
}

/**
 * Validation issue
 */
export interface ValidationIssue {
    /** Severity level */
    severity: 'error' | 'warning' | 'info';

    /** Issue message */
    message: string;

    /** Location of issue */
    location: string;
}

/**
 * Archive comparison result
 */
export interface ComparisonResult {
    /** Files added in second archive */
    added: string[];

    /** Files removed from first archive */
    removed: string[];

    /** Files modified (size or CRC changed) */
    modified: Array<{
        path: string;
        oldSize: number;
        newSize: number;
        oldCrc: number;
        newCrc: number;
    }>;

    /** Files unchanged */
    unchanged: string[];
}

/**
 * Extraction options
 */
export interface ExtractionOptions {
    /** Destination directory */
    destination: string;

    /** Preserve directory structure */
    preserveStructure: boolean;

    /** Overwrite existing files */
    overwrite: boolean;

    /** Files to extract (empty = all) */
    files?: string[];
}

/**
 * Progress callback
 */
export interface ProgressCallback {
    (current: number, total: number, message: string): void;
}

/**
 * Search criteria for TRE files
 */
export interface SearchCriteria {
    /** Filename pattern (supports wildcards) */
    filename?: string;

    /** File extension */
    extension?: string;

    /** CRC32 hash */
    crc?: number;

    /** Minimum file size */
    minSize?: number;

    /** Maximum file size */
    maxSize?: number;

    /** Use regex for filename */
    useRegex?: boolean;
}

/**
 * Search result
 */
export interface SearchResult {
    /** Archive path */
    archivePath: string;

    /** File info */
    file: TreFile;
}
