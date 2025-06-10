export class InsertEmailDbRequest {
    to: string;
    from: string;
    subject: string;
    body: string;
    scheduled_for: string;
    status: string;

    constructor(to: string, from: string, subject: string, body: string, scheduled_for: string, status: string) {
        this.to = to;
        this.from = from;
        this.subject = subject;
        this.body = body;
        this.scheduled_for = scheduled_for;
        this.status = status;
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
}