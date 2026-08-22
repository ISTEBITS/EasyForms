import crypto from 'crypto';

/**
 * Sign a webhook payload with HMAC-SHA256.
 * Returns the signature header value (Stripe-compatible format).
 */
export function signWebhookPayload(payload, secret) {
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const payloadStr = typeof payload === 'string' ? payload : JSON.stringify(payload);
  const signedPayload = `${timestamp}.${payloadStr}`;
  const signature = crypto
    .createHmac('sha256', secret)
    .update(signedPayload)
    .digest('hex');
  return {
    signature: `t=${timestamp},v1=${signature}`,
    payload: signedPayload,
  };
}

/**
 * Verify a webhook signature (Stripe-compatible format).
 */
export function verifyWebhookSignature(rawBody, signatureHeader, secret) {
  if (!signatureHeader || !secret) {
    throw new Error('Missing signature or secret');
  }

  const parts = {};
  signatureHeader
    .split(',')
    .map((part) => part.split('='))
    .forEach(([key, value]) => {
      parts[key.trim()] = value.trim();
    });

  if (!parts.t || !parts.v1) {
    throw new Error('Invalid signature format');
  }

  const signedPayload = `${parts.t}.${rawBody}`;
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(signedPayload)
    .digest('hex');

  // Constant-time comparison
  if (
    crypto.timingSafeEqual
      ? !crypto.timingSafeEqual(
          Buffer.from(expectedSignature),
          Buffer.from(parts.v1),
        )
      : expectedSignature !== parts.v1
  ) {
    throw new Error('Invalid signature');
  }

  return JSON.parse(rawBody.split('.')[1] || rawBody);
}

/**
 * Dispatch a webhook event asynchronously (fire-and-forget).
 */
export async function dispatchWebhookEvent(webhook, event) {
  try {
    const timestamp = Math.floor(Date.now() / 1000);
    const payload = {
      type: event.type,
      data: event.data,
      timestamp,
    };
    const { signature } = signWebhookPayload(payload, webhook.secret);

    await fetch(webhook.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-easyforms-signature': signature,
      },
      body: JSON.stringify(payload),
      // 5 second timeout to avoid hanging
      signal: AbortSignal.timeout(5000),
    });
  } catch (error) {
    console.error(
      `Webhook dispatch failed for ${webhook.url}:`,
      error.message,
    );
  }
}
