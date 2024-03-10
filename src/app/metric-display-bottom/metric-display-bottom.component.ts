import { Component } from '@angular/core';
import { StateSpaceSearchService } from '../services/state-space-search/state-space-search.service';

@Component({
  selector: 'app-metric-display-bottom',
  templateUrl: './metric-display-bottom.component.html',
  styleUrls: ['./metric-display-bottom.component.css']
})
export class MetricDisplayBottomComponent {
  readonly INFINITY = Infinity;  // Expose for html template

  cpuUsage: number = Infinity;
  memoryUsage: number = Infinity;

  constructor(private stateSpaceSearchService: StateSpaceSearchService) {
    // Subscribe to metrics
    this.stateSpaceSearchService.resourceUsageMetrics$.subscribe(metrics => {
      this.cpuUsage = metrics.cpuUsage;
      this.memoryUsage = metrics.memoryUsage;
    });
  }
}

