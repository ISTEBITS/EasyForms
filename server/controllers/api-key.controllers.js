import crypto from 'crypto';
import bcrypt from 'bcrypt';
import Admin from '../models/Admin.js';
import TestUser from '../models/TestUser.js';
import ApiKeyUsage from '../models/ApiKeyUsage.js';
import TestUserActivity from '../models/TestUserActivity.js';

function generateApiKey() {
  const randomHex = crypto.randomBytes(32).toString('hex');
  return `ef_live_${randomHex}`;
}

async function getAccountDoc(req, { lean = false } = {}) {
  if (!req.user || !req.user.sub) return null;

  if (req.user.role === 'test_user') {
    let query = null;
    if (req.user.testUserId) {
      query = TestUser.findById(req.user.testUserId);
    } else if (req.user.email) {
      query = TestUser.findOne({ email: req.user.email });
    } else {
      query = TestUser.findOne({ googleSub: req.user.sub });
    }
    return lean ? query.lean() : query;
  }

  const query = Admin.findOne({ username: req.user.sub });
  return lean ? query.lean() : query;
}

function calculateExpiresAt(expiresInDays) {
  if (expiresInDays === null || expiresInDays === undefined || expiresInDays === 'never' || expiresInDays === 0) {
    return null;
  }
  const days = Number(expiresInDays);
  if (!Number.isFinite(days) || days <= 0) {
    return null;
  }
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000);
}

export async function handleCreateApiKey(req, res) {
  try {
    if (!req.user || !req.user.sub) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    const isTestUser = req.user.role === 'test_user';
    const account = await getAccountDoc(req);

    if (!account) {
      return res.status(404).json({ message: isTestUser ? 'Test user account not found' : 'Admin account not found' });
    }

    // Limit check: Test users can create only 1 API key maximum, Admin can create unlimited
    if (isTestUser && Array.isArray(account.apiKeys) && account.apiKeys.length >= 1) {
      return res.status(400).json({
        message: 'Test users are allowed to create only 1 API key. Revoke your existing key to create a new one.',
      });
    }

    const { name, expiresInDays } = req.body;
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return res.status(400).json({ message: 'Key name is required' });
    }

    const rawKey = generateApiKey();
    const keyHash = await bcrypt.hash(rawKey, 10);
    const expiresAt = calculateExpiresAt(expiresInDays);

    const keyDoc = {
      name: name.trim(),
      keyHash,
      keyPrefix: 'ef_live_',
      scopes: ['read:forms', 'write:responses'],
      lastUsedAt: null,
      expiresAt,
      createdAt: new Date(),
    };

    // Also accept optional scopes from request body
    if (Array.isArray(req.body.scopes) && req.body.scopes.length > 0) {
      const allowedScopes = ['read:forms', 'write:responses', 'write:forms', 'read:responses'];
      const validScopes = req.body.scopes.filter((s) => allowedScopes.includes(s));
      if (validScopes.length > 0) {
        keyDoc.scopes = validScopes;
      }
    }

    if (!account.apiKeys) {
      account.apiKeys = [];
    }

    account.apiKeys.push(keyDoc);
    await account.save();

    const createdEntry = account.apiKeys[account.apiKeys.length - 1];

    // Log Activity Event
    try {
      await TestUserActivity.create({
        testUserId: isTestUser ? account._id : null,
        email: isTestUser ? (account.email || req.user?.email || 'test_user') : (req.user?.sub || 'admin'),
        action: 'api_key.create',
        metadata: { keyName: keyDoc.name, keyPrefix: keyDoc.keyPrefix, expiresAt },
      });
    } catch (actErr) {
      console.error('Failed to log API key create activity:', actErr.message);
    }

    // Return the raw key ONCE
    res.status(201).json({
      id: String(createdEntry._id),
      name: keyDoc.name,
      keyPrefix: keyDoc.keyPrefix,
      apiKey: rawKey,
      scopes: keyDoc.scopes,
      expiresAt: createdEntry.expiresAt || null,
      isExpired: false,
      createdAt: createdEntry.createdAt,
      message: 'Store this key securely. It will not be shown again.',
    });
  } catch (error) {
    console.error('Failed to create API key:', error.message);
    res.status(500).json({ message: 'Failed to create API key' });
  }
}

export async function handleListApiKeys(req, res) {
  try {
    const account = await getAccountDoc(req, { lean: true });
    if (!account) {
      return res.status(404).json({ message: 'Account not found' });
    }

    const keys = (account.apiKeys || []).map((k) => {
      const expiresAt = k.expiresAt ? new Date(k.expiresAt) : null;
      const isExpired = expiresAt ? expiresAt.getTime() <= Date.now() : false;
      return {
        id: String(k._id),
        name: k.name,
        keyPrefix: k.keyPrefix,
        scopes: k.scopes,
        lastUsedAt: k.lastUsedAt,
        expiresAt: k.expiresAt || null,
        isExpired,
        createdAt: k.createdAt,
      };
    });

    res.json(keys);
  } catch (error) {
    console.error('Failed to list API keys:', error.message);
    res.status(500).json({ message: 'Failed to list API keys' });
  }
}

export async function handleRevokeApiKey(req, res) {
  try {
    const keyId = req.params.keyId;
    const isTestUser = req.user?.role === 'test_user';
    const account = await getAccountDoc(req);
    if (!account) {
      return res.status(404).json({ message: 'Account not found' });
    }

    const keyIndex = (account.apiKeys || []).findIndex((k) => String(k._id) === keyId);
    if (keyIndex === -1) {
      return res.status(404).json({ message: 'API key not found' });
    }

    const revokedKey = account.apiKeys[keyIndex];
    account.apiKeys.splice(keyIndex, 1);
    await account.save();

    // Log Activity Event
    try {
      await TestUserActivity.create({
        testUserId: isTestUser ? account._id : null,
        email: isTestUser ? (account.email || req.user?.email || 'test_user') : (req.user?.sub || 'admin'),
        action: 'api_key.revoke',
        metadata: { keyName: revokedKey?.name || 'API Key', keyId },
      });
    } catch (actErr) {
      console.error('Failed to log API key revoke activity:', actErr.message);
    }

    res.json({ message: 'API key revoked successfully' });
  } catch (error) {
    console.error('Failed to revoke API key:', error.message);
    res.status(500).json({ message: 'Failed to revoke API key' });
  }
}

export async function handleGetApiKeyStats(req, res) {
  try {
    const account = await getAccountDoc(req, { lean: true });
    if (!account) {
      return res.status(404).json({ message: 'Account not found' });
    }

    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const keyIds = (account.apiKeys || []).map((k) => String(k._id));

    // Aggregate usage per key
    const usageStats = await ApiKeyUsage.aggregate([
      {
        $match: {
          apiKeyId: { $in: keyIds },
          timestamp: { $gte: thirtyDaysAgo },
        },
      },
      {
        $group: {
          _id: '$apiKeyId',
          totalRequests: { $sum: { $cond: [{ $eq: ['$status', 200] }, 1, 0] } },
          failedAttempts: { $sum: { $cond: [{ $ne: ['$status', 200] }, 1, 0] } },
          endpoints: { $push: '$endpoint' },
          days: { $push: { $dateToString: { format: '%Y-%m-%d', date: '$timestamp' } } },
        },
      },
    ]);

    // Build timeline for last 30 days
    const last30DaysList = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
      last30DaysList.push(d.toISOString().slice(0, 10));
    }

    // Build response
    const statsMap = new Map();
    for (const stat of usageStats) {
      const endpointCounts = {};
      for (const ep of stat.endpoints) {
        endpointCounts[ep] = (endpointCounts[ep] || 0) + 1;
      }
      
      const dayCounts = {};
      for (const dayStr of last30DaysList) {
        dayCounts[dayStr] = 0;
      }
      for (const day of stat.days) {
        if (dayCounts[day] !== undefined) {
          dayCounts[day] += 1;
        } else {
          dayCounts[day] = 1;
        }
      }

      statsMap.set(String(stat._id), {
        totalRequests: stat.totalRequests,
        failedAttempts: stat.failedAttempts,
        requestsByEndpoint: endpointCounts,
        requestsByDay: dayCounts,
      });
    }

    // Merge with key metadata
    const result = (account.apiKeys || []).map((key) => {
      const keyIdStr = String(key._id);
      const defaultDayCounts = {};
      for (const dayStr of last30DaysList) {
        defaultDayCounts[dayStr] = 0;
      }

      const stats = statsMap.get(keyIdStr) || {
        totalRequests: 0,
        failedAttempts: 0,
        requestsByEndpoint: {},
        requestsByDay: defaultDayCounts,
      };

      const expiresAt = key.expiresAt ? new Date(key.expiresAt) : null;
      const isExpired = expiresAt ? expiresAt.getTime() <= Date.now() : false;

      return {
        keyId: keyIdStr,
        name: key.name,
        keyPrefix: key.keyPrefix,
        scopes: key.scopes || [],
        lastUsedAt: key.lastUsedAt,
        expiresAt: key.expiresAt || null,
        isExpired,
        createdAt: key.createdAt,
        ...stats,
      };
    });

    res.json(result);
  } catch (error) {
    console.error('Failed to get API key stats:', error.message);
    res.status(500).json({ message: 'Failed to get API key stats' });
  }
}
