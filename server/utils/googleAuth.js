import { OAuth2Client } from "google-auth-library";

const googleClientId =
  process.env.GOOGLE_CLIENT_ID ||
  process.env.CLIENT_ID ||
  process.env.VITE_CLIENT_ID;

const client = new OAuth2Client(googleClientId);

export async function verifyGoogleIdentity(token) {
  if (!token || typeof token !== "string") return null;

  const rawToken = token.trim();
  if (!rawToken) return null;

  // 1. Try verifying as Google ID Token using OAuth2Client
  try {
    const ticket = await client.verifyIdToken({
      idToken: rawToken,
      audience: googleClientId || undefined,
    });
    const payload = ticket.getPayload();
    if (payload && payload.email) {
      return {
        sub: payload.sub || payload.email,
        email: payload.email,
        name: payload.name || payload.given_name || payload.email.split("@")[0],
        picture: payload.picture || "",
      };
    }
  } catch {
    // Continue to next verification method
  }

  // 2. Try verifying via Google OAuth2 Tokeninfo Endpoint (handles ID Tokens)
  try {
    const res = await fetch(
      `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(rawToken)}`,
    );
    if (res.ok) {
      const data = await res.json();
      if (data && data.email) {
        return {
          sub: data.sub || data.email,
          email: data.email,
          name: data.name || data.given_name || data.email.split("@")[0],
          picture: data.picture || "",
        };
      }
    }
  } catch {
    // Continue to next verification method
  }

  // 3. Try verifying via Google OAuth2 Userinfo Endpoint (handles Access Tokens)
  try {
    const res = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
      headers: { Authorization: `Bearer ${rawToken}` },
    });
    if (res.ok) {
      const data = await res.json();
      if (data && data.email) {
        return {
          sub: data.sub || data.email,
          email: data.email,
          name: data.name || data.given_name || data.email.split("@")[0],
          picture: data.picture || "",
        };
      }
    }
  } catch {
    // Ignore error
  }

  return null;
}

export async function verifyGoogleToken(token) {
  try {
    const identity = await verifyGoogleIdentity(token);
    return identity?.email || null;
  } catch (error) {
    console.error("Token Verification Failed:", error.message);
    return null;
  }
}
