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

//required so that app can start on device launch
var AutoLaunch = require('auto-launch');
var autoLauncher = new AutoLaunch({
    name: "Screen Time Tracker"
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
    width: 350,
    height: 715,
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
     // mainWindow.setSkipTaskbar(true)
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

app.dock.hide();

ipcMain.on('closed', _ => {
  console.log('renderer executed')
  app.quit();

  mainWindow = null
  // if (process.platform !== 'darwin') {
  // }
});



async function makePostRequest(username,computerName) {
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

    console.log(res.data);
  } catch (err) {
        // Handle Error Here
        console.error(err);
    }
}


function saveCloseState(place){
  console.log('im in saveCloseState with place:', place)
  const jsonfile = path.join(__dirname,'./electronuser.json')

  fs.readFile(jsonfile, 'utf8', (err, userString) => {
      if (err) {
          console.log("Error reading file from disk:", err)
          return
      }
      try {
            var now = new Date();
            console.log('user login details: ',userString)
            var user = JSON.parse(userString)
            user.login = true
            user.username = user.username
            user.appClosingTime = Math.floor((now.getTime() - now.getTimezoneOffset() *  60000)/1000)
            // user.functionPlace = place
            fs.writeFile(jsonfile, JSON.stringify(user), (err) => {
                    if (err)
                    {
                      console.log('Error writing file:', err)
                    }
                    // else{
                    //   location.href = 'landing.html'
                    // }
            })
            //
            // ipcRenderer.send('closed');
          }
     catch(err) {
            console.log('Error parsing JSON string:', err)
        }
  })

}

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.

app.on('before-quit', function () {
  console.log('closing electron:before-quit')

  saveCloseState("before-quit")

})


app.on('window-all-closed', function () {
  console.log('closing electron : window-all-closed')


  saveCloseState("window-all-closed")


  if (process.platform !== 'darwin')
      app.quit()
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
