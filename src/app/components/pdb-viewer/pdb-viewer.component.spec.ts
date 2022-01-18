import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PdbViewerComponent } from './pdb-viewer.component';

describe('PdbViewerComponent', () => {
  let component: PdbViewerComponent;
  let fixture: ComponentFixture<PdbViewerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PdbViewerComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(PdbViewerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
