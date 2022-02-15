const { app, Tray, Menu } = require('electron');
const path = require('path');
const { ipcMain } = require('electron');

class TrayGenerator {

  constructor(mainWindow) {
    this.tray = null;
    this.mainWindow = mainWindow;
  }




  getWindowPosition = () => {
    const windowBounds = this.mainWindow.getBounds();
    const trayBounds = this.tray.getBounds();
    var x
    var y
      if (process.platform !== 'darwin') {
       x = Math.round(trayBounds.x + (trayBounds.width / 2) - (windowBounds.width / 2) - 50);
       y = Math.round(trayBounds.y  - 500);
    }
    else{
       x = Math.round(trayBounds.x + (trayBounds.width / 2) - (windowBounds.width / 2));
       y = Math.round(trayBounds.y  + trayBounds.height);
    }
    return { x, y };
  };

  showWindow = () => {
    // console.log('showWindow')
    this.mainWindow.webContents.send('MSG_SHOW_PLOT', 'showPlot');
    const position = this.getWindowPosition();
    this.mainWindow.setPosition(position.x, position.y, false);
    this.mainWindow.show();
    this.mainWindow.setVisibleOnAllWorkspaces(true);
    this.mainWindow.focus();
    this.mainWindow.setVisibleOnAllWorkspaces(false);
  };

  toggleWindow = () => {
    // console.log('toggleWindow')

   if (this.mainWindow.isVisible()) {
     //for windows
     if (process.platform !== 'darwin') {
       this.mainWindow.setSkipTaskbar(true);
     }
     //for mac
     else{
       app.dock.hide();
     }

     this.mainWindow.hide();

    } else {
      this.showWindow();
      if (process.platform !== 'darwin') {
        this.mainWindow.setSkipTaskbar(true);
      }
      else{
        app.dock.hide();
      }
      this.mainWindow.show();

    }
  };

  closeWindow = () => {
    // console.log('toggleWindow')

    this.mainWindow.close()
  };


  rightClickMenu = () => {
    const menu = [
      {
        role: 'quit',
        accelerator: 'Command+Q'
      }
    ];
    this.tray.popUpContextMenu(Menu.buildFromTemplate(menu));
  }

  createTray = () => {

    this.tray = new Tray(path.join(__dirname,'./assets/icons/tray/trayTemplate.png'));
    this.tray.setIgnoreDoubleClickEvents(true);

    this.tray.on('click', this.toggleWindow);
    this.tray.on('right-click', this.rightClickMenu);
  };
}

module.exports = TrayGenerator;
