import { HttpErrorResponse, HttpHeaders, HttpStatusCode } from '@angular/common/http';
import { Injectable, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';

import { Logger } from '../core/logging';
import { LogService } from '../core/logging/log.service';
import { ServerCredentials } from '../core/model';
import { getAuthorizationHeader } from '../utility';

@Injectable()
export abstract class BaseService implements OnDestroy {
  protected readonly log: Logger;
  protected isBeingDestroyed$: Subject<void> = new Subject();

  constructor(logService: LogService) {
    this.log = logService.getLogger(this.constructor.name);
  }

  public ngOnDestroy(): void {
    this.isBeingDestroyed$.next();
    this.isBeingDestroyed$.complete();
  }

  protected getUrlAndHeaders(credentials: ServerCredentials, pathname: string): [string, HttpHeaders] {
    const url: URL = new URL(credentials.address);
    url.pathname = pathname;

    return [
      url.toString(),
      getAuthorizationHeader(credentials)
    ];
  }

  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types -- not sure (at this point) what types of error we need to handle
  protected checkIfNotFound(error: any): boolean {
    let notFound: boolean = false;

    if (error) {
      if (error instanceof HttpErrorResponse) {
        notFound = (error.status === HttpStatusCode.NotFound);
      } else {
// TODO: are there any other error types that might signify a 404???
        notFound = false;
      }
    }

    return notFound;
  }
}
