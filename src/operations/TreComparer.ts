import { TreParser } from '../parsers/TreParser';
import { TreFile, TreArchive, ComparisonResult } from '../types/TreTypes';

/**
 * TRE Archive Comparer
 * Compare two TRE archives to identify differences
 */
export class TreComparer {
    /**
     * Compare two TRE archives
     */
    public static async compare(path1: string, path2: string): Promise<ComparisonResult> {
        // Parse both archives
        const archive1 = TreParser.parseFile(path1);
        const archive2 = TreParser.parseFile(path2);

        // Build lookup maps
        const files1 = new Map<string, TreFile>();
        const files2 = new Map<string, TreFile>();

        for (const file of archive1.files) {
            files1.set(file.name, file);
        }

        for (const file of archive2.files) {
            files2.set(file.name, file);
        }

        // Find added, removed, modified, unchanged
        const added: string[] = [];
        const removed: string[] = [];
        const modified: ComparisonResult['modified'] = [];
        const unchanged: string[] = [];

        // Check for added and modified files
        for (const [name, file2] of files2.entries()) {
            const file1 = files1.get(name);

            if (!file1) {
                // File exists in archive2 but not archive1 - added
                added.push(name);
            } else {
                // File exists in both - check if modified
                if (file1.size !== file2.size || file1.crc !== file2.crc) {
                    modified.push({
                        path: name,
                        oldSize: file1.size,
                        newSize: file2.size,
                        oldCrc: file1.crc,
                        newCrc: file2.crc
                    });
                } else {
                    unchanged.push(name);
                }
            }
        }

        // Check for removed files
        for (const [name, _] of files1.entries()) {
            if (!files2.has(name)) {
                // File exists in archive1 but not archive2 - removed
                removed.push(name);
            }
        }

        // Sort results
        added.sort();
        removed.sort();
        modified.sort((a, b) => a.path.localeCompare(b.path));
        unchanged.sort();

        return {
            added,
            removed,
            modified,
            unchanged
        };
    }

    /**
     * Format comparison result as markdown
     */
    public static formatResult(result: ComparisonResult, archive1Name: string, archive2Name: string): string {
        let md = '# TRE Archive Comparison Report\n\n';
        md += `## Archives\n\n`;
        md += `- **Original**: ${archive1Name}\n`;
        md += `- **Compared**: ${archive2Name}\n\n`;

        md += '## Summary\n\n';
        md += `- 📦 **Unchanged**: ${result.unchanged.length} files\n`;
        md += `- ✅ **Added**: ${result.added.length} files\n`;
        md += `- ❌ **Removed**: ${result.removed.length} files\n`;
        md += `- ✏️ **Modified**: ${result.modified.length} files\n\n`;

        if (result.added.length > 0) {
            md += '## ✅ Added Files\n\n';
            md += 'These files exist in the compared archive but not the original:\n\n';
            for (const file of result.added) {
                md += `- ${file}\n`;
            }
            md += '\n';
        }

        if (result.removed.length > 0) {
            md += '## ❌ Removed Files\n\n';
            md += 'These files exist in the original archive but not the compared archive:\n\n';
            for (const file of result.removed) {
                md += `- ${file}\n`;
            }
            md += '\n';
        }

        if (result.modified.length > 0) {
            md += '## ✏️ Modified Files\n\n';
            md += 'These files exist in both archives but have different content:\n\n';
            md += '| File | Old Size | New Size | Old CRC | New CRC |\n';
            md += '|------|----------|----------|---------|----------|\n';
            for (const file of result.modified) {
                const oldCrc = file.oldCrc.toString(16).padStart(8, '0');
                const newCrc = file.newCrc.toString(16).padStart(8, '0');
                md += `| ${file.path} | ${file.oldSize} | ${file.newSize} | ${oldCrc} | ${newCrc} |\n`;
            }
            md += '\n';
        }

        if (result.unchanged.length > 0) {
            md += '## 📦 Unchanged Files\n\n';
            md += `${result.unchanged.length} files are identical in both archives.\n\n`;
            if (result.unchanged.length <= 20) {
                for (const file of result.unchanged) {
                    md += `- ${file}\n`;
                }
            } else {
                md += `<details><summary>Show all ${result.unchanged.length} files</summary>\n\n`;
                for (const file of result.unchanged) {
                    md += `- ${file}\n`;
                }
                md += '\n</details>\n';
            }
            md += '\n';
        }

        md += '---\n';
        md += `*Compared at ${new Date().toLocaleString()}*\n`;

        return md;
    }

    /**
     * Get quick summary statistics
     */
    public static getSummary(result: ComparisonResult): string {
        const total = result.added.length + result.removed.length + result.modified.length + result.unchanged.length;
        const changedPercent = total > 0 ? Math.round(((result.added.length + result.removed.length + result.modified.length) / total) * 100) : 0;

        return `${changedPercent}% changed (${result.added.length} added, ${result.removed.length} removed, ${result.modified.length} modified)`;
    }
}
