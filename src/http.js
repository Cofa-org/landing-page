import {
  VITE_COFA_AUTH_API_KEY,
  VITE_COFA_AUTH_EMAIL,
  VITE_COFA_AUTH_PASS,
  VITE_COFA_AUTH_URL,
  VITE_URL_LOCAL,
} from "./config.js";

export async function HttpApi(url, body, method, apiKey, token) {
  try {
    const isFormData = body instanceof FormData;
    const options = {
      headers: {
        ...(apiKey && { "x-api-key": apiKey }),
        ...(token && { Authorization: `Bearer ${token}` }),
        ...(!isFormData && { "Content-Type": "application/json" }),
      },
      method: method,
      ...(body && { body: isFormData ? body : JSON.stringify(body) }),
    };

    return await fetch(url, options);
  } catch (error) {
    console.error("FETCH_DATA_SERVICE:", error);
    throw error;
  }
}

export const cofaAuthLogin = async () => {
  const sessionToken = await validarToken();
  console.log(sessionToken);
  if (sessionToken) {
    return sessionToken;
  }

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

  if (!response.ok) {
    throw new Error("Error al obtener token");
  }

  const { token } = await response.json();

  cookieStore.set("cofa-auth-token", token);

  return token;
};

const validarToken = async () => {
  const cookie = await cookieStore.get("cofa-auth-token");
  const token = cookie?.value;
  if (token === null || token === undefined) {
    return false;
  } else {
    try {
      const result = await HttpApi(
        VITE_COFA_AUTH_URL || VITE_URL_LOCAL + "/validar-token",
        null,
        "GET",
        VITE_COFA_AUTH_API_KEY,
        token
      );
      console.log(await result.json());
      if (result.status === 200) {
        return true;
      } else {
        return null;
      }
    } catch (error) {
      console.error("Token validation error:", error);
      return null;
    }
  }
};
