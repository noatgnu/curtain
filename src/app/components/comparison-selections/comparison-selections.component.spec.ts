import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DataService } from '../../data.service';

import { ComparisonSelectionsComponent } from './comparison-selections.component';

describe('ComparisonSelectionsComponent', () => {
  let component: ComparisonSelectionsComponent;
  let fixture: ComponentFixture<ComparisonSelectionsComponent>;

  const mockDataService = {
    differentialForm: {
      comparisonSelect: ['Condition A']
    }
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ComparisonSelectionsComponent ],
      providers: [
        { provide: DataService, useValue: mockDataService }
      ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ComparisonSelectionsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
