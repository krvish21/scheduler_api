import { InsertEmailDbRequest } from "../models/emailDbRequest.js";
import supabase from "../config/db.js";
import { parseDate } from "../utils/index.js";

export class DbService {
    static async createEmail(email: InsertEmailDbRequest) {
        
        const scheduledDate = parseDate(email['scheduled_for']);
        email['scheduled_for'] = scheduledDate.toISOString();
        const { error: supabaseError } = await supabase.from('email')
        .insert([email]);

        if(supabaseError) {
            console.error(supabaseError);
            throw supabaseError;
        }
        return email;
    }

    static async findAllPending() {
        const { data, error: supabaseError } = await supabase.from('email')
        .select('*').eq('status', 'pending');

        if(supabaseError) {
            console.error(supabaseError);
            throw supabaseError;
        }

        return data;
    }

    static async findAllSent() {
        const { data, error: supabaseError } = await supabase.from('email')
        .select('*').eq('status', 'sent');
        
        if(supabaseError) {
            console.error(supabaseError);
            throw supabaseError;
        }

        return data;
    }

    static async updateEmailStatus(id: string, status: string) {
        const { error: supabaseError } = await supabase.from('email')
            .update({ status })
            .eq('id', id);

        if(supabaseError) {
            console.error(supabaseError);
            throw supabaseError;
        }
    }

    static async deleteEmail(id: string) {
        const { error: supabaseError } = await supabase.from('email')
            .delete()
            .eq('id', id);

        if(supabaseError) {
            console.error(supabaseError);
            throw supabaseError;
        }
    }
}