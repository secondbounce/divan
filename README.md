# Divan

[![Contributor Covenant](https://img.shields.io/badge/Contributor%20Covenant-2.0-4baaaa.svg)](code_of_conduct.md)

<https://github.com/angular/angular/blob/22b96b9/CONTRIBUTING.md#-commit-message-guidelines>

## Notes

* A NodeJS's dependency imported with `window.require` MUST BE present in `dependencies` of both `app/package.json`
and `package.json (root folder)` in order to make it work here in Electron's Renderer process (src folder)
because it will loaded at runtime by Electron.
* A NodeJS's dependency imported with TS module import (ex: `import { Dropbox } from 'dropbox'`) CAN only be present
in `dependencies` of `package.json (root folder)` because it is loaded during build phase and does not need to be
in the final bundle. Reminder : only if not used in Electron's Main process (app folder)

If you want to use a NodeJS 3rd party deps in Renderer process, `ipcRenderer.invoke` can serve many common use cases.
See <https://www.electronjs.org/docs/latest/api/ipc-renderer#ipcrendererinvokechannel-args>

## TODO

* <https://github.com/sindresorhus/electron-context-menu/issues>
* electron-builder reports _"asar usage is disabled — this is strongly not recommended  solution=enable asar and use asarUnpack to unpack files that must be externally available"_
* accessibility - <https://codelabs.developers.google.com/angular-a11y>
