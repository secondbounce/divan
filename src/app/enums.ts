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
  DiffDatabases = 'diff-databases',
  ExportDatabase = 'export-database'
}

export const enum MenuId {
  File = 'file',
    FileOpenServer = 'file_open-server',
    FileOpenRecent = 'file_open-recent',
    FileDiffDatabases = 'file_diff-databases',
    FileExit = 'file_exit',
  Edit = 'edit',
  Application = 'application',
  DatabaseDiff = 'database_diff',
  ExportDatabase = 'export_database'
}

export const enum RendererEvent {
  ModalClosed = 'modal-closed',
  ModalOpened = 'modal-opened',
  ServerOpened = 'server-opened',
  ShowDatabaseContextMenu = 'show-database-context-menu',
  ShowSaveDialog = 'show-save-dialog'
}

export const enum ResultStatus {
  SoftFail = -1,
  HardFail = 0,
  Success = 1
}
