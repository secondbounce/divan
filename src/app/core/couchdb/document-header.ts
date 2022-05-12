import { Document } from './document';

export interface DocumentHeader {
  id: string;
  key: string;
  value: {
    rev: string;
  };
  doc?: Document;
}
