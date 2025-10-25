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

        res.set('X-Upstream-Url', targetUrl);

        return res.send(text);
    } catch (err) {
        console.error('Erro no proxy ao acessar target:', err && (err.code || err.message));

        res.set('Access-Control-Allow-Origin', '*');

        const code = err && err.code ? err.code : null;

        if (code === 'ENOTFOUND' || code === 'EAI_AGAIN') {
            res.set('X-Proxy-Error-Type', 'host-unresolved');
            return res.status(422).send('Proxy error: host not found (domain could not be resolved)');
        }

        if (code === 'ECONNREFUSED' || code === 'ETIMEDOUT') {
            res.set('X-Proxy-Error-Type', 'upstream-unreachable');
            return res.status(502).send('Proxy error: upstream unreachable (connection refused or timed out)');
        }

        res.set('X-Proxy-Error-Type', 'proxy-error');
        return res.status(502).send('Proxy error: unexpected error contacting target');
    }
};
