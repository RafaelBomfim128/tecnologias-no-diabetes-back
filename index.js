const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors'); // Importa o CORS
const rateLimit = require("express-rate-limit");
const counterController = require('./controllers/counterController');

dotenv.config(); // Carrega variáveis de ambiente

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware para JSON
app.use(express.json());
app.set('trust proxy', 1); // Confia no proxy reverso

// Configuração do CORS dinâmico
const allowedOrigins = [
    'https://diabetesdm1.netlify.app',
    /https:\/\/.*--diabetesdm1\.netlify\.app/, // Expressão regular para URLs temporárias do Netlify
];
app.use(cors({
    origin: (origin, callback) => {
        console.log('Origin:', origin);

        if (!origin) return callback(new Error('Not allowed by CORS')); // Permite requisições sem origem (Postman, etc.)

        if (!allowedOrigins.some(o => (typeof o === 'string' && o === origin) || (o instanceof RegExp && o.test(origin)))) {
            console.error('CORS Blocked for:', origin);
            return callback(new Error('Not allowed by CORS'));
        }

        console.log('CORS Allowed for:', origin);
        return callback(null, true);
    },
    methods: ['GET', 'POST'], // Métodos permitidos
    allowedHeaders: ['Content-Type', 'x-api-key'], // Cabeçalhos permitidos
    optionsSuccessStatus: 200 // Ajusta o status de resposta do preflight para compatibilidade
}));

const limiterAll = rateLimit({
    windowMs:  500, // 0,5 segundos
    max: 3, // Máximo de 3 requisições por IP
    message: 'Too many views in a short time.'
});

const limiterIncrement = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minuto
    max: 3, // Máximo de 3 requisições por IP
    message: 'Too many views in a short time.',
    handler: (req, res) => {
        // Garante que o cabeçalho CORS seja enviado na resposta
        res.set('Access-Control-Allow-Origin', '*'); // ou especifique sua origem permitida
        res.set('Access-Control-Allow-Methods', 'GET, POST');
        res.set('Access-Control-Allow-Headers', 'Content-Type, x-api-key');
        res.status(429).send('Too many views in a short time.');
    }
});

//Gerenciar o Limite de Requisições Separadas para CORS Preflight
const limiterOptions = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minuto
    max: 5, // Máximo de 5 requisições OPTIONS por IP
    message: "Too many preflight requests in a short time."
});

app.use(limiterAll);
app.use('/api/increment', limiterIncrement);
app.options('*', limiterOptions); // Apenas OPTIONS com limite separado
app.options('*', cors()); // Responder ao preflight com CORS permitido

app.use((err, req, res, next) => {
    console.error(err.stack); // Loga o erro completo no servidor para depuração

    // Evita exposição de dados sensíveis pelo CORS
    if (err instanceof Error && err.message === 'Not allowed by CORS') { //Se o erro for gerado pelo app.use(cors), retorne acesso negado
        return res.status(403).json({ error: 'Access denied' });
    }

    // Resposta genérica para outros erros
    res.status(500).json({ error: 'An unexpected error occurred' });
});

// Rotas
app.get('/', counterController.healthCheck)
app.get('/healthcheck', counterController.healthCheck)
app.get('/api/count', counterController.getCount);
app.post('/api/increment', counterController.incrementCount);

// Inicializa o servidor
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT} in environment: ${process.env.NODE_ENV || 'development'}`);
});