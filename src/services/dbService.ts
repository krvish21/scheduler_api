import { InsertEmailDbRequest } from "../models/emailDbRequest.js";
import supabase from "../config/db.js";
import { format } from "date-fns";

export class DbService {
    static async createEmail(email: InsertEmailDbRequest) {
        email['scheduled_for'] = format(new Date(email['scheduled_for']), 'yyyy-MM-dd HH:mm:ss')
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

    static async updateEmailStatus(id: string, status: string) {
        const { error: supabaseError } = await supabase.from('email')
            .update({ status })
            .eq('id', id);

        if(supabaseError) {
            console.error(supabaseError);
            throw supabaseError;
        }
    }
}