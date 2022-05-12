import { DocumentHeader } from './document-header';

export interface AllDocuments {
  offset: number;
  update_seq?: string;
  rows: DocumentHeader[];
  total_rows: number;
}
