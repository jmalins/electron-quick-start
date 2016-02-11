'use strict';

const electron = require('electron');
// Module to control application life.
const app = electron.app;
const globalShortcut = electron.globalShortcut;
// Module to create native browser window.
const BrowserWindow = electron.BrowserWindow;

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow;

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
}


app.on('ready', function() {
  createWindow();

  var ret = globalShortcut.register('ctrl+shift+h', function() {
    console.log('ctrl+shift+h is pressed');
    if(mainWindow) {
      mainWindow.focus();
    }
  });

  if(!ret) {
    console.log('registration failed');
  }
});

app.on('window-all-closed', function () {
  app.quit();
});

//app.on('activate', function () { });
app.on('will-quit', function() {
  // Unregister all shortcuts.
  globalShortcut.unregisterAll();
});
