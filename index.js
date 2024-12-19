const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const counterController = require('./controllers/counterController');

dotenv.config();
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware para JSON
app.use(express.json());
app.set('trust proxy', 1); // Confia no proxy reverso

// Lista de origens permitidas
const allowedOrigins = [
    'https://diabetesdm1.netlify.app',
    /https:\/\/.*--diabetesdm1\.netlify\.app/, // Expressão regular para URLs temporárias do Netlify
];

// Middleware de CORS
const corsMiddleware = cors({
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.some(o => (typeof o === 'string' && o === origin) || (o instanceof RegExp && o.test(origin)))) {
            callback(null, true); // Permitir acesso
        } else {
            console.error('CORS Blocked for:', origin);
            callback(new Error('Not allowed by CORS'));
        }
    },
    methods: ['GET', 'POST', 'OPTIONS'], // Métodos permitidos
    allowedHeaders: ['Content-Type', 'x-api-key'],
    optionsSuccessStatus: 200,
});

// Aplica CORS globalmente
app.use(corsMiddleware);

// Rate Limiting global
const globalLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minuto
    max: 100, // 100 requisições por IP
    message: 'Too many requests, please try again later.',
    handler: (req, res) => {
        console.error('Rate limit exceeded:', req.ip);
        res.status(429).json({ error: 'Too many requests, please try again later.' });
    },
});
app.use(globalLimiter);

// Rate Limiting específico para /api/increment
const incrementLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minuto
    max: 1, // 1 requisição por IP
    message: 'Too many increments in a short time.',
    handler: (req, res) => {
        console.error('Rate limit exceeded for /api/increment:', req.ip);
        res.status(429).json({ error: 'Too many increments in a short time.' });
    },
});

// Rotas
app.options('/api/increment', corsMiddleware); // Middleware de CORS para preflight específico
app.get('/', counterController.healthCheck);
app.get('/healthcheck', counterController.healthCheck);
app.get('/api/count', counterController.getCount);
app.post('/api/increment', incrementLimiter, counterController.incrementCount); // Aplica rate limit aqui

// Tratamento de erros
app.use((err, req, res, next) => {
    console.error(err.stack);
    if (err instanceof Error && err.message === 'Not allowed by CORS') {
        console.error('Access denied by CORS policy:', req.headers.origin);
        return res.status(403).json({ error: 'Access denied by CORS policy' });
    }
    console.error('An general unexpected error occurred:', err.message);
    res.status(500).json({ error: 'An general unexpected error occurred' });
});

// Inicializa o servidor
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT} in environment: ${process.env.NODE_ENV || 'development'}`);
});