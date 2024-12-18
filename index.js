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

const limiterAll = rateLimit({
    windowMs:  500, // 0,5 segundos
    max: 3, // Máximo de 3 requisições por IP
    message: "Too many requests, try again later."
});

const limiterIncrement = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minuto
    max: 1, // Máximo de 1 requisição por IP
    message: "Too many views in a short time."
});

app.use(limiterAll);

app.use('/api/increment', limiterIncrement);

// Configuração do CORS dinâmico
const allowedOrigins = [
    'https://diabetesdm1.netlify.app', // Domínio principal
    /https:\/\/.*--diabetesdm1\.netlify\.app/ // Expressão regular para URLs temporárias do Netlify
];

app.use(cors({
    origin: (origin, callback) => {
        // Não permite a requisição se não tiver origem (ex.: em ferramentas como Postman)
        if (!origin) return callback(null, true);

        // Verifica se a origem está na lista permitida ou corresponde ao regex
        if (allowedOrigins.some(o => (typeof o === 'string' && o === origin) || (o instanceof RegExp && o.test(origin)))) {
            return callback(null, true);
        }

        // Se a origem não for permitida, bloqueia a requisição
        return callback(new Error('Not allowed by CORS'));
    },
    methods: ['GET', 'POST'], // Métodos permitidos
    allowedHeaders: ['Content-Type', 'x-api-key'] // Cabeçalhos permitidos
}));

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