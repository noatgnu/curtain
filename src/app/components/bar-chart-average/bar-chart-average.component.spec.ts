import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BarChartAverageComponent } from './bar-chart-average.component';

describe('BarChartAverageComponent', () => {
  let component: BarChartAverageComponent;
  let fixture: ComponentFixture<BarChartAverageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ BarChartAverageComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(BarChartAverageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
