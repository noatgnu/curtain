import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EnrichrModalComponent } from './enrichr-modal.component';

describe('EnrichrModalComponent', () => {
  let component: EnrichrModalComponent;
  let fixture: ComponentFixture<EnrichrModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ EnrichrModalComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EnrichrModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
