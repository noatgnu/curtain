import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RawDataBlockComponent } from './raw-data-block.component';

describe('RawDataBlockComponent', () => {
  let component: RawDataBlockComponent;
  let fixture: ComponentFixture<RawDataBlockComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ RawDataBlockComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(RawDataBlockComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
