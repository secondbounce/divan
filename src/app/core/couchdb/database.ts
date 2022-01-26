import { DesignDocument } from './design-document';
import { Security } from './security';

export interface Database {
  name?: string;
  partitioned: boolean;
  _security?: Security;
  _design?: {
    [key: string]: DesignDocument;
  };
  [key: string]: any;
}
