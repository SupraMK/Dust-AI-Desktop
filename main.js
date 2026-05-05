const { app, BrowserWindow, shell, Menu, Tray, globalShortcut, nativeImage } = require('electron');
const path = require('path');
const Store = require('electron-store');

// ─── MODE DEBUG ────────────────────────────────────────────────────────────
const DEBUG = false;
const log = (...args) => DEBUG && console.log(...args);

app.setName('Dust AI');

const store = new Store();
let mainWindow = null;
let splashWindow = null;
let tray = null;
const DUST_URL = 'https://app.dust.tt';
const CHROME_UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

// ─── Domaines autorisés ────────────────────────────────────────────────────
const ALLOWED_PATTERNS = [
  /\.?dust\.tt$/,
  /\.?workos\.com$/,
  /\.?microsoftonline\.com$/,
  /\.?microsoft\.com$/,
  /\.?live\.com$/,
  /\.?msauth\.net$/,
  /\.?msftauth\.net$/,
  /\.?google\.com$/,
  /\.?github\.com$/,
  /\.?okta\.com$/,
];

function isAllowedUrl(url) {
  try {
    const { hostname } = new URL(url);
    return ALLOWED_PATTERNS.some(pattern => pattern.test(hostname));
  } catch {
    return false;
  }
}

// ─── Singleton ─────────────────────────────────────────────────────────────
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.show();
      mainWindow.focus();
    }
  });
}

// ─── Splashscreen ──────────────────────────────────────────────────────────
function createSplash() {
  splashWindow = new BrowserWindow({
    width: 320,
    height: 380,
    frame: false,
    transparent: true,
    resizable: false,
    movable: true,
    center: true,
    alwaysOnTop: true,
    skipTaskbar: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    }
  });

  splashWindow.loadFile(path.join(__dirname, 'splash.html'));
}

// ─── Fenêtre principale ────────────────────────────────────────────────────
function createWindow() {
  const savedBounds = store.get('windowBounds', { width: 1280, height: 860 });

  mainWindow = new BrowserWindow({
    ...savedBounds,
    minWidth: 800,
    minHeight: 600,
    title: 'Dust AI',
    titleBarStyle: 'default',
    backgroundColor: '#0F0F10',
    icon: path.join(__dirname, 'assets', 'icon.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      spellcheck: true,
      partition: 'persist:dust'
    },
    show: false   // cachée jusqu'à ce que Dust soit chargé
  });

  mainWindow.webContents.setUserAgent(CHROME_UA);
  mainWindow.loadURL(DUST_URL);

  mainWindow.webContents.on('page-title-updated', (e) => {
    e.preventDefault();
  });

  // ─── Ferme le splash + affiche l'app quand Dust est prêt ────────────
  mainWindow.webContents.on('did-finish-load', () => {
    setTimeout(() => {
      if (splashWindow && !splashWindow.isDestroyed()) {
        splashWindow.close();
        splashWindow = null;
      }
      mainWindow.show();
      mainWindow.focus();
    }, 2000); // légère pause pour un rendu propre
  });

  mainWindow.on('close', (e) => {
    store.set('windowBounds', mainWindow.getBounds());
    if (!app.isQuiting) {
      e.preventDefault();
      mainWindow.hide();
    }
  });

  mainWindow.webContents.on('will-navigate', (event, url) => {
    log('[NAV]', url.substring(0, 120));
    if (!isAllowedUrl(url)) {
      log('[BLOCKED → external]', url.substring(0, 120));
      event.preventDefault();
      shell.openExternal(url);
    }
  });

  mainWindow.webContents.on('will-redirect', (event, url) => {
    log('[REDIRECT]', url.substring(0, 120));
  });

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    log('[POPUP]', url.substring(0, 120));
    if (isAllowedUrl(url)) {
      mainWindow.loadURL(url);
    } else {
      shell.openExternal(url);
    }
    return { action: 'deny' };
  });

  mainWindow.webContents.on('did-navigate', (event, url) => {
    if (url.startsWith('https://app.dust.tt')) {
      mainWindow.setTitle('Dust AI');
    }
  });
}

// ─── Tray avec icône Template (mode clair/sombre auto) ────────────────────
function createTray() {
  const iconPath = path.join(__dirname, 'assets', 'tray-icon.png');

  const trayIcon = nativeImage.createFromPath(iconPath).resize({ width: 18, height: 18 });

  tray = new Tray(trayIcon);

  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Ouvrir Dust AI',
      click: () => { mainWindow.show(); mainWindow.focus(); }
    },
    { type: 'separator' },
    {
      label: 'Recharger',
      accelerator: 'CmdOrCtrl+R',
      click: () => mainWindow.webContents.reload()
    },
    { type: 'separator' },
    {
      label: 'Quitter Dust AI',
      accelerator: 'CmdOrCtrl+Q',
      click: () => { app.isQuiting = true; app.quit(); }
    }
  ]);

  tray.setToolTip('Dust AI');
  tray.setContextMenu(contextMenu);
  tray.on('click', () => {
    if (mainWindow.isVisible()) {
      mainWindow.hide();
    } else {
      mainWindow.show();
      mainWindow.focus();
    }
  });
}

// ─── Menu natif macOS ──────────────────────────────────────────────────────
function createAppMenu() {
  const template = [
    {
      label: 'Dust AI',
      submenu: [
        { label: 'À propos de Dust AI', role: 'about' },
        { type: 'separator' },
        { label: 'Services', role: 'services' },
        { type: 'separator' },
        { label: 'Masquer Dust AI', role: 'hide' },
        { label: 'Masquer les autres', role: 'hideOthers' },
        { label: 'Tout afficher', role: 'unhide' },
        { type: 'separator' },
        {
          label: 'Quitter Dust AI',
          accelerator: 'CmdOrCtrl+Q',
          click: () => { app.isQuiting = true; app.quit(); }
        }
      ]
    },
    {
      label: 'Édition',
      submenu: [
        { label: 'Annuler', role: 'undo' },
        { label: 'Rétablir', role: 'redo' },
        { type: 'separator' },
        { label: 'Couper', role: 'cut' },
        { label: 'Copier', role: 'copy' },
        { label: 'Coller', role: 'paste' },
        { label: 'Tout sélectionner', role: 'selectAll' }
      ]
    },
    {
      label: 'Affichage',
      submenu: [
        {
          label: 'Recharger',
          accelerator: 'CmdOrCtrl+R',
          click: () => mainWindow.webContents.reload()
        },
        { type: 'separator' },
        { label: 'Zoom avant', role: 'zoomIn' },
        { label: 'Zoom arrière', role: 'zoomOut' },
        { label: 'Taille réelle', role: 'resetZoom' },
        { type: 'separator' },
        { label: 'Plein écran', role: 'togglefullscreen' }
      ]
    },
    {
      label: 'Fenêtre',
      submenu: [
        { label: 'Réduire', role: 'minimize' },
        { label: 'Agrandir', role: 'zoom' },
        { type: 'separator' },
        { label: 'Mettre au premier plan', role: 'front' }
      ]
    }
  ];
  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

// ─── Raccourci global ──────────────────────────────────────────────────────
function registerShortcuts() {
  globalShortcut.register('CommandOrControl+Shift+D', () => {
    if (mainWindow.isVisible() && mainWindow.isFocused()) {
      mainWindow.hide();
    } else {
      mainWindow.show();
      mainWindow.focus();
    }
  });
}

// ─── Événements app ────────────────────────────────────────────────────────
app.whenReady().then(() => {
  if (process.platform === 'darwin') {
    app.dock.setIcon(path.join(__dirname, 'assets', 'icon.png'));
  }
  createSplash();   // 1. Splash en premier
  createWindow();   // 2. Fenêtre principale en arrière-plan
  createTray();
  createAppMenu();
  registerShortcuts();
});

app.on('activate', () => {
  if (mainWindow) { mainWindow.show(); mainWindow.focus(); }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('will-quit', () => {
  globalShortcut.unregisterAll();
});

app.on('before-quit', () => {
  app.isQuiting = true;
});