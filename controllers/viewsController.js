const queries = require('../queries');
const utils = require('../utils');

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
        if (!utils.verifyAllMiddlewares(req, res)) return;

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