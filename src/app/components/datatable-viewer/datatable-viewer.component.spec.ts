import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DatatableViewerComponent } from './datatable-viewer.component';

describe('DatatableViewerComponent', () => {
  let component: DatatableViewerComponent;
  let fixture: ComponentFixture<DatatableViewerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ DatatableViewerComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(DatatableViewerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
