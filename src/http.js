import {
  VITE_COFA_AUTH_API_KEY,
  VITE_COFA_AUTH_EMAIL,
  VITE_COFA_AUTH_PASS,
  VITE_COFA_AUTH_URL,
  VITE_URL_LOCAL,
} from "./config.js";

export async function HttpApi(url, body) {
  try {
    const cofaAuthToken = await cofaAuthLogin();

    const options = {
      headers: {
        "x-api-key": VITE_COFA_AUTH_API_KEY,
        Authorization: `Bearer ${cofaAuthToken}`,
        "Content-Type": "application/json",
      },
      method: "POST",
      body: body,
    };

    return await fetch(url, options);
  } catch (error) {
    console.error("FETCH_DATA_SERVICE:", error);
    throw error;
  }
}

export const cofaAuthLogin = async () => {
  const url = `${VITE_COFA_AUTH_URL || VITE_URL_LOCAL}/auth/get-token`;

  const credentials = {
    email: VITE_COFA_AUTH_EMAIL,
    password: VITE_COFA_AUTH_PASS,
  };

  const options = {
    method: "POST",
    body: JSON.stringify(credentials),
    headers: {
      "x-api-key": VITE_COFA_AUTH_API_KEY,
      "Content-Type": "application/json",
    },
    cache: "no-store",
  };

  const response = await fetch(url, options);

  const { token } = await response.json();

  return token;
};
