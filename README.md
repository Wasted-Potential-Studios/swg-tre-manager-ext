# SWG TRE Archive Manager

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![VS Code](https://img.shields.io/badge/VS%20Code-Extension-blue.svg)](https://code.visualstudio.com/)

A comprehensive Visual Studio Code extension for browsing, extracting, building, and managing Star Wars Galaxies TRE (Tree File) archive files.

**Copyright © 2024-2026 Wasted Potential Studios LLC. All rights reserved.**

![TRE Manager Banner](https://via.placeholder.com/800x200/9b59b6/ffffff?text=SWG+TRE+Archive+Manager)

## Features

### 📦 Activity Bar Browser
- **Visual tree view** of all TRE archives in your workspace
- **Smart categorization** by filename patterns (Official Client Data, Patches, Custom Mods, Server Files)
- **Works with any workspace structure** - no specific folder names required
- **File statistics** showing file counts and total sizes
- **Expandable folders** to browse archive contents
- **Quick access** to all archives from the Activity Bar

### 🔍 Virtual File System
- Browse TRE contents like regular folders in VS Code
- **No extraction required** - view files directly from archives
- **Integrated file icons** based on file type
- **Seamless navigation** through archive directory structure

### 💾 File Extraction
- **Extract single files** with right-click context menu
- **Extract entire folders** preserving directory structure
- **Extract all files** from an archive
- **Progress indicators** for large operations
- **Configurable destination** paths
- **Overwrite protection** with user prompts

### 🏗️ Archive Building
- Create new TRE archives from workspace folders
- **Version selection** (0004 or 0005)
- **Compression options** for TOC and files
- **Batch building** support
- **Validation** before creating archives

### ✓ Archive Management
- **Validate archives** - check integrity and structure
- **Compare archives** - see differences between two TRE files
- **View properties** - detailed archive metadata
- **Convert versions** - switch between 0004 and 0005 formats
- **Search files** across all archives in workspace

### 🔗 Extension Integration
- **Seamless integration** with SWG IFF Editor
- **Opens .tab files** in SWG DataTable Editor
- **Opens .stf files** in SWG STF Editor
- **Auto-extract to temp** for editing
- **Context menu shortcuts** for quick file opening

### 🎨 Professional UI
- **Wasted Potential Studios color theme** throughout
- **Tabbed interface** for Contents, Properties, and Statistics
- **Responsive design** works at all window sizes
- **Progress bars** and status messages
- **Dark theme optimized** for comfortable viewing

## Installation

### From VSIX
1. Download the `.vsix` file from [Releases](https://github.com/Wasted-Potential-Studios/swg-tre-manager-ext/releases)
2. Open VS Code
3. Go to Extensions view (`Ctrl+Shift+X`)
4. Click "..." menu → "Install from VSIX..."
5. Select the downloaded file

### From Marketplace
1. Open VS Code
2. Go to Extensions view (`Ctrl+Shift+X`)
3. Search for "SWG TRE Archive Manager"
4. Click "Install"

## Quick Start

1. **Open a workspace** containing SWG files
2. **Click the TRE icon** in the Activity Bar (left sidebar)
3. **Browse archives** - they'll be automatically detected and categorized
4. **Expand an archive** to see its contents
5. **Right-click files** for extraction and opening options

## Usage

### Browsing Archives

The extension automatically scans your workspace for `.tre` files and intelligently categorizes them:

- **📦 Official Client Data** - `data_*.tre` files (textures, meshes, animations, etc.)
- **🔧 Official Patches** - `patch_*.tre`, `hotfix_*.tre`, `default_patch.tre`
- **🎮 Custom Content** - **All user-created TRE files** with any name!
  - Community mods: `beginnings_*.tre`, `legends_*.tre`
  - Your custom files: `mymod.tre`, `newcontent.tre`, anything!
  - Server mods: `myserver_*.tre`, `custom_*.tre`
- **⚙️ Server Files** - `bottom.tre` and files in serverdata folders

**Works with ANY TRE filename** - no configuration needed!

Click any archive to expand and browse its contents.

### Extracting Files

**Extract a single file:**
1. Right-click the file in the tree view
2. Select "Extract File"
3. Choose destination folder
4. File is extracted with full directory structure

**Extract a folder:**
1. Right-click any folder in an archive
2. Select "Extract Folder"
3. All files in that folder are extracted

**Extract entire archive:**
1. Right-click the archive name
2. Select "Extract All Files"
3. Confirm and choose destination
4. All files extracted with progress indicator

### Building Archives

1. Click the "Build" icon in the TRE Explorer toolbar
2. Select source folder
3. Choose TRE version (0004 or 0005)
4. Set compression options
5. Click "Build"
6. Archive created with validation

### Searching Files

1. Click the search icon in TRE Explorer
2. Enter filename pattern (supports wildcards)
3. Results show all matching files across all archives
4. Click any result to open/extract

### Opening Files in Editors

For `.iff`, `.tab`, or `.stf` files:
1. Right-click the file
2. Select "Open in [Editor Name]"
3. File is temporarily extracted and opened
4. Save changes to update archive (future feature)

## Configuration

Access settings via `File > Preferences > Settings` and search for "SWG TRE":

### Basic Settings
- **`swg-tre-manager.autoDetectTreFiles`** - Auto-detect TRE files in workspace (default: true)
- **`swg-tre-manager.defaultExtractionPath`** - Default extraction destination (leave empty to prompt)
- **`swg-tre-manager.showFileCount`** - Show file counts in tree view (default: true)
- **`swg-tre-manager.showFileSize`** - Show file sizes in tree view (default: true)

### Archive Building
- **`swg-tre-manager.defaultCompression`** - Enable compression by default (default: true)
- **`swg-tre-manager.defaultVersion`** - Default TRE version for new archives (default: "0005")

### Advanced Settings
- **`swg-tre-manager.excludePatterns`** - Folders to exclude when scanning
  - Default: `["**/node_modules/**", "**/backup/**", "**/.git/**"]`
- **`swg-tre-manager.maxFilesToScan`** - Maximum TRE files to scan (default: 5000)

## Supported Features

### File Formats
- ✅ TRE version 0004
- ✅ TRE version 0005
- ✅ Compressed archives (zlib)
- ✅ Uncompressed archives
- ✅ MD5 validation (version 0005)

### Operations
- ✅ Browse archives
- ✅ Extract files
- ✅ Build archives
- ✅ Validate archives
- ✅ Compare archives
- ✅ Convert versions
- ✅ Search files

### Integrations
- ✅ SWG IFF Editor
- ✅ SWG DataTable Editor
- ✅ SWG STF Editor

## Keyboard Shortcuts

- `Ctrl+Shift+P` → "SWG TRE: Refresh" - Refresh archive list
- `Ctrl+Shift+P` → "SWG TRE: Build Archive" - Build new archive
- `Ctrl+Shift+P` → "SWG TRE: Search" - Search files in archives

## Troubleshooting

### Archives not appearing
- Make sure `.tre` files are in your workspace
- Check "Auto Detect TRE Files" setting is enabled
- Click refresh button in TRE Explorer toolbar

### Extraction fails
- Ensure you have write permissions to destination
- Check archive is not corrupted
- Try extracting to a different location

### Can't open files in other editors
- Ensure the required extension is installed
- Check file type is supported
- Try extracting file manually first

## Contributing

We welcome contributions! Here's how:

1. Fork the repository at https://github.com/Wasted-Potential-Studios/swg-tre-manager-ext
2. Create a feature branch
3. Make your changes
4. Submit a pull request

See [CONTRIBUTING.md](CONTRIBUTING.md) for detailed guidelines.

## Related Extensions

- **[SWG IFF Editor](https://marketplace.visualstudio.com/items?itemName=WastedPotentialStudios.swg-iff-editor)** - Edit IFF template files
- **[SWG DataTable Editor](https://marketplace.visualstudio.com/items?itemName=WastedPotentialStudios.swg-datatable-editor)** - Edit game data tables
- **[SWG STF Editor](https://marketplace.visualstudio.com/items?itemName=WastedPotentialStudios.swg-stf-editor)** - Edit string table files

## Support

- **Issues**: [GitHub Issues](https://github.com/Wasted-Potential-Studios/swg-tre-manager-ext/issues)
- **Discussions**: [GitHub Discussions](https://github.com/Wasted-Potential-Studios/swg-tre-manager-ext/discussions)
- **Email**: support@wastedpotential.studio

## License

This extension is licensed under the MIT License - see [LICENSE](LICENSE) file for details.

## Credits

- **Developed by**: Wasted Potential Studios LLC
- **TRE Format Documentation**: SWG Emulator Community
- **Compression**: pako library
- **Icons**: Custom designed for WPS

## Changelog

See [CHANGELOG.md](CHANGELOG.md) for version history and release notes.

---

**Made with 💜 by Wasted Potential Studios**

*For more SWG development tools, visit [wasted potential.studio](https://wastedpotential.studio)*
