export class ServerCredentials {
  public alias: string = '';
  public address: string = '';
  public username: string = '';
  public password: string = '';

  constructor(serverCredentials?: ServerCredentials) {
    if (serverCredentials) {
      this.alias = serverCredentials.alias;
      this.address = serverCredentials.address;
      this.username = serverCredentials.username;
      this.password = serverCredentials.password;
    }
  }
}
