export class InsertEmailDbRequest {
    to: string;
    from: string;
    subject: string;
    body: string;
    scheduled_for: string;
    status: string;
    timezone: string;
    task_type: string;

    constructor(to: string, from: string, subject: string, body: string, scheduled_for: string, status: string, timezone: string, task_type: string) {
        this.to = to;
        this.from = from;
        this.subject = subject;
        this.body = body;
        this.scheduled_for = scheduled_for;
        this.status = status;
        this.timezone = timezone;
        this.task_type = task_type;
    }
}

export interface EmailDbRequest {
    id: string,
    to: string;
    from: string;
    subject: string;
    body: string;
    scheduled_for: string;
    status: string;
    timezone: string;
    task_type: string;
}