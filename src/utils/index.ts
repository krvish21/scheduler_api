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
    const date = parseDate(utcTime);
    return toZonedTime(date, SERVER_TIMEZONE);
}

export function convertToUTC(date: Date): Date {
    // Since the input date is already in UTC, we just need to ensure it's properly formatted
    return new Date(date.getTime() - date.getTimezoneOffset() * 60000);
}