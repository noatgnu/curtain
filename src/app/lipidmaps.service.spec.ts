import { TestBed } from '@angular/core/testing';

import { LipidmapsService } from './lipidmaps.service';

describe('LipidmapsService', () => {
  let service: LipidmapsService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(LipidmapsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
