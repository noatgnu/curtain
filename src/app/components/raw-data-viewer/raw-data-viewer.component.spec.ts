import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RawDataViewerComponent } from './raw-data-viewer.component';

describe('RawDataViewerComponent', () => {
  let component: RawDataViewerComponent;
  let fixture: ComponentFixture<RawDataViewerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ RawDataViewerComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(RawDataViewerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
