/**
 * Copyright (c) 2024-2026 Wasted Potential Studios LLC
 * Licensed under the MIT License
 *
 * Webview panel for TRE archive viewer
 */

import * as vscode from 'vscode';
import * as path from 'path';
import { TreArchive } from '../types/TreTypes';
import { FileUtil } from '../utils/FileUtil';
import { WPS_COLORS } from '../constants/TreConstants';

/**
 * TRE Viewer Panel
 */
export class TreViewerPanel {
    public static currentPanel: TreViewerPanel | undefined;
    private static readonly viewType = 'treViewer';

    private readonly _panel: vscode.WebviewPanel;
    private readonly _extensionUri: vscode.Uri;
    private _disposables: vscode.Disposable[] = [];

    public static createOrShow(extensionUri: vscode.Uri, archive: TreArchive) {
        const column = vscode.window.activeTextEditor
            ? vscode.window.activeTextEditor.viewColumn
            : undefined;

        // If we already have a panel, show it
        if (TreViewerPanel.currentPanel) {
            TreViewerPanel.currentPanel._panel.reveal(column);
            TreViewerPanel.currentPanel.updateArchive(archive);
            return;
        }

        // Otherwise, create a new panel
        const panel = vscode.window.createWebviewPanel(
            TreViewerPanel.viewType,
            `TRE: ${path.basename(archive.path)}`,
            column || vscode.ViewColumn.One,
            {
                enableScripts: true,
                localResourceRoots: [extensionUri],
                retainContextWhenHidden: true
            }
        );

        TreViewerPanel.currentPanel = new TreViewerPanel(panel, extensionUri, archive);
    }

    private constructor(panel: vscode.WebviewPanel, extensionUri: vscode.Uri, archive: TreArchive) {
        this._panel = panel;
        this._extensionUri = extensionUri;

        // Set the webview's initial html content
        this.updateArchive(archive);

        // Listen for when the panel is disposed
        this._panel.onDidDispose(() => this.dispose(), null, this._disposables);

        // Handle messages from the webview
        this._panel.webview.onDidReceiveMessage(
            message => {
                switch (message.command) {
                    case 'alert':
                        vscode.window.showInformationMessage(message.text);
                        return;
                }
            },
            null,
            this._disposables
        );
    }

    public updateArchive(archive: TreArchive) {
        this._panel.title = `TRE: ${path.basename(archive.path)}`;
        this._panel.webview.html = this.getHtmlForWebview(this._panel.webview, archive);
    }

    private getHtmlForWebview(webview: vscode.Webview, archive: TreArchive): string {
        const archiveName = path.basename(archive.path);
        const fileCount = archive.files.length;
        const totalSize = FileUtil.formatFileSize(archive.totalSize);
        const compressedSize = FileUtil.formatFileSize(archive.compressedSize);
        const compressionPercent = Math.round((1 - archive.compressionRatio) * 100);

        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource} 'unsafe-inline'; script-src ${webview.cspSource} 'unsafe-inline';">
    <title>TRE Archive Viewer</title>
    <style>
        * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
        }

        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            color: ${WPS_COLORS.white};
            background: linear-gradient(135deg, ${WPS_COLORS.deepestBlack} 0%, ${WPS_COLORS.darkGray} 100%);
            padding: 0;
            overflow-x: hidden;
        }

        .header {
            background: linear-gradient(90deg, ${WPS_COLORS.darkGray} 0%, ${WPS_COLORS.mediumGray} 100%);
            border-bottom: 3px solid ${WPS_COLORS.primaryPurple};
            padding: 20px 30px;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }

        .header h1 {
            font-size: 24px;
            font-weight: 600;
            color: ${WPS_COLORS.white};
            margin: 0;
        }

        .header-info {
            display: flex;
            gap: 20px;
            font-size: 14px;
            color: ${WPS_COLORS.lightText};
        }

        .tabs {
            display: flex;
            background: ${WPS_COLORS.mediumGray};
            border-bottom: 2px solid ${WPS_COLORS.borderGray};
            padding: 0 20px;
        }

        .tab {
            padding: 15px 25px;
            cursor: pointer;
            border: none;
            background: transparent;
            color: ${WPS_COLORS.lightText};
            font-size: 14px;
            font-weight: 500;
            border-bottom: 3px solid transparent;
            transition: all 0.3s;
        }

        .tab:hover {
            background: rgba(155, 89, 182, 0.2);
            color: ${WPS_COLORS.white};
        }

        .tab.active {
            color: ${WPS_COLORS.primaryPurple};
            border-bottom-color: ${WPS_COLORS.primaryPurple};
        }

        .tab-content {
            display: none;
            padding: 30px;
            animation: fadeIn 0.3s;
        }

        .tab-content.active {
            display: block;
        }

        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
        }

        .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }

        .stat-card {
            background: rgba(42, 42, 42, 0.8);
            border: 1px solid ${WPS_COLORS.borderGray};
            border-radius: 8px;
            padding: 20px;
            transition: all 0.3s;
        }

        .stat-card:hover {
            transform: translateY(-2px);
            border-color: ${WPS_COLORS.primaryPurple};
            box-shadow: 0 4px 12px rgba(155, 89, 182, 0.3);
        }

        .stat-label {
            font-size: 12px;
            color: ${WPS_COLORS.mediumText};
            text-transform: uppercase;
            letter-spacing: 1px;
            margin-bottom: 8px;
        }

        .stat-value {
            font-size: 28px;
            font-weight: 600;
            color: ${WPS_COLORS.primaryPurple};
        }

        .search-box {
            margin-bottom: 20px;
            position: sticky;
            top: 0;
            z-index: 10;
            background: ${WPS_COLORS.darkGray};
            padding: 15px 0;
        }

        .search-input {
            width: 100%;
            padding: 12px 40px 12px 16px;
            background: rgba(42, 42, 42, 0.8);
            border: 1px solid ${WPS_COLORS.borderGray};
            border-radius: 6px;
            color: ${WPS_COLORS.white};
            font-size: 14px;
            font-family: 'Consolas', 'Courier New', monospace;
            transition: border-color 0.2s;
        }

        .search-input:focus {
            outline: none;
            border-color: ${WPS_COLORS.primaryPurple};
        }

        .search-input::placeholder {
            color: ${WPS_COLORS.mediumText};
        }

        .search-results {
            margin-top: 10px;
            font-size: 12px;
            color: ${WPS_COLORS.mediumText};
        }

        .file-list {
            background: rgba(42, 42, 42, 0.6);
            border: 1px solid ${WPS_COLORS.borderGray};
            border-radius: 8px;
            max-height: 600px;
            overflow-y: auto;
        }

        .file-item {
            padding: 12px 20px;
            border-bottom: 1px solid ${WPS_COLORS.borderGray};
            display: flex;
            justify-content: space-between;
            align-items: center;
            transition: background 0.2s;
        }

        .file-item:hover {
            background: rgba(155, 89, 182, 0.1);
        }

        .file-item:last-child {
            border-bottom: none;
        }

        .file-name {
            font-size: 13px;
            color: ${WPS_COLORS.white};
            font-family: 'Consolas', 'Courier New', monospace;
        }

        .file-size {
            font-size: 12px;
            color: ${WPS_COLORS.mediumText};
        }

        .section-title {
            font-size: 18px;
            font-weight: 600;
            color: ${WPS_COLORS.primaryPurple};
            margin-bottom: 20px;
            padding-bottom: 10px;
            border-bottom: 2px solid ${WPS_COLORS.borderGray};
        }

        .info-table {
            width: 100%;
            border-collapse: collapse;
            background: rgba(42, 42, 42, 0.6);
            border-radius: 8px;
            overflow: hidden;
        }

        .info-table tr {
            border-bottom: 1px solid ${WPS_COLORS.borderGray};
        }

        .info-table tr:last-child {
            border-bottom: none;
        }

        .info-table td {
            padding: 15px 20px;
        }

        .info-table td:first-child {
            font-weight: 600;
            color: ${WPS_COLORS.lightText};
            width: 200px;
        }

        .info-table td:last-child {
            color: ${WPS_COLORS.white};
            font-family: 'Consolas', 'Courier New', monospace;
            font-size: 13px;
        }

        .progress-bar {
            height: 8px;
            background: ${WPS_COLORS.mediumGray};
            border-radius: 4px;
            overflow: hidden;
            margin-top: 8px;
        }

        .progress-fill {
            height: 100%;
            background: linear-gradient(90deg, ${WPS_COLORS.primaryPurple}, ${WPS_COLORS.darkPurple});
            transition: width 0.3s;
        }

        /* Scrollbar styling */
        ::-webkit-scrollbar {
            width: 12px;
            height: 12px;
        }

        ::-webkit-scrollbar-track {
            background: ${WPS_COLORS.mediumGray};
        }

        ::-webkit-scrollbar-thumb {
            background: ${WPS_COLORS.primaryPurple};
            border-radius: 6px;
        }

        ::-webkit-scrollbar-thumb:hover {
            background: ${WPS_COLORS.darkPurple};
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>📦 ${archiveName}</h1>
        <div class="header-info">
            <span>Version: ${archive.version}</span>
            <span>|</span>
            <span>${fileCount} files</span>
        </div>
    </div>

    <div class="tabs">
        <button class="tab active" onclick="showTab('contents')">Contents</button>
        <button class="tab" onclick="showTab('properties')">Properties</button>
        <button class="tab" onclick="showTab('statistics')">Statistics</button>
    </div>

    <div id="contents" class="tab-content active">
        <h2 class="section-title">Archive Contents</h2>
        <div class="search-box">
            <input type="text"
                   id="searchInput"
                   class="search-input"
                   placeholder="🔍 Search files... (e.g., jacket, .mgn, appearance/mesh/)"
                   oninput="filterFiles()">
            <div class="search-results" id="searchResults">
                Showing all ${fileCount.toLocaleString()} files
            </div>
        </div>
        <div class="file-list" id="fileList">
            ${this.generateFileList(archive)}
        </div>
    </div>

    <div id="properties" class="tab-content">
        <h2 class="section-title">Archive Properties</h2>
        <table class="info-table">
            <tr>
                <td>File Path</td>
                <td>${archive.path}</td>
            </tr>
            <tr>
                <td>Version</td>
                <td>${archive.version}</td>
            </tr>
            <tr>
                <td>File Count</td>
                <td>${fileCount.toLocaleString()}</td>
            </tr>
            <tr>
                <td>Total Size (Uncompressed)</td>
                <td>${totalSize}</td>
            </tr>
            <tr>
                <td>Archive Size (Compressed)</td>
                <td>${compressedSize}</td>
            </tr>
            <tr>
                <td>Compression Ratio</td>
                <td>${compressionPercent}% smaller</td>
            </tr>
            <tr>
                <td>Magic Token</td>
                <td>0x${archive.header.token.toString(16).toUpperCase()}</td>
            </tr>
        </table>
    </div>

    <div id="statistics" class="tab-content">
        <h2 class="section-title">Archive Statistics</h2>
        <div class="stats-grid">
            <div class="stat-card">
                <div class="stat-label">Total Files</div>
                <div class="stat-value">${fileCount.toLocaleString()}</div>
            </div>
            <div class="stat-card">
                <div class="stat-label">Uncompressed Size</div>
                <div class="stat-value">${totalSize}</div>
            </div>
            <div class="stat-card">
                <div class="stat-label">Compressed Size</div>
                <div class="stat-value">${compressedSize}</div>
            </div>
            <div class="stat-card">
                <div class="stat-label">Space Saved</div>
                <div class="stat-value">${compressionPercent}%</div>
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${compressionPercent}%"></div>
                </div>
            </div>
        </div>

        <h3 class="section-title" style="margin-top: 40px;">File Type Distribution</h3>
        ${this.generateFileTypeStats(archive)}
    </div>

    <script>
        // Store all files data for filtering
        const allFiles = ${JSON.stringify(archive.files.map(f => ({ name: f.name, size: f.size })))};

        function showTab(tabName) {
            // Hide all tabs
            const tabContents = document.getElementsByClassName('tab-content');
            for (let i = 0; i < tabContents.length; i++) {
                tabContents[i].classList.remove('active');
            }

            // Deactivate all tab buttons
            const tabs = document.getElementsByClassName('tab');
            for (let i = 0; i < tabs.length; i++) {
                tabs[i].classList.remove('active');
            }

            // Show selected tab
            document.getElementById(tabName).classList.add('active');
            event.target.classList.add('active');
        }

        function formatFileSize(bytes) {
            if (bytes === 0) return '0 B';
            const k = 1024;
            const sizes = ['B', 'KB', 'MB', 'GB'];
            const i = Math.floor(Math.log(bytes) / Math.log(k));
            return (bytes / Math.pow(k, i)).toFixed(2) + ' ' + sizes[i];
        }

        function escapeHtml(text) {
            const div = document.createElement('div');
            div.textContent = text;
            return div.innerHTML;
        }

        function filterFiles() {
            const searchInput = document.getElementById('searchInput');
            const searchResults = document.getElementById('searchResults');
            const fileList = document.getElementById('fileList');
            const searchTerm = searchInput.value.toLowerCase();

            if (!searchTerm) {
                // Show all files
                const html = allFiles.map(file =>
                    '<div class="file-item">' +
                    '<span class="file-name">' + escapeHtml(file.name) + '</span>' +
                    '<span class="file-size">' + formatFileSize(file.size) + '</span>' +
                    '</div>'
                ).join('');

                fileList.innerHTML = html;
                searchResults.textContent = 'Showing all ' + allFiles.length.toLocaleString() + ' files';
                return;
            }

            // Filter files
            const filtered = allFiles.filter(file =>
                file.name.toLowerCase().includes(searchTerm)
            );

            // Generate HTML for filtered results
            const html = filtered.length > 0
                ? filtered.map(file =>
                    '<div class="file-item">' +
                    '<span class="file-name">' + escapeHtml(file.name) + '</span>' +
                    '<span class="file-size">' + formatFileSize(file.size) + '</span>' +
                    '</div>'
                  ).join('')
                : '<div class="file-item" style="justify-content: center; color: #999;">' +
                  '<span class="file-name">No files found matching "' + escapeHtml(searchTerm) + '"</span>' +
                  '</div>';

            fileList.innerHTML = html;
            searchResults.textContent = 'Found ' + filtered.length.toLocaleString() + ' of ' + allFiles.length.toLocaleString() + ' files';
        }
    </script>
</body>
</html>`;
    }

    private generateFileList(archive: TreArchive): string {
        // Show all files - filtering is handled by JavaScript in the browser
        let html = '';
        for (const file of archive.files) {
            const size = FileUtil.formatFileSize(file.size);
            html += `
                <div class="file-item">
                    <span class="file-name">${this.escapeHtml(file.name)}</span>
                    <span class="file-size">${size}</span>
                </div>
            `;
        }

        return html;
    }

    private generateFileTypeStats(archive: TreArchive): string {
        const extensions = new Map<string, number>();

        for (const file of archive.files) {
            const ext = path.extname(file.name).toLowerCase() || '(no extension)';
            extensions.set(ext, (extensions.get(ext) || 0) + 1);
        }

        const sorted = Array.from(extensions.entries()).sort((a, b) => b[1] - a[1]);

        let html = '<div class="stats-grid">';
        for (const [ext, count] of sorted.slice(0, 8)) {
            html += `
                <div class="stat-card">
                    <div class="stat-label">${this.escapeHtml(ext)}</div>
                    <div class="stat-value">${count.toLocaleString()}</div>
                </div>
            `;
        }
        html += '</div>';

        return html;
    }

    private escapeHtml(text: string): string {
        const map: { [key: string]: string } = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        };
        return text.replace(/[&<>"']/g, m => map[m]);
    }

    public dispose() {
        TreViewerPanel.currentPanel = undefined;

        // Clean up our resources
        this._panel.dispose();

        while (this._disposables.length) {
            const disposable = this._disposables.pop();
            if (disposable) {
                disposable.dispose();
            }
        }
    }
}
