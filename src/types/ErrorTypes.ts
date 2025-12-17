/**
 * Copyright (c) 2024-2026 Wasted Potential Studios LLC
 * Licensed under the MIT License
 *
 * Error types for TRE operations
 */

/**
 * Base class for TRE-related errors
 */
export class TreError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'TreError';
    }
}

/**
 * Error thrown when TRE file format is invalid
 */
export class InvalidFormatError extends TreError {
    constructor(message: string) {
        super(message);
        this.name = 'InvalidFormatError';
    }
}

/**
 * Error thrown when TRE version is unsupported
 */
export class UnsupportedVersionError extends TreError {
    constructor(version: string) {
        super(`Unsupported TRE version: ${version}`);
        this.name = 'UnsupportedVersionError';
    }
}

/**
 * Error thrown when decompression fails
 */
export class DecompressionError extends TreError {
    constructor(message: string) {
        super(`Decompression failed: ${message}`);
        this.name = 'DecompressionError';
    }
}

/**
 * Error thrown when file is not found in archive
 */
export class FileNotFoundError extends TreError {
    constructor(filename: string) {
        super(`File not found in archive: ${filename}`);
        this.name = 'FileNotFoundError';
    }
}

/**
 * Error thrown when CRC validation fails
 */
export class CrcMismatchError extends TreError {
    constructor(expected: number, actual: number) {
        super(`CRC mismatch: expected ${expected.toString(16)}, got ${actual.toString(16)}`);
        this.name = 'CrcMismatchError';
    }
}

/**
 * Error thrown when archive is corrupted
 */
export class CorruptedArchiveError extends TreError {
    constructor(message: string) {
        super(`Archive is corrupted: ${message}`);
        this.name = 'CorruptedArchiveError';
    }
}

/**
 * Error thrown when build validation fails
 */
export class BuildValidationError extends TreError {
    constructor(errors: string[]) {
        super(`Build validation failed:\n${errors.join('\n')}`);
        this.name = 'BuildValidationError';
    }
}
