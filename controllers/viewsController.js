const queries = require('../queries');

exports.healthCheck = async (req, res) => {
    res.status(200).json({ status: 'Working' })
}

exports.getTotalViews = async (req, res) => {
    try {
        queries.getTotalViews().then(data => {
            res.status(200).json({ counter: queries.getColumnValue(data, 'views') });
        });
    } catch (error) {
        console.error('Erro ao buscar contador "Total":', error.message);
        res.status(500).json({ error: 'Failed to fetch Total count' });
    }
};

exports.getResetMonthlyViews = async (req, res) => {
    try {
        queries.getResetMonthlyViews().then(data => {
            res.status(200).json({ counter: queries.getColumnValue(data, 'views') });
        });
    } catch (error) {
        console.error('Erro ao buscar contador "Mensal":', error.message);
        res.status(500).json({ error: 'Failed to fetch Monthly count' });
    }
};

exports.getResetDailyViews = async (req, res) => {
    try {
        queries.getResetDailyViews().then(data => {
            res.status(200).json({ counter: queries.getColumnValue(data, 'views') });
        });
    } catch (error) {
        console.error('Erro ao buscar contador "Diária":', error.message);
        res.status(500).json({ error: 'Failed to fetch Daily count' });
    }
};

exports.incrementViews = async (req, res) => {
    try {
        if (!verifyApiKeyMiddleware(req) || !verifyRefererMiddleware(req) || !validateUserAgentMiddleWare(req)) {
            return res.status(403).json({ error: 'Access denied' })
        }
        const [dailyCounter, monthlyCounter, totalCounter] = await Promise.allSettled([
            queries.incrementDailyViews(),
            queries.incrementMonthlyViews(),
            queries.incrementTotalViews()
        ]).then(results => results.map(r => r.status === 'fulfilled' ? r.value : null));

        res.json({ message: 'Counters incremented successfully', totalCounter, monthlyCounter, dailyCounter });
    } catch (err) {
        console.error("Erro ao incrementar contadores:", err);
        res.status(500).json({ message: "Failed to increment counters", error: err });
    }
};

//Validação da API Key
function verifyApiKeyMiddleware(req) {
    const apiKey = req.headers["x-api-key"];
    const normalizedApiKey = apiKey?.replace(/^"|"$/g, '');

    if (!normalizedApiKey || normalizedApiKey !== process.env.SECRET_API_KEY) {
        console.error('API Key inválida:', apiKey);
        return false;
    }
    return true;
}


//Validação do Referer/Origin
function verifyRefererMiddleware(req) {
    const referer = req.headers.referer || req.headers.origin;

    if (!referer) {
        console.error('Referer/Origin não encontrado');
        return false
    }

    const allowedRefererRegexes = [
        /https:\/\/.*diabetesdm1\.netlify\.app/,
        /https:\/\/.*tecnologiasnodiabetes\.com\.br/
    ];
    if (!allowedRefererRegexes.some(regex => regex.test(referer))) {
        console.error('Referer/Origin inválido:', referer);
        return false
    }

    return true
};

const blockedUserAgents = [
    /PostmanRuntime/i,   // Bloqueia Postman
    /Apache-HttpClient/i, // Bloqueia Apache HttpClient (JMeter)
    /JMeter/i,           // Bloqueia JMeter
    /curl/i,             // Bloqueia cURL
];

//Validação de user-agent
function validateUserAgentMiddleWare(req) {
    const userAgent = req.headers['user-agent'];

    if (!userAgent) {
        console.error('User-Agent não encontrado');
        return false
    }

    if (blockedUserAgents.some(pattern => pattern.test(userAgent))) {
        console.error('User-Agent bloqueado:', userAgent);
        return false
    }

    return true
}