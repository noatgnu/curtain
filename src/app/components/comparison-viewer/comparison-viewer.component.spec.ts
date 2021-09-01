import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ComparisonViewerComponent } from './comparison-viewer.component';

describe('ComparisonViewerComponent', () => {
  let component: ComparisonViewerComponent;
  let fixture: ComponentFixture<ComparisonViewerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ComparisonViewerComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ComparisonViewerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
