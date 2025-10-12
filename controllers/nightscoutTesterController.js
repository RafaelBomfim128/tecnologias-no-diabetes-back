const queries = require('../queries');
const utils = require('../utils');

exports.getTotalUses = async (req, res) => {
    try {
        queries.getTotalUsageNightscoutTester().then(data => {
            res.status(200).json({ count: queries.getColumnValue(data, 'count') });
        });
    } catch (error) {
        console.error('Erro ao buscar contador de usos do testador de Nightscout:', error.message);
        res.status(500).json({ error: 'Failed to fetch usage counter for Nightscout tester' });
    }
};

exports.incrementCounterUses = async (req, res) => {
    try {
        if (!utils.verifyAllMiddlewares(req, res)) return;

        const ipAddress = req.ip || 
            req.headers['x-forwarded-for']?.split(',')[0]?.trim() || 
            req.connection?.remoteAddress || 
            'unknown';

        await Promise.allSettled([
            queries.incrementNightscoutTesterUses(ipAddress),
            queries.incrementGeneralNightscoutTesterUses()
        ]).then(results => results.map(r => r.status === 'fulfilled' ? r.value : null));

        res.status(200).json({ message: 'Nightscout Tester uses incremented successfully' });
    } catch (err) {
        console.error("Erro ao incrementar contador de usos do testador de Nightscout:", err);
        res.status(500).json({ message: "Failed to increment usage counter for Nightscout tester", error: err });
    }
};