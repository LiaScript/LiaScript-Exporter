# LiaScript Exporter Desktop Application

Native desktop application wrapping the LiaScript-Exporter CLI and web server using Electron.

## Download

[![GitHub release](https://img.shields.io/github/v/release/LiaScript/LiaScript-Exporter)](https://github.com/LiaScript/LiaScript-Exporter/releases/latest)

Download from [GitHub Releases](https://github.com/LiaScript/LiaScript-Exporter/releases/latest)

### Available Packages

**Windows:**
- `.exe` - NSIS installer with start menu shortcuts
- `-win.zip` - Portable archive

**macOS:**
- `.dmg` - Disk image installer
- `-mac.zip` - Portable archive

**Linux:**
- `.AppImage` - Universal self-contained executable (no installation)
- `.deb` - Debian/Ubuntu package
- `.rpm` - Fedora/RHEL/openSUSE package
- `.tar.gz` - Portable archive

## Development

```bash
# Install dependencies
npm install

# Run in development mode
npm run electron:dev

# Build for current platform
npm run electron:build:linux    # Linux (AppImage, deb, rpm, tar.gz)
npm run electron:build:win      # Windows (requires Wine on Linux)
npm run electron:build:mac      # macOS (requires macOS)

# Quick Linux build (AppImage only)
npm run electron:build:quick
```

## Architecture

The desktop app embeds a Fastify web server that serves the existing UI and handles export operations. The Electron wrapper provides:
- Native file dialogs (replacing browser file input)
- System tray integration
- Auto-updates (when configured)
- Native installers for each platform

**Key files:**
- `electron/main.js` - Main process & window management
- `electron/preload.js` - Security context bridge
- `electron/server-wrapper.js` - Embedded server
- `electron/scripts/after-pack.js` - Build post-processing
- `electron-builder.json` - Package configuration