/**
 * Copyright (c) 2024-2026 Wasted Potential Studios LLC
 * Licensed under the MIT License
 *
 * CRC32 calculation utilities
 */

/**
 * CRC32 utility class
 * Based on SWG's CRC32 implementation
 */
export class Crc32Util {
    private static table: number[] | null = null;

    /**
     * Initialize CRC32 lookup table
     */
    private static initTable(): void {
        if (this.table) {
            return;
        }

        this.table = [];
        for (let i = 0; i < 256; i++) {
            let crc = i;
            for (let j = 0; j < 8; j++) {
                if (crc & 1) {
                    crc = (crc >>> 1) ^ 0xEDB88320;
                } else {
                    crc = crc >>> 1;
                }
            }
            this.table[i] = crc >>> 0; // Ensure unsigned
        }
    }

    /**
     * Calculate CRC32 for a string
     * String is converted to lowercase and UTF-8 bytes
     */
    static calculate(str: string): number {
        this.initTable();

        // Convert to lowercase for SWG compatibility
        const lowerStr = str.toLowerCase();

        // Convert string to UTF-8 bytes
        const bytes = Buffer.from(lowerStr, 'utf8');

        let crc = 0xFFFFFFFF;

        for (let i = 0; i < bytes.length; i++) {
            const index = (crc ^ bytes[i]) & 0xFF;
            crc = (this.table![index]! ^ (crc >>> 8)) >>> 0;
        }

        return (crc ^ 0xFFFFFFFF) >>> 0; // Final XOR and ensure unsigned
    }

    /**
     * Calculate CRC32 for a file path (converts to lowercase)
     */
    static calculateForPath(filePath: string): number {
        // Normalize path separators to forward slashes
        const normalized = filePath.replace(/\\/g, '/');
        return this.calculate(normalized);
    }

    /**
     * Verify CRC32 matches expected value
     */
    static verify(str: string, expectedCrc: number): boolean {
        const calculated = this.calculate(str);
        return calculated === expectedCrc;
    }

    /**
     * Format CRC32 as hexadecimal string
     */
    static toHex(crc: number): string {
        return '0x' + crc.toString(16).toUpperCase().padStart(8, '0');
    }

    /**
     * Calculate CRC32 for a buffer
     */
    static calculateForBuffer(buffer: Buffer): number {
        this.initTable();

        let crc = 0xFFFFFFFF;

        for (let i = 0; i < buffer.length; i++) {
            const index = (crc ^ buffer[i]) & 0xFF;
            crc = (this.table![index]! ^ (crc >>> 8)) >>> 0;
        }

        return (crc ^ 0xFFFFFFFF) >>> 0;
    }
}
