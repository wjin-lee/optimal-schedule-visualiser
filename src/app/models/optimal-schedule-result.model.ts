import { SchedulerMessageCode } from "../enums/scheduler-message-code.enum";
import { BaseSchedulerResult } from "./base-scheduler-result.model";

export class OptimalScheduleResult extends BaseSchedulerResult {
    schedule: any;

    constructor(schedule: any) {
        super(SchedulerMessageCode.OPTIMAL_FOUND)

        this.schedule = schedule;
    }

}