import * as fs from 'fs';
import * as path from 'path';
import { BrowserWindow, BrowserWindowConstructorOptions, ipcMain, Menu, MenuItemConstructorOptions } from 'electron';
// TODO: currently getting "Could not find a declaration file for module 'electron-reload'" even though it supposedly supports typings
// import electronReload from 'electron-reload';

import { ServerCredentials } from '../src/app/core/model';
import { Channel, MenuCommand, RendererEvent } from '../src/app/enums';
import { RecentlyOpenedService } from './services/recently-opened.service';

const DIFF_DATABASES_MENU_ID: string = 'diff-databases';

export class Application {
  public readonly isMac: boolean;
  private _mainWindow: BrowserWindow | undefined;
  private _recentlyOpenedService: RecentlyOpenedService = RecentlyOpenedService.instance;
  private _debugMode: boolean;

  constructor(private _electronApp: Electron.App) {
    this.isMac = process.platform === 'darwin';
    this._debugMode = !_electronApp.isPackaged;

    _electronApp.on('activate', this.onElectronActivate);
    _electronApp.on('window-all-closed', this.onElectronWindowAllClosed);
  }

  public initialize(): void {
    this.createMainWindow();

    ipcMain.on(Channel.RendererEvent, (_event, ...args) => this.handleRendererEvent(...args));
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
    Menu.setApplicationMenu(menu);

    this._recentlyOpenedService.recentlyOpenedServers$
                               .subscribe(recentCredentials => {
                                  /* There's currently no way to remove items from a menu so the
                                    only practical option is to recreate the menu and reassign it.
                                  */
                                  const updateMenu: Menu = this.createMainMenu(recentCredentials);
                                  Menu.setApplicationMenu(updateMenu);
                                });

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

  private createMainMenu(recentCredentials: ServerCredentials[] = []): Menu {
    const recentlyOpenedMenuTemplate: Array<MenuItemConstructorOptions> = this.createRecentlyOpenedMenuTemplate(recentCredentials);
    const template: Array<MenuItemConstructorOptions> = [
      {
        label: 'File',
        submenu: [
          {
            label: 'Open Server...',
            click: (): void => { this.sendMenuCommand(MenuCommand.OpenServer) }
          },
          {
            label: 'Open Recent',
            submenu: recentlyOpenedMenuTemplate
          },
          { type: 'separator' },
          {
            id: DIFF_DATABASES_MENU_ID,
            label: 'Diff Databases',
            enabled: false,
            click: (): void => { this.sendMenuCommand(MenuCommand.DiffDatabases) }
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

  private createRecentlyOpenedMenuTemplate(recentCredentials: ServerCredentials[]): Array<MenuItemConstructorOptions> {
    const template: Array<MenuItemConstructorOptions> = [];

    if (recentCredentials.length > 0) {
      recentCredentials.forEach(credentials => {
        template.push({
                  label: credentials.alias,
                  click: (): void => { this.sendMenuCommand(MenuCommand.OpenServer, credentials) }
                });
      });

      template.push({ type: 'separator' });
    }

    template.push({
              label: 'Clear Recently Opened',
              enabled: (recentCredentials.length > 0),
              click: (): void => { this._recentlyOpenedService.clear() }
            });

    return template;
  }

  private sendMenuCommand(menuCommand: MenuCommand, ...args: any[]): void {
    if (this._mainWindow) {
      this._mainWindow.webContents.send(Channel.MenuCommand, menuCommand, ...args);
    }
  }

  private handleRendererEvent = (...args: any[]): void => {
    const event: RendererEvent = args[0];

    switch (event) {
      case RendererEvent.ServerOpened: {
        const credentials: ServerCredentials | undefined = args.length > 1 ? args[1] : undefined;
        if (credentials) {
          this.onServerOpened(credentials);
        } else {
// TODO: log the error
        }
        break;
      }
      default:
// TODO: log the error
        // this._log.error(`Unsupported MenuCommand - ${convertToText(mainCommand)}`);
        break;
    }
  };

  private onServerOpened = (credentials: ServerCredentials): void => {
    this._recentlyOpenedService.add(credentials);

    const diffDatabasesMenuItem: Electron.MenuItem | null | undefined = Menu.getApplicationMenu()?.getMenuItemById(DIFF_DATABASES_MENU_ID);
    if (diffDatabasesMenuItem) {
      diffDatabasesMenuItem.enabled = true;
    }
  };

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
