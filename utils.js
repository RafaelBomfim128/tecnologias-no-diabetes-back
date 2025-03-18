class Utils {
    verifyAllMiddlewares(req, res) {
        const middlewares = [
            verifyApiKeyMiddleware,
            verifyRefererMiddleware,
            validateUserAgentMiddleWare
        ];
    
        for (const middleware of middlewares) {
            if (!middleware(req)) {
                res.status(403).json({ error: 'Access denied' });
                return false;
            }
        }
        return true;
    }

    verifyApiKeyMiddleware(req) {
        verifyApiKeyMiddleware(req);
    }

    verifyRefererMiddleware(req) {
        verifyRefererMiddleware(req);
    }

    validateUserAgentMiddleWare(req) {
        validateUserAgentMiddleWare(req);
    }
}

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
        return false;
    }

    const allowedRefererRegexes = [
        /^https:\/\/(?:.+--)?diabetesdm1\.netlify\.app(\/.*)?$/,
        /^https:\/\/(?:.*\.)?tecnologiasnodiabetes\.com\.br(\/.*)?$/
    ];
    
    if (process.env.NODE_ENV === 'development') {
        allowedRefererRegexes.push(/^http:\/\/localhost(:\d+)?(\/.*)?$/, /^http:\/\/127\.0\.0\.1(:\d+)?(\/.*)?$/);
    }

    if (!allowedRefererRegexes.some(regex => regex.test(referer))) {
        console.error('Referer/Origin inválido:', referer);
        return false;
    }

    return true;
};

//Validação de user-agent
function validateUserAgentMiddleWare(req) {
    const blockedUserAgents = [
        /PostmanRuntime/i,   // Bloqueia Postman
        /Apache-HttpClient/i, // Bloqueia Apache HttpClient (JMeter)
        /JMeter/i,           // Bloqueia JMeter
        /curl/i,             // Bloqueia cURL
    ];
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

module.exports = new Utils();
