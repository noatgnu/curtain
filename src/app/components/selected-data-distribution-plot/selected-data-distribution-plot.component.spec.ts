import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

import { SelectedDataDistributionPlotComponent } from './selected-data-distribution-plot.component';

describe('SelectedDataDistributionPlotComponent', () => {
  let component: SelectedDataDistributionPlotComponent;
  let fixture: ComponentFixture<SelectedDataDistributionPlotComponent>;

  const mockActiveModal = {
    dismiss: jasmine.createSpy('dismiss'),
    close: jasmine.createSpy('close')
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SelectedDataDistributionPlotComponent ],
      providers: [
        { provide: NgbActiveModal, useValue: mockActiveModal }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SelectedDataDistributionPlotComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
