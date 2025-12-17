/**
 * Copyright (c) 2024-2026 Wasted Potential Studios LLC
 * Licensed under the MIT License
 *
 * Compression utilities using zlib (via pako)
 */

import * as pako from 'pako';
import { DecompressionError } from '../types/ErrorTypes';
import { TRE_CONSTANTS } from '../constants/TreConstants';

/**
 * Compression utility class
 */
export class CompressionUtil {
    /**
     * Decompress data using zlib inflate
     */
    static decompress(buffer: Buffer): Buffer {
        try {
            const result = pako.inflate(buffer);
            return Buffer.from(result);
        } catch (error) {
            throw new DecompressionError(error instanceof Error ? error.message : String(error));
        }
    }

    /**
     * Compress data using zlib deflate
     */
    static compress(buffer: Buffer, level: number = 9): Buffer {
        try {
            const result = pako.deflate(buffer, { level: level as any });
            return Buffer.from(result) as any;
        } catch (error) {
            throw new Error(`Compression failed: ${error}`);
        }
    }

    /**
     * Check if compressor type indicates compression
     */
    static isCompressed(compressorType: number): boolean {
        return compressorType === TRE_CONSTANTS.COMPRESSION_ZLIB;
    }

    /**
     * Get compression ratio (0-1, where 1 = no compression)
     */
    static getCompressionRatio(originalSize: number, compressedSize: number): number {
        if (originalSize === 0) {
            return 0;
        }
        return compressedSize / originalSize;
    }

    /**
     * Calculate compression savings percentage
     */
    static getCompressionSavings(originalSize: number, compressedSize: number): number {
        if (originalSize === 0) {
            return 0;
        }
        return Math.round((1 - (compressedSize / originalSize)) * 100);
    }
}
