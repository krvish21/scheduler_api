import { Request, Response } from 'express';
import { EmailApiRequest } from '../models/emailApiRequest.js';
import { InsertEmailDbRequest } from '../models/emailDbRequest.js';
import { DbService } from '../services/dbService.js';

const FROM = process.env.FROM_EMAIL || 'noreply@example.com';

export const sendEmail = async (req: Request, res: Response) => {
    try {
        const { email, subject, message, scheduledFor } = req.body as EmailApiRequest;
        const emailDbRequest = new InsertEmailDbRequest(email, FROM!, subject, message, scheduledFor, 'pending');
        const result = await DbService.createEmail(emailDbRequest);
        console.log(result);

        res.status(200).json({ message: "Email sent successfully" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to send email" });
    }
};