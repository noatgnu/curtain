import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SubFilterComponent } from './sub-filter.component';

describe('SubFilterComponent', () => {
  let component: SubFilterComponent;
  let fixture: ComponentFixture<SubFilterComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [SubFilterComponent]
    });
    fixture = TestBed.createComponent(SubFilterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
