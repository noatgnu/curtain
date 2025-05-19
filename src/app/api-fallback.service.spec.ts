import { TestBed } from '@angular/core/testing';

import { ApiFallbackService } from './api-fallback.service';

describe('ApiFallbackService', () => {
  let service: ApiFallbackService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ApiFallbackService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
