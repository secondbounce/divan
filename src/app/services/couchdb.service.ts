import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

import { DesignDocQueryParams } from '../core/couchdb';
import { LogService } from '../core/logging';
import { DocInfo } from '../core/model';
import { BaseService } from './base.service';

@Injectable()
export class CouchDbService extends BaseService {
  constructor(private _http: HttpClient,
              logService: LogService) {
    super(logService);
  }

// TODO: remove queryParams (calling function can add it to url, possibly via service function)
  public get<T>(url: string, headers: HttpHeaders, queryParams?: DesignDocQueryParams, onErrorValue?: T): Observable<T> {
    const queryUrl: URL = new URL(url);

    if (queryParams) {
      const params: URLSearchParams = queryUrl.searchParams;

      Object.entries(queryParams)
            .map((currentParam) => {
              params.append(currentParam[0], currentParam[1]);
            });
    }

    url = queryUrl.toString();

    return this._http.get<T>(url, { headers })
                     .pipe(catchError((err: any, _caught: Observable<T>) => {
                            if (!onErrorValue) {
                              throw err;
                            }
                            return of<T>(onErrorValue);
                          }));
  }

  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types -- we can't know what needs to be passed
  public put<T>(url: string, headers: HttpHeaders, data: any): Observable<T> {
    data = JSON.stringify(data);
    return this._http.put<T>(url, data,
                             {
                               headers: headers.set('Accept', 'application/json')
                                               .set('Content-Type', 'application/json')
                             });
// TODO: handle retries intelligently, based on the error
                    //  .pipe(retry(REQUEST_RETRY_COUNT));
  }

  public post<T>(url: string, headers: HttpHeaders, data: any = null): Observable<T> {
    data = JSON.stringify(data);
    return this._http.post<T>(url, data,
                              {
                                headers: headers.set('Accept', 'application/json')
                                                .set('Content-Type', 'application/json')
                              });
// TODO: handle retries intelligently, based on the error
                    //  .pipe(retry(REQUEST_RETRY_COUNT));
  }

  // eslint-disable-next-line @typescript-eslint/ban-types
  public copy(url: string, toDocId: string, headers: HttpHeaders): Observable<object> {
    return this._http.request('COPY', url,
                              {
                                headers: headers.set('Accept', 'application/json')
                                                .set('Content-Type', 'application/json')
                                                .set('Destination', toDocId)
                                // body?: any;
                                // context?: HttpContext;
                                // observe?: 'body';
                                // params?: HttpParams | {
                                //     [param: string]: string | number | boolean | ReadonlyArray<string | number | boolean>;
                                // };
                                // responseType?: 'json';
                                // reportProgress?: boolean;
                                // withCredentials?: boolean;
                              });
  }

  // eslint-disable-next-line @typescript-eslint/ban-types
  public delete(url: string, headers: HttpHeaders): Observable<object> {
    return this._http.delete(url,
                             {
                              headers: headers.set('Accept', 'application/json')
                             });
  }

  public getDocInfo(url: string, headers: HttpHeaders): Observable<DocInfo> {
    /* We can do this using the HEAD request and then reading the ETag header for the revision, but
      that will require whitelisting the response headers with the 'Access-Control-Expose-Headers'
      request header, which in turn needs whitelisting in the CouchDB CORS configuration.
      So let's just do it the 'dumb' way...
    */
    return this._http.get(url,
                          {
                            headers: headers.set('Accept', 'application/json')
                                            .set('Content-Type', 'application/json')
                          })
                     .pipe(map((response: any) => {
                            return {
                              _id: response._id,
                              _rev: response._rev
                            };
                          }));
  }
}
