
export async function HttpApi(url, body, method, apiKey, token, signal = null) {
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
      ...(signal && { signal }),
    };

    return await fetch(url, options);
  } catch (error) {
    console.error("FETCH_DATA_SERVICE:", error);
    throw error;
  }
}

