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

    async getAuthenticationQuiz(token) {
        const { data, error } = await supabase
            .from("authenticator")
            .select('token')
            .eq('name', 'View Sessions Quiz')
            .eq('token', token)

        if (error) {
            throw new Error(`Erro ao buscar autenticação para visualizar dados de sessão do Quiz": ${error.message}`);
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
            throw new Error(`Erro ao buscar sessões do Quiz de um IP específico": ${error.message}`);
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
            throw new Error(`Erro ao buscar sessões do Quiz de um sessionID específico": ${error.message}`);
        }
        return session;
    }

    async getAllNotExpiredSessionsQuiz() {
        const { data: sessions, error } = await supabase
            .from("quiz_sessions")
            .select("session_id, ip_address, question_set_id, expires_at")
            .gte("expires_at", new Date().toISOString());

        if (error) {
            throw new Error(`Erro ao buscar todas sessões do Quiz": ${error.message}`);
        }
        return sessions;
    }

    async deleteSessionQuiz(sessionID) {
        const { data, error } = await supabase
            .from("quiz_sessions")
            .delete()
            .eq("session_id", sessionID);

        if (error) {
            throw new Error(`Erro ao deletar sessão do Quiz": ${error.message}`);
        }
        return data;
    }

    async insertSessionQuiz(sessionID, ipAddress, questionSetID, expiresAt) {
        const { error: insertError } = await supabase
            .from("quiz_sessions")
            .insert([{ session_id: sessionID, ip_address: ipAddress, question_set_id: questionSetID, expires_at: expiresAt }]);

        if (insertError) {
            throw new Error(`Erro ao inserir sessão do Quiz": ${insertError.message}`);
        }
    }

    async deleteExpiredSessionsQuiz() {
        const { error } = await supabase.rpc("delete_expired_quiz_sessions");
        if (error) {
            throw new Error("Erro ao limpar sessões expiradas:", error);
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
            throw new Error(`Erro ao inserir sessão do Quiz": ${insertError.message}`);
        }
    }

    async getQuizRanking() {
        const { data, error } = await supabase.rpc("get_and_reset_quiz_ranking");

        if (error) {
            throw new Error(`Erro ao buscar ranking do Quiz: ${error.message}`);
        }
        return data;
    }
}

module.exports = new Queries();