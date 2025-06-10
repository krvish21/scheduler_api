import './env.js';
import { createClient } from '@supabase/supabase-js'

const url = process.env.SUPABASE_URL
const key = process.env.SUPABASE_API_KEY

if (!url || !key) {
    console.log('DATABASE KEY OR URL is not set')
    throw new Error('DATABASE KEY OR URL is not set')
}

const supabase = createClient(url, key)

export default supabase;