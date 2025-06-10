import { parseISO, isValid } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';

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
    const SERVER_TIMEZONE = Intl.DateTimeFormat().resolvedOptions().timeZone;

    const date = parseDate(utcTime);
    return toZonedTime(date, SERVER_TIMEZONE);
}