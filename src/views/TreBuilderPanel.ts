/**
 * Copyright (c) 2024-2026 Wasted Potential Studios LLC
 * Licensed under the MIT License
 *
 * Webview panel for TRE archive builder template
 */

import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { WPS_COLORS } from '../constants/TreConstants';
import { TreBuilder } from '../operations/TreBuilder';
import { BuildOptions } from '../types/TreTypes';

interface TreeNode {
    id: string;
    name: string;
    type: 'folder' | 'file';
    path: string;
    sourcePath?: string;
    children?: TreeNode[];
}

/**
 * TRE Builder Panel
 */
export class TreBuilderPanel {
    public static currentPanel: TreBuilderPanel | undefined;
    private static readonly viewType = 'treBuilder';

    private readonly _panel: vscode.WebviewPanel;
    private readonly _extensionUri: vscode.Uri;
    private _disposables: vscode.Disposable[] = [];
    private _nodeCounter = 0;

    public static createOrShow(extensionUri: vscode.Uri) {
        const column = vscode.window.activeTextEditor
            ? vscode.window.activeTextEditor.viewColumn
            : undefined;

        // If we already have a panel, show it
        if (TreBuilderPanel.currentPanel) {
            TreBuilderPanel.currentPanel._panel.reveal(column);
            return;
        }

        // Otherwise, create a new panel
        const panel = vscode.window.createWebviewPanel(
            TreBuilderPanel.viewType,
            'TRE Builder Template',
            column || vscode.ViewColumn.One,
            {
                enableScripts: true,
                localResourceRoots: [extensionUri],
                retainContextWhenHidden: true
            }
        );

        TreBuilderPanel.currentPanel = new TreBuilderPanel(panel, extensionUri);
    }

    private constructor(panel: vscode.WebviewPanel, extensionUri: vscode.Uri) {
        this._panel = panel;
        this._extensionUri = extensionUri;

        // Set the webview's initial html content
        this._panel.webview.html = this.getHtmlForWebview(this._panel.webview);

        // Listen for when the panel is disposed
        this._panel.onDidDispose(() => this.dispose(), null, this._disposables);

        // Handle messages from the webview
        this._panel.webview.onDidReceiveMessage(
            async message => {
                switch (message.command) {
                    case 'selectFile':
                        await this.handleSelectFile(message.nodeId);
                        break;
                    case 'selectFolder':
                        await this.handleSelectFolder(message.nodeId);
                        break;
                    case 'buildArchive':
                        await this.handleBuildArchive(message.data);
                        break;
                }
            },
            null,
            this._disposables
        );
    }

    private async handleSelectFile(nodeId: string) {
        const fileUris = await vscode.window.showOpenDialog({
            canSelectFiles: true,
            canSelectFolders: false,
            canSelectMany: false,
            title: 'Select File to Add'
        });

        if (fileUris && fileUris.length > 0) {
            this._panel.webview.postMessage({
                command: 'fileSelected',
                nodeId: nodeId,
                filePath: fileUris[0].fsPath,
                fileName: path.basename(fileUris[0].fsPath)
            });
        }
    }

    private async handleSelectFolder(nodeId: string) {
        const folderUris = await vscode.window.showOpenDialog({
            canSelectFiles: false,
            canSelectFolders: true,
            canSelectMany: false,
            title: 'Select Folder to Add'
        });

        if (folderUris && folderUris.length > 0) {
            const folderPath = folderUris[0].fsPath;
            const structure = await this.scanFolderStructure(folderPath, folderPath);

            this._panel.webview.postMessage({
                command: 'folderSelected',
                nodeId: nodeId,
                structure: structure
            });
        }
    }

    private async scanFolderStructure(dir: string, baseDir: string): Promise<any> {
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        const structure: any = {
            files: [],
            folders: []
        };

        for (const entry of entries) {
            const fullPath = path.join(dir, entry.name);
            const relativePath = path.relative(baseDir, fullPath);

            if (entry.isDirectory()) {
                const subStructure = await this.scanFolderStructure(fullPath, baseDir);
                structure.folders.push({
                    name: entry.name,
                    path: relativePath,
                    sourcePath: fullPath,
                    ...subStructure
                });
            } else if (entry.isFile()) {
                structure.files.push({
                    name: entry.name,
                    path: relativePath,
                    sourcePath: fullPath
                });
            }
        }

        return structure;
    }

    private async handleBuildArchive(data: any) {
        try {
            // Validate inputs
            if (!data.archiveName || !data.archiveName.trim()) {
                vscode.window.showErrorMessage('Please provide an archive name');
                return;
            }

            if (!data.tree || !data.tree.children || data.tree.children.length === 0) {
                vscode.window.showErrorMessage('Please add at least one file or folder to the archive');
                return;
            }

            // Get save location
            const saveUri = await vscode.window.showSaveDialog({
                defaultUri: vscode.Uri.file(data.archiveName + '.tre'),
                filters: { 'TRE Archives': ['tre'] },
                title: 'Save TRE Archive'
            });

            if (!saveUri) {
                return;
            }

            // Create temporary directory structure
            const tempDir = path.join(require('os').tmpdir(), 'tre-builder-' + Date.now());
            fs.mkdirSync(tempDir, { recursive: true });

            try {
                // Build file structure in temp directory
                await this.buildTempStructure(data.tree, tempDir);

                // Build the archive
                const options: BuildOptions = {
                    version: data.version as '0004' | '0005',
                    compressionLevel: data.compression ? 9 : 0,
                    compressToc: data.compression,
                    compressNames: data.compression,
                    includeMd5: data.version === '0005'
                };

                await TreBuilder.buildWithDialog(tempDir, saveUri.fsPath, options);

                vscode.window.showInformationMessage('Archive created successfully!');

                // Close the panel after successful build
                this._panel.dispose();
            } finally {
                // Clean up temp directory
                if (fs.existsSync(tempDir)) {
                    fs.rmSync(tempDir, { recursive: true, force: true });
                }
            }
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to build archive: ${error}`);
        }
    }

    private async buildTempStructure(node: any, currentPath: string) {
        if (!node.children) {
            return;
        }

        for (const child of node.children) {
            if (child.type === 'folder') {
                const folderPath = path.join(currentPath, child.name);
                fs.mkdirSync(folderPath, { recursive: true });

                if (child.children) {
                    await this.buildTempStructure(child, folderPath);
                }
            } else if (child.type === 'file' && child.sourcePath) {
                const destPath = path.join(currentPath, child.name);
                fs.copyFileSync(child.sourcePath, destPath);
            }
        }
    }

    private getHtmlForWebview(webview: vscode.Webview): string {
        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource} 'unsafe-inline'; script-src ${webview.cspSource} 'unsafe-inline';">
    <title>TRE Builder Template</title>
    <style>
        * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
        }

        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            background: ${WPS_COLORS.darkGray};
            color: ${WPS_COLORS.white};
            padding: 20px;
            overflow-x: hidden;
        }

        .header {
            background: linear-gradient(135deg, ${WPS_COLORS.primaryPurple}, ${WPS_COLORS.darkPurple});
            padding: 30px;
            border-radius: 12px;
            margin-bottom: 30px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
        }

        .header h1 {
            font-size: 32px;
            font-weight: 600;
            margin-bottom: 10px;
        }

        .header p {
            font-size: 14px;
            color: ${WPS_COLORS.lightText};
            opacity: 0.9;
        }

        .config-section {
            background: rgba(42, 42, 42, 0.6);
            border: 1px solid ${WPS_COLORS.borderGray};
            border-radius: 8px;
            padding: 25px;
            margin-bottom: 20px;
        }

        .config-title {
            font-size: 18px;
            font-weight: 600;
            color: ${WPS_COLORS.primaryPurple};
            margin-bottom: 20px;
            padding-bottom: 10px;
            border-bottom: 2px solid ${WPS_COLORS.borderGray};
        }

        .form-group {
            margin-bottom: 20px;
        }

        .form-label {
            display: block;
            font-size: 14px;
            font-weight: 600;
            color: ${WPS_COLORS.lightText};
            margin-bottom: 8px;
        }

        .form-input {
            width: 100%;
            padding: 12px 16px;
            background: rgba(42, 42, 42, 0.8);
            border: 1px solid ${WPS_COLORS.borderGray};
            border-radius: 6px;
            color: ${WPS_COLORS.white};
            font-size: 14px;
            font-family: 'Consolas', 'Courier New', monospace;
            transition: border-color 0.2s;
        }

        .form-input:focus {
            outline: none;
            border-color: ${WPS_COLORS.primaryPurple};
        }

        .form-select {
            width: 100%;
            padding: 12px 16px;
            background: rgba(42, 42, 42, 0.8);
            border: 1px solid ${WPS_COLORS.borderGray};
            border-radius: 6px;
            color: ${WPS_COLORS.white};
            font-size: 14px;
            cursor: pointer;
            transition: border-color 0.2s;
        }

        .form-select:focus {
            outline: none;
            border-color: ${WPS_COLORS.primaryPurple};
        }

        .checkbox-group {
            display: flex;
            align-items: center;
            gap: 10px;
        }

        .checkbox-input {
            width: 18px;
            height: 18px;
            cursor: pointer;
        }

        .tooltip {
            font-size: 12px;
            color: ${WPS_COLORS.mediumText};
            margin-top: 5px;
            font-style: italic;
        }

        .tree-section {
            background: rgba(42, 42, 42, 0.6);
            border: 1px solid ${WPS_COLORS.borderGray};
            border-radius: 8px;
            padding: 25px;
            margin-bottom: 20px;
            min-height: 400px;
        }

        .tree-container {
            margin-top: 20px;
        }

        .tree-node {
            margin-left: 20px;
            border-left: 2px solid ${WPS_COLORS.borderGray};
            padding-left: 10px;
            margin-top: 8px;
        }

        .tree-node-root {
            margin-left: 0;
            border-left: none;
        }

        .tree-item {
            display: flex;
            align-items: center;
            gap: 10px;
            padding: 8px 12px;
            background: rgba(42, 42, 42, 0.8);
            border: 1px solid ${WPS_COLORS.borderGray};
            border-radius: 6px;
            margin-bottom: 8px;
            transition: background 0.2s;
        }

        .tree-item:hover {
            background: rgba(155, 89, 182, 0.1);
        }

        .tree-icon {
            font-size: 16px;
            width: 20px;
            text-align: center;
        }

        .tree-name {
            flex: 1;
            font-family: 'Consolas', 'Courier New', monospace;
            font-size: 13px;
            color: ${WPS_COLORS.white};
        }

        .tree-status {
            font-size: 11px;
            color: ${WPS_COLORS.mediumText};
            padding: 4px 8px;
            background: rgba(0, 0, 0, 0.3);
            border-radius: 4px;
        }

        .tree-status.attached {
            color: #4caf50;
        }

        .tree-actions {
            display: flex;
            gap: 5px;
        }

        .btn {
            padding: 6px 12px;
            border: none;
            border-radius: 4px;
            font-size: 12px;
            cursor: pointer;
            transition: all 0.2s;
            font-weight: 500;
        }

        .btn-primary {
            background: ${WPS_COLORS.primaryPurple};
            color: ${WPS_COLORS.white};
        }

        .btn-primary:hover {
            background: ${WPS_COLORS.darkPurple};
            transform: translateY(-1px);
        }

        .btn-secondary {
            background: rgba(155, 89, 182, 0.3);
            color: ${WPS_COLORS.white};
            border: 1px solid ${WPS_COLORS.primaryPurple};
        }

        .btn-secondary:hover {
            background: rgba(155, 89, 182, 0.5);
        }

        .btn-danger {
            background: rgba(244, 67, 54, 0.3);
            color: #ff5252;
            border: 1px solid #ff5252;
        }

        .btn-danger:hover {
            background: rgba(244, 67, 54, 0.5);
        }

        .btn-large {
            padding: 15px 30px;
            font-size: 16px;
            width: 100%;
            margin-top: 10px;
        }

        .add-root-buttons {
            display: flex;
            gap: 10px;
            margin-top: 15px;
        }

        .add-root-buttons button {
            flex: 1;
        }

        .empty-state {
            text-align: center;
            padding: 60px 20px;
            color: ${WPS_COLORS.mediumText};
        }

        .empty-state-icon {
            font-size: 48px;
            margin-bottom: 20px;
            opacity: 0.5;
        }

        .empty-state-text {
            font-size: 16px;
            margin-bottom: 10px;
        }

        .collapsible {
            cursor: pointer;
            user-select: none;
        }

        .collapsible:hover .tree-icon {
            color: ${WPS_COLORS.primaryPurple};
        }

        .collapsed > .tree-node {
            display: none;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>🏗️ TRE Builder Template</h1>
        <p>Build custom TRE archives by creating a file structure template</p>
    </div>

    <div class="config-section">
        <h2 class="config-title">Archive Configuration</h2>

        <div class="form-group">
            <label class="form-label" for="archiveName">Archive Name</label>
            <input type="text" id="archiveName" class="form-input" placeholder="my_custom_archive">
            <div class="tooltip">
                📝 Examples: data_custom_00, patch_mymod_01, myserver_content, custom_items
                <br>💡 Common patterns: data_*, patch_*, yourname_*, custom_*
            </div>
        </div>

        <div class="form-group">
            <label class="form-label" for="version">TRE Version</label>
            <select id="version" class="form-select">
                <option value="0005">0005 (Recommended - Modern, supports MD5)</option>
                <option value="0004">0004 (Legacy - Older compatibility)</option>
            </select>
        </div>

        <div class="form-group">
            <div class="checkbox-group">
                <input type="checkbox" id="compression" class="checkbox-input" checked>
                <label class="form-label" for="compression" style="margin-bottom: 0;">Enable Compression</label>
            </div>
            <div class="tooltip">Compress files for smaller archive size (recommended)</div>
        </div>
    </div>

    <div class="tree-section">
        <h2 class="config-title">File Structure</h2>
        <div class="tooltip" style="margin-bottom: 15px; margin-top: -10px;">
            Pre-populated with standard SWG folder structure. Add/remove folders, attach files, or customize as needed.
        </div>
        <div id="treeContainer" class="tree-container">
            <!-- Will be populated by JavaScript -->
        </div>
        <div class="add-root-buttons">
            <button class="btn btn-secondary" onclick="addRootFolder()">📁 Add Root Folder</button>
            <button class="btn btn-secondary" onclick="addRootFile()">📄 Add Root File</button>
        </div>
    </div>

    <button class="btn btn-primary btn-large" onclick="buildArchive()">
        🚀 Build TRE Archive
    </button>

    <script>
        const vscode = acquireVsCodeApi();
        let nodeCounter = 0;

        function generateId() {
            return 'node_' + (nodeCounter++);
        }

        // Pre-populate with standard SWG folder structure
        function createStandardStructure() {
            const structure = {
                id: 'root',
                name: 'root',
                type: 'folder',
                path: '',
                children: [
                    {
                        id: generateId(),
                        name: 'appearance',
                        type: 'folder',
                        path: 'appearance',
                        children: [
                            { id: generateId(), name: 'mesh', type: 'folder', path: 'appearance/mesh', children: [] },
                            { id: generateId(), name: 'texture', type: 'folder', path: 'appearance/texture', children: [] },
                            { id: generateId(), name: 'skeleton', type: 'folder', path: 'appearance/skeleton', children: [] }
                        ]
                    },
                    {
                        id: generateId(),
                        name: 'clientdata',
                        type: 'folder',
                        path: 'clientdata',
                        children: []
                    },
                    {
                        id: generateId(),
                        name: 'customization',
                        type: 'folder',
                        path: 'customization',
                        children: []
                    },
                    {
                        id: generateId(),
                        name: 'datatables',
                        type: 'folder',
                        path: 'datatables',
                        children: [
                            { id: generateId(), name: 'appearance', type: 'folder', path: 'datatables/appearance', children: [] },
                            { id: generateId(), name: 'crafting', type: 'folder', path: 'datatables/crafting', children: [] },
                            { id: generateId(), name: 'item', type: 'folder', path: 'datatables/item', children: [] }
                        ]
                    },
                    {
                        id: generateId(),
                        name: 'misc',
                        type: 'folder',
                        path: 'misc',
                        children: []
                    },
                    {
                        id: generateId(),
                        name: 'object',
                        type: 'folder',
                        path: 'object',
                        children: [
                            {
                                id: generateId(),
                                name: 'tangible',
                                type: 'folder',
                                path: 'object/tangible',
                                children: [
                                    { id: generateId(), name: 'wearables', type: 'folder', path: 'object/tangible/wearables', children: [] },
                                    { id: generateId(), name: 'furniture', type: 'folder', path: 'object/tangible/furniture', children: [] },
                                    { id: generateId(), name: 'item', type: 'folder', path: 'object/tangible/item', children: [] }
                                ]
                            },
                            {
                                id: generateId(),
                                name: 'static',
                                type: 'folder',
                                path: 'object/static',
                                children: []
                            },
                            {
                                id: generateId(),
                                name: 'mobile',
                                type: 'folder',
                                path: 'object/mobile',
                                children: []
                            }
                        ]
                    },
                    {
                        id: generateId(),
                        name: 'shader',
                        type: 'folder',
                        path: 'shader',
                        children: []
                    },
                    {
                        id: generateId(),
                        name: 'string',
                        type: 'folder',
                        path: 'string',
                        children: [
                            { id: generateId(), name: 'en', type: 'folder', path: 'string/en', children: [] }
                        ]
                    },
                    {
                        id: generateId(),
                        name: 'texture',
                        type: 'folder',
                        path: 'texture',
                        children: []
                    },
                    {
                        id: generateId(),
                        name: 'ui',
                        type: 'folder',
                        path: 'ui',
                        children: []
                    }
                ]
            };
            return structure;
        }

        let treeData = createStandardStructure();
        }

        function addRootFolder() {
            const node = {
                id: generateId(),
                name: 'New Folder',
                type: 'folder',
                path: '',
                children: []
            };
            treeData.children.push(node);
            renderTree();
        }

        function addRootFile() {
            const node = {
                id: generateId(),
                name: 'New File',
                type: 'file',
                path: ''
            };
            treeData.children.push(node);
            renderTree();
        }

        function addChildFolder(parentId) {
            const parent = findNode(treeData, parentId);
            if (parent && parent.type === 'folder') {
                if (!parent.children) {
                    parent.children = [];
                }
                const node = {
                    id: generateId(),
                    name: 'New Folder',
                    type: 'folder',
                    path: parent.path ? parent.path + '/' + 'New Folder' : 'New Folder',
                    children: []
                };
                parent.children.push(node);
                renderTree();
            }
        }

        function addChildFile(parentId) {
            const parent = findNode(treeData, parentId);
            if (parent && parent.type === 'folder') {
                if (!parent.children) {
                    parent.children = [];
                }
                const node = {
                    id: generateId(),
                    name: 'New File',
                    type: 'file',
                    path: parent.path ? parent.path + '/' + 'New File' : 'New File'
                };
                parent.children.push(node);
                renderTree();
            }
        }

        function attachFile(nodeId) {
            vscode.postMessage({
                command: 'selectFile',
                nodeId: nodeId
            });
        }

        function attachFolder(nodeId) {
            vscode.postMessage({
                command: 'selectFolder',
                nodeId: nodeId
            });
        }

        function removeNode(nodeId) {
            removeNodeFromTree(treeData, nodeId);
            renderTree();
        }

        function renameNode(nodeId) {
            const node = findNode(treeData, nodeId);
            if (node) {
                const newName = prompt('Enter new name:', node.name);
                if (newName && newName.trim()) {
                    node.name = newName.trim();
                    updateNodePath(node);
                    renderTree();
                }
            }
        }

        function toggleCollapse(nodeId) {
            const element = document.getElementById('node_' + nodeId);
            if (element) {
                element.classList.toggle('collapsed');
            }
        }

        function findNode(node, id) {
            if (node.id === id) return node;
            if (node.children) {
                for (const child of node.children) {
                    const found = findNode(child, id);
                    if (found) return found;
                }
            }
            return null;
        }

        function removeNodeFromTree(node, id) {
            if (node.children) {
                const index = node.children.findIndex(c => c.id === id);
                if (index !== -1) {
                    node.children.splice(index, 1);
                    return true;
                }
                for (const child of node.children) {
                    if (removeNodeFromTree(child, id)) return true;
                }
            }
            return false;
        }

        function updateNodePath(node, parentPath = '') {
            node.path = parentPath ? parentPath + '/' + node.name : node.name;
            if (node.children) {
                for (const child of node.children) {
                    updateNodePath(child, node.path);
                }
            }
        }

        function renderTree() {
            const container = document.getElementById('treeContainer');

            if (!treeData.children || treeData.children.length === 0) {
                container.innerHTML = \`
                    <div class="empty-state">
                        <div class="empty-state-icon">📁</div>
                        <div class="empty-state-text">No files or folders added yet</div>
                        <div class="tooltip">Start building your archive structure below</div>
                    </div>
                \`;
                return;
            }

            container.innerHTML = renderNode(treeData, true);
        }

        function renderNode(node, isRoot = false) {
            if (isRoot) {
                return node.children.map(child => renderNode(child)).join('');
            }

            const icon = node.type === 'folder' ? '📁' : '📄';
            const hasSource = node.sourcePath ? 'attached' : '';
            const statusText = node.sourcePath ? '✓ Attached' : 'Not attached';
            const toggleClick = node.type === 'folder' && node.children && node.children.length > 0 ?
                'toggleCollapse("' + node.id + '")' : '';

            let html = '<div id="node_' + node.id + '" class="tree-node-container">';
            html += '<div class="tree-item">';
            html += '<span class="tree-icon' + (node.type === 'folder' && node.children && node.children.length > 0 ? ' collapsible' : '') + '"';
            if (toggleClick) {
                html += ' onclick="' + toggleClick + '"';
            }
            html += '>' + icon + '</span>';
            html += '<span class="tree-name" onclick="renameNode(\'' + node.id + '\')" title="Click to rename">' + node.name + '</span>';
            html += '<span class="tree-status ' + hasSource + '">' + statusText + '</span>';
            html += '<div class="tree-actions">';

            if (node.type === 'folder') {
                html += '<button class="btn btn-secondary" onclick="addChildFolder(\'' + node.id + '\')" title="Add subfolder">📁+</button>';
                html += '<button class="btn btn-secondary" onclick="addChildFile(\'' + node.id + '\')" title="Add file">📄+</button>';
                html += '<button class="btn btn-primary" onclick="attachFolder(\'' + node.id + '\')" title="Attach folder from disk">📂 Attach</button>';
            } else {
                html += '<button class="btn btn-primary" onclick="attachFile(\'' + node.id + '\')" title="Attach file from disk">📎 Attach</button>';
            }

            html += '<button class="btn btn-danger" onclick="removeNode(\'' + node.id + '\')" title="Remove">🗑️</button>';
            html += '</div>';
            html += '</div>';

            if (node.children && node.children.length > 0) {
                html += '<div class="tree-node">';
                html += node.children.map(child => renderNode(child)).join('');
                html += '</div>';
            }

            html += '</div>';
            return html;
        }

        function buildArchive() {
            const archiveName = document.getElementById('archiveName').value.trim();
            const version = document.getElementById('version').value;
            const compression = document.getElementById('compression').checked;

            if (!archiveName) {
                alert('Please provide an archive name');
                return;
            }

            if (!treeData.children || treeData.children.length === 0) {
                alert('Please add at least one file or folder');
                return;
            }

            // Check if all nodes have sources attached
            const missingNodes = findNodesWithoutSource(treeData);
            if (missingNodes.length > 0) {
                const proceed = confirm(
                    'Some files/folders do not have sources attached:\\n\\n' +
                    missingNodes.map(n => '- ' + n.name).join('\\n') +
                    '\\n\\nDo you want to continue? These items will be skipped.'
                );
                if (!proceed) return;
            }

            vscode.postMessage({
                command: 'buildArchive',
                data: {
                    archiveName: archiveName,
                    version: version,
                    compression: compression,
                    tree: treeData
                }
            });
        }

        function findNodesWithoutSource(node, missing = []) {
            if (node.type === 'file' && !node.sourcePath) {
                missing.push(node);
            }
            if (node.children) {
                for (const child of node.children) {
                    findNodesWithoutSource(child, missing);
                }
            }
            return missing;
        }

        // Handle messages from extension
        window.addEventListener('message', event => {
            const message = event.data;

            switch (message.command) {
                case 'fileSelected':
                    const fileNode = findNode(treeData, message.nodeId);
                    if (fileNode) {
                        fileNode.sourcePath = message.filePath;
                        fileNode.name = message.fileName;
                        updateNodePath(fileNode);
                        renderTree();
                    }
                    break;

                case 'folderSelected':
                    const folderNode = findNode(treeData, message.nodeId);
                    if (folderNode) {
                        folderNode.sourcePath = message.structure;
                        // Merge structure into tree
                        mergeStructure(folderNode, message.structure);
                        renderTree();
                    }
                    break;
            }
        });

        function mergeStructure(parentNode, structure) {
            parentNode.children = [];
            parentNode.sourcePath = 'attached';

            // Add files
            if (structure.files) {
                for (const file of structure.files) {
                    parentNode.children.push({
                        id: generateId(),
                        name: file.name,
                        type: 'file',
                        path: parentNode.path + '/' + file.name,
                        sourcePath: file.sourcePath
                    });
                }
            }

            // Add folders
            if (structure.folders) {
                for (const folder of structure.folders) {
                    const folderNode = {
                        id: generateId(),
                        name: folder.name,
                        type: 'folder',
                        path: parentNode.path + '/' + folder.name,
                        children: []
                    };
                    parentNode.children.push(folderNode);
                    mergeStructure(folderNode, folder);
                }
            }
        }

        // Initial render
        renderTree();
    </script>
</body>
</html>`;
    }

    public dispose() {
        TreBuilderPanel.currentPanel = undefined;

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
