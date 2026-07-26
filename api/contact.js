'use strict';

const { sendJson, readBody, methodNotAllowed } = require('../lib/http');
const { sendContactMessage } = require('../lib/email');

module.exports = async function handler(req, res) {
    if (req.method !== 'POST') return methodNotAllowed(res, ['POST']);

    const body = await readBody(req);
    const name = String(body.name || '').trim();
    const email = String(body.email || '').trim();
    const message = String(body.message || '').trim();

    if (!name || !email || !message) {
        return sendJson(res, 400, { error: 'Name, email, and message are all required' });
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(email)) {
        return sendJson(res, 400, { error: 'Please enter a valid email address' });
    }

    const result = await sendContactMessage({ name, email, message });

    if (!result.ok) {
        return sendJson(res, 502, {
            error: 'Could not send your message right now. Please try again later or use WhatsApp.',
            detail: result.reason
        });
    }

    return sendJson(res, 200, { ok: true, message: 'Message sent — we will reply soon' });
};