import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

import { AddRawDataImputationMapModalComponent } from './add-raw-data-imputation-map-modal.component';

describe('AddRawDataImputationMapModalComponent', () => {
  let component: AddRawDataImputationMapModalComponent;
  let fixture: ComponentFixture<AddRawDataImputationMapModalComponent>;

  const mockActiveModal = {
    dismiss: jasmine.createSpy('dismiss'),
    close: jasmine.createSpy('close')
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddRawDataImputationMapModalComponent],
      providers: [
        { provide: NgbActiveModal, useValue: mockActiveModal }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AddRawDataImputationMapModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
