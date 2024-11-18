import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OrcidComponent } from './orcid.component';

describe('OrcidComponent', () => {
  let component: OrcidComponent;
  let fixture: ComponentFixture<OrcidComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OrcidComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(OrcidComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
