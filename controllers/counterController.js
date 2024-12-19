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
        if (!verifyApiKeyiddleware(req)) {
            console.error('Invalid API Key');
            return res.status(403).json({ error: 'Access denied' })
        }
        if (!verifyRefererMiddleware(req)) {
            console.error('Invalid Referer/Origin:', req.headers.referer || req.headers.origin);
            return res.status(403).json({ error: 'Access denied' })
        }
        if (!validateUserAgentMiddleWare(req)) {
            console.error('Invalid User-Agent:', req.headers['user-agent']);
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
function verifyApiKeyiddleware(req) {
    const apiKey = req.headers["x-api-key"]
    return apiKey && apiKey == process.env.SECRET_API_KEY
}

//Validação do Referer/Origin
function verifyRefererMiddleware (req) {
    const referer = req.headers.referer || req.headers.origin;

    if (!referer) {
        return false
    }

    const allowedRefererRegex = /https:\/\/.*diabetesdm1\.netlify\.app/;
    if (!allowedRefererRegex.test(referer)) {
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
        return false
    }

    // Verifica se o User-Agent corresponde a algum bloqueado
    if (blockedUserAgents.some(pattern => pattern.test(userAgent))) {
        return false
    }

    return true
}