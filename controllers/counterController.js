const axios = require('axios');
const BASE_URL = 'https://abacus.jasoncameron.dev';

exports.healthCheck = async (req, res) => {
    res.status(200).json({ status: 'Working' })
}

exports.getCount = async (req, res) => {
    try {
        const response = await axios.get(`${BASE_URL}/get/${process.env.ABACUS_NAMESPACE_KEY}`);
        res.json({ counter: response.data.value });
    } catch (error) {
        console.error('Error fetching count:', error.message);
        res.status(500).json({ error: 'Failed to fetch count' });
    }
};

exports.incrementCount = async (req, res) => {
    try {
        if (!verifyApiKeyMiddleware(req) || !verifyRefererMiddleware(req) || !validateUserAgentMiddleWare(req)) {
            return res.status(403).json({ error: 'Access denied' })
        }
        const response = await axios.get(`${BASE_URL}/hit/${process.env.ABACUS_NAMESPACE_KEY}`);
        console.log('Counter incremented:', response.data.value);
        res.json({ message: 'Counter incremented successfully', counter: response.data.value });
    } catch (error) {
        console.error('Error incrementing count:', error.message);
        if (!res.headersSent) {
            res.status(500).json({ error: 'Failed to increment count' });
        }
    }
};

//Validação da API Key
function verifyApiKeyMiddleware(req) {
    const apiKey = req.headers["x-api-key"];
    const normalizedApiKey = apiKey?.replace(/^"|"$/g, '');

    if (!normalizedApiKey || normalizedApiKey !== process.env.SECRET_API_KEY) {
        console.error('Invalid API Key:', apiKey);
        return false;
    }
    return true;
}


//Validação do Referer/Origin
function verifyRefererMiddleware (req) {
    const referer = req.headers.referer || req.headers.origin;

    if (!referer) {
        console.error('Referer/Origin not found');
        return false
    }

    const allowedRefererRegex = /https:\/\/.*diabetesdm1\.netlify\.app/;
    if (!allowedRefererRegex.test(referer)) {
        console.error('Invalid Referer/Origin:', referer);
        return false
    }

    return true
};

const blockedUserAgents = [
    /PostmanRuntime/i,   // Bloqueia Postman
    /Apache-HttpClient/i, // Bloqueia Apache HttpClient (JMeter)
    /JMeter/i,           // Bloqueia JMeter
    /curl/i,             // Opcional: Bloqueia cURL
];

//Validação de user-agent
function validateUserAgentMiddleWare(req) {
    const userAgent = req.headers['user-agent'];

    if (!userAgent) {
        console.error('User-Agent not found');
        return false
    }

    // Verifica se o User-Agent corresponde a algum bloqueado
    if (blockedUserAgents.some(pattern => pattern.test(userAgent))) {
        console.error('Blocked User-Agent:', userAgent);
        return false
    }

    return true
}