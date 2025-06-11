export interface EmailApiRequest {
    email: string;
    subject: string;
    message: string;
    scheduledFor: string;
    timezone: string;
    taskType: string;
}