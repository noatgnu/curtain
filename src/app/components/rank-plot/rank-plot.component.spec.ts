import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RankPlotComponent } from './rank-plot.component';

describe('RankPlotComponent', () => {
  let component: RankPlotComponent;
  let fixture: ComponentFixture<RankPlotComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ RankPlotComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(RankPlotComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
