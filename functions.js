const crypto = require('crypto');

function generarPass() {
    return crypto.randomBytes(16).toString('hex');
}

module.exports = { generarPass };