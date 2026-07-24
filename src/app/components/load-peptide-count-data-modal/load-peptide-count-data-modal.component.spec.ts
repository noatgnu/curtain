import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

import { LoadPeptideCountDataModalComponent } from './load-peptide-count-data-modal.component';

describe('LoadPeptideCountDataModalComponent', () => {
  let component: LoadPeptideCountDataModalComponent;
  let fixture: ComponentFixture<LoadPeptideCountDataModalComponent>;

  const mockActiveModal = {
    dismiss: jasmine.createSpy('dismiss'),
    close: jasmine.createSpy('close')
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LoadPeptideCountDataModalComponent],
      providers: [
        { provide: NgbActiveModal, useValue: mockActiveModal }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LoadPeptideCountDataModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
