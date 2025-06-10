import { Request, Response } from 'express';
import { EmailApiRequest } from '../models/emailApiRequest.js';
import { InsertEmailDbRequest } from '../models/emailDbRequest.js';
import { DbService } from '../services/dbService.js';
import { convertToServerTime } from '../utils/index.js';

const FROM = process.env.FROM_EMAIL || 'noreply@example.com';
const SERVER_TIMEZONE = Intl.DateTimeFormat().resolvedOptions().timeZone || 'America/Los_Angeles';

export const createTask = async (req: Request, res: Response) => {
    try {
        const { email, subject, message, scheduledFor } = req.body as EmailApiRequest;
        
        // Convert to server time and validate
        const scheduledDate = convertToServerTime(scheduledFor);
        const now = new Date();
        
        if (scheduledDate < now) {
            return res.status(400).json({ 
                error: "Scheduled time must be in the future",
                serverTime: now.toISOString(),
                timezone: SERVER_TIMEZONE
            });
        }

        const payload: InsertEmailDbRequest = {
            to: email,
            from: FROM,
            subject,
            body: message,
            scheduled_for: scheduledDate.toISOString(),
            status: 'pending'
        };

        console.log('Creating task with server time:', {
            originalTime: scheduledFor,
            serverTime: scheduledDate.toISOString(),
            timezone: SERVER_TIMEZONE
        });

        const response = await DbService.createEmail(payload);
        console.log('Task created successfully:', { payload, response });

        res.status(200).json({ 
            message: "Task created successfully",
            scheduledTime: scheduledDate.toISOString(),
            timezone: SERVER_TIMEZONE
        });
    } catch (error) {
        console.error('Failed to create task:', error);
        res.status(500).json({ 
            error: "Failed to create task",
            timezone: SERVER_TIMEZONE
        });
    }
}