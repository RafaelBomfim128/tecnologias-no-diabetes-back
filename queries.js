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
                console.error(`Erro ao buscar contador "Total": ${error.message}`);
                return null;
            }
            return data;
    }

    async getResetMonthlyViews() {
        const { data, error } = await supabase
            .rpc('get_and_reset_monthly_views');
            if (error) {
                console.error(`Erro ao buscar/resetar contador "Mensal": ${error.message}`);
                return null;
            }
            return data;
    }

    async getResetDailyViews() {
        const { data, error } = await supabase
            .rpc('get_and_reset_daily_views');
            if (error) {
                console.error(`Erro ao buscar/resetar contador "Diária": ${error.message}`);
                return null;
            }
            return data;
    }

    async incrementTotalViews() {
        const { data, error } = await supabase.rpc('increment_views', { counter_name: 'Total' });
            if (error) {
                console.error(`Erro ao incrementar contador "Total": ${error.message}`);
                return null;
            }
            return data;
    }

    async incrementMonthlyViews() {
        const { data, error } = await supabase.rpc('increment_views', { counter_name: 'Mensal' });
            if (error) {
                console.error(`Erro ao incrementar contador "Mensal": ${error.message}`);
                return null;
            }
            return data;
    }

    async incrementDailyViews() {
        const { data, error } = await supabase.rpc('increment_views', { counter_name: 'Diária' });
            if (error) {
                console.error(`Erro ao incrementar contador "Diária": ${error.message}`);
                return null;
            }
            return data;
    }

    async getAuthenticationQuiz(token) {
        const { data, error } = await supabase
            .from("authenticator")
            .select('token')
            .eq('name', 'View Sessions Quiz')
            .eq('token', token)

            if (error) {
                console.error(`Erro ao buscar autenticação para visualizar dados de sessão do Quiz": ${error.message}`);
                return null;
            }
            return data;
    }

    async getActiveSessionsQuiz(ipAddress) {
        const { data: activeSessions, error } = await supabase
            .from("quiz_sessions")
            .select("session_id, created_at")
            .eq("ip_address", ipAddress)
            .order("created_at", { ascending: true });

            if (error) {
                console.error(`Erro ao buscar sessões do Quiz de um IP específico": ${error.message}`);
                return null;
            }
            return activeSessions;
    }

    async getSessionBySessionID(sessionID) {
        const { data: session, error } = await supabase
            .from("quiz_sessions")
            .select("question_set_id, expires_at")
            .eq("session_id", sessionID)
            .maybeSingle();

            if (error) {
                console.error(`Erro ao buscar sessões do Quiz de um sessionID específico": ${error.message}`);
                return null;
            }
            return session;
    }

    async getAndDeleteOldSessionsQuiz() {
        const { data, error } = await supabase.rpc('get_and_delete_old_quiz_sessions');

            if (error) {
                console.error(`Erro ao buscar todas sessões do Quiz": ${error.message}`);
                return null;
            }
            return data;
    }

    async deleteSessionQuiz(sessionID) {
        const { data, error } = await supabase
            .from("quiz_sessions")
            .delete()
            .eq("session_id", sessionID);

            if (error) {
                console.error(`Erro ao deletar sessão do Quiz": ${error.message}`);
                return null;
            }
            return data;
    }

    async insertSessionQuiz(sessionID, ipAddress, questionSetID, expiresAt) {
            const { error: insertError } = await supabase
                .from("quiz_sessions")
                .insert([{ session_id: sessionID, ip_address: ipAddress, question_set_id: questionSetID, expires_at: expiresAt }]);

            if (insertError) {
                console.error(`Erro ao inserir sessão do Quiz": ${insertError.message}`);
                return null;
            }
    }

    async insertRankingQuiz(name, score, correctCount, ipAddress) {
            const { error: insertError } = await supabase
                .from("quiz_ranking")
                .insert([
                    {
                        name: name,
                        score: score,
                        correct_count: correctCount,
                        ip_address: ipAddress
                    }
                ]);

            if (insertError) {
                console.error(`Erro ao inserir sessão do Quiz": ${insertError.message}`);
                return null;
            }
    }

    async getQuizRanking() {
        const { data, error } = await supabase.rpc("get_and_reset_quiz_ranking");

            if (error) {
                console.error(`Erro ao buscar ranking do Quiz: ${error.message}`);
                return null;
            }
            return data;
    }
}

module.exports = new Queries();