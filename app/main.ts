import * as fs from 'fs';
import * as path from 'path';
import { app, BrowserWindow, BrowserWindowConstructorOptions, Menu, MenuItem, MenuItemConstructorOptions } from 'electron';
import * as electronReload from 'electron-reload';

let mainWindow: BrowserWindow | undefined;
const args: string[] = process.argv.slice(1);
const serve: boolean = args.some(val => val === '--serve');

function createMainWindow(): BrowserWindow {
  mainWindow = new BrowserWindow({
    webPreferences: {
      nodeIntegration: true,
      allowRunningInsecureContent: (serve) ? true : false,
      contextIsolation: false  // false if you want to run e2e test with Spectron
    }
  });

  Menu.setApplicationMenu(null);
  const menu: Menu = createMainMenu();
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

  if (serve) {
    mainWindow.webContents.openDevTools();
    electronReload(__dirname, {
      electron: require(path.join(__dirname, '/../node_modules/electron'))
    });

    console.log('Running from http://localhost:4200');
    mainWindow.loadURL('http://localhost:4200');
  } else {
    let pathIndex: string = './index.html';    // Path when running electron executable

    if (fs.existsSync(path.join(__dirname, '../dist/index.html'))) {
      pathIndex = '../dist/index.html';      // Path when running electron in local folder
    }

    const url: URL = new URL('file:///' + path.join(__dirname, pathIndex));
    const appUrl: string = url.toString();
    console.log(`Running from ${appUrl}`);
    mainWindow.loadURL(appUrl);
  }

  // Emitted when the window is closed.
  mainWindow.on('closed', () => {
    // Dereference the window object, usually you would store window
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    mainWindow = undefined;
  });

  return mainWindow;
}

function createMainMenu(): Menu {
  const isMac: boolean = process.platform === 'darwin';

  const template: Array<MenuItemConstructorOptions | MenuItem> = [
    {
      label: 'File',
      submenu: [
        {
          label: 'Open'
        },
        { type: 'separator' },
        isMac ? { role: 'close' }
              : { role: 'quit' }
      ]
    }
  ];

  if (isMac) {
    template.unshift({
                      label: app.name,
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

try {
  app.whenReady()
     .then(() => {
        createMainWindow();

        app.on('activate', () => {
          /* On OS X, it's common to re-create a window in the app when the
            dock icon is clicked and there are no other windows open.
          */
          if (BrowserWindow.getAllWindows().length === 0) {
            createMainWindow();
          }
        });
      },
      ((/*reason: any*/) => {
// TODO: log and display error
      }));

  app.on('window-all-closed', () => {
    /* On OS X, it's common for applications and their menu bar
      to stay active until the user quits explicitly with Cmd + Q.
    */
    if (process.platform !== 'darwin') {
      app.quit();
    }
  });

  // // This method will be called when Electron has finished
  // // initialization and is ready to create browser windows.
  // // Some APIs can only be used after this event occurs.
  // // Added 400 ms to fix the black background issue while using transparent window. More detais at https://github.com/electron/electron/issues/15947
  // app.on('ready', () => setTimeout(createMainWindow, 400));
} catch (e) {
// TODO: log error and do something
  // Catch Error
  // throw e;
}
