import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';

import { RawDataBlockComponent } from './raw-data-block.component';

describe('RawDataBlockComponent', () => {
  let component: RawDataBlockComponent;
  let fixture: ComponentFixture<RawDataBlockComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ NgbModule ],
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
