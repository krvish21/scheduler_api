import '../config/env.js';
import { Resend } from "resend";

export interface EmailPayload {
    to: string;
    from: string;
    subject: string;
    html: string;
}

// Validate environment variables
if (!process.env.RESEND_API_KEY) {
    throw new Error('RESEND_API_KEY is not set in environment variables');
}

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendEmail(payload: EmailPayload) {
    try {
        // Validate payload
        if (!payload.to || !payload.from || !payload.subject || !payload.html) {
            throw new Error('Missing required email fields');
        }

        console.log('Sending email to %s', payload.to);
        const response = await resend.emails.send(payload);

        // Check for API errors
        if (response.error) {
            console.error('Resend API Error:', {
                name: response.error.name,
                message: response.error.message
            });

            // Handle specific error cases
            if (response.error.name === 'application_error') {
                throw new Error(`Resend API Error: ${response.error.message}`);
            }
            
            throw response.error;
        }

        return response;
    } catch (error: any) {
        // Enhanced error logging
        console.error('Email sending failed:', {
            error: error.message,
            name: error.name,
            payload: {
                to: payload.to,
                from: payload.from,
                subject: payload.subject
            }
        });

        // Rethrow with more context
        throw new Error(`Failed to send email: ${error.message}`);
    }
}

