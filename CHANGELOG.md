# Changelog

All notable changes to the SWG TRE Archive Manager extension will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.5] - 2025-12-17

### Changed
- Builder Template now pre-populates with standard SWG folder structure (appearance, object, datatables, etc.)
- Users can immediately start attaching files without creating folder structure from scratch

## [1.0.4] - 2025-12-17

### Added
- **Builder Template** - Visual TRE archive builder with drag-and-drop folder structure
  - Create custom file structures with folders and files at any depth
  - Attach individual files or entire folder structures from disk
  - Rename, remove, and reorganize structure elements
  - Visual tree representation with collapsible folders
  - Tooltips for proper TRE naming conventions
  - Version selection (0004/0005) and compression options
- Builder Template button in toolbar (🛠️ icon)

## [1.0.3] - 2025-12-17

### Added
- Real-time search functionality in TRE archive viewer - search by filename across all files
- Complete file listing in viewer - no more truncation, all files are now visible

### Fixed
- Removed 100-file display limit in archive viewer
- Files can now be filtered instantly using the search box

## [1.0.2] - 2025-12-17

### Fixed
- Implemented Build New TRE Archive functionality - now fully working with compression options and version selection
- Archive builder now properly creates TRE files from directories with progress indicators

## [1.0.1] - 2025-12-17

### Fixed
- Fixed duplicate "Build New TRE Archive", "Refresh TRE Archives", and "Search in TRE Archives" buttons appearing in the SWG TRE Manager view title toolbar by adding explicit sort orders to navigation group items

## [1.0.0] - 2025-12-17

### Added
- Initial release of SWG TRE Archive Manager
- **Workspace-agnostic design** - works with any folder structure
- **Intelligent categorization** based on TRE filename patterns
- Activity Bar integration with TRE file browser
- Virtual file system for browsing TRE contents
- Webview-based archive viewer with tabbed interface
- File extraction (single, folder, all)
- TRE archive building from workspace folders
- Archive validation and integrity checking
- Archive comparison (diff) functionality
- Version conversion (0004 ↔ 0005)
- Integration with SWG IFF Editor
- Integration with SWG DataTable Editor
- Integration with SWG STF Editor
- Search and filter capabilities
- Progress indicators for long operations
- Wasted Potential Studios color theme
- Comprehensive documentation
- **File Explorer context menus** for .tre files
- **Configurable custom mod patterns**
- **Configurable exclude patterns** for scanning
- **Support for all SWG server types** (SWGEmu, Legends, Basilisk, etc.)

### Features
- 📦 Browse all TRE archives in workspace with categorization
- 🔍 Virtual file system - browse TRE like folders
- 💾 Extract files preserving directory structure
- 🏗️ Build new TRE archives with compression options
- ✓ Validate archive integrity and structure
- 🔄 Compare two archives to see differences
- 🔧 Convert between TRE versions 0004 and 0005
- 🎨 Professional UI with WPS color theme
- 🔗 Seamless integration with other SWG extensions

[1.0.0]: https://github.com/Wasted-Potential-Studios/SWG-TRE-Manager/releases/tag/v1.0.0
