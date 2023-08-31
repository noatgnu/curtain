import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SessionComparisonResultViewerModalComponent } from './session-comparison-result-viewer-modal.component';

describe('SessionComparisonResultViewerModalComponent', () => {
  let component: SessionComparisonResultViewerModalComponent;
  let fixture: ComponentFixture<SessionComparisonResultViewerModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SessionComparisonResultViewerModalComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SessionComparisonResultViewerModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
