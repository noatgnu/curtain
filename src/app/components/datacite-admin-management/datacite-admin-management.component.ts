import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy } from '@angular/core';
import {
  NgbActiveModal,
  NgbNav,
  NgbNavContent, NgbNavItem,
  NgbNavLinkButton, NgbNavOutlet,
  NgbPagination,
  NgbTooltip
} from "@ng-bootstrap/ng-bootstrap";
import {AccountsService} from "../../accounts/accounts.service";
import {DataCiteCurtain} from "../../data-cite-metadata";
import {FormBuilder, ReactiveFormsModule} from "@angular/forms";
import {Subject, takeUntil} from "rxjs";

@Component({
  selector: 'app-datacite-admin-management',
  imports: [
    NgbPagination,
    NgbTooltip,
    NgbNav,
    NgbNavContent,
    NgbNavLinkButton,
    NgbNavItem,
    NgbNavOutlet,
    ReactiveFormsModule
  ],
  templateUrl: './datacite-admin-management.component.html',
  styleUrl: './datacite-admin-management.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DataciteAdminManagementComponent implements OnDestroy {
  private destroy$ = new Subject<void>();
  activeID = "user"
  page = 1
  pageSize = 10
  dataCiteDraftQuery?: {
    results: DataCiteCurtain[],
    count: number,
    next: string|null,
    previous: string|null
  }

  searchForm = this.fb.group({
    searchTerm: [""]
  })

  constructor(public activeModal: NgbActiveModal, public accountService: AccountsService, private fb: FormBuilder, private cdr: ChangeDetectorRef) {
    this.accountService.curtainAPI.getDataCites(undefined, undefined, undefined, this.pageSize, this.page-1, false, "TP").then(
      (data) => {
        this.dataCiteDraftQuery = data.data
        this.cdr.markForCheck();
      }
    )
    this.searchForm.controls.searchTerm.valueChanges.pipe(takeUntil(this.destroy$)).subscribe((value) => {
      this.changed(this.activeID, value)
    })
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  close() {
    this.activeModal.dismiss()
  }


  approveDOI(datacite: DataCiteCurtain) {
    this.accountService.curtainAPI.changeDataCiteStatus(datacite.id, "published").then((data: any) => {
      if (this.dataCiteDraftQuery) {
        this.dataCiteDraftQuery.results = this.dataCiteDraftQuery.results.map((dc) => {
          if (dc.id === datacite.id) {
            dc.status = "published"
          }
          return dc
        })
      }
      this.cdr.markForCheck();
    })
  }

  rejectDOI(datacite: DataCiteCurtain) {
    this.accountService.curtainAPI.changeDataCiteStatus(datacite.id, "rejected").then((data: any) => {
      if (this.dataCiteDraftQuery) {
        this.dataCiteDraftQuery.results = this.dataCiteDraftQuery.results.map((dc) => {
          if (dc.id === datacite.id) {
            dc.status = "rejected"
          }
          return dc
        })
      }
      this.cdr.markForCheck();
    })
  }

  lockDOI(datacite: DataCiteCurtain) {
    this.accountService.curtainAPI.lockDataCite(datacite.id, true).then((data: any) => {
      if (this.dataCiteDraftQuery) {
        this.dataCiteDraftQuery.results = this.dataCiteDraftQuery.results.map((dc) => {
          if (dc.id === datacite.id) {
            dc.lock = true
          }
          return dc
        })
      }
      this.cdr.markForCheck();
    })
  }

  unlockDOI(datacite: DataCiteCurtain) {
    this.accountService.curtainAPI.lockDataCite(datacite.id, false).then((data: any) => {
      if (this.dataCiteDraftQuery) {
        this.dataCiteDraftQuery.results = this.dataCiteDraftQuery.results.map((dc) => {
          if (dc.id === datacite.id) {
            dc.lock = false
          }
          return dc
        })
      }
      this.cdr.markForCheck();
    })
  }

  changed(event: any, term: string|null|undefined) {
    this.dataCiteDraftQuery = undefined
    if (!term) {
      term = undefined
    }
    if (event === "admin") {
      if (this.searchForm.value.searchTerm) {
        this.accountService.curtainAPI.getDataCites(undefined, term, "draft", this.pageSize, this.page-1, true, "TP").then(
          (data) => {
            this.dataCiteDraftQuery = data.data
            this.cdr.markForCheck();
          }
        )
      } else {
        this.accountService.curtainAPI.getDataCites(undefined, undefined, "draft", this.pageSize, this.page-1, true, "TP").then(
          (data) => {
            this.dataCiteDraftQuery = data.data
            this.cdr.markForCheck();
          }
        )
      }
    } else {
      if (this.searchForm.value.searchTerm) {
        this.accountService.curtainAPI.getDataCites(undefined, term, undefined, this.pageSize, this.page-1, false, "TP").then(
          (data) => {
            this.dataCiteDraftQuery = data.data
            this.cdr.markForCheck();
          }
        )
      } else {
        this.accountService.curtainAPI.getDataCites(undefined, undefined, undefined, this.pageSize, this.page-1, false, "TP").then(
          (data) => {
            this.dataCiteDraftQuery = data.data
            this.cdr.markForCheck();
          }
        )
      }
    }
  }

  pageChange(event: number) {
    this.page = event
    this.changed(this.activeID, this.searchForm.value.searchTerm)
  }
}
