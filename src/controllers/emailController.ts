import { Request, Response } from 'express';
import { EmailApiRequest } from '../models/emailApiRequest.js';
import { InsertEmailDbRequest } from '../models/emailDbRequest.js';
import { DbService } from '../services/dbService.js';
import { convertToServerTime, convertToUTC } from '../utils/index.js';
import { parseISO, isValid } from 'date-fns';

const FROM = process.env.FROM_EMAIL || 'noreply@example.com';
const SERVER_TIMEZONE = Intl.DateTimeFormat().resolvedOptions().timeZone || 'America/Los_Angeles';

export const createTask = async (req: Request, res: Response) => {
    try {
        const { email, subject, message, scheduledFor, taskType } = req.body as EmailApiRequest;
        
        // Parse and validate the scheduled time
        const scheduledDate = parseISO(scheduledFor);
        if (!isValid(scheduledDate)) {
            return res.status(400).json({ 
                error: "Invalid date format",
                timezone: SERVER_TIMEZONE
            });
        }

        // Convert to server time for validation
        const serverTime = convertToServerTime(scheduledFor);
        const now = new Date();
        
        if (serverTime < now) {
            console.warn('[Email Task] Invalid schedule time:', {
                requestedTime: scheduledFor,
                serverTime: now.toISOString(),
                timezone: SERVER_TIMEZONE
            });
            return res.status(400).json({ 
                error: "Scheduled time must be in the future",
                serverTime: now.toISOString(),
                timezone: SERVER_TIMEZONE
            });
        }

        // Ensure we store in UTC
        const utcScheduledTime = convertToUTC(serverTime);

        const payload: InsertEmailDbRequest = {
            to: email,
            from: FROM,
            subject,
            body: message,
            scheduled_for: utcScheduledTime.toISOString(),
            status: 'pending',
            timezone: SERVER_TIMEZONE,
            task_type: taskType
        };

        console.info('[Email Task] Creating new task:', {
            to: email,
            subject,
            taskType,
            originalTime: scheduledFor,
            utcTime: utcScheduledTime.toISOString(),
            serverTime: serverTime.toISOString(),
            timezone: SERVER_TIMEZONE
        });

        const response = await DbService.createEmail(payload);
        console.info('[Email Task] Task created successfully:', {
            scheduledTime: utcScheduledTime.toISOString(),
            status: 'pending',
            taskType
        });

        res.status(200).json({ 
            message: "Task created successfully",
            scheduledTime: utcScheduledTime.toISOString(),
            timezone: SERVER_TIMEZONE,
            taskType
        });
    } catch (error) {
        console.error('[Email Task] Failed to create task:', {
            error: error instanceof Error ? error.message : 'Unknown error',
            stack: error instanceof Error ? error.stack : undefined
        });
        res.status(500).json({ 
            error: "Failed to create task",
            timezone: SERVER_TIMEZONE
        });
    }
}

export const listPendingTasks = async (req: Request, res: Response) => {
    try {
        const response = await DbService.findAllPending();
        res.status(200).json(response);
    } catch (error) {
        res.status(500).json({ 
            error: "Failed to fetch pending tasks"
        });
    }
}

export const listCompletedTasks = async (req: Request, res: Response) => {
    try {
        const response = await DbService.findAllSent();
        res.status(200).json(response);
    } catch (error) {
        res.status(500).json({ 
            error: "Failed to fetch completed tasks"
        });
    }
}

export const deleteTask = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        
        if (!id) {
            return res.status(400).json({ 
                error: "Task ID is required"
            });
        }

        await DbService.deleteEmail(id);
        
        res.status(200).json({ 
            message: "Task deleted successfully"
        });
    } catch (error) {
        console.error('[Email Task] Failed to delete task:', {
            error: error instanceof Error ? error.message : 'Unknown error',
            stack: error instanceof Error ? error.stack : undefined
        });
        res.status(500).json({ 
            error: "Failed to delete task"
        });
    }
}