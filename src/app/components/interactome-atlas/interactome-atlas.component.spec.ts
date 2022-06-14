import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InteractomeAtlasComponent } from './interactome-atlas.component';

describe('InteractomeAtlasComponent', () => {
  let component: InteractomeAtlasComponent;
  let fixture: ComponentFixture<InteractomeAtlasComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ InteractomeAtlasComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(InteractomeAtlasComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
