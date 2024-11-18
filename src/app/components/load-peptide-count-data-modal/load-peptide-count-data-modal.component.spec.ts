import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LoadPeptideCountDataModalComponent } from './load-peptide-count-data-modal.component';

describe('LoadPeptideCountDataModalComponent', () => {
  let component: LoadPeptideCountDataModalComponent;
  let fixture: ComponentFixture<LoadPeptideCountDataModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LoadPeptideCountDataModalComponent]
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
