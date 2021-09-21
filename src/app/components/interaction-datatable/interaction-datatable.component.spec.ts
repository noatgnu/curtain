import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InteractionDatatableComponent } from './interaction-datatable.component';

describe('InteractionDatatableComponent', () => {
  let component: InteractionDatatableComponent;
  let fixture: ComponentFixture<InteractionDatatableComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ InteractionDatatableComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(InteractionDatatableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
