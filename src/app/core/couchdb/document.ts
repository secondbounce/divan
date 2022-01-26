export interface AllDocuments {
  offset: number;
  update_seq?: string;
  rows: DocumentHeader[];
  total_rows: number;
}

export interface DocumentHeader {
  id: string;
  key: string;
  value: {
    rev: string;
  };
  doc?: Document;
}

export interface Document {
  _id?: string;
  _rev?: string;
  [key: string]: any;
}
