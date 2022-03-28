export const enum AriaRole {
  AlertDialog = 'alertdialog',
  Dialog = 'dialog'
}

export const enum Channel {
  AppInfo = 'app-info',
  MenuCommand = 'menu-command',
  RendererEvent = 'renderer-event'
}

export const enum CompareResult {
  Before = -1,
  Equal = 0,
  After = 1
}

export const enum MenuCommand {
  OpenServer = 'open-server',
  DiffDatabases = 'diff-databases'
}

export const enum MenuId {
  File = 'file',
    OpenServer = 'open-server',
    OpenRecent = 'open-recent',
    DiffDatabases = 'diff-databases',
    Exit = 'exit',
  Edit = 'edit',
  Application = 'application'
}

export const enum RendererEvent {
  ModalClosed = 'modal-closed',
  ModalOpened = 'modal-opened',
  ServerOpened = 'server-opened'
}

export const enum ResultStatus {
  SoftFail = -1,
  HardFail = 0,
  Success = 1
}
