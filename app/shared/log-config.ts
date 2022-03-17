import log from 'electron-log';

export function configureLogging(electronLog: typeof log): void {
  electronLog.transports.console.format = '{scope} {text}';
  electronLog.transports.file.format = '{y}-{m}-{d} {h}:{i}:{s}.{ms} [{level}] {scope} {text}';
  electronLog.transports.file.fileName = 'app.log';
}
