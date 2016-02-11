'use strict';

const electron = require('electron');
// Module to control application life.
const app = electron.app;
const globalShortcut = electron.globalShortcut;
// Module to create native browser window.
const BrowserWindow = electron.BrowserWindow;

const Menu = electron.Menu;
const Tray = electron.Tray;

let mainWindow, appIcon;

function createWindow () {
  mainWindow = new BrowserWindow({ width: 800, height: 100, frame: false });
  mainWindow.loadURL('file://' + __dirname + '/index.html');

  mainWindow.on('closed', function() {
    mainWindow = null;
  });
  mainWindow.on('focus', function(e) {
    console.log('focused!');
    e.sender.webContents.send('focused', 'true');
  });
  mainWindow.on('blur', function(e) {
    e.sender.hide();
  });
}


app.on('ready', function() {
  createWindow();
  //mainWindow.webContents.openDevTools();

  var ret = globalShortcut.register('ctrl+shift+h', function() {
    console.log('ctrl+shift+h is pressed');
    if(mainWindow) {
      mainWindow.show();
    }
  });

  if(!ret) {
    console.log('registration failed');
  }

  appIcon = new Tray(__dirname + '/dr_weird.jpg');
  appIcon.setToolTip('NeauxClicks');
  appIcon.on('click', function(e) {
    mainWindow.show();
  });
  appIcon.on('double-click', function(e) {
    mainWindow.show();
  });
  var contextMenu = Menu.buildFromTemplate([
    { label: 'Quit', click: function() {
        mainWindow.close();
      } 
    }
  ]);
  appIcon.setContextMenu(contextMenu);
});

app.on('window-all-closed', function () {
  console.log('all windows closed');
  app.quit();
});

app.on('will-quit', function() {
  // Unregister all shortcuts.
  globalShortcut.unregisterAll();
});
