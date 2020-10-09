const { app, Tray, Menu } = require('electron');
const path = require('path');
const { ipcMain } = require('electron');

class TrayGenerator {

  constructor(mainWindow) {
    this.tray = null;
    this.mainWindow = mainWindow;
  }

  getWindowPosition = () => {
    // console.log('getWindowPosition')

    const windowBounds = this.mainWindow.getBounds();
    const trayBounds = this.tray.getBounds();
    const x = Math.round(trayBounds.x + (trayBounds.width / 2) - (windowBounds.width / 2));
    const y = Math.round(trayBounds.y + trayBounds.height);
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

       this.mainWindow.hide();
       app.dock.hide();

     } else {
       this.showWindow();
       app.dock.hide();
       this.mainWindow.show();

     }
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