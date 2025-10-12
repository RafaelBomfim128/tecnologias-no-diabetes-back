const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const viewsController = require('./controllers/viewsController');
const quizController = require('./controllers/quizController');
const proxyController = require('./controllers/proxyController')
const nightscoutTesterController = require('./controllers/nightscoutTesterController')

dotenv.config();
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware para JSON
app.use(express.json());
app.set('trust proxy', 1); // Confia no proxy reverso

// Origens permitidas
const allowedOrigins = [
    /^https:\/\/(?:[a-zA-Z0-9-]+--)?diabetesdm1\.netlify\.app$/,
    /^https:\/\/(?:.*\.)?tecnologiasnodiabetes\.com\.br$/
];

if (process.env.NODE_ENV === 'development') {
    allowedOrigins.push(/^http:\/\/localhost(:\d+)?(\/.*)?$/, /^http:\/\/127\.0\.0\.1(:\d+)?(\/.*)?$/);
}

// Middleware de CORS
const corsMiddleware = cors({
    origin: (origin, callback) => {
        if (
            origin && allowedOrigins.some(o => {
                //Tratamento de barra final
                const normalizedOrigin = origin.replace(/\/$/, '');
                if (typeof o === 'string') {
                    return normalizedOrigin === o.replace(/\/$/, ''); //
                } else if (o instanceof RegExp) {
                    return o.test(normalizedOrigin);
                }
                return false;
            })
        ) {
            callback(null, true); // Permitir acesso
        } else {
            console.error('CORS bloqueado para:', origin);
            callback(new Error('Not allowed by CORS'));
        }
    },
    methods: ['GET', 'POST', 'OPTIONS'], // Métodos permitidos
    allowedHeaders: ['Content-Type', 'x-api-key'],
    optionsSuccessStatus: 200,
});

if (process.env.NODE_ENV === 'development') {
    app.use(
        cors({
            origin: "*",
            methods: "GET,POST,PUT,DELETE",
            allowedHeaders: "Content-Type, x-api-key",
        })
    );
} else {
    app.use(corsMiddleware);
    app.options('/api/incrementViews', corsMiddleware);
}

// Rate Limiting global
const globalLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minuto
    max: 100, // 100 requisições por IP
    message: 'Too many requests, please try again later.',
    handler: (req, res) => {
        console.error('Rate limit excedido:', req.ip);
        res.status(429).json({ error: 'Too many requests, please try again later.' });
    },
});
app.use(globalLimiter);

// Rate Limiting para increment
const incrementViewCounterLimiter = rateLimit({
    windowMs: 120 * 1000, // 2 minutos
    max: 1, // 1 requisição por IP
    message: 'Too many increments in a short time.',
    handler: (req, res) => {
        console.error('Rate limit excedido para a API de incremento de views:', req.ip);
        res.status(429).json({ error: 'Too many increments in a short time.' });
    },
});

const incrementNightscoutUsesLimiter = rateLimit({
    windowMs: 10 * 1000, // 10 segundos
    max: 1, // 1 requisição por IP
    message: 'Too many increments in a short time.',
    handler: (req, res) => {
        console.error('Rate limit excedido para a API de incremento de uso do Nightscout Tester:', req.ip);
        res.status(429).json({ error: 'Too many increments in a short time.' });
    },
});

app.get('/', viewsController.healthCheck);
app.get('/healthcheck', viewsController.healthCheck);

//Views
app.get('/api/dailyViews', viewsController.getResetDailyViews);
app.get('/api/monthlyViews', viewsController.getResetMonthlyViews);
app.get('/api/totalViews', viewsController.getTotalViews);
app.post('/api/incrementViews', incrementViewCounterLimiter, viewsController.incrementViews);

//Quiz
app.post('/api/quiz/start-quiz', quizController.startQuiz);
app.get('/api/quiz/view-sessions', quizController.viewSessionsQuiz);
app.post('/api/quiz/submit', quizController.submitQuizScore);
app.get('/api/quiz/ranking', quizController.getQuizRanking);

//Proxy (bypass para política de CORS, usado principalmente pelo testador de nightscout)
app.get('/api/proxy', proxyController.getContentHtml);

//APIs do testador de Nightscout
app.get('/api/nightscoutUses', nightscoutTesterController.getTotalUses);
app.post('/api/incrementNightcoutUses', incrementNightscoutUsesLimiter, nightscoutTesterController.incrementCounterUses);

// Tratamento de erros
app.use((err, req, res, next) => {
    console.error(err.stack);
    if (err instanceof Error && err.message === 'Not allowed by CORS') {
        console.error('Acesso negado pela política de CORS:', req.headers.origin);
        return res.status(403).json({ error: 'Access denied by CORS policy' });
    }
    console.error('Ocorreu um erro geral inesperado:', err.message);
    res.status(500).json({ error: 'An general unexpected error occurred' });
});

// Inicializa o servidor
app.listen(PORT, () => {
    console.log(`Server rodando na porta ${PORT} no ambiente: ${process.env.NODE_ENV || 'null'}`);
});