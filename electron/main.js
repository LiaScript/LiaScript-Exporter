const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');

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
}

app.whenReady().then(() => {
  createWindow();
  
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