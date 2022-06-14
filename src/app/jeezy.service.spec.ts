import { TestBed } from '@angular/core/testing';

import { JeezyService } from './jeezy.service';

describe('JeezyService', () => {
  let service: JeezyService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(JeezyService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
