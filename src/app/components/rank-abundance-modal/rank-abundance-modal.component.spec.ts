import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RankAbundanceModalComponent } from './rank-abundance-modal.component';

describe('RankAbundanceModalComponent', () => {
  let component: RankAbundanceModalComponent;
  let fixture: ComponentFixture<RankAbundanceModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ RankAbundanceModalComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RankAbundanceModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
