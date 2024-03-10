import { SchedulerMessageCode } from "../enums/scheduler-message-code.enum";
import { BaseSchedulerResult } from "./base-scheduler-result.model";

export class SchedulerException extends BaseSchedulerResult {
    title: string;
    text: string;

    constructor(resultCode: SchedulerMessageCode, title: string, text: string) {
        super(resultCode)

        this.title = title;
        this.text = text;
    }

}