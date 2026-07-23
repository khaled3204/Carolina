'use strict';

const { sendJson, readBody, methodNotAllowed } = require('../lib/http');
const { requireAdmin } = require('../lib/auth');
const { uploadImage } = require('../lib/upload');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return methodNotAllowed(res, ['POST']);

  const auth = await requireAdmin(req);
  if (!auth.ok) return sendJson(res, auth.status, { error: auth.error });

  const body = await readBody(req);
  const result = await uploadImage({
    data: body.data,
    contentType: body.contentType,
    filename: body.filename
  });

  if (result.error) return sendJson(res, 400, { error: result.error });
  return sendJson(res, 201, { url: result.url, warning: result.warning || null });
};

module.exports.config = {
  api: {
    bodyParser: {
      sizeLimit: '4.5mb'
    }
  }
};
