import * as fs from 'fs';
import * as crypto from 'crypto';
import { TreParser } from '../parsers/TreParser';
import { TreArchive, ValidationResult, ValidationIssue } from '../types/TreTypes';
import { Crc32Util } from '../utils/Crc32Util';

/**
 * TRE Archive Validator
 * Validates integrity and structure of TRE archives
 */
export class TreValidator {
    /**
     * Validate a TRE archive
     */
    public static async validate(filePath: string): Promise<ValidationResult> {
        const issues: ValidationIssue[] = [];
        let isValid = true;

        try {
            // Check file exists and is readable
            if (!fs.existsSync(filePath)) {
                return {
                    isValid: false,
                    issues: [{
                        severity: 'error',
                        message: 'File does not exist',
                        location: 'File System'
                    }]
                };
            }

            const stats = fs.statSync(filePath);
            if (stats.size < 36) {
                return {
                    isValid: false,
                    issues: [{
                        severity: 'error',
                        message: 'File is too small to be a valid TRE archive',
                        location: 'File Size'
                    }]
                };
            }

            // Parse the archive
            const archive = TreParser.parseFile(filePath);

            // Validate header
            this.validateHeader(archive, issues);

            // Validate TOC
            this.validateToc(archive, issues);

            // Validate file data
            await this.validateFileData(filePath, archive, issues);

            // Validate MD5 checksums if present
            if (archive.header.version === 0x30303035 && archive.md5Hashes && archive.md5Hashes.length > 0) {
                await this.validateMd5Hashes(filePath, archive, issues);
            }

            // Check for errors
            isValid = !issues.some(issue => issue.severity === 'error');

        } catch (error) {
            issues.push({
                severity: 'error',
                message: `Failed to validate archive: ${error instanceof Error ? error.message : String(error)}`,
                location: 'Validation Process'
            });
            isValid = false;
        }

        return { isValid, issues };
    }

    /**
     * Validate header structure
     */
    private static validateHeader(archive: TreArchive, issues: ValidationIssue[]): void {
        const header = archive.header;

        // Check magic number
        const versionStr = header.version === 0x30303035 ? '0005' : '0004';

        // Check version
        if (header.version !== 0x30303034 && header.version !== 0x30303035) {
            issues.push({
                severity: 'error',
                message: `Unsupported version: ${header.version}`,
                location: 'Header'
            });
        }

        // Check file count
        if (header.numberOfFiles < 0 || header.numberOfFiles > 1000000) {
            issues.push({
                severity: 'warning',
                message: `Unusual file count: ${header.numberOfFiles}`,
                location: 'Header'
            });
        }

        // Check compression values
        if (header.tocCompressor < 0 || header.tocCompressor > 2) {
            issues.push({
                severity: 'warning',
                message: `Invalid TOC compression value: ${header.tocCompressor}`,
                location: 'Header'
            });
        }

        if (header.blockCompressor < 0 || header.blockCompressor > 2) {
            issues.push({
                severity: 'warning',
                message: `Invalid name block compression value: ${header.blockCompressor}`,
                location: 'Header'
            });
        }

        // Check offsets
        if (header.tocOffset < 36) {
            issues.push({
                severity: 'error',
                message: `TOC offset is before end of header: ${header.tocOffset}`,
                location: 'Header'
            });
        }
    }

    /**
     * Validate table of contents
     */
    private static validateToc(archive: TreArchive, issues: ValidationIssue[]): void {
        if (archive.files.length !== archive.header.numberOfFiles) {
            issues.push({
                severity: 'error',
                message: `File count mismatch: header says ${archive.header.numberOfFiles}, TOC contains ${archive.files.length}`,
                location: 'TOC'
            });
        }

        // Check for duplicate checksums
        const checksums = new Set<number>();
        const duplicates: string[] = [];

        for (const file of archive.files) {
            if (checksums.has(file.crc)) {
                duplicates.push(file.name);
            }
            checksums.add(file.crc);

            // Validate individual entries
            if (file.compressedSize < 0) {
                issues.push({
                    severity: 'error',
                    message: `Negative data size for ${file.name}: ${file.compressedSize}`,
                    location: 'TOC Entry'
                });
            }

            if (file.size < 0) {
                issues.push({
                    severity: 'error',
                    message: `Negative uncompressed size for ${file.name}: ${file.size}`,
                    location: 'TOC Entry'
                });
            }

            if (file.compressed && file.compressedSize >= file.size) {
                issues.push({
                    severity: 'warning',
                    message: `File marked as compressed but data size >= uncompressed size: ${file.name}`,
                    location: 'TOC Entry'
                });
            }

            // Validate CRC32
            if (file.name) {
                const expectedCrc = Crc32Util.calculateForPath(file.name);
                if (expectedCrc !== file.crc) {
                    issues.push({
                        severity: 'error',
                        message: `CRC32 mismatch for ${file.name}: expected ${expectedCrc.toString(16)}, got ${file.crc.toString(16)}`,
                        location: 'TOC Entry'
                    });
                }
            }
        }

        if (duplicates.length > 0) {
            issues.push({
                severity: 'warning',
                message: `Found ${duplicates.length} duplicate checksums: ${duplicates.slice(0, 5).join(', ')}${duplicates.length > 5 ? '...' : ''}`,
                location: 'TOC'
            });
        }
    }

    /**
     * Validate file data
     */
    private static async validateFileData(filePath: string, archive: TreArchive, issues: ValidationIssue[]): Promise<void> {
        const fileSize = fs.statSync(filePath).size;

        for (const file of archive.files) {
            const endOffset = file.offset + file.compressedSize;

            // Check if data is within file bounds
            if (endOffset > archive.header.tocOffset) {
                issues.push({
                    severity: 'error',
                    message: `File data extends beyond TOC: ${file.name} (${file.offset} + ${file.compressedSize} > ${archive.header.tocOffset})`,
                    location: 'File Data'
                });
            }

            // Check for overlapping data
            for (const otherFile of archive.files) {
                if (file === otherFile) continue;

                const otherEnd = otherFile.offset + otherFile.compressedSize;
                if (file.offset < otherEnd && endOffset > otherFile.offset) {
                    issues.push({
                        severity: 'error',
                        message: `Overlapping file data: ${file.name} and ${otherFile.name}`,
                        location: 'File Data'
                    });
                    break;
                }
            }
        }
    }

    /**
     * Validate MD5 hashes
     */
    private static async validateMd5Hashes(filePath: string, archive: TreArchive, issues: ValidationIssue[]): Promise<void> {
        if (!archive.md5Hashes || archive.md5Hashes.length === 0) {
            return;
        }

        if (archive.md5Hashes.length !== archive.files.length) {
            issues.push({
                severity: 'error',
                message: `MD5 hash count mismatch: ${archive.md5Hashes.length} hashes for ${archive.files.length} files`,
                location: 'MD5 Block'
            });
            return;
        }

        for (let i = 0; i < archive.files.length; i++) {
            const file = archive.files[i];
            const expectedHash = archive.md5Hashes[i];

            try {
                // Extract and hash the file data
                const data = TreParser.extractFile(filePath, file);
                const actualHash = crypto.createHash('md5').update(data).digest('hex');

                if (actualHash !== expectedHash) {
                    issues.push({
                        severity: 'error',
                        message: `MD5 mismatch for ${file.name}: expected ${expectedHash}, got ${actualHash}`,
                        location: 'MD5 Verification'
                    });
                }
            } catch (error) {
                issues.push({
                    severity: 'error',
                    message: `Failed to verify MD5 for ${file.name}: ${error instanceof Error ? error.message : String(error)}`,
                    location: 'MD5 Verification'
                });
            }
        }
    }

    /**
     * Format validation result as markdown
     */
    public static formatResult(result: ValidationResult): string {
        let md = '# TRE Archive Validation Report\n\n';

        if (result.isValid) {
            md += '## ✅ Validation Passed\n\n';
            md += 'The archive structure is valid and all checks passed.\n\n';
        } else {
            md += '## ❌ Validation Failed\n\n';
            md += 'The archive has structural issues that need to be addressed.\n\n';
        }

        if (result.issues.length > 0) {
            md += '## Issues Found\n\n';

            const errors = result.issues.filter(i => i.severity === 'error');
            const warnings = result.issues.filter(i => i.severity === 'warning');
            const info = result.issues.filter(i => i.severity === 'info');

            if (errors.length > 0) {
                md += `### ❌ Errors (${errors.length})\n\n`;
                for (const issue of errors) {
                    md += `- **${issue.location}**: ${issue.message}\n`;
                }
                md += '\n';
            }

            if (warnings.length > 0) {
                md += `### ⚠️ Warnings (${warnings.length})\n\n`;
                for (const issue of warnings) {
                    md += `- **${issue.location}**: ${issue.message}\n`;
                }
                md += '\n';
            }

            if (info.length > 0) {
                md += `### ℹ️ Information (${info.length})\n\n`;
                for (const issue of info) {
                    md += `- **${issue.location}**: ${issue.message}\n`;
                }
                md += '\n';
            }
        } else {
            md += 'No issues found.\n\n';
        }

        md += '---\n';
        md += `*Validated at ${new Date().toLocaleString()}*\n`;

        return md;
    }
}
