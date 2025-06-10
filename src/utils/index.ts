import { parseISO, isValid } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';

// Force the server timezone to be Asia/Kolkata (IST)
const SERVER_TIMEZONE = 'Asia/Kolkata';

export function parseDate(dateStr: string): Date {
    try {
        const date = parseISO(dateStr);
        if (!isValid(date)) {
            throw new Error(`Invalid date format: ${dateStr}`);
        }
        return date;
    } catch (error) {
        console.error('Error parsing date:', error);
        throw error;
    }
}

export function convertToServerTime(utcTime: string): Date {
    // First parse the UTC time
    const utcDate = parseDate(utcTime);
    // Then convert to server timezone
    return toZonedTime(utcDate, SERVER_TIMEZONE);
}

export function convertToUTC(date: Date): Date {
    // Convert the date to UTC
    const utcDate = new Date(date.getTime() + date.getTimezoneOffset() * 60000);
    return utcDate;
}