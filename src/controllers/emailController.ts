import { Request, Response } from 'express';
import { EmailApiRequest } from '../models/emailApiRequest.js';
import { InsertEmailDbRequest } from '../models/emailDbRequest.js';
import { DbService } from '../services/dbService.js';
import { SchedulerService } from '../services/schedulerService.js';

const FROM = process.env.FROM_EMAIL || 'noreply@example.com';

export const sendEmail = async (req: Request, res: Response) => {
    try {
        const { email, subject, message, scheduledFor, timezone } = req.body as EmailApiRequest;
        
        // Schedule the email with timezone information
        await SchedulerService.scheduleEmail({
            email,
            subject,
            message,
            scheduledFor,
            timezone
        });

        res.status(200).json({ 
            message: "Email scheduled successfully",
            timezone: timezone || 'America/Los_Angeles' // Return the timezone used
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to schedule email" });
    }
};