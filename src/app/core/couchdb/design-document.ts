import { Document } from './document';
import { View } from './view';

export interface DesignDocument extends Document {
  views: {
    [key: string]: View;
  };
  language: string;
}
