exports.getContentHtml = async (req, res) => {
    const targetUrl = req.query.url;

    if (!targetUrl) {
        console.error('Erro ao devolver HTML pelo Proxy: URL ausente');
        return res.status(400).json({ error: 'Missing url parameter' });
    }

    try {
        const response = await fetch(targetUrl, { method: 'GET' });
        const text = await response.text();

        res.set('Content-Type', 'text/html; charset=utf-8');
        res.set('Access-Control-Allow-Origin', '*');
        res.send(text);
    } catch (err) {
        console.error('Erro no proxy:', err.message);
        res.status(500).json({ error: 'Erro ao buscar recurso via proxy' })
    }
}