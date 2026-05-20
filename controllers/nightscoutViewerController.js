const queries = require('../queries');
const utils = require('../utils');

exports.getTotalUses = async (req, res) => {
    try {
        const data = await queries.getTotalUsageNightscoutViewer();
        const count = queries.getColumnValue(data, 'count');
        if (count === null) {
            return res.status(500).json({ error: 'Failed to fetch usage counter for Nightscout viewer' });
        }
        res.status(200).json({ count });
    } catch (error) {
        console.error('Erro ao buscar contador de usos do visualizador de Nightscout:', error.message);
        res.status(500).json({ error: 'Failed to fetch usage counter for Nightscout viewer' });
    }
};

exports.incrementCounterUses = async (req, res) => {
    try {
        if (!utils.verifyAllMiddlewares(req, res)) return;

        const ipAddress = req.ip || 
            req.headers['x-forwarded-for']?.split(',')[0]?.trim() || 
            req.connection?.remoteAddress || 
            'unknown';

        const results = await Promise.allSettled([
            queries.incrementNightscoutViewerUses(ipAddress),
            queries.incrementGeneralNightscoutViewerUses()
        ]);

        const hasError = results.some(r => r.status === 'rejected');

        if (hasError) {
            console.error('❌ Erro em um ou mais incrementadores:', results);
            return res.status(500).json({ message: 'Erro ao incrementar contador de usos do Nightscout viewer' });
        }

        res.status(200).json({ message: 'Nightscout Viewer uses incremented successfully' });
    } catch (err) {
        console.error("❌ Erro ao incrementar contador de usos do visualizador de Nightscout:", err);
        res.status(500).json({ message: "Failed to increment usage counter for Nightscout viewer", error: err });
    }
};