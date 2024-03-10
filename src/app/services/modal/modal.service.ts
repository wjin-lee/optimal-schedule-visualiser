import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { ModalTemplate } from '../../enums/modal-template.enum';
import { SchedulerException } from 'src/app/models/scheduler-exception.model';
import { OptimalScheduleResult } from 'src/app/models/optimal-schedule-result.model';

@Injectable({
  providedIn: 'root'
})
export class ModalService {
  private modalTemplateSubject: BehaviorSubject<ModalTemplate> = new BehaviorSubject<ModalTemplate>(ModalTemplate.LOADING);
  modalTemplate$: Observable<ModalTemplate> = this.modalTemplateSubject.asObservable();

  private _optimalSchedule: any = {};
  private _schedulerException: SchedulerException = {} as SchedulerException;

  showStart() {
    this.modalTemplateSubject.next(ModalTemplate.START);
  }

  showLoading() {
    this.modalTemplateSubject.next(ModalTemplate.LOADING);
  }

  updateSummary(result: OptimalScheduleResult) {
    this._optimalSchedule = result.schedule;
  }

  showSummary() {
    this.modalTemplateSubject.next(ModalTemplate.SUMMARY);
  }

  showSchedulerException(exception: SchedulerException) {
    this._schedulerException = exception;
    this.modalTemplateSubject.next(ModalTemplate.SCHEDULER_EXCEPTION);
  }
  
  closeModal() {
    this.modalTemplateSubject.next(ModalTemplate.HIDDEN);
  }

  public get selectedTemplate(): any {
    return this.modalTemplateSubject.getValue();
  }

  public get optimalSchedule(): any {
    return this._optimalSchedule;
  }

  public get schedulerException(): SchedulerException {
    return this._schedulerException;
  }
}
