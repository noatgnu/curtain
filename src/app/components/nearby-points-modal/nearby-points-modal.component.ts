import { Component, Input } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { DataService } from '../../data.service';
import { UniprotService } from '../../uniprot.service';
import { SettingsService } from '../../settings.service';

interface DataPoint {
  primaryId: string;
  geneName: string;
  foldChange: number;
  significance: number;
  distance: number;
  comparison: string;
  traceGroup: string;
  traceColor: string;
  text: string;
  [key: string]: any;
}

@Component({
  selector: 'app-nearby-points-modal',
  templateUrl: './nearby-points-modal.component.html',
  styleUrls: ['./nearby-points-modal.component.scss'],
  standalone: false
})
export class NearbyPointsModalComponent {
  @Input() targetPoint: DataPoint | null = null;
  @Input() nearbyPoints: DataPoint[] = [];
  
  boundaryDistance: number = 1.0;
  maxPoints: number = 50;
  
  // Additional filtering options
  useFoldChangeFilter: boolean = false;
  foldChangeThreshold: number = 1.0;
  useSignificanceFilter: boolean = false;
  significanceThreshold: number = 0.05;
  
  // Selection functionality
  selectedPoints: Set<string> = new Set();
  includeTargetPoint: boolean = true;
  selectionName: string = '';
  existingSelections: string[] = [];
  addToExistingSelection: string = '';
  selectAllChecked: boolean = false;
  
  // Bar chart functionality
  expandedCharts: Set<string> = new Set();
  
  displayColumns = ['primaryId', 'geneName', 'foldChange', 'significance', 'traceGroup', 'distance'];

  constructor(
    public activeModal: NgbActiveModal,
    private dataService: DataService,
    private uniprot: UniprotService,
    private settings: SettingsService
  ) {}

  ngOnInit() {
    if (this.targetPoint) {
      this.recalculateNearbyPoints();
      // Generate default selection name
      this.selectionName = `Nearby ${this.targetPoint.geneName || this.targetPoint.primaryId}`;
    }
    
    // Get existing selections from dataService
    this.existingSelections = this.dataService.selectOperationNames || [];
  }

  recalculateNearbyPoints() {
    if (!this.targetPoint) return;

    const allPoints: DataPoint[] = [];
    const targetX = this.targetPoint.foldChange;
    const targetY = this.targetPoint.significance;

    // Process all data points to find nearby ones
    for (const row of this.dataService.currentDF) {
      const foldChange = row[this.dataService.differentialForm.foldChange];
      const significance = row[this.dataService.differentialForm.significant];
      const primaryId = row[this.dataService.differentialForm.primaryIDs];
      const comparison = row[this.dataService.differentialForm.comparison];
      
      // Skip the target point itself
      if (primaryId === this.targetPoint.primaryId && comparison === this.targetPoint.comparison) {
        continue;
      }

      // Calculate Euclidean distance
      const distance = Math.sqrt(Math.pow(foldChange - targetX, 2) + Math.pow(significance - targetY, 2));
      
      // Apply distance filter
      if (distance > this.boundaryDistance) {
        continue;
      }
      
      // Apply optional fold change filter (absolute value)
      if (this.useFoldChangeFilter && Math.abs(foldChange) < this.foldChangeThreshold) {
        continue;
      }
      
      // Apply optional significance filter (p-value, so lower is more significant)
      if (this.useSignificanceFilter) {
        const pValue = Math.pow(10, -significance); // Convert -log10(p) back to p-value
        if (pValue > this.significanceThreshold) {
          continue;
        }
      }
      
      // Point passes all filters, process it
      let geneName = '';
      let text = primaryId;
      
      if (this.dataService.fetchUniprot) {
        const uniprotData = this.uniprot.getUniprotFromPrimary(primaryId);
        if (uniprotData && uniprotData['Gene Names']) {
          geneName = uniprotData['Gene Names'];
        }
      } else if (this.dataService.differentialForm.geneNames !== '') {
        geneName = row[this.dataService.differentialForm.geneNames];
      }
      
      if (geneName !== '') {
        text = geneName + '[' + primaryId + ']' + ' (' + comparison + ')';
      }

      // Determine trace group and color
      let traceGroup = 'Background';
      let traceColor = '#a4a2a2';
      
      if (this.dataService.selectedMap[primaryId]) {
        for (const groupName in this.dataService.selectedMap[primaryId]) {
          const match = /\(([^)]*)\)[^(]*$/.exec(groupName);
          if (match && match[1] === comparison) {
            traceGroup = groupName;
            break;
          } else if (!match) {
            traceGroup = groupName;
            break;
          }
        }
      } else if (!this.settings.settings.backGroundColorGrey) {
        const significanceGroup = this.dataService.significantGroup(foldChange, significance);
        traceGroup = significanceGroup[0] + ' (' + comparison + ')';
      }

      // Get color from settings
      if (this.settings.settings.colorMap && this.settings.settings.colorMap[traceGroup]) {
        traceColor = this.settings.settings.colorMap[traceGroup];
      }

      const point: DataPoint = {
        primaryId,
        geneName,
        foldChange,
        significance,
        distance,
        comparison,
        traceGroup,
        traceColor,
        text,
        ...row // Include all original data
      };

      allPoints.push(point);
    }

    // Sort by distance and limit results
    this.nearbyPoints = allPoints
      .sort((a, b) => a.distance - b.distance)
      .slice(0, this.maxPoints);
  }

  onBoundaryChange() {
    this.recalculateNearbyPoints();
  }

  onMaxPointsChange() {
    if (this.nearbyPoints.length > this.maxPoints) {
      this.nearbyPoints = this.nearbyPoints.slice(0, this.maxPoints);
    }
  }

  onFilterChange() {
    this.recalculateNearbyPoints();
  }

  getDisplayValue(point: DataPoint, column: string): any {
    const value = point[column];
    if (typeof value === 'number') {
      return parseFloat(value.toFixed(4));
    }
    return value || '';
  }

  selectPoint(point: DataPoint) {
    // Emit selection event similar to volcano plot selection
    this.activeModal.close({
      action: 'select',
      data: [point.primaryId],
      title: point.text
    });
  }

  annotatePoint(point: DataPoint) {
    // Emit annotation event
    this.activeModal.close({
      action: 'annotate',
      data: [point.primaryId]
    });
  }

  close() {
    this.activeModal.dismiss();
  }

  // Selection management methods
  togglePointSelection(primaryId: string) {
    if (this.selectedPoints.has(primaryId)) {
      this.selectedPoints.delete(primaryId);
    } else {
      this.selectedPoints.add(primaryId);
    }
  }

  isPointSelected(primaryId: string): boolean {
    return this.selectedPoints.has(primaryId);
  }

  selectAllPoints() {
    this.nearbyPoints.forEach(point => {
      this.selectedPoints.add(point.primaryId);
    });
  }

  clearSelection() {
    this.selectedPoints.clear();
  }

  onSelectAllChange() {
    if (this.selectAllChecked) {
      this.selectAllPoints();
    } else {
      this.clearSelection();
    }
  }

  createNewSelection() {
    if (!this.selectionName.trim()) {
      alert('Please enter a selection name');
      return;
    }

    const selectedIds: string[] = [];
    
    // Include target point if selected
    if (this.includeTargetPoint && this.targetPoint) {
      selectedIds.push(this.targetPoint.primaryId);
    }
    
    // Add selected nearby points
    this.selectedPoints.forEach(id => selectedIds.push(id));

    if (selectedIds.length === 0) {
      alert('Please select at least one point');
      return;
    }

    this.activeModal.close({
      action: 'createSelection',
      data: selectedIds,
      title: this.selectionName.trim()
    });
  }

  addToExisting() {
    if (!this.addToExistingSelection) {
      alert('Please select an existing selection to add to');
      return;
    }

    const selectedIds: string[] = [];
    
    // Include target point if selected
    if (this.includeTargetPoint && this.targetPoint) {
      selectedIds.push(this.targetPoint.primaryId);
    }
    
    // Add selected nearby points
    this.selectedPoints.forEach(id => selectedIds.push(id));

    if (selectedIds.length === 0) {
      alert('Please select at least one point');
      return;
    }

    this.activeModal.close({
      action: 'addToSelection',
      data: selectedIds,
      existingSelection: this.addToExistingSelection
    });
  }

  annotateSelectedPoints() {
    const selectedIds: string[] = [];
    
    // Include target point if selected
    if (this.includeTargetPoint && this.targetPoint) {
      selectedIds.push(this.targetPoint.primaryId);
    }
    
    // Add selected nearby points
    this.selectedPoints.forEach(id => selectedIds.push(id));

    if (selectedIds.length === 0) {
      alert('Please select at least one point to annotate');
      return;
    }

    this.activeModal.close({
      action: 'annotateMultiple',
      data: selectedIds
    });
  }

  // Bar chart methods
  toggleBarChart(primaryId: string) {
    if (this.expandedCharts.has(primaryId)) {
      this.expandedCharts.delete(primaryId);
    } else {
      this.expandedCharts.add(primaryId);
    }
  }

  isChartExpanded(primaryId: string): boolean {
    return this.expandedCharts.has(primaryId);
  }

  getRawDataForPoint(primaryId: string): any {
    // Find the raw data for this primary ID
    if (this.dataService.raw && this.dataService.raw.df && this.dataService.raw.df.count() > 0) {
      const rawData = this.dataService.raw.df.where(row => 
        row[this.dataService.rawForm.primaryIDs] === primaryId
      ).first();
      return rawData || null;
    }
    return null;
  }
}