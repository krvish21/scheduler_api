export interface EmailApiRequest {
    email: string;
    subject: string;
    message: string;
    scheduledFor: string;
    timezone?: string; // Optional timezone, defaults to server timezone (America/Los_Angeles)
}