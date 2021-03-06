/* If you import a module but never use any of the imported values other than as TypeScript types,
  the resulting javascript file will look as if you never imported the module at all.
*/
import * as childProcess from 'child_process';
import * as fs from 'fs';
import { Injectable } from '@angular/core';
import { ipcRenderer, webFrame } from 'electron';

import { AppInfo } from '~shared/app-info';
import { Channel, RendererEvent } from '../enums';
import { isElectron } from '../utility';

@Injectable({
  providedIn: 'root'
})
export class ElectronService {
  public readonly webFrame?: typeof webFrame;
  public readonly childProcess?: typeof childProcess;
  public readonly fs?: typeof fs;
  private readonly _ipcRenderer?: typeof ipcRenderer;
  private _appInfo: AppInfo = {
    appName: 'Divan'  /* Default if running in browsers */
  };

  constructor() {
    if (isElectron()) {
      this._ipcRenderer = window.require('electron').ipcRenderer;
      this.webFrame = window.require('electron').webFrame;
      this.childProcess = window.require('child_process');
      this.fs = window.require('fs');

      // Notes :
      // * A NodeJS's dependency imported with 'window.require' MUST BE present in `dependencies` of both `app/package.json`
      // and `package.json (root folder)` in order to make it work here in Electron's Renderer process (src folder)
      // because it will loaded at runtime by Electron.
      // * A NodeJS's dependency imported with TS module import (ex: import { Dropbox } from 'dropbox') CAN only be present
      // in `dependencies` of `package.json (root folder)` because it is loaded during build phase and does not need to be
      // in the final bundle. Reminder : only if not used in Electron's Main process (app folder)

      // If you want to use a NodeJS 3rd party deps in Renderer process,
      // ipcRenderer.invoke can serve many common use cases.
      // https://www.electronjs.org/docs/latest/api/ipc-renderer#ipcrendererinvokechannel-args

      this._ipcRenderer?.on(Channel.AppInfo, (_event, ...args) => {
                          this._appInfo = args[0];
                        });
    } else {
// TODO: log this!
    }
  }

  public get appName(): string {
    return this._appInfo.appName;
  }

  public on(channel: Channel, listener: (...args: any[]) => void): void {
    this._ipcRenderer?.on(channel, (_event, ...args) => listener(...args));
  }

  public emitRendererEvent(event: RendererEvent, args?: any): void {
    this._ipcRenderer?.send(Channel.RendererEvent, event, args);
  }
}
