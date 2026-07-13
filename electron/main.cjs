const { app, BrowserWindow, globalShortcut } = require('electron')
const path = require('node:path')

const isDev = !!process.env.VITE_DEV_SERVER_URL

let win = null

function createWindow() {
  win = new BrowserWindow({
    width: 1280,
    height: 820,
    minWidth: 900,
    minHeight: 640,
    backgroundColor: '#0b140d',
    show: false,
    autoHideMenuBar: true,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
    },
  })

  // --- The real protection ---------------------------------------------------
  // OS-level DRM flag: the window's pixels are excluded from screen capture.
  // Snipping Tool / Win+Shift+S / PrintScreen / OBS / Zoom share all record
  // BLACK where this window is. Enforced by Windows/macOS, not by JS timing.
  win.setContentProtection(true)

  win.once('ready-to-show', () => win.show())

  if (isDev) {
    win.loadURL(process.env.VITE_DEV_SERVER_URL)
  } else {
    win.loadFile(path.join(__dirname, '..', 'dist', 'index.html'))
  }
}

app.whenReady().then(() => {
  createWindow()

  // Belt-and-suspenders: swallow the PrintScreen key at the OS level too.
  globalShortcut.register('PrintScreen', () => {})
  globalShortcut.register('Alt+PrintScreen', () => {})

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('will-quit', () => globalShortcut.unregisterAll())

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
