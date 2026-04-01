const crypto = require('crypto');

const DEFAULT_MAX_AGE_SEC = 24 * 60 * 60;

function parseInitData(initData) {
  if (!initData || typeof initData !== 'string') return null;

  const params = new URLSearchParams(initData);
  const hash = params.get('hash');
  if (!hash) return null;
  params.delete('hash');

  const keys = Array.from(params.keys()).sort();
  const pairs = keys.map((key) => {
    const values = params.getAll(key);
    const value = values.length > 1 ? values.join(',') : (values[0] ?? '');
    return `${key}=${value}`;
  });

  return {
    hash,
    dataCheckString: pairs.join('\n'),
    params
  };
}

function getUserIdFromInitData(initData) {
  try {
    const params = new URLSearchParams(initData);
    const userRaw = params.get('user');
    if (!userRaw) return null;
    const user = JSON.parse(userRaw);
    return user?.id ? String(user.id) : null;
  } catch (error) {
    return null;
  }
}

function verifyInitData(initData, botToken, maxAgeSec = DEFAULT_MAX_AGE_SEC) {
  if (!botToken) {
    return { ok: false, error: 'Missing bot token' };
  }

  const parsed = parseInitData(initData);
  if (!parsed) {
    return { ok: false, error: 'Invalid initData' };
  }

  const secret = crypto.createHash('sha256').update(botToken).digest();
  const expected = crypto.createHmac('sha256', secret).update(parsed.dataCheckString).digest('hex');
  if (parsed.hash.length !== expected.length) {
    return { ok: false, error: 'Bad signature' };
  }

  const hashOk = crypto.timingSafeEqual(Buffer.from(parsed.hash), Buffer.from(expected));
  if (!hashOk) {
    return { ok: false, error: 'Bad signature' };
  }

  const authDateRaw = parsed.params.get('auth_date');
  if (authDateRaw) {
    const authDate = Number(authDateRaw);
    const now = Math.floor(Date.now() / 1000);
    const skew = 60;
    if (Number.isFinite(authDate)) {
      if (authDate > now + skew) {
        return { ok: false, error: 'auth_date in the future' };
      }
      if (now - authDate > maxAgeSec) {
        return { ok: false, error: 'auth_date expired' };
      }
    }
  }

  return { ok: true, userId: getUserIdFromInitData(initData) };
}

module.exports = {
  verifyInitData,
  getUserIdFromInitData
};
