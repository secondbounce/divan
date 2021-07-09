import { expect } from 'chai';
import { SpectronClient } from 'spectron';

import commonSetup from './common-setup';

describe('Divan App', function() {
  commonSetup.apply(this);

  let client: SpectronClient;

  beforeEach(function() {
    client = this.app.client;
  });

  it('creates initial windows', async function() {
    const count: number = await client.getWindowCount();
    expect(count).to.equal(1);
  });

  it('should display message saying App works !', async function() {
    const elem: WebdriverIO.Element = await client.$('app-home h1');
    const text: string = await elem.getText();
    expect(text).to.equal('App works !');
  });

});
