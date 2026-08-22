import bcrypt from 'bcrypt';
import Admin from '../models/Admin.js';
import TestUser from '../models/TestUser.js';
import ApiKeyUsage from '../models/ApiKeyUsage.js';

// In-memory cache with TTL and Max-Size Eviction (to prevent DoS memory leaks)
const CACHE_TTL_MS = 60_000;
const MAX_CACHE_SIZE = 5_000;
const cache = new Map();

function cacheKey(rawKey) {
  return `ak:${rawKey}`;
}

function cacheGet(rawKey) {
  const entry = cache.get(cacheKey(rawKey));
  if (!entry) return null;
  if (Date.now() - entry.ts > CACHE_TTL_MS) {
    cache.delete(cacheKey(rawKey));
    return null;
  }
  return entry.account;
}

function cacheSet(rawKey, account) {
  if (cache.size >= MAX_CACHE_SIZE) {
    // Evict oldest entries
    const keysToDelete = Array.from(cache.keys()).slice(0, 1000);
    keysToDelete.forEach((k) => cache.delete(k));
  }
  cache.set(cacheKey(rawKey), { account, ts: Date.now() });
}

function extractApiKey(req) {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.slice(7).trim();
  }
  if (req.query?.apiKey) {
    return String(req.query.apiKey).trim();
  }
  return null;
}

function isKeyExpired(expiresAt) {
  if (!expiresAt) return false;
  const exp = new Date(expiresAt).getTime();
  return !Number.isNaN(exp) && exp <= Date.now();
}

function logApiKeyUsage({ apiKeyId, adminId, keyName, req, status }) {
  ApiKeyUsage.create({
    apiKeyId: apiKeyId || null,
    adminId: adminId || null,
    keyName: keyName || null,
    endpoint: req.originalUrl || req.url || '/',
    method: req.method || 'GET',
    ip: req.ip || req.connection?.remoteAddress || null,
    userAgent: (req.headers?.['user-agent'] || '').slice(0, 256),
    status,
  }).catch((err) => {
    console.error('Failed to log API key usage:', err.message);
  });
}

export async function authenticateApiKey(req, res, next) {
  try {
    const rawKey = extractApiKey(req);
    if (!rawKey) {
      return res.status(401).json({
        message: 'API key required. Provide via Authorization: Bearer <key> header or ?apiKey= query parameter.',
        code: 'API_KEY_REQUIRED',
      });
    }

    // Check cache first
    const cachedAccount = cacheGet(rawKey);
    if (cachedAccount) {
      if (isKeyExpired(cachedAccount._apiKeyMeta.expiresAt)) {
        cache.delete(cacheKey(rawKey));
        logApiKeyUsage({
          apiKeyId: cachedAccount._apiKeyMeta.keyId,
          adminId: cachedAccount._apiKeyMeta.adminId,
          keyName: cachedAccount._apiKeyMeta.name,
          req,
          status: 401,
        });
        return res.status(401).json({
          message: 'API key has expired',
          code: 'API_KEY_EXPIRED',
        });
      }

      req.apiKey = cachedAccount._apiKeyMeta;
      req.user = cachedAccount._userMeta;
      logApiKeyUsage({
        apiKeyId: cachedAccount._apiKeyMeta.keyId,
        adminId: cachedAccount._apiKeyMeta.adminId,
        keyName: cachedAccount._apiKeyMeta.name,
        req,
        status: 200,
      });
      return next();
    }

    // Fast scanning: Query accounts that have apiKeys
    const [admins, testUsers] = await Promise.all([
      Admin.find({ 'apiKeys.0': { $exists: true } }).lean(),
      TestUser.find({ 'apiKeys.0': { $exists: true } }).lean(),
    ]);

    for (const admin of admins) {
      if (!admin.apiKeys || !Array.isArray(admin.apiKeys)) continue;
      for (const keyEntry of admin.apiKeys) {
        const match = await bcrypt.compare(rawKey, keyEntry.keyHash);
        if (match) {
          const expired = isKeyExpired(keyEntry.expiresAt);
          if (expired) {
            logApiKeyUsage({
              apiKeyId: String(keyEntry._id),
              adminId: String(admin._id),
              keyName: keyEntry.name,
              req,
              status: 401,
            });
            return res.status(401).json({
              message: 'API key has expired',
              code: 'API_KEY_EXPIRED',
            });
          }

          await Admin.updateOne(
            { _id: admin._id, 'apiKeys._id': keyEntry._id },
            { $set: { 'apiKeys.$.lastUsedAt': new Date() } }
          );

          const meta = {
            adminId: String(admin._id),
            keyId: String(keyEntry._id),
            name: keyEntry.name,
            scopes: keyEntry.scopes || [],
            expiresAt: keyEntry.expiresAt || null,
          };
          const userMeta = { role: 'admin', sub: admin.username };

          req.apiKey = meta;
          req.user = userMeta;

          cacheSet(rawKey, { ...admin, _apiKeyMeta: meta, _userMeta: userMeta });
          logApiKeyUsage({
            apiKeyId: meta.keyId,
            adminId: meta.adminId,
            keyName: meta.name,
            req,
            status: 200,
          });
          return next();
        }
      }
    }

    for (const testUser of testUsers) {
      if (!testUser.apiKeys || !Array.isArray(testUser.apiKeys)) continue;
      for (const keyEntry of testUser.apiKeys) {
        const match = await bcrypt.compare(rawKey, keyEntry.keyHash);
        if (match) {
          const expired = isKeyExpired(keyEntry.expiresAt);
          if (expired) {
            logApiKeyUsage({
              apiKeyId: String(keyEntry._id),
              adminId: String(testUser._id),
              keyName: keyEntry.name,
              req,
              status: 401,
            });
            return res.status(401).json({
              message: 'API key has expired',
              code: 'API_KEY_EXPIRED',
            });
          }

          await TestUser.updateOne(
            { _id: testUser._id, 'apiKeys._id': keyEntry._id },
            { $set: { 'apiKeys.$.lastUsedAt': new Date() } }
          );

          const meta = {
            adminId: String(testUser._id),
            keyId: String(keyEntry._id),
            name: keyEntry.name,
            scopes: keyEntry.scopes || [],
            expiresAt: keyEntry.expiresAt || null,
          };
          const userMeta = {
            role: 'test_user',
            sub: testUser.email,
            testUserId: String(testUser._id),
            email: testUser.email,
          };

          req.apiKey = meta;
          req.user = userMeta;

          cacheSet(rawKey, { ...testUser, _apiKeyMeta: meta, _userMeta: userMeta });
          logApiKeyUsage({
            apiKeyId: meta.keyId,
            adminId: meta.adminId,
            keyName: meta.name,
            req,
            status: 200,
          });
          return next();
        }
      }
    }

    // No matching key found
    logApiKeyUsage({ apiKeyId: null, adminId: null, keyName: null, req, status: 401 });
    cache.delete(cacheKey(rawKey));
    return res.status(401).json({
      message: 'Invalid API key',
      code: 'INVALID_API_KEY',
    });
  } catch (error) {
    console.error('API key authentication error:', error.message);
    return res.status(500).json({ message: 'Authentication error', code: 'SERVER_ERROR' });
  }
}

export async function checkApiKeyOptional(req, res, next) {
  const rawKey = extractApiKey(req);
  if (!rawKey) return next();

  try {
    const cachedAccount = cacheGet(rawKey);
    if (cachedAccount) {
      if (isKeyExpired(cachedAccount._apiKeyMeta.expiresAt)) {
        cache.delete(cacheKey(rawKey));
        logApiKeyUsage({
          apiKeyId: cachedAccount._apiKeyMeta.keyId,
          adminId: cachedAccount._apiKeyMeta.adminId,
          keyName: cachedAccount._apiKeyMeta.name,
          req,
          status: 401,
        });
        return res.status(401).json({
          message: 'API key has expired',
          code: 'API_KEY_EXPIRED',
        });
      }
      req.apiKey = cachedAccount._apiKeyMeta;
      req.user = cachedAccount._userMeta;
      logApiKeyUsage({
        apiKeyId: cachedAccount._apiKeyMeta.keyId,
        adminId: cachedAccount._apiKeyMeta.adminId,
        keyName: cachedAccount._apiKeyMeta.name,
        req,
        status: 200,
      });
      return next();
    }

    const [admins, testUsers] = await Promise.all([
      Admin.find({ 'apiKeys.0': { $exists: true } }).lean(),
      TestUser.find({ 'apiKeys.0': { $exists: true } }).lean(),
    ]);

    for (const admin of admins) {
      if (!admin.apiKeys || !Array.isArray(admin.apiKeys)) continue;
      for (const keyEntry of admin.apiKeys) {
        const match = await bcrypt.compare(rawKey, keyEntry.keyHash);
        if (match) {
          if (isKeyExpired(keyEntry.expiresAt)) {
            logApiKeyUsage({
              apiKeyId: String(keyEntry._id),
              adminId: String(admin._id),
              keyName: keyEntry.name,
              req,
              status: 401,
            });
            return res.status(401).json({
              message: 'API key has expired',
              code: 'API_KEY_EXPIRED',
            });
          }

          await Admin.updateOne(
            { _id: admin._id, 'apiKeys._id': keyEntry._id },
            { $set: { 'apiKeys.$.lastUsedAt': new Date() } }
          );
          const meta = {
            adminId: String(admin._id),
            keyId: String(keyEntry._id),
            name: keyEntry.name,
            scopes: keyEntry.scopes || [],
            expiresAt: keyEntry.expiresAt || null,
          };
          const userMeta = { role: 'admin', sub: admin.username };
          req.apiKey = meta;
          req.user = userMeta;
          cacheSet(rawKey, { ...admin, _apiKeyMeta: meta, _userMeta: userMeta });
          logApiKeyUsage({
            apiKeyId: meta.keyId,
            adminId: meta.adminId,
            keyName: meta.name,
            req,
            status: 200,
          });
          return next();
        }
      }
    }

    for (const testUser of testUsers) {
      if (!testUser.apiKeys || !Array.isArray(testUser.apiKeys)) continue;
      for (const keyEntry of testUser.apiKeys) {
        const match = await bcrypt.compare(rawKey, keyEntry.keyHash);
        if (match) {
          if (isKeyExpired(keyEntry.expiresAt)) {
            logApiKeyUsage({
              apiKeyId: String(keyEntry._id),
              adminId: String(testUser._id),
              keyName: keyEntry.name,
              req,
              status: 401,
            });
            return res.status(401).json({
              message: 'API key has expired',
              code: 'API_KEY_EXPIRED',
            });
          }

          await TestUser.updateOne(
            { _id: testUser._id, 'apiKeys._id': keyEntry._id },
            { $set: { 'apiKeys.$.lastUsedAt': new Date() } }
          );
          const meta = {
            adminId: String(testUser._id),
            keyId: String(keyEntry._id),
            name: keyEntry.name,
            scopes: keyEntry.scopes || [],
            expiresAt: keyEntry.expiresAt || null,
          };
          const userMeta = {
            role: 'test_user',
            sub: testUser.email,
            testUserId: String(testUser._id),
            email: testUser.email,
          };
          req.apiKey = meta;
          req.user = userMeta;
          cacheSet(rawKey, { ...testUser, _apiKeyMeta: meta, _userMeta: userMeta });
          logApiKeyUsage({
            apiKeyId: meta.keyId,
            adminId: meta.adminId,
            keyName: meta.name,
            req,
            status: 200,
          });
          return next();
        }
      }
    }

    // Key was provided but invalid -> reject with 401
    logApiKeyUsage({ apiKeyId: null, adminId: null, keyName: null, req, status: 401 });
    cache.delete(cacheKey(rawKey));
    return res.status(401).json({
      message: 'Invalid API key',
      code: 'INVALID_API_KEY',
    });
  } catch (error) {
    console.error('API key optional check error:', error.message);
    return res.status(500).json({ message: 'Authentication error', code: 'SERVER_ERROR' });
  }
}
