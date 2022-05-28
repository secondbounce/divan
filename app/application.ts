import * as fs from 'fs';
import * as path from 'path';
import { App, BrowserWindow, BrowserWindowConstructorOptions, dialog, ipcMain, Menu, MenuItemConstructorOptions, SaveDialogSyncOptions } from 'electron';
import log from 'electron-log';

import { ServerCredentials } from '../src/app/core/model';
import { Channel, MenuCommand, MenuId, RendererEvent } from '../src/app/enums';
import { ElectronEvent } from './enums';
import { Logger } from './logger';
import { MenuStateService } from './services/menu-state.service';
import { RecentlyOpenedService } from './services/recently-opened.service';
import { AppInfo } from './shared/app-info';
import { configureLogging } from './shared/log-config';
import { convertToText } from './shared/string';

export class Application {
  public readonly isMac: boolean;
  private _mainWindow: BrowserWindow | undefined;
  private _menuStateService: MenuStateService = MenuStateService.instance;
  private _recentlyOpenedService: RecentlyOpenedService = RecentlyOpenedService.instance;
  private _debugMode: boolean;
  private _appInfo: AppInfo;
  private readonly _log: Logger;

  constructor(private _electronApp: App) {
    configureLogging(log);

    this._log = new Logger('Application');
    this.isMac = process.platform === 'darwin';
    this._debugMode = !_electronApp.isPackaged;
    this._appInfo = {
      appName: _electronApp.getName()
    };

    _electronApp.on(ElectronEvent.Activate, this.onElectronActivate);
    _electronApp.on(ElectronEvent.WindowAllClosed, this.onElectronWindowAllClosed);
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

    const mainWindow: BrowserWindow = new BrowserWindow({
      webPreferences: {
        nodeIntegration: true,
        allowRunningInsecureContent: this._debugMode,
        contextIsolation: false  // false if you want to run e2e test with Spectron
      }
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

    const appUrl: string = this.getBrowserAppUrl();
    this._log.info(`Loading from ${appUrl}`);
    mainWindow.loadURL(appUrl)
              .then(() => {
                this.onMainWindowCreated(mainWindow);
              }, (error) => {
                this._log.error(`Failed to load ${appUrl} into main window`, error);
// TODO: need to display the error message somehow
// TODO: delete window?
                // mainWindow.destroy();
              });
  }

  private createMainMenu(recentCredentials: ServerCredentials[] = []): Menu {
    const recentlyOpenedMenuTemplate: Array<MenuItemConstructorOptions> = this.createRecentlyOpenedMenuTemplate(recentCredentials);
    const template: Array<MenuItemConstructorOptions> = [
      {
        /* IMPORTANT!  Changing the menus here?  Don't forget to update MenuStateService.disableMainMenu()
          to account for those changes.
        */
        id: MenuId.File,
        label: 'File',
        submenu: [
          {
            id: MenuId.FileOpenServer,
            label: 'Open Server...',
            click: (): void => { this.sendMenuCommand(MenuCommand.OpenServer) }
          },
          {
            id: MenuId.FileOpenRecent,
            label: 'Open Recent',
            submenu: recentlyOpenedMenuTemplate
          },
          { type: 'separator' },
          {
            id: MenuId.FileDiffDatabases,
            label: 'Diff Databases...',
            enabled: false,
            click: (): void => { this.sendMenuCommand(MenuCommand.DiffDatabases) }
          },
          { type: 'separator' },
          this.isMac ? {
                        id: MenuId.FileExit,
                        role: 'close'
                       }
                     : {
                        id: MenuId.FileExit,
                        role: 'quit'
                       }
        ]
      },
      {
        id: MenuId.Edit,
        role: 'editMenu'
      }
    ];

    if (this.isMac) {
      template.unshift({
                        id: MenuId.Application,
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

  private setUpContextMenuForEditing(mainWindow: BrowserWindow): void {
    /* Rather than constructing the edit menu manually, we'll just use the 'editmenu' role to
      create the required items for us and then use that.
    */
    const contextMenu: Menu = Menu.buildFromTemplate([
      { role: 'editMenu' }
    ]);
    const editMenu: Menu | undefined = contextMenu.items[0].submenu;

    if (editMenu) {
      mainWindow.webContents.on(ElectronEvent.ContextMenu, (_e, props) => {
        const { selectionText, isEditable } = props;

        if ((selectionText && selectionText.length > 0) || isEditable) {
          this._menuStateService.setEditMenuItemsState(editMenu, props);
          editMenu.popup({ window: mainWindow });
        }
      });
    }
  }

  private getBrowserAppUrl(): string {
    let appUrl: string;

    if (this._debugMode) {
      appUrl = 'http://localhost:4200';
    } else {
      let pathIndex: string = './index.html';    // Path when running electron executable

      if (fs.existsSync(path.join(__dirname, '../dist/index.html'))) {
        pathIndex = '../dist/index.html';      // Path when running electron in local folder
      }

      const url: URL = new URL('file:///' + path.join(__dirname, pathIndex));
      appUrl = url.toString();
    }

    return appUrl;
  }

  private onMainWindowCreated(mainWindow: BrowserWindow): void {
    mainWindow.on(ElectronEvent.Closed, () => {
      /* Dereference the window object, usually you would store window
        in an array if your app supports multi windows, this is the time
        when you should delete the corresponding element.
      */
      this._mainWindow = undefined;
    });

    this._mainWindow = mainWindow;
    this._mainWindow.webContents.send(Channel.AppInfo, this._appInfo);
    this.setUpContextMenuForEditing(mainWindow);

    if (this._debugMode) {
      mainWindow.webContents.openDevTools();
    }
  }

  private sendMenuCommand(menuCommand: MenuCommand, ...args: any[]): void {
    if (this._mainWindow) {
      this._mainWindow.webContents.send(Channel.MenuCommand, menuCommand, ...args);
    }
  }

  private handleRendererEvent = (...args: any[]): void => {
    const event: RendererEvent = args[0];

    switch (event) {
      case RendererEvent.ModalOpened:
        this.onModalOpened();
        break;

      case RendererEvent.ModalClosed:
        this.onModalClosed();
        break;

      case RendererEvent.ServerOpened: {
        const [, credentials] = args;
        if (credentials) {
          this.onServerOpened(credentials);
        } else {
          this._log.error('\'ServerOpened\' renderer event received without credentials');
// TODO: need to display the error message somehow
        }
        break;
      }
      case RendererEvent.ShowDatabaseContextMenu: {
        const [, serverAlias, database] = args;
        if (serverAlias && database) {
          this.onShowDatabaseContextMenu(serverAlias, database);
        } else {
          this._log.error('\'ShowDatabaseContextMenu\' renderer event received without serverAlias/database');
// TODO: need to display the error message somehow
        }
        break;
      }
      case RendererEvent.ShowSaveDialog: {
        const [, content, options] = args;
        if (content && options) {
          this.onShowSaveDialog(content, options);
        } else {
          this._log.error('\'ShowSaveDialog\' renderer event received without content/options');
// TODO: need to display the error message somehow
        }
        break;
      }
      default:
        this._log.error(`Unsupported RendererEvent - ${convertToText(args)}`);
// TODO: need to display the error message somehow
        break;
    }
  };

  private onModalOpened(): void {
    this._menuStateService.disableMainMenu();
  }

  private onModalClosed(): void {
    this._menuStateService.reenableMainMenu();
  }

  private onServerOpened = (credentials: ServerCredentials): void => {
    this._recentlyOpenedService.add(credentials);
    this._menuStateService.setMenuItemState(MenuId.FileDiffDatabases, true);
  };

  private onShowDatabaseContextMenu(serverAlias: string, database: string): void {
    const contextMenu: Menu = Menu.buildFromTemplate([
      {
        id: MenuId.DatabaseDiff,
        label: 'Diff...',
        click: (): void => { this.sendMenuCommand(MenuCommand.DiffDatabases, serverAlias, database) }
      },
      {
        id: MenuId.ExportDatabase,
        label: 'Export',
        click: (): void => { this.sendMenuCommand(MenuCommand.ExportDatabase, serverAlias, database) }
      }
    ]);

    contextMenu.popup({ window: this._mainWindow });
  }

  private onShowSaveDialog(content: string, options: SaveDialogSyncOptions): void {
    if (this._mainWindow) {
      const filepath: string | undefined = dialog.showSaveDialogSync(this._mainWindow, options);
      if (filepath) {
        try {
          fs.writeFileSync(filepath, content);
// TODO: need to display confirmation message
        } catch (err) {
          this._log.error(`Failed to save content to '${filepath}'`, err);
// TODO: need to display the error message somehow
        }
      }
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
