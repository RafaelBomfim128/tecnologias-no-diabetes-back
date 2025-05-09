const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');

dotenv.config();

const SUPABASE_URL_DEV = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY_DEV = process.env.SUPABASE_ANON_KEY;
const supabaseDev = createClient(SUPABASE_URL_DEV, SUPABASE_ANON_KEY_DEV);

const SUPABASE_URL_PROD = process.env.SUPABASE_URL_PROD;
const SUPABASE_ANON_KEY_PROD = process.env.SUPABASE_ANON_KEY_PROD;
const supabaseProd = createClient(SUPABASE_URL_PROD, SUPABASE_ANON_KEY_PROD);

async function keepSupabaseActive() {
    try {
        const { data, error } = await supabaseDev
            .from('view_counter')
            .select('views')
            .eq('name', 'Total')
            .limit(1);

        if (error) {
            throw new Error(`Supabase Dev error: ${error.message}`);
        }

        console.log('Successfully connected to Supabase Dev, data retrieved:', data);
    } catch (err) {
        console.error('Dev connection error:', err);
        throw err;
    }

    try {
        const { data, error } = await supabaseProd
            .from('view_counter')
            .select('views')
            .eq('name', 'Total')
            .limit(1);

        if (error) {
            throw new Error(`Supabase Prod error: ${error.message}`);
        }

        console.log('Successfully connected to Supabase Prod, data retrieved:', data);
    } catch (err) {
        console.error('Prod connection error:', err);
        throw err;
    }
}

module.exports = { keepSupabaseActive };