# Testing Guide for SWG TRE Archive Manager

## Quick Test Checklist

Use this guide to verify all features work correctly before publishing.

---

## Prerequisites

1. ✅ Extension compiled successfully (`npm run compile`)
2. ✅ VS Code 1.85 or higher installed
3. ✅ Sample TRE files available for testing
4. ✅ SWG workspace open in VS Code

---

## Test 1: Extension Activation

**Steps:**
1. Press `F5` to launch Extension Development Host
2. Open a workspace containing `.tre` files
3. Look for TRE icon in Activity Bar (left sidebar)

**Expected Result:**
- TRE icon appears in Activity Bar
- No errors in Debug Console
- Extension activates automatically

---

## Test 2: Activity Bar Explorer

**Steps:**
1. Click TRE icon in Activity Bar
2. Verify archives are detected and categorized
3. Expand an archive to view contents
4. Expand folders within the archive

**Expected Result:**
- Archives appear grouped by category (Client Assets, Server Data, etc.)
- File counts shown next to archive names
- Files and folders expand correctly
- Folder structure matches archive contents

---

## Test 3: File Extraction

### Single File
1. Right-click a file in TRE Explorer
2. Select "Extract File"
3. Choose destination folder

**Expected:** File extracted with progress notification

### Folder
1. Right-click a folder in TRE Explorer
2. Select "Extract Folder"
3. Choose destination

**Expected:** All files in folder extracted, structure preserved

### All Files
1. Right-click an archive name
2. Select "Extract All Files"
3. Confirm and choose destination

**Expected:** Progress bar, all files extracted with structure

---

## Test 4: Archive Viewing

**Steps:**
1. Right-click an archive
2. Select "Open Archive"
3. Verify tabbed interface opens

**Expected Result:**
- Webview panel opens with 3 tabs
- **Contents Tab**: File list with search box
- **Properties Tab**: Archive metadata (version, size, compression)
- **Statistics Tab**: File counts, compression ratios, charts
- Purple/dark WPS theme applied throughout

---

## Test 5: Archive Building

**Steps:**
1. Open Command Palette (`Ctrl+Shift+P`)
2. Run "SWG TRE: Build Archive"
3. Select source directory
4. Choose output location
5. Select version (0004 or 0005)
6. Choose compression option

**Expected Result:**
- Progress notification appears
- Archive created successfully
- Can open and verify created archive

---

## Test 6: Archive Validation

**Steps:**
1. Right-click an archive
2. Select "Validate Archive"
3. Review validation report

**Expected Result:**
- Markdown document opens
- Shows validation status (✅ or ❌)
- Lists any errors, warnings, or info messages
- Includes header validation, TOC validation, CRC checks

---

## Test 7: Archive Comparison

**Steps:**
1. Right-click an archive
2. Select "Compare Archive"
3. Choose second archive to compare
4. Review comparison report

**Expected Result:**
- Markdown report opens
- Shows summary (added, removed, modified, unchanged)
- Lists all differences
- Color-coded sections

---

## Test 8: Version Conversion

**Steps:**
1. Right-click an archive
2. Select "Convert Archive Version"
3. Confirm conversion
4. Choose output location

**Expected Result:**
- Progress notification
- New archive created in target version
- Original archive unchanged
- Can validate converted archive

---

## Test 9: Context Menus

**Verify all context menu options appear:**

**On Archive:**
- Open Archive
- Extract All Files
- Validate Archive
- Compare Archive
- Convert Archive Version
- Refresh

**On Folder:**
- Extract Folder

**On File:**
- Extract File
- Open in IFF Editor (for .iff files)
- Open in DataTable Editor (for .tab files)
- Open in STF Editor (for .stf files)

---

## Test 10: Command Palette

**Steps:**
1. Open Command Palette (`Ctrl+Shift+P`)
2. Type "SWG TRE"
3. Verify all commands appear

**Expected Commands:**
- SWG TRE: Refresh
- SWG TRE: Build Archive
- SWG TRE: Search Archives
- SWG TRE: Show Statistics

---

## Test 11: Settings

**Steps:**
1. Open Settings (`Ctrl+,`)
2. Search for "SWG TRE"
3. Verify all settings appear

**Expected Settings:**
- Default Extraction Path
- Auto Detect TRE Files
- Show File Count
- Show File Size
- Default Compression
- Default Version

**Test:** Change settings and verify behavior updates

---

## Test 12: Error Handling

**Test error scenarios:**

1. **Corrupted Archive**: Try to open invalid .tre file
   - Expected: User-friendly error message

2. **Extraction to Read-Only**: Extract to protected folder
   - Expected: Permission error with clear message

3. **Missing Dependencies**: Try file operations without permissions
   - Expected: Appropriate error messages

4. **Large Archives**: Test with 1000+ files
   - Expected: Progress indicators, no freezing

---

## Test 13: Performance

**Steps:**
1. Open workspace with 10+ TRE archives
2. Expand multiple archives simultaneously
3. Extract large files (>10MB)
4. Build archive from large directory

**Expected Result:**
- UI remains responsive
- Progress indicators work
- No memory leaks
- Can cancel long operations

---

## Test 14: Branding

**Verify WPS theme:**

- **Colors**: Purple (#9b59b6) used throughout
- **Dark backgrounds**: Consistent #0a0a0a to #1a1a1a gradients
- **Icons**: SVG icons visible and purple-themed
- **Typography**: Consistent fonts (Segoe UI)
- **Copyright**: Visible in webviews and documentation

---

## Test 15: Integration (Optional)

**If other SWG extensions installed:**

1. Open .iff file from TRE → Should open in IFF Editor
2. Open .tab file from TRE → Should open in DataTable Editor
3. Open .stf file from TRE → Should open in STF Editor

**Expected:** Files extract to temp and open in respective editors

---

## Test 16: Edge Cases

**Test unusual scenarios:**

1. **Empty Archive**: Open TRE with 0 files
2. **Very Long Paths**: Files with deep directory nesting
3. **Special Characters**: Files with unicode names
4. **Large File Names**: Names >100 characters
5. **Duplicate CRCs**: Multiple files with same hash

---

## Test 17: Documentation

**Verify all documentation:**

1. README.md - Clear instructions, all sections complete
2. CHANGELOG.md - Version history accurate
3. CONTRIBUTING.md - Contribution guidelines clear
4. LICENSE - MIT license present
5. COMPLETION_SUMMARY.md - Accurate feature list

---

## Test 18: Package Preparation

**Before publishing:**

```bash
# Install VSCE
npm install -g vsce

# Package extension
vsce package

# Expected: swg-tre-manager-1.0.0.vsix created
```

**Test VSIX:**
1. Install from VSIX in VS Code
2. Verify extension loads correctly
3. Test core features work

---

## Test 19: Final Verification

**Checklist before publish:**

- [ ] All tests above pass
- [ ] No console errors
- [ ] No TypeScript compilation errors
- [ ] README has screenshots (or placeholders)
- [ ] Icon appears correctly (128x128 PNG)
- [ ] Publisher name correct
- [ ] Repository links work
- [ ] License is MIT
- [ ] Version number is correct (1.0.0)
- [ ] Keywords for discoverability added

---

## Known Limitations

Document any known issues:

- Search functionality is placeholder (shows "not yet implemented")
- Virtual file system (tre:// protocol) not yet implemented
- Integration with other extensions requires them to be installed
- Very large archives (>10,000 files) may be slow to index

---

## Reporting Issues

If bugs found during testing:

1. Document exact steps to reproduce
2. Include VS Code version
3. Include extension version
4. Attach sample TRE file if possible
5. Check Debug Console for errors
6. Take screenshots if UI issue

---

## Success Criteria

**Extension is ready for publication when:**

✅ All core features work correctly
✅ No critical bugs or errors
✅ Documentation is complete
✅ Branding is consistent
✅ Performance is acceptable
✅ User experience is intuitive
✅ Package builds successfully

---

**Last Updated:** December 2024
**Extension Version:** 1.0.0
**Status:** Ready for Testing ✅
