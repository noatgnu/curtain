import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

import { EnrichrModalComponent } from './enrichr-modal.component';

describe('EnrichrModalComponent', () => {
  let component: EnrichrModalComponent;
  let fixture: ComponentFixture<EnrichrModalComponent>;

  const mockActiveModal = {
    dismiss: jasmine.createSpy('dismiss'),
    close: jasmine.createSpy('close')
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ EnrichrModalComponent ],
      providers: [
        { provide: NgbActiveModal, useValue: mockActiveModal }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EnrichrModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
