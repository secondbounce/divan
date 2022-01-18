import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';

import { AppComponent } from './app.component';
import { LogService } from './core/logging';
import { ElectronService, ModalService } from './services';

describe('AppComponent', () => {
  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
              imports: [
                RouterTestingModule
              ],
              declarations: [
                AppComponent
              ],
              providers: [
                ElectronService,
                LogService,
                ModalService
              ]
            })
           .compileComponents();
  }));

  it('should create the app', waitForAsync(() => {
    const fixture: ComponentFixture<AppComponent> = TestBed.createComponent(AppComponent);
    const app: AppComponent = fixture.debugElement.componentInstance;
    expect(app).toBeTruthy();
  }));

  // it(`should have as title 'divan'`, () => {
  //   const fixture: ComponentFixture<AppComponent> = TestBed.createComponent(AppComponent);
  //   const app: AppComponent = fixture.componentInstance;
  //   expect(app.title).toEqual('divan');
  // });

  // it('should render title', () => {
  //   const fixture: ComponentFixture<AppComponent> = TestBed.createComponent(AppComponent);
  //   fixture.detectChanges();
  //   // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment -- these tests are only initial samples and will be rewritten eventually
  //   const compiled: any = fixture.nativeElement;
  //   // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call -- these tests are only initial samples and will be rewritten eventually
  //   expect(compiled.querySelector('.content span').textContent).toContain('divan app is running!');
  // });
});
