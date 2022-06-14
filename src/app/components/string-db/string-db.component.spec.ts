import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StringDbComponent } from './string-db.component';

describe('StringDbComponent', () => {
  let component: StringDbComponent;
  let fixture: ComponentFixture<StringDbComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ StringDbComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(StringDbComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
