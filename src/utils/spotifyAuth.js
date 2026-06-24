// Spotify Authorization Code with PKCE flow — runs entirely client-side, no backend/secret needed.
// Docs: https://developer.spotify.com/documentation/web-api/tutorials/code-pkce-flow

const CLIENT_ID = import.meta.env.VITE_SPOTIFY_CLIENT_ID;
const REDIRECT_URI = import.meta.env.VITE_SPOTIFY_REDIRECT_URI || window.location.origin + window.location.pathname;
const SCOPES = [
  "user-read-currently-playing",
  "user-read-playback-state",
  "user-modify-playback-state",
].join(" ");

const STORAGE_KEYS = {
  verifier: "spotify_pkce_verifier",
  access: "spotify_access_token",
  refresh: "spotify_refresh_token",
  expires: "spotify_token_expires_at",
};

function generateRandomString(length) {
  const possible =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  const values = crypto.getRandomValues(new Uint8Array(length));
  return Array.from(values)
    .map((v) => possible[v % possible.length])
    .join("");
}

async function sha256(plain) {
  const encoder = new TextEncoder();
  const data = encoder.encode(plain);
  return crypto.subtle.digest("SHA-256", data);
}

function base64UrlEncode(buffer) {
  return btoa(String.fromCharCode(...new Uint8Array(buffer)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

export async function redirectToSpotifyLogin() {
  if (!CLIENT_ID) {
    throw new Error(
      "Missing VITE_SPOTIFY_CLIENT_ID — set it in your .env file."
    );
  }

  const verifier = generateRandomString(64);
  const challenge = base64UrlEncode(await sha256(verifier));
  localStorage.setItem(STORAGE_KEYS.verifier, verifier);

  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    response_type: "code",
    redirect_uri: REDIRECT_URI,
    scope: SCOPES,
    code_challenge_method: "S256",
    code_challenge: challenge,
  });

  window.location.href = `https://accounts.spotify.com/authorize?${params.toString()}`;
}

export async function exchangeCodeForToken(code) {
  const verifier = localStorage.getItem(STORAGE_KEYS.verifier);

  const body = new URLSearchParams({
    client_id: CLIENT_ID,
    grant_type: "authorization_code",
    code,
    redirect_uri: REDIRECT_URI,
    code_verifier: verifier,
  });

  const res = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });

  if (!res.ok) {
    throw new Error("Failed to exchange code for token");
  }

  const data = await res.json();
  storeTokens(data);
  return data;
}

async function refreshAccessToken() {
  const refreshToken = localStorage.getItem(STORAGE_KEYS.refresh);
  if (!refreshToken) return null;

  const body = new URLSearchParams({
    client_id: CLIENT_ID,
    grant_type: "refresh_token",
    refresh_token: refreshToken,
  });

  const res = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });

  if (!res.ok) {
    clearTokens();
    return null;
  }

  const data = await res.json();
  storeTokens(data);
  return data.access_token;
}

function storeTokens(data) {
  localStorage.setItem(STORAGE_KEYS.access, data.access_token);
  if (data.refresh_token) {
    localStorage.setItem(STORAGE_KEYS.refresh, data.refresh_token);
  }
  const expiresAt = Date.now() + data.expires_in * 1000;
  localStorage.setItem(STORAGE_KEYS.expires, String(expiresAt));
}

export function clearTokens() {
  Object.values(STORAGE_KEYS).forEach((k) => localStorage.removeItem(k));
}

export function isLoggedIn() {
  return Boolean(localStorage.getItem(STORAGE_KEYS.access));
}

// Returns a valid access token, refreshing it first if it's expired.
export async function getValidAccessToken() {
  const expiresAt = Number(localStorage.getItem(STORAGE_KEYS.expires) || 0);
  const access = localStorage.getItem(STORAGE_KEYS.access);

  if (!access) return null;

  // Refresh a little early (30s buffer) to avoid races.
  if (Date.now() > expiresAt - 30_000) {
    return await refreshAccessToken();
  }

  return access;
}

export { REDIRECT_URI };
