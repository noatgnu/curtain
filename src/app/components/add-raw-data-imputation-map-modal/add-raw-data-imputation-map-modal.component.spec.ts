import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddRawDataImputationMapModalComponent } from './add-raw-data-imputation-map-modal.component';

describe('AddRawDataImputationMapModalComponent', () => {
  let component: AddRawDataImputationMapModalComponent;
  let fixture: ComponentFixture<AddRawDataImputationMapModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddRawDataImputationMapModalComponent]
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
