import { TestBed } from '@angular/core/testing';
import { ApplicationRef } from '@angular/core';
import { ZonelessTimerService } from './zoneless-timer.service';

describe('ZonelessTimerService', () => {
  let service: ZonelessTimerService;
  let appRef: jasmine.SpyObj<ApplicationRef>;

  beforeEach(() => {
    jasmine.clock().install();
    const appRefSpy = jasmine.createSpyObj('ApplicationRef', ['tick']);
    TestBed.configureTestingModule({
      providers: [
        { provide: ApplicationRef, useValue: appRefSpy }
      ]
    });
    service = TestBed.inject(ZonelessTimerService);
    appRef = TestBed.inject(ApplicationRef) as jasmine.SpyObj<ApplicationRef>;
  });

  afterEach(() => {
    jasmine.clock().uninstall();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should execute setTimeout callback and trigger change detection', () => {
    let executed = false;
    service.setTimeout(() => {
      executed = true;
    }, 100);

    expect(executed).toBeFalse();
    jasmine.clock().tick(100);
    expect(executed).toBeTrue();
    expect(appRef.tick).toHaveBeenCalled();
  });

  it('should execute setInterval callback and trigger change detection', () => {
    let count = 0;
    const intervalId = service.setInterval(() => {
      count++;
    }, 100);

    jasmine.clock().tick(100);
    expect(count).toBe(1);
    expect(appRef.tick).toHaveBeenCalledTimes(1);

    jasmine.clock().tick(100);
    expect(count).toBe(2);
    expect(appRef.tick).toHaveBeenCalledTimes(2);

    service.clearInterval(intervalId);
  });

  it('should clear timeout', () => {
    let executed = false;
    const timeoutId = service.setTimeout(() => {
      executed = true;
    }, 100);

    service.clearTimeout(timeoutId);
    jasmine.clock().tick(100);
    expect(executed).toBeFalse();
  });

  it('should clear interval', () => {
    let count = 0;
    const intervalId = service.setInterval(() => {
      count++;
    }, 100);

    jasmine.clock().tick(100);
    expect(count).toBe(1);

    service.clearInterval(intervalId);
    jasmine.clock().tick(100);
    expect(count).toBe(1);
  });
});
