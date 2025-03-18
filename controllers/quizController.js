const queries = require('../queries');
const crypto = require("crypto");
const { v4: uuidv4 } = require("uuid");
const utils = require('../utils');

const SECRET_KEY = process.env.SECRET_KEY_QUIZ;

//Não confidencial
const key = 'DCC52255D8D31EE38548E7F5B4BB4ABC';
const obfusKey = 17;

function decryptData(encryptedData) {
    const decipher = crypto.createDecipheriv(
        "aes-256-ecb",
        Buffer.from(key),
        null
    );

    let decrypted = decipher.update(encryptedData, "base64", "utf8");
    decrypted += decipher.final("utf8");

    const { a: encodedScore, b: encodedCorrect } = JSON.parse(decrypted);

    const score = parseInt(encodedScore, 36) / obfusKey;
    const correctCount = parseInt(encodedCorrect, 36) / obfusKey;

    return { score, correctCount };
}

function generateHMAC(sessionID, questionSetID) {
    const data = `${sessionID}${questionSetID}`;
    return crypto.createHmac("sha256", SECRET_KEY).update(data).digest("hex");
}

exports.startQuiz = async (req, res) => {
    if (!utils.verifyAllMiddlewares(req, res)) return;

    try {
        const { questions } = req.body;

        if (!questions || questions.length !== 10) {
            return res.status(400).json({ error: "Envie exatamente 10 questões." });
        }

        const ipAddress = req.ip;
        const sessionID = uuidv4();
        const questionSetID = questions.map(q => q.id[0]).join("");
        const signature = generateHMAC(sessionID, questionSetID);
        const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString();

        queries.insertSessionQuiz(sessionID, ipAddress, questionSetID, expiresAt);
        queries.getAndDeleteOldSessionsQuiz();
        return res.status(200).json({ sessionID, questionSetID, signature });
    } catch (error) {
        console.error("Erro ao iniciar quiz:", error);
        return res.status(500).json({ error: "Erro interno no servidor." });
    }
};

exports.viewSessionsQuiz = async (req, res) => {
    try {
        const authorization = req.headers.authorization
        const data = await queries.getAuthenticationQuiz(authorization)

        if (data.length === 0) {
            return res.status(403).json({ error: 'Access denied' });
        }

        const sessions = await queries.getAndDeleteOldSessionsQuiz()
        const sessionsList = sessions.map(({ session_id, ip_address, question_set_id, expires_at }) => ({
            ip: ip_address,
            sessionID: session_id,
            questionSetID: question_set_id,
            expiresAt: expires_at,
            timeRemaining: `${Math.max(0, Math.round((new Date(expires_at) - Date.now()) / 1000 / 60))} minutos`
        }));

        return res.status(200).json({ sessionCount: sessionsList.length, sessions: sessionsList });
    } catch (error) {
        console.error("Erro ao visualizar sessões:", error);
        return res.status(500).json({ error: "Erro interno no servidor." });
    }
};

exports.submitQuizScore = async (req, res) => {
    if (!utils.verifyAllMiddlewares(req, res)) return;
    try {
        const { name, data, sessionID, signature } = req.body;

        const ipAddress = req.ip;

        if (!sessionID || !name || !signature || !data) {
            console.log("Dados incompletos:", req.body);
            return res.status(400).json({ error: "Dados incompletos" });
        }

        const session = await queries.getSessionBySessionID(sessionID)
        if (!session) {
            console.log("Sessão inválida:", sessionID);
            return res.status(400).json({ error: 'Sessão inválida ou expirada.' })
        }

        const expectedSignature = generateHMAC(sessionID, session.question_set_id);
        if (signature !== expectedSignature) {
            console.log("Assinatura inválida:", signature);
            return res.status(403).json({ error: 'Assinatura inválida.'})
        }

        if (new Date(session.expires_at) < new Date()) {
            console.log("Sessão expirada:", sessionID);
            return res.status(400).json({ error: 'Sessão expirada.' })
        }

        const { score, correctCount } = decryptData(data);

        if (score < 0 || score > 100 || correctCount < 0 || correctCount > 10 || isNaN(score) || isNaN(correctCount) || name.length < 3 || name.length > 20) {
            console.log("Dados inválidos:", data);
            return res.status(400).json({ error: "Dados inválidos" });
        }

        queries.insertRankingQuiz(name, score, correctCount, ipAddress)
        queries.deleteSessionQuiz(sessionID)

        console.log("Pontuação registrada:", { name, score, correctCount });

        res.status(200).json()
    } catch (error) {
        console.error("Falha ao registrar pontuação:", error);
        res.status(500).json({ erro: "Erro interno no servidor." })
    }
}

exports.getQuizRanking = async (req, res) => {
    if (!utils.verifyAllMiddlewares(req, res)) return;
    try {
        const data = await queries.getQuizRanking();

        const dailyRanking = data.filter(row => row.ranking_type === "daily");
        const monthlyRanking = data.filter(row => row.ranking_type === "monthly");

        res.status(200).json({ daily: dailyRanking, monthly: monthlyRanking });
    } catch (error) {
        console.error("Erro ao buscar ranking do Quiz:", error);
        res.status(500).json({ error: "Erro interno no servidor." });
    }
};