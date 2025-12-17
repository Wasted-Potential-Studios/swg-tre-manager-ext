# Contributing to SWG TRE Archive Manager

Thank you for your interest in contributing to the SWG TRE Archive Manager extension! This document provides guidelines for contributing to the project.

## Code of Conduct

Be respectful, inclusive, and professional in all interactions.

## How to Contribute

### Reporting Issues

- Check existing issues before creating a new one
- Provide clear reproduction steps
- Include VS Code version, extension version, and OS
- Attach sample files if applicable (ensure no sensitive data)

### Suggesting Features

- Open an issue with the "enhancement" label
- Describe the feature and its use case
- Explain how it benefits SWG developers

### Submitting Pull Requests

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/my-feature`
3. **Make your changes** following the code style
4. **Test thoroughly** with various TRE files
5. **Update documentation** if needed
6. **Commit with clear messages**: `git commit -m "Add feature X"`
7. **Push to your fork**: `git push origin feature/my-feature`
8. **Open a Pull Request** with description of changes

### Code Style

- Follow existing TypeScript conventions
- Use meaningful variable and function names
- Add comments for complex logic
- Keep functions focused and small
- Use async/await for asynchronous operations

### Testing

- Test with both TRE version 0004 and 0005 files
- Verify compression and decompression work correctly
- Test with large archives (1000+ files)
- Check error handling with corrupted files
- Ensure UI remains responsive during operations

## Development Setup

### Prerequisites

- Node.js 16 or higher
- VS Code 1.85 or higher
- Git

### Setup Steps

```bash
# Clone your fork
git clone https://github.com/YOUR_USERNAME/SWG-TRE-Manager.git
cd SWG-TRE-Manager

# Install dependencies
npm install

# Compile TypeScript
npm run compile

# Open in VS Code
code .
```

### Running the Extension

1. Press `F5` to launch Extension Development Host
2. Open a workspace with TRE files
3. Test your changes

### Debugging

- Set breakpoints in TypeScript files
- Use `console.log` for quick debugging
- Check Debug Console for output
- Monitor VS Code Developer Tools (Help > Toggle Developer Tools)

## Project Structure

```
swg-tre-manager/
├── src/
│   ├── commands/         # Command handlers
│   ├── constants/        # Constants and configuration
│   ├── models/           # Data models
│   ├── operations/       # TRE operations (build, extract, validate)
│   ├── parsers/          # TRE file parser
│   ├── types/            # TypeScript type definitions
│   ├── utils/            # Utility functions
│   ├── views/            # Tree view and webview providers
│   └── extension.ts      # Main entry point
├── resources/            # Icons and assets
├── package.json          # Extension manifest
├── tsconfig.json         # TypeScript configuration
└── README.md             # User documentation
```

## Key Components

### TreParser
Handles reading and parsing TRE files:
- Header parsing
- TOC extraction
- Name block decoding
- MD5 validation (v0005)

### TreBuilder
Creates new TRE archives:
- File collection
- Compression
- TOC generation
- MD5 calculation

### TreValidator
Validates archive integrity:
- Header validation
- CRC verification
- MD5 checking
- Structure validation

### TreExplorerProvider
Activity Bar tree view:
- Workspace scanning
- File categorization
- Virtual folder structure

### TreViewerPanel
Webview for archive details:
- Contents tab
- Properties tab
- Statistics tab

## TRE File Format Reference

### Header (36 bytes)
```
Offset | Size | Field
-------|------|------
0      | 4    | Magic: "TREE" (0x54524545)
4      | 4    | Version: "0004" or "0005"
8      | 4    | File count
12     | 4    | TOC offset
16     | 4    | TOC compression (0=none, 2=zlib)
20     | 4    | TOC size
24     | 4    | Name block offset (v0005)
28     | 4    | Name block compression
32     | 4    | Name block uncompressed size
```

### TOC Entry (24 bytes)
```
Offset | Size | Field
-------|------|------
0      | 4    | CRC32 of lowercase filename
4      | 4    | Uncompressed file size
8      | 4    | File data offset
12     | 4    | Compression (0=none, 2=zlib)
16     | 4    | Compressed file size
20     | 4    | Name offset in name block
```

### Version Differences
- **0004**: Basic format, no MD5 hashes
- **0005**: Adds MD5 block after name block (16 bytes per file)

## Wasted Potential Studios Branding

Maintain consistent branding:
- Primary color: `#9b59b6` (purple)
- Dark purple: `#8e44ad`
- Success: `#2ecc71` (green)
- Error: `#e74c3c` (red)
- Background: Dark gradients (#0a0a0a to #1a1a1a)

## Documentation

When adding features:
- Update README.md with usage examples
- Add comments in code
- Update CHANGELOG.md
- Update IMPLEMENTATION_PLAN.md if applicable

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

## Questions?

Open an issue with the "question" label or contact us at support@wastedpotential.studio

---

**Thank you for contributing to SWG TRE Archive Manager!**
