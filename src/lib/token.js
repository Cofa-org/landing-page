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
  } catch (error) {
    console.error("TOKEN_DECODE_ERROR:", error);
    return null;
  }
}
