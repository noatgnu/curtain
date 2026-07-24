import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NgbActiveModal, NgbModule } from '@ng-bootstrap/ng-bootstrap';

import { SessionComparisonResultViewerModalComponent } from './session-comparison-result-viewer-modal.component';

describe('SessionComparisonResultViewerModalComponent', () => {
  let component: SessionComparisonResultViewerModalComponent;
  let fixture: ComponentFixture<SessionComparisonResultViewerModalComponent>;

  const mockActiveModal = {
    dismiss: jasmine.createSpy('dismiss'),
    close: jasmine.createSpy('close')
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ NgbModule ],
      declarations: [ SessionComparisonResultViewerModalComponent ],
      providers: [
        { provide: NgbActiveModal, useValue: mockActiveModal }
      ]
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
