import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProteomicsDbComponent } from './proteomics-db.component';

describe('ProteomicsDbComponent', () => {
  let component: ProteomicsDbComponent;
  let fixture: ComponentFixture<ProteomicsDbComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ProteomicsDbComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ProteomicsDbComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
