import { TestBed } from '@angular/core/testing';

import { EbiService } from './ebi.service';

describe('EbiService', () => {
  let service: EbiService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(EbiService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
