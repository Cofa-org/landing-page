import { useState } from "react";

export function useAsyncSubmit({ submit }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const run = async (...args) => {
    setError("");
    setLoading(true);
    try {
      return await submit(...args);
    } catch (err) {
      setError(err.message || "Ocurrió un error. Intentá de nuevo.");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { loading, error, setError, run };
}
