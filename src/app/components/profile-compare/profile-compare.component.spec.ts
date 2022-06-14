import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProfileCompareComponent } from './profile-compare.component';

describe('ProfileCompareComponent', () => {
  let component: ProfileCompareComponent;
  let fixture: ComponentFixture<ProfileCompareComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ProfileCompareComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ProfileCompareComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
