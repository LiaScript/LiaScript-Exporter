/**
 * Electron Preload Script
 * 
 * This script runs in the renderer process before the web page loads.
 * It provides a secure bridge between the renderer and main process.
 */

const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // Platform information
  platform: process.platform,
  
  // Version information
  versions: {
    node: process.versions.node,
    chrome: process.versions.chrome,
    electron: process.versions.electron,
  },
  
  // File dialog
  openFileDialog: () => ipcRenderer.invoke('dialog:openFile'),

  // Update check
  checkForUpdates: () => ipcRenderer.invoke('app:checkForUpdates'),
  downloadUpdate: () => ipcRenderer.invoke('app:downloadUpdate'),
  installUpdate: () => ipcRenderer.invoke('app:installUpdate'),
  openExternal: (url) => ipcRenderer.invoke('shell:openExternal', url),
  onUpdateAvailable: (cb) => ipcRenderer.on('update:available', (_e, data) => cb(data)),
  onUpdateProgress: (cb) => ipcRenderer.on('update:progress', (_e, data) => cb(data)),
  onUpdateDownloaded: (cb) => ipcRenderer.on('update:downloaded', () => cb()),
  onUpdateError: (cb) => ipcRenderer.on('update:error', (_e, data) => cb(data)),
});

// Log that the preload script has loaded
console.log('Electron preload script loaded');
