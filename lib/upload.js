'use strict';

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const ALLOWED = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);
const MAX_BYTES = 4.5 * 1024 * 1024;

function extFor(contentType) {
  if (contentType === 'image/png') return 'png';
  if (contentType === 'image/webp') return 'webp';
  if (contentType === 'image/gif') return 'gif';
  return 'jpg';
}

function parseDataUrl(dataUrl) {
  const match = String(dataUrl || '').match(/^data:([^;]+);base64,(.+)$/i);
  if (!match) return null;
  const contentType = match[1].toLowerCase();
  const buffer = Buffer.from(match[2], 'base64');
  return { contentType, buffer };
}

async function uploadToBlob(pathname, buffer, contentType) {
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) return null;
  try {
    const res = await fetch(`https://blob.vercel-storage.com/${pathname}`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': contentType,
        'x-vercel-blob-access': 'public',
        'x-vercel-blob-allow-overwrite': 'true'
      },
      body: buffer
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.url || null;
  } catch {
    return null;
  }
}

function saveLocal(filename, buffer) {
  const dir = path.join(process.cwd(), 'images', 'uploads');
  try {
    fs.mkdirSync(dir, { recursive: true });
    const full = path.join(dir, filename);
    fs.writeFileSync(full, buffer);
    return `images/uploads/${filename}`;
  } catch {
    return null;
  }
}

/**
 * Accepts either a raw base64 string + contentType, or a full data URL.
 * Returns a public URL or relative path suitable for product.images.
 */
async function uploadImage({ data, contentType, filename }) {
  let buffer;
  let type = String(contentType || '').toLowerCase();

  if (String(data || '').startsWith('data:')) {
    const parsed = parseDataUrl(data);
    if (!parsed) return { error: 'Invalid image data' };
    buffer = parsed.buffer;
    type = parsed.contentType;
  } else {
    try {
      buffer = Buffer.from(String(data || ''), 'base64');
    } catch {
      return { error: 'Invalid base64 image data' };
    }
  }

  if (!ALLOWED.has(type)) {
    return { error: 'Only JPEG, PNG, WebP, or GIF images are allowed' };
  }
  if (!buffer.length) return { error: 'Empty image' };
  if (buffer.length > MAX_BYTES) {
    return { error: 'Image is too large (max ~4.5 MB after compression)' };
  }

  const safeBase = String(filename || 'sock')
    .toLowerCase()
    .replace(/\.[a-z0-9]+$/i, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 40) || 'sock';
  const name = `${safeBase}-${crypto.randomBytes(4).toString('hex')}.${extFor(type)}`;
  const pathname = `carolina-uploads/${name}`;

  const blobUrl = await uploadToBlob(pathname, buffer, type);
  if (blobUrl) return { url: blobUrl };

  const local = saveLocal(name, buffer);
  if (local) return { url: local };

  // Last resort on read-only hosts without Blob: embed as data URL
  const dataUrl = `data:${type};base64,${buffer.toString('base64')}`;
  return { url: dataUrl, warning: 'Stored inline. Set BLOB_READ_WRITE_TOKEN on Vercel for durable image hosting.' };
}

module.exports = { uploadImage, ALLOWED, MAX_BYTES };
