/**
 * TURN credential service — fetches fresh credentials from Metered.ca API.
 * Credentials are cached for 10 hours (they expire after 12h by default).
 * Falls back to Open Relay free public TURN if Metered is not configured.
 */

const STATIC_STUN = [
  { urls: "stun:stun.l.google.com:19302" },
  { urls: "stun:stun1.l.google.com:19302" },
  { urls: "stun:stun2.l.google.com:19302" },
];

const OPEN_RELAY_FALLBACK = [
  ...STATIC_STUN,
  { urls: "stun:openrelay.metered.ca:80" },
  {
    urls: "turn:openrelay.metered.ca:80",
    username: "openrelayproject",
    credential: "openrelayproject",
  },
  {
    urls: "turn:openrelay.metered.ca:443",
    username: "openrelayproject",
    credential: "openrelayproject",
  },
  {
    urls: "turn:openrelay.metered.ca:443?transport=tcp",
    username: "openrelayproject",
    credential: "openrelayproject",
  },
];

// Cache: { iceServers, expiresAt }
let cache = null;
const CACHE_TTL_MS = 10 * 60 * 60 * 1000; // 10 hours

const fetchMeteredCredentials = async () => {
  const apiKey  = process.env.METERED_API_KEY;
  const appName = process.env.METERED_APP_NAME;

  if (!apiKey || !appName) return null;

  try {
    const res = await fetch(
      `https://${appName}.metered.live/api/v1/turn/credentials?apiKey=${apiKey}`
    );
    if (!res.ok) {
      console.warn("⚠️  Metered TURN API returned:", res.status);
      return null;
    }
    const data = await res.json(); // array of { urls, username, credential }
    console.log(`✅ Metered TURN credentials fetched (${data.length} servers)`);
    return [...STATIC_STUN, ...data];
  } catch (err) {
    console.warn("⚠️  Metered TURN fetch failed:", err.message);
    return null;
  }
};

/**
 * Returns { iceServers: [...], provider: "metered" | "fallback" } — always
 * resolves, never throws. Uses cache when fresh, refetches when stale,
 * falls back to Open Relay on error. `provider` lets the client show a
 * subtle notice when running on the less-reliable free relay.
 */
const getIceServers = async () => {
  // Return cache if still fresh
  if (cache && Date.now() < cache.expiresAt) {
    return { iceServers: cache.iceServers, provider: cache.provider };
  }

  const metered = await fetchMeteredCredentials();
  if (metered) {
    cache = { iceServers: metered, provider: "metered", expiresAt: Date.now() + CACHE_TTL_MS };
    return { iceServers: metered, provider: "metered" };
  }

  // Fallback — public Open Relay TURN (no setup needed)
  console.log("ℹ️  Using Open Relay free TURN fallback");
  return { iceServers: OPEN_RELAY_FALLBACK, provider: "fallback" };
};

module.exports = { getIceServers };