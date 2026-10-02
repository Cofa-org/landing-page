import { decodeJwt } from "jose";

/**
 * Decodes a JWT token without verifying the signature.
 * @param {string} token - The JWT token to decode.
 * @returns {Object|null} The decoded payload or null if invalid.
 */
export function getDecodedToken(token) {
  try {
    if (!token) return null;
    return decodeJwt(token);
  } catch {
    // Silently return null: an invalid/stale token is expected (e.g., previous
    // test sessions, expired tokens, malformed cookies). The caller treats
    // null as "no session" and continues without restoring onboarding state.
    return null;
  }
}

/**
 * Checks if a JWT token has expired based on its 'exp' claim.
 * @param {string} token - The JWT token to check.
 * @returns {boolean} True if the token is expired or invalid, false otherwise.
 */
export function isTokenExpired(token) {
  try {
    const decoded = getDecodedToken(token);
    if (!decoded || !decoded.exp) return true;

    const currentTime = Math.floor(Date.now() / 1000);
    return decoded.exp < currentTime;
  } catch (error) {
    return true;
  }
}
