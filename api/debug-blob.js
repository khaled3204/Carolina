'use strict';

// Temporary diagnostic endpoint. Visit /api/debug-blob in the browser.
// It writes a small test file to Blob, reads it back two ways, and reports
// exactly what worked and what didn't — so we can see the real error instead
// of guessing. Safe to delete once things are confirmed working.

const { sendJson } = require('../lib/http');

const TEST_PATHNAME = 'carolina-debug-test.json';

module.exports = async function handler(req, res) {
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  const report = {
    tokenPresent: Boolean(token),
    tokenLooksValid: Boolean(token && token.startsWith('vercel_blob_rw_')),
    steps: []
  };

  if (!token) {
    report.verdict = 'BLOB_READ_WRITE_TOKEN is missing from this deployment\'s environment variables.';
    return sendJson(res, 200, report);
  }

  const marker = `test-${Date.now()}`;

  // Step 1: write a small test file
  try {
    const writeRes = await fetch(`https://blob.vercel-storage.com/${TEST_PATHNAME}`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        'x-vercel-blob-access': 'private',
        'x-vercel-blob-allow-overwrite': 'true'
      },
      body: JSON.stringify({ marker, at: new Date().toISOString() })
    });
    const writeBody = await writeRes.text();
    report.steps.push({
      step: 'write',
      ok: writeRes.ok,
      status: writeRes.status,
      body: writeBody.slice(0, 500)
    });
    if (!writeRes.ok) {
      report.verdict = `Write failed with HTTP ${writeRes.status}. This is why nothing saves. See "body" above for the exact error Vercel returned.`;
      return sendJson(res, 200, report);
    }
  } catch (err) {
    report.steps.push({ step: 'write', ok: false, error: String(err?.message || err) });
    report.verdict = 'Write threw an exception — likely a network/DNS issue reaching Blob from this deployment.';
    return sendJson(res, 200, report);
  }

  // Step 2: list to find the file's current URL
  let blobUrl = null;
  try {
    const listRes = await fetch(`https://blob.vercel-storage.com?prefix=${encodeURIComponent(TEST_PATHNAME)}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const listBody = await listRes.text();
    report.steps.push({ step: 'list', ok: listRes.ok, status: listRes.status, body: listBody.slice(0, 500) });
    if (listRes.ok) {
      const parsed = JSON.parse(listBody);
      blobUrl = (parsed.blobs || []).find((b) => b.pathname === TEST_PATHNAME)?.url || null;
    }
  } catch (err) {
    report.steps.push({ step: 'list', ok: false, error: String(err?.message || err) });
  }

  // Step 2b: try reading directly via the predictable store URL (no list() needed)
  const storeId = process.env.BLOB_STORE_ID;
  if (storeId) {
    try {
      const directUrl = `https://${storeId}.private.blob.vercel-storage.com/${TEST_PATHNAME}?cache=0`;
      const directRes = await fetch(directUrl, { cache: 'no-store' });
      const directBody = await directRes.text();
      report.steps.push({
        step: 'read_direct_store_url',
        ok: directRes.ok,
        status: directRes.status,
        matchesJustWritten: directBody.includes(marker),
        body: directBody.slice(0, 300)
      });
    } catch (err) {
      report.steps.push({ step: 'read_direct_store_url', ok: false, error: String(err?.message || err) });
    }
  } else {
    report.steps.push({ step: 'read_direct_store_url', ok: false, note: 'BLOB_STORE_ID not set in this environment' });
  }

  if (!blobUrl) {
    report.verdict = 'Write succeeded but the file could not be found via list() right after — check the "list" step body above. (Check read_direct_store_url above too — if that one worked, list() is the lagging part, not the fix.)';
    return sendJson(res, 200, report);
  }

  // Step 3: read it back the OLD way (no cache-busting) — may show stale/cached data
  try {
    const res1 = await fetch(blobUrl, { cache: 'no-store' });
    const body1 = await res1.text();
    report.steps.push({
      step: 'read_cached_url',
      ok: res1.ok,
      status: res1.status,
      matchesJustWritten: body1.includes(marker),
      body: body1.slice(0, 300)
    });
  } catch (err) {
    report.steps.push({ step: 'read_cached_url', ok: false, error: String(err?.message || err) });
  }

  // Step 4: read it back with cache=0 (the fix) — should always match
  try {
    const freshUrl = `${blobUrl}${blobUrl.includes('?') ? '&' : '?'}cache=0`;
    const res2 = await fetch(freshUrl, { cache: 'no-store' });
    const body2 = await res2.text();
    report.steps.push({
      step: 'read_fresh_url',
      ok: res2.ok,
      status: res2.status,
      matchesJustWritten: body2.includes(marker),
      body: body2.slice(0, 300)
    });

    if (res2.ok && body2.includes(marker)) {
      report.verdict = 'Blob read/write is working correctly with the cache=0 fix. If products/orders still don\'t save, the problem is somewhere else (not Blob connectivity) — check the admin form submit for a specific error message.';
    } else {
      report.verdict = 'Even the cache-busted read did not return the freshly written data. This points to something beyond simple CDN caching — please share this full JSON output.';
    }
  } catch (err) {
    report.steps.push({ step: 'read_fresh_url', ok: false, error: String(err?.message || err) });
    report.verdict = 'The cache-busted read itself failed — please share this full JSON output.';
  }

  return sendJson(res, 200, report);
};
