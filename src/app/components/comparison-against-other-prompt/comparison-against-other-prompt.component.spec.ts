import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

import { ComparisonAgainstOtherPromptComponent } from './comparison-against-other-prompt.component';

describe('ComparisonAgainstOtherPromptComponent', () => {
  let component: ComparisonAgainstOtherPromptComponent;
  let fixture: ComponentFixture<ComparisonAgainstOtherPromptComponent>;

  const mockActiveModal = {
    dismiss: jasmine.createSpy('dismiss'),
    close: jasmine.createSpy('close')
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ComparisonAgainstOtherPromptComponent ],
      providers: [
        { provide: NgbActiveModal, useValue: mockActiveModal }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ComparisonAgainstOtherPromptComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
