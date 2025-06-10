import { EmailDbRequest, InsertEmailDbRequest } from "../models/emailDbRequest.js";
import { DbService } from './dbService.js';
import { sendEmail } from './resendService.js';
import { format, formatDistanceToNow, parseISO, isValid } from 'date-fns';
import { formatInTimeZone, toZonedTime, fromZonedTime } from 'date-fns-tz';

// Rate limiting configuration
const RATE_LIMIT = {
    maxEmailsPerMinute: 10,
    timeWindowMs: 60 * 1000, // 1 minute
};

// Time window for processing emails (in milliseconds)
const PROCESSING_WINDOW_MS = 60 * 1000; // 1 minute window

// Server timezone (Oregon, US West)
const SERVER_TIMEZONE = 'America/Los_Angeles';

// Define the input payload type
interface EmailPayload {
    subject: string;
    email: string;
    message: string;
    scheduledFor: string;
    timezone?: string; // Optional timezone, defaults to server timezone
}

export class SchedulerService {
    private static emailQueue: EmailDbRequest[] = [];
    private static lastProcessedTime: number = 0;
    private static emailsProcessedInWindow: number = 0;

    private static parseDate(dateStr: string, timezone: string = SERVER_TIMEZONE): Date {
        try {
            // Always try to parse as ISO string first
            const isoDate = parseISO(dateStr);
            if (isValid(isoDate)) {
                // Convert to server timezone
                return toZonedTime(isoDate, timezone);
            }

            // If not valid ISO, try parsing as local date string
            const localDate = new Date(dateStr);
            if (isValid(localDate)) {
                // Convert to server timezone
                return toZonedTime(localDate, timezone);
            }

            throw new Error(`Invalid date format: ${dateStr}`);
        } catch (error) {
            console.error('Error parsing date:', error);
            throw error;
        }
    }

    private static convertToUTC(date: Date, timezone: string = SERVER_TIMEZONE): Date {
        return fromZonedTime(date, timezone);
    }

    static async checkAndProcessEmails() {
        try {
            const pendingEmails: EmailDbRequest[] = await DbService.findAllPending();
            const currentTime = toZonedTime(new Date(), SERVER_TIMEZONE);

            console.log('Current server time:', formatInTimeZone(currentTime, SERVER_TIMEZONE, 'yyyy-MM-dd HH:mm:ss zzz'));
            console.log('Total pending emails:', pendingEmails.length);

            // Reset rate limiting counter if we're in a new time window
            if (currentTime.getTime() - this.lastProcessedTime >= RATE_LIMIT.timeWindowMs) {
                this.emailsProcessedInWindow = 0;
                this.lastProcessedTime = currentTime.getTime();
            }

            // Filter emails that are due within the processing window
            const dueEmails = pendingEmails.filter(email => {
                const scheduledTime = this.parseDate(email.scheduled_for);
                const timeDiff = scheduledTime.getTime() - currentTime.getTime();
                
                // Log detailed information about each email
                console.log(`Email ${email.id}:`, {
                    scheduledTime: formatInTimeZone(scheduledTime, SERVER_TIMEZONE, 'yyyy-MM-dd HH:mm:ss zzz'),
                    currentTime: formatInTimeZone(currentTime, SERVER_TIMEZONE, 'yyyy-MM-dd HH:mm:ss zzz'),
                    timeDiffMs: timeDiff,
                    timeUntilDue: formatDistanceToNow(scheduledTime, { addSuffix: true }),
                    isDue: timeDiff <= 0 && timeDiff >= -PROCESSING_WINDOW_MS,
                    status: email.status
                });

                return timeDiff <= 0 && timeDiff >= -PROCESSING_WINDOW_MS;
            });

            console.log('Due Emails:', dueEmails.length > 0 ? dueEmails : 'No emails due at this time');

            // Process emails respecting rate limits
            for (const email of dueEmails) {
                if (this.emailsProcessedInWindow >= RATE_LIMIT.maxEmailsPerMinute) {
                    console.log('Rate limit reached, waiting for next time window...');
                    break;
                }

                try {
                    const response = await sendEmail({
                        to: email.to,
                        from: email.from,
                        subject: email.subject,
                        html: email.body
                    });

                    console.log('Resend Response: ', response);

                    // Update email status to sent
                    await DbService.updateEmailStatus(email.id, 'sent');
                    this.emailsProcessedInWindow++;

                    console.log(`Email sent successfully to ${email.to} from ${email.from}`);
                } catch (error) {
                    console.error(`Failed to send email to ${email.to}:`, error);
                    // Update email status to failed
                    await DbService.updateEmailStatus(email.id, 'failed');
                }
            }

            // Log remaining pending emails
            const remainingPending = pendingEmails.length - dueEmails.length;
            if (remainingPending > 0) {
                console.log(`${remainingPending} emails still pending for future delivery`);
                // Log the next scheduled email
                const nextScheduled = pendingEmails
                    .filter(email => this.parseDate(email.scheduled_for).getTime() > currentTime.getTime())
                    .sort((a, b) => this.parseDate(a.scheduled_for).getTime() - this.parseDate(b.scheduled_for).getTime())[0];
                
                if (nextScheduled) {
                    const nextScheduledTime = this.parseDate(nextScheduled.scheduled_for);
                    console.log('Next scheduled email:', {
                        id: nextScheduled.id,
                        scheduledFor: formatInTimeZone(nextScheduledTime, SERVER_TIMEZONE, 'yyyy-MM-dd HH:mm:ss zzz'),
                        timeUntilDue: formatDistanceToNow(nextScheduledTime, { addSuffix: true })
                    });
                }
            }

        } catch (error) {
            console.error('Error in scheduler:', error);
        }
    }

    // Add method to handle new email payload
    static async scheduleEmail(payload: EmailPayload): Promise<void> {
        try {
            const timezone = payload.timezone || SERVER_TIMEZONE;
            const scheduledDate = this.parseDate(payload.scheduledFor, timezone);
            const utcDate = this.convertToUTC(scheduledDate, timezone);
            
            const emailRequest = new InsertEmailDbRequest(
                payload.email,  // to
                payload.email,  // from (using same email as sender)
                payload.subject,
                payload.message,
                utcDate.toISOString(), // Store in UTC
                'pending'
            );

            await DbService.createEmail(emailRequest);
            console.log(`Email scheduled for ${formatInTimeZone(scheduledDate, timezone, 'yyyy-MM-dd HH:mm:ss zzz')}`);
        } catch (error) {
            console.error('Error scheduling email:', error);
            throw error;
        }
    }
}

/**
 * Example payload:
 * {
 *     "subject": "Hello",
 *     "email": "samosacynicalsamosa.x@gmail.com",
 *     "message": "This is a test email",
 *     "scheduledFor": "2025-10-06T12:50:00"
 * }
 */