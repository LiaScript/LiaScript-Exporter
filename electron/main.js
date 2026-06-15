const { app, BrowserWindow, ipcMain, dialog, shell, globalShortcut } = require('electron');
const path = require('path');
const fs = require('fs');
const https = require('https');
const { autoUpdater } = require('electron-updater');

// App version, normalized to strip the `--<electron-version>` suffix (e.g. 3.2.10--1.0.8 -> 3.2.10)
const APP_VERSION = require('../package.json').version.replace(/--.*$/, '');

let mainWindow;
let serverInstance;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false,
      preload: path.join(__dirname, 'preload.js'),
      devTools: true
    },
    icon: path.join(__dirname, 'build', 'icons', '512x512.png')
  });

  // Start the server
  const serverWrapper = require('./server-wrapper');
  serverWrapper.startServer()
    .then((instance) => {
      serverInstance = instance;
      const port = instance.server.address().port;
      console.log(`Server started on port ${port}`);
      mainWindow.loadURL(`http://localhost:${port}`);
    })
    .catch((error) => {
      console.error('Failed to start server:', error);
      app.quit();
    });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  globalShortcut.register('F12', () => {
    if (mainWindow) mainWindow.webContents.toggleDevTools();
  });
}

app.whenReady().then(() => {
  createWindow();
  
  // Register IPC handler for opening external URLs
  ipcMain.handle('shell:openExternal', async (event, url) => {
    await shell.openExternal(url);
  });

  // Auto-updater setup. Self-updatable formats download + install in-app; anything
  // else falls back to opening the GitHub releases page for a manual download.
  autoUpdater.autoDownload = false;
  autoUpdater.autoInstallOnAppQuit = false;
  autoUpdater.channel = 'latest';
  autoUpdater.allowPrerelease = false;

  // deb/rpm/pacman self-update via the system package manager (prompts for sudo at install time).
  const updatableFormats = ['appimage', 'nsis', 'dmg', 'deb', 'rpm', 'pacman'];

  function getInstallerType() {
    if (process.platform === 'linux') {
      if (process.env.APPIMAGE) return 'appimage';
      try {
        return fs.readFileSync(path.join(process.resourcesPath, 'package-type'), 'utf8').trim() || 'other';
      } catch {
        return 'other';
      }
    }
    if (process.platform === 'win32') return fs.existsSync(path.join(process.resourcesPath, '..', 'Uninstall LiaScript-Exporter.exe')) ? 'nsis' : 'other';
    if (process.platform === 'darwin') return 'dmg';
    return 'other';
  }

  autoUpdater.on('update-available', (info) => {
    if (mainWindow) mainWindow.webContents.send('update:available', { version: info.version });
  });

  autoUpdater.on('download-progress', (progress) => {
    if (mainWindow) mainWindow.webContents.send('update:progress', { percent: Math.round(progress.percent) });
  });

  autoUpdater.on('update-downloaded', () => {
    if (mainWindow) mainWindow.webContents.send('update:downloaded');
  });

  autoUpdater.on('error', (err) => {
    if (mainWindow) mainWindow.webContents.send('update:error', { message: err && (err.message || String(err)) });
  });

  ipcMain.handle('app:checkForUpdates', async () => {
    if (!updatableFormats.includes(getInstallerType())) {
      // Fallback: check GitHub API and return release URL for unsupported formats
      return new Promise((resolve) => {
        https.get({
          hostname: 'api.github.com',
          path: '/repos/LiaScript/LiaScript-Exporter/releases/latest',
          headers: { 'User-Agent': 'LiaScript-Exporter' }
        }, (res) => {
          let data = '';
          res.on('data', (chunk) => { data += chunk; });
          res.on('end', () => {
            try {
              const release = JSON.parse(data);
              const latestVersion = release.tag_name.replace(/^v/, '');
              resolve({
                supported: false,
                hasUpdate: latestVersion !== APP_VERSION,
                releaseUrl: release.html_url
              });
            } catch {
              resolve({ supported: false, hasUpdate: false });
            }
          });
        }).on('error', () => resolve({ supported: false, hasUpdate: false }));
      });
    }
    try {
      const result = await autoUpdater.checkForUpdates();
      const hasUpdate = !!result?.isUpdateAvailable;
      return { supported: true, hasUpdate, version: result?.updateInfo?.version };
    } catch (e) {
      console.error('[update-check] autoUpdater error:', e.message);
      return { supported: false, hasUpdate: false };
    }
  });

  ipcMain.handle('app:downloadUpdate', async () => {
    await autoUpdater.downloadUpdate();
  });

  ipcMain.handle('app:installUpdate', () => {
    autoUpdater.quitAndInstall();
  });

  // Register IPC handler for file dialog
  ipcMain.handle('dialog:openFile', async () => {
    const result = await dialog.showOpenDialog(mainWindow, {
      properties: ['openFile', 'multiSelections'],
      filters: [
        { name: 'Supported Files', extensions: ['zip', 'md', 'txt', 'json', 'yml', 'yaml'] },
        { name: 'ZIP Archives', extensions: ['zip'] },
        { name: 'Markdown', extensions: ['md', 'markdown'] },
        { name: 'Text Files', extensions: ['txt'] },
        { name: 'Config Files', extensions: ['json', 'yml', 'yaml'] }
      ]
    });

    if (result.canceled) {
      return { canceled: true, filePaths: [] };
    }

    const files = await Promise.all(
      result.filePaths.map(async (filePath) => {
        const content = await fs.promises.readFile(filePath);
        const stat = await fs.promises.stat(filePath);
        return {
          name: path.basename(filePath),
          path: filePath,
          size: stat.size,
          type: '',
          lastModified: stat.mtimeMs,
          content: content.toString('base64')
        };
      })
    );

    return { canceled: false, files };
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});

app.on('before-quit', async () => {
  if (serverInstance) {
    try {
      await serverInstance.close();
      console.log('Server closed successfully');
    } catch (error) {
      console.error('Error closing server:', error);
    }
  }
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught exception:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled rejection at:', promise, 'reason:', reason);
});