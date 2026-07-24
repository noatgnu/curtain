import { HttpClient } from '@angular/common/http';
import { UniprotParser } from './uniprot-parser';

describe('UniprotParser', () => {
  it('should create an instance', () => {
    expect(new UniprotParser({} as HttpClient)).toBeTruthy();
  });
});
