// Modules to control application life and create native browser window
const electron = require('electron')
const date = require('date-and-time');
const axios = require('axios');
const fs = require('fs')
const { is } = require('electron-util');
const TrayGenerator = require('./TrayGenerator');

const {app, BrowserWindow } = electron
const path = require('path')




//required so that app can start on device launch
var AutoLaunch = require('auto-launch');
var autoLauncher = new AutoLaunch({
    name: "electron-quick-start"
});
// Checking if autoLaunch is enabled, if not then enabling it.
autoLauncher.isEnabled().then(function(isEnabled) {
  if (isEnabled) return;
   autoLauncher.enable();
}).catch(function (err) {
  throw err;
});

let mainWindow = null;

function createWindow () {
  // Create the browser window.
 mainWindow = new BrowserWindow({
    width: 250,
    height: 450,
    webPreferences: {
      nodeIntegration : true,
      worldSafeExecuteJavaScript: true,
      enableRemoteModule: true
    },
    show: false,
    frame: false,
    fullscreenable: false,
    resizable: false
  })

 mainWindow.loadFile('login.html')
 mainWindow.webContents.openDevTools
 mainWindow.on('restore', () => {
     console.log('mainWindow restore')
     mainWindow.show();

     // mainWindow.setSkipTaskbar(false)
 })

 mainWindow.on('minimize', (event) => {
   console.log('mainWindow minimize')
   event.preventDefault();
   mainWindow.hide();
     // mainWindow.setSkipTaskbar(true)
 })

}


// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
let Tray = null
app.whenReady().then(() => {

  createWindow();
  Tray = new TrayGenerator(mainWindow);
  Tray.createTray();

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.dock.hide();

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit()
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
