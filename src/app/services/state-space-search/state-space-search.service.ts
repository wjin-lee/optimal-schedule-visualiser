import { Injectable } from '@angular/core';
import { StateSpaceSearchMetrics } from '../../models/state-space-search-metrics.model';
import { BehaviorSubject, Observable } from 'rxjs';
import { ModalService } from '../modal/modal.service';
import { SchedulerMessageCode } from 'src/app/enums/scheduler-message-code.enum';
import { BaseSchedulerResult } from 'src/app/models/base-scheduler-result.model';
import { OptimalScheduleResult } from 'src/app/models/optimal-schedule-result.model';
import { SchedulerException } from 'src/app/models/scheduler-exception.model';
import { ResourceUsageMetrics } from 'src/app/models/resource-usage-metrics.model';
import { ModalTemplate } from 'src/app/enums/modal-template.enum';

@Injectable({
  providedIn: 'root'
})
export class StateSpaceSearchService {
  public static readonly MAX_TASK_COUNT = 25;

  private socket: WebSocket;
  private taskCountSubject = new BehaviorSubject<number>(-1);  // For notifying search vis ready event
  taskCount$: Observable<number> = this.taskCountSubject.asObservable();

  // Schedule data
  private scheduleDataSubject = new BehaviorSubject<any>(null);
  scheduleData$: Observable<any> = this.scheduleDataSubject.asObservable();

  // Metrics
  private stateSpaceMetricsSubject = new BehaviorSubject<StateSpaceSearchMetrics>(new StateSpaceSearchMetrics(0, 0));
  stateSpaceMetrics$: Observable<StateSpaceSearchMetrics> = this.stateSpaceMetricsSubject.asObservable();
  private numStates: number = 0;
  private numProcessed: number = 0; // Number of schedules actually processed
  private lastNumStates: number = 0;  // Last recorded number of schedules

  private resourceUsageMetricsSubject = new BehaviorSubject<ResourceUsageMetrics>(new ResourceUsageMetrics(Infinity, Infinity));  // Don't false report. Inf gets mapped to "-" in UI
  resourceUsageMetrics$: Observable<ResourceUsageMetrics> = this.resourceUsageMetricsSubject.asObservable();

  // Generation Rate
  private generationRateIntervalId: any;
  private generationRateSubject = new BehaviorSubject<number>(0);
  generationRate$: Observable<number> = this.generationRateSubject.asObservable();

  private readonly PORT = location.port;

  /* CONFIGURABLE PARAMETERS */
  private readonly GENERATION_UPDATE_RATE = 250;  // Update rate in ms

  constructor(private modalService: ModalService) {
    this.socket = new WebSocket(`ws://localhost:${this.PORT}/socket`);

    // Set handlers - if we simply do this._socket.onopen = this.onOpen, 'this' will have the wrong context.
    this.socket.onopen = () => this.onOpen();
    this.socket.onmessage = (event: MessageEvent) => this.onMessage(event);
    this.socket.onclose = () => this.onClosed();
  }

  startSearch() {
    this.sendMessage("SCHEDULER_START");
    this._startGenerationRateCalc();
    this.modalService.closeModal()
  }

  displaySummary(result: BaseSchedulerResult) {
    this._stopGenerationRateCalc();
    
    if (result instanceof OptimalScheduleResult) {
      this.modalService.updateSummary(result);
      this.modalService.showSummary();
    } else if (result instanceof SchedulerException) {
      this.modalService.showSchedulerException(result);
    } else {
      console.error(`Unexpected result type ${typeof result}`)
    }
  }

  /**
   * WebSocket open handler
   */
  onOpen() {
    console.log("WebSocket opened.");
  }

  /**
   * Receives and processes socket messages from scheduler.
   * @param event message event
   */
  onMessage(event: MessageEvent) {
    try {
      const data = JSON.parse(event.data)
      if (this.taskCountSubject.getValue() != -1) {
        // Publish schedule data update
        this.scheduleDataSubject.next(data);

        // Update metadata and notify
        this.numStates += data["schedules"].length;
        this.numProcessed++;

        this.stateSpaceMetricsSubject.next(new StateSpaceSearchMetrics(this.numStates, this.numProcessed));

        if (this.generationRateIntervalId == undefined) {
          console.log("Schedule generation message received with no generation rate calc scheduled. Forcibly starting generation rate calculations.")
          this._startGenerationRateCalc();
        }
      } else {
        // If we received a schedule update message before we received a task count, we connected mid-search. - Ignore
        console.log("Received schedule update message before task count! Ignoring.")
      }
    } catch (error) {
      // We have received either a task count or scheduler result message.
      this.handleSchedulerMetadata(event.data);
    }
  }

  /**
   * WebSocket close handler
   */
  onClosed() {
    console.log("WebSocket closed.");
    this.displaySummary(new SchedulerException(
      SchedulerMessageCode.ERROR, 
      "Could Not Connect to Scheduler!", 
      "Please ensure the scheduler is running with visualisation enabled (-v flag) and is showing 'Waiting for UI to open WebSocket...', then reload this page."
    ))
    this.resourceUsageMetricsSubject.next(new ResourceUsageMetrics(Infinity, Infinity));
  }

  /**
   * Handles metadata (non-schedule) updates from the scheduler.
   * @param metadataMessage message from the scheduler.
   */
  handleSchedulerMetadata(metadataMessage: string) {
    let [messageType, value] = metadataMessage.split("=", 2)  // value potentially undefined!

    switch (messageType) {
      case SchedulerMessageCode.TASK_COUNT:
        console.log(`TASK COUNT: ${value}`)
        this.taskCountSubject.next(parseInt(value));  // Trust that it is int, otherwise let it error.
        // We have everything to start. Show start button
        this.modalService.showStart();
        break;

      case SchedulerMessageCode.RESOURCE_UPDATE:
        // Parse resource metrics - it is in the format RESOURCE=<CPU_USAGE>|<MEMORY_USAGE> - e.g. RESOURCE=2.2695750976938323|3.736634479243394
        let [cpuUsage, memUsage] = value.split("|", 2);
        if (this.modalService.selectedTemplate == ModalTemplate.HIDDEN) {
          this.resourceUsageMetricsSubject.next(new ResourceUsageMetrics(this.roundToTwoSF(parseFloat(cpuUsage)), this.roundToTwoSF(parseFloat(memUsage))));
        }
        break;

      case SchedulerMessageCode.OPTIMAL_FOUND:
        console.log(`OPTIMAL: ${value}`);
        let optimal_sch = JSON.parse(value);

        // Draw last line to outer ring.
        // The update thread expects a parent, child format. Consider optimal schedule as a parent with no further children.
        this.scheduleDataSubject.next({parent: optimal_sch, schedules: []});

        this.displaySummary(new OptimalScheduleResult(optimal_sch));
        this.resourceUsageMetricsSubject.next(new ResourceUsageMetrics(Infinity, Infinity));
        break;

      case SchedulerMessageCode.NO_OPTIMAL_FOUND:
        console.log(`NO OPTIMAL SCHEDULE FOUND!`)
        this.displaySummary(new SchedulerException(
          SchedulerMessageCode.NO_OPTIMAL_FOUND, 
          "NO OPTIMAL SCHEDULE", 
          "An optimal schedule could not be determined for this graph."
        ))
        this.resourceUsageMetricsSubject.next(new ResourceUsageMetrics(Infinity, Infinity));
        break;

        case SchedulerMessageCode.ERROR:
          console.log(`SCHEDULER ERROR: ${value}`)
          this.displaySummary(new SchedulerException(
            SchedulerMessageCode.ERROR, 
            "SCHEDULER ERROR", 
            value
          ))
          this.resourceUsageMetricsSubject.next(new ResourceUsageMetrics(Infinity, Infinity));
          break;

      default:
        console.error(`Unexpected Message: ${metadataMessage}`)
    }
  }

  /**
   * Sends a message to the scheduler server.
   * 
   * @param message message to send
   */
  sendMessage(message: string) {
    this.socket.send(message);
  }

  _startGenerationRateCalc() {
    this.generationRateIntervalId = setInterval(() => this._calcGenerationRate(), this.GENERATION_UPDATE_RATE);
  }

  _stopGenerationRateCalc() {
    clearInterval(this.generationRateIntervalId)
    this.generationRateSubject.next(0);
  }

  /**
   * Calculates the schedule generation rate.
   */
  _calcGenerationRate() {
    this.generationRateSubject.next((this.numStates - this.lastNumStates) / (this.GENERATION_UPDATE_RATE/1000))
    this.lastNumStates = this.numStates;
  }

  /**
   * Convenience function to round to 2 decimal places.
   * @param n: number
   * @returns n rounded to two decimal places.
   */
  roundToTwoSF(n: number) {
    return Math.round((n + Number.EPSILON) * 100) / 100
  }

  public get numGeneratedStates(): number {
    return this.numStates;
  }
}
