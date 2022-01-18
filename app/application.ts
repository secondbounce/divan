import * as fs from 'fs';
import * as path from 'path';
import { BrowserWindow, BrowserWindowConstructorOptions, Menu, MenuItem, MenuItemConstructorOptions } from 'electron';
// TODO: currently getting "Could not find a declaration file for module 'electron-reload'" even though it supposedly supports typings
// import electronReload from 'electron-reload';

import { Channel, MenuCommand } from '../src/app/enums';

export class Application {
  public readonly isMac: boolean;
  private _mainWindow: BrowserWindow | undefined;

  constructor(private _electronApp: Electron.App, private _debugMode: boolean) {
    this.isMac = process.platform === 'darwin';

    _electronApp.on('activate', this.onElectronActivate);
    _electronApp.on('window-all-closed', this.onElectronWindowAllClosed);
  }

  public initialize(): void {
    this.createMainWindow();
  }

  private createMainWindow(): void {
    if (this._mainWindow) {
// TODO: make sure main window is closed?
      this._mainWindow = undefined;
    }

    const mainWindow: BrowserWindow = new BrowserWindow({
      webPreferences: {
        nodeIntegration: true,
        allowRunningInsecureContent: this._debugMode,
        contextIsolation: false  // false if you want to run e2e test with Spectron
      }
    });

    Menu.setApplicationMenu(null);
    const menu: Menu = this.createMainMenu();
    mainWindow.setMenu(menu);

    mainWindow.webContents.setWindowOpenHandler(details => {
      const options: BrowserWindowConstructorOptions = JSON.parse(details.features);
      return {
        action: 'allow',
        overrideBrowserWindowOptions: {
          parent: mainWindow,
          fullscreenable: false,
          skipTaskbar: true,
          ...options
        }
      };
    });

    let appUrl: string;

    if (this._debugMode) {
      mainWindow.webContents.openDevTools();
      // electronReload(__dirname, {
      //   electron: require(path.join(__dirname, '/../node_modules/electron'))
      // });

      appUrl = 'http://localhost:4200';
    } else {
      let pathIndex: string = './index.html';    // Path when running electron executable

      if (fs.existsSync(path.join(__dirname, '../dist/index.html'))) {
        pathIndex = '../dist/index.html';      // Path when running electron in local folder
      }

      const url: URL = new URL('file:///' + path.join(__dirname, pathIndex));
      appUrl = url.toString();
    }

    console.log(`Running from ${appUrl}`);
    mainWindow.loadURL(appUrl);

    this._mainWindow = mainWindow;
    this._mainWindow.on('closed', () => {
      /* Dereference the window object, usually you would store window
        in an array if your app supports multi windows, this is the time
        when you should delete the corresponding element.
      */
      this._mainWindow = undefined;
    });
  }

  private createMainMenu(): Menu {
    const template: Array<MenuItemConstructorOptions | MenuItem> = [
      {
        label: 'File',
        submenu: [
          {
            label: 'Open',
            click: (): void => { this.sendMenuCommand(MenuCommand.OpenServer) }
          },
          { type: 'separator' },
          this.isMac ? { role: 'close' }
                     : { role: 'quit' }
        ]
      }
    ];

    if (this.isMac) {
      template.unshift({
                        label: this._electronApp.name,
                        submenu: [
                          { role: 'about' },
                          { type: 'separator' },
                          { role: 'services' },
                          { type: 'separator' },
                          { role: 'hide' },
                          { role: 'hideOthers' },
                          { role: 'unhide' },
                          { type: 'separator' },
                          { role: 'quit' }
                        ]
                      });
    }

    return Menu.buildFromTemplate(template);
  }

  private sendMenuCommand(menuCommand: MenuCommand): void {
    if (this._mainWindow) {
      this._mainWindow.webContents.send(Channel.MenuCommand, menuCommand);
    }
  }

  private onElectronActivate = (): void => {
    /* On OS X, it's common to re-create a window in the app when the
      dock icon is clicked and there are no other windows open.
    */
    if (BrowserWindow.getAllWindows().length === 0) {
      this.createMainWindow();
    }
  };

  private onElectronWindowAllClosed = (): void => {
    /* On OS X, it's common for applications and their menu bar
      to stay active until the user quits explicitly with Cmd + Q.
    */
    if (!this.isMac) {
      this._electronApp.quit();
    }
  };
}
