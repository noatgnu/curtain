import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ApplicationRef } from '@angular/core';
import { ZonelessTimerService } from './zoneless-timer.service';

describe('ZonelessTimerService', () => {
  let service: ZonelessTimerService;
  let appRef: jasmine.SpyObj<ApplicationRef>;

  beforeEach(() => {
    const appRefSpy = jasmine.createSpyObj('ApplicationRef', ['tick']);
    TestBed.configureTestingModule({
      providers: [
        { provide: ApplicationRef, useValue: appRefSpy }
      ]
    });
    service = TestBed.inject(ZonelessTimerService);
    appRef = TestBed.inject(ApplicationRef) as jasmine.SpyObj<ApplicationRef>;
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should execute setTimeout callback and trigger change detection', fakeAsync(() => {
    let executed = false;
    service.setTimeout(() => {
      executed = true;
    }, 100);

    expect(executed).toBeFalse();
    tick(100);
    expect(executed).toBeTrue();
    expect(appRef.tick).toHaveBeenCalled();
  }));

  it('should execute setInterval callback and trigger change detection', fakeAsync(() => {
    let count = 0;
    const intervalId = service.setInterval(() => {
      count++;
    }, 100);

    tick(100);
    expect(count).toBe(1);
    expect(appRef.tick).toHaveBeenCalledTimes(1);

    tick(100);
    expect(count).toBe(2);
    expect(appRef.tick).toHaveBeenCalledTimes(2);

    service.clearInterval(intervalId);
  }));

  it('should clear timeout', fakeAsync(() => {
    let executed = false;
    const timeoutId = service.setTimeout(() => {
      executed = true;
    }, 100);

    service.clearTimeout(timeoutId);
    tick(100);
    expect(executed).toBeFalse();
  }));

  it('should clear interval', fakeAsync(() => {
    let count = 0;
    const intervalId = service.setInterval(() => {
      count++;
    }, 100);

    tick(100);
    expect(count).toBe(1);

    service.clearInterval(intervalId);
    tick(100);
    expect(count).toBe(1);
  }));
});
