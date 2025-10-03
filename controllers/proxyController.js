exports.getContentHtml = async (req, res) => {
    const targetUrl = req.query.url;

    if (!targetUrl) {
        console.error('Erro ao devolver HTML pelo Proxy: URL ausente');
        return res.status(400).json({ error: 'Missing url parameter' });
    }

    try {
        const response = await fetch(targetUrl, { method: 'GET' });
        const text = await response.text();

        res.status(response.status);

        const contentType = response.headers.get('content-type') || 'text/html; charset=utf-8';
        res.set('Content-Type', contentType);

        res.set('Access-Control-Allow-Origin', '*');

        res.send(text);
    } catch (err) {
        console.error('Erro no proxy ao acessar target:', err.message);

        res.set('Access-Control-Allow-Origin', '*');
        res.set('X-Proxy-Error', '1');
        res.status(502).send('Proxy error: não foi possível conectar ao Nightscout');
    }
};
