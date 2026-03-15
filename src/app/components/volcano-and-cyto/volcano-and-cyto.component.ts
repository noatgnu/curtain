import {ChangeDetectionStrategy, ChangeDetectorRef, Component, EventEmitter, OnDestroy, OnInit, Output} from '@angular/core';
import {DataService} from "../../data.service";
import {selectionData} from "../protein-selections/protein-selections.component";
import {ScrollService} from "../../scroll.service";
import {ThemeService} from "../../theme.service";
import {Subject, takeUntil} from "rxjs";

@Component({
    selector: 'app-volcano-and-cyto',
    templateUrl: './volcano-and-cyto.component.html',
    styleUrls: ['./volcano-and-cyto.component.scss'],
    standalone: false,
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class VolcanoAndCytoComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  @Output() selected: EventEmitter<selectionData> = new EventEmitter<selectionData>()
  isVolcanoCollapse: boolean = false
  isNetworkCollapse: boolean = true

  constructor(public data: DataService, private scroll: ScrollService, private themeService: ThemeService, private cdr: ChangeDetectorRef) { }

  ngOnInit(): void {
    this.themeService.beforeThemeChange$.pipe(takeUntil(this.destroy$)).subscribe(() => {
      if (!this.isNetworkCollapse) {
        this.isNetworkCollapse = true;
        this.cdr.markForCheck();
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  handleVolcanoSelection(e: selectionData){
    this.selected.emit(e)
  }
}
