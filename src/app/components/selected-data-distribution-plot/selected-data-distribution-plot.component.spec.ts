import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SelectedDataDistributionPlotComponent } from './selected-data-distribution-plot.component';

describe('SelectedDataDistributionPlotComponent', () => {
  let component: SelectedDataDistributionPlotComponent;
  let fixture: ComponentFixture<SelectedDataDistributionPlotComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SelectedDataDistributionPlotComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SelectedDataDistributionPlotComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
