import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InteractomeComponent } from './interactome.component';

describe('InteractomeComponent', () => {
  let component: InteractomeComponent;
  let fixture: ComponentFixture<InteractomeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ InteractomeComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(InteractomeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
