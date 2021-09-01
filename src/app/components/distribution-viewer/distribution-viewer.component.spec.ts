import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DistributionViewerComponent } from './distribution-viewer.component';

describe('DistributionViewerComponent', () => {
  let component: DistributionViewerComponent;
  let fixture: ComponentFixture<DistributionViewerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ DistributionViewerComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(DistributionViewerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
