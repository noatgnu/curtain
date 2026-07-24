import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

import { CorrelationMatrixComponent } from './correlation-matrix.component';

describe('CorrelationMatrixComponent', () => {
  let component: CorrelationMatrixComponent;
  let fixture: ComponentFixture<CorrelationMatrixComponent>;

  const mockActiveModal = {
    dismiss: jasmine.createSpy('dismiss'),
    close: jasmine.createSpy('close')
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CorrelationMatrixComponent ],
      providers: [
        { provide: NgbActiveModal, useValue: mockActiveModal }
      ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CorrelationMatrixComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
