const { keepSupabaseActive } = require('./preventIdleScript');

(async () => {
    try {
        await keepSupabaseActive();
    } catch (err) {
        console.error('Script failed due to error:', err.message);
        process.exit(1);
    }
})();