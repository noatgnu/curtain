import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RankPlotTextAnnotationComponent } from './rank-plot-text-annotation.component';

describe('RankPlotTextAnnotationComponent', () => {
  let component: RankPlotTextAnnotationComponent;
  let fixture: ComponentFixture<RankPlotTextAnnotationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ RankPlotTextAnnotationComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RankPlotTextAnnotationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
