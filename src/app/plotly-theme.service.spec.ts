import { TestBed } from '@angular/core/testing';

import { PlotlyThemeService } from './plotly-theme.service';

describe('PlotlyThemeService', () => {
  let service: PlotlyThemeService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PlotlyThemeService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
