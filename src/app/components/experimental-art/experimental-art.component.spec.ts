import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ExperimentalArtComponent } from './experimental-art.component';

describe('ExperimentalArtComponent', () => {
  let component: ExperimentalArtComponent;
  let fixture: ComponentFixture<ExperimentalArtComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ExperimentalArtComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ExperimentalArtComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
