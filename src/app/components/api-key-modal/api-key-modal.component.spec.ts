import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ApiKeyModalComponent } from './api-key-modal.component';

describe('ApiKeyModalComponent', () => {
  let component: ApiKeyModalComponent;
  let fixture: ComponentFixture<ApiKeyModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ApiKeyModalComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ApiKeyModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
