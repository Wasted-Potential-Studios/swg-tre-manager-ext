# Installing the Updated Extension

## Fix for Duplicate Buttons Issue

The duplicate button issue has been fixed in version 1.0.1. To install the updated version:

### Step 1: Uninstall Current Version
1. Open VS Code Extensions panel (Ctrl+Shift+X)
2. Search for "SWG TRE Archive Manager" or "swg-tre-manager"
3. Click the gear icon on the extension
4. Select "Uninstall"

### Step 2: Reload VS Code
1. Press `Ctrl+Shift+P` to open Command Palette
2. Type "Reload Window" and press Enter
3. OR simply close and reopen VS Code

### Step 3: Install New Version
1. Press `Ctrl+Shift+P` to open Command Palette
2. Type "Extensions: Install from VSIX..."
3. Navigate to: `c:\Users\Joseph Ridder\Documents\SWG-Source\swg-tre-manager\swg-tre-manager-1.0.1.vsix`
4. Click "Install"

### Step 4: Verify Fix
1. Open the SWG TRE Manager view in the Activity Bar (left sidebar)
2. Look at the toolbar buttons at the top of the "TRE Archives" view
3. You should now see exactly **3 buttons** (not 6):
   - 🔄 Refresh TRE Archives
   - 🔍 Search in TRE Archives
   - 📦 Build New TRE Archive

## What Was Fixed

**Problem**: When multiple workspace folders were open, the toolbar buttons appeared twice (6 buttons instead of 3).

**Solution**: Added explicit sort orders (`navigation@1`, `navigation@2`, `navigation@3`) to the view title menu contributions in package.json to ensure each button is registered only once with proper positioning.

## If Issues Persist

If you still see duplicate buttons after following these steps:

1. **Check VS Code version**: Make sure you're running VS Code 1.85.0 or higher
2. **Check for conflicting extensions**: Temporarily disable other extensions to rule out conflicts
3. **Clear extension cache**:
   - Close VS Code
   - Delete: `%USERPROFILE%\.vscode\extensions\wastedpotentialstudiosllc.swg-tre-manager-*`
   - Reinstall the extension
4. **Report the issue**: If none of the above works, please report this with:
   - Your VS Code version
   - Number of workspace folders open
   - Screenshot of the duplicate buttons

## Version Information
- **Old Version**: 1.0.0 (had duplicate buttons with multi-root workspaces)
- **New Version**: 1.0.1 (duplicate buttons fixed)
- **Package File**: `swg-tre-manager-1.0.1.vsix`
- **Package Size**: 1.91 MB
