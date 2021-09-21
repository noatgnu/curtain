import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StringAnalysisComponent } from './string-analysis.component';

describe('StringAnalysisComponent', () => {
  let component: StringAnalysisComponent;
  let fixture: ComponentFixture<StringAnalysisComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ StringAnalysisComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(StringAnalysisComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
