import { app, BrowserWindow, screen } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import * as url from 'url';

let mainWindow: BrowserWindow | null = null;
const args: string[] = process.argv.slice(1);
const serve: boolean = args.some(val => val === '--serve');

function createWindow(): BrowserWindow {
  // const electronScreen = screen;
  const size: Electron.Size = screen.getPrimaryDisplay().workAreaSize;

  mainWindow = new BrowserWindow({
    x: 0,
    y: 0,
    width: size.width,
    height: size.height,
    webPreferences: {
      // preload: path.join(__dirname, 'preload.js')
      nodeIntegration: true,
      allowRunningInsecureContent: (serve) ? true : false,
      contextIsolation: false,  // false if you want to run 2e2 test with Spectron
      enableRemoteModule : true // true if you want to run 2e2 test  with Spectron or use remote module in renderer context (ie. Angular)
    },
  });


  if (serve) {
    mainWindow.webContents.openDevTools();
    require('electron-reload')(__dirname, {
      electron: require(path.join(__dirname, '/../node_modules/electron'))
    });

    console.log(`Running from http://localhost:4200`);
    mainWindow.loadURL('http://localhost:4200');
  } else {
    // Path when running electron executable
    let pathIndex = './index.html';

    if (fs.existsSync(path.join(__dirname, '../dist/index.html'))) {
      // Path when running electron in local folder
      pathIndex = '../dist/index.html';
    }

    const appUrl: string = url.format({
      pathname: path.join(__dirname, pathIndex),
      protocol: 'file:',
      slashes: true
    })
    console.log(`Running from ${appUrl}`)
    mainWindow.loadURL(appUrl);
  }

  // Emitted when the window is closed.
  mainWindow.on('closed', () => {
    // Dereference the window object, usually you would store window
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    mainWindow = null;
  });

  return mainWindow;
}

try {
  app.whenReady()
     .then(() => {
        createWindow();

        app.on('activate', function () {
          /* On macOS, it's common to re-create a window in the app when the
            dock icon is clicked and there are no other windows open.
          */
          if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
          }
        });
      },
      ((/*reason: any*/) => {
// TODO: log and display error
      }));

  app.on('window-all-closed', () => {
    /* On macOS, it's common for applications and their menu bar
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
  // app.on('ready', () => setTimeout(createWindow, 400));
} catch (e) {
// TODO: log error and do something
  // Catch Error
  // throw e;
}
