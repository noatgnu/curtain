import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ComparisonAgainstOtherPromptComponent } from './comparison-against-other-prompt.component';

describe('ComparisonAgainstOtherPromptComponent', () => {
  let component: ComparisonAgainstOtherPromptComponent;
  let fixture: ComponentFixture<ComparisonAgainstOtherPromptComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ComparisonAgainstOtherPromptComponent ]
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
