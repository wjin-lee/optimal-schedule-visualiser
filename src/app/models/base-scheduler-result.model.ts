import { SchedulerMessageCode } from "../enums/scheduler-message-code.enum";

export abstract class BaseSchedulerResult {
    resultCode: SchedulerMessageCode;

    constructor(resultCode: SchedulerMessageCode) {
        this.resultCode = resultCode;
    }
}