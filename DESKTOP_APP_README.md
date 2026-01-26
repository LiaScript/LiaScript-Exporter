# LiaScript Exporter Desktop Application

This document describes the Electron desktop application implementation for LiaScript-Exporter.

## Overview

The LiaScript-Exporter has been converted into native desktop executables for Windows, macOS, and Linux using Electron and electron-builder. The desktop app wraps the existing Node.js CLI and web server into a standalone application.

## Building the Desktop App

### Prerequisites

```bash
npm install
```

### Build Commands

```bash
# Quick build (Linux AppImage only)
npm run electron:build:quick

# Linux builds (AppImage, deb, rpm, tar.gz)
npm run electron:build:linux

# Windows builds (NSIS installer, portable, zip)
npm run electron:build:win

# macOS builds (DMG, zip)
npm run electron:build:mac

# All platforms
npm run electron:build:all
```

### Development Mode

```bash
npm run electron:dev
```

## Architecture

### Key Files

- **`electron/main.js`** - Main Electron process, window management
- **`electron/preload.js`** - Preload script for security context isolation
- **`electron/server-wrapper.js`** - Wraps the existing Fastify server
- **`electron/scripts/post-build.sh`** - Post-build script for Linux packages
- **`electron/scripts/after-pack.js`** - After-pack hook for electron-builder
- **`electron-builder.json`** - Electron-builder configuration

### How It Works

1. Electron starts and launches the main process (`main.js`)
2. Main process starts the embedded Fastify server on a random port
3. Main process creates a BrowserWindow and loads `http://localhost:{port}`
4. User interacts with the existing web UI
5. Server processes export jobs using the existing CLI

## Linux Sandbox Solution

Electron apps on Linux require special handling for the Chromium sandbox. We use a **multi-layer approach**:

### 1. Programmatic Flag (electron/main.js)

```javascript
if (process.platform === 'linux') {
  app.commandLine.appendSwitch('no-sandbox');
  app.commandLine.appendSwitch('disable-features', 'WebRtcHideLocalIpsWithMdns');
}
```

This ensures the app works when launched directly from terminal or file manager.

### 2. Desktop Launcher Modification (post-build.sh)

The post-build script modifies desktop files in all Linux packages:
- `.deb` packages → Updates `/usr/share/applications/liascript-exporter.desktop`
- `.rpm` packages → Updates `/usr/share/applications/liascript-exporter.desktop`
- `.AppImage` → Updates `AppRun` script and desktop file inside AppImage
- `.tar.gz` → Updates included desktop file

It adds `--no-sandbox` to the `Exec` line:

```ini
[Desktop Entry]
Exec=liascript-exporter --no-sandbox %U
```

For AppImage, it also modifies the `AppRun` script:

```bash
exec "$BIN" --no-sandbox
```

### 3. Build Integration

The post-build script runs automatically:

```json
{
  "scripts": {
    "electron:build:linux": "... && bash electron/scripts/post-build.sh",
    "electron:build:quick": "... && bash electron/scripts/post-build.sh"
  }
}
```

## Package Structure

### AppImage
- Self-contained executable
- No installation required
- Works on most Linux distributions
- Requires FUSE or can be extracted

### .deb (Debian/Ubuntu)
- Installs to `/opt/LiaScript-Exporter/`
- Desktop launcher in application menu
- Executable: `liascript-exporter`

### .rpm (Fedora/RHEL/openSUSE)
- Similar to .deb
- For RPM-based distributions

### tar.gz
- Portable archive
- Extract and run anywhere

## Known Limitations

1. **Assets Required for Exports**: The `dist/assets` directory is required for xAPI, SCORM, and other exports. This can be generated with:
   ```bash
   npm run build:assets
   ```
   Or pre-built assets can be provided.

2. **Sandbox Security Trade-off**: Disabling the sandbox reduces security isolation but is necessary for AppImage compatibility and running in restricted environments.

3. **AppImage Rebuilding**: The post-build script requires `appimagetool` to be installed:
   ```bash
   wget -O /tmp/appimagetool https://github.com/AppImage/AppImageKit/releases/download/continuous/appimagetool-x86_64.AppImage
   chmod +x /tmp/appimagetool
   sudo mv /tmp/appimagetool /usr/local/bin/
   ```

## Configuration

### electron-builder.json

Key configuration:
- **productName**: "LiaScript-Exporter" (no spaces for proper paths)
- **appId**: "org.liascript.exporter"
- **asar**: Enabled with unpacking for all source and dependencies
- **asarUnpack**: Unpacks dist, src, node_modules, tsconfig.json for CLI execution

### Package.json Changes

- Moved `ts-node` and `typescript` to `dependencies` (required at runtime)
- Added Electron scripts for building and development
- Configured `main` field to point to `electron/main.js`

## File Dialog Fix (Linux)

To avoid XDG Desktop Portal issues on Linux:

```javascript
// In electron/main.js (before importing electron)
if (process.platform === 'linux') {
  process.env.GTK_USE_PORTAL = '0';
  process.env.ELECTRON_TRASH = 'gio';
}
```

This forces the GTK file chooser instead of the portal, preventing "invalid filter: name is empty" errors.

## Electron Environment Detection

The code detects when running in Electron and adjusts paths accordingly:

```javascript
// In jobQueue.ts and export.ts
if (process.versions.electron) {
  const resourcesPath = (process as any).resourcesPath;
  // Use paths relative to app.asar.unpacked
}
```

## Testing

### Test AppImage
```bash
./release/LiaScript-Exporter-*.AppImage
```

### Test Installed .deb
```bash
sudo dpkg -i release/@liascript/exporter-*.deb
liascript-exporter
# Or launch from application menu
```

### Verify --no-sandbox Flag
```bash
ps aux | grep liascript-exporter | grep "\-\-no-sandbox"
```

You should see processes with `--no-sandbox` in the command line.

## Troubleshooting

### App Won't Start
- Check if running with `--no-sandbox` flag
- Verify `/dev/shm` permissions
- Try running from terminal to see error messages

### Exports Fail
- Ensure `dist/assets` directory exists
- Run `npm run build:assets` to generate assets
- Check server logs in terminal

### File Upload Issues
- Ensure GTK_USE_PORTAL is set to '0' on Linux
- Check that the file input doesn't have restrictive `accept` attributes

## Production Deployment

For production use:
1. Build all platform packages: `npm run electron:build:all`
2. Generate assets: `npm run build:assets`
3. Test each package format
4. Distribute via GitHub releases or download server

## Security Considerations

Disabling the sandbox is necessary but reduces security. For enterprise deployments:
- Use native packages (.deb/.rpm) instead of AppImage when possible
- Run with appropriate user permissions (not root)
- Configure AppArmor/SELinux profiles if needed
- Properly configure `/dev/shm` permissions

## Related Resources

- [Electron Documentation](https://www.electronjs.org/docs)
- [electron-builder](https://www.electron.build/)
- [Chromium Sandbox on Linux](https://chromium.googlesource.com/chromium/src/+/master/docs/linux/sandboxing.md)
- [AppImage Documentation](https://docs.appimage.org/)
