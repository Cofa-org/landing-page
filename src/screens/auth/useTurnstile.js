import { useCallback, useRef, useState } from "react";

export function useTurnstile() {
  const ref = useRef(null);
  const [token, setToken] = useState("");

  const onVerify = useCallback((value) => setToken(value), []);
  const onClear = useCallback(() => setToken(""), []);
  const reset = useCallback(() => {
    ref.current?.reset();
    setToken("");
  }, []);

  return { ref, token, onVerify, onClear, reset };
}
