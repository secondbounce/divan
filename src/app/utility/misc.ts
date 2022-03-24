import { HttpHeaders } from '@angular/common/http';

import { ServerCredentials } from '../core/model';

export function getAuthorizationHeader(credentials: ServerCredentials): HttpHeaders {
  return new HttpHeaders({
    Authorization: `Basic ${btoa(credentials.username + ':' + credentials.password)}`
  });
}

export function isElectron(): boolean {
  return !!(window && window.process && window.process.type);
}
