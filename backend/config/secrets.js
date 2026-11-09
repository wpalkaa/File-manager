const fs = require('fs');

function loadSecret(filePath, fallback = null) {
    if (filePath && fs.existsSync(filePath)) {
        return fs.readFileSync(filePath, 'utf-8').trim();
    }
    if (fallback) {
        return fallback;
    }
    if (process.env.NODE_ENV === 'test' || !process.env.NODE_ENV) {
        return 'test-jwt-secret-key-12345';
    }

    throw new Error(`[CRITICAL]: There was no secret in ${filePath}.`);
}

module.exports = {
    jwtSecret: loadSecret(process.env.JWT_SECRET_FILE, process.env.JWT_SECRET || process.env.SECRET_KEY),
};
