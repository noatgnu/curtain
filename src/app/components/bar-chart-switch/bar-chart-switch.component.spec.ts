import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BarChartSwitchComponent } from './bar-chart-switch.component';

describe('BarChartSwitchComponent', () => {
  let component: BarChartSwitchComponent;
  let fixture: ComponentFixture<BarChartSwitchComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ BarChartSwitchComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(BarChartSwitchComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
