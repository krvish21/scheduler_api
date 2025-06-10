import { EmailDbRequest, InsertEmailDbRequest } from "../models/emailDbRequest.js";
import { parseDate, convertToUTC, convertToServerTime } from "../utils/index.js";
import { DbService } from './dbService.js';
import { sendEmail } from './resendService.js';
import { format, formatDistanceToNow, differenceInMilliseconds, isBefore, isAfter } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';

// Rate limiting configuration
const RATE_LIMIT = {
    maxEmailsPerMinute: 10,
    timeWindowMs: 60 * 1000, // 1 minute
};

// Time window for processing emails (in milliseconds)
const PROCESSING_WINDOW_MS = 60 * 1000; // 1 minute window

// Get server timezone from utils
const SERVER_TIMEZONE = 'Asia/Kolkata';

// Define the input payload type
interface EmailPayload {
    subject: string;
    email: string;
    message: string;
    scheduledFor: string; // ISO string in UTC
}

export class SchedulerService {
    private static lastProcessedTime: number = 0;
    private static emailsProcessedInWindow: number = 0;

    static async checkAndProcessEmails() {
        try {
            const pendingEmails: EmailDbRequest[] = await DbService.findAllPending();
            // Get current time in UTC
            const currentTime = new Date();

            // Reset rate limiting counter if we're in a new time window
            if (currentTime.getTime() - this.lastProcessedTime >= RATE_LIMIT.timeWindowMs) {
                this.emailsProcessedInWindow = 0;
                this.lastProcessedTime = currentTime.getTime();
            }

            // Filter emails that are due within the processing window
            const dueEmails = pendingEmails.filter(email => {
                const scheduledTime = parseDate(email.scheduled_for);
                const timeDiff = differenceInMilliseconds(scheduledTime, currentTime);
                
                // Log each email's time comparison
                console.log('Email time check:', {
                    emailId: email.id,
                    scheduledTime: format(scheduledTime, "yyyy-MM-dd'T'HH:mm:ss'Z'"),
                    currentTime: format(currentTime, "yyyy-MM-dd'T'HH:mm:ss'Z'"),
                    timeDiff,
                    isDue: timeDiff <= 0 && timeDiff >= -PROCESSING_WINDOW_MS
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
                    console.log('Sending email:', {
                        to: email.to,
                        from: email.from,
                        subject: email.subject,
                        scheduledFor: email.scheduled_for
                    });

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
                    .filter(email => {
                        const scheduledTime = parseDate(email.scheduled_for);
                        return isAfter(scheduledTime, currentTime);
                    })
                    .sort((a, b) => {
                        const timeA = parseDate(a.scheduled_for);
                        const timeB = parseDate(b.scheduled_for);
                        return timeA.getTime() - timeB.getTime();
                    })[0];
                
                if (nextScheduled) {
                    const nextScheduledTime = parseDate(nextScheduled.scheduled_for);
                    const timeUntilNext = differenceInMilliseconds(nextScheduledTime, currentTime);
                    
                    // Debug log to check times
                    console.log('Time Debug:', {
                        currentTime: format(currentTime, "yyyy-MM-dd'T'HH:mm:ss'Z'"),
                        scheduledTime: format(nextScheduledTime, "yyyy-MM-dd'T'HH:mm:ss'Z'"),
                        timeDiff: timeUntilNext,
                        serverTimezone: SERVER_TIMEZONE,
                        currentTimeIST: format(toZonedTime(currentTime, SERVER_TIMEZONE), "yyyy-MM-dd'T'HH:mm:ssXXX"),
                        scheduledTimeIST: format(toZonedTime(nextScheduledTime, SERVER_TIMEZONE), "yyyy-MM-dd'T'HH:mm:ssXXX")
                    });

                    console.log('Next scheduled email:', {
                        id: nextScheduled.id,
                        scheduledForUTC: format(nextScheduledTime, "yyyy-MM-dd'T'HH:mm:ss'Z'"),
                        scheduledForServer: format(toZonedTime(nextScheduledTime, SERVER_TIMEZONE), "yyyy-MM-dd'T'HH:mm:ssXXX"),
                        timeUntilDue: formatDistanceToNow(nextScheduledTime, { 
                            addSuffix: true,
                            includeSeconds: true
                        })
                    });
                }
            }

        } catch (error) {
            console.error('Error in scheduler:', error);
        }
    }
}

/**
 * Example payload:
 * {
 *     "subject": "Hello",
 *     "email": "samosacynicalsamosa.x@gmail.com",
 *     "message": "This is a test email",
 *     "scheduledFor": "2025-10-06T12:50:00Z"  // UTC time with Z suffix
 * }
 */