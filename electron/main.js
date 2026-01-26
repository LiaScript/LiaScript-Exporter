// Set environment variables BEFORE importing electron
if (process.platform === 'linux') {
  // Force GTK file chooser instead of portal to avoid filter issues
  process.env.GTK_USE_PORTAL = '0';
  process.env.ELECTRON_TRASH = 'gio';
}

const { app, BrowserWindow } = require('electron');
const path = require('path');

// Disable sandbox for Linux (required for AppImage)
if (process.platform === 'linux') {
  app.commandLine.appendSwitch('no-sandbox');
  app.commandLine.appendSwitch('disable-features', 'WebRtcHideLocalIpsWithMdns');
}

let mainWindow;
let serverInstance;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
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
      
      // Load the app
      mainWindow.loadURL(`http://localhost:${port}`);
    })
    .catch((error) => {
      console.error('Failed to start server:', error);
      app.quit();
    });

  // Open DevTools in development
  if (process.env.NODE_ENV === 'development') {
    mainWindow.webContents.openDevTools();
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.on('ready', createWindow);

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

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught exception:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled rejection at:', promise, 'reason:', reason);
});
