import { TestBed } from '@angular/core/testing';

import { DataciteService } from './datacite.service';

describe('DataciteService', () => {
  let service: DataciteService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(DataciteService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
