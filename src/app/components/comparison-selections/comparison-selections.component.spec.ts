import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ComparisonSelectionsComponent } from './comparison-selections.component';

describe('ComparisonSelectionsComponent', () => {
  let component: ComparisonSelectionsComponent;
  let fixture: ComponentFixture<ComparisonSelectionsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ComparisonSelectionsComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ComparisonSelectionsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
