// Modules to control application life and create native browser window
const electron = require('electron')
const date = require('date-and-time');
const axios = require('axios');
const fs = require('fs')
const { is } = require('electron-util');
const os = require('os');
const { ipcMain } = require('electron')
const TrayGenerator = require('./TrayGenerator');

const {app, BrowserWindow } = electron
const path = require('path')

//process.noAsar = true
//required so that app can start on device launch
var AutoLaunch = require('easy-auto-launch');
var autoLauncher
if (process.platform !== 'darwin') {

  const exeName = path.basename(process.execPath)

  app.setLoginItemSettings({
    openAtLogin: true,
    path: app.getPath('exe'),
    args: [
      '--processStart', `"${exeName}"`,
      '--process-start-args', `"--hidden"`
    ]
  })
}
else{
    autoLauncher = new AutoLaunch({
       name: "screen-time-tracker-app"
   });

   autoLauncher.enable()
   autoLauncher.isEnabled().then(function(isEnabled) {
     if (isEnabled) return;
      autoLauncher.enable();
   }).catch(function (err) {
     throw err;
   });
 }


// Checking if autoLaunch is enabled, if not then enabling it.
let mainWindow = null;

function createWindow () {
  // Create the browser window.
 mainWindow = new BrowserWindow({
    width: 450,
    height: 500,
    webPreferences: {
      nodeIntegration : true,
      worldSafeExecuteJavaScript: true,
      enableRemoteModule: true,
      contextIsolation: false,
    },
    show: false,
    frame: false,
    fullscreenable: false,
    resizable: false,
    skipTaskbar: true
  })

 mainWindow.loadFile('login.html')
 //comment out if you want to debug:
 mainWindow.webContents.openDevTools()
 mainWindow.on('restore', () => {
     console.log('mainWindow restore')
     mainWindow.show();

     // mainWindow.setSkipTaskbar(false)
 })

 mainWindow.on('minimize', (event) => {
   console.log('mainWindow minimize')
   event.preventDefault();
   mainWindow.hide();
 })

 mainWindow.on('close', (event) => {
   if (mainWindow) {
      console.log('sent app-close to renderer')
      event.preventDefault();
      mainWindow.webContents.send('app-close');
    }
   // event.preventDefault();
   // mainWindow.hide();
   //   // mainWindow.setSkipTaskbar(true)
 })

}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
let Tray = null
app.whenReady().then(() => {
  console.log('Electron starting')
  createWindow();
  Tray = new TrayGenerator(mainWindow);
  Tray.createTray();

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

//for windows
if (process.platform !== 'darwin') {
  // mainWindow.setSkipTaskbar(true);
}
//for mac
else{
  app.dock.hide();
}


ipcMain.on('closed', _ => {
  console.log('renderer executed')
  app.quit();

  mainWindow = null
  // if (process.platform !== 'darwin') {
  // }
});



async function makePostRequest(username,computerName){
  try{
    now = new Date();
    let res = await axios.post('https://health-iot.labs.vu.nl/api/idlestate/event',
      {
        userid: username,
        deviceid: computerName,
        collectionTime: Math.floor((now.getTime() - now.getTimezoneOffset() *  60000)/1000),
        eventid: 1
      }
    );

    console.log('main makePostRequest',res.data);
  } catch (err) {
        // Handle Error Here
        console.error(err);
    }
}


function saveCloseState(place){
  console.log('main saveCloseState', place)
  const jsonfile = path.join(app.getPath("userData"),'./userdatastorage.json')

  fs.readFile(jsonfile, 'utf8', (err, userString) => {
      if (err) {
          console.log("main error reading file from disk:", err)
          return
      }
      try {
            var now = new Date();
            console.log('main userData ',userString)
            var user = JSON.parse(userString)
            user.login = true
            user.username = user.username
            user.appClosingTime = Math.floor(now.getTime()/1000)
            // user.functionPlace = place
            fs.writeFile(jsonfile, JSON.stringify(user), (err) => {
                    if (err)
                    {
                      console.log('main userData error writing file:', err)
                    }

            })

          }
     catch(err) {
            console.log('main userData error parsing JSON string:', err)
        }
  })

}

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.

app.on('before-quit', function () {
  console.log('main closing electron:before-quit')

  // saveCloseState("before-quit")

})


app.on('window-all-closed', function () {
  console.log('main losing electron : window-all-closed')
  // saveCloseState("window-all-closed")


  if (process.platform !== 'darwin')
      app.quit()
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
