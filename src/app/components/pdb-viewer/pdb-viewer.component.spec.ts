import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { UniprotService } from '../../uniprot.service';

import { PdbViewerComponent } from './pdb-viewer.component';

describe('PdbViewerComponent', () => {
  let component: PdbViewerComponent;
  let fixture: ComponentFixture<PdbViewerComponent>;

  const mockActiveModal = {
    dismiss: jasmine.createSpy('dismiss'),
    close: jasmine.createSpy('close')
  };

  const mockUniprotService = {
    Re: /^NOMATCH$/,
    getUniprotFromPrimary: jasmine.createSpy('getUniprotFromPrimary').and.returnValue({ 'Gene Names': 'TEST1' })
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PdbViewerComponent ],
      providers: [
        { provide: NgbActiveModal, useValue: mockActiveModal },
        { provide: UniprotService, useValue: mockUniprotService }
      ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(PdbViewerComponent);
    component = fixture.componentInstance;
    component.data = 'P12345';
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
