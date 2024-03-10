import { Component } from '@angular/core';
import { StateSpaceSearchService } from '../services/state-space-search/state-space-search.service';

@Component({
  selector: 'app-metric-display-top',
  templateUrl: './metric-display-top.component.html',
  styleUrls: ['./metric-display-top.component.css']
})
export class MetricDisplayTopComponent {
  numGeneratedSchedules: number = 0;
  generationRate: number = 0;
  numProcessedSchedules: number = 0;

  constructor(private stateSpaceSearchService: StateSpaceSearchService) {

    // Subscribe to metrics
    this.stateSpaceSearchService.stateSpaceMetrics$.subscribe(metrics => {
      this.numGeneratedSchedules = metrics.numStates;
      this.numProcessedSchedules = metrics.numProcessed;
    });

    // Subscribe to generation rate
    this.stateSpaceSearchService.generationRate$.subscribe(rate => {
      this.generationRate = rate;
    });
  }
}
