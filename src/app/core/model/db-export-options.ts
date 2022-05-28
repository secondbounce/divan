export interface DbExportOptions {
  serverAlias: string;
  dbName: string;
  includeDocs: boolean;
  includeRevs: boolean;
  exportAsJson: boolean;
}
