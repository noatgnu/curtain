import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StringdbInteractComponent } from './stringdb-interact.component';

describe('StringdbInteractComponent', () => {
  let component: StringdbInteractComponent;
  let fixture: ComponentFixture<StringdbInteractComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ StringdbInteractComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(StringdbInteractComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
