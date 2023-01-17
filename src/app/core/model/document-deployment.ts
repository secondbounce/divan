import { HttpHeaders } from '@angular/common/http';

import { DatabaseCredentials } from './database-credentials';
import { getAuthorizationHeader } from '../../utility';
import { DesignDocument } from '../couchdb';

export class DocumentDeployment {
  public readonly headers: HttpHeaders;
  public originalDocRev: string = '';
  public readonly oldDocId: string;
  public oldDocRev: string = '';
  public readonly newDocId: string;
  public newDocRev: string = '';
  public viewQueried: boolean = false;
  private readonly _targetServerUrl: URL;
  private readonly _targetDb: string;
  private readonly _docId: string;

  constructor(target: DatabaseCredentials,
              public readonly designDoc: DesignDocument) {
    if (typeof(designDoc._id) === 'undefined') {
      throw new Error('Design document has no unique id');
    }

    const timestamp: string = Date.now().toString();
    this._targetServerUrl = new URL(target.serverCredentials.address);
    this.headers = getAuthorizationHeader(target.serverCredentials);
    this._targetDb = target.name;
    this._docId = designDoc._id;
    this.oldDocId = this._docId + '__original_' + timestamp;   /* Append timestamp in case previous uploads failed to clean up fully */
    this.newDocId = this._docId + '__new_' + timestamp;
  }

  public getTargetDocumentUrl(): string {
    this._targetServerUrl.pathname = `/${this._targetDb}/${this._docId}`;
    this._targetServerUrl.search = '';    /* Clear any params from previous requests */

    return this._targetServerUrl.toString();
  }

  public getTargetDocumentIdWithRev(): string {
    return this._docId + '?rev=' + this.originalDocRev;
  }

  public getOldDocumentUrl(appendRev: boolean): string {
    this._targetServerUrl.pathname = `/${this._targetDb}/${this.oldDocId}`;
    this._targetServerUrl.search = '';    /* Clear any params from previous requests */

    if (appendRev) {
      this._targetServerUrl.searchParams.set('rev', this.oldDocRev);
    }

    return this._targetServerUrl.toString();
  }

  public getNewDocumentUrl(appendRev: boolean): string {
    this._targetServerUrl.pathname = `/${this._targetDb}/${this.newDocId}`;
    this._targetServerUrl.search = '';    /* Clear any params from previous requests */

    if (appendRev) {
      this._targetServerUrl.searchParams.set('rev', this.newDocRev);
    }

    return this._targetServerUrl.toString();
  }

  public getFirstViewUrl(): string {
    const view: string = Object.keys(this.designDoc.views)[0];
// TODO: this will be wrong for partitioned views
    this._targetServerUrl.pathname = `/${this._targetDb}/${this.newDocId}/_view/${view}`;
    this._targetServerUrl.search = '';    /* Clear any params from previous requests */

    return this._targetServerUrl.toString();
  }

  public getViewCleanUpUrl(): string {
    this._targetServerUrl.pathname = `/${this._targetDb}/_view_cleanup`;
    this._targetServerUrl.search = '';    /* Clear any params from previous requests */

    return this._targetServerUrl.toString();
  }
}
