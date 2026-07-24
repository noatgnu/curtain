import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

import { CurtainStatsSummaryComponent } from './curtain-stats-summary.component';

describe('CurtainStatsSummaryComponent', () => {
  let component: CurtainStatsSummaryComponent;
  let fixture: ComponentFixture<CurtainStatsSummaryComponent>;

  const mockActiveModal = {
    dismiss: jasmine.createSpy('dismiss'),
    close: jasmine.createSpy('close')
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CurtainStatsSummaryComponent ],
      providers: [
        { provide: NgbActiveModal, useValue: mockActiveModal }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CurtainStatsSummaryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
