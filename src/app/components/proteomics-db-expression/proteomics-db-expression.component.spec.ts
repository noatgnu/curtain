import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProteomicsDbExpressionComponent } from './proteomics-db-expression.component';

describe('ProteomicsDbExpressionComponent', () => {
  let component: ProteomicsDbExpressionComponent;
  let fixture: ComponentFixture<ProteomicsDbExpressionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ProteomicsDbExpressionComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ProteomicsDbExpressionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
