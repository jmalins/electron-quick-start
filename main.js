'use strict';

const unity = require('./unity.js');
const spawn = require('child_process').spawn;
const xml2js = require('xml2js');
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

function setPatient(patient) {
  console.log('Patient', patient);
  mainWindow.webContents.send('patientUpdated', patient.ID ? patient: null);
}

function setEncounter(encounter) {
  console.log('Encounter', encounter);
  mainWindow.webContents.send('encounterUpdated', encounter.ID ? encounter: null);
}

function setHIE(hie) {
  console.log('HIE', hie);
  mainWindow.webContents.send('hieUpdated', hie.userID ? hie: null);
}

function uaiData(data) {
  data = data.toString(); // Buffer -> string //
  // FIXME: split on |, really want more robust XML parsing // 
  data.split('|').forEach(s => {
    s = s.trim();
    if(s.length == 0) return;
    if(s.indexOf('<') == 0) {
      xml2js.parseString(s, (err, result) => {
        if(result.PatientContext) {
          setPatient(result.PatientContext);
        } else if(result.EncounterContext) {
          setEncounter(result.EncounterContext);
        } else if(result.HIEContext) {
          setHIE(result.HIEContext);
        } else {
          console.error('invalid XML object', result);
        }
      });
    } else {
      // not an XML message //
      console.log('UAI log: ' + s);
    }
  });
}
function uaiError(data) {
  console.error('UAI error: ' + data);
}

let uai;
function startUAIListener() {
  uai = spawn(__dirname + '/AllscriptsUAIUtility/AllscriptsUAIUtility.exe');
  uai.stdout.on('data', uaiData);
  uai.stderr.on('data', uaiError);

  // connect to UAI server //
  uai.stdin.write('connect\n');
}

function startUnity() {
  unity.getToken((err, token) => {
    if(err) {
      console.error('Could not get unity token: ' + err);
      return;
    } else {
      console.log('Unity token: ' + token);
    }
    /*unity.getUserDetails((err, body) => {
      if(err) console.error('error: ' + err);
      console.log('user details: ' + body);
    });*/
    unity.authEHR((err) => {
      console.log('Unity Ready');
      unity.getServerInfo((err, body) => {
        console.log('unity server: ' + body);
      });
    });
  });
}

app.on('ready', function() {
  createWindow();
  //mainWindow.webContents.openDevTools();
  startUnity();

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
    { label: 'Quit', type: 'normal', click: function() {
        mainWindow.close();
      } 
    }
  ]);
  appIcon.setContextMenu(contextMenu);

  startUAIListener();
});

app.on('window-all-closed', function () {
  console.log('all windows closed');
  app.quit();
});

app.on('will-quit', function(event) {
  // Unregister all shortcuts.
  globalShortcut.unregisterAll();

  // shut down UAI to make sure we disconnect //
  // then continue quitting the application   //
  uai.on('close', (code) => {
    console.log('quitting');
    app.exit(0);
  });
  console.log('shutting down UAI');
  uai.stdin.write('quit\n');
  event.preventDefault();
});

electron.ipcMain.on('boxCommand', function(event, cmd) {
  console.log('command: ' + cmd ? cmd: '<blank>');
  switch(cmd.toLowerCase()) {
    case 'quit':
    case 'exit':
      mainWindow.close();
      break;
    case '':
      mainWindow.hide();
      break;
  }
  if(cmd.indexOf('!') == 0) {
    uai.stdin.write(cmd.substring(1) + '\n');
  }
});
