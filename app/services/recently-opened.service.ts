import { ReplaySubject } from 'rxjs';

import { ServerCredentials } from '../../src/app/core/model';

/* eslint-disable-next-line @typescript-eslint/typedef, @typescript-eslint/no-var-requires -- this
  library uses `#private` variables that are incompatible with the current target.  So for now, we
  have to `require` the library, rather than `import` it.
*/
const Store = require('electron-store');

const RECENTLY_OPENED_SERVERS_KEY: string = 'recentlyOpenedServers';
const MAX_RECENTLY_OPENED_SERVERS: number = 10;

/* In a 'normal' Angular app, services are singletons instantiated and managed by the
  framework, and obtained via DI through the component's constructor.  That doesn't
  apply here, so we'll explicitly implement it as a singleton.
*/
export class RecentlyOpenedService {
  public recentlyOpenedServers$: ReplaySubject<ServerCredentials[]> = new ReplaySubject<ServerCredentials[]>();
  private static _instance: RecentlyOpenedService;
// TODO: nothing else should be editing the 'recently opened' values, but should we specify the `watch` option here, just in case?
// TODO: create and pass a 'master' schema (made from the interfaces??)?
  private _store = new Store();
  private readonly _recentlyOpenedServers: Map<string, ServerCredentials> = new Map<string, ServerCredentials>();

  private constructor() {
    const recentlyOpenedServers: ServerCredentials[] = this._store.get(RECENTLY_OPENED_SERVERS_KEY, []) as ServerCredentials[];
    const start: number = Math.max(0, recentlyOpenedServers.length - MAX_RECENTLY_OPENED_SERVERS);  /* Just in case... */

    /* Maps always add new items at the end so the array needs to be reversed before adding */
    const credentialsList: ServerCredentials[] = recentlyOpenedServers.reverse();

    for (let i: number = start; i < credentialsList.length; i++) {
      const credentials: ServerCredentials = credentialsList[i];
      const key: string = credentials.alias.toLocaleUpperCase();

      this._recentlyOpenedServers.set(key, credentials);
    }

    this.emitNewList();
  }

  public static get instance(): RecentlyOpenedService {
    return this._instance || (this._instance = new this());
  }

  public add(credentials: ServerCredentials): void {
    const key: string = credentials.alias.toLocaleUpperCase();

    /* Delete and re-add so if it's already been defined, it goes at the end of the list
      (i.e. in order of use).
    */
    this._recentlyOpenedServers.delete(key);
    this._recentlyOpenedServers.set(key, credentials);

    const keys: string[] = Array.from(this._recentlyOpenedServers.keys());

    for (let i: number = 0; i < keys.length - MAX_RECENTLY_OPENED_SERVERS; i++) {
      this._recentlyOpenedServers.delete(keys[i]);
    }

    this.emitNewList();
  }

  public clear(): void {
    this._recentlyOpenedServers.clear();
    this.emitNewList();
  }

  private emitNewList(): void {
    /* New values are always inserted at the end of Maps, but we want them at the top of the
      'Recently Opened' list, so need to reverse them.
    */
    const credentialsList: ServerCredentials[] = Array.from(this._recentlyOpenedServers.values())
                                                      .reverse();
    this.recentlyOpenedServers$.next(credentialsList);
    this._store.set(RECENTLY_OPENED_SERVERS_KEY, credentialsList);
  }
}
