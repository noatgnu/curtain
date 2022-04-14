import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProteinRelationshipComponent } from './protein-relationship.component';

describe('ProteinRelationshipComponent', () => {
  let component: ProteinRelationshipComponent;
  let fixture: ComponentFixture<ProteinRelationshipComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ProteinRelationshipComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ProteinRelationshipComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
