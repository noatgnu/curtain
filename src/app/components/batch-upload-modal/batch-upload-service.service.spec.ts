import { TestBed } from '@angular/core/testing';

import { BatchUploadServiceService } from './batch-upload-service.service';

describe('BatchUploadServiceService', () => {
  let service: BatchUploadServiceService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(BatchUploadServiceService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
