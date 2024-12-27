const supabase = require('./supabaseClient');

class Queries {
    getColumnValue(data, column) {
        return data[0][column]
    }

    getColumnRows(data, column) {
        return data.map(row => row[column])
    }

    async getTotalViews() {
        const { data, error } = await supabase
            .from('view_counter')
            .select('*')
            .eq('name', 'Total');
        if (error) {
            throw new Error(`Erro ao buscar contador "Total": ${error.message}`);
        }
        return data;
    }

    async getResetMonthlyViews() {
        const { data, error } = await supabase
            .rpc('get_and_reset_monthly_views');
        if (error) {
            throw new Error(`Erro ao buscar/resetar contador "Mensal": ${error.message}`);
        }
        return data;
    }

    async getResetDailyViews() {
        const { data, error } = await supabase
            .rpc('get_and_reset_daily_views');
        if (error) {
            throw new Error(`Erro ao buscar/resetar contador "Diária": ${error.message}`);
        }
        return data;
    }

    async incrementTotalViews() {
        const { data, error } = await supabase.rpc('increment_views', { counter_name: 'Total' });
        if (error) {
            throw new Error(`Erro ao incrementar contador "Total": ${error.message}`);
        }
        return data;
    }

    async incrementMonthlyViews() {
        const { data, error } = await supabase.rpc('increment_views', { counter_name: 'Mensal' });
        if (error) {
            throw new Error(`Erro ao incrementar contador "Mensal": ${error.message}`);
        }
        return data;
    }

    async incrementDailyViews() {
        const { data, error } = await supabase.rpc('increment_views', { counter_name: 'Diária' });
        if (error) {
            throw new Error(`Erro ao incrementar contador "Diária": ${error.message}`);
        }
        return data;
    }
}

module.exports = new Queries();