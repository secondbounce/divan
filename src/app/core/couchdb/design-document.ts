import { Document } from './document';

export interface DesignDocument extends Document {
  views: {
    [key: string]: View;
  };
  language: string;
}

export interface View {
  map: string;
  reduce?: string;
}
