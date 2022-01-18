import { TestBed } from '@angular/core/testing';

import { ProteomicsDbService } from './proteomics-db.service';

describe('ProteomicsDbService', () => {
  let service: ProteomicsDbService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ProteomicsDbService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
