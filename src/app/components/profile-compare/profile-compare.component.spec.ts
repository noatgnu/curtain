import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

import { ProfileCompareComponent } from './profile-compare.component';

describe('ProfileCompareComponent', () => {
  let component: ProfileCompareComponent;
  let fixture: ComponentFixture<ProfileCompareComponent>;

  const mockActiveModal = {
    dismiss: jasmine.createSpy('dismiss'),
    close: jasmine.createSpy('close')
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ProfileCompareComponent ],
      providers: [
        { provide: NgbActiveModal, useValue: mockActiveModal }
      ]
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
